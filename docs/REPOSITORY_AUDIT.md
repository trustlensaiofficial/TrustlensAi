# Repository Audit — Step 1

**Branch:** `product/real-platform-foundation` · **From:** `fb2e043` (matches the brief) · **Date:** 2026-11-04
**Last updated:** 2026-11-04, after Steps 1–6. See §7 for what has since been closed.

This is the state of the code as it exists, not as the slides describe it. Everything below was
verified by inspection, not inferred.

---

## 1. What actually exists and works

| Area | State | Evidence |
|---|---|---|
| Detection engine | **Working** — generic, context and Tamil rule groups, each recording exact matched spans (real per-kind counts in `docs/ARCHITECTURE.md` §2.1) | `lib/analysis/detectors.ts`, `context-rules.ts`, `tanglish.ts` |
| Orchestration | **Working** — rules → offline URL → optional live evidence → optional model | `lib/analysis/orchestrator.ts` (304 LOC) |
| URL analysis | **Working** — lookalike/typosquat/punycode/shortener detection | `lib/analysis/url.ts` (362 LOC) |
| SSRF guard | **Working** — loopback, link-local, `169.254.x` metadata blocked; redirects revalidated; timeout and size caps | `lib/analysis/evidence.ts` (362 LOC) |
| Provenance | **Working** — `deterministic` / `retrieved` / `model_inference`, never blended | `lib/analysis/types.ts` |
| Incident response | **Working** — 12 contract action states, routed channels, recovery-scam warning | `lib/incident/recovery-plan.ts`; `lib/analysis/response-plan.ts` is now a shim over it |
| Kaval assistant | **Working** — local safety answers with no cloud dependency | `lib/assistant/local-answers.ts` |
| Campaign matching | **Working, synthetic data** — union-find grouping, HMAC phone tokens, corroboration by distinct reporter | `lib/threat-intel/` |
| Persistence | **Working** — Supabase, RLS enabled on all three tables with owner-scoped policies | 9 migrations |
| Web client | **Working** — 13 routes | `app/**/page.tsx` |
| Tests | **198 passing**, 21 files | `tests/` |

**Secrets posture is sound.** `SUPABASE_SERVICE_ROLE_KEY` is read only through `process.env` in
`lib/store.ts`, server-side. No secret appears in any `NEXT_PUBLIC_*` variable, and no secret is
reachable from a browser bundle.

---

## 2. Release blockers found

### B1 — Rate limiting is per-instance, not shared  *(brief names this explicitly)*

`lib/ratelimit.ts:20` is `const buckets = new Map<string, Bucket>()`. On Vercel every serverless
instance holds its own Map, so the effective limit is `configured_limit × instance_count` and
resets on cold start. This is not abuse protection at production scale.

**Fix:** a shared store with atomic increment. Phase 1 work.

### B2 — No API versioning

Endpoints are `/api/analyze`, `/api/report/[id]`, `/api/account/history`. The brief requires
`/api/v1/*`, and mobile clients cannot be shipped against an unversioned contract — a breaking
change would strand every installed app.

### B3 — No API contract document

