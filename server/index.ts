import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createHash, createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { pool, migrate, transaction } from './db';
import { BrevoError, sendOtp } from './brevo';
import { readPrivate, storePrivate } from './storage';
import { queueNotification, startNotificationWorker } from './notifications';
import { makeLowRendition } from './video';
import { hashPassword, normalizePhone, verifyPassword } from './auth';

type Role = 'CLIENT' | 'PARTNER' | 'FIELD_AGENT' | 'OPERATIONS_ADMIN';
type Actor = { id: string; role: Role; email: string | null; phone: string | null };
type AuthRequest = Request & { actor?: Actor };
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use((req, res, next) => {
  const requestId = randomUUID();
  const started = Date.now();
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => console.info(JSON.stringify({ requestId, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started })));
  next();
});
app.use(express.json({ limit: '256kb' }));

const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
if (process.env.NODE_ENV === 'production' && !process.env.OTP_PEPPER) throw new Error('OTP_PEPPER requis en production');
const otpPepper = process.env.OTP_PEPPER || randomBytes(32).toString('hex');
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== origin) {
    res.status(403).json({ error: 'ORIGIN_FORBIDDEN' }); return;
  }
  next();
});

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const hashOtp = (code: string) => createHmac('sha256', otpPepper).update(code).digest('hex');
async function withinAuthLimit(key: string, limit: number, windowSeconds: number) {
  const row = (await pool.query(`INSERT INTO auth_rate_limits(key,window_start,count) VALUES($1,now(),1)
    ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN auth_rate_limits.window_start<now()-make_interval(secs=>$2) THEN 1 ELSE auth_rate_limits.count+1 END,
      window_start=CASE WHEN auth_rate_limits.window_start<now()-make_interval(secs=>$2) THEN now() ELSE auth_rate_limits.window_start END
    RETURNING count`, [key, windowSeconds])).rows[0];
  return row.count <= limit;
}
const wrap = (handler: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { handler(req as AuthRequest, res).catch(next); };
const requireRole = (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.actor) { res.status(401).json({ error: 'AUTH_REQUIRED' }); return; }
  if (!roles.includes(req.actor.role)) { res.status(403).json({ error: 'ACCESS_DENIED' }); return; }
  next();
};

app.use(async (req: AuthRequest, res, next) => {
  try {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('nzubu_session='))?.slice('nzubu_session='.length);
  if (!token) { next(); return; }
  const result = await pool.query<Actor>(
    `SELECT u.id,u.role,u.email,u.phone FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>now() AND u.closed_at IS NULL`, [sha(token)]);
  req.actor = result.rows[0];
  next();
  } catch (error) { next(error); }
});

app.get('/v1/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

const emailSchema = z.email().transform((value) => value.trim().toLowerCase());
const passwordSchema = z.string().min(10).max(128);
const registrationSchema = z.object({ email: emailSchema, phone: z.string().max(40).optional(), password: passwordSchema });
async function openSession(res: Response, actor: Actor) {
  const token = randomBytes(32).toString('base64url');
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')", [sha(token), actor.id]);
  res.cookie('nzubu_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000, path: '/' });
}

app.post('/v1/auth/register', wrap(async (req, res) => {
  if (!await withinAuthLimit(`register-ip:${sha(req.ip || 'unknown')}`, 30, 900)) {
    res.status(429).json({ error: 'RATE_LIMITED' }); return;
  }
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_REGISTRATION' }); return; }
  const { email, password } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (parsed.data.phone?.trim() && !phone) { res.status(400).json({ error: 'INVALID_PHONE' }); return; }
  if (!await withinAuthLimit(`register-email:${sha(email)}`, 5, 3600)) { res.status(429).json({ error: 'RATE_LIMITED' }); return; }
  const existing = (await pool.query('SELECT password_hash,closed_at FROM users WHERE email=$1', [email])).rows[0];
  if (existing?.closed_at) { res.status(403).json({ error: 'ACCOUNT_CLOSED' }); return; }
  if (existing?.password_hash) { res.status(409).json({ error: 'ACCOUNT_EXISTS' }); return; }
  if (phone && (await pool.query('SELECT 1 FROM users WHERE phone=$1 AND email IS DISTINCT FROM $2', [phone, email])).rowCount) {
    res.status(409).json({ error: 'PHONE_IN_USE' }); return;
  }
  const prior = (await pool.query('SELECT requested_at FROM registration_codes WHERE email=$1', [email])).rows[0];
  if (prior && Date.now() - new Date(prior.requested_at).getTime() < 60_000) { res.status(429).json({ error: 'WAIT_BEFORE_RETRY' }); return; }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const passwordHash = await hashPassword(password);
  await pool.query(`INSERT INTO registration_codes(email,phone,password_hash,code_hash,expires_at,purpose)
    VALUES($1,$2,$3,$4,now()+interval '10 minutes','REGISTER')
    ON CONFLICT(email) DO UPDATE SET phone=$2,password_hash=$3,code_hash=$4,purpose='REGISTER',attempts=0,expires_at=now()+interval '10 minutes',requested_at=now()`,
    [email, phone, passwordHash, hashOtp(code)]);
  try {
    await sendOtp(email, code);
  } catch (error) {
    await pool.query('DELETE FROM registration_codes WHERE email=$1 AND code_hash=$2', [email, hashOtp(code)]);
    throw error;
  }
  res.status(202).json({ sent: true });
}));

app.post('/v1/auth/verify-registration', wrap(async (req, res) => {
  if (!await withinAuthLimit(`verify-ip:${sha(req.ip || 'unknown')}`, 30, 900)) {
    res.status(429).json({ error: 'RATE_LIMITED' }); return;
  }
  const parsed = z.object({ email: emailSchema, code: z.string().regex(/^[0-9]{6}$/) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_CODE' }); return; }
  const { email, code } = parsed.data;
  const actor = await transaction(async (db) => {
    const challenge = (await db.query('SELECT * FROM registration_codes WHERE email=$1 FOR UPDATE', [email])).rows[0];
    if (!challenge || challenge.purpose !== 'REGISTER' || challenge.attempts >= 5 || new Date(challenge.expires_at).getTime() < Date.now()) return null;
    await db.query('UPDATE registration_codes SET attempts=attempts+1 WHERE email=$1', [email]);
    if (challenge.code_hash !== hashOtp(code)) return null;
    const existing = (await db.query('SELECT id,password_hash,closed_at,phone FROM users WHERE email=$1 FOR UPDATE', [email])).rows[0];
    if (existing?.password_hash || existing?.closed_at) return null;
    if (challenge.phone && (await db.query('SELECT 1 FROM users WHERE phone=$1 AND email IS DISTINCT FROM $2', [challenge.phone, email])).rowCount) return null;
    const user = existing
      ? (await db.query('UPDATE users SET password_hash=$2,email_verified_at=now(),phone=COALESCE($3,phone) WHERE id=$1 RETURNING id,role,email,phone', [existing.id, challenge.password_hash, challenge.phone])).rows[0]
      : (await db.query("INSERT INTO users(email,phone,role,password_hash,email_verified_at) VALUES($1,$2,'CLIENT',$3,now()) RETURNING id,role,email,phone", [email, challenge.phone, challenge.password_hash])).rows[0];
    await db.query('DELETE FROM registration_codes WHERE email=$1', [email]);
    await db.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    return user as Actor;
  });
  if (!actor) { res.status(401).json({ error: 'CODE_REJECTED' }); return; }
  await openSession(res, actor);
  res.json({ user: actor });
}));

app.post('/v1/auth/login', wrap(async (req, res) => {
  const parsed = z.object({ identifier: z.string().trim().min(3).max(254), password: z.string().min(1).max(128) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_LOGIN' }); return; }
  const identifier = parsed.data.identifier.includes('@') ? parsed.data.identifier.toLowerCase() : normalizePhone(parsed.data.identifier);
  if (!identifier) { res.status(400).json({ error: 'INVALID_LOGIN' }); return; }
  if (!await withinAuthLimit(`login-ip:${sha(req.ip || 'unknown')}`, 30, 900) ||
      !await withinAuthLimit(`login-id:${sha(identifier)}`, 10, 900)) {
    res.status(429).json({ error: 'RATE_LIMITED' }); return;
  }
  const user = (await pool.query('SELECT id,role,email,phone,password_hash FROM users WHERE closed_at IS NULL AND (email=$1 OR phone=$1)', [identifier])).rows[0];
  if (!user?.password_hash || !await verifyPassword(parsed.data.password, user.password_hash)) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' }); return;
  }
  const { password_hash: _passwordHash, ...actor } = user;
  await openSession(res, actor);
  res.json({ user: actor });
}));

app.post('/v1/auth/request-password-reset', wrap(async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_DESTINATION' }); return; }
  const { email } = parsed.data;
  if (!await withinAuthLimit(`reset-ip:${sha(req.ip || 'unknown')}`, 10, 900) ||
      !await withinAuthLimit(`reset-email:${sha(email)}`, 5, 3600)) { res.status(429).json({ error: 'RATE_LIMITED' }); return; }
  const user = (await pool.query('SELECT id FROM users WHERE email=$1 AND password_hash IS NOT NULL AND closed_at IS NULL', [email])).rows[0];
  if (!user) { res.status(202).json({ sent: true }); return; }
  const prior = (await pool.query('SELECT requested_at FROM registration_codes WHERE email=$1', [email])).rows[0];
  if (prior && Date.now() - new Date(prior.requested_at).getTime() < 60_000) { res.status(429).json({ error: 'WAIT_BEFORE_RETRY' }); return; }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await pool.query(`INSERT INTO registration_codes(email,password_hash,code_hash,expires_at,purpose)
    VALUES($1,'',$2,now()+interval '10 minutes','RESET')
    ON CONFLICT(email) DO UPDATE SET phone=NULL,password_hash='',code_hash=$2,purpose='RESET',attempts=0,expires_at=now()+interval '10 minutes',requested_at=now()`, [email, hashOtp(code)]);
  try { await sendOtp(email, code); }
  catch (error) { await pool.query('DELETE FROM registration_codes WHERE email=$1 AND code_hash=$2', [email, hashOtp(code)]); throw error; }
  res.status(202).json({ sent: true });
}));

app.post('/v1/auth/reset-password', wrap(async (req, res) => {
  if (!await withinAuthLimit(`verify-ip:${sha(req.ip || 'unknown')}`, 30, 900)) { res.status(429).json({ error: 'RATE_LIMITED' }); return; }
  const parsed = z.object({ email: emailSchema, code: z.string().regex(/^[0-9]{6}$/), password: passwordSchema }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_CODE' }); return; }
  const { email, code, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const success = await transaction(async (db) => {
    const challenge = (await db.query('SELECT * FROM registration_codes WHERE email=$1 FOR UPDATE', [email])).rows[0];
    if (!challenge || challenge.purpose !== 'RESET' || challenge.attempts >= 5 || new Date(challenge.expires_at).getTime() < Date.now()) return false;
    await db.query('UPDATE registration_codes SET attempts=attempts+1 WHERE email=$1', [email]);
    if (challenge.code_hash !== hashOtp(code)) return false;
    const user = (await db.query('UPDATE users SET password_hash=$2 WHERE email=$1 AND closed_at IS NULL AND password_hash IS NOT NULL RETURNING id', [email, passwordHash])).rows[0];
    if (!user) return false;
    await db.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    await db.query('DELETE FROM registration_codes WHERE email=$1', [email]);
    return true;
  });
  if (!success) { res.status(401).json({ error: 'CODE_REJECTED' }); return; }
  res.json({ reset: true });
}));

app.get('/v1/me', wrap(async (req, res) => { res.json({ user: req.actor || null }); }));
app.post('/v1/auth/logout', wrap(async (req, res) => {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('nzubu_session='))?.slice('nzubu_session='.length);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [sha(token)]);
  res.clearCookie('nzubu_session', { path: '/' });
  res.status(204).end();
}));

app.post('/v1/me/close', requireRole('CLIENT'), wrap(async (req, res) => {
  const outcome = await transaction(async (db) => {
    const openDispute = (await db.query(`SELECT 1 FROM tickets WHERE opened_by=$1 AND status='OPEN'
      UNION ALL SELECT 1 FROM bookings WHERE client_id=$1 AND status NOT IN ('CANCELLED','COMPLETED')
      UNION ALL SELECT 1 FROM lease_applications WHERE client_id=$1 AND status NOT IN ('CANCELLED','SIGNED_EXTERNALLY') LIMIT 1`, [req.actor!.id])).rowCount! > 0;
    await db.query(`UPDATE users SET closed_at=now(),email=CASE WHEN $2 THEN email ELSE $3 END,
      phone=CASE WHEN $2 THEN phone ELSE NULL END WHERE id=$1`, [req.actor!.id, openDispute, `closed-${req.actor!.id}@invalid.local`]);
    await db.query('DELETE FROM sessions WHERE user_id=$1', [req.actor!.id]);
    await db.query('DELETE FROM login_codes WHERE user_id=$1', [req.actor!.id]);
    if (req.actor!.email) await db.query('DELETE FROM registration_codes WHERE email=$1', [req.actor!.email]);
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$1,$3)', [req.actor!.id, 'ACCOUNT_CLOSED', { restrictedRetention: openDispute }]);
    return { closed: true, restrictedRetention: openDispute };
  });
  res.clearCookie('nzubu_session', { path: '/' });
  res.json(outcome);
}));

app.get('/v1/listings', wrap(async (req, res) => {
  const parsed = z.object({ commune: z.string().max(80).optional(), mode: z.enum(['SHORT_STAY','LONG_TERM']).optional(), furnished: z.enum(['true','false']).optional(), maxPriceCdf: z.coerce.number().int().positive().optional() }).safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_FILTERS' }); return; }
  const { commune, mode, furnished, maxPriceCdf } = parsed.data;
  const result = await pool.query(`SELECT l.id,l.title,l.commune,l.rental_mode,l.price_cdf,l.data,l.verified_until,l.boosted_until, v.status AS video_status,
    m.submitted_at AS verified_at, m.agent_id AS verified_by
    FROM listings l LEFT JOIN listing_videos v ON v.listing_id=l.id LEFT JOIN LATERAL (SELECT submitted_at,agent_id FROM missions WHERE listing_id=l.id AND status='APPROVED' ORDER BY submitted_at DESC LIMIT 1) m ON true
    WHERE l.status='PUBLISHED' AND l.verified_until>=CURRENT_DATE
      AND ($1::text IS NULL OR lower(l.commune)=lower($1)) AND ($2::text IS NULL OR l.rental_mode=$2)
      AND ($3::boolean IS NULL OR (l.data->>'furnished')::boolean=$3)
      AND ($4::bigint IS NULL OR l.price_cdf<=$4)
    ORDER BY (l.boosted_until IS NOT NULL AND l.boosted_until > now()) DESC, l.created_at DESC LIMIT 100`, [commune || null, mode || null, furnished || null, maxPriceCdf || null]);
  res.json({ listings: result.rows });
}));

app.get('/v1/me/favorites', requireRole('CLIENT'), wrap(async (req, res) => {
  const result = await pool.query('SELECT listing_id FROM client_favorites WHERE client_id=$1 ORDER BY created_at DESC', [req.actor!.id]);
  res.json({ listingIds: result.rows.map((row) => row.listing_id) });
}));

app.post('/v1/me/favorites/:id', requireRole('CLIENT'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const listing = await pool.query("SELECT 1 FROM listings WHERE id=$1 AND status='PUBLISHED' AND verified_until>=CURRENT_DATE", [id.data]);
  if (!listing.rowCount) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO client_favorites(client_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.actor!.id, id.data]);
  res.json({ saved: true });
}));

app.delete('/v1/me/favorites/:id', requireRole('CLIENT'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  await pool.query('DELETE FROM client_favorites WHERE client_id=$1 AND listing_id=$2', [req.actor!.id, id.data]);
  res.status(204).end();
}));

