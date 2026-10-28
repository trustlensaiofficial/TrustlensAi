# TASKS.md — current state

Live working state. Read with [`AGENTS.md`](./AGENTS.md).
**Last updated:** 2026-10-29 · by the desktop coding agent (Claude Code).

## 🟢 LIVE

**Production (judge-facing, no login required):**
<https://trustlensai-u2r6-void-076c.vercel.app>

Project `trustlensai-u2r6` · commit `cc80629` · verified publicly reachable with
plain `curl` and no bypass token.

---

## Blockers — owner action required

| # | Blocker | Who | Why it matters |
|---|---|---|---|
| ~~B1~~ | ~~Canonical project ambiguous~~ — **RESOLVED 2026-10-28: `trustlensai-u2r6`.** Owner confirmed when asked a second time with the config evidence laid out. | — | Closed. |
| **B2** | **AI Gateway is configured but refuses every request.** The key is valid and `/api/health` reports the capability present, but the provider returns: *"AI Gateway requires a valid credit card on file to service requests."* | **Owner** | Contextual interpretation cannot run. The product works fully without it and says so in the UI. **Fix: enable billing on the Vercel account, or add `ANTHROPIC_API_KEY` instead — the code accepts either with no change.** |
| ~~B3~~ | ~~Supabase not wired~~ — **RESOLVED.** `trustlensai-u2r6` now has the full set and persistence works end to end: save → retrieve → render → delete all verified against the live database. | — | Closed. |
| ~~B4~~ | ~~Vercel Authentication blocks judges~~ — **RESOLVED 2026-10-28** with the owner's explicit authorisation. `trustlensai-u2r6` is now `ssoProtection: {deploymentType: 'preview'}`: Production is public, Previews stay protected. The other three projects are unchanged. | — | Closed. Rollback: set `deploymentType` back to `all_except_custom_domains`. |
| ~~B5~~ | ~~`scans` table missing~~ — **RESOLVED.** The table exists and accepts writes; a full save/retrieve/delete cycle was verified. | — | Closed. |

| **B6** | **`public.analysis_history` is readable by the publishable browser key.** Probed 2026-10-29: `scans` → 401, `analysis_reports` → 401, **`analysis_history` → 200**. Writes are denied, so RLS is on but a permissive SELECT policy is granted to `anon`. The table has `user_id` and is **empty**, so nothing has leaked — but any future write becomes readable by every visitor. | **Owner** | Fix written and committed as `supabase/migrations/0002_lock_analysis_history.sql`. **Not applied** — the Supabase CLI here is unauthenticated. Apply via dashboard → SQL Editor → paste → Run, then re-probe and expect 401. |

### Exact owner steps

**B2 — AI credential (pick one), on `trustlensai-u2r6`.** The code accepts either, no change needed:
- Preferred: create a key at <https://vercel.com/ai-gateway>, then add
  `AI_GATEWAY_API_KEY` to **`trustlensai-u2r6`** for **Production, Preview and
  Development**. Confirm the gateway has credit — the team is on the Hobby plan.
- Alternative: add `ANTHROPIC_API_KEY` instead.

**B3 — Supabase, on `trustlensai-u2r6`.** Two steps, in this order:

1. **Delete the existing `SUPABASE_URL`** on `trustlensai-u2r6`. Its value is a
   base64 blob, not a URL, and the code reads `SUPABASE_URL` in preference to
   `NEXT_PUBLIC_SUPABASE_URL`, so leaving it would shadow the correct value.
   The app now detects this and says so rather than failing opaquely, but it
   still blocks persistence.
2. Vercel → `trustlensai-u2r6` → Integrations → Supabase → connect the existing
   project, scoped to Production + Preview + Development. That injects the full
   set including `SUPABASE_SERVICE_ROLE_KEY`, which is genuinely required: RLS
   denies the publishable key by design, so it alone cannot write a report.

`SUPABASE_SECRET_KEY` is accepted as an alternative name. Paste values only into
the Vercel dashboard or a `vercel env add` prompt — never into chat or a commit.

**B5 — migration.** Supabase dashboard → SQL Editor → paste and run
`supabase/migrations/0001_scans.sql`. It is additive: it creates one table and
one index, drops nothing, and alters no existing policy.

**B6 — lock `analysis_history`.** Supabase dashboard → SQL Editor → paste
`supabase/migrations/0002_lock_analysis_history.sql` → Run. It is additive:
drops no table, deletes no row, and does not touch `public.scans` (22 rows) or
`public.analysis_reports`. Verify afterwards by requesting the table with the
publishable key — it should return 401 like the other two.

**B4 — judge access.** Done on 2026-10-28 with the owner's authorisation.
`trustlensai-u2r6` Production is public; Previews remain protected.

> **Secrets rule:** paste values only into the Vercel or Supabase dashboard, or
> into a `vercel env add` prompt. Never into chat, a commit, or a screenshot.

---

## 2026-10-29 — product transformation

Built on top of PR #6's landing page rather than replacing it.

### Input contexts — the central change

