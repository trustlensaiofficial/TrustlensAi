# Android Handoff

**For whoever picks up the Android app.** The contract is
[`openapi.yaml`](openapi.yaml); the design rules it must not break are below.

---

## 1. Three rules this client does not break

**The client never decides risk.** It renders `assessment.level` and each `signals[].severity`
exactly as the server sends them. Do not compute a score, infer a level from the number of signals,
or colour a result from a keyword. If the backend tightens a rule to kill a false positive and the
client is colouring independently, the fix never reaches an installed copy — and the two can
disagree on screen, which destroys the product's whole argument that findings are traceable.

**`signalScore` is never rendered as a percentage or a probability.** It is not calibrated.

**Nothing in this app ever asks for an OTP, a PIN, a password or a card number.** There is no
screen, no field and no code path that could. If a feature seems to need one, it is the wrong
feature.

---

## 2. What is built

| Area | File | State |
|---|---|---|
| Typed API models for the whole contract | `core/net/ApiModels.kt` | Done |
| Retrofit interface, `/api/v1` only | `core/net/TrustLensApi.kt` | Done |
| Result states as values, not exceptions | `core/net/ApiResult.kt` | Done |
| Per-capability consent, defaults off | `core/consent/ConsentStore.kt` | Done |
| UPI parsing, on-device | `core/qr/UpiUri.kt` | Done, 13 tests |
| Share extraction, pure | `core/share/SharedPayload.kt` | Done, 16 tests |
| QR scanning — camera + photo picker | `core/qr/QrScanner.kt`, `ui/screens/QrScanScreen.kt` | Done |
| Onboarding, home, report, incident, settings, share preview | `ui/screens/` | Done |
| Google sign-in, passkeys | — | **Not built** |
| Case history screens | — | **Not built**; endpoints exist and are verified |
| Export | — | **Not built** |

---

## 3. Auth, when you build it

The server accepts **two** session transports:

1. A cookie, for the web app.
2. `Authorization: Bearer <access_token>`, for this app.

The bearer path exists because it had to: before it, every authenticated route answered a native
client 401, and the case endpoints were unreachable from a phone. Both paths validate the token
against the auth server with `getUser()` — a decoded JWT is an assertion by the caller, not
evidence.

So: sign in with Supabase, take `session.access_token`, and put it in the `Authorization` header.
`TrustLensApi` already takes it as a parameter on every case call.

**Never put the service-role key in this app.** There is no build field for one.

---

## 4. States every screen must handle

Not optional. `ApiResult` enumerates them so the compiler helps.

| State | Render |
|---|---|
| `Success` | The real response |
| `Invalid` (400) | The field problem, inline |
| `Unauthorized` (401) | Prompt to sign in — and render the `note`, which says analysis needs no account |
| `NotFound` (404) | "Not yours or not here", never "deleted" |
| `RateLimited` (429) | The countdown from `retryAfterSeconds` |
| `Unavailable` (503) | The named dependency, and what still works |
| `Offline` | What works locally. Never a stale result shown as fresh |
| `Failed` | The server's own wording where there is one |

### Degraded is not an error

`report.model.degraded == true` means the AI commentary is missing and **nothing else**. Render the
whole report plus `model.reason` as a quiet note. Showing an error state there hides a complete
report — the rules, the evidence, the payment reading and the next steps are all present.

---

## 5. Rendering a report — do not reorder this

1. **Verdict** — largest, and **static**. No entry animation: someone mid-scam must read it the
   instant it paints.
2. **Payment action**, if `detected` — *before* the signal list. What they are being asked to do
   matters more than which rules fired. When `claimContradiction` is true, that is the headline.
3. **Warning signs** — each with `matches[0].text` quoted. The quote *is* the evidence.
4. **How this was established** — grouped by `provenance`. Never merge `deterministic` with
   `model_inference`.
5. **Checked / not checked** — `uncertainty.notChecked` is never hidden.
6. **Next steps** — `checklist[]`, in the server's order.

`upi.payeeName` is attacker-controlled. Render it as a quoted claim, never as a verified party — a
scammer can put "State Bank Of India" there and frequently does.

---

## 6. Cases

- **Cases need an account; nothing else does.** Do not let a 401 here push the user toward sign-in
  for an analysis or a recovery plan.
- **Post the furthest action and do not correct it downward.** `POST .../events` with
  `{"actionState": "transferred_money"}` is enough — `kind` defaults server-side. The case's
  `furthestAction` only ever moves toward more exposure, so a milder later answer never produces a
  milder plan. That is deliberate; do not work around it.
- **Paginate with `nextCursor`, never an offset.** An offset page skips or repeats rows when a case
  is touched between requests.
- `recoveryPlan: null` with a `note` is an empty state, not an error.

---

## 7. Incident response

`recoveryPlan.urgency == "immediate"` means the channel marked `urgent: true` — **1930** — renders
**above** the step list, not inside it. Someone whose money has just gone should not scroll past
advice to find a phone number.

`officialChannels[].useWhen` is rendered verbatim. Chakshu (fraudulent *communications*) and
1930/cybercrime.gov.in (actual financial loss) are not interchangeable, and the backend decides
which applies. Re-wording it here could route someone to the wrong agency.

`disclaimer` must be rendered. Recovery is never promised.

---

## 8. Things the UI must never do

- Compute or override a verdict
- Render `signalScore` as a percentage
- Show a cached result as a live check
- Display "safe", "verified" or "100% protected" for any input
- Show a fake progress bar, threat counter or accuracy figure
- Hide `uncertainty.notChecked`
- Imply a generated report is an official police or bank document
- Claim WhatsApp monitoring
- Ask for an OTP, PIN or password, anywhere, for any reason
