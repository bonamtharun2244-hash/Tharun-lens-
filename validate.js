// Shared validation for public enquiries. Used by both the browser (for instant feedback)
// and the Netlify Function (the authoritative check).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_RE = /^[\p{L}][\p{L}\s.'-]*$/u;

export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/[\s\-()]/g, '');
  const m = digits.match(/^(?:\+?91)?([6-9]\d{9})$/);
  return m ? m[1] : null;
}

// Today's date in India (YYYY-MM-DD) so "not in the past" is judged in local time.
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function validateEnquiry(input = {}) {
  const errors = {};
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  const phone = normalizePhone(input.phone);
  const roomId = String(input.room_id ?? '').trim();
  const moveIn = String(input.move_in_date ?? '').trim();
  const message = String(input.message ?? '').trim();

  if (name.length < 2 || name.length > 80 || !NAME_RE.test(name)) {
    errors.name = 'Enter your full name (2–80 letters).';
  }
  if (!phone) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (!UUID_RE.test(roomId)) {
    errors.room_id = 'Choose a preferred room.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveIn) || Number.isNaN(Date.parse(moveIn))) {
    errors.move_in_date = 'Choose a valid move-in date.';
  } else if (moveIn < todayIST()) {
    errors.move_in_date = 'Move-in date cannot be in the past.';
  }
  if (message.length > 500) {
    errors.message = 'Message must be 500 characters or fewer.';
  }

  return {
    errors,
    value: { name, phone, room_id: roomId, move_in_date: moveIn, message: message || null },
  };
}
