-- TrustLens AI — report storage
--
-- Security model:
--   * RLS is ENABLED and no policy is granted to `anon` or `authenticated`.
--     With no permissive policy, those roles can read and write nothing, so a
--     leaked publishable key exposes no reports.
--   * All access goes through the server using the service-role key, which
--     bypasses RLS by design.
--   * A report is addressed only by its UUID primary key, and the application
--     exposes no endpoint that lists rows. One visitor therefore cannot
--     enumerate another visitor's scans.
--
-- This migration is additive and creates nothing that already exists. It does
-- not drop tables, alter existing policies, or touch other schemas.

create table if not exists public.scans (
  id               uuid        primary key,
  input_kind       text        not null check (input_kind in ('message', 'url', 'claim')),
  input_preview    text        not null check (char_length(input_preview) <= 400),
  assessment_level text        not null,
  signal_score     integer     not null default 0,
  report           jsonb       not null,
  is_demo          boolean     not null default false,
  created_at       timestamptz not null default now()
);

comment on table public.scans is
  'TrustLens AI analysis reports. Server-side access only via service role; RLS denies all client roles.';
comment on column public.scans.report is
  'Full report document. Contains the analysed input preview, so treat as user content.';

create index if not exists scans_created_at_idx on public.scans (created_at desc);

alter table public.scans enable row level security;

-- Belt and braces: even without policies, make the absence of grants explicit.
revoke all on table public.scans from anon;
revoke all on table public.scans from authenticated;

-- Retention: reports are kept indefinitely by this migration. If you want
-- automatic expiry, schedule the following with pg_cron rather than adding a
-- trigger, so deletion stays observable:
--   delete from public.scans where created_at < now() - interval '30 days';
