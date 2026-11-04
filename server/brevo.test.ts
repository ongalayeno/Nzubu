import assert from 'node:assert/strict';
import test from 'node:test';
import { sendOtp } from './brevo';

test('OTP envoyé par e-mail transactionnel Brevo uniquement', async () => {
  const oldKey = process.env.BREVO_API_KEY;
  const oldSender = process.env.BREVO_SENDER_EMAIL;
  const oldFetch = globalThis.fetch;
  let url = '';
  let payload: any;
  try {
    process.env.BREVO_API_KEY = 'test-only';
    process.env.BREVO_SENDER_EMAIL = 'pourtoutlestravaux@gmail.com';
    globalThis.fetch = async (input, init) => {
      url = String(input);
      payload = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ messageId: 'test' }), { status: 201 });
    };
    await sendOtp('ongalayeno@gmail.com', '123456');
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(payload.sender.email, 'pourtoutlestravaux@gmail.com');
    assert.equal(payload.to[0].email, 'ongalayeno@gmail.com');
    assert.match(payload.textContent, /123456/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = oldKey;
    if (oldSender === undefined) delete process.env.BREVO_SENDER_EMAIL; else process.env.BREVO_SENDER_EMAIL = oldSender;
  }
});