No `docs/openapi.yaml`. The frontend owner has nothing authoritative to build against, which is
exactly the failure mode the brief warns about ("do not let either side build against invented
APIs").

### B4 — No case model

`consent`, `cases`, `artifacts`, `recovery_plans` and `devices` tables: **zero migrations each.**
The product is currently one-shot analyses with no case lifecycle, so Modules 6 and 7 of the brief
have no storage behind them.

---

## 3. Gaps against the brief

| Brief requirement | State |
|---|---|
| Module 5 — QR / UPI parsing | **Not implemented.** No QR decoder, no `upi://` URI parser. Current matches are scam *rules* mentioning UPI, not payment parsing |
| Module 6 — Case management | **Not implemented.** No lifecycle, no artifact linkage |
| Module 10 — Consent per capability | **Not implemented.** No consent receipts, no versioning, no revocation |
| `apps/android` | **Not started** — and not startable here (see below) |
| `apps/ios` | **Not started** |
| `packages/contracts` | **Not started** |
| Threat-intel providers | **Abstraction absent.** No Web Risk / URLhaus integration; no freshness or staleness labelling |
| Benchmark dataset | **Partial.** Regression tests cover malicious and benign cases per language, but there is no versioned labelled corpus and **no measured precision or recall** |

---

## 4. Hard environment blocker

**No Android toolchain on this machine.** Verified: `adb`, `gradle`, `sdkmanager`, `emulator` and
`kotlinc` are all absent; `ANDROID_HOME` and `ANDROID_SDK_ROOT` are unset; there is no
`~/Library/Android/sdk`. Only `/usr/bin/java` exists.

Phase 3 (native Android) therefore cannot be built or tested in this environment. The correct
output here is the **permission model, capability matrix and API contract** the Android app will
consume, so that work is ready the moment a machine with the SDK is available. Shipping an
unbuildable module, or a simulator described as a device integration, would be worse than
shipping nothing.

---

## 5. Documentation conflicts to resolve

- The DEXATHON deck claims a **Python Flask backend**. The repository is Next.js/TypeScript.
  A real Flask service now exists at `services/analysis-api` implementing the deterministic rules
  with 40 of its own tests — but the Next.js app remains the production backend, and the brief is
  explicit that one coherent architecture should stand unless a documented investigation proves
  otherwise. That investigation has not been done; the service is a second runtime of the rule
  layer, not a replacement.
- `docs/DEXATHON_FINAL_ROUND_PLAYBOOK.md` and `TRUSTLENS_AI_SHOWCASE_PROMPT.md` describe the
  hackathon framing. They should be archived rather than deleted, so the history is intact but no
  longer reads as current product direction.

---

## 6. Recommended immediate order

1. **B3** — write `docs/openapi.yaml` and the platform capability matrix. Nothing else can be
   built in parallel by two owners until the contract exists.
2. **B4** — case, artifact, consent and event schema as additive migrations.
3. **B2** — introduce `/api/v1`, keeping the current routes as deprecated aliases so the web
   client never breaks mid-migration.
4. **B1** — shared rate limiting.
5. Module 5 — QR and UPI parsing, which is the clearest differentiator the brief identifies and
   is fully buildable on the web platform today.

Nothing in this list requires deleting working code.


---

## 7. Closed since this audit was written

All four release blockers are addressed in code on this branch. Two of the four
need a migration applied before they take effect in a deployment, and that is
deliberately not done from here.

| ID | Was | Now |
|---|---|---|
| **B1** | Rate limiting per-instance | Shared Postgres counter via atomic `INSERT .. ON CONFLICT DO UPDATE`. Falls back to the in-process limiter rather than failing open, and reports the scope it actually enforced at in `X-RateLimit-Scope` and `/api/health`. **Migration not applied** — until it is, every deployment honestly reports `instance` |
| **B2** | No API versioning | `POST /api/v1/analyses`, `GET /api/v1/capabilities`, `POST /api/v1/recovery-plan`. `/api/analyze` is a deprecated alias onto the same handler with `Deprecation: true` and a successor `Link` |
| **B3** | No API contract | `docs/openapi.yaml` — 11 paths, 16 schemas, validated |
| **B4** | No case model | `cases`, `case_artifacts`, `case_events`, `consent_receipts`, every CHECK matching a contract enum. Append-only enforced by trigger, not convention. **Migration not applied** |

### Gaps from §3 now closed

- **Module 5 — QR / UPI parsing:** implemented in `lib/analysis/payment-action.ts`, wired into
  the orchestrator, and reaching `report.paymentAction` in the API response. 27 tests.
- **Incident response:** extended from 7 ad-hoc states to the contract's 12, with routed official
  channels, the fake-recovery-agent warning, and a mandatory disclaimer. 41 tests.
- **Capability reporting:** `lib/capabilities.ts` plus `GET /api/v1/capabilities`, naming the exact
  platform API per OS. 22 tests.

### Still open

- Module 6 — case endpoints. The schema exists; the routes do not.
- Module 10 — consent endpoints. Same.
- Threat-intelligence provider abstraction. Not started.
- `packages/contracts` typed client. Not started.
- **Benchmark corpus with measured precision and recall.** Still absent, and
  `docs/PRODUCT_CHARTER.md` §6 gates every public accuracy claim on it.
- `apps/android` — unchanged, and still unbuildable here (§4).

### Two migrations await an owner decision

Neither `20261104173000_shared_rate_limits.sql` nor `20261104174500_case_model.sql` has been
applied to any database. Both are additive — `create table if not exists`, `create or replace
function`, no drops of anything that holds data — but applying a migration to the canonical
project is an owner action, not an agent one, and the code is written to degrade honestly until
they land rather than to assume they have.

Test count across the branch: **298 passing**, 26 files.
