-- TrustLens AI report schema (already applied to the linked Supabase project)
-- Authenticated users may access only rows whose user_id matches auth.uid().
create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_type text not null default 'message' check (input_type in ('message','url','claim','job_offer','invoice','other')),
  input_text text not null check (char_length(input_text) between 1 and 8000),
  verdict text not null default 'needs_review' check (verdict in ('high_risk','caution','needs_review','insufficient_evidence')),
  summary text not null default '',
  findings jsonb not null default '[]'::jsonb check (jsonb_typeof(findings) = 'array'),
  recommended_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_actions) = 'array'),
  created_at timestamptz not null default now()
);
create index if not exists analysis_reports_user_created_at_idx on public.analysis_reports (user_id, created_at desc);
alter table public.analysis_reports enable row level security;
drop policy if exists "Users can read their own analysis reports" on public.analysis_reports;
create policy "Users can read their own analysis reports" on public.analysis_reports for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own analysis reports" on public.analysis_reports;
create policy "Users can create their own analysis reports" on public.analysis_reports for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own analysis reports" on public.analysis_reports;
create policy "Users can delete their own analysis reports" on public.analysis_reports for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.analysis_reports to authenticated;
