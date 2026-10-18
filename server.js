// Server-only helpers for Netlify Functions. Never import this file from src/.
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS. Only ever used inside functions.
export const admin = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

export function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Hash the client IP with a salt so raw IPs are never stored.
export function ipHash(event) {
  const ip = event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-forwarded-for'] || 'unknown';
  return crypto
    .createHash('sha256')
    .update(`${process.env.IP_HASH_SALT ?? ''}:${ip.split(',')[0].trim()}`)
    .digest('hex');
}

// Returns the authenticated owner's user id, or null.
export async function requireOwner(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: row } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  return row ? data.user.id : null;
}

// Constant-time comparison for signatures.
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
