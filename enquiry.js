// POST /.netlify/functions/enquiry
// Public endpoint for booking enquiries. Validates input, applies a honeypot,
// rate-limits per hashed IP, and inserts via the service role.
// An enquiry is NOT a reservation; the owner confirms every booking manually.
import { admin, json, parseBody, ipHash } from '../lib/server.js';
import { validateEnquiry } from '../lib/validate.js';

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 5;

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const body = parseBody(event);
  if (body === null) return json(400, { error: 'Invalid request body' });

  // Honeypot: real users never fill the hidden "website" field. Pretend success silently.
  if (body.website) return json(201, { ok: true });

  const { errors, value } = validateEnquiry(body);
  if (Object.keys(errors).length) return json(422, { error: 'Please correct the highlighted fields.', fields: errors });

  // Confirm the chosen room exists and is published (prevents junk room ids).
  const { data: room } = await admin
    .from('rooms')
    .select('id')
    .eq('id', value.room_id)
    .eq('is_published', true)
    .maybeSingle();
  if (!room) return json(422, { error: 'That room is not available to enquire about.', fields: { room_id: 'Choose a preferred room.' } });

  // Rate limit per hashed IP.
  const hash = ipHash(event);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await admin
    .from('enquiries')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', hash)
    .gte('created_at', since);
  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return json(429, { error: 'Too many enquiries from this connection. Please try again later or message us on WhatsApp.' });
  }

  const { data, error } = await admin
    .from('enquiries')
    .insert({ ...value, ip_hash: hash })
    .select('id')
    .single();
  if (error) return json(500, { error: 'Could not save your enquiry. Please try WhatsApp instead.' });

  return json(201, { ok: true, reference: data.id.slice(0, 8).toUpperCase() });
}
