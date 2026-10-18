// POST /.netlify/functions/razorpay-webhook
// Configure in Razorpay Dashboard (TEST mode first) > Webhooks:
//   URL: https://<your-site>.netlify.app/.netlify/functions/razorpay-webhook
//   Events: payment.captured, payment.failed
//   Secret: same value as RAZORPAY_WEBHOOK_SECRET in Netlify.
// Signature is checked against the RAW body before anything is trusted.
import { admin, json } from '../lib/server.js';
import { verifyWebhookSignature } from '../lib/razorpay.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : (event.body ?? '');
  const signature = event.headers?.['x-razorpay-signature'] || event.headers?.['X-Razorpay-Signature'];

  if (!verifyWebhookSignature(raw, signature)) return json(400, { error: 'Invalid signature' });

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const entity = payload?.payload?.payment?.entity;
  if (!entity?.order_id) return json(200, { ok: true, ignored: true });

  if (payload.event === 'payment.captured') {
    await admin
      .from('payments')
      .update({ status: 'captured', razorpay_payment_id: entity.id })
      .eq('razorpay_order_id', entity.order_id)
      .neq('status', 'captured');
  } else if (payload.event === 'payment.failed') {
    await admin
      .from('payments')
      .update({ status: 'failed', razorpay_payment_id: entity.id })
      .eq('razorpay_order_id', entity.order_id)
      .eq('status', 'created');
  }

  return json(200, { ok: true });
}
