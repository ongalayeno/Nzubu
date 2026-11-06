import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export function normalizePhone(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const phone = value.replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, derivedHex] = stored.split(':');
  if (algorithm !== 'scrypt' || !/^[0-9a-f]{32}$/.test(saltHex || '') || !/^[0-9a-f]{128}$/.test(derivedHex || '')) return false;
  const expected = Buffer.from(derivedHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
  return timingSafeEqual(actual, expected);
}