app.get('/v1/listings/:id/availability', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const listing = (await pool.query("SELECT 1 FROM listings WHERE id=$1 AND status='PUBLISHED' AND verified_until>=CURRENT_DATE AND rental_mode='SHORT_STAY'", [id.data])).rowCount;
  if (!listing) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  const rows = (await pool.query(`SELECT check_in,check_out,'BOOKING' AS source FROM bookings WHERE listing_id=$1
    AND check_out>=CURRENT_DATE AND (status='CONFIRMED' OR (status IN ('HOST_ACCEPTED_TERMS','PAYMENT_DECLARED') AND hold_expires_at>now()))
    UNION ALL SELECT check_in,check_out,'PARTNER_BLOCK' AS source FROM listing_blocks WHERE listing_id=$1 AND check_out>=CURRENT_DATE
    ORDER BY check_in LIMIT 200`, [id.data])).rows;
  res.json({ unavailable: rows });
}));

app.post('/v1/partner/listings/:id/blocks', requireRole('PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ checkIn: z.iso.date(), checkOut: z.iso.date(), reason: z.string().min(3).max(200) }).safeParse(req.body);
  if (!id.success || !parsed.success || parsed.data.checkOut <= parsed.data.checkIn) { res.status(400).json({ error: 'INVALID_BLOCK' }); return; }
  const block = await transaction(async (db) => {
    const listing = (await db.query("SELECT id FROM listings WHERE id=$1 AND partner_id=$2 AND rental_mode='SHORT_STAY' FOR UPDATE", [id.data, req.actor!.id])).rows[0];
    if (!listing) return null;
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [id.data]);
    const conflict = (await db.query(`SELECT 1 FROM bookings WHERE listing_id=$1 AND check_in<$3 AND check_out>$2
      AND (status='CONFIRMED' OR (status IN ('HOST_ACCEPTED_TERMS','PAYMENT_DECLARED') AND hold_expires_at>now())) LIMIT 1`,
      [id.data, parsed.data.checkIn, parsed.data.checkOut])).rowCount;
    if (conflict) return null;
    return (await db.query('INSERT INTO listing_blocks(listing_id,check_in,check_out,reason,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [id.data, parsed.data.checkIn, parsed.data.checkOut, parsed.data.reason, req.actor!.id])).rows[0];
  });
  if (!block) { res.status(409).json({ error: 'BLOCK_CONFLICT' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'AVAILABILITY_BLOCKED', id.data]);
  res.status(201).json({ block });
}));

app.get('/v1/partner/blocks', requireRole('PARTNER'), wrap(async (req, res) => {
  const blocks = (await pool.query(`SELECT b.id,b.listing_id,b.check_in,b.check_out,b.reason FROM listing_blocks b
    JOIN listings l ON l.id=b.listing_id WHERE l.partner_id=$1 AND b.check_out>=CURRENT_DATE ORDER BY b.check_in LIMIT 200`, [req.actor!.id])).rows;
  res.json({ blocks });
}));

app.delete('/v1/partner/blocks/:id', requireRole('PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const block = (await pool.query('DELETE FROM listing_blocks WHERE id=$1 AND created_by=$2 RETURNING listing_id', [id.data, req.actor!.id])).rows[0];
  if (!block) { res.status(404).json({ error: 'BLOCK_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'AVAILABILITY_UNBLOCKED', block.listing_id]);
  res.status(204).end();
}));

app.get('/v1/admin/listings', requireRole('OPERATIONS_ADMIN'), wrap(async (_req, res) => {
  res.json({ listings: (await pool.query('SELECT l.*,v.status AS video_status,v.duplicate_of FROM listings l LEFT JOIN listing_videos v ON v.listing_id=l.id ORDER BY l.created_at DESC LIMIT 200')).rows });
}));

app.get('/v1/partner/listings', requireRole('PARTNER'), wrap(async (req, res) => {
  res.json({ listings: (await pool.query('SELECT l.*,v.status AS video_status FROM listings l LEFT JOIN listing_videos v ON v.listing_id=l.id WHERE l.partner_id=$1 ORDER BY l.created_at DESC LIMIT 200', [req.actor!.id])).rows });
}));

app.get('/v1/agent/listings', requireRole('FIELD_AGENT'), wrap(async (req, res) => {
  const listings = (await pool.query(`SELECT DISTINCT ON (l.id) l.*,u.email AS partner_email,u.phone AS partner_phone
    FROM listings l JOIN missions m ON m.listing_id=l.id JOIN users u ON u.id=l.partner_id
    WHERE m.agent_id=$1 ORDER BY l.id,l.created_at DESC LIMIT 100`, [req.actor!.id])).rows;
  res.json({ listings });
}));

app.get('/v1/listings/:id/documents', requireRole('PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const listing = (await pool.query('SELECT partner_id FROM listings WHERE id=$1', [id.data])).rows[0];
  if (!listing) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  const assigned = req.actor!.role === 'FIELD_AGENT' && (await pool.query('SELECT 1 FROM missions WHERE listing_id=$1 AND agent_id=$2', [id.data, req.actor!.id])).rowCount;
  if (req.actor!.role !== 'OPERATIONS_ADMIN' && listing.partner_id !== req.actor!.id && !assigned) {
    res.status(403).json({ error: 'ACCESS_DENIED' }); return;
  }
  const visibleUploader = req.actor!.role === 'OPERATIONS_ADMIN' ? null : req.actor!.role === 'PARTNER' ? req.actor!.id : listing.partner_id;
  res.json({ documents: (await pool.query(`SELECT id,kind,approved_at,created_at FROM documents WHERE listing_id=$1
    AND ($2::uuid IS NULL OR uploaded_by=$2 OR ($3::uuid IS NOT NULL AND uploaded_by=$3 AND kind='INSPECTION_PHOTO')) ORDER BY created_at DESC`,
    [id.data, visibleUploader, req.actor!.role === 'FIELD_AGENT' ? req.actor!.id : null])).rows });
}));

const listingSchema = z.object({ title: z.string().min(5).max(150), commune: z.string().min(2).max(80), rentalMode: z.enum(['SHORT_STAY','LONG_TERM']), priceCdf: z.number().int().positive().max(1_000_000_000), description: z.string().max(5000).optional(), furnished: z.boolean().optional(), propertyType: z.string().max(80).optional(), neighborhood: z.string().max(100).optional(), amenities: z.array(z.string().max(60)).max(30).optional(), chargesCdf: z.number().int().nonnegative().optional(), securityDepositMonths: z.number().int().min(0).max(3).optional(), conditions: z.string().max(3000).optional() });
app.post('/v1/listings', requireRole('PARTNER'), wrap(async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_LISTING', issues: parsed.error.issues }); return; }
  const { title, commune, rentalMode, priceCdf, ...data } = parsed.data;
  const listing = (await pool.query(`INSERT INTO listings(partner_id,title,commune,rental_mode,price_cdf,data)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [req.actor!.id, title, commune, rentalMode, priceCdf, data])).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'LISTING_SUBMITTED', listing.id]);
  res.status(201).json({ listing });
}));

app.post('/v1/listings/:id/video', requireRole('PARTNER'), express.raw({ type: 'video/mp4', limit: '50mb' }), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const bytes = req.body as Buffer;
  if (!id.success || !Buffer.isBuffer(bytes) || bytes.length < 12 || bytes.length > 50_000_000 || bytes.subarray(4,8).toString() !== 'ftyp') {
    res.status(400).json({ error: 'INVALID_MP4_VIDEO' }); return;
  }
  const listing = (await pool.query("SELECT id FROM listings WHERE id=$1 AND partner_id=$2 AND status IN ('PENDING_DOCUMENTS','PENDING_INSPECTION')", [id.data, req.actor!.id])).rows[0];
  if (!listing) { res.status(404).json({ error: 'LISTING_NOT_EDITABLE' }); return; }
  const digest = createHash('sha256').update(bytes).digest('hex');
  const duplicate = (await pool.query(`SELECT v.listing_id FROM listing_videos v JOIN listings other ON other.id=v.listing_id
    JOIN listings current ON current.id=$1 WHERE v.sha256=$2 AND v.listing_id<>$1 AND lower(other.commune)=lower(current.commune)
    ORDER BY v.created_at DESC LIMIT 1`, [id.data, digest])).rows[0];
  let rendition: Awaited<ReturnType<typeof makeLowRendition>> | null = null;
  try { rendition = await makeLowRendition(bytes); }
  catch (error) {
    if (process.env.NODE_ENV === 'production' || (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      res.status(400).json({ error: 'VIDEO_PROCESSING_FAILED' }); return;
    }
  }
  const storageKey = randomBytes(24).toString('hex');
  await storePrivate(storageKey, bytes, 'video/mp4');
  const lowStorageKey = rendition ? randomBytes(24).toString('hex') : null;
  const posterStorageKey = rendition ? randomBytes(24).toString('hex') : null;
  const hlsPrefix = rendition ? randomBytes(24).toString('hex') : null;
  if (rendition && lowStorageKey) await storePrivate(lowStorageKey, rendition.low, 'video/mp4');
  if (rendition && posterStorageKey) await storePrivate(posterStorageKey, rendition.poster, 'image/jpeg');
  if (rendition && hlsPrefix) for (const [filename, content] of Object.entries(rendition.hls)) await storePrivate(`${hlsPrefix}/${filename}`, content, filename.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t');
  const video = (await pool.query(`INSERT INTO listing_videos(listing_id,uploaded_by,storage_key,low_storage_key,poster_storage_key,hls_prefix,duration_seconds,width,height,sha256,duplicate_of) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT(listing_id) DO UPDATE SET storage_key=$3,low_storage_key=$4,poster_storage_key=$5,hls_prefix=$6,duration_seconds=$7,width=$8,height=$9,sha256=$10,duplicate_of=$11,status='PENDING_REVIEW',reviewed_by=NULL,reviewed_at=NULL,review_checks=NULL,review_note=NULL
    RETURNING id,status,duration_seconds,width,height,duplicate_of`, [id.data, req.actor!.id, storageKey, lowStorageKey, posterStorageKey, hlsPrefix, rendition?.durationSeconds || null, rendition?.width || null, rendition?.height || null, digest, duplicate?.listing_id || null])).rows[0];
  if (duplicate) await pool.query("INSERT INTO tickets(opened_by,listing_id,category,message,priority) VALUES($1,$2,'POTENTIAL_DUPLICATE',$3,'HIGH')", [req.actor!.id, id.data, `Même média qu'une annonce de la même commune : ${duplicate.listing_id}. Revue humaine requise.`]);
  res.status(201).json({ video });
}));

app.get('/v1/listings/:id/video', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const row = (await pool.query(`SELECT v.storage_key,v.low_storage_key,v.status,l.status AS listing_status,l.verified_until,l.partner_id
    FROM listing_videos v JOIN listings l ON l.id=v.listing_id WHERE l.id=$1`, [id.data])).rows[0];
  if (!row) { res.status(404).end(); return; }
  const publicAllowed = row.status === 'APPROVED' && row.listing_status === 'PUBLISHED' && row.verified_until >= new Date().toISOString().slice(0,10);
  if (!publicAllowed && req.actor?.role !== 'OPERATIONS_ADMIN' && req.actor?.id !== row.partner_id) { res.status(404).end(); return; }
  const bytes = await readPrivate(req.query.quality === 'low' && row.low_storage_key ? row.low_storage_key : row.storage_key);
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', publicAllowed ? 'public, max-age=300' : 'private, no-store');
  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    if (start >= bytes.length || end < start) { res.status(416).setHeader('Content-Range', `bytes */${bytes.length}`).end(); return; }
    res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${bytes.length}`);
    res.setHeader('Content-Length', end-start+1);
    res.end(bytes.subarray(start,end+1));
  } else {
    res.setHeader('Content-Length', bytes.length);
    res.end(bytes);
  }
}));

app.get('/v1/listings/:id/poster', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const row = (await pool.query(`SELECT v.poster_storage_key,v.status,l.status AS listing_status,l.verified_until,l.partner_id
    FROM listing_videos v JOIN listings l ON l.id=v.listing_id WHERE l.id=$1`, [id.data])).rows[0];
  if (!row?.poster_storage_key) { res.status(404).end(); return; }
  const publicAllowed = row.status === 'APPROVED' && row.listing_status === 'PUBLISHED' && row.verified_until >= new Date().toISOString().slice(0,10);
  if (!publicAllowed && req.actor?.role !== 'OPERATIONS_ADMIN' && req.actor?.id !== row.partner_id) { res.status(404).end(); return; }
  res.type('image/jpeg').setHeader('Cache-Control', publicAllowed ? 'public, max-age=300' : 'private, no-store');
  res.end(await readPrivate(row.poster_storage_key));
}));

app.get('/v1/listings/:id/hls/:file', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const filename = req.params.file;
  if (!id.success || !/^(master|low|high)\.m3u8$|^(low|high)\d{3}\.ts$/.test(filename)) { res.status(400).json({ error: 'INVALID_MEDIA_PATH' }); return; }
  const row = (await pool.query(`SELECT v.hls_prefix,v.status,l.status AS listing_status,l.verified_until,l.partner_id
    FROM listing_videos v JOIN listings l ON l.id=v.listing_id WHERE l.id=$1`, [id.data])).rows[0];
  if (!row?.hls_prefix) { res.status(404).end(); return; }
  const publicAllowed = row.status === 'APPROVED' && row.listing_status === 'PUBLISHED' && row.verified_until >= new Date().toISOString().slice(0,10);
  if (!publicAllowed && req.actor?.role !== 'OPERATIONS_ADMIN' && req.actor?.id !== row.partner_id) { res.status(404).end(); return; }
  res.type(filename.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t');
  res.setHeader('Cache-Control', publicAllowed ? 'public, max-age=300' : 'private, no-store');
  res.end(await readPrivate(`${row.hls_prefix}/${filename}`));
}));

app.post('/v1/admin/listings/:id/video/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ checks: z.object({ rightsConfirmed: z.literal(true), noIdentifiablePeople: z.literal(true), matchesListing: z.literal(true), noSensitiveContent: z.literal(true) }), note: z.string().max(2000).optional(), duplicateReviewed: z.boolean().optional() }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'VIDEO_REVIEW_INCOMPLETE' }); return; }
  const candidate = (await pool.query('SELECT duplicate_of FROM listing_videos WHERE listing_id=$1', [id.data])).rows[0];
  if (candidate?.duplicate_of && (!parsed.data.duplicateReviewed || !parsed.data.note?.trim())) { res.status(409).json({ error: 'DUPLICATE_REVIEW_REQUIRED' }); return; }
  const video = (await pool.query(`UPDATE listing_videos SET status='APPROVED',reviewed_by=$2,reviewed_at=now(),review_checks=$3,review_note=$4
    WHERE listing_id=$1 AND status='PENDING_REVIEW' RETURNING id`, [id.data, req.actor!.id, parsed.data.checks, parsed.data.note || null])).rows[0];
  if (!video) { res.status(404).json({ error: 'VIDEO_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'VIDEO_APPROVED', id.data]);
  res.json({ video });
}));

app.post('/v1/listings/:id/documents', requireRole('PARTNER','FIELD_AGENT'),
  express.raw({ type: ['application/pdf','image/jpeg','image/png'], limit: '5mb' }), wrap(async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    const kind = z.enum(['IDENTITY','TITLE','MANDATE','MEDIA_CONSENT','INSPECTION_PHOTO']).safeParse(req.header('x-document-kind'));
    const uploadKey = req.header('idempotency-key');
    const bytes = req.body as Buffer;
    const mime = req.header('content-type');
    if (!id.success || !kind.success || !Buffer.isBuffer(bytes) || bytes.length < 10 || bytes.length > 5_000_000) {
      res.status(400).json({ error: 'INVALID_DOCUMENT' }); return;
    }
    if (kind.data === 'INSPECTION_PHOTO' && (req.actor!.role !== 'FIELD_AGENT' || !mime?.startsWith('image/'))) {
      res.status(403).json({ error: 'ACCESS_DENIED' }); return;
    }
    if (kind.data !== 'INSPECTION_PHOTO' && req.actor!.role !== 'PARTNER') {
      res.status(403).json({ error: 'ACCESS_DENIED' }); return;
    }
    const allowed = req.actor!.role === 'PARTNER'
      ? (await pool.query('SELECT id FROM listings WHERE id=$1 AND partner_id=$2', [id.data, req.actor!.id])).rowCount
      : (await pool.query('SELECT id FROM missions WHERE listing_id=$1 AND agent_id=$2', [id.data, req.actor!.id])).rowCount;
    if (!allowed) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
    if (kind.data === 'INSPECTION_PHOTO' && (!uploadKey || uploadKey.length > 100)) {
      res.status(400).json({ error: 'IDEMPOTENCY_KEY_REQUIRED' }); return;
    }
    if (uploadKey) {
      const prior = (await pool.query('SELECT id,listing_id,kind,created_at FROM documents WHERE uploaded_by=$1 AND upload_key=$2', [req.actor!.id, uploadKey])).rows[0];
      if (prior) {
        if (prior.listing_id !== id.data || prior.kind !== kind.data) { res.status(409).json({ error: 'IDEMPOTENCY_KEY_REUSED' }); return; }
        res.status(200).json({ document: prior }); return;
      }
    }
    const validMagic = mime === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
      : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8;
    if (!validMagic) { res.status(400).json({ error: 'INVALID_FILE_CONTENT' }); return; }
    const storageKey = randomBytes(24).toString('hex');
    await storePrivate(storageKey, bytes, mime || 'application/octet-stream');
    const doc = (await pool.query(`INSERT INTO documents(listing_id,uploaded_by,kind,storage_key,upload_key)
      VALUES($1,$2,$3,$4,$5) RETURNING id,listing_id,kind,created_at`, [id.data, req.actor!.id, kind.data, storageKey, uploadKey || null])).rows[0];
    res.status(201).json({ document: doc });
  }));

app.get('/v1/documents/:id', requireRole('PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const doc = (await pool.query(`SELECT d.*,l.partner_id FROM documents d JOIN listings l ON l.id=d.listing_id WHERE d.id=$1`, [id.data])).rows[0];
  if (!doc) { res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' }); return; }
  const assigned = req.actor!.role === 'FIELD_AGENT' && (await pool.query('SELECT 1 FROM missions WHERE listing_id=$1 AND agent_id=$2', [doc.listing_id, req.actor!.id])).rowCount;
  const allowedDocument = req.actor!.role === 'OPERATIONS_ADMIN'
    || req.actor!.role === 'PARTNER' && doc.partner_id === req.actor!.id && doc.uploaded_by === req.actor!.id
    || req.actor!.role === 'FIELD_AGENT' && assigned && (doc.uploaded_by === doc.partner_id || doc.uploaded_by === req.actor!.id && doc.kind === 'INSPECTION_PHOTO');
  if (!allowedDocument) {
    await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'DOCUMENT_ACCESS_DENIED', id.data]);
    res.status(403).json({ error: 'ACCESS_DENIED' }); return;
  }
  const bytes = await readPrivate(doc.storage_key);
  res.type(bytes.subarray(0,5).toString() === '%PDF-' ? 'application/pdf' : bytes[0] === 0x89 ? 'image/png' : 'image/jpeg');
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(bytes);
}));

app.post('/v1/admin/documents/:id/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const result = await pool.query('UPDATE documents SET approved_at=now(),approved_by=$2 WHERE id=$1 AND approved_at IS NULL RETURNING id,listing_id', [id.data, req.actor!.id]);
  if (!result.rowCount) { res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'DOCUMENT_APPROVED', id.data]);
  res.json({ document: result.rows[0] });
}));

app.post('/v1/admin/missions', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const parsed = z.object({ listingId: z.uuid(), agentId: z.uuid() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_MISSION' }); return; }
  const agent = (await pool.query("SELECT 1 FROM users WHERE id=$1 AND role='FIELD_AGENT'", [parsed.data.agentId])).rowCount;
  const listing = (await pool.query("SELECT 1 FROM listings WHERE id=$1 AND status='PENDING_INSPECTION'", [parsed.data.listingId])).rowCount;
  if (!agent || !listing) { res.status(409).json({ error: 'MISSION_NOT_ASSIGNABLE' }); return; }
  const mission = (await pool.query('INSERT INTO missions(listing_id,agent_id) VALUES($1,$2) RETURNING *', [parsed.data.listingId, parsed.data.agentId])).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'MISSION_ASSIGNED', mission.id]);
  res.status(201).json({ mission });
}));

app.get('/v1/missions', requireRole('FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const query = req.actor!.role === 'OPERATIONS_ADMIN'
    ? await pool.query('SELECT * FROM missions ORDER BY created_at DESC LIMIT 200')
    : await pool.query('SELECT * FROM missions WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 100', [req.actor!.id]);
  res.json({ missions: query.rows });
}));

app.get('/v1/admin/users', requireRole('OPERATIONS_ADMIN'), wrap(async (_req, res) => {
  res.json({ users: (await pool.query("SELECT id,email,phone,role FROM users WHERE role IN ('PARTNER','FIELD_AGENT','OPERATIONS_ADMIN') ORDER BY created_at DESC LIMIT 200")).rows });
}));

const reportChecks = z.object({
  identityVerified: z.boolean(), mandateOrTitleChecked: z.boolean(), physicalPresenceConfirmed: z.boolean(),
  waterSupplyTested: z.boolean(), electricityTested: z.boolean(), roomsMatchedListing: z.boolean(),
  pricingInCdfNoExcessiveDeposit: z.boolean(), videoFilmedVerticalNoFaces: z.boolean(), safetyEgressChecked: z.boolean(),
});
app.post('/v1/missions/:id/report', requireRole('FIELD_AGENT'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const reportKey = req.header('idempotency-key');
  const parsed = z.object({
    outcome: z.enum(['PASS','PASS_WITH_DISCLOSURES','NEEDS_CORRECTION','SAFETY_CONCERN']),
    checks: reportChecks,
    gps: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracyMeters: z.number().positive() }),
    photoIds: z.array(z.uuid()).max(10),
    photoCaptions: z.array(z.string().max(100)).max(10).optional(),
    notes: z.string().max(5000),
    snelMeterNumber: z.string().max(80).optional(),
    snelMeterIndex: z.string().max(80).optional(),
    regidesoPressureBar: z.number().min(0).max(20).optional(),
    outageTracker: z.object({ snelOutage: z.boolean(), regidesoOutage: z.boolean(), reportedAt: z.string().optional() }).optional(),
    agentSignature: z.object({
      agentSignatureDataUrl: z.string().max(200000),
      agentSignedAt: z.string(),
      witnessName: z.string().max(120).optional(),
      witnessRole: z.enum(['OWNER', 'MANDATAIRE', 'SECURITY_GUARD', 'PROPERTY_MANAGER']).optional(),
      witnessSignatureDataUrl: z.string().max(200000).optional(),
      witnessSignedAt: z.string().optional(),
    }).optional(),
    sha256Seal: z.string().max(128).optional(),
    durationMinutes: z.number().int().min(1).max(600).optional(),
  }).safeParse(req.body);
  if (!id.success || !parsed.success || !reportKey || reportKey.length > 100) { res.status(400).json({ error: 'INVALID_REPORT' }); return; }
  if (parsed.data.outcome === 'PASS' && (!Object.values(parsed.data.checks).every(Boolean) || parsed.data.photoIds.length === 0)) {
    res.status(400).json({ error: 'FAVORABLE_REPORT_INCOMPLETE' }); return;
  }
  if (parsed.data.photoCaptions?.length && parsed.data.photoCaptions.length !== parsed.data.photoIds.length) {
    res.status(400).json({ error: 'PHOTO_CAPTIONS_MISMATCH' }); return;
  }
  const mission = (await pool.query('SELECT * FROM missions WHERE id=$1 AND agent_id=$2', [id.data, req.actor!.id])).rows[0];
  if (!mission) { res.status(404).json({ error: 'MISSION_NOT_FOUND' }); return; }
  if (mission.status === 'REPORT_SUBMITTED' && mission.report_key === reportKey) { res.json({ id: id.data, status: 'REPORT_SUBMITTED' }); return; }
  if (!['ASSIGNED','IN_PROGRESS'].includes(mission.status)) { res.status(409).json({ error: 'REPORT_ALREADY_SUBMITTED' }); return; }
  if (parsed.data.photoIds.length) {
    const count = (await pool.query("SELECT count(*)::int AS n FROM documents WHERE id=ANY($1::uuid[]) AND listing_id=$2 AND kind='INSPECTION_PHOTO' AND uploaded_by=$3", [parsed.data.photoIds, mission.listing_id, req.actor!.id])).rows[0].n;
    if (count !== parsed.data.photoIds.length) { res.status(400).json({ error: 'PHOTO_MISMATCH' }); return; }
  }
  const submitted = await transaction(async (db) => {
    const updated = await db.query(
      `UPDATE missions SET status='REPORT_SUBMITTED',outcome=$2,report=$3,report_key=$4,submitted_at=now(),
        snel_meter_number=$5,snel_meter_index=$6,regideso_pressure_bar=$7,outage_tracker=$8,agent_signature=$9,sha256_seal=$10,duration_minutes=$11
        WHERE id=$1 AND status IN ('ASSIGNED','IN_PROGRESS')`,
      [
        id.data, parsed.data.outcome, parsed.data, reportKey,
        parsed.data.snelMeterNumber || null, parsed.data.snelMeterIndex || null,
        parsed.data.regidesoPressureBar ?? null, parsed.data.outageTracker ? JSON.stringify(parsed.data.outageTracker) : null,
        parsed.data.agentSignature ? JSON.stringify(parsed.data.agentSignature) : null,
        parsed.data.sha256Seal || null, parsed.data.durationMinutes ?? null,
      ]
    );
    if (!updated.rowCount) return false;
    await db.query("UPDATE listings SET status=$2,updated_at=now() WHERE id=$1", [mission.listing_id, parsed.data.outcome === 'PASS' ? 'PENDING_APPROVAL' : parsed.data.outcome === 'SAFETY_CONCERN' ? 'SUSPENDED' : 'PENDING_INSPECTION']);
    if (parsed.data.outcome === 'SAFETY_CONCERN') {
      await db.query("INSERT INTO tickets(opened_by,listing_id,category,message,priority) VALUES($1,$2,'FIELD_SAFETY_ALERT',$3,'CRITICAL')",
        [req.actor!.id, mission.listing_id, parsed.data.notes.trim() || 'Alerte de sécurité signalée par l’agent terrain.']);
    }
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'MISSION_REPORTED', id.data, { outcome: parsed.data.outcome }]);
    return true;
  });
  if (!submitted) { res.status(409).json({ error: 'REPORT_ALREADY_SUBMITTED' }); return; }
  res.json({ id: id.data, status: 'REPORT_SUBMITTED' });
}));

app.post('/v1/admin/users', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const parsed = z.object({ email: z.email(), role: z.enum(['PARTNER','FIELD_AGENT','OPERATIONS_ADMIN']) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_USER' }); return; }
  const user = (await pool.query(`INSERT INTO users(email,role) VALUES($1,$2)
    ON CONFLICT(email) DO UPDATE SET role=$2 RETURNING id,email,role`, [parsed.data.email.toLowerCase(), parsed.data.role])).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'USER_ROLE_SET', user.id, { role: user.role }]);
  res.status(201).json({ user });
}));

app.post('/v1/admin/listings/:id/documents/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const result = await pool.query(`UPDATE listings SET status='PENDING_INSPECTION',updated_at=now()
    WHERE id=$1 AND status='PENDING_DOCUMENTS' AND EXISTS (
      SELECT 1 FROM documents WHERE listing_id=$1 AND kind='IDENTITY' AND approved_at IS NOT NULL)
    AND EXISTS (
      SELECT 1 FROM documents WHERE listing_id=$1 AND kind IN ('TITLE','MANDATE') AND approved_at IS NOT NULL)
    AND EXISTS (SELECT 1 FROM documents WHERE listing_id=$1 AND kind='MEDIA_CONSENT' AND approved_at IS NOT NULL)
    RETURNING id`, [id.data]);
  if (!result.rowCount) { res.status(409).json({ error: 'DOCUMENTS_INCOMPLETE' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'DOCUMENTS_APPROVED', id.data]);
  res.json({ id: id.data, status: 'PENDING_INSPECTION' });
}));

app.post('/v1/admin/listings/:id/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const result = await transaction(async (db) => {
    const listing = (await db.query('SELECT * FROM listings WHERE id=$1 FOR UPDATE', [id.data])).rows[0];
    if (!listing || listing.status !== 'PENDING_APPROVAL') return null;
    const mission = (await db.query(`SELECT * FROM missions WHERE listing_id=$1 AND status='REPORT_SUBMITTED'
      AND outcome='PASS' ORDER BY submitted_at DESC LIMIT 1`, [id.data])).rows[0];
    if (!mission || !mission.report?.gps || !mission.report?.photoIds?.length || !mission.report?.checks || !Object.values(mission.report.checks).every(Boolean)) return null;
    const docs = (await db.query('SELECT kind FROM documents WHERE listing_id=$1 AND approved_at IS NOT NULL', [id.data])).rows.map((row) => row.kind);
    if (!docs.includes('IDENTITY') || (!docs.includes('TITLE') && !docs.includes('MANDATE')) || !docs.includes('MEDIA_CONSENT')) return null;
    if (!(await db.query("SELECT 1 FROM listing_videos WHERE listing_id=$1 AND status='APPROVED'", [id.data])).rowCount) return null;
    await db.query(`UPDATE listings SET status='PUBLISHED',verified_until=CURRENT_DATE+90,updated_at=now() WHERE id=$1`, [id.data]);
    await db.query("UPDATE missions SET status='APPROVED' WHERE id=$1", [mission.id]);
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'LISTING_PUBLISHED', id.data]);
    return { id: id.data, status: 'PUBLISHED' };
  });
  if (!result) { res.status(409).json({ error: 'LISTING_NOT_PUBLISHABLE' }); return; }
  res.json(result);
}));

app.post('/v1/admin/listings/:id/suspend', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  await pool.query("UPDATE listings SET status='SUSPENDED',updated_at=now() WHERE id=$1", [id.data]);
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'LISTING_SUSPENDED', id.data]);
  res.json({ id: id.data, status: 'SUSPENDED' });
}));

app.post('/v1/admin/listings/:id/change-partner', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ newPartnerId: z.uuid(), reason: z.string().min(10).max(1000) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_PARTNER_CHANGE' }); return; }
  const changed = await transaction(async (db) => {
    const listing = (await db.query('SELECT partner_id FROM listings WHERE id=$1 FOR UPDATE', [id.data])).rows[0];
    const newPartner = (await db.query("SELECT id FROM users WHERE id=$1 AND role='PARTNER' AND closed_at IS NULL", [parsed.data.newPartnerId])).rows[0];
    if (!listing || !newPartner || listing.partner_id === newPartner.id) return null;
    if ((await db.query("SELECT 1 FROM bookings WHERE listing_id=$1 AND status IN ('REQUESTED','HOST_ACCEPTED_TERMS','PAYMENT_DECLARED','CONFIRMED') LIMIT 1", [id.data])).rowCount) return null;
    if ((await db.query("SELECT 1 FROM lease_applications WHERE listing_id=$1 AND status NOT IN ('SIGNED_EXTERNALLY','CANCELLED') LIMIT 1", [id.data])).rowCount) return null;
    await db.query("UPDATE listings SET partner_id=$2,status='PENDING_DOCUMENTS',verified_until=NULL,updated_at=now() WHERE id=$1", [id.data, newPartner.id]);
    await db.query('UPDATE documents SET approved_at=NULL,approved_by=NULL WHERE listing_id=$1', [id.data]);
    await db.query('UPDATE missions SET agent_id=NULL WHERE listing_id=$1', [id.data]);
    await db.query('DELETE FROM listing_videos WHERE listing_id=$1', [id.data]);
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'LISTING_PARTNER_CHANGED', id.data, { oldPartnerId: listing.partner_id, newPartnerId: newPartner.id, reason: parsed.data.reason }]);
    return { id: id.data, status: 'PENDING_DOCUMENTS', partnerId: newPartner.id };
  });
  if (!changed) { res.status(409).json({ error: 'PARTNER_CHANGE_NOT_ALLOWED' }); return; }
  res.json(changed);
}));

app.post('/v1/admin/listings/:id/reinspect', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ reason: z.string().min(10).max(1000) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_REINSPECTION' }); return; }
  const listing = (await pool.query(`UPDATE listings SET status='PENDING_INSPECTION',verified_until=NULL,updated_at=now()
    WHERE id=$1 AND status='SUSPENDED' AND NOT EXISTS (SELECT 1 FROM tickets WHERE listing_id=$1 AND category='MEDIA_PRIVACY' AND status='OPEN') RETURNING id`, [id.data])).rows[0];
  if (!listing) { res.status(409).json({ error: 'REINSPECTION_BLOCKED' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'LISTING_REINSPECTION_STARTED', id.data, { reason: parsed.data.reason }]);
  res.json({ id: id.data, status: 'PENDING_INSPECTION' });
}));

const bookingSchema = z.object({ listingId: z.uuid(), checkIn: z.iso.date(), checkOut: z.iso.date(), occupants: z.number().int().min(1).max(20), acceptedTerms: z.literal(true) });
app.post('/v1/bookings', requireRole('CLIENT'), wrap(async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  const key = req.header('idempotency-key');
  if (!parsed.success || !key || key.length > 100) { res.status(400).json({ error: 'INVALID_BOOKING' }); return; }
  const { listingId, checkIn, checkOut, occupants } = parsed.data;
  if (checkOut <= checkIn || checkIn < new Date().toISOString().slice(0,10)) { res.status(400).json({ error: 'INVALID_DATES' }); return; }
  const booking = await transaction(async (db) => {
    const prior = (await db.query('SELECT *,check_in::text AS check_in_text,check_out::text AS check_out_text FROM bookings WHERE client_id=$1 AND idempotency_key=$2', [req.actor!.id, key])).rows[0];
    if (prior) return prior.listing_id === listingId && prior.check_in_text === checkIn && prior.check_out_text === checkOut && prior.occupants === occupants ? prior : null;
    const listing = (await db.query(`SELECT * FROM listings WHERE id=$1 AND status='PUBLISHED' AND verified_until>=CURRENT_DATE
      AND rental_mode='SHORT_STAY'`, [listingId])).rows[0];
    if (!listing || !listing.data?.conditions?.trim()) return null;
    if ((await db.query('SELECT 1 FROM listing_blocks WHERE listing_id=$1 AND check_in<$3 AND check_out>$2 LIMIT 1', [listingId, checkIn, checkOut])).rowCount) return null;
    const nights = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
    if (nights < 1 || nights > 90) return null;
    const price = Number(listing.price_cdf) * nights;
    const inserted = (await db.query(`INSERT INTO bookings(listing_id,client_id,check_in,check_out,price_cdf,advance_cdf,idempotency_key,occupants,accepted_terms_at,conditions_snapshot)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,now(),$9) ON CONFLICT(client_id,idempotency_key) DO NOTHING RETURNING *`,
      [listingId, req.actor!.id, checkIn, checkOut, price, Math.round(price * 0.2), key, occupants, String(listing.data?.conditions || '')])).rows[0];
    if (inserted) return inserted;
    const concurrent = (await db.query('SELECT *,check_in::text AS check_in_text,check_out::text AS check_out_text FROM bookings WHERE client_id=$1 AND idempotency_key=$2', [req.actor!.id, key])).rows[0];
    return concurrent?.listing_id === listingId && concurrent.check_in_text === checkIn && concurrent.check_out_text === checkOut && concurrent.occupants === occupants ? concurrent : null;
  });
  if (!booking) { res.status(409).json({ error: 'LISTING_UNAVAILABLE' }); return; }
  res.status(201).json({ booking });
}));

app.get('/v1/bookings', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const query = req.actor!.role === 'CLIENT'
    ? await pool.query('SELECT * FROM bookings WHERE client_id=$1 ORDER BY created_at DESC LIMIT 200', [req.actor!.id])
    : req.actor!.role === 'PARTNER'
      ? await pool.query('SELECT b.*,u.email AS guest_email,u.phone AS guest_phone FROM bookings b JOIN listings l ON l.id=b.listing_id JOIN users u ON u.id=b.client_id WHERE l.partner_id=$1 ORDER BY b.created_at DESC LIMIT 200', [req.actor!.id])
      : await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200');
  res.json({ bookings: query.rows });
}));

app.post('/v1/bookings/:id/cancel', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const result = await transaction(async (db) => {
    const booking = (await db.query(`SELECT b.*,l.partner_id FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.id=$1 FOR UPDATE OF b`, [id.data])).rows[0];
    if (!booking || (req.actor!.role === 'CLIENT' && booking.client_id !== req.actor!.id) || (req.actor!.role === 'PARTNER' && booking.partner_id !== req.actor!.id)) return null;
    if (['CANCELLED','COMPLETED'].includes(booking.status)) return null;
    const hoursUntilArrival = (new Date(booking.check_in).getTime() - Date.now()) / 3600000;
    const fullBefore = Number(booking.cancellation_terms?.fullRefundBeforeHours ?? 72);
    const halfBefore = Number(booking.cancellation_terms?.halfRefundBeforeHours ?? 24);
    const refund = booking.status === 'CONFIRMED'
      ? req.actor!.role !== 'CLIENT' || hoursUntilArrival > fullBefore
        ? Number(booking.advance_cdf)
        : hoursUntilArrival >= halfBefore
          ? Math.round(Number(booking.advance_cdf) * 0.5)
          : 0
      : 0;
    await db.query("UPDATE bookings SET status='CANCELLED',refund_due_cdf=$2,refund_status=$3 WHERE id=$1",
      [id.data, refund, refund > 0 ? 'PENDING_PARTNER' : 'NOT_APPLICABLE']);
    if (booking.status === 'CONFIRMED') {
      const hostCancelled = req.actor!.id === booking.partner_id;
      await db.query('INSERT INTO tickets(opened_by,booking_id,category,message,priority) VALUES($1,$2,$3,$4,$5)', [req.actor!.id, id.data, hostCancelled ? 'HOST_CANCELLED_RELOCATION' : 'CONFIRMED_BOOKING_CANCELLED', `Réservation annulée : relogement et remboursement direct à coordonner. Montant calculé : ${refund} CDF.`, hostCancelled ? 'CRITICAL' : 'HIGH']);
      if (hostCancelled) await db.query("UPDATE listings SET status='SUSPENDED',updated_at=now() WHERE id=$1", [booking.listing_id]);
    }
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'BOOKING_CANCELLED', id.data, { priorStatus: booking.status }]);
    return { id: id.data, status: 'CANCELLED', refundDueCdf: refund };
  });
  if (!result) { res.status(404).json({ error: 'BOOKING_NOT_FOUND' }); return; }
  const client = (await pool.query('SELECT client_id FROM bookings WHERE id=$1', [id.data])).rows[0];
  if (client) await queueNotification(client.client_id, 'Réservation annulée', 'L’équipe NZUBU suit votre dossier et vous contactera pour le remboursement ou une solution de relogement.');
  res.json(result);
}));

app.post('/v1/bookings/:id/refund-confirm', requireRole('PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ reference: z.string().min(3).max(100) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_REFUND_REFERENCE' }); return; }
  const booking = (await pool.query(`UPDATE bookings b SET refund_status='CONFIRMED_BY_PARTNER',refund_reference=$3
    FROM listings l WHERE b.listing_id=l.id AND b.id=$1 AND l.partner_id=$2 AND b.status='CANCELLED'
    AND b.refund_status='PENDING_PARTNER' RETURNING b.*`, [id.data, req.actor!.id, parsed.data.reference])).rows[0];
  if (!booking) { res.status(409).json({ error: 'REFUND_NOT_PENDING' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'REFUND_DECLARED_BY_PARTNER', id.data]);
  await queueNotification(booking.client_id, 'Remboursement déclaré', `L'hôte a déclaré le remboursement direct du dossier ${booking.id}. Vérifiez la réception.`);
  res.json({ booking });
}));

