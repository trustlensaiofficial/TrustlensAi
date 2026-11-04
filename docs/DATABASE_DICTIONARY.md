# Database Dictionary — Step 4

**Date:** 2026-11-04 · **Source of truth:** `supabase/migrations/*.sql`

Every table, every column, and — where it is the interesting part — why the column exists at all.
All eleven migrations parse against the real Postgres grammar (`libpg_query`).

**Applied state:** the two migrations dated `20261104` are **written but not applied to any
database**. Both are additive. Applying them to the canonical project is an owner action.

---

## 1. Access model, in one table

| Table | RLS | Browser-role policies | Reachable by `anon`? |
|---|---|---|---|
| `scans` | on | **none** — server-side access only, via the service-role key | No |
| `analysis_history` | on | owner-scoped select / insert / delete | No |
| `analysis_reports` | on | owner-scoped select / insert / delete | No |
| `cases` | on | owner-scoped select / insert / update / delete | No |
| `case_artifacts` | on | owner-scoped via the parent case; **no update** | No |
| `case_events` | on | select + insert only; **UPDATE refused by trigger** | No |
| `consent_receipts` | on | select + insert only; **UPDATE refused by trigger** | No |
| `rate_limits` | on | **none** — service role only | No |

Two different postures appear here on purpose. `scans` predates account sign-in and is reached only
through server code holding the service-role key. The case tables use owner-scoped policies against
`(select auth.uid())`, which is the stronger pattern for anything a client might one day read
directly.

`(select auth.uid())` rather than bare `auth.uid()` so Postgres evaluates it once per statement
instead of once per row.

---

## 2. `scans` — one-shot analyses

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Also the capability URL for a guest report. Unguessable by construction |
| `input_kind` | text | CHECK limited to `message` / `url` / `claim` |
| `input_preview` | text | Truncated, display-safe echo. Never the full input |
| `assessment_level` | text | Denormalised for listing without parsing the document |
| `signal_score` | integer | Ordering aid. **Not a probability** |
| `report` | jsonb | The full report document |
| `is_demo` | boolean | True for curated examples shown to reviewers |
| `created_at` | timestamptz | |
| `user_id` | uuid → `auth.users` `on delete set null` | NULL for guests. `set null`, not `cascade`: a deleted account should not silently destroy a report whose capability URL someone else may hold |

Rich context lives inside `report` rather than in a column, because `input_kind` carries a CHECK
constraint and widening it would mean a migration against live data for every new product context.

**Reads are normalised on the way out.** A row written before `paymentAction` existed has no such
key, so `getReport` fills it with `null`. Every report leaving `lib/store.ts` therefore has one
shape, and no caller has to tell "field missing" from "genuinely no payment instruction".

---

## 3. `cases` — an investigation, not a message

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → `auth.users` `on delete cascade` | **NOT NULL.** Cases require an account; guests keep device-local reports and lose nothing else |
| `title` | text | Defaults to `'Untitled case'` |
| `status` | text | CHECK over the 9 `CaseStatus` values in the contract |
| `context` | text | CHECK over the 6 `InputContext` values |
| `furthest_action` | text, nullable | CHECK over the 12 `UserActionState` values |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by the `cases_touch_updated_at` trigger |

Index: `cases_user_updated_idx (user_id, updated_at desc)` — the shape of the case list.

### Why `furthest_action` and not `latest_action`

Someone who transferred money and later says they also opened a link has not become less exposed.
A plan that regressed on the milder later answer would be dangerous advice dressed up as
responsiveness. `furthestAction()` in `lib/incident/recovery-plan.ts` enforces the comparison, and
an exhaustive test over all 144 pairs of states proves no ordering of answers can produce a milder
plan than the worst thing reported.

---

## 4. `case_artifacts` — evidence

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `case_id` | uuid → `cases` `on delete cascade` | |
| `type` | text | CHECK: `message`/`url`/`screenshot`/`qr`/`email`/`sender_info`/`note` |
| `text` | text, nullable | CHECK ≤ 8000 chars, matching the contract |
| `url` | text, nullable | |
| `storage_object_path` | text, nullable | Path in a **private** bucket, never a public URL. Ownership revalidated server-side on every read: a path is not a capability |
| `sender_label` | text, nullable | The display name the messaging app showed. `user_supplied` provenance, **never identity** — it is chosen by whoever sent the message |
| `provenance` | text | CHECK over the 6 contract values. Default `user_supplied` |
| `freshness` | text | CHECK: `live`/`cached`/`stale`/`unknown`. Default `unknown` |
| `provider` | text, nullable | Which service produced a `retrieved` artifact |
| `retrieved_at` | timestamptz, nullable | |
| `redacted` | boolean | |
| `created_at` | timestamptz | |

