# TrustLens AI — Judge Quick Guide

**Team Reshiram · DEX26223 · Open Innovation (Software) · DEXATHON 2026**
**Live:** https://trustlensai-u2r6.vercel.app · **Repo:** https://github.com/trustlensaiofficial/TrustlensAi

---

## 1. The one-line story

> Most tools show a red warning and stop. TrustLens shows you the **exact words** that are wrong,
> **what it could and could not check**, and **one safe thing to do next** — before you pay, click or share.

Tagline: **Pause. Verify. Then act.**

---

## 2. Technology — what is actually in the repository

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **Next.js 16.4 (App Router), React 19.3, TypeScript 5.9** | All pages and UI |
| Backend | **Next.js Route Handlers (Node runtime)** | `/api/analyze`, `/api/health`, `/api/assistant`, `/api/report/[id]` |
| Detection engine | **TypeScript, no ML** | 43 deterministic rules (17 generic + 19 context + 7 Tamil) |
| Database | **Supabase PostgreSQL** | Saved reports, Row Level Security |
| On-device store | **IndexedDB** | History that works offline, with no account |
| AI model | **Claude Sonnet 5** via **Vercel AI Gateway** (AI SDK 6); direct Anthropic API as fallback | Plain-language explanation layer only |
| Validation | **Zod 4** | Every API input is schema-validated |
| Auth | **Supabase Auth** — Google OAuth + passkeys (WebAuthn) | Optional sign-in; no passwords |
| Hosting | **Vercel** | Production deployment |
| Tests | **Vitest** — **185 passing** | Detection, privacy, campaign logic |

### ⚠️ The one PPT mismatch — say this if asked

> **Our slide says "Python Flask back end". That is the plan we wrote at proposal stage. In the
> code we shipped, there is no Flask and no Python — the backend is Next.js Route Handlers running
> on Node. We consolidated to one TypeScript codebase so the detection rules are shared by the
> frontend and backend and covered by one test suite. We would rather correct the slide than
> claim a technology we did not use.**

This is a strength if you say it first and confidently. Do **not** let a judge discover it.

---

## 3. The flow (memorise this)

```
1 INPUT        Paste a message, link or claim. Pick what it is (bank/UPI, chat, link, job…)
      ↓
2 WARNING      43 fixed rules scan the wording. Each match records the EXACT phrase.
  SIGNS        Urgency · impersonation · payment demands · credential requests · risky links
      ↓
3 EVIDENCE     Link structure analysed offline. Optionally: DNS + page metadata over the
  CHECK        network, with SSRF protection (private/loopback/metadata addresses refused,
               every redirect re-validated, timeouts and size caps).
      ↓
4 REPORT       Findings split by HOW each was established — never blended:
               • Fixed rule   • Checked (actually ran)   • AI reading (may be wrong)
               Plus: what was checked, and what could NOT be checked.
      ↓
5 VERIFY       One concrete next step — usually "call your bank on the number printed on
  FIRST        your card, never one from the message". If money moved → 1930 first.
```

---

## 4. Fifteen judge questions, with short answers

**1. What is TrustLens AI?**
A personal financial-threat protection tool. You paste a suspicious message and it shows the exact
warning signs, what it could and could not verify, and the safest next step.

**2. What problem does it solve?**
₹22,845 crore was lost to cyber fraud in India in 2024 — a 206% rise. Existing tools give a warning
without evidence, so people still don't know what to do.

**3. What is innovative?**
Three things. Every finding **quotes the exact triggering words**. Findings are **separated by how
they were established** — a fixed rule, a real check, or an AI guess — and never merged. And we
**say what we could not check**, instead of letting silence imply safety.

**4. How is it different from Truecaller?**
Truecaller tells you *who* is calling. We tell you *whether the message deserves your trust* and
*what to do about it* — with the evidence shown. Different problem entirely.

**5. Which languages and frameworks?**
TypeScript end to end. Next.js 16 App Router for frontend and backend, React 19, Supabase
PostgreSQL, Claude Sonnet 5 through the Vercel AI Gateway, deployed on Vercel.

