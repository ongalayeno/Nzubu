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
     WHERE s.token_hash=$1 AND s.expires_at>now()`, [sha(token)]);
  req.actor = result.rows[0];
  next();
  } catch (error) { next(error); }
});

app.get('/v1/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

const identitySchema = z.object({ destination: z.email() });
app.post('/v1/auth/request-code', wrap(async (req, res) => {
  if (!await withinAuthLimit(`otp-ip:${sha(req.ip || 'unknown')}`, 10, 900)) {
    res.status(429).json({ error: 'RATE_LIMITED' }); return;
  }
  const parsed = identitySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_DESTINATION' }); return; }
  const destination = parsed.data.destination.toLowerCase();
  const result = await transaction(async (db) => {
    let user = (await db.query('SELECT id,role FROM users WHERE email=$1 FOR UPDATE', [destination])).rows[0];
    if (!user) user = (await db.query("INSERT INTO users(email,role) VALUES($1,'CLIENT') RETURNING id,role", [destination])).rows[0];
    const prior = (await db.query('SELECT requested_at FROM login_codes WHERE user_id=$1', [user.id])).rows[0];
    if (prior && Date.now() - new Date(prior.requested_at).getTime() < 60_000) return null;
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await db.query(`INSERT INTO login_codes(user_id,code_hash,attempts,expires_at,requested_at)
      VALUES($1,$2,0,now()+interval '10 minutes',now())
      ON CONFLICT(user_id) DO UPDATE SET code_hash=$2,attempts=0,expires_at=now()+interval '10 minutes',requested_at=now()`,
      [user.id, hashOtp(code)]);
    return { code, userId: user.id as string };
  });
  if (!result) { res.status(429).json({ error: 'WAIT_BEFORE_RETRY' }); return; }
  try {
    await sendOtp(destination, result.code);
  } catch (error) {
    await pool.query('DELETE FROM login_codes WHERE user_id=$1 AND code_hash=$2', [result.userId, hashOtp(result.code)]);
    throw error;
  }
  res.status(202).json({ sent: true });
}));

app.post('/v1/auth/verify-code', wrap(async (req, res) => {
  if (!await withinAuthLimit(`verify-ip:${sha(req.ip || 'unknown')}`, 30, 900)) {
    res.status(429).json({ error: 'RATE_LIMITED' }); return;
  }
  const parsed = identitySchema.extend({ code: z.string().regex(/^[0-9]{6}$/) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_CODE' }); return; }
  const { destination, code } = parsed.data;
  const actor = await transaction(async (db) => {
    const user = (await db.query('SELECT id,role,email,phone FROM users WHERE email=$1 FOR UPDATE', [destination.toLowerCase()])).rows[0];
    if (!user) return null;
    const challenge = (await db.query('SELECT * FROM login_codes WHERE user_id=$1 FOR UPDATE', [user.id])).rows[0];
    if (!challenge || challenge.attempts >= 5 || new Date(challenge.expires_at).getTime() < Date.now()) return null;
    await db.query('UPDATE login_codes SET attempts=attempts+1 WHERE user_id=$1', [user.id]);
    if (challenge.code_hash !== hashOtp(code)) return null;
    await db.query('DELETE FROM login_codes WHERE user_id=$1', [user.id]);
    return user as Actor;
  });
  if (!actor) { res.status(401).json({ error: 'CODE_REJECTED' }); return; }
  const token = randomBytes(32).toString('base64url');
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')", [sha(token), actor.id]);
  res.cookie('nzubu_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000, path: '/' });
  res.json({ user: actor });
}));

app.get('/v1/me', wrap(async (req, res) => { res.json({ user: req.actor || null }); }));
app.post('/v1/auth/logout', wrap(async (req, res) => {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('nzubu_session='))?.slice('nzubu_session='.length);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [sha(token)]);
  res.clearCookie('nzubu_session', { path: '/' });
  res.status(204).end();
}));

app.get('/v1/listings', wrap(async (_req, res) => {
  const result = await pool.query(`SELECT id,title,commune,rental_mode,price_cdf,data,verified_until FROM listings
    WHERE status='PUBLISHED' AND verified_until>=CURRENT_DATE ORDER BY created_at DESC LIMIT 100`);
  res.json({ listings: result.rows });
}));

app.get('/v1/listings/:id/availability', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const listing = (await pool.query("SELECT 1 FROM listings WHERE id=$1 AND status='PUBLISHED' AND verified_until>=CURRENT_DATE AND rental_mode='SHORT_STAY'", [id.data])).rowCount;
  if (!listing) { res.status(404).json({ error: 'LISTING_NOT_FOUND' }); return; }
  const rows = (await pool.query(`SELECT check_in,check_out FROM bookings WHERE listing_id=$1
    AND check_out>=CURRENT_DATE AND (status='CONFIRMED' OR (status IN ('HOST_ACCEPTED_TERMS','PAYMENT_DECLARED') AND hold_expires_at>now()))
    ORDER BY check_in LIMIT 200`, [id.data])).rows;
  res.json({ unavailable: rows });
}));

app.get('/v1/admin/listings', requireRole('OPERATIONS_ADMIN'), wrap(async (_req, res) => {
  res.json({ listings: (await pool.query('SELECT l.*,v.status AS video_status FROM listings l LEFT JOIN listing_videos v ON v.listing_id=l.id ORDER BY l.created_at DESC LIMIT 200')).rows });
}));

app.get('/v1/partner/listings', requireRole('PARTNER'), wrap(async (req, res) => {
  res.json({ listings: (await pool.query('SELECT l.*,v.status AS video_status FROM listings l LEFT JOIN listing_videos v ON v.listing_id=l.id WHERE l.partner_id=$1 ORDER BY l.created_at DESC LIMIT 200', [req.actor!.id])).rows });
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
  res.json({ documents: (await pool.query('SELECT id,kind,approved_at,created_at FROM documents WHERE listing_id=$1 ORDER BY created_at DESC', [id.data])).rows });
}));

const listingSchema = z.object({ title: z.string().min(5).max(150), commune: z.string().min(2).max(80), rentalMode: z.enum(['SHORT_STAY','LONG_TERM']), priceCdf: z.number().int().positive().max(1_000_000_000), description: z.string().max(5000).optional() });
app.post('/v1/listings', requireRole('PARTNER'), wrap(async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_LISTING', issues: parsed.error.issues }); return; }
  const { title, commune, rentalMode, priceCdf, description } = parsed.data;
  const listing = (await pool.query(`INSERT INTO listings(partner_id,title,commune,rental_mode,price_cdf,data)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [req.actor!.id, title, commune, rentalMode, priceCdf, { description }])).rows[0];
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
  const storageKey = randomBytes(24).toString('hex');
  await storePrivate(storageKey, bytes, 'video/mp4');
  const video = (await pool.query(`INSERT INTO listing_videos(listing_id,uploaded_by,storage_key) VALUES($1,$2,$3)
    ON CONFLICT(listing_id) DO UPDATE SET storage_key=$3,status='PENDING_REVIEW',reviewed_by=NULL,reviewed_at=NULL
    RETURNING id,status`, [id.data, req.actor!.id, storageKey])).rows[0];
  res.status(201).json({ video });
}));

