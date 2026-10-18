-- Optional starter rows. Everything is UNPUBLISHED and marked as sample,
-- so nothing invented appears on the public site until the owner edits and publishes it.
-- Prices are placeholders: replace them with the owner's confirmed prices.

insert into public.rooms (slug, name, room_type, monthly_rent, deposit, capacity, available_beds, description, is_published, sort_order)
values
  ('quad-sharing',   'Four-Sharing Room (SAMPLE – edit)',   'quad',   5000, 2000, 4, 4, 'SAMPLE description – owner to confirm.', false, 1),
  ('triple-sharing', 'Triple-Sharing Room (SAMPLE – edit)', 'triple', 6000, 2500, 3, 3, 'SAMPLE description – owner to confirm.', false, 2),
  ('double-sharing', 'Double-Sharing Room (SAMPLE – edit)', 'double', 7500, 3000, 2, 2, 'SAMPLE description – owner to confirm.', false, 3),
  ('single-room',    'Single Room (SAMPLE – edit)',         'single', 9000, 4000, 1, 1, 'SAMPLE description – owner to confirm.', false, 4)
on conflict (slug) do nothing;

-- Settings placeholders. Owner fills these in from the admin dashboard.
insert into public.site_settings (key, value) values
  ('contact', '{"name":"Prakruthi Boys & Girls Hostel","address":"Vasavi Nagar, near Honda showroom, Puttur, Andhra Pradesh","whatsapp":"919121497402","phone":"+91 9121497402","email":""}'),
  ('facilities', '[]'),
  ('meal_timings', '{"breakfast":"","lunch":"","dinner":""}')
on conflict (key) do nothing;
