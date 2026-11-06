import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pg from 'pg';

const base = process.env.TEST_API_BASE || 'http://localhost:3001/v1';
const databaseUrl = process.env.DATABASE_URL;

test('inscription, connexion e-mail/téléphone, récupération et activation des rôles précréés', { skip: !databaseUrl }, async () => {
  const db = new pg.Pool({ connectionString: databaseUrl });
  const suffix = randomUUID();
  const clientEmail = `client-auth-${suffix}@test.local`;
  const agentEmail = `agent-auth-${suffix}@test.local`;
  const adminEmail = `admin-auth-${suffix}@test.local`;
  const emails = [clientEmail, agentEmail, adminEmail];
  const phone = `+2438${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
  const password = 'MotDePasse-Test-123!';
  const newPassword = 'NouveauMotDePasse-456!';
  const post = async (path: string, body: unknown) => {
    const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() as any };
  };
  const lastCode = async (email: string) => {
    const log = await readFile('nzubu-otp.log', 'utf8');
    const line = log.split('\n').filter((entry) => entry.includes(`Code OTP pour ${email}: `)).at(-1);
    assert.ok(line, `code de test manquant pour ${email}`);
    return line.match(/:\s*(\d{6})\s*$/)![1];
  };
  try {
    assert.equal((await post('/auth/register', { email: clientEmail, phone: '123', password })).status, 400);
    assert.equal((await post('/auth/register', { email: clientEmail, phone, password })).status, 202);
    assert.equal((await post('/auth/verify-registration', { email: clientEmail, code: '000000' })).status, 401);
    const client = await post('/auth/verify-registration', { email: clientEmail, code: await lastCode(clientEmail) });
    assert.equal(client.status, 200);
    assert.equal(client.body.user.role, 'CLIENT');
    assert.equal(client.body.user.phone, phone);
    assert.equal((await post('/auth/login', { identifier: clientEmail, password: 'incorrect' })).status, 401);
    assert.equal((await post('/auth/login', { identifier: clientEmail.toUpperCase(), password })).status, 200);
    assert.equal((await post('/auth/login', { identifier: phone, password })).status, 200);

    assert.equal((await post('/auth/request-password-reset', { email: clientEmail })).status, 202);
    assert.equal((await post('/auth/reset-password', { email: clientEmail, code: await lastCode(clientEmail), password: newPassword })).status, 200);
    assert.equal((await post('/auth/login', { identifier: clientEmail, password })).status, 401);
    assert.equal((await post('/auth/login', { identifier: phone, password: newPassword })).status, 200);

    for (const [email, role] of [[agentEmail, 'FIELD_AGENT'], [adminEmail, 'OPERATIONS_ADMIN']] as const) {
      await db.query('INSERT INTO users(email,role) VALUES($1,$2)', [email, role]);
      assert.equal((await post('/auth/register', { email, password })).status, 202);
      const activation = await post('/auth/verify-registration', { email, code: await lastCode(email) });
      assert.equal(activation.status, 200);
      assert.equal(activation.body.user.role, role);
      assert.equal((await post('/auth/login', { identifier: email, password })).body.user.role, role);
    }
    assert.equal((await post('/auth/register', { email: clientEmail, password })).status, 409);
  } finally {
    await db.query('DELETE FROM registration_codes WHERE email=ANY($1::text[])', [emails]);
    await db.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]);
    await db.end();
  }
});