app.get('/v1/listings/:id/video', wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const row = (await pool.query(`SELECT v.storage_key,v.status,l.status AS listing_status,l.verified_until,l.partner_id
    FROM listing_videos v JOIN listings l ON l.id=v.listing_id WHERE l.id=$1`, [id.data])).rows[0];
  if (!row) { res.status(404).end(); return; }
  const publicAllowed = row.status === 'APPROVED' && row.listing_status === 'PUBLISHED' && row.verified_until >= new Date().toISOString().slice(0,10);
  if (!publicAllowed && req.actor?.role !== 'OPERATIONS_ADMIN' && req.actor?.id !== row.partner_id) { res.status(404).end(); return; }
  const bytes = await readPrivate(row.storage_key);
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

app.post('/v1/admin/listings/:id/video/approve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const video = (await pool.query(`UPDATE listing_videos SET status='APPROVED',reviewed_by=$2,reviewed_at=now()
    WHERE listing_id=$1 AND status='PENDING_REVIEW' RETURNING id`, [id.data, req.actor!.id])).rows[0];
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
  if (req.actor!.role !== 'OPERATIONS_ADMIN' && doc.partner_id !== req.actor!.id && !assigned) {
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
  res.json({ users: (await pool.query("SELECT id,email,phone,role FROM users WHERE role IN ('PARTNER','FIELD_AGENT') ORDER BY created_at DESC LIMIT 200")).rows });
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
    notes: z.string().max(5000),
  }).safeParse(req.body);
  if (!id.success || !parsed.success || !reportKey || reportKey.length > 100) { res.status(400).json({ error: 'INVALID_REPORT' }); return; }
  const mission = (await pool.query('SELECT * FROM missions WHERE id=$1 AND agent_id=$2', [id.data, req.actor!.id])).rows[0];
  if (!mission) { res.status(404).json({ error: 'MISSION_NOT_FOUND' }); return; }
  if (mission.status === 'REPORT_SUBMITTED' && mission.report_key === reportKey) { res.json({ id: id.data, status: 'REPORT_SUBMITTED' }); return; }
  if (!['ASSIGNED','IN_PROGRESS'].includes(mission.status)) { res.status(409).json({ error: 'REPORT_ALREADY_SUBMITTED' }); return; }
  if (parsed.data.photoIds.length) {
    const count = (await pool.query("SELECT count(*)::int AS n FROM documents WHERE id=ANY($1::uuid[]) AND listing_id=$2 AND kind='INSPECTION_PHOTO' AND uploaded_by=$3", [parsed.data.photoIds, mission.listing_id, req.actor!.id])).rows[0].n;
    if (count !== parsed.data.photoIds.length) { res.status(400).json({ error: 'PHOTO_MISMATCH' }); return; }
  }
  const submitted = await transaction(async (db) => {
    const updated = await db.query(`UPDATE missions SET status='REPORT_SUBMITTED',outcome=$2,report=$3,report_key=$4,submitted_at=now() WHERE id=$1 AND status IN ('ASSIGNED','IN_PROGRESS')`, [id.data, parsed.data.outcome, parsed.data, reportKey]);
    if (!updated.rowCount) return false;
    await db.query("UPDATE listings SET status=$2,updated_at=now() WHERE id=$1", [mission.listing_id, parsed.data.outcome === 'PASS' ? 'PENDING_APPROVAL' : parsed.data.outcome === 'SAFETY_CONCERN' ? 'SUSPENDED' : 'PENDING_INSPECTION']);
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

const bookingSchema = z.object({ listingId: z.uuid(), checkIn: z.iso.date(), checkOut: z.iso.date() });
app.post('/v1/bookings', requireRole('CLIENT'), wrap(async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  const key = req.header('idempotency-key');
  if (!parsed.success || !key || key.length > 100) { res.status(400).json({ error: 'INVALID_BOOKING' }); return; }
  const { listingId, checkIn, checkOut } = parsed.data;
  if (checkOut <= checkIn || checkIn < new Date().toISOString().slice(0,10)) { res.status(400).json({ error: 'INVALID_DATES' }); return; }
  const booking = await transaction(async (db) => {
    const prior = (await db.query('SELECT *,check_in::text AS check_in_text,check_out::text AS check_out_text FROM bookings WHERE client_id=$1 AND idempotency_key=$2', [req.actor!.id, key])).rows[0];
    if (prior) return prior.listing_id === listingId && prior.check_in_text === checkIn && prior.check_out_text === checkOut ? prior : null;
    const listing = (await db.query(`SELECT * FROM listings WHERE id=$1 AND status='PUBLISHED' AND verified_until>=CURRENT_DATE
      AND rental_mode='SHORT_STAY'`, [listingId])).rows[0];
    if (!listing) return null;
    const nights = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
    if (nights < 1 || nights > 90) return null;
    const price = Number(listing.price_cdf) * nights;
    const inserted = (await db.query(`INSERT INTO bookings(listing_id,client_id,check_in,check_out,price_cdf,advance_cdf,idempotency_key)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(client_id,idempotency_key) DO NOTHING RETURNING *`,
      [listingId, req.actor!.id, checkIn, checkOut, price, Math.round(price * 0.2), key])).rows[0];
    if (inserted) return inserted;
    const concurrent = (await db.query('SELECT *,check_in::text AS check_in_text,check_out::text AS check_out_text FROM bookings WHERE client_id=$1 AND idempotency_key=$2', [req.actor!.id, key])).rows[0];
    return concurrent?.listing_id === listingId && concurrent.check_in_text === checkIn && concurrent.check_out_text === checkOut ? concurrent : null;
  });
  if (!booking) { res.status(409).json({ error: 'LISTING_UNAVAILABLE' }); return; }
  res.status(201).json({ booking });
}));

app.get('/v1/bookings', requireRole('CLIENT','PARTNER','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const query = req.actor!.role === 'CLIENT'
    ? await pool.query('SELECT * FROM bookings WHERE client_id=$1 ORDER BY created_at DESC LIMIT 200', [req.actor!.id])
    : req.actor!.role === 'PARTNER'
      ? await pool.query('SELECT b.* FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE l.partner_id=$1 ORDER BY b.created_at DESC LIMIT 200', [req.actor!.id])
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
      await db.query('INSERT INTO tickets(opened_by,booking_id,category,message) VALUES($1,$2,$3,$4)', [req.actor!.id, id.data, 'CONFIRMED_BOOKING_CANCELLED', `Réservation annulée : remboursement direct à coordonner avec l'hôte. Montant calculé : ${refund} CDF.`]);
    }
    await db.query('INSERT INTO audit_log(actor_id,action,entity_id,details) VALUES($1,$2,$3,$4)', [req.actor!.id, 'BOOKING_CANCELLED', id.data, { priorStatus: booking.status }]);
    return { id: id.data, status: 'CANCELLED', refundDueCdf: refund };
  });
  if (!result) { res.status(404).json({ error: 'BOOKING_NOT_FOUND' }); return; }
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

