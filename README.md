# TrustLens AI

**Verify before you act.** TrustLens AI analyses a message, link or claim and
shows you what looks wrong, what it actually checked, what it could not verify,
and what to do next.

Team Reshiram · DEX26223 · Open Innovation

---

## Why it is different

Most tools answer "is this a scam?" with a colour. That does not help someone
decide, because it gives them nothing to check and no reason to believe it.

TrustLens answers four questions instead:

1. **What looks suspicious?** — every warning sign shows the exact words that
   triggered it, so the reasoning is inspectable rather than trusted.
2. **What was actually checked?** — an evidence record lists each check, how it
   was performed, and what it returned.
3. **What is still unknown?** — checks that failed or never ran are shown with
   the same prominence as those that succeeded.
4. **What should I do now?** — a checklist of concrete steps through a channel
   the user already controls.

Every statement carries its **provenance**: a rule match, a retrieved fact and
a model inference are three different kinds of claim, and the report never
blends them.

The product does not certify anything as genuine or fraudulent, and it does not
show a fake confidence percentage.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; the app runs without any keys
npm run dev
```

Open <http://localhost:3000>. With no environment variables the app still works:
deterministic rules and live link checks run, and the UI states plainly that the
contextual layer and report storage are unavailable.

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (65 tests) |

---

## Configuration

All optional — each missing capability degrades visibly rather than silently.

| Variable | Needed for | Notes |
|---|---|---|
| `AI_GATEWAY_API_KEY` | contextual analysis | Preferred. Create at <https://vercel.com/ai-gateway>. |
| `ANTHROPIC_API_KEY` | contextual analysis | Used only if the gateway key is absent. |
| `NEXT_PUBLIC_SUPABASE_URL` | report history | `SUPABASE_URL` also accepted. |
| `SUPABASE_SERVICE_ROLE_KEY` | report history | **Server-only.** `SUPABASE_SECRET_KEY` also accepted. |

Never give a server key a `NEXT_PUBLIC_` prefix, and never commit real values.

Apply `supabase/migrations/0001_scans.sql` before expecting history to work. It
is additive — it creates one table and one index and alters nothing existing.

---

## Architecture

```
validate → classify → deterministic rules → offline URL structure
         → live evidence (optional) → contextual model → report
```

Rules and evidence run **before** the model, and only their output is given to
it. The model has no tools of its own, so it is structurally unable to claim a
check that did not happen.

- **Frontend / backend:** Next.js 16 App Router, React 19, TypeScript (strict)
- **Model:** Claude via Vercel AI Gateway, or the Anthropic API directly
- **Database:** Supabase Postgres, service-role access only
- **Hosting:** Vercel

See [`AGENTS.md`](./AGENTS.md) for the full brief and
[`TASKS.md`](./TASKS.md) for current state, verified results and known limits.

---

## Security

- **SSRF:** the single outbound path resolves DNS and refuses private,
  loopback, link-local and cloud-metadata addresses; it walks redirects
  manually, revalidating each hop; it times out, caps the read at 256KB, and
  extracts metadata only. Nothing is executed or downloaded.
- **Prompt injection:** analysed content is fenced with a one-time marker and
  declared to be data. The deterministic layer is immune by construction.
- **Database:** RLS enabled with no client policies. Reports are addressed by
  unguessable UUID and **there is deliberately no endpoint that lists them**,
  so one visitor cannot reach another's history.
- **Secrets:** server-side only, never logged, never returned in errors.

---

## Limitations

Stated plainly because the product's argument depends on it:

- Rules are English-only and pattern-based; novel phrasing can pass them.
- No image, audio or video analysis — a deepfake is only reachable through the
  text describing it.
- No external fact-checking; claims are assessed on wording, not truth.
- Rate limiting is per-instance and needs a shared store to be real.
- The absence of warning signs is weak evidence, never a verdict of safety.
