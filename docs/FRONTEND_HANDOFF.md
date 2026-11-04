# Frontend Handoff

**For the frontend owner.** The backend owner does not change a field without changing
`docs/openapi.yaml` first; you do not compute a security verdict in the client. Those two rules are
the whole contract.

---

## 1. The one rule that matters most

**The client never decides risk.**

Do not compute a score, do not infer a level from the number of signals, do not colour a result
from a keyword. Render `report.assessment.level` and `report.signals[].severity` exactly as the API
returns them.

Why this is strict: if the backend tightens a rule to kill a false positive and the client is
independently colouring things red, the fix does not reach the user. Worse, the two can disagree on
screen — and the product's entire argument is that its findings are traceable.

`assessment.signalScore` exists for ordering only. **Never render it as a percentage or a
probability.** It is not calibrated and showing it as one would be the exact overclaim this product
exists to argue against.

---

## 2. States every screen must handle

Not optional. A screen that only handles the happy path is not done.

| State | When | What to show |
|---|---|---|
| `idle` | Nothing submitted | The input affordance |
| `loading` | Request in flight | Skeleton. Analysis can take 10–15s with live checks on |
| `success` | 2xx | The real response |
| `empty` | 200 with no results | A real empty state, worded for that screen |
| `validation` | 400 | The field problem, inline |
| `unauthorized` | 401 | Prompt to sign in, preserving the user's input |
| `not_found` | 404 | "Not on this device / not yours" — never "deleted" |
| `rate_limited` | 429 | `Retry-After` seconds, with a countdown |
| `degraded` | 200, `model.degraded = true` | The result **plus** the named reason |
| `unavailable` | 503 | The named dependency, and what still works |
| `offline` | No network | What still works locally — never a stale result shown as fresh |

### Degraded is not an error

When `model.degraded` is `true` the report is still valid and complete — the AI commentary is
missing, nothing else. Render the whole report and add `model.reason` as a quiet note. Do **not**
show an error state; the rules, evidence and next steps are all there.

---

## 3. Every screen, and the data it needs

| Screen | Endpoint | Key fields | Notes |
|---|---|---|---|
| Sign in | Supabase client SDK | — | Google + passkey. Never a gate: always offer "continue without an account" |
| Dashboard | `GET /capabilities`, `GET /account/history` | `capabilities[]`, `items[]` | Show a capability row **only** when its state is not `available` |
| New investigation | `POST /analyses` | request body | `liveChecks` and `allowCloudAi` default **false**; both need an explicit user toggle |
| Report | response of `POST /analyses` | `assessment`, `signals`, `findings`, `uncertainty`, `paymentAction` | See §4 |
| Payment action | `report.paymentAction` | `kind`, `direction`, `upi`, `claimContradiction` | See §5 — this is the differentiator |
| Evidence viewer | `GET /cases/{id}` | `artifacts[]` | Show `provenance` and `freshness` on every row |
| Incident response | `POST /cases/{id}/events` → `GET .../recovery-plan` | `actionState`, `steps[]`, `officialChannels[]` | See §6 |
| Case history | `GET /cases` | `cases[]`, `nextCursor` | Cursor pagination, not offset |
| Privacy | `GET /capabilities` | per-capability state | Every consent independently revocable |
| Kaval | `POST /api/assistant` | `reply`, `source`, `note` | `source: "local"` is normal, not a failure |
| Export | `POST /cases/{id}/reports` | `downloadUrl`, `expiresAt` | URL is short-lived and signed; do not cache it |

---

## 4. Rendering a report — the required structure

The order is deliberate. It is the order a worried person reads under stress.

1. **Verdict** — `assessment.level` + `headline` + `summary`. Largest element, and **static**: no
   entry animation. Someone mid-scam must be able to read it the instant it paints.
2. **Payment action** — if `paymentAction.detected`, this comes *before* the signal list. What
   they are being asked to do matters more than which rules fired.
3. **Warning signs** — `signals[]`, worst severity first. Each must show
   `matches[0].text` as a quote. The quoted span **is** the evidence; a signal rendered without it
   loses the product's whole argument.
4. **How this was established** — group `findings[]` by `provenance` into separate blocks.
   Never merge `deterministic` with `model_inference` in one list.
5. **Checked / not checked** — both columns from `uncertainty`. `notChecked` is required and must
   never be hidden when non-empty.
6. **Next steps** — `checklist[]`, in order.

### Provenance labels to use

| Value | Label |
|---|---|
| `deterministic` | Fixed rule |
| `on_device` | Checked on your device |
| `retrieved` | Checked |
| `model_inference` | AI reading |
| `user_supplied` | You told us |
| `assumption` | Unverified assumption |

---

## 5. The payment-action panel — build this carefully

This is the product's most distinctive output, and the easiest to render misleadingly.

```jsonc
"paymentAction": {
  "detected": true,
  "kind": "enter_upi_pin",
  "direction": "user_pays",          // ← even though the message says "refund"
  "claimContradiction": true,        // ← lead with this
  "upi": { "payeeVpa": "refunds@okaxis", "payeeName": "Refund Cell", "amount": "2499" },
  "explanation": "Entering a UPI PIN authorises a payment…",
  "unknowns": ["Whether the person receiving the money is genuine…"]
}
```

**When `claimContradiction` is true, that is the headline of the panel.** The message promises
money in; the mechanism takes money out. Say it in those terms.

**`upi.payeeName` is attacker-controlled.** Render it as a quoted claim — `"Refund Cell"` — never
as a verified party. A scammer can put "State Bank Of India" in that field and frequently does.