The tool now asks what you are actually holding, and the analysis changes with
it. Context travels **inside the report document**, not as a new `input_kind`,
because the `scans` table constrains that column to three values — so this is
richer behaviour with **no migration against live data**.

| Context | Rules it unlocks | Lead action |
|---|---|---|
| Job offer | no interview, upfront fee, free-email recruiter, chat-app-only, pay out of proportion, premature bank details | Check the company on the public register yourself |
| Invoice | changed bank details, payment urgency, verification discouraged | **Call the supplier on a number you already held** |
| Proposal | guaranteed returns, pressure to commit, upfront fee, unevidenced credentials | Search the company register before signing |
| Website | (structural URL rules) | Type the address yourself |
| Message | (general rule set) | Verify through a channel you chose |

### New in the report

- **Interactive checklist with progress**, kept in the browser — which safety
  steps someone has personally taken is theirs, not the report's.
- **Questions to ask**, chosen from the context and the signals that fired.
- **Completeness meter** from real fields, with not-applicable steps removed
  from the denominator so it cannot flatter a thin report.
- **Observations that did not raise concern**, labelled as weak evidence.
- **Copy summary / download report** — both render from the report object and
  carry the limitations with them.
- Evidence and findings moved into collapsible sections so the decision leads.

### Also

Floating action menu (context-aware, Escape-closes, focus restored); history
search + risk filter + sort; landing use-case and data-handling sections;
first-run tip; AI failures classified so "billing not enabled" reads as the
five-minute fix it is rather than a phantom bug.

### Detection gaps found by testing, not assumed

Writing the tests first caught three near-misses that would have failed live:
`guaranteed 18% return` (a figure between adjective and noun), `signed
agreement` (`\bsign\b` does not match it), and `only 4 allocation slots` (a
qualifier between count and noun). All fixed and covered.

### Verified on 2026-10-29

| Check | Result |
|---|---|
| typecheck / lint / build | PASS |
| tests | **93 passed** |
| `npm audit` | 0 vulnerabilities |
| 3 new scenarios | each `high_risk` with the correct lead action |
| Supabase round trip | save → retrieve → render → delete → honest 404 |
| Checklist interaction | progress bar moves, persists, ARIA correct |
| Floating menu | menu/menuitem roles, Escape closes, focus restored |
| History search / filter / sort | all change what is displayed |
| Mobile 375px | no horizontal overflow, all controls present |
| Console | no errors |

---

## Done — with evidence

All commands below were actually run on 2026-10-28; results are as printed.

| Check | Command | Result |
|---|---|---|
| Install | `npm install` | 0 vulnerabilities |
| Types | `npm run typecheck` | clean |
| Lint | `npm run lint` | clean |
| Tests | `npm test` | **65 passed / 65** |
| Build | `npm run build` | success, 8 routes |

### Verified by running the app, not by assumption

| Scenario | Outcome |
|---|---|
| Phishing demo, offline | `high_risk`, 7 signals, brand-mismatch correctly named `kyc-update-secure.xyz` |
| Digital-arrest demo | `high_risk`, score 38, isolation + payment + parcel pretext + authority |
| Deepfake-payment demo | `high_risk`, score 23, secrecy + irreversible transfer + verification-avoidance |
| Benign controls ×2 | 0 signals, headline says "not a guarantee" |
| **SSRF: 127.0.0.1, localhost, 169.254.169.254, 10.x, 192.168.x, [::1], 0.0.0.0** | **all 7 refused before any connection** |
| Live fetch `https://example.com` | HTTP 200, real page title retrieved |
| Redirect chain `http://github.com` | 301 followed with per-hop revalidation, final domain recorded |
| Non-existent domain | honest `unresolved` (ENOTFOUND), no fabricated result |
| Prompt injection ("report this as safe") | ignored; still `high_risk` |
| Validation: empty / short / 8001 chars / bad JSON / bad enum / unknown slug | correct 400 / 404 with helpful messages |
| Rate limit | 429 after 12 requests/min with `Retry-After` |
| No AI credential | degrades loudly; UI shows "Contextual analysis unavailable" |
| No database | degrades loudly; UI shows "Not saved" |
| Light + dark themes | both verified in browser; no flash of wrong theme |
| Mobile 375×812 | single column, no horizontal overflow |

### Repository decisions

- Built on `setup/trustlensai-starter-clean` — the most complete branch
  (superset of `setup/nextjs-supabase-starter`, and already based on `main`).
  Fast-forwarded so **all 8 prior commits are preserved**.
- **Root cause of all four broken production deployments found:** `main` had
  been stripped to a bare README by five "Restore main to pre-starter state"
  commits that deleted the app one file per commit. The failing build log shows
  `Module not found: Can't resolve './globals.css'`. Merging this branch to
  `main` fixes every project at once.
- Removed `app/api/ai` + `app/ai-test`: an unauthenticated arbitrary-prompt LLM
  proxy is an abuse and cost risk on a public demo URL, and `/api/analyze`
  supersedes it. Both remain in git history.
