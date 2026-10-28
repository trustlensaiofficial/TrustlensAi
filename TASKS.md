# TASKS.md — current state

Live working state. Read with [`AGENTS.md`](./AGENTS.md).
**Last updated:** 2026-10-28 · by the desktop coding agent (Claude Code).

---

## Blockers — owner action required

| # | Blocker | Who | Why it matters |
|---|---|---|---|
| ~~B1~~ | ~~Canonical project ambiguous~~ — **RESOLVED 2026-10-28: `trustlensai-u2r6`.** Owner confirmed when asked a second time with the config evidence laid out. | — | Closed. |
| B2 | **No AI credential anywhere.** Verified live: `/api/ai` on the existing preview returned HTTP 503. | Owner | Contextual layer cannot run. App still works and says so honestly. |
| B3 | **Supabase is wired to the wrong project.** The two public vars went to `trustlensai`, but the canonical project is now `trustlensai-u2r6`, which has only a malformed `SUPABASE_URL` (a base64 blob, Production only). | Owner | No persistence on the canonical project. Needs the Supabase integration attached to **`trustlensai-u2r6`**, and the malformed `SUPABASE_URL` deleted first so it cannot shadow the correct value. |
| ~~B4~~ | ~~Vercel Authentication blocks judges~~ — **RESOLVED 2026-10-28** with the owner's explicit authorisation. `trustlensai-u2r6` is now `ssoProtection: {deploymentType: 'preview'}`: Production is public, Previews stay protected. The other three projects are unchanged. | — | Closed. Rollback: set `deploymentType` back to `all_except_custom_domains`. |
| B5 | **`scans` table does not exist yet.** Migration written, not applied. | Owner / browser agent | Writes fail until applied. The app degrades honestly rather than erroring. |

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

**B4 — judge access.** Done on 2026-10-28 with the owner's authorisation.
`trustlensai-u2r6` Production is public; Previews remain protected.

> **Secrets rule:** paste values only into the Vercel or Supabase dashboard, or
> into a `vercel env add` prompt. Never into chat, a commit, or a screenshot.

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
