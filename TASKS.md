# TASKS.md — current state

Live working state. Read with [`AGENTS.md`](./AGENTS.md).
**Last updated:** 2026-10-28 · by the desktop coding agent (Claude Code).

---

## Blockers — owner action required

| # | Blocker | Who | Why it matters |
|---|---|---|---|
| B1 | **Canonical Vercel project is ambiguous.** Owner named `trustlensai` for the Supabase integration but `trustlensai-u2r6` for the judge-facing URL. | Owner | Deployment target cannot be chosen. Code is identical either way, so this blocks *only* deployment. |
| B2 | **No AI credential anywhere.** Verified live: `/api/ai` on the existing preview returned HTTP 503. | Owner | Contextual layer cannot run. App still works and says so honestly. |
| B3 | **Supabase not attached to the intended project.** All 16 integration vars sit on `trustlensaivoid.`; `trustlensai` has zero. | Owner | No report persistence, so History cannot reload reports. |
| B4 | **Vercel Authentication is ON for all four projects** (`ssoProtection: all_except_custom_domains`). Unauthenticated request returned HTTP 302 to a login wall. | Owner | **Judges would hit a login screen.** Not changed — owner has not authorised a security change. |
| B5 | **`scans` table does not exist yet.** Migration written, not applied. | Owner / browser agent | Writes fail until applied. The app degrades honestly rather than erroring. |

### Exact owner steps

**B2 — AI credential (pick one).** The code accepts either, no change needed:
- Preferred: create a key at <https://vercel.com/ai-gateway>, then add
  `AI_GATEWAY_API_KEY` to the canonical project for **Production, Preview and
  Development**. Confirm the gateway has credit — the team is on the Hobby plan.
- Alternative: add `ANTHROPIC_API_KEY` instead.

**B3 — Supabase.** Vercel → *canonical project* → Integrations → Supabase →
connect the existing project → scope to Production + Preview + Development.
This injects all 16 variables, including the two the code reads
(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Do **not** copy
values by hand.

**B5 — migration.** Supabase dashboard → SQL Editor → paste and run
`supabase/migrations/0001_scans.sql`. It is additive: it creates one table and
one index, drops nothing, and alters no existing policy.

**B4 — judge access.** Vercel → *canonical project* → Settings → Deployment
Protection → turn **Vercel Authentication off** for Production only. Reversible
in one click. Not done without explicit authorisation.

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