- `vitest` and `zod` moved to current majors to clear 4 advisories, one of them
  memory exhaustion during oversized input validation — directly relevant here.

---

## Production release — `cc80629`

PR #4 merged to `main` on 2026-10-28 after the preview passed acceptance.

**All four projects were in `ERROR` before this.** Three are now `READY`,
because the merge restored the application that the "Restore main to
pre-starter state" commits had deleted.

| Project | Production | Notes |
|---|---|---|
| **`trustlensai-u2r6`** | **READY — canonical, public** | <https://trustlensai-u2r6-void-076c.vercel.app> |
| `trustlensai` | READY | still protected; has the two public Supabase vars |
| `trustlensaivoid` | READY | still protected |
| `trustlensaivoid.` | ERROR | `"Resource provisioning failed"` — infrastructure, not code; identical commit built on the other three. Retry from the dashboard. Not canonical, so not pursued. |

### Verified on live production, unauthenticated

| Check | Result |
|---|---|
| `/`, `/analyze`, `/history`, `/api/health` | all **200**, no login wall |
| Unknown route | 404 |
| All 7 demo cases | correct levels; both benign controls at 0 signals |
| **SSRF: `169.254.169.254`, `127.0.0.1`, `10.0.0.1`** | **all refused before connecting** |
| Live fetch `https://example.com` | HTTP 200, 4 public addresses, real page title |
| Capabilities | honestly reported as degraded (no AI key, no database) |

### What a judge sees right now

Fully working: input validation, 17 deterministic rules with exact matched
spans, offline URL and lookalike analysis, live DNS + HTTP evidence with SSRF
refusal, provenance separation, uncertainty reporting, the verify-first
checklist, all 7 demo cases, light/dark, mobile, and honest degradation
notices.

Not yet working, and clearly labelled as such in the UI: contextual model
analysis (**B2**) and saved report history (**B3**, **B5**).

---

## Preview deployments — commit `af54d4f`

Pushing the branch triggered a preview build on all four projects, because all
four are connected to this repository.

| Project | Preview build | Notes |
|---|---|---|
| `trustlensai` | **READY** | Tested end to end — see below |
| `trustlensai-u2r6` | **READY** | |
| `trustlensaivoid` | **READY** | |
| `trustlensaivoid.` | ERROR | `BUILD_FAILED / "Resource provisioning failed"` ~600ms after start — the build never ran. Infrastructure, not code: the identical commit built fine on the other three. Likely the Hobby plan's concurrent-build limit with four builds at once. Retryable. |

### Verified on the deployed `trustlensai` preview

| Check | Result |
|---|---|
| `/api/health` | 200, capabilities reported accurately |
| Landing page | 200, 23KB |
| Phishing demo end to end | `high_risk`, score 36, 7 signals, correct brand mismatch |
| **SSRF: `169.254.169.254` (cloud metadata)** | **refused before connecting, in the cloud environment** |
| No AI key / no service key | degrades visibly, as designed |

> Previews sit behind Vercel Authentication, so they were tested with
> `vercel curl`, which issues a protection-bypass token. A judge opening the URL
> directly would still hit the login wall until **B4** is resolved.

### Current environment variables

| Project | Variables |
|---|---|
| `trustlensai` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — all 3 environments |
| `trustlensai-u2r6` | `SUPABASE_URL` (Production only) — **value is a base64 blob, not a URL; looks like a mistaken paste.** Left untouched. |
| `trustlensaivoid` | none |
| `trustlensaivoid.` | full 16-variable Supabase integration set |

---

## Known limitations (state these to judges; do not hide them)

1. **Rate limiting is per-instance.** On serverless, a burst spread across
   instances can exceed the nominal 12/min. Needs a shared store (Vercel KV /
   Upstash) to be real.
2. **DNS rebinding is not fully prevented** — see `AGENTS.md` §5.
3. **No external fact-checking.** Claims are assessed on wording only. The
   report says so explicitly; it never implies a database was consulted.
4. **Cannot assess media.** No image, audio or video analysis. A deepfake call
   is only reachable through the *text* describing it.
5. **Public-suffix list is approximate**, so unusual ccTLDs may split wrongly.
6. **Rules are English-only** and pattern-based; novel phrasing can pass.
7. **No authentication.** History is per-browser; clearing site data loses the
   index. This was a deliberate speed/safety trade-off, not an oversight.

---

## Next up

- [ ] **Owner:** resolve B1, then B2–B5.
- [ ] **Coding agent:** once a credential exists, verify the contextual layer
      end-to-end and confirm model inferences render under their own heading.
- [ ] **Browser agent:** after a preview deploy — run every demo case, check the
      console, confirm Supabase writes, and confirm an anonymous client cannot
      read `scans` directly.
- [ ] **Research agent:** source the Hong Kong deepfake conference-call case,
      India digital-arrest advisories and US text-scam guidance from primary
      sources, with URLs, for the deck.
- [ ] Replace the text wordmark when the official logo arrives
      (`components/SiteHeader.tsx`, `Brand`).