**`unknowns` is never collapsed by default.** It always contains the statement that the beneficiary
is unverified and that we have no access to transaction systems. That is the honest half of the
panel.

---

## 6. Incident response

Post the furthest action the user took. The plan regenerates from it.

```http
POST /api/v1/cases/{caseId}/events
{ "actionState": "transferred_money" }
```

When `recoveryPlan.urgency === "immediate"`, the official channel marked `urgent: true` — **1930**
— renders above the step list, not inside it. Someone whose money has just gone should not have to
scroll past advice to find a phone number.

Use `officialChannels[].useWhen` verbatim. Chakshu (suspected fraudulent *communications*) and
1930/cybercrime.gov.in (actual financial cybercrime) are **not** interchangeable, and the backend
decides which applies.

The plan's `disclaimer` must be rendered. Recovery is never promised.

---

## 7. Capability rendering

```jsonc
{ "key": "notification_monitoring", "state": "unsupported_platform",
  "reason": "iOS does not allow any app to read other apps' notifications." }
```

| State | Render as |
|---|---|
| `available` | **Nothing.** Silence means working |
| `permission_required` | Actionable prompt |
| `unsupported_platform` | Plain statement + `reason`. Never "turn this on" |
| `degraded` | Works, with the limit named |
| `paused` | User's own choice; offer resume |
| `unavailable` | The named reason |

**One global green tick is forbidden.** Capabilities differ per platform and per grant, and a
single aggregate badge hides exactly the information a user needs.

---

## 8. Developing before the endpoints land

`/api/v1/*` is being built now. Until then:

- `POST /api/analyze` and `GET /api/health` are live and match the report shape.
- Fixtures live in `packages/test-fixtures` (planned) and `lib/demo/cases.ts` (today).
- Any mock must be **visibly labelled synthetic** in the UI and must never write to production.

When `/api/v1` ships, the current routes stay as deprecated aliases for one release so nothing
breaks mid-migration.

---

## 9. Language

`LANG_LABEL` gives `English`, `தமிழ் · Tamil`, `हिन्दी · Hindi`. Tamil and Hindi copy is written in
Latin script because that is how most people type on a phone — `LANG_NOTE` says so, and that note
belongs beside the picker, not inside the label. Do not write "Tanglish" in the interface.

Scoped to decision-critical copy: the verdict, severity words and standing advice. Chrome stays
English for now.

---

## 10. Things the UI must never do

- Compute or override a risk verdict
- Render `signalScore` as a percentage
- Show a cached result as a live check
- Display "safe", "verified", "genuine" or "100% protected" for any input
- Show a fake progress bar, threat counter, accuracy figure or community feed
- Present synthetic data without a visible "Simulated" label
- Hide `uncertainty.notChecked`
- Imply a generated PDF is an official police or bank document
- Claim WhatsApp monitoring on any platform
- Ask for an OTP, PIN or password anywhere, for any reason

---

## 11. Open items owned by the backend

| # | Item | State |
|---|---|---|
| 1 | `POST /api/v1/analyses` | **Live.** `/api/analyze` is now a deprecated alias onto the same handler and returns `Deprecation: true` plus a `Link` header naming the successor |
| 2 | `GET /api/v1/capabilities` | **Live.** Declare your platform with `X-TrustLens-Platform: web\|android\|ios`; it defaults to `web` and never guesses native from a user agent. Each entry now also carries `mechanism` and `limits` — render both |
| 3 | Shared rate limiting | **Done in code**, migration not yet applied. Read `X-RateLimit-Scope` on a response: `instance` means the shared counter was unreachable and the real ceiling is higher than the configured one |
| 4 | Case endpoints | **Built**, migration not yet applied. `POST`/`GET /api/v1/cases`, `GET`/`PATCH`/`DELETE /api/v1/cases/{caseId}`, `POST .../artifacts`, `POST .../events`, `GET .../recovery-plan`. Until the migration lands they return **503** with a reason naming the cause — render it as `unavailable`, not as an error |
| 4b | `POST /api/v1/recovery-plan` | **Live and deliberately unauthenticated.** `GET` the same path lists the action states to offer |
| 5 | Threat-intelligence provider abstraction | Not started |
| 6 | Typed client package at `packages/contracts` | Not started |

### Cases — three things to build against

1. **Cases need an account; nothing else does.** A 401 here carries a `note` saying so. Do not let
   that 401 push the user toward sign-in for an analysis or a recovery plan.
2. **Post the furthest action, and do not try to correct it downward.** `POST .../events` with
   `{"actionState": "transferred_money"}` is enough — `kind` defaults to `action_reported`. The
   case's `furthestAction` only ever moves toward more exposure, so a milder answer given later
   never produces a milder plan. That is deliberate; do not work around it.
3. **Paginate with `nextCursor`, never an offset.** An offset page skips or repeats rows when a
   case is touched between requests.

When `recoveryPlan` comes back `null` with a `note`, that is a case where nothing was acted on —
an empty state, not an error.

### Rendering `paymentAction`, now that it is live

`POST /api/v1/analyses` returns `report.paymentAction` for real. Two things to build against:

- `claimContradiction: true` also raises a **critical** signal with id
  `payment.claim_contradiction`, whose `matches[0]` quotes the whole promise —
  `"Refund of Rs 2,499 is pending."` — not the bare word that matched. Render the quote.
- The checklist already leads with the refusal when a payment prompt is open (a PIN pad, a collect
  request, a QR scanner) and places it second otherwise. **Do not reorder the checklist.**

Ping the backend owner before building against any of these; the shapes in `openapi.yaml` are the
design intent and may tighten during implementation.