app.post('/v1/bookings/:id/complete', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const result = await transaction(async (db) => {
    const booking = (await db.query(`SELECT b.*,l.partner_id FROM bookings b JOIN listings l ON l.id=b.listing_id
      WHERE b.id=$1 AND b.status='CONFIRMED' AND b.check_out<=CURRENT_DATE FOR UPDATE OF b`, [id.data])).rows[0];
    if (!booking) return null;
    await db.query("UPDATE bookings SET status='COMPLETED' WHERE id=$1", [id.data]);
    const invoice = (await db.query(`INSERT INTO invoices(partner_id,booking_id,amount_cdf) VALUES($1,$2,$3)
      ON CONFLICT(booking_id) DO UPDATE SET amount_cdf=EXCLUDED.amount_cdf RETURNING *`,
      [booking.partner_id, id.data, Math.round(Number(booking.price_cdf) * 0.1)])).rows[0];
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'BOOKING_COMPLETED', id.data]);
    return invoice;
  });
  if (!result) { res.status(409).json({ error: 'BOOKING_NOT_COMPLETABLE' }); return; }
  res.json({ invoice: result });
}));

app.get('/v1/invoices', requireRole('PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const result = req.actor!.role === 'PARTNER'
    ? await pool.query('SELECT * FROM invoices WHERE partner_id=$1 ORDER BY created_at DESC', [req.actor!.id])
    : await pool.query('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 200');
  res.json({ invoices: result.rows });
}));

