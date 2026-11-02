-- Remove duplicate owner-scoped policies on analysis_history.
-- The remaining "Users can ..." policies enforce the same auth.uid() ownership
-- predicates. This changes no data and does not broaden access.

begin;

drop policy if exists "analysis_history owner can read" on public.analysis_history;
drop policy if exists "analysis_history owner can insert" on public.analysis_history;
drop policy if exists "analysis_history owner can delete" on public.analysis_history;

commit;