app.post('/v1/viewings', requireRole('CLIENT'), wrap(async (req, res) => {
  const parsed = z.object({ listingId: z.uuid(), slots: z.array(z.iso.datetime()).min(1).max(3) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'INVALID_VIEWING' }); return; }
  const listing = (await pool.query("SELECT id FROM listings WHERE id=$1 AND status='PUBLISHED' AND rental_mode='LONG_TERM' AND verified_until>=CURRENT_DATE", [parsed.data.listingId])).rows[0];
  if (!listing) { res.status(409).json({ error: 'LISTING_UNAVAILABLE' }); return; }
  const viewing = (await pool.query('INSERT INTO viewings(listing_id,client_id,slots) VALUES($1,$2,$3) RETURNING *', [listing.id, req.actor!.id, parsed.data.slots])).rows[0];
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

app.post('/v1/admin/lease-applications/:id/status', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const parsed = z.object({ status: z.enum(['UNDER_REVIEW','NEGOTIATING','LEASE_PREPARED','CANCELLED']), agreedRentCdf: z.number().int().positive().optional() }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_APPLICATION_STATUS' }); return; }
  const transitions: Record<string,string[]> = { SUBMITTED: ['UNDER_REVIEW','CANCELLED'], UNDER_REVIEW: ['NEGOTIATING','CANCELLED'], NEGOTIATING: ['LEASE_PREPARED','CANCELLED'], LEASE_PREPARED: ['CANCELLED'] };
  const application = await transaction(async (db) => {
    const current = (await db.query('SELECT * FROM lease_applications WHERE id=$1 FOR UPDATE', [id.data])).rows[0];
    if (!current || !transitions[current.status]?.includes(parsed.data.status)) return null;
    const updated = (await db.query(`UPDATE lease_applications SET status=$2,agreed_rent_cdf=COALESCE($3,agreed_rent_cdf),updated_at=now()
      WHERE id=$1 RETURNING *`, [id.data, parsed.data.status, parsed.data.agreedRentCdf || null])).rows[0];
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
  const parsed = z.object({ reference: z.string().min(3).max(100) }).safeParse(req.body);
  if (!id.success || !parsed.success) { res.status(400).json({ error: 'INVALID_PAYMENT_REFERENCE' }); return; }
  const booking = (await pool.query(`UPDATE bookings SET status='PAYMENT_DECLARED',payment_reference=$3
    WHERE id=$1 AND client_id=$2 AND status='HOST_ACCEPTED_TERMS' AND hold_expires_at>now() RETURNING *`,
    [id.data, req.actor!.id, parsed.data.reference])).rows[0];
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

app.get('/v1/tickets', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const result = req.actor!.role === 'OPERATIONS_ADMIN'
    ? await pool.query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 200')
    : await pool.query('SELECT * FROM tickets WHERE opened_by=$1 ORDER BY created_at DESC LIMIT 100', [req.actor!.id]);
  res.json({ tickets: result.rows });
}));

app.post('/v1/admin/tickets/:id/resolve', requireRole('OPERATIONS_ADMIN'), wrap(async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) { res.status(400).json({ error: 'INVALID_ID' }); return; }
  const ticket = (await pool.query("UPDATE tickets SET status='RESOLVED' WHERE id=$1 AND status='OPEN' RETURNING *", [id.data])).rows[0];
  if (!ticket) { res.status(404).json({ error: 'TICKET_NOT_FOUND' }); return; }
  await pool.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)', [req.actor!.id, 'TICKET_RESOLVED', id.data]);
  res.json({ ticket });
}));

app.get('/v1/notifications', requireRole('CLIENT','PARTNER','FIELD_AGENT','OPERATIONS_ADMIN'), wrap(async (req, res) => {
  res.json({ notifications: (await pool.query('SELECT id,subject,body,sent_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.actor!.id])).rows });
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
    pool.query("DELETE FROM auth_rate_limits WHERE window_start<now()-interval '1 day'"),
  ]).catch((error) => console.error('Expiration cleanup:', error));
};
cleanupExpired();
setInterval(cleanupExpired, 3600_000).unref();
