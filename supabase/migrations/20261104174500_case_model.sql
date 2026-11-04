-- The case model (release blocker B4).
--
-- Until now the product was one-shot analyses: text in, report out, nothing
-- connecting them. A real incident is not one message. It is a sequence — a
-- text, then a call, then a QR code, then a transfer — and the thing a person
-- needs help with is the sequence, not any single item in it.
--
-- Four tables, every CHECK constraint matching an enum in docs/openapi.yaml.
-- The contract is authoritative; if these disagree with it, these are wrong.
--
-- Access model, following the pattern already established in this project:
-- RLS on, owner-scoped policies against (select auth.uid()), and nothing
-- granted to anon. A leaked publishable key reads nothing.
--
-- Cases require an account. Guests keep their reports in device storage and
-- lose nothing else — the product never puts a login in front of an analysis.

begin;

/* ------------------------------------------------------------------- cases */

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled case',
  status text not null default 'draft'
    check (status in (
      'draft', 'analysing', 'findings_available', 'needs_verification',
      'user_acted', 'recovery_in_progress', 'reported', 'resolved', 'closed'
    )),
  context text not null default 'generic'
    check (context in ('generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website')),
  /*
   * The furthest action the user reports having taken, which is what the
   * recovery plan is generated from. Deliberately "furthest" and not "latest":
   * someone who transferred money and then opened a link has not become less
   * exposed, and a plan that regressed on the later, milder answer would be
   * dangerous advice.
   */
  furthest_action text
    check (furthest_action is null or furthest_action in (
      'received_only', 'opened_link', 'entered_credentials', 'shared_otp_or_pin',
      'installed_app', 'shared_screen', 'granted_remote_access', 'scanned_qr_only',
      'entered_upi_pin', 'approved_payment_request', 'transferred_money',
      'shared_identity_documents'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cases is
  'One investigation, which may span several messages, calls and payment instructions. Owner-scoped.';
comment on column public.cases.furthest_action is
  'The most exposed action the user reports. Never regressed to a milder later answer; the recovery plan depends on it.';

create index if not exists cases_user_updated_idx
  on public.cases (user_id, updated_at desc);

alter table public.cases enable row level security;

drop policy if exists "cases owner can read" on public.cases;
create policy "cases owner can read"
  on public.cases for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "cases owner can insert" on public.cases;
create policy "cases owner can insert"
  on public.cases for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "cases owner can update" on public.cases;
create policy "cases owner can update"
  on public.cases for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "cases owner can delete" on public.cases;
create policy "cases owner can delete"
  on public.cases for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.cases to authenticated;

/* --------------------------------------------------------------- artifacts */

create table if not exists public.case_artifacts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  type text not null
    check (type in ('message', 'url', 'screenshot', 'qr', 'email', 'sender_info', 'note')),
  text text check (text is null or length(text) <= 8000),
  url text,
  /*
   * A path in a private bucket, never a public URL. Ownership is revalidated
   * server-side on every read: a path is not a capability.
   */
  storage_object_path text,
  /*
   * The sender name as the messaging app displayed it. Stored as
   * user_supplied, and never treated as identity — a display name is chosen by
   * whoever sent the message.
   */
  sender_label text,
  provenance text not null default 'user_supplied'
    check (provenance in (
      'deterministic', 'on_device', 'retrieved', 'model_inference',
      'user_supplied', 'assumption'
    )),
  /*
   * A stale result is never presented as a live check. This column is what
   * makes that enforceable rather than aspirational.
   */
  freshness text not null default 'unknown'
    check (freshness in ('live', 'cached', 'stale', 'unknown')),
  provider text,
  retrieved_at timestamptz,
  redacted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.case_artifacts is
  'Evidence attached to a case. Every row carries how it was established and how fresh it is.';
comment on column public.case_artifacts.sender_label is
  'Display name as shown by the messaging app. user_supplied provenance; never identity.';

create index if not exists case_artifacts_case_idx
  on public.case_artifacts (case_id, created_at);

alter table public.case_artifacts enable row level security;

-- Reachability through the parent case is the whole authorisation rule, so the
-- policies ask the cases table rather than duplicating an owner column that
-- could drift out of step with it.
drop policy if exists "artifacts readable through owned case" on public.case_artifacts;
create policy "artifacts readable through owned case"
  on public.case_artifacts for select
  to authenticated
  using (exists (
    select 1 from public.cases c
     where c.id = case_artifacts.case_id
       and c.user_id = (select auth.uid())
  ));

drop policy if exists "artifacts insertable into owned case" on public.case_artifacts;
create policy "artifacts insertable into owned case"
  on public.case_artifacts for insert
  to authenticated
  with check (exists (
    select 1 from public.cases c
     where c.id = case_artifacts.case_id
       and c.user_id = (select auth.uid())
  ));

drop policy if exists "artifacts deletable from owned case" on public.case_artifacts;
create policy "artifacts deletable from owned case"
  on public.case_artifacts for delete
  to authenticated
  using (exists (
    select 1 from public.cases c
     where c.id = case_artifacts.case_id
       and c.user_id = (select auth.uid())
  ));

-- No update policy. Evidence is added or removed, never quietly edited: a
-- report that cites an artifact must cite what was actually collected.
grant select, insert, delete on public.case_artifacts to authenticated;

/* ------------------------------------------------------------------ events */

create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  kind text not null
    check (kind in (
      'case_opened', 'artifact_added', 'analysis_run', 'action_reported',
      'recovery_plan_generated', 'report_exported', 'status_changed', 'note_added'
    )),
  action_state text
    check (action_state is null or action_state in (
      'received_only', 'opened_link', 'entered_credentials', 'shared_otp_or_pin',
      'installed_app', 'shared_screen', 'granted_remote_access', 'scanned_qr_only',
      'entered_upi_pin', 'approved_payment_request', 'transferred_money',
      'shared_identity_documents'
    )),
  detail text check (detail is null or length(detail) <= 2000),
  created_at timestamptz not null default now()
);

comment on table public.case_events is
  'Append-only timeline for a case. Updates are refused by trigger for every role, including the service role: an exported report rests on this history, so it must not be rewritable after the fact.';

create index if not exists case_events_case_idx
  on public.case_events (case_id, created_at);

alter table public.case_events enable row level security;

drop policy if exists "events readable through owned case" on public.case_events;
create policy "events readable through owned case"
  on public.case_events for select
  to authenticated
  using (exists (
    select 1 from public.cases c
     where c.id = case_events.case_id
       and c.user_id = (select auth.uid())
  ));

drop policy if exists "events appendable to owned case" on public.case_events;
create policy "events appendable to owned case"
  on public.case_events for insert
  to authenticated
  with check (exists (
    select 1 from public.cases c
     where c.id = case_events.case_id
       and c.user_id = (select auth.uid())
  ));

/*
 * Deliberately no update and no delete policy, and only select+insert granted.
 * Deleting the case still removes its events, because a cascade is performed by
 * the system rather than by the policy — so the user's right to delete their
 * own data is intact while the timeline of a live case stays append-only.
 */
grant select, insert on public.case_events to authenticated;

/* ------------------------------------------------------- consent receipts */

create table if not exists public.consent_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capability text not null
    check (capability in (
      'deterministic_rules', 'live_url_checks', 'cloud_ai', 'qr_parsing',
      'account_sync', 'notification_monitoring', 'call_screening', 'sms_filtering'
    )),
  granted boolean not null,
  /*
   * Which wording the user actually agreed to. Without this, "you consented"
   * is an unfalsifiable claim: the text can change and the record would still
   * read as agreement to the current version.
   */
  policy_version text not null,
  created_at timestamptz not null default now()
);