app.get('/v1/invoices/export.csv', requireRole('PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const query = `SELECT i.id,i.partner_id,i.booking_id,i.amount_cdf,i.status,i.created_at,
    b.check_in,b.check_out FROM invoices i JOIN bookings b ON b.id=i.booking_id`;
  const result = req.actor!.role === 'PARTNER'
    ? await pool.query(`${query} WHERE i.partner_id=$1 ORDER BY i.created_at DESC`, [req.actor!.id])
    : await pool.query(`${query} ORDER BY i.created_at DESC LIMIT 1000`);
  const columns = ['facture_id','partenaire_id','reservation_id','montant_cdf','statut','date_creation','arrivee','depart'];
  const lines = result.rows.map((row) => [row.id,row.partner_id,row.booking_id,row.amount_cdf,row.status,
    new Date(row.created_at).toISOString(),String(row.check_in).slice(0,10),String(row.check_out).slice(0,10)].join(';'));
  res.setHeader('Content-Disposition', 'attachment; filename="nzubu-commissions.csv"');
  res.setHeader('Cache-Control', 'private, no-store');
  res.type('text/csv').send(`\uFEFF${columns.join(';')}\r\n${lines.join('\r\n')}${lines.length ? '\r\n' : ''}`);
}));

app.post('/v1/viewings', requireRole('CLIENT'), wrap(async (req, res) => {
  const parsed = z.object({ listingId: z.uuid(), slots: z.array(z.iso.datetime()).min(1).max(3) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_VIEWING' }); return; }
  const listing = (await pool.query("SELECT id FROM listings WHERE id=$1 AND status='PUBLISHED' AND rental_mode='LONG_TERM' AND verified_until>=CURRENT_DATE", [parsed.data.listingId])).rows[0];
  if (!listing) { res.status(409).json({ error: 'LISTING_UNAVAILABLE' }); return; }
  const viewing = (await pool.query('INSERT INTO viewings(listing_id,client_id,slots) VALUES($1,$2,$3::jsonb) RETURNING *', [listing.id, req.actor!.id, JSON.stringify(parsed.data.slots)])).rows[0];
  res.status(201).json({ viewing });
}));

app.get('/v1/viewings', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const result = req.actor!.role === 'CLIENT'
    ? await pool.query('SELECT * FROM viewings WHERE client_id=$1 ORDER BY created_at DESC', [req.actor!.id])
    : req.actor!.role === 'PARTNER'
      ? await pool.query('SELECT v.* FROM viewings v JOIN listings l ON l.id=v.listing_id WHERE l.partner_id=$1 ORDER BY v.created_at DESC', [req.actor!.id])
      : await pool.query('SELECT * FROM viewings ORDER BY created_at DESC LIMIT 200');
  res.json({ viewings: result.rows });
}));

app.post('/v1/admin/viewings/:id/status', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ status: z.enum(['SCHEDULED','COMPLETED','NO_SHOW','CANCELLED']), scheduledAt: z.iso.datetime().optional(), note: z.string().max(2000).optional() }).safeParse(req.body);
  if (!id.success || !parsed.success || (parsed.data.status === 'SCHEDULED' && !parsed.data.scheduledAt) || (['COMPLETED','NO_SHOW'].includes(parsed.data.status) && !parsed.data.note?.trim())) {
    res.status(400).json({ error: 'INVALID_VIEWING_STATUS' }); return;
  }
  const viewing = await transaction(async (db) => {
    const current = (await db.query('SELECT * FROM viewings WHERE id=$1 FOR UPDATE', [id.data])).rows[0];
    const transitions: Record<string,string[]> = { REQUESTED: ['SCHEDULED','CANCELLED'], SCHEDULED: ['COMPLETED','NO_SHOW','CANCELLED'] };
    if (!current || !transitions[current.status]?.includes(parsed.data.status)) return null;
    const updated = (await db.query(`UPDATE viewings SET status=$2,scheduled_at=COALESCE($3,scheduled_at),
      completed_at=CASE WHEN $2 IN ('COMPLETED','NO_SHOW') THEN now() ELSE completed_at END,
      outcome_note=$4,handled_by=$5 WHERE id=$1 RETURNING *`,
      [id.data, parsed.data.status, parsed.data.scheduledAt || null, parsed.data.note || null, req.actor!.id])).rows[0];
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'VIEWING_STATUS', id.data, { status: parsed.data.status, note: parsed.data.note }]);
    return updated;
  });
  if (!viewing) { res.status(409).json({ error: 'INVALID_STATUS_TRANSITION' }); return; }
  await queueNotification(viewing.client_id, 'Visite mise à jour', `Votre visite est maintenant : ${viewing.status}.`);
  res.json({ viewing });
}));

app.post('/v1/lease-applications', requireRole('CLIENT'), wrap(async (req, res) => {
  const parsed = z.object({ listingId: z.uuid(), message: z.string().min(10).max(3000), viewingId: z.uuid().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_APPLICATION' }); return; }
  const listing = (await pool.query("SELECT id FROM listings WHERE id=$1 AND status='PUBLISHED' AND rental_mode='LONG_TERM' AND verified_until>=CURRENT_DATE", [parsed.data.listingId])).rows[0];
  if (!listing) { res.status(409).json({ error: 'LISTING_UNAVAILABLE' }); return; }
  if (parsed.data.viewingId) {
    const viewing = (await pool.query('SELECT id FROM viewings WHERE id=$1 AND client_id=$2 AND listing_id=$3', [parsed.data.viewingId, req.actor!.id, listing.id])).rows[0];
    if (!viewing) { res.status(403).json({ error: 'VIEWING_ACCESS_DENIED' }); return; }
  }
  const application = (await pool.query(`INSERT INTO lease_applications(listing_id,client_id,viewing_id,message)
    VALUES($1,$2,$3,$4) RETURNING *`, [listing.id, req.actor!.id, parsed.data.viewingId || null, parsed.data.message])).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'LEASE_APPLICATION_SUBMITTED', application.id]);
  res.status(201).json({ application });
}));

app.get('/v1/lease-applications', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const result = req.actor!.role === 'CLIENT'
    ? await pool.query('SELECT * FROM lease_applications WHERE client_id=$1 ORDER BY created_at DESC', [req.actor!.id])
    : req.actor!.role === 'PARTNER'
      ? await pool.query('SELECT a.* FROM lease_applications a JOIN listings l ON l.id=a.listing_id WHERE l.partner_id=$1 ORDER BY a.created_at DESC', [req.actor!.id])
      : await pool.query('SELECT * FROM lease_applications ORDER BY created_at DESC LIMIT 200');
  res.json({ applications: result.rows });
}));

async function caseAccess(type: 'booking' | 'lease', id: string) {
  if (type === 'booking') return (await pool.query(`SELECT b.client_id,l.partner_id FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.id=$1`, [id])).rows[0];
  return (await pool.query(`SELECT a.client_id,l.partner_id FROM lease_applications a JOIN listings l ON l.id=a.listing_id WHERE a.id=$1`, [id])).rows[0];
}

app.get('/v1/evidence/:type/:id', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const type = z.enum(['booking','lease']).safeParse(req.params.type);
  if (!id.success || !type.success) { res.status(400).json({ error: 'INVALID_CASE' }); return; }
  const owner = await caseAccess(type.data, id.data);
  if (!owner || (req.actor!.role !== 'OPERATIONS_ADMIN' && ![owner.client_id,owner.partner_id].includes(req.actor!.id))) { res.status(404).json({ error: 'CASE_NOT_FOUND' }); return; }
  const column = type.data === 'booking' ? 'booking_id' : 'lease_application_id';
  const evidence = (await pool.query(`SELECT id,kind,uploaded_by,reviewed_at,created_at FROM case_evidence WHERE ${column}=$1 ORDER BY created_at`, [id.data])).rows;
  res.json({ evidence });
}));

app.post('/v1/evidence/:type/:id', requireRole('CLIENT','PARTNER'), express.raw({ type: ['application/pdf','image/jpeg','image/png'], limit: '5mb' }), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const type = z.enum(['booking','lease']).safeParse(req.params.type);
  const kind = z.enum(['PAYMENT_RECEIPT','REFUND_RECEIPT','SIGNED_LEASE']).safeParse(req.header('x-evidence-kind'));
  const mime = req.header('content-type');
  const bytes = req.body as Buffer;
  if (!id.success || !type.success || !kind.success || !Buffer.isBuffer(bytes) || bytes.length < 10 || bytes.length > 5_000_000) { res.status(400).json({ error: 'INVALID_EVIDENCE' }); return; }
  const owner = await caseAccess(type.data, id.data);
  if (!owner) { res.status(404).json({ error: 'CASE_NOT_FOUND' }); return; }
  const allowed = type.data === 'booking'
    ? kind.data === 'PAYMENT_RECEIPT' ? req.actor!.id === owner.client_id : kind.data === 'REFUND_RECEIPT' && req.actor!.id === owner.partner_id
    : kind.data === 'SIGNED_LEASE' && req.actor!.id === owner.partner_id;
  if (!allowed) { res.status(403).json({ error: 'ACCESS_DENIED' }); return; }
  const validMagic = mime === 'application/pdf' ? bytes.subarray(0,5).toString() === '%PDF-'
    : mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!validMagic) { res.status(400).json({ error: 'INVALID_FILE_CONTENT' }); return; }
  const storageKey = randomBytes(24).toString('hex');
  await storePrivate(storageKey, bytes, mime!);
  const evidence = (await pool.query(`INSERT INTO case_evidence(booking_id,lease_application_id,kind,storage_key,mime,uploaded_by)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id,kind,created_at`,
    [type.data === 'booking' ? id.data : null, type.data === 'lease' ? id.data : null, kind.data, storageKey, mime, req.actor!.id])).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'CASE_EVIDENCE_UPLOADED', evidence.id, { kind: kind.data }]);
  res.status(201).json({ evidence });
}));

app.get('/v1/evidence-file/:id', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const evidence = (await pool.query('SELECT * FROM case_evidence WHERE id=$1', [id.data])).rows[0];
  if (!evidence) { res.status(404).json({ error: 'EVIDENCE_NOT_FOUND' }); return; }
  const owner = await caseAccess(evidence.booking_id ? 'booking' : 'lease', evidence.booking_id || evidence.lease_application_id);
  if (!owner || (req.actor!.role !== 'OPERATIONS_ADMIN' && ![owner.client_id,owner.partner_id].includes(req.actor!.id))) { res.status(403).json({ error: 'ACCESS_DENIED' }); return; }
  res.type(evidence.mime).setHeader('Cache-Control','private, no-store');
  res.end(await readPrivate(evidence.storage_key));
}));

app.post('/v1/admin/evidence/:id/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const evidence = (await pool.query(`UPDATE case_evidence SET reviewed_at=now(),reviewed_by=$2
    WHERE id=$1 AND reviewed_at IS NULL AND uploaded_by<>$2 RETURNING id,kind`, [id.data, req.actor!.id])).rows[0];
  if (!evidence) { res.status(409).json({ error: 'EVIDENCE_NOT_REVIEWABLE' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'CASE_EVIDENCE_APPROVED', id.data]);
  res.json({ evidence });
}));

app.post('/v1/admin/lease-applications/:id/status', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ status: z.enum(['UNDER_REVIEW','NEGOTIATING','LEASE_PREPARED','SIGNED_EXTERNALLY','CANCELLED']), agreedRentCdf: z.number().int().positive().optional(), signatureReference: z.string().min(5).max(300).optional() }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_APPLICATION_STATUS' }); return; }
  if (parsed.data.status === 'SIGNED_EXTERNALLY' && !parsed.data.signatureReference) { res.status(400).json({ error: 'SIGNATURE_REFERENCE_REQUIRED' }); return; }
  const transitions: Record<string,string[]> = { SUBMITTED: ['UNDER_REVIEW','CANCELLED'], UNDER_REVIEW: ['NEGOTIATING','CANCELLED'], NEGOTIATING: ['LEASE_PREPARED','CANCELLED'], LEASE_PREPARED: ['SIGNED_EXTERNALLY','CANCELLED'] };
  const application = await transaction(async (db) => {
    const current = (await db.query('SELECT * FROM lease_applications WHERE id=$1 FOR UPDATE', [id.data])).rows[0];
    if (!current || !transitions[current.status]?.includes(parsed.data.status)) return null;
    if (parsed.data.status === 'SIGNED_EXTERNALLY' && !(await db.query("SELECT 1 FROM case_evidence WHERE lease_application_id=$1 AND kind='SIGNED_LEASE' AND reviewed_at IS NOT NULL", [id.data])).rowCount) return null;
    const updated = (await db.query(`UPDATE lease_applications SET status=$2,agreed_rent_cdf=COALESCE($3,agreed_rent_cdf),updated_at=now(),
      signed_at=CASE WHEN $2='SIGNED_EXTERNALLY' THEN now() ELSE signed_at END,signature_reference=COALESCE($4,signature_reference)
      WHERE id=$1 RETURNING *`, [id.data, parsed.data.status, parsed.data.agreedRentCdf || null, parsed.data.signatureReference || null])).rows[0];
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'LEASE_APPLICATION_STATUS', id.data, { status: parsed.data.status }]);
    return updated;
  });
  if (!application) { res.status(409).json({ error: 'INVALID_STATUS_TRANSITION' }); return; }
  res.json({ application });
}));

app.post('/v1/bookings/:id/accept', requireRole('PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const booking = await transaction(async (db) => {
    const row = (await db.query(`SELECT b.*,l.partner_id FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.id=$1`, [id.data])).rows[0];
    if (!row || row.partner_id !== req.actor!.id || row.status !== 'REQUESTED') return null;
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [row.listing_id]);
    if ((await db.query('SELECT 1 FROM listing_blocks WHERE listing_id=$1 AND check_in<$3 AND check_out>$2 LIMIT 1', [row.listing_id, row.check_in, row.check_out])).rowCount) return null;
    const conflict = (await db.query(`SELECT 1 FROM bookings WHERE listing_id=$1 AND id<>$2
      AND check_in<$4 AND check_out>$3 AND
      (status='CONFIRMED' OR (status IN ('HOST_ACCEPTED_TERMS','PAYMENT_DECLARED') AND hold_expires_at>now())) LIMIT 1`,
      [row.listing_id, row.id, row.check_in, row.check_out])).rowCount;
    if (conflict) return null;
    return (await db.query(`UPDATE bookings SET status='HOST_ACCEPTED_TERMS',hold_expires_at=now()+interval '30 minutes'
      WHERE id=$1 RETURNING *`, [id.data])).rows[0];
  });
  if (!booking) { res.status(409).json({ error: 'AVAILABILITY_CONFLICT' }); return; }
  await queueNotification(booking.client_id, 'Réservation acceptée', `Votre demande ${booking.id} est acceptée. Le délai de paiement direct est de 30 minutes.`);
  res.json({ booking });
}));

app.post('/v1/bookings/:id/declare-payment', requireRole('CLIENT'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({
    reference: z.string().min(3).max(100),
    paymentMethod: z.enum(['VODACOM_MPESA', 'AIRTEL_MONEY', 'ORANGE_MONEY', 'CASH_AT_CHECKIN', 'MAISHAPAY_CARD']).optional(),
    diasporaCurrency: z.string().max(10).optional(),
    diasporaAmount: z.number().positive().optional(),
  }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_PAYMENT_REFERENCE' }); return; }
  const booking = (await pool.query(`UPDATE bookings SET status='PAYMENT_DECLARED',payment_reference=$3,payment_method=COALESCE($4,payment_method),diaspora_currency=$5,diaspora_amount=$6
    WHERE id=$1 AND client_id=$2 AND status='HOST_ACCEPTED_TERMS' AND hold_expires_at>now() RETURNING *`,
    [id.data, req.actor!.id, parsed.data.reference, parsed.data.paymentMethod || null, parsed.data.diasporaCurrency || null, parsed.data.diasporaAmount ?? null])).rows[0];
  if (!booking) { res.status(409).json({ error: 'HOLD_EXPIRED' }); return; }
  res.json({ booking });
}));

app.post('/v1/bookings/:id/confirm', requireRole('PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const booking = await transaction(async (db) => {
    const row = (await db.query(`SELECT b.*,l.partner_id FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.id=$1`, [id.data])).rows[0];
    if (!row || row.partner_id !== req.actor!.id || row.status !== 'PAYMENT_DECLARED' || new Date(row.hold_expires_at) <= new Date()) return null;
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [row.listing_id]);
    const conflict = (await db.query(`SELECT 1 FROM bookings WHERE listing_id=$1 AND id<>$2 AND status='CONFIRMED'
      AND check_in<$4 AND check_out>$3 LIMIT 1`, [row.listing_id, row.id, row.check_in, row.check_out])).rowCount;
    if (conflict) return null;
    const confirmed = (await db.query("UPDATE bookings SET status='CONFIRMED' WHERE id=$1 RETURNING *", [id.data])).rows[0];
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'BOOKING_CONFIRMED', id.data]);
    return confirmed;
  });
  if (!booking) { res.status(409).json({ error: 'AVAILABILITY_CONFLICT_OR_EXPIRED' }); return; }
  await queueNotification(booking.client_id, 'Réservation confirmée', `Votre séjour ${booking.id} est confirmé par l'hôte.`);
  res.json({ booking });
}));

