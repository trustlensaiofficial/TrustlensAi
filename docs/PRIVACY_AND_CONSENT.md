# Privacy and Consent — Step 4

**Date:** 2026-11-04 · **Companion:** `docs/DATA_FLOW.md` (what moves), this (what was agreed)

---

## 1. The principle

> **Every capability that sends data anywhere is off until the person turns it on, and can be
> turned off again on its own.**

Not one acceptance covering everything. Not a bundle where declining the AI also disables the
rules. Eight capabilities, eight independent decisions — the keys are in
`docs/openapi.yaml` under `Capability`.

The product's whole argument is that it tells people the truth about what it can see. A consent
flow that obscures that would contradict the thing being sold.

---

## 2. What works with no consent at all

This matters more than the consent design itself, because it is what makes refusal cheap.

With every toggle off and no account:

- All deterministic rules — generic, context-specific, and Tamil
- Payment-action reading, including a QR decoded on-device
- Offline link structure: lookalike, punycode, typosquat, shortener
- The full report with provenance, evidence, uncertainty and next steps
- The complete incident-response plan for all twelve action states
- Kaval's local safety answers
- Device-local history

That is the product, not a teaser. Live checking, cloud AI and account sync are additions.

---

## 3. The consent record

```
grant   → INSERT consent_receipts (user_id, capability, granted=true,  policy_version)
revoke  → INSERT consent_receipts (user_id, capability, granted=false, policy_version)
```

Three properties, all enforced in the schema rather than in a comment:

| Property | How |
|---|---|
| Append-only | `UPDATE` raises `restrict_violation` via trigger — binding on the service role too, not just browser roles |
| Versioned | `policy_version` is NOT NULL. Consent to an older wording is not consent to a newer one |
| Per capability | `capability` is CHECK-constrained to the 8 contract keys; current state is the newest row per `(user_id, capability)` |

### Why versioning is not optional

Without `policy_version`, "you consented" is an unfalsifiable claim: the disclosure text could be
rewritten and the stored row would still read as agreement to whatever it says today. With it, a
change of wording means consent has to be asked again, which is the only interpretation that makes
the record mean anything.

### Current state

The table exists in a written, unapplied migration. **The endpoints do not exist yet.**
`docs/REPOSITORY_AUDIT.md` §7 lists this as open. Until they ship, the per-request flags
(`liveChecks`, `allowCloudAi`, `saveToAccount`) are the consent mechanism, and they default to
false on every request.

---

## 4. Disclosure wording per capability

What a person must be told *before* granting. The hard cases are the platform ones, where the
truthful statement is less flattering than the obvious one.

| Capability | What the disclosure must say |
|---|---|
| `deterministic_rules` | Runs on the text you submit. Nothing leaves your device except the text you chose to analyse |
| `qr_parsing` | The code is read on your device. The image is never uploaded — only the text the code contained |
| `live_url_checks` | We will open the link from our server, not your phone. The site learns our address, not yours. It can serve us something different from what it serves you |
| `cloud_ai` | The message text is sent to a model provider. Its reading is labelled as inference and is never treated as fact |
| `account_sync` | A copy of the report is stored against your account. Without this, reports stay in this browser only |
| `notification_monitoring` | **Android hands over notifications from every app once you allow it. The restriction to the apps you choose is applied by TrustLens, not by the operating system.** Previews can be hidden or truncated, and a message that posts no notification is never seen |
| `call_screening` | Only the incoming number, before it rings. No call audio is ever recorded. Only one app can screen calls at a time, so this would replace whichever app does it now |
| `sms_filtering` (iOS) | Only texts from senders not in your Contacts. Never iMessage, never a saved contact, never RCS |

### The claim we must never make

> ~~"Notification access only lets TrustLens see bank messages."~~

Android offers no such guarantee. The OS delivers everything and our allowlist is a TrustLens-side
filter. Saying otherwise would describe a permission boundary that does not exist, and
`docs/PLATFORM_CAPABILITIES.md` §6 bans it.

---

## 5. Retention and deletion

| Data | Retention | How it is deleted |
|---|---|---|
| Device history (IndexedDB) | Until cleared | In-app, or browser site data. Never reaches the server |
| `scans` rows | Until deleted by the owner | The history page remove action; account deletion sets `user_id` to NULL |
| Cases, artifacts, events | Until the case or account is deleted | Cascades from `cases`, which cascades from `auth.users` |
| Consent receipts | Until account deletion | Cascades |
| `rate_limits` | ~10 windows | Pruned opportunistically inside the function |

### Account deletion removes the chain

`cases.user_id` and `consent_receipts.user_id` are `on delete cascade` from `auth.users`;
artifacts and events cascade from their case. `scans.user_id` is `on delete set null` rather than
cascade — a deliberate difference, because a guest capability URL someone else legitimately holds
should not break when the account that later claimed the report is closed.

This is also why `case_events` refuses UPDATE but permits DELETE: a person's right to remove their
own data outranks the audit trail of a case that no longer exists.

---

## 6. Data minimisation already in the code

| Decision | Effect |
|---|---|
| `input_preview` is truncated | The listing never needs the full text |
| Rate-limit keys are hashed | No raw IP is ever written. HMAC when `TRUSTLENS_HMAC_KEY` is set |
| Phone numbers become HMAC tokens | Not bare SHA-256: 10^10 ten-digit numbers reverse on a laptop |
| `redactPhone` for display | `98••••••10` — recognisable without republishing the number |
| Analysed content is never logged | Error paths log a marker and a truncated reason |
| No analytics or tracking of any kind | Nothing to opt out of |
| QR images stay on-device | Only the decoded string, capped at 2KB |

### Pseudonymisation, not anonymity — said plainly

Anyone holding the HMAC key can still test a guess against a token. This protects against a leaked
database, **not** against the operator. The code comment in `lib/threat-intel/indicators.ts` says
exactly that. A production system would use a rotating key in a KMS and a privacy-preserving set
intersection; that is recorded as the next step rather than claimed as built.

---

## 7. Authentication choices as privacy choices

**No email/password.** Google OAuth and passkeys only, which means:

- There is no password of ours to leak, reuse or phish.
- Passkeys are phishing-resistant and avoid telling Google when someone signs in.
- Google OAuth inherits whatever security that Google account has — stated rather than glossed.

**Signing in is never a gate.** Not for an analysis, and specifically not for a recovery plan:
`POST /api/v1/recovery-plan` is deliberately unauthenticated, because someone whose money left ten
minutes ago must not meet a sign-in screen at the worst moment of their week.

---

## 8. What this product will not do

- Sell, share or monetise submitted content
- Build a profile of a person from their analyses
- Upload notification text
- Record call audio
- Ask for an OTP, PIN, password or CVV — anywhere, for any reason
- Claim to read WhatsApp, Telegram or Signal
- Present a stale result as a live check
- Imply a report was saved when it was not

---

## 9. Open items before any public launch

Engineering cannot close these; they need the owner.

1. **A published privacy policy** matching this document, which does not yet exist.
2. **A Play Data Safety declaration**, plus a written disclosure for notification access. Required
   before the Android app can be submitted at all.
3. **An Apple review justification** for the SMS filter extension's data flow.
4. **A DPDP Act position** — grievance officer, consent-manager posture, and the children's-data
   question. A legal decision, not a technical one.
5. **Consent endpoints**, which is engineering work and is listed in the audit as open.
6. **`TRUSTLENS_HMAC_KEY` set** in the canonical project, so rate-limit tokens are keyed rather
   than an unkeyed hash of a 2^32 space.
