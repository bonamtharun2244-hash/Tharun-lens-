-- Run ONCE in Supabase SQL Editor after creating the owner user in
-- Authentication > Users. Replace the UUID below with the owner's user id.
-- Do not add any other rows to admin_users.

insert into public.admin_users (user_id, role)
values ('REPLACE-WITH-OWNER-UUID', 'owner')
on conflict (user_id) do nothing;

-- Check: should return exactly one row for the owner.
select user_id, role, created_at from public.admin_users;