app.post('/v1/tickets', requireRole('CLIENT','PARTNER','FIELD_AGENT'), wrap(async (req, res) => {
  const parsed = z.object({ category: z.string().min(2).max(50), message: z.string().min(10).max(5000), bookingId: z.uuid().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_TICKET' }); return; }
  if (parsed.data.bookingId) {
    const owned = (await pool.query(`SELECT 1 FROM bookings b JOIN listings l ON l.id=b.listing_id
      WHERE b.id=$1 AND (b.client_id=$2 OR l.partner_id=$2)`, [parsed.data.bookingId, req.actor!.id])).rowCount;
    if (!owned) { res.status(403).json({ error: 'BOOKING_ACCESS_DENIED' }); return; }
  }
  const ticket = (await pool.query('INSERT INTO tickets(opened_by,category,message,booking_id) VALUES($1,$2,$3,$4) RETURNING *',
    [req.actor!.id, parsed.data.category, parsed.data.message, parsed.data.bookingId || null])).rows[0];
  res.status(201).json({ ticket });
}));

app.post('/v1/listings/:id/report-media', requireRole('CLIENT','PARTNER'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ message: z.string().min(10).max(3000) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_REPORT' }); return; }
  const ticket = await transaction(async (db) => {
    const listing = (await db.query("SELECT id FROM listings WHERE id=$1 AND status='PUBLISHED' FOR UPDATE", [id.data])).rows[0];
    if (!listing) return null;
    await db.query("UPDATE listings SET status='SUSPENDED',updated_at=now() WHERE id=$1", [id.data]);
    await db.query("UPDATE listing_videos SET status='REJECTED',reviewed_at=NULL,reviewed_by=NULL WHERE listing_id=$1", [id.data]);
    await db.query("UPDATE documents SET approved_at=NULL,approved_by=NULL WHERE listing_id=$1 AND kind='MEDIA_CONSENT'", [id.data]);
    const created = (await db.query(`INSERT INTO tickets(opened_by,listing_id,category,message,priority)
      VALUES($1,$2,'MEDIA_PRIVACY',$3,'CRITICAL') RETURNING *`, [req.actor!.id, id.data, parsed.data.message])).rows[0];
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'MEDIA_REPORTED_AND_HIDDEN', id.data, { ticketId: created.id }]);
    return created;
  });
  if (!ticket) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  res.status(201).json({ ticket });
}));

