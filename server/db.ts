import pg from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL requis');

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('nzubu:migrations'))");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const version of ['001_core.sql', '002_photo_document.sql', '003_notification_retry.sql', '004_lease_applications.sql', '005_mission_idempotency.sql', '006_document_upload_key.sql', '007_booking_exclusion.sql', '008_listing_video.sql', '009_auth_rate_limits.sql', '010_booking_cancellation.sql']) {
      const exists = await client.query('SELECT 1 FROM schema_migrations WHERE version=$1', [version]);
      if (exists.rowCount) continue;
      const sql = await readFile(path.resolve('server/migrations', version), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [version]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('nzubu:migrations'))");
    client.release();
  }
}

export async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