**6. How does scam detection work?**
43 deterministic rules, in three sets: 17 generic, 19 context-specific (bank, invoice, job offer,
investment), and 7 for Tamil. Each rule records the exact matched span, which is what the report shows.

**7. How do AI and rules work together?**
Rules run **first and always**. The AI only adds a plain-language reading on top, and it is labelled
separately. **If the AI is unavailable, the whole product still works** — that is deliberate.

**8. How do you verify evidence?**
Offline link-structure analysis always. Optionally, live DNS and page metadata — with SSRF guards:
private and loopback addresses refused, every redirect hop re-validated, timeouts and size caps.
We never claim a check ran when it did not.

**9. How do you avoid false positives?**
Benign controls are in the test suite and must stay silent. Example: *"I got the OTP for the train
booking"* must not fire. We found and fixed exactly that bug — a critical rule was matching the bare
word "OTP". Now every credential rule requires an actual **demand**, not a mention.

**10. How do you protect privacy?**
Reports are stored on your own device in IndexedDB and work with no account. Nothing is shared with
the campaign network unless you choose to. We do **not** claim end-to-end encryption — the server
reads the text in order to analyse it, and our Privacy page says exactly that.

**11. What happens when AI is unavailable?**
Everything except the AI explanation. Right now the AI Gateway is refusing on billing, and the app
**says so honestly on screen** — "AI layer unavailable" — rather than showing a green tick. The 43
rules, evidence, next steps and reports all still work. You can see this live.

**12. What are the current limitations?**
Three, stated plainly: **no Android app** (no SDK on our machine — not attempted rather than faked);
**campaign data is simulated** and labelled as such on every card; **the AI layer is blocked on
billing**. We also cannot establish a sender's identity or physical location, and we say so in the report.

**13. How can this scale?**
The engine is pure functions with no per-user state, so it scales horizontally on serverless.
Campaign matching is union-find over normalised indicators — near-linear. Phone numbers are shared
as HMAC-keyed tokens, never raw or plain-hashed.

**14. What is the business model?**
Free core checks for students, individuals and families. A small-business plan for team accounts and
payment-request verification. Partnerships with colleges and community groups. Costs are AI usage,
source lookups and hosting — we have not assumed revenue figures.

**15. Why should we select you?**
Because we built the honest version. It is easy to make a demo that always says "SCAM DETECTED". We
built one that tells you what it *could not* check, labels simulated data as simulated, and shows
"AI unavailable" on stage rather than faking it. That restraint is the hard part, and it is the only
version anyone could actually trust with their money.

---

## 5. The 90-second explanation (all five members should know this)

> Last year Indians lost ₹22,845 crore to cyber fraud — up 206%.
>
> The tools that exist show a red warning and stop there. That creates panic without understanding,
> so people still don't know whether to pay, or what to do if they already did.
>
> TrustLens AI does three things differently. **One:** every warning quotes the exact words that
> triggered it, so you judge the reasoning instead of trusting a colour. **Two:** we separate a fixed
> rule from a check that actually ran from an AI guess — and never blend them. **Three:** we tell you
> what we *could not* check, because no warning found is not the same as safe.
>
> It works in English, Tamil and Hindi — because a scam in India arrives as *"OTP share pannunga"*,
> and English-only rules miss it entirely.
>
> If something already happened, it switches to incident response — and if money has moved, it leads
> with 1930, India's fraud helpline, because the first hours decide whether a transfer can be frozen.
>
> It's live, it works without an account, and the rules keep working with no internet.
>
> **Pause. Verify. Then act.**

---

## 6. Three-minute live demo — exactly what to click and say

**Open:** https://trustlensai-u2r6.vercel.app

