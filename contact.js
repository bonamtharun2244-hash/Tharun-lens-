// POST /.netlify/functions/contact
// Public contact form. Honeypot + per-IP rate limit + service-role insert.
import { admin, json, parseBody, ipHash } from '../lib/server.js';
import { normalizePhone } from '../lib/validate.js';

const MAX_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const body = parseBody(event);
  if (body === null) return json(400, { error: 'Invalid request body' });

  if (body.website) return json(201, { ok: true }); // honeypot

  const name = String(body.name ?? '').trim();
  const message = String(body.message ?? '').trim();
  const phoneRaw = String(body.phone ?? '').trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

  if (name.length < 2 || name.length > 80) return json(422, { error: 'Please check your name.' });
  if (message.length < 5 || message.length > 1000) return json(422, { error: 'Message must be 5–1000 characters.' });
  if (phoneRaw && !phone) return json(422, { error: 'Please check your phone number.' });

  const hash = ipHash(event);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await admin
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', hash)
    .gte('created_at', since);
  if ((count ?? 0) >= MAX_PER_WINDOW) return json(429, { error: 'Too many messages. Please try again later or use WhatsApp.' });

  const { error } = await admin.from('contact_messages').insert({ name, phone, message, ip_hash: hash });
  if (error) return json(500, { error: 'Could not send your message.' });
  return json(201, { ok: true });
}
