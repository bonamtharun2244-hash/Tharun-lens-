// POST /.netlify/functions/verify-payment
// Called by the browser after Razorpay checkout returns. The browser redirect
// alone is NOT enough to record payment: we verify the signature here, and the
// webhook (razorpay-webhook.js) provides the second, authoritative confirmation.
// Idempotent: repeated calls for the same payment are safe.
import { admin, json, parseBody } from '../lib/server.js';
import { verifyCheckoutSignature } from '../lib/razorpay.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'Invalid request body' });

  const orderId = String(body.razorpay_order_id ?? '');
  const paymentId = String(body.razorpay_payment_id ?? '');
  const signature = String(body.razorpay_signature ?? '');
  if (!orderId || !paymentId || !signature) return json(422, { error: 'Missing payment details.' });

  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    return json(400, { error: 'Payment signature could not be verified.' });
  }

  const { data: payment } = await admin
    .from('payments')
    .select('id, status')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();
  if (!payment) return json(404, { error: 'Unknown order.' });

  if (payment.status !== 'captured') {
    const { error } = await admin
      .from('payments')
      .update({ status: 'captured', razorpay_payment_id: paymentId })
      .eq('id', payment.id)
      .neq('status', 'captured');
    if (error) return json(500, { error: 'Payment received but could not be recorded. The owner has been asked to check.' });
  }

  return json(200, { ok: true, status: 'captured' });
}
