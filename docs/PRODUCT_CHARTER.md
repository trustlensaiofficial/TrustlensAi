# Product Charter — Step 3

**Status: frozen.** Changing anything in §1–§4 requires a written decision recorded in §9, not a
commit. Everything in the repository is subordinate to this document; if code and charter disagree,
the code is wrong.

**Date:** 2026-11-04 · **Owner:** product / backend

---

## 1. What TrustLens AI is

> **TrustLens AI reads a message, a link, a screenshot or a payment code and tells a person what it
> is trying to make them do with their money — which way the money would actually move, which exact
> words made it think so, and what it could not check. If money has already gone, it takes them
> through the official reporting route and warns them about the scam that comes next.**

Two halves, in this order of importance:

1. **Scam-to-action** — not "is this suspicious" but "what will happen if I do what it says".
2. **Incident response** — the part that begins after the loss, which nothing else in this market
   currently serves.

## 2. What it is not

It is **not** a scam detector competing with Google or Truecaller on classification accuracy. That
race is lost and was lost before we entered it — Google flags over five million suspected scam
calls and texts a month at the OS layer, on-device, on twelve OEMs' handsets, with no permission to
grant. See `docs/COMPETITOR_RESEARCH.md` §2.

Positioning that implies otherwise is prohibited. We do not claim better models. We answer a
different question.

## 3. Who it is for

**Primary:** a person in India, mid-scam or just after it, holding a message they are frightened
of, who needs to know in ten seconds whether tapping the thing in front of them takes money out.

Design consequences, all of them binding:

- The verdict renders **statically** — no entry animation. Someone mid-scam reads it the instant it
  paints.
- Explanation in the language the reader thinks in — English, Tamil, Hindi.
- **Works without an account.** Sign-in is never a gate.
- Works offline for what can honestly be done offline, and says so.
- Never asks for an OTP, a PIN or a password. Anywhere. For any reason.

**Secondary:** the family member who gets forwarded the message, and the person who has already
paid and does not know that 1930 exists.

## 4. The four things we will be good at

Each is defensible as a product decision rather than a claim about model quality.

| # | Capability | Why it holds |
|---|---|---|
| 1 | **Payment-action reading** | Deterministic, India-specific, checkable against NPCI's own published position. A UPI PIN authorises a debit and is never how money is received; P2P collect requests were switched off on 1 October 2025. Neither competitor parses payment instructions at all |
| 2 | **Evidence and provenance** | Every finding carries the quoted span that produced it, labelled by how it was established, and `notChecked` is never hidden. Both competitors return a judgement without showing their working |
| 3 | **Incident response** | 1930 → CFCFRMS → bank freeze, the 24–48 hour window, cybercrime.gov.in, the I4C Money Restoration Module, Chakshu for communications — plus a warning about fake recovery agents. Entirely unoccupied space |
| 4 | **Honest capability reporting** | Per-platform, per-permission truth. One global green tick is forbidden |

**Demoted by research, deliberately:** Android notification monitoring. Google ships it at the OS
layer. It stays on the roadmap as coverage for devices and apps Google does not reach, and it is
never described as a core capability or a differentiator.

## 5. Boundaries that do not move

| Rule | Reason |
|---|---|
| There is no "safe" verdict | No analyser can earn that word. The enum has no such value (`openapi.yaml`) |
| The client never decides risk | A client that colours its own verdict can contradict the backend on screen |
| `signalScore` is never shown as a percentage or probability | It is not calibrated. Presenting it as one is the exact overclaim this product argues against |
| Recovery is never promised | `recoveryPlan.disclaimer` is mandatory |
| No synthetic data without a visible "Simulated" label | — |
| No fake counters, accuracy figures, progress bars or community feeds | — |
| We never claim to read WhatsApp, Telegram or Signal | Impossible on iOS, and on Android only via notifications the user explicitly allows |
| No email/password auth | Google OAuth and passkeys only |
| Degraded is not an error | A report without AI commentary is still complete; rules, evidence and steps are all there |
| Security is never weakened to make a demo work | No disabling RLS, auth or checks. Ever |

## 6. What "done" means for V1

Not a feature list — a set of conditions.

1. A real UPI collect-as-refund message produces the contradiction finding, the quoted span, the
   direction of money, and the unverified-beneficiary statement. **Shipped** —
   `lib/analysis/payment-action.ts`, 17 tests.
2. Every endpoint in `docs/openapi.yaml` exists at `/api/v1`, behaves as documented, and is
   covered by tests.
3. A case can be opened, evidenced, progressed through incident response and exported.
4. Consent is per-capability, versioned, and revocable, with a receipt.
5. `GET /capabilities` reports the true per-platform state, including `unsupported_platform`.
6. Rate limiting is shared across instances, not per-instance.
7. A labelled benchmark corpus exists with **measured** precision and recall per language.
   **Done** — `docs/DETECTION_BENCHMARK.md`, 61 cases across five languages. The figure is 100%
   precision and 100% recall *on that corpus*, and §0 of that document explains at length why that
   is a coverage measurement rather than an accuracy claim: the corpus and the rules were written
   by the same process, so an independently written corpus is the next real test. The honest public
   form is "we measure ourselves against a published corpus, here it is" — never a percentage on a
   slide.
8. Every claim in user-facing copy traces to something in this repository.

Items 3 and 4 are open. Item 7 is measured, with its limitations stated; the figure may be cited
only alongside the corpus it came from.

## 7. Sequence

| Phase | Content | State |
|---|---|---|
| 0 | Audit, competitor research, charter, contract, capability matrix | **Done** |
| 1 | Backend foundation: `/api/v1`, case schema, consent, shared rate limiting | In progress |
| 2 | Investigation engine: payment actions, provenance, threat-intel abstraction, benchmark | Payment actions done |
| 3 | Case and incident workflow end to end | Not started |
| 4 | Android — permission model and contract only; **no toolchain on this machine** | Blocked, documented |
| 5 | iOS — Share Extension, SMS filter, Call Directory | Not started |

Phase 4's honest output here is the permission model, capability matrix and API contract the
Android app will consume. Shipping a simulator described as a device integration would be worse
than shipping nothing.

## 8. Division of labour

One contract, two owners. `docs/openapi.yaml` is authoritative and changes before any code that
depends on it.

- **Backend / security / platform:** the repository owner.
- **Frontend:** per `docs/FRONTEND_HANDOFF.md`.

Neither side builds against an invented API.

## 9. Decisions recorded against this charter

| Date | Decision | Basis |
|---|---|---|
| 2026-11-04 | Notification monitoring demoted from core capability to coverage gap-filler | Google shipped OS-layer notification scam detection on 12 OEMs, 14 Oct 2026 |
| 2026-11-04 | Positioning moved off detection accuracy and onto payment-action + incident response | `COMPETITOR_RESEARCH.md` §3 |
| 2026-11-04 | No public accuracy figure until a labelled corpus with measured precision/recall exists | §6 item 7 |
| 2026-11-04 | Corpus built and measured; the figure may be published only with the corpus attached and the coverage-not-accuracy caveat | `DETECTION_BENCHMARK.md` §0 |
| 2026-11-04 | Risk threshold left at 10 rather than lowered to clear near-miss detections, because a genuine benign notice also scored 6 | `DETECTION_BENCHMARK.md` §3 |
| 2026-11-04 | Flask service at `services/analysis-api` is a second runtime of the rule layer, not the production backend | `REPOSITORY_AUDIT.md` §5; no documented investigation justifies two backends |
