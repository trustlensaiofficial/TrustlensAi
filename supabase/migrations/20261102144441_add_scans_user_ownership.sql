-- TrustLens AI — attribute saved reports to the signed-in user
--
-- Strictly additive: existing guest reports remain valid with user_id NULL.
-- RLS remains enabled with no browser-role policies; access stays server-side.
-- This supports ownership checks and future account-scoped report history.

begin;

alter table public.scans
  add column if not exists user_id uuid references auth.users(id) on delete set null;

comment on column public.scans.user_id is
  'Owner of the report when it was created by a signed-in user. NULL for guest reports. Enforced in the API layer; scans has no browser-role policies.';

create index if not exists scans_user_created_idx
  on public.scans (user_id, created_at desc)
  where user_id is not null;

commit;