| # | Click | Say |
|---|---|---|
| 1 | Land on **home** | "This is live. Notice the status strip — it says *AI layer unavailable*. We'd rather show that than fake a green tick. Everything else runs." |
| 2 | Nav → **How it works** · watch 2 scenes · click **Try it now** | "A narrated walkthrough of every capability." |
| 3 | **Check** → example **"Bank phishing SMS with a lookalike link"** | "A real Indian bank scam, through the same pipeline as your own text." |
| 4 | Point at the **verdict** | "Strong warning signs — and it tells you *why*, not just that." |
| 5 | Expand a **warning sign** | "It quotes the **exact words**. And here — *hdfcbank* appears in the address, but the real domain is `kyc-update-secure.xyz`. That's the lookalike caught." |
| 6 | Scroll to **How this was established** | "Three columns — fixed rule, actually checked, AI reading. Never blended. That's our core idea." |
| 7 | Scroll to **what we could not check** | "This is the part most tools skip. No warning found is not the same as safe." |
| 8 | Scroll to **next steps** | "One concrete action: call your bank on the number printed on your card — never one from the message." |
| 9 | **Clear** → paste the benign message below → **Check this** | "Now an ordinary message that mentions an OTP. **No signals detected.** A tool that cries wolf gets ignored — so this matters as much as catching the scam." |
| 10 | Nav → **Respond** → tick **"I transferred money"** | "If it already happened, the plan changes. **1930** comes first, above everything — the first hours decide whether a transfer can be frozen." |
| 11 | Back to the report → **Prepare an evidence summary** → toggle a redaction | "A clean summary for your bank or a cybercrime complaint. You choose what it includes. And it states plainly it is **not** an official police document." |
| 12 | Nav → **Scam alerts** | "Community campaign matching. **Clearly labelled simulated** — no real user submitted this. But the clustering is genuinely computed: four differently-worded messages grouped by the link they share." |

**Benign message to paste at step 9:**

```
I got the OTP for the train booking, the ticket is confirmed. See you Sunday.
```

**Scam message if you prefer typing your own:**

```
Dear customer, your HDFC account will be blocked today. Complete KYC immediately
at http://kyc-update-secure.xyz and share the OTP with our executive.
```

---

## 7. PPT vs live prototype — every honest gap

| PPT says | Reality | What to tell judges |
|---|---|---|
| "Python Flask back end" | **No Flask, no Python.** Next.js Route Handlers on Node | "That was the proposal-stage plan. We consolidated to one TypeScript codebase so rules are shared and covered by one test suite. We'd rather fix the slide than claim a technology we didn't use." |
| "Official-source and fact-check lookups" | Link/DNS/metadata checks **are** implemented. Named fact-check APIs are **not** integrated | "Link and domain checks are live. Fact-check API integration is proposed, not built — and the report never claims a source was consulted when it wasn't." |
| "Source citations" | Evidence rows show source, method, timestamp and status | "Implemented for the checks we actually run. We show the method and the timestamp for each." |
| AI explanations | Built, but **gateway refuses on billing** | "The layer is built and wired. Our gateway account needs billing enabled. The app shows *AI layer unavailable* rather than pretending." |
| Community campaign alerts | Engine is real and tested; **data is synthetic** | "The matching, de-duplication and corroboration are genuinely computed. The reports are simulated and every card says so." |
| — | **No Android app** | "Not attempted — no Android SDK on our build machine. We will not show a simulator and call it a device integration." |

---

## 8. Numbers you can state safely

- **43** deterministic rules (17 generic + 19 context + 7 Tamil)
- **185** automated tests passing
- **3** explanation languages: English, Tamil, Hindi
- **₹22,845 crore** lost to cyber fraud in India, 2024 (+206%) — MHA
- **US$15.9B** reported US fraud losses, 2025 — FTC
- **1930** — India's cyber-financial fraud helpline

**Never state:** a detection accuracy percentage, user numbers, or that any message is "100% safe".
We have not measured accuracy on a labelled corpus, and saying so is the honest answer.

---

## 9. If something fails on stage

- **AI/Kaval errors** → "That's the billing block we mentioned. Watch — everything else still works."
- **No internet** → Open any saved report from **Activity**; it loads from the device.
- **Site slow** → Reload once. Pages are statically rendered.
- **A judge finds a bug** → "Good catch — that's exactly why we show what we could *not* verify.
  We'd rather be corrected than oversell."
