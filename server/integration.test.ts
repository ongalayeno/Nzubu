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
    await db.query(`DELETE FROM case_evidence WHERE booking_id IN (${bookings}) OR lease_application_id IN (SELECT id FROM lease_applications WHERE listing_id IN (${listings}))`, param);
    await db.query(`DELETE FROM lease_applications WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM viewings WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM bookings WHERE listing_id IN (${listings})`, param);
    await db.query(`DELETE FROM listing_blocks WHERE listing_id IN (${listings})`, param);
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
    const listing = (await db.query(`INSERT INTO listings(partner_id,status,title,commune,rental_mode,price_cdf,verified_until,data)
      VALUES($1,'PUBLISHED',$2,'Gombe','SHORT_STAY',100000,CURRENT_DATE+90,$3) RETURNING id`, [partner.id, suffix, { conditions: 'Conditions fictives de séjour.' }])).rows[0];
    const favoriteUrl = `${apiBase}/me/favorites/${listing.id}`;
    assert.equal((await fetch(favoriteUrl, { method: 'POST', headers: { cookie: first.cookie } })).status, 200);
    assert.deepEqual((await (await fetch(`${apiBase}/me/favorites`, { headers: { cookie: first.cookie } })).json()).listingIds, [listing.id]);
    assert.deepEqual((await (await fetch(`${apiBase}/me/favorites`, { headers: { cookie: second.cookie } })).json()).listingIds, []);
    assert.equal((await fetch(favoriteUrl, { method: 'DELETE', headers: { cookie: first.cookie } })).status, 204);
    assert.deepEqual((await (await fetch(`${apiBase}/me/favorites`, { headers: { cookie: first.cookie } })).json()).listingIds, []);
    const post = async (path: string, cookie: string, body?: unknown, key?: string) => {
      const response = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', ...(key ? { 'idempotency-key': key } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, body: await response.json() };
    };
    const dates = { listingId: listing.id, checkIn: '2027-02-10', checkOut: '2027-02-15', occupants: 2, acceptedTerms: true };
    const a = await post('/bookings', first.cookie, dates, `same-${suffix}`);
    assert.equal(a.status, 201);
    await db.query('UPDATE listings SET price_cdf=120000 WHERE id=$1', [listing.id]);
    assert.equal((await db.query('SELECT price_cdf FROM bookings WHERE id=$1', [a.body.booking.id])).rows[0].price_cdf, '500000');
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
    const phoneAttempt = await fetch(`${apiBase}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: '+243810000000', password: 'TestPassword-123' }) });
    assert.equal(phoneAttempt.status, 400);
    const partner = await makeUser('PARTNER');
    const agent = await makeUser('FIELD_AGENT');
    const admin = await makeUser('OPERATIONS_ADMIN');
    const outsider = await makeUser('PARTNER');
    const adminUsers = await fetch(`${apiBase}/admin/users`, { headers: { cookie: admin.cookie } });
    assert.equal(adminUsers.status, 200);
    assert.ok((await adminUsers.json()).users.some((entry: { id: string; role: string }) => entry.id === admin.id && entry.role === 'OPERATIONS_ADMIN'));
    assert.equal((await call('/listings', partner.cookie, { title: 'Bail avec dépôt invalide', commune: 'Gombe', rentalMode: 'LONG_TERM', priceCdf: 300000, securityDepositMonths: 4 })).status, 400);
    const submitted = await call('/listings', partner.cookie, { title: 'Appartement de test contrôlé', commune: 'Gombe', rentalMode: 'SHORT_STAY', priceCdf: 100000, conditions: 'Conditions fictives de séjour.' });
    assert.equal(submitted.status, 201);
    const listingId = submitted.body.listing.id;
    assert.deepEqual((await (await fetch(`${apiBase}/agent/listings`, { headers: { cookie: agent.cookie } })).json()).listings, []);
    assert.equal((await fetch(`${apiBase}/agent/listings`, { headers: { cookie: outsider.cookie } })).status, 403);
    assert.equal((await fetch(`${apiBase}/partner/blocks`)).status, 401);
    const beforePublication = await fetch(`${apiBase}/listings`);
    assert.ok(!(await beforePublication.json()).listings.some((entry: {id:string}) => entry.id === listingId));
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
    assert.equal(Number((await db.query("SELECT count(*) FROM audit_log WHERE actor_id=$1 AND entity_id=$2 AND action='DOCUMENT_ACCESS_DENIED'", [outsider.id, identityDocId])).rows[0].count), 1);
    assert.equal((await fetch(`${apiBase}/documents/${identityDocId}`, { headers: { cookie: admin.cookie } })).status, 200);
    const video = await fetch(`${apiBase}/listings/${listingId}/video`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'video/mp4' }, body: new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109]) });
    assert.equal(video.status, 201);
    assert.equal((await call(`/admin/listings/${listingId}/video/approve`, admin.cookie)).status, 400);
    assert.equal((await call(`/admin/listings/${listingId}/video/approve`, admin.cookie, { checks: { rightsConfirmed: true, noIdentifiablePeople: true, matchesListing: true, noSensitiveContent: true }, note: 'Média fictif revu.' })).status, 200);
    const duplicateListing = await call('/listings', partner.cookie, { title: 'Doublon fictif de test', commune: 'Gombe', rentalMode: 'SHORT_STAY', priceCdf: 100000, conditions: 'Conditions fictives de séjour.' });
    assert.equal(duplicateListing.status, 201);
    const duplicateVideo = await fetch(`${apiBase}/listings/${duplicateListing.body.listing.id}/video`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'video/mp4' }, body: new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109]) });
    assert.equal(duplicateVideo.status, 201);
    assert.equal((await duplicateVideo.json()).video.duplicate_of, listingId);
    assert.equal((await call(`/admin/listings/${duplicateListing.body.listing.id}/video/approve`, admin.cookie, { checks: { rightsConfirmed: true, noIdentifiablePeople: true, matchesListing: true, noSensitiveContent: true } })).status, 409);
    assert.equal((await call(`/admin/listings/${listingId}/documents/approve`, admin.cookie)).status, 200);
    const mission = await call('/admin/missions', admin.cookie, { listingId, agentId: agent.id });
    assert.equal(mission.status, 201);
    const assignedListings = await fetch(`${apiBase}/agent/listings`, { headers: { cookie: agent.cookie } });
    assert.equal(assignedListings.status, 200);
    assert.ok((await assignedListings.json()).listings.some((entry: {id:string; title:string}) => entry.id === listingId && entry.title === 'Appartement de test contrôlé'));
    const photo = await fetch(`${apiBase}/listings/${listingId}/documents`, { method: 'POST', headers: { cookie: agent.cookie, 'content-type': 'image/jpeg', 'x-document-kind': 'INSPECTION_PHOTO', 'idempotency-key': `photo-${randomUUID()}` }, body: new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,0]) });
    assert.equal(photo.status, 201);
    const photoId = (await photo.json()).document.id;
    const checks = Object.fromEntries(['identityVerified','mandateOrTitleChecked','physicalPresenceConfirmed','waterSupplyTested','electricityTested','roomsMatchedListing','pricingInCdfNoExcessiveDeposit','videoFilmedVerticalNoFaces','safetyEgressChecked'].map((key) => [key,true]));
    assert.equal((await call(`/missions/${mission.body.mission.id}/report`, agent.cookie, { outcome: 'PASS', checks, gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, photoIds: [], notes: 'Sans photo.' }, `incomplete-${randomUUID()}`)).status, 400);
    const report = await call(`/missions/${mission.body.mission.id}/report`, agent.cookie, { outcome: 'PASS', checks, gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, photoIds: [photoId], photoCaptions: ['Compteur SNEL / Disjoncteur'], notes: 'Contrôle de test.' }, `report-${randomUUID()}`);
    assert.equal(report.status, 200);
    assert.deepEqual((await db.query('SELECT report FROM missions WHERE id=$1', [mission.body.mission.id])).rows[0].report.photoCaptions, ['Compteur SNEL / Disjoncteur']);
    const safetyListing = (await db.query(`INSERT INTO listings(partner_id,status,title,commune,rental_mode,price_cdf)
      VALUES($1,'PENDING_INSPECTION','Logement alerte terrain','Gombe','SHORT_STAY',100000) RETURNING id`, [partner.id])).rows[0];
    const safetyMission = await call('/admin/missions', admin.cookie, { listingId: safetyListing.id, agentId: agent.id });
    assert.equal(safetyMission.status, 201);
    assert.equal((await call(`/missions/${safetyMission.body.mission.id}/report`, agent.cookie, { outcome: 'SAFETY_CONCERN', checks: Object.fromEntries(Object.keys(checks).map((key) => [key, false])), gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, photoIds: [], notes: 'Danger électrique observé sur place.' }, `safety-${randomUUID()}`)).status, 200);
    assert.equal((await db.query('SELECT status FROM listings WHERE id=$1', [safetyListing.id])).rows[0].status, 'SUSPENDED');
    assert.equal((await db.query("SELECT priority FROM tickets WHERE listing_id=$1 AND category='FIELD_SAFETY_ALERT'", [safetyListing.id])).rows[0].priority, 'CRITICAL');
    const adminTickets = await fetch(`${apiBase}/tickets`, { headers: { cookie: admin.cookie } });
    assert.ok((await adminTickets.json()).tickets.some((entry: { listing_id: string; priority: string }) => entry.listing_id === safetyListing.id && entry.priority === 'CRITICAL'));
    assert.equal((await call(`/admin/listings/${listingId}/approve`, admin.cookie)).status, 200);
    const publicResponse = await fetch(`${apiBase}/listings?commune=Gombe&mode=SHORT_STAY&maxPriceCdf=100000`);
    assert.equal(publicResponse.status, 200);
    assert.ok((await publicResponse.json()).listings.some((entry: {id:string;verified_at:string}) => entry.id === listingId && entry.verified_at));
    const blocked = await call(`/partner/listings/${listingId}/blocks`, partner.cookie, { checkIn: '2027-03-10', checkOut: '2027-03-12', reason: 'Occupation hors NZUBU' });
    assert.equal(blocked.status, 201);
    assert.equal((await call(`/partner/listings/${listingId}/blocks`, outsider.cookie, { checkIn: '2027-03-20', checkOut: '2027-03-21', reason: 'Tiers' })).status, 409);
    const unavailable = await fetch(`${apiBase}/listings/${listingId}/availability`);
    assert.ok((await unavailable.json()).unavailable.some((entry: {source:string}) => entry.source === 'PARTNER_BLOCK'));
    const partnerBlocks = await fetch(`${apiBase}/partner/blocks`, { headers: { cookie: partner.cookie } });
    assert.ok((await partnerBlocks.json()).blocks.some((entry: {id:string}) => entry.id === blocked.body.block.id));
    const client = await makeUser('CLIENT');
    assert.equal((await call('/bookings', client.cookie, { listingId, checkIn: '2027-03-10', checkOut: '2027-03-11', occupants: 1, acceptedTerms: true }, `blocked-${randomUUID()}`)).status, 409);
    assert.equal((await call('/bookings', client.cookie, { listingId, checkIn: '2027-03-13', checkOut: '2027-03-15', occupants: 1 }, `terms-${randomUUID()}`)).status, 400);
    const openBooking = await call('/bookings', client.cookie, { listingId, checkIn: '2027-03-13', checkOut: '2027-03-15', occupants: 1, acceptedTerms: true }, `open-${randomUUID()}`);
    assert.equal(openBooking.status, 201);
    assert.equal(openBooking.body.booking.conditions_snapshot, 'Conditions fictives de séjour.');
    assert.ok(openBooking.body.booking.accepted_terms_at);
    assert.equal((await call(`/bookings/${openBooking.body.booking.id}/accept`, partner.cookie)).status, 200);
    assert.equal((await call(`/bookings/${openBooking.body.booking.id}/declare-payment`, client.cookie, { reference: 'TEST-DIRECT-123' })).status, 200);
    assert.equal((await call(`/bookings/${openBooking.body.booking.id}/confirm`, partner.cookie)).status, 200);
    await db.query("UPDATE bookings SET check_in=CURRENT_DATE-3,check_out=CURRENT_DATE-1 WHERE id=$1", [openBooking.body.booking.id]);
    assert.equal((await call(`/bookings/${openBooking.body.booking.id}/complete`, admin.cookie)).status, 200);
    const invoice = (await db.query('SELECT amount_cdf FROM invoices WHERE booking_id=$1', [openBooking.body.booking.id])).rows[0];
    assert.equal(Number(invoice.amount_cdf), 20000);
    const exportPartner = await fetch(`${apiBase}/invoices/export.csv`, { headers: { cookie: partner.cookie } });
    assert.equal(exportPartner.status, 200);
    assert.match(exportPartner.headers.get('content-type') || '', /text\/csv/);
    const partnerCsv = await exportPartner.text();
    assert.ok(partnerCsv.includes(openBooking.body.booking.id));
    assert.ok(partnerCsv.includes('20000'));
    const exportOtherPartner = await fetch(`${apiBase}/invoices/export.csv`, { headers: { cookie: outsider.cookie } });
    assert.equal(exportOtherPartner.status, 200);
    assert.ok(!(await exportOtherPartner.text()).includes(openBooking.body.booking.id));
    assert.equal((await fetch(`${apiBase}/invoices/export.csv`, { headers: { cookie: client.cookie } })).status, 403);
    const cancelledBooking = await call('/bookings', client.cookie, { listingId, checkIn: '2027-05-13', checkOut: '2027-05-15', occupants: 1, acceptedTerms: true }, `host-cancel-${randomUUID()}`);
    assert.equal(cancelledBooking.status, 201);
    assert.equal((await call(`/bookings/${cancelledBooking.body.booking.id}/accept`, partner.cookie)).status, 200);
    assert.equal((await call(`/bookings/${cancelledBooking.body.booking.id}/declare-payment`, client.cookie, { reference: 'TEST-DIRECT-456' })).status, 200);
    assert.equal((await call(`/bookings/${cancelledBooking.body.booking.id}/confirm`, partner.cookie)).status, 200);
    assert.equal((await call(`/bookings/${cancelledBooking.body.booking.id}/cancel`, partner.cookie)).status, 200);
    assert.equal((await db.query('SELECT status FROM listings WHERE id=$1', [listingId])).rows[0].status, 'SUSPENDED');
    assert.ok(!(await (await fetch(`${apiBase}/listings`)).json()).listings.some((entry: {id:string}) => entry.id === listingId));
    assert.equal((await db.query("SELECT priority FROM tickets WHERE booking_id=$1 AND category='HOST_CANCELLED_RELOCATION'", [cancelledBooking.body.booking.id])).rows[0].priority, 'CRITICAL');
    const transfer = await call(`/admin/listings/${listingId}/change-partner`, admin.cookie, { newPartnerId: outsider.id, reason: 'Mandat fictif transféré pour la recette.' });
    assert.equal(transfer.status, 200);
    assert.equal((await db.query('SELECT status,partner_id FROM listings WHERE id=$1', [listingId])).rows[0].status, 'PENDING_DOCUMENTS');
    assert.equal((await fetch(`${apiBase}/listings/${listingId}/documents`, { headers: { cookie: partner.cookie } })).status, 403);
    assert.equal((await fetch(`${apiBase}/listings/${listingId}/documents`, { headers: { cookie: agent.cookie } })).status, 403);
    assert.deepEqual((await (await fetch(`${apiBase}/listings/${listingId}/documents`, { headers: { cookie: outsider.cookie } })).json()).documents, []);
    assert.equal((await fetch(`${apiBase}/documents/${identityDocId}`, { headers: { cookie: outsider.cookie } })).status, 403);

    const longTerm = (await db.query(`INSERT INTO listings(partner_id,status,title,commune,rental_mode,price_cdf,verified_until)
      VALUES($1,'PUBLISHED','Bail fictif Gombe','Gombe','LONG_TERM',300000,CURRENT_DATE+90) RETURNING id`, [partner.id])).rows[0];
    const viewing = await call('/viewings', client.cookie, { listingId: longTerm.id, slots: ['2027-04-10T10:00:00.000Z'] });
    assert.equal(viewing.status, 201);
    assert.equal((await call(`/admin/viewings/${viewing.body.viewing.id}/status`, admin.cookie, { status: 'SCHEDULED', scheduledAt: '2027-04-10T10:00:00.000Z' })).status, 200);
    assert.equal((await call(`/admin/viewings/${viewing.body.viewing.id}/status`, admin.cookie, { status: 'COMPLETED', note: 'Visite réalisée, pièces montrées.' })).status, 200);
    const application = await call('/lease-applications', client.cookie, { listingId: longTerm.id, viewingId: viewing.body.viewing.id, message: 'Candidature de test complète.' });
    assert.equal(application.status, 201);
    for (const status of ['UNDER_REVIEW','NEGOTIATING','LEASE_PREPARED']) {
      assert.equal((await call(`/admin/lease-applications/${application.body.application.id}/status`, admin.cookie, { status })).status, 200);
    }
    assert.equal((await call(`/admin/lease-applications/${application.body.application.id}/status`, admin.cookie, { status: 'SIGNED_EXTERNALLY' })).status, 400);
    assert.equal((await call(`/admin/lease-applications/${application.body.application.id}/status`, admin.cookie, { status: 'SIGNED_EXTERNALLY', signatureReference: 'BAIL-FICTIF-001' })).status, 409);
    const proof = await fetch(`${apiBase}/evidence/lease/${application.body.application.id}`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'application/pdf', 'x-evidence-kind': 'SIGNED_LEASE' }, body: '%PDF-1.4\n%test\n' });
    assert.equal(proof.status, 201);
    const evidenceId = (await proof.json()).evidence.id;
    assert.equal((await fetch(`${apiBase}/evidence/lease/${application.body.application.id}`, { method: 'POST', headers: { cookie: outsider.cookie, 'content-type': 'application/pdf', 'x-evidence-kind': 'SIGNED_LEASE' }, body: '%PDF-1.4\n%test\n' })).status, 403);
    assert.equal((await fetch(`${apiBase}/evidence/lease/${application.body.application.id}`, { method: 'POST', headers: { cookie: partner.cookie, 'content-type': 'application/pdf', 'x-evidence-kind': 'SIGNED_LEASE' }, body: 'not-a-pdf-file' })).status, 400);
    assert.equal((await fetch(`${apiBase}/evidence-file/${evidenceId}`, { headers: { cookie: outsider.cookie } })).status, 403);
    assert.equal((await call(`/admin/evidence/${evidenceId}/approve`, admin.cookie)).status, 200);
    assert.equal((await call(`/admin/lease-applications/${application.body.application.id}/status`, admin.cookie, { status: 'SIGNED_EXTERNALLY', signatureReference: 'BAIL-FICTIF-001' })).status, 200);
    const mediaReport = await call(`/listings/${longTerm.id}/report-media`, client.cookie, { message: 'Personne identifiable sans consentement dans la vidéo.' });
    assert.equal(mediaReport.status, 201);
    assert.equal((await db.query('SELECT status FROM listings WHERE id=$1', [longTerm.id])).rows[0].status, 'SUSPENDED');
    assert.equal((await call(`/admin/tickets/${mediaReport.body.ticket.id}/resolve`, admin.cookie)).status, 400);
    assert.equal((await call(`/admin/listings/${longTerm.id}/reinspect`, admin.cookie, { reason: 'Réinspection fictive demandée.' })).status, 409);
    assert.equal((await call(`/admin/tickets/${mediaReport.body.ticket.id}/resolve`, admin.cookie, { note: 'Contenu retiré et partenaire informé.' })).status, 200);
    assert.equal((await call(`/admin/listings/${longTerm.id}/reinspect`, admin.cookie, { reason: 'Réinspection fictive demandée.' })).status, 200);
    assert.equal((await call('/tickets', client.cookie, { category: 'DISPUTE', message: 'Litige fictif ouvert pour la recette.' })).status, 201);
    const closure = await call('/me/close', client.cookie);
    assert.equal(closure.status, 200);
    assert.equal(closure.body.restrictedRetention, true);
    assert.equal((await (await fetch(`${apiBase}/me`, { headers: { cookie: client.cookie } })).json()).user, null);
  } finally { await db.end(); }
});
