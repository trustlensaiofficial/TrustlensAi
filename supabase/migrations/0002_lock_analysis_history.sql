-- TrustLens AI — close anonymous read access on public.analysis_history
--
-- WHY THIS EXISTS
-- Probing the live project (pwieplvvzftxdxvoueed) with the *publishable*
-- browser key on 2026-10-29 produced:
--
--   scans             -> HTTP 401  (correctly denied)
--   analysis_reports  -> HTTP 401  (correctly denied)
--   analysis_history  -> HTTP 200  []          <-- readable by anyone
--
-- Writes are already blocked ("new row violates row-level security policy"),
-- so RLS is enabled on the table; the problem is a permissive SELECT policy
-- granted to anon. The table carries a `user_id` column, i.e. it was designed
-- to hold per-user rows. It is empty today, so nothing has leaked — but any
-- future write would become readable by every visitor holding the public key,
-- which is exactly the cross-user exposure this project forbids.
--
-- SAFETY
-- Additive and reversible. Drops no table, deletes no row, and does not touch
-- public.scans (22 rows) or public.analysis_reports. It only replaces
-- over-broad SELECT policies on analysis_history with owner-scoped ones.
--
-- HOW TO APPLY
-- Supabase dashboard -> SQL Editor -> paste this file -> Run.
-- Re-run the probe afterwards; analysis_history should return 401 like the
-- other two tables.

begin;

alter table public.analysis_history enable row level security;

-- Remove any permissive policy that allows unauthenticated reads. Named
-- variants are dropped individually because Postgres has no "drop all
-- policies" form, and we must not guess at a policy we cannot see.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'analysis_history'
      and 'anon' = any (coalesce(roles, '{}'::name[]))
  loop
    execute format('drop policy %I on public.analysis_history', pol.policyname);
    raise notice 'dropped anon-facing policy: %', pol.policyname;
  end loop;
end
$$;

-- Owner-scoped access, matching the table's existing user_id column. With no
-- authenticated session these evaluate false, so anon reads nothing.
drop policy if exists "analysis_history owner can read"   on public.analysis_history;
drop policy if exists "analysis_history owner can insert" on public.analysis_history;
drop policy if exists "analysis_history owner can delete" on public.analysis_history;

create policy "analysis_history owner can read"
  on public.analysis_history for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "analysis_history owner can insert"
  on public.analysis_history for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "analysis_history owner can delete"
  on public.analysis_history for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Make the absence of direct grants explicit; the server uses the service
-- role, which bypasses RLS by design.
revoke all on table public.analysis_history from anon;

commit;

-- Verification, expected to return zero rows granting anon anything:
--   select policyname, roles, cmd
--   from pg_policies
--   where schemaname='public' and tablename='analysis_history';