comment on table public.consent_receipts is
  'Append-only consent history. A revocation is a new row with granted=false, never an edit, so the record shows what was agreed and when it changed.';
comment on column public.consent_receipts.policy_version is
  'The version of the disclosure the user saw. Consent to an older wording is not consent to a newer one.';

create index if not exists consent_receipts_user_idx
  on public.consent_receipts (user_id, capability, created_at desc);

alter table public.consent_receipts enable row level security;

drop policy if exists "consent owner can read" on public.consent_receipts;
create policy "consent owner can read"
  on public.consent_receipts for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "consent owner can append" on public.consent_receipts;
create policy "consent owner can append"
  on public.consent_receipts for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Append-only for the same reason as events: a consent record that can be
-- edited is not evidence of anything.
grant select, insert on public.consent_receipts to authenticated;

/* ------------------------------------------------------- append-only ----- */

/*
 * Refuse updates outright.
 *
 * The RLS policies above already withhold UPDATE from browser roles, but the
 * service role bypasses RLS, so "append-only" would have been a convention the
 * server could break by accident. A trigger applies to every role, so the
 * guarantee is real and a mistaken server-side update fails loudly instead of
 * silently rewriting history an exported report already cites.
 *
 * DELETE is deliberately still permitted: deleting a case or an account must
 * cascade, and a person's right to remove their own data outranks the audit
 * trail of a case that no longer exists.
 */
create or replace function public.refuse_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception
    'relation %.% is append-only; rows cannot be updated',
    tg_table_schema, tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

drop trigger if exists case_events_append_only on public.case_events;
create trigger case_events_append_only
  before update on public.case_events
  for each row execute function public.refuse_update();

drop trigger if exists consent_receipts_append_only on public.consent_receipts;
create trigger consent_receipts_append_only
  before update on public.consent_receipts
  for each row execute function public.refuse_update();

/* ---------------------------------------------------------- updated_at ---- */

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cases_touch_updated_at on public.cases;
create trigger cases_touch_updated_at
  before update on public.cases
  for each row execute function public.touch_updated_at();

commit;
