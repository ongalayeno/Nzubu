import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import test, { after } from 'node:test';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const apiBase = process.env.TEST_API_BASE || 'http://localhost:3001/v1';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const testUserIds: string[] = [];

after(async () => {
  if (!databaseUrl || !testUserIds.length) return;
  const db = new pg.Pool({ connectionString: databaseUrl });
  try {
    const users = 'SELECT id FROM users WHERE id=ANY($1::uuid[])';
    const listings = `SELECT id FROM listings WHERE partner_id IN (${users})`;
    const bookings = `SELECT id FROM bookings WHERE listing_id IN (${listings})`;
    const param = [testUserIds];
    await db.query(`DELETE FROM audit_log WHERE actor_id IN (${users})`, param);
    await db.query(`DELETE FROM notifications WHERE user_id IN (${users})`, param);
    await db.query(`DELETE FROM tickets WHERE opened_by IN (${users}) OR booking_id IN (${bookings})`, param);
    await db.query(`DELETE FROM invoices WHERE partner_id IN (${users}) OR booking_id IN (${bookings})`, param);
    await db.query(`DELETE FROM lease_applications WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM viewings WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM bookings WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM missions WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM documents WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM listing_videos WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM listings WHERE id IN (${listings})`, param);
    await db.query(`DELETE FROM sessions WHERE user_id IN (${users})`, param);
    await db.query(`DELETE FROM login_codes WHERE user_id IN (${users})`, param);
    await db.query(`DELETE FROM users WHERE id IN (${users})`, param);
  } finally { await db.end(); }
});

test('réservation idempotente et verrou exclusif entre deux clients', { skip: !databaseUrl }, async () => {
  const db = new pg.Pool({ connectionString: databaseUrl });
  const suffix = randomUUID();
  const makeUser = async (role: string) => {
    const user = (await db.query('INSERT INTO users(email,role) VALUES($1,$2) RETURNING id', [`${role.toLowerCase()}-${randomUUID()}@test.local`, role])).rows[0];
    testUserIds.push(user.id);
    const token = randomBytes(32).toString('base64url');
    await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [hash(token), user.id]);
    return { id: user.id as string, cookie: `nzubu_session=${token}` };
  };
  try {
    const partner = await makeUser('PARTNER');
    const first = await makeUser('CLIENT');
    const second = await makeUser('CLIENT');
    const listing = (await db.query(`INSERT INTO listings(partner_id,status,title,commune,rental_mode,price_cdf,verified_until)
      VALUES($1,'PUBLISHED',$2,'Gombe','SHORT_STAY',100000,CURRENT_DATE+90) RETURNING id`, [partner.id, suffix])).rows[0];
    const post = async (path: string, cookie: string, body?: unknown, key?: string) => {
      const response = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', ...(key ? { 'idempotency-key': key } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, body: await response.json() };
    };
    const dates = { listingId: listing.id, checkIn: '2027-02-10', checkOut: '2027-02-15' };
    const a = await post('/bookings', first.cookie, dates, `same-${suffix}`);
    assert.equal(a.status, 201);
    const repeated = await post('/bookings', first.cookie, dates, `same-${suffix}`);
    assert.equal(repeated.status, 201, JSON.stringify(repeated.body));
    assert.equal(repeated.body.booking.id, a.body.booking.id);
    const b = await post('/bookings', second.cookie, dates, `other-${suffix}`);
    assert.equal(b.status, 201);
    const [acceptedA, acceptedB] = await Promise.all([
      post(`/bookings/${a.body.booking.id}/accept`, partner.cookie),
      post(`/bookings/${b.body.booking.id}/accept`, partner.cookie),
    ]);
    assert.deepEqual([acceptedA.status, acceptedB.status].sort(), [200, 409]);
    const winner = acceptedA.status === 200 ? { booking: a.body.booking, client: first } : { booking: b.body.booking, client: second };
    assert.equal((await post(`/bookings/${winner.booking.id}/declare-payment`, winner.client.cookie, { reference: 'TEST-PAID-123' })).status, 200);
    assert.equal((await post(`/bookings/${winner.booking.id}/confirm`, partner.cookie)).status, 200);
    const cancelled = await post(`/bookings/${winner.booking.id}/cancel`, winner.client.cookie);
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.refundDueCdf, 100000);
  } finally {
    await db.end();
  }
});

