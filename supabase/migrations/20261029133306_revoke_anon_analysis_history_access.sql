begin;
alter table public.analysis_history enable row level security;
revoke all on table public.analysis_history from anon;
commit;