app.get('/v1/tickets', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const result = req.actor!.role === 'OPERATIONS_ADMIN'
    ? await pool.query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 200')
    : await pool.query('SELECT * FROM tickets WHERE opened_by=$1 ORDER BY created_at DESC LIMIT 100', [req.actor!.id]);
  res.json({ tickets: result.rows });
}));

app.post('/v1/admin/tickets/:id/resolve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ note: z.string().min(10).max(3000) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'RESOLUTION_NOTE_REQUIRED' }); return; }
  const ticket = (await pool.query("UPDATE tickets SET status='RESOLVED',resolution_note=$2,resolved_at=now(),resolved_by=$3 WHERE id=$1 AND status='OPEN' RETURNING *", [id.data, parsed.data.note, req.actor!.id])).rows[0];
  if (!ticket) { res.status(404).json({ error: 'TICKET_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'TICKET_RESOLVED', id.data]);
  res.json({ ticket });
}));

app.get('/v1/notifications', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  res.json({ notifications: (await pool.query('SELECT id,subject,body,sent_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.actor!.id])).rows });
}));

app.get('/v1/ads', wrap(async (req, res) => {
  const actor = req.actor;
  if (actor?.role === 'OPERATIONS_ADMIN') {
    const rows = (await pool.query('SELECT * FROM sponsored_ads ORDER BY created_at DESC LIMIT 200')).rows;
    res.json({ ads: rows });
    return;
  }
  if (actor?.role === 'PARTNER') {
    const rows = (await pool.query("SELECT * FROM sponsored_ads WHERE advertiser_id=$1 OR (status='ACTIVE' AND expires_at>now()) ORDER BY created_at DESC LIMIT 200", [actor.id])).rows;
    res.json({ ads: rows });
    return;
  }
  const rows = (await pool.query("SELECT * FROM sponsored_ads WHERE status='ACTIVE' AND expires_at>now() ORDER BY created_at DESC LIMIT 100")).rows;
  res.json({ ads: rows });
}));

app.post('/v1/ads', requireRole('PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const parsed = z.object({
    title: z.string().min(3).max(160),
    advertiserName: z.string().min(2).max(120),
    advertiserPhone: z.string().min(5).max(40),
    category: z.enum(['REAL_ESTATE_BOOST','SOLAR_ENERGY','SERVICES_DEMENAGEMENT','DECORATION_FURNITURE','SECURITY_AGENCY','LOCAL_BUSINESS']),
    format: z.enum(['VERTICAL_VIDEO_FEED','CATALOG_BANNER']),
    mediaUrl: z.string().min(5).max(1000),
    thumbnailUrl: z.string().min(5).max(1000),
    tagline: z.string().min(3).max(200),
    description: z.string().min(3).max(2000),
    ctaText: z.string().min(2).max(80),
    ctaActionType: z.enum(['WHATSAPP','PHONE','URL']),
    ctaTarget: z.string().min(3).max(500),
    badgeLabel: z.string().max(40).default('Sponsorisé'),
    pricePaidCdf: z.number().int().min(0),
    durationDays: z.number().int().min(1).max(365),
    featuredListingId: z.string().max(100).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_AD' }); return; }
  const id = `ad-${randomUUID()}`;
  const d = parsed.data;
  const row = (await pool.query(
    `INSERT INTO sponsored_ads(id,advertiser_id,featured_listing_id,title,advertiser_name,advertiser_phone,category,format,media_url,thumbnail_url,tagline,description,cta_text,cta_action_type,cta_target,badge_label,price_paid_cdf,payment_provider,duration_days,starts_at,expires_at,status)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'MAISHAPAY',$18,now(),now()+($18::int * interval '1 day'),'ACTIVE') RETURNING *`,
    [id, req.actor!.id, d.featuredListingId || null, d.title, d.advertiserName, d.advertiserPhone, d.category, d.format, d.mediaUrl, d.thumbnailUrl, d.tagline, d.description, d.ctaText, d.ctaActionType, d.ctaTarget, d.badgeLabel || 'Sponsorisé', d.pricePaidCdf, d.durationDays]
  )).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'SPONSORED_AD_CREATED', id]);
  res.status(201).json({ ad: row });
}));