Index: `case_artifacts_case_idx (case_id, created_at)`.

**No UPDATE policy, and no update grant.** Evidence is added or removed, never quietly edited: a
report that cites an artifact has to cite what was actually collected.

`freshness` being a column rather than a UI convention is what makes "a stale result is never
presented as a live check" enforceable.

---

## 5. `case_events` — append-only timeline

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `case_id` | uuid → `cases` `on delete cascade` | |
| `kind` | text | CHECK: `case_opened`, `artifact_added`, `analysis_run`, `action_reported`, `recovery_plan_generated`, `report_exported`, `status_changed`, `note_added` |
| `action_state` | text, nullable | CHECK over the 12 `UserActionState` values |
| `detail` | text, nullable | CHECK ≤ 2000 chars |
| `created_at` | timestamptz | |

**UPDATE is refused by the `case_events_append_only` trigger**, which raises
`restrict_violation`. RLS already withholds UPDATE from browser roles, but the service role
bypasses RLS — so without the trigger, "append-only" would have been a convention our own server
could break by accident, silently rewriting history that an exported report already cites.

DELETE stays permitted so the case and account cascades work.

---

## 6. `consent_receipts` — append-only consent

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → `auth.users` `on delete cascade` | NOT NULL |
| `capability` | text | CHECK over the 8 `Capability.key` values in the contract |
| `granted` | boolean | A revocation is a **new row with `false`**, never an edit |
| `policy_version` | text | NOT NULL. Which wording the person actually saw |
| `created_at` | timestamptz | |

Index: `consent_receipts_user_idx (user_id, capability, created_at desc)` — current state per
capability is the first row of that group.

### Why `policy_version` is NOT NULL

Without it, "you consented" is unfalsifiable. The disclosure text could change and the old row
would still read as agreement to the new wording. Consent to an older version is not consent to a
newer one, and this column is what makes that checkable.

---

## 7. `rate_limits` — the shared counter

| Column | Type | Notes |
|---|---|---|
| `key` | text PK | An opaque application-supplied token. **Never a raw IP** |
| `window_start` | timestamptz | |
| `count` | integer | |

Index: `rate_limits_window_start_idx (window_start)`, for the prune.

`consume_rate_limit(p_key, p_limit, p_window_seconds)` returns
`(allowed, remaining, retry_after_seconds)`. The whole check is one
`INSERT … ON CONFLICT DO UPDATE`, which takes a row lock and is therefore atomic — two instances
arriving together cannot both read eleven and both allow. A read followed by a write would
reintroduce exactly the race the migration exists to close.

`security definer` with `search_path` pinned to `pg_catalog, public`, so the function cannot be
redirected by a caller's search path. Execute is revoked from `public`, `anon` and `authenticated`
and granted only to `service_role`: an anon caller able to run it could exhaust another client's
allowance by guessing keys.

Rows are pruned opportunistically, roughly once per thousand calls, so the table stays bounded
without depending on a scheduled job existing.

---

## 8. Functions

| Function | Security | Purpose |
|---|---|---|
| `consume_rate_limit(text,int,int)` | `definer`, path pinned, `service_role` only | §7 |
| `refuse_update()` | `definer`, path pinned | Trigger body. Raises `restrict_violation` on any UPDATE |
| `touch_updated_at()` | `definer`, path pinned | Maintains `cases.updated_at` |

---

## 9. Tables in the contract with no schema yet

`recovery_plans` and `devices` appear in planning documents and have **zero migrations**.

`recovery_plans` may never need one: a plan is a pure function of `furthest_action`
(`recoveryPlanFor`), so storing it would mean serving stale advice after the guidance improves. The
case already records `furthest_action` and the timeline records
`recovery_plan_generated`, which is enough to reconstruct what was shown and when.

`devices` is needed before per-device consent and push can work. Not started.
