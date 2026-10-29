-- TrustLens AI — attribute saved reports to the signed-in user
--
-- WHY
-- Reports are written server-side with the secret key and addressed by an
-- unguessable UUID. That is sound for guests, but it means a signed-in user's
-- reports are not actually *theirs*: anyone holding the id can read them, and
-- the account has no list of its own work. This adds ownership without
-- changing how guests behave.
--
-- SAFETY
-- Strictly additive. The column is NULLABLE, so every existing row stays valid
-- and keeps working exactly as before — existing guest reports simply have no
-- owner. No table is dropped, no row is deleted, no policy is relaxed.
--
--   Before applying, note the current count:
--     select count(*) from public.scans;   -- expected: 83 or more
--   After applying, it must be unchanged.
--
-- RLS IS NOT WEAKENED
-- public.scans intentionally has RLS enabled with NO policies for the browser
-- roles, so anon and authenticated can still read nothing directly. All access
-- continues to go through the server using the secret key, which bypasses RLS
-- by design. Ownership is enforced in the API layer, which is the only thing
-- holding a verified session. Adding a permissive SELECT policy here would
-- hand every signed-in user the whole table, which is exactly what we are
-- preventing.
--
-- HOW TO APPLY
-- Supabase dashboard -> SQL Editor -> paste -> Run.

begin;

alter table public.scans
  add column if not exists user_id uuid references auth.users(id) on delete set null;

comment on column public.scans.user_id is
  'Owner of the report when it was created by a signed-in user. NULL for guest reports. Enforced in the API layer; scans has no browser-role policies.';

-- Supports "my reports, newest first" without scanning the table.
create index if not exists scans_user_created_idx
  on public.scans (user_id, created_at desc)
  where user_id is not null;

commit;

-- Verification:
--   select count(*) from public.scans;                      -- unchanged
--   select count(*) from public.scans where user_id is null; -- all existing rows
