-- TrustLens AI history schema
-- This migration is also applied to the linked Supabase project.
create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null check (char_length(input_text) between 1 and 8000),
  analysis_text text not null check (char_length(analysis_text) <= 12000),
  created_at timestamptz not null default now()
);
create index if not exists analysis_history_user_created_at_idx
  on public.analysis_history (user_id, created_at desc);
alter table public.analysis_history enable row level security;
drop policy if exists "Users can read their own analysis history" on public.analysis_history;
create policy "Users can read their own analysis history" on public.analysis_history for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own analysis history" on public.analysis_history;
create policy "Users can create their own analysis history" on public.analysis_history for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own analysis history" on public.analysis_history;
create policy "Users can delete their own analysis history" on public.analysis_history for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.analysis_history to authenticated;
