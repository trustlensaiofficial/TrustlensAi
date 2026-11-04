# Architecture — Step 4

**Date:** 2026-11-04 · **Authoritative contract:** `docs/openapi.yaml`

One sentence, because the rest of this document is the consequence of it:

> **Deterministic work runs first and the model only ever reasons over what has already been
> established — so the product can promise it never claims a check it did not perform.**

---

## 1. Runtime

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| Web app + API | Next.js 16 App Router on Vercel, Node runtime | One deployable, one language across client and server. Node rather than Edge because the SSRF guard needs real DNS resolution, which the Edge runtime does not provide |
| Database | Supabase Postgres, RLS on every table | RLS means a leaked publishable key reads nothing. Policies are the floor, not the only control |
| Auth | Supabase Auth — Google OAuth and passkeys only | No email/password, so there is no password of ours to leak, reuse, or phish |
| AI | Vercel AI Gateway, `anthropic/claude-sonnet-5` | A gateway rather than a direct key, so the provider can change without a code change. **Currently billing-blocked; the product degrades honestly** |
| Tests | Vitest, 298 across 26 files | — |
| Second rule runtime | Flask at `services/analysis-api` | A second runtime of the rule layer, **not** the production backend. See §7 |

### Why one backend and not two

The DEXATHON deck claimed a Python backend. A real Flask service now exists and passes its own 40
tests, but the Next.js app remains the production backend. `docs/PRODUCT_CHARTER.md` §9 records this
as a decision rather than an accident: two backends means two places for a safety rule to be
stale, and no documented investigation has justified the cost.

---

## 2. The pipeline, in order

`lib/analysis/orchestrator.ts`. The order is the architecture.

```
1. Deterministic text rules      generic + context + Tamil (counts in §2.1)
2. Payment-action reading        upi:// parsing, QR payload, direction of money
3. Offline link structure        lookalike, punycode, typosquat, shortener — no network
4. Live evidence                 DNS + HTTP, behind the SSRF guard. Off by default
5. Severity ordering             worst first
6. Contextual layer              the model, given ONLY steps 1–5 as material
```

**Steps 1–3 need no network and no credential.** That is why the product still works when the AI
provider is down, when the database is unconfigured, and when the device is offline — and why
"degraded" is not an error state. A report with no model commentary is complete: rules, evidence,
payment reading and next steps are all there.

### 2.1 How many rules actually apply

The honest answer is "it depends on the input", which is why the report states the figure it
actually used rather than a headline number.

| Group | Count | Applies when |
|---|---|---|
| Generic — message | 14 | input classified as a message |
| Generic — url | 14 | input classified as a link |
| Generic — claim | 17 | input classified as a claim |
| Context — bank scam | 7 | user declared that context |
| Context — job offer | 6 | ” |
| Context — proposal | 4 | ” |
| Context — invoice | 3 | ” |
| Context — generic / website | 0 | no context-specific rules exist yet |
| Tamil in Latin script | 7 | always, unconditionally |

Tamil rules run unconditionally rather than behind language detection, because real messages mix
languages freely — an English bank name with the demand in Tamil is the norm, and gating on a
detected language would miss most of them.

So a declared bank-scam message is checked against 28 rules, and a plain message against 21.
`assessment.summary` quotes the number that applied to *that* input, which is the only figure that
means anything.

### Why payment reading sits at step 2

It depends on nothing downstream, and its strongest output — a refund claim paired with a debit
mechanism — is a *deterministic* finding. Running it early means it is available to order the
checklist and to raise a critical signal before any network call has been considered.

### What step 6 is allowed to do

The model receives the signals and evidence already established and may add interpretation,
suggested checks and unknowns. It may not introduce a fact. Everything it returns is labelled
`model_inference` and is never merged into a `deterministic` list — `docs/FRONTEND_HANDOFF.md` §4
makes that a rendering rule too, so the separation survives into the interface.

---

## 3. Module map

```
lib/
  analysis/
    orchestrator.ts      the pipeline above
    detectors.ts         generic rules, each recording its matched span
    context-rules.ts     20 rules across 4 contexts, fired only when declared
    tanglish.ts          7 Tamil-in-Latin-script rule groups
    payment-action.ts    what is this asking me to do with money  ← the differentiator
    url.ts               offline link structure
    evidence.ts          live retrieval behind the SSRF guard
    llm.ts               the contextual layer and its honest probe
    checklist.ts         next steps, by signal category
    types.ts             the shared vocabulary, incl. provenance
    response-plan.ts     shim over lib/incident
  incident/
    recovery-plan.ts     12 action states, routed channels, mandatory disclaimer
  threat-intel/
    indicators.ts        HMAC-keyed phone tokens, UPI extraction
  capabilities.ts        the per-OS mechanism matrix
  ratelimit.ts           shared counter, never fails open
  store.ts               persistence; the only holder of the service-role key
  api/analyses.ts        the handler behind /api/v1/analyses and its alias
  offline/               IndexedDB device history
```