test('publication refusée avant pièces et rapport, puis autorisée après validation', { skip: !databaseUrl }, async () => {
  const db = new pg.Pool({ connectionString: databaseUrl });
  const makeUser = async (role: string) => {
    const user = (await db.query('INSERT INTO users(email,role) VALUES($1,$2) RETURNING id', [`${randomUUID()}@test.local`, role])).rows[0];
    testUserIds.push(user.id);
    const token = randomBytes(32).toString('base64url');
    await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [hash(token), user.id]);
    return { id: user.id as string, cookie: `nzubu_session=${token}` };
  };
  const call = async (path: string, cookie: string, body?: unknown, key?: string) => {
    const response = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', ...(key ? { 'idempotency-key': key } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  try {
    const partner = await makeUser('PARTNER');
    const agent = await makeUser('FIELD_AGENT');
    const admin = await makeUser('OPERATIONS_ADMIN');
    const outsider = await makeUser('PARTNER');
    const submitted = await call('/listings', partner.cookie, { title: 'Appartement de test contrôlé', commune: 'Gombe', rentalMode: 'SHORT_STAY', priceCdf: 100000 });
    assert.equal(submitted.status, 201);
    const listingId = submitted.body.listing.id;
    assert.equal((await call(`/admin/listings/${listingId}/approve`, admin.cookie)).status, 409);
    let identityDocId = '';
    for (const kind of ['IDENTITY','TITLE','MEDIA_CONSENT']) {
      const upload = await fetch(`${apiBase}/listings/${listingId}/documents`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'application/pdf', 'x-document-kind': kind }, body: '%PDF-1.4\n%test\n' });
      assert.equal(upload.status, 201);
      const doc = (await upload.json()).document;
      if (kind === 'IDENTITY') identityDocId = doc.id;
      assert.equal((await call(`/admin/documents/${doc.id}/approve`, admin.cookie)).status, 200);
    }
    assert.equal((await fetch(`${apiBase}/documents/${identityDocId}`, { headers: { cookie: outsider.cookie } })).status, 403);
    assert.equal((await fetch(`${apiBase}/documents/${identityDocId}`, { headers: { cookie: admin.cookie } })).status, 200);
    const video = await fetch(`${apiBase}/listings/${listingId}/video`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'video/mp4' }, body: new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109]) });
    assert.equal(video.status, 201);
    assert.equal((await call(`/admin/listings/${listingId}/video/approve`, admin.cookie)).status, 200);
    assert.equal((await call(`/admin/listings/${listingId}/documents/approve`, admin.cookie)).status, 200);
    const mission = await call('/admin/missions', admin.cookie, { listingId, agentId: agent.id });
    assert.equal(mission.status, 201);
    const photo = await fetch(`${apiBase}/listings/${listingId}/documents`, { method: 'POST', headers: { cookie: agent.cookie, 'content-type': 'image/jpeg', 'x-document-kind': 'INSPECTION_PHOTO', 'idempotency-key': `photo-${randomUUID()}` }, body: new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,0]) });
    assert.equal(photo.status, 201);
    const photoId = (await photo.json()).document.id;
    const checks = Object.fromEntries(['identityVerified','mandateOrTitleChecked','physicalPresenceConfirmed','waterSupplyTested','electricityTested','roomsMatchedListing','pricingInCdfNoExcessiveDeposit','videoFilmedVerticalNoFaces','safetyEgressChecked'].map((key) => [key,true]));
    const report = await call(`/missions/${mission.body.mission.id}/report`, agent.cookie, { outcome: 'PASS', checks, gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, photoIds: [photoId], notes: 'Contrôle de test.' }, `report-${randomUUID()}`);
    assert.equal(report.status, 200);
    assert.equal((await call(`/admin/listings/${listingId}/approve`, admin.cookie)).status, 200);
  } finally { await db.end(); }
});