app.post('/v1/ads/:id/status', requireRole('PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const parsed = z.object({ status: z.enum(['ACTIVE','PAUSED','EXPIRED']) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_STATUS' }); return; }
  const adId = String(req.params.id || '');
  const row = req.actor!.role === 'OPERATIONS_ADMIN'
    ? (await pool.query('UPDATE sponsored_ads SET status=$2 WHERE id=$1 RETURNING *', [adId, parsed.data.status])).rows[0]
    : (await pool.query('UPDATE sponsored_ads SET status=$3 WHERE id=$1 AND advertiser_id=$2 RETURNING *', [adId, req.actor!.id, parsed.data.status])).rows[0];
  if (!row) { res.status(404).json({ error: 'AD_NOT_FOUND' }); return; }
  res.json({ ad: row });
}));

app.post('/v1/ads/:id/impression', wrap(async (req, res) => {
  await pool.query('UPDATE sponsored_ads SET impressions_count=impressions_count+1 WHERE id=$1', [String(req.params.id || '')]);
  res.json({ ok: true });
}));

app.post('/v1/ads/:id/click', wrap(async (req, res) => {
  await pool.query('UPDATE sponsored_ads SET clicks_count=clicks_count+1 WHERE id=$1', [String(req.params.id || '')]);
  res.json({ ok: true });
}));