### The dependency rule

`lib/analysis/*` imports nothing from `app/`. The pipeline is a pure function of its inputs plus
the network, which is why every rule is testable without a request, and why `services/analysis-api`
could reimplement the rule layer at all.

---

## 4. Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/analyses` | optional | Canonical. `liveChecks` and `allowCloudAi` default **false** |
| GET | `/api/v1/capabilities` | none | Declare `X-TrustLens-Platform`; defaults to `web` |
| POST | `/api/v1/recovery-plan` | **none, deliberately** | Someone whose money just left must not meet a sign-in screen |
| GET | `/api/v1/recovery-plan` | none | The action states a client can offer |
| POST | `/api/analyze` | optional | Deprecated alias. `Deprecation: true` + successor `Link` |
| GET | `/api/health` | none | Probes the provider for real; reports rate-limit scope |
| GET/DELETE | `/api/report/[id]` | optional | Capability URL for guests, owner-scoped when owned |
| GET | `/api/account/history` | required | Filtered by the verified session user |
| POST | `/api/assistant` | optional | Kaval. Answers locally when the model is unavailable |

Case and consent endpoints are specified in `openapi.yaml` and **not yet built**; their schema is.

### Versioning

`/api/v1` exists before any mobile client does, because a breaking change to an unversioned path
strands every installed app. The old paths stay as aliases onto the *same handler* for one release,
so they cannot drift apart mid-migration.

---

## 5. Security architecture

| Control | Where | Property it holds |
|---|---|---|
| SSRF guard | `lib/analysis/evidence.ts` | Scheme allow-list, DNS resolution, private/loopback/link-local/`169.254` metadata blocked, **every redirect hop revalidated**, timeout and size caps |
| Service-role key isolation | `lib/store.ts` | Read only via `process.env`, server-side. Never in a `NEXT_PUBLIC_*` variable, never reachable from a browser bundle |
| RLS | every table | On, with owner-scoped policies against `(select auth.uid())`. Nothing granted to `anon` |
| Append-only audit | `case_events`, `consent_receipts` | Enforced by trigger, so it holds against the service role too — not just a policy the server could bypass by accident |
| Rate limiting | `lib/ratelimit.ts` | Shared counter, atomic increment, **never fails open**, reports the scope it actually enforced |
| Keyed pseudonymisation | `lib/threat-intel/indicators.ts` | HMAC, not bare SHA-256 — ten-digit phone numbers are a 10^10 space that reverses on a laptop |
| Input bounds | every route | Zod with explicit maxima, including a 2KB cap on QR payloads |
| Ownership from session | `lib/api/analyses.ts` | Never from the request body. Asserted by a test that reads the source |

### The refusal is identical to not-found

A report belonging to someone else returns the same response as one that does not exist. Telling a
stranger that an id is real but not theirs confirms the id, which is itself the leak.

---

## 6. What is deliberately absent

- **No client-side risk computation.** The client renders `assessment.level`; it never derives one.
  Otherwise a backend fix for a false positive never reaches the user, and the two can disagree on
  screen while the whole argument of the product is that its findings are traceable.
- **No "safe" verdict.** Not in the enum, by design.
- **No calibrated score.** `signalScore` orders findings. Rendering it as a percentage is forbidden
  because it is not calibrated, and presenting it as one would be the exact overclaim this product
  exists to argue against.
- **No notification monitoring as a core capability.** Demoted after Google shipped it at the OS
  layer on twelve OEMs — `docs/COMPETITOR_RESEARCH.md` §2.
- **No accuracy figure.** Until a labelled corpus with measured precision and recall exists.

---

## 7. Known architectural debt

1. **Two rule runtimes.** `services/analysis-api` duplicates the deterministic layer in Python.
   Either it becomes the single engine or it is archived; the current state is the one the charter
   warns about.
2. **No typed client.** `packages/contracts` would generate from `openapi.yaml` and remove the
   chance of a client shape drifting from the contract by hand.
3. **No threat-intel provider abstraction.** Campaign clustering runs on synthetic data; there is
   no Web Risk or URLhaus integration and no freshness labelling behind one.
4. **Two migrations unapplied.** Shared rate limiting and the case model. Both additive; applying
   them is an owner action.
