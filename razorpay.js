// Razorpay REST helpers (server-only). Keys come from Netlify environment variables.
import crypto from 'node:crypto';
import { safeEqual } from './server.js';

const API = 'https://api.razorpay.com/v1';

function authHeader() {
  const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

export async function createRazorpayOrder({ amountRupees, receipt, notes }) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes,
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  return res.json();
}

// Verifies the signature Razorpay returns to the browser after checkout.
// A valid signature proves Razorpay issued it; it is necessary but the
// webhook is still the authoritative confirmation.
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

// Verifies webhook bodies, which use a separate webhook secret.
export function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET ?? '')
    .update(rawBody)
    .digest('hex');
  return safeEqual(expected, signature ?? '');
}
