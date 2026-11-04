# Data Flow — Step 4

**Date:** 2026-11-04

What leaves the device, when, and what never does. Written so that the privacy claims in the
interface can be checked against it line by line.

---

## 1. The default path

A guest pastes a message and presses analyse, with both toggles off — which is the shipped default.

```
device ──POST /api/v1/analyses──► server
                                   │  rules           (in memory)
                                   │  payment reading (in memory)
                                   │  link structure  (offline, no DNS)
                                   ▼
device ◄──── report JSON ──────────┘
   │
   └─► IndexedDB on this device only
```

**Nothing is written server-side.** No row is created, no file stored, no third party contacted.
The submitted text exists in server memory for the duration of the request and is not logged.

Three deliberate consequences:

- The analysis works with no account.
- It works with the database unconfigured.
- It works with the AI provider down.

---

## 2. What each toggle adds

| Toggle | Default | What it causes | What it does not |
|---|---|---|---|
| `liveChecks` | **false** | A DNS lookup and one HTTP GET of the primary link, behind the SSRF guard. The *link* leaves; the message text does not | Does not send the message anywhere |
| `allowCloudAi` | **false** | The message text plus the already-established findings go to Vercel AI Gateway | Does not store anything server-side |
| `saveToAccount` | **false** | One row in `scans` with the report document, owned by the verified session user | Does nothing at all without a session — the response says so rather than implying a save |

Each is independent. Live checking without cloud AI is a normal and useful combination, and the
reverse is too.

### The "saved" claim must be true

`report.persisted` is set from the actual result of the write, not from the request's intent. If the
database is unconfigured, or the user asked to save while signed out, the response carries a
`storageNote` saying what really happened. The interface is forbidden from implying history that
does not exist — this is the specific bug that produced "Saved to your account" on a build with no
accounts.

---

## 3. What never leaves the device

| Never leaves | Why |
|---|---|
| A QR **image** | Decoded on-device; only the decoded string is sent, capped at 2KB |
| A screenshot, unless the user attaches one to a case | Not part of the analysis path |
| Notification text (Android) | Classified on-device. The design rule is that no notification text is uploaded |
| Call audio | Never recorded on any platform, and no voice analysis exists |
| Contacts, call log, SMS inbox | Never requested. See `docs/PLATFORM_CAPABILITIES.md` §2.4 |
| A UPI PIN, OTP, password or CVV | The product has no field for one, anywhere, for any reason |

---

## 4. What is logged server-side

Deliberately minimal, because logs are the easiest place for a privacy promise to quietly fail.

| Logged | Not logged |
|---|---|
| A short error marker and a message truncated to ~160 chars | The analysed content, ever |
| Error codes from Supabase or the AI provider | Any secret, key or token |
| That a rate limit was hit | The rate-limit key, which is a client identifier |
| Standard platform access logs | — |

`console.error('[trustlens] analysis failed:', …)` carries the failure reason, never the input.

---

## 5. What persists, where, and for how long

| Store | Contains | Lifetime | Who can read it |
|---|---|---|---|
| IndexedDB, on the device | Full reports for guest analyses | Until the user clears it, in-app or via browser site data | That browser profile only. Never reaches the server |
| `scans` | Report document, owner id | Until deleted by the owner | Service role server-side; owner via the account route; a guest report via its unguessable capability URL |
| `cases`, `case_artifacts` | Case evidence | Until the case or account is deleted — cascades | Owner only, by RLS |
| `case_events`, `consent_receipts` | Append-only history | Until the case or account is deleted | Owner only. **Cannot be updated by anyone**, including the service role, enforced by trigger |
| `rate_limits` | Hashed client key, a counter | Pruned after ten windows | Service role only. No raw address is ever written |

### Deletion actually deletes

`user_id` on `cases` and `consent_receipts` references `auth.users(id)` with `on delete cascade`,
and artifacts and events cascade from their case. Deleting the account removes the chain. This is
why `case_events` refuses UPDATE but permits DELETE: the right to remove your own data outranks the
audit trail of a case that no longer exists.

---

## 6. Third parties contacted

The complete list. Anything not here is not contacted.

| Party | When | What it receives |
|---|---|---|
| Supabase | Auth, and persistence if the user opted in | Session, and the report document on an explicit save |
| Google (OAuth) | Only if the user chooses Google sign-in | Standard OAuth flow. Passkeys avoid this entirely |
| Vercel AI Gateway → Anthropic | Only with `allowCloudAi: true` | The message text and the established findings |
| The site being analysed | Only with `liveChecks: true` | One HTTP GET from our server. The user's IP is never exposed to it |
| Vercel | Hosting | Standard platform telemetry |

**No analytics, no advertising, no tracking pixel, no third-party font or script at runtime.** The
CSP-relevant consequence is that there is nothing to block.

### One genuine privacy benefit of server-side checking

When live checking is on, the fetch comes from our server, not the user's device. The scam site
learns our IP, not theirs — it cannot confirm that this particular victim opened the link.

---

## 7. Per-capability consent

Consent is per capability, versioned, and revocable independently — not one acceptance covering
everything.

```
grant   → INSERT consent_receipts (capability, granted=true,  policy_version)
revoke  → INSERT consent_receipts (capability, granted=false, policy_version)
```

A revocation is a **new row**, never an edit, and the table refuses UPDATE by trigger. `policy_version`
records which wording the person actually saw — without it, "you consented" is unfalsifiable,
because the text could change and the old row would still read as agreement to the new one.

Current state: the table exists in a written migration. The endpoints do not exist yet, and
`docs/REPOSITORY_AUDIT.md` §7 lists that as open rather than done.

---

## 8. Offline behaviour

The service worker **never caches `/api/*`**. A cached analysis presented as a fresh one would be a
false reassurance about a message that may have just arrived, which is precisely the failure this
product exists to prevent.

What works offline: previously saved device reports, the standing safety guidance, and the Kaval
local answers. What does not: a new analysis, live link checking, anything cloud. The interface
must say which it is showing — never present stored content as a live result.