app.get('/v1/listings/:id/messages', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const listingId = String(req.params.id || '');
  const rows = (await pool.query('SELECT * FROM chat_messages WHERE listing_id=$1 ORDER BY created_at ASC LIMIT 200', [listingId])).rows;
  res.json({ messages: rows });
}));

app.post('/v1/listings/:id/messages', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const listingId = String(req.params.id || '');
  const parsed = z.object({ body: z.string().min(1).max(2000), senderName: z.string().max(120).optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_MESSAGE' }); return; }
  const listing = (await pool.query('SELECT id FROM listings WHERE id=$1', [listingId])).rows[0];
  if (!listing) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  const senderName = parsed.data.senderName || req.actor!.email || req.actor!.phone || req.actor!.role;
  const row = (await pool.query(
    'INSERT INTO chat_messages(listing_id,sender_id,sender_role,sender_name,body) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [listingId, req.actor!.id, req.actor!.role, senderName, parsed.data.body.trim()]
  )).rows[0];
  res.status(201).json({ message: row });
}));

app.get('/v1/inventories', requireRole('PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const rows = req.actor!.role === 'PARTNER'
    ? (await pool.query('SELECT i.* FROM property_inventories i JOIN listings l ON l.id=i.listing_id WHERE l.partner_id=$1 ORDER BY i.created_at DESC LIMIT 100', [req.actor!.id])).rows
    : (await pool.query('SELECT * FROM property_inventories ORDER BY created_at DESC LIMIT 200')).rows;
  res.json({ inventories: rows });
}));

app.post('/v1/inventories', requireRole('PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const parsed = z.object({
    listingId: z.string().min(1).max(100),
    inventoryType: z.enum(['ENTRY','EXIT']),
    tenantName: z.string().min(1).max(150),
    snelIndex: z.string().max(80).optional(),
    regidesoPressure: z.string().max(80).optional(),
    items: z.array(z.any()),
    notes: z.string().max(3000).optional(),
    sha256Seal: z.string().max(128).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_INVENTORY' }); return; }
  const d = parsed.data;
  const row = (await pool.query(
    `INSERT INTO property_inventories(listing_id,created_by,inventory_type,tenant_name,snel_index,regideso_pressure,items,notes,sha256_seal)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [d.listingId, req.actor!.id, d.inventoryType, d.tenantName, d.snelIndex || null, d.regidesoPressure || null, JSON.stringify(d.items), d.notes || null, d.sha256Seal || null]
  )).rows[0];
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'INVENTORY_CREATED', row.id]);
  res.status(201).json({ inventory: row });
}));

app.post('/v1/partner/listings/:id/boost', requireRole('PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const listingId = String(req.params.id || '');
  const parsed = z.object({ days: z.number().int().min(1).max(90).default(7) }).safeParse(req.body || {});
  const days = parsed.success ? parsed.data.days : 7;
  const row = req.actor!.role === 'OPERATIONS_ADMIN'
    ? (await pool.query("UPDATE listings SET boosted_until=now()+($2::int * interval '1 day'),updated_at=now() WHERE id=$1 RETURNING *", [listingId, days])).rows[0]
    : (await pool.query("UPDATE listings SET boosted_until=now()+($3::int * interval '1 day'),updated_at=now() WHERE id=$1 AND partner_id=$2 RETURNING *", [listingId, req.actor!.id, days])).rows[0];
  if (!row) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'LISTING_BOOSTED', listingId]);
  res.json({ listing: row });
}));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  if (error instanceof BrevoError) {
    res.status(503).json({ error: error.status === 401 || error.status === 403 ? 'BREVO_AUTH_FAILED' : 'EMAIL_DELIVERY_UNAVAILABLE' });
    return;
  }
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

const distDirectory = path.resolve('dist');
if (existsSync(path.join(distDirectory, 'index.html'))) {
  app.use(express.static(distDirectory, { index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(distDirectory, 'index.html')));
}

const port = Number(process.env.API_PORT || 3001);
await migrate();
if (process.env.BOOTSTRAP_ADMIN_EMAIL) {
  await pool.query(`INSERT INTO users(email,role) VALUES($1,'OPERATIONS_ADMIN') ON CONFLICT(email) DO NOTHING`, [process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()]);
}
app.listen(port, () => console.info(`NZUBU API: http://localhost:${port}`));
startNotificationWorker();
const cleanupExpired = () => {
  void Promise.all([
    pool.query('DELETE FROM sessions WHERE expires_at<now()'),
    pool.query('DELETE FROM login_codes WHERE expires_at<now()'),
    pool.query('DELETE FROM registration_codes WHERE expires_at<now()'),
    pool.query("DELETE FROM auth_rate_limits WHERE window_start<now()-interval '1 day'"),
  ]).catch((error) => console.error('Expiration cleanup:', error));
};
cleanupExpired();
setInterval(cleanupExpired, 3600_000).unref();
