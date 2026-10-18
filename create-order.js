// POST /.netlify/functions/create-order
// Body: { token: <booking payment_token>, kind: 'deposit' | 'rent' }
// The amount is computed HERE from the room record. The browser cannot set it.
import { admin, json, parseBody } from '../lib/server.js';
import { createRazorpayOrder } from '../lib/razorpay.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const body = parseBody(event);
  if (!body) return json(400, { error: 'Invalid request body' });

  const token = String(body.token ?? '');
  const kind = body.kind === 'rent' ? 'rent' : body.kind === 'deposit' ? 'deposit' : null;
  if (!/^[0-9a-f-]{36}$/i.test(token) || !kind) return json(422, { error: 'Invalid payment link.' });

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, guest_name, room:rooms(name, monthly_rent, deposit, is_published)')
    .eq('payment_token', token)
    .maybeSingle();

  if (!booking || booking.status === 'cancelled') return json(404, { error: 'Payment link not found or expired.' });
  if (!booking.room) return json(422, { error: 'This booking has no room assigned. Please contact the owner.' });

  const amount = kind === 'deposit' ? booking.room.deposit : booking.room.monthly_rent;
  if (!Number.isInteger(amount) || amount <= 0) {
    return json(422, { error: 'No payable amount is configured for this booking. Please contact the owner.' });
  }

  try {
    const order = await createRazorpayOrder({
      amountRupees: amount,
      receipt: `bk_${booking.id}_${kind}_${Date.now()}`,
      notes: { booking_id: booking.id, kind },
    });

    const { error } = await admin.from('payments').insert({
      booking_id: booking.id,
      kind,
      amount,
      currency: 'INR',
      razorpay_order_id: order.id,
      status: 'created',
    });
    if (error) throw error;

    return json(200, {
      key_id: process.env.RAZORPAY_KEY_ID,   // public key id only; the secret is never sent
      order_id: order.id,
      amount,
      currency: 'INR',
      name: 'Prakruthi Boys & Girls Hostel',
      description: `${kind === 'deposit' ? 'Booking deposit' : 'Monthly rent'} – ${booking.room.name}`,
    });
  } catch (err) {
    console.error('create-order failed', err?.message);
    return json(502, { error: 'Could not start payment. Please try again shortly.' });
  }
}
