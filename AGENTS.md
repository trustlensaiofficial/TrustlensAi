# AGENTS.md — TrustLens AI

Permanent project brief. Every agent (coding, browser/infra, research) reads this
before working. Durable decisions live here; moment-to-moment state lives in
[`TASKS.md`](./TASKS.md).

---

## 1. Identity

| | |
|---|---|
| Product | TrustLens AI |
| Team | Reshiram · **DEX26223** |
| Theme / category | Open Innovation · Software |
| Stage | Second round — working prototype |
| Repository (source of truth) | `trustlensaiofficial/TrustlensAi` |
| Vercel team | `void-076c` ("VOID", Hobby plan) |

**Canonical Vercel project: `trustlensai-u2r6`.** Confirmed by the owner on
2026-10-28 (asked twice, same answer). Its Production deployments are public;
Preview deployments remain behind Vercel Authentication. The other three
projects are untouched and still fully protected — do not delete or rename any
of them without the owner's explicit approval.

---

## 2. What the product is

TrustLens AI helps someone decide whether a message, link or claim deserves
their trust **before they act on it**.

The differentiator is not detection. Plenty of tools print a red banner. The
differentiator is that TrustLens shows **its reasoning and the limits of that
reasoning**: which exact words triggered a warning, which checks actually ran,
what could not be established, and what the user should do next through a
channel they control.

### The one rule that governs every decision

> Never present something as known when it is not.

Concretely, this forbids: inventing a source check, implying a scan was
performed when it failed, showing a model guess as a retrieved fact, stating a
confidence number the method cannot support, or telling a user that content is
"safe" or "verified".

---

## 3. Architecture

```
app/
  page.tsx                    landing
  analyze/page.tsx            workspace (client component inside)
  report/[id]/page.tsx        saved report, server-rendered, noindex
  history/page.tsx            per-browser list (localStorage)
  api/analyze/route.ts        POST — analysis (live checks and cloud AI opt-in)
  api/report/[id]/route.ts    GET / DELETE one report, enforcing owner when present
  api/account/history/route.ts authenticated account-only history
  api/health/route.ts         capability report (booleans only, no secrets)

lib/analysis/
  types.ts         shared vocabulary; Provenance is the key type
  normalize.ts     validation + input classification
  detectors.ts     deterministic rules
  context-rules.ts scenario-specific bank/job/invoice/proposal rules
  tanglish.ts      limited Tamil-in-Latin-script detection
  url.ts           offline URL structure + lookalike detection
  evidence.ts      SSRF-hardened network checks
  llm.ts           opt-in contextual layer (gateway OR Anthropic OR degrade)
  checklist.ts     verify-before-you-act step builder
  response-plan.ts action-aware incident response
  orchestrator.ts  pipeline; enforces ordering

lib/store.ts       Supabase persistence (service role only)
lib/ratelimit.ts   best-effort per-instance limiting
lib/history.ts     browser-side history index (external store)
supabase/migrations/0001_scans.sql
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Supabase ·
Vercel AI Gateway or the Anthropic API. No Flask: the inspected code had no
Python, nothing in the design needs it, and a second runtime would not deploy
cleanly on Vercel. Adding one for architectural appearance is explicitly
rejected.

### Pipeline ordering is load-bearing

```
validate → classify → deterministic rules → offline URL structure
         → live evidence (explicit opt-in) → cloud model (explicit opt-in) → report
```

Rules and evidence run **first**, and only their results are handed to the
model. This is what lets us promise the model never claims a check it did not
perform — it is structurally unable to, because it is told what was found and
has no tools of its own.

---

## 4. Provenance: the core mechanism

Every statement in a report is one of three things, and they are never mixed in
the UI:

| Provenance | Meaning | Trust |
|---|---|---|
| `deterministic` | A fixed rule matched. The triggering text is shown. | Reproducible |
| `retrieved` | A check actually ran and returned this. | Observation |
| `model_inference` | A language model's interpretation of the above. | May be wrong |

If you add a new kind of finding, it must declare a provenance. Do not add a
fourth category without updating `ReportView` and this document.

`signalScore` is a weighted severity sum used for ranking only. **It is not a
probability and must never be rendered as a percentage.**

---

## 5. Security requirements

These are not aspirational; they are tested.

- **SSRF.** `evidence.ts` is the only outbound-request path. Scheme allow-list,
  DNS resolution with private/loopback/link-local/metadata filtering, manual
  redirect walking with per-hop revalidation, 6s timeout, 256KB read cap,
  metadata-only extraction. Covered by `tests/evidence.test.ts`.
  *Known gap:* addresses are validated then connected to by hostname, so DNS
  rebinding is not fully prevented. Stated in the report, not hidden.
- **Prompt injection.** Analysed content is fenced with a one-time nonce and
  declared to be data. The system prompt forbids obeying anything inside it.
  The deterministic layer is immune by construction.
- **Secrets.** Service-role and AI keys are server-only. Never `NEXT_PUBLIC_`.
  Never logged, never in errors returned to the client, never in chat or
  screenshots. `/api/health` returns booleans only.
- **Database.** RLS is enabled with no browser-role policies. The service-role
  key is server-only. Account writes require explicit `saveToAccount: true`,
  a verified session user and a valid owner UUID. `saveReport` fails closed
  when the `user_id` column is missing; never retry an account save without
  its owner. `GET /api/account/history` requires a verified session and
  filters every query by that user's ID. It returns minimal report metadata,
  not an unfiltered scan list. Report reads and deletes enforce ownership
  whenever an owner is present. Legacy guest rows remain accessible only by
  their unguessable report URL until removed; do not create new guest rows.
- **External AI.** Analysis API defaults `allowCloudAI` to false; Kaval defaults
  `allowCloud` to false. The model provider must receive no submitted content
  unless the user explicitly enabled the visible per-feature consent control.
- **Outbound URL checks.** API and orchestrator both default live checks to
  false. Only an explicit user choice may trigger DNS/HTTP metadata retrieval.
- **Local history.** Regular reports are kept in browser IndexedDB. This is
  device/browser-specific and not app-level encryption. Users can remove local
  reports through the history UI.
- **Logging.** Never log analysed content or stored rows. Log short error
  markers only.
- **Input limits.** 8,000 characters, enforced server-side.

---

## 6. Design principles

- Apple-like restraint: clarity, hierarchy, generous whitespace, one accent.
- Light and dark are both first-class. All colour is tokenised on `:root`;
  the theme is set pre-paint by an inline script so there is no flash.
- **Never fake progress.** The loading state lists the stages that will run and
  marks none of them complete, because the whole analysis is one request. A
  fake progress bar is exactly the dishonesty this product argues against.
- Accessibility: visible focus, real semantics, `aria-live` on results,
  `prefers-reduced-motion` honoured, keyboard operable throughout.

---

## 7. Working agreement

- Branch, then PR. Never force-push a shared branch. Inspect diffs before merge.
- `npm run typecheck && npm run lint && npm test && npm run build` must all pass
  before you push. Do not report a command as passing unless you ran it.
- Record real results in `TASKS.md`, including failures.
- Ask the owner before: deleting a Vercel project, changing deployment
  protection, resetting or migrating a database, anything that spends money, or
  any production deployment.
- Chat history is not shared memory. These two files are.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
