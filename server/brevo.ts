import { appendFileSync } from 'node:fs';
import path from 'node:path';

function logDevelopmentOtp(destination: string, code: string) {
  const line = `[DEV ONLY] Code OTP pour ${destination}: ${code}`;
  console.info(line);
  appendFileSync(path.resolve('nzubu-otp.log'), `${new Date().toISOString()} ${line}\n`, { mode: 0o600 });
}

export class BrevoError extends Error {
  constructor(public readonly status: number) { super(`Brevo HTTP ${status}`); }
}

export async function sendOtp(destination: string, code: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || process.env.NODE_ENV !== 'production' && destination.endsWith('@test.local')) {
    if (process.env.NODE_ENV === 'production') throw new Error('BREVO_API_KEY requis en production');
    logDevelopmentOtp(destination, code);
    return;
  }
  if (!process.env.BREVO_SENDER_EMAIL) throw new Error('BREVO_SENDER_EMAIL requis');
  const body = { sender: { name: 'NZUBU', email: process.env.BREVO_SENDER_EMAIL }, to: [{ email: destination }], subject: 'Votre code NZUBU', textContent: `Votre code NZUBU est ${code}. Il expire dans 10 minutes.` };
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new BrevoError(response.status);
}

export async function sendNotification(destination: string, subject: string, body: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  if (!process.env.BREVO_SENDER_EMAIL) throw new Error('BREVO_SENDER_EMAIL requis');
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: 'NZUBU', email: process.env.BREVO_SENDER_EMAIL }, to: [{ email: destination }], subject, textContent: body }),
  });
  if (!response.ok) throw new BrevoError(response.status);
  return true;
}
