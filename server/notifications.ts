import { pool, transaction } from './db';
import { sendNotification } from './brevo';

export async function queueNotification(userId: string, subject: string, body: string) {
  await pool.query("INSERT INTO notifications(user_id,channel,subject,body) VALUES($1,'AUTO',$2,$3)", [userId, subject, body]);
}

export function startNotificationWorker() {
  if (!process.env.BREVO_API_KEY) return;
  const poll = async () => {
    try {
      await transaction(async (db) => {
        const rows = (await db.query(`SELECT n.*,u.email,u.phone FROM notifications n JOIN users u ON u.id=n.user_id
          WHERE sent_at IS NULL AND attempts<5 AND next_attempt_at<=now()
          ORDER BY n.created_at LIMIT 10 FOR UPDATE OF n SKIP LOCKED`)).rows;
        for (const item of rows) {
          try {
            if (!item.email) throw new Error('Adresse e-mail absente');
            await sendNotification(item.email, item.subject, item.body);
            await db.query('UPDATE notifications SET sent_at=now() WHERE id=$1', [item.id]);
          } catch (error) {
            await db.query("UPDATE notifications SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes',last_error=$2 WHERE id=$1", [item.id, String(error).slice(0, 300)]);
          }
        }
      });
    } catch (error) { console.error('Notification worker:', error); }
  };
  void poll();
  setInterval(() => { void poll(); }, 15_000).unref();
}
