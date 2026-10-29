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

---

## Local setup (VS Code, macOS or Windows)

Requires **Node.js 20 LTS or newer** and Git.

```bash
git clone https://github.com/trustlensaiofficial/TrustlensAi.git
cd TrustlensAi
code .                # open in VS Code
npm ci                # install exactly what the lockfile pins
cp .env.example .env.local
# fill .env.local in privately — it is gitignored and must never be committed
npm run dev           # http://localhost:3000
```

**What works without any credentials:** the full deterministic engine, every
demo scenario, link structure analysis, the report, the checklist, the
showcase and the tour. The app tells you plainly which layers are unavailable
rather than pretending.

**What each credential unlocks:**

| Variable | Unlocks | Without it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Saved reports, sign-in | Analysis still runs; reports are not saved |
| `SUPABASE_SECRET_KEY` | Server-side report writes | Reports are not saved |
| `AI_GATEWAY_API_KEY` *or* `ANTHROPIC_API_KEY` | Contextual interpretation | Deterministic rules only, clearly labelled |
| `NEXT_PUBLIC_SITE_URL` | Correct OAuth redirect | Falls back to the deployment URL |

Never commit `.env.local`. Never put a secret in a `NEXT_PUBLIC_` variable —
anything with that prefix is compiled into the browser bundle.

---

## Enabling sign-in (dashboard steps)

Code for Google and passkeys is complete. These are the console settings it
depends on; until they are set, the buttons report the exact reason.

### 1. Google Cloud Console
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**
2. Application type **Web application**
3. Authorised redirect URI — this is Supabase's callback, not the app's:
   ```
   https://pwieplvvzftxdxvoueed.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client secret**

### 2. Supabase → Authentication → Providers → Google
Enable it and paste the client ID and secret from step 1.

### 3. Supabase → Authentication → URL Configuration
```
Site URL:       https://trustlensai-u2r6.vercel.app
Redirect URLs:  https://trustlensai-u2r6.vercel.app/auth/callback
                http://localhost:3000/auth/callback
```

### 4. Passkeys
Enable passkeys in Supabase Authentication settings. The **RP ID** must be the
exact hostname users sign in on — `trustlensai-u2r6.vercel.app` for production,
`localhost` for development. A passkey registered against one RP ID will not
work on the other; this is a WebAuthn rule, not a bug.

Passkeys can only be *added* by an already signed-in user, so the flow is:
sign in with Google once, then add a passkey from **/account**.

### 5. Vercel
`NEXT_PUBLIC_SITE_URL` must be set to the canonical origin on every
environment, otherwise OAuth redirects to the per-deployment URL and Supabase
rejects it as unregistered.

---

## Database migrations

Applied in order from `supabase/migrations/`, through the Supabase SQL editor.

| File | Purpose |
|---|---|
| `0001_scans.sql` | The report table. RLS on, no browser-role policies. |
| `0002_lock_analysis_history.sql` | Owner-scopes `analysis_history`. |
| `0003_scans_owner.sql` | Adds a **nullable** `user_id` so signed-in users own their reports. |

All are additive. `0003` is safe to apply at any time: the column is nullable,
existing guest rows keep working untouched, and the application already handles
the column being absent.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` on Google | The Supabase callback in step 1 does not match, or `NEXT_PUBLIC_SITE_URL` is wrong |
| Sign-in returns to `/login` with an error | Provider not enabled, or the app's callback is not in Supabase's redirect list |
| Passkey says "no passkey found" | None registered for this RP ID — sign in with Google and add one from `/account` |
| Passkey works locally but not in production | RP ID mismatch; they are separate hostnames and need separate registrations |
| Reports not saving | `SUPABASE_SECRET_KEY` missing, or `SUPABASE_URL` holds a malformed value (the app names which) |
| "Contextual analysis unavailable" | AI Gateway billing not enabled, or no key. Deterministic analysis is unaffected |
| Reports save but have no owner | `0003_scans_owner.sql` not applied yet — see the server log |

## Limitations

Stated plainly because the product's argument depends on it:

- Rules are English-only and pattern-based; novel phrasing can pass them.
- No image, audio or video analysis — a deepfake is only reachable through the
  text describing it.
- No external fact-checking; claims are assessed on wording, not truth.
- Rate limiting is per-instance and needs a shared store to be real.
- The absence of warning signs is weak evidence, never a verdict of safety.
