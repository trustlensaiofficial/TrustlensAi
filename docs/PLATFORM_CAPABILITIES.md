# Platform Capabilities — the exact mechanism per operating system

**Date:** 2026-11-04 · **Owner:** backend / platform

This document names, for every platform, the **specific API** TrustLens uses, what that API can
and cannot see, and what the product must therefore never claim. If a capability is not listed
with a mechanism, it does not exist.

The governing rule: **a capability is only claimed where a documented, permitted platform API
provides it.** No hidden APIs, no accessibility scraping, no reading another app's database, no
bypassing end-to-end encryption.

---

## 1. Summary matrix

| Platform | Mechanism | Needs permission | Can see | Cannot see |
|---|---|---|---|---|
| **Android** — share | `ACTION_SEND` share target | None | Text/image the user explicitly shares | Anything not shared |
| **Android** — QR | ML Kit barcode (on-device) | Camera *only when scanning* | QR payload the user points at or picks | — |
| **Android** — notifications | `NotificationListenerService` | Notification access (user grants in Settings) | Notification title/text of **all** apps, filtered by us to the user's allowlist | Hidden previews, muted chats, messages that post no notification, attachments |
| **Android** — calls | `CallScreeningService` + `ROLE_CALL_SCREENING` | User grants the role | Incoming number, before ring | Call audio. Nothing is recorded |
| **iOS** — share | Share Extension | None | Text/URL/image explicitly shared | Anything not shared |
| **iOS** — SMS filter | `IdentityLookup` / `ILMessageFilterExtension` | User enables in Settings | SMS/MMS **from unknown senders only** | iMessage, anything from a saved contact, any RCS |
| **iOS** — caller ID | `CallKit` / `CXCallDirectoryExtension` | User enables | Matches a number against a list we supply | Call contents. No live lookup during the call |
| **Web / PWA** | Standard web APIs | None beyond file/camera picker | What the user pastes, uploads or scans | Any OS message, notification or call |
| **Windows / macOS / Linux / ChromeOS** | Same web/PWA | Same | Same | Same |

---

## 2. Android — the honest account

### 2.1 Notification access is not a bank-message permission

`NotificationListenerService` receives notifications posted by **every** app once the user grants
access in Settings. There is no OS-level filter that limits it to financial messages.

This matters for how we describe it. The truthful statement is:

> "Android delivers notifications from the apps you select. TrustLens classifies them **on your
> device**, keeps nothing from apps you did not select, and uploads no notification text."

The statement we must never make:

> ~~"TrustLens only ever sees bank messages."~~ — The OS does not offer that guarantee.

**Our app allowlist is a TrustLens-side filter, not an Android permission boundary.** The
disclosure has to say so.

### 2.2 Required implementation constraints

1. Check `sbn.getPackageName()` **before** reading any notification content.
2. Drop non-allowlisted notifications immediately, without logging.
3. Process in memory; never persist raw notification text.
4. Never read WhatsApp's database or any app's private storage.
5. Treat previews as unreliable — they may be hidden, redacted, truncated, or absent for muted
   conversations and for messages that post no notification at all.
6. Pause, revoke and uninstall must all be reachable, with a visible monitoring-status screen.
7. **The app must remain fully usable when notification access is denied.** Manual share is the
   baseline, not the fallback.

### 2.3 Call screening — conservative by design

`CallScreeningService` must respond within **5 seconds**. That is a hard constraint with one
consequence worth stating plainly: **no network call, no AI, and no reputation lookup may sit in
the screening path.** Only a local cached indicator set can answer in time.

We also do not take the `ROLE_CALL_SCREENING` role by surprise. If the user already relies on
Truecaller, the app explains that only one screening app can hold the role and leaves the choice
to them.

Call audio is never recorded and no voice analysis is claimed.

### 2.4 Permissions deliberately NOT requested in V1

`READ_SMS`, `RECEIVE_SMS`, `READ_CALL_LOG`, broad `READ_CONTACTS`, Accessibility Service, screen
recording, background location, microphone, `SYSTEM_ALERT_WINDOW`, default-SMS role.

SMS and Call Log are Play-restricted to default handlers, and broad contacts access faces tighter
policy requirements from 28 October 2026. Camera is requested **only** at the moment the user
starts an in-app scan, and image selection is always offered instead.

### 2.5 Play requirements

New submissions must target **API 36 (Android 16)** from 31 August 2026. Minimum supported version
to be fixed after compatibility testing; API 26 is the starting evaluation point.

---

## 3. iOS — narrower, and that is the platform's choice

### 3.1 What the SMS filter can and cannot do

`ILMessageFilterExtension` sees SMS/MMS **from unknown senders only**. It does **not** see:

- iMessage, in any form
- Anything from a number saved in Contacts
- RCS

Its network access is system-mediated — the extension cannot simply open arbitrary sockets.

### 3.2 What Call Directory can and cannot do

`CXCallDirectoryExtension` matches an incoming number against a list we supply in advance. It is
identification and blocking by list, not a live lookup, and it never exposes call contents.

### 3.3 What iOS does not offer at all

There is **no iOS equivalent of Android's notification access.** No third-party app can read other
apps' notifications. Therefore:

> TrustLens on iOS **cannot** monitor WhatsApp, Telegram or Signal. Any product claiming it does
> is either wrong or doing something it should not.

iOS V1 is the manual investigation product — Share Extension, paste, URL, screenshot, QR, incident
response, reports — plus the two permitted extensions above where they genuinely help.

---

## 4. Web and desktop

The web app is a genuine cross-platform investigation product, not a placeholder: paste, text,
URL, QR image and screenshot analysis, the full case and incident workflow, and export.

What it cannot do, on any desktop OS: read system messages, notifications or calls. A PWA has no
such permission and we will not imply otherwise.

Native Windows/macOS apps, browser extensions and wearables are roadmap items, not V1.

---

## 5. Capability reporting is a product feature

The backend exposes `GET /api/v1/capabilities` and every client renders the real answer. Each
capability reports one of:

| State | Meaning |
|---|---|
| `available` | Permitted, granted, and verified working |
| `permission_required` | Supported here, user has not granted it |
| `unsupported_platform` | The OS does not provide this mechanism at all |
| `degraded` | Granted but limited — e.g. notification previews hidden |
| `paused` | User switched it off |
| `unavailable` | Dependency down; the reason is named |

**One global green tick is forbidden.** A user on iOS must see that message monitoring is
`unsupported_platform` rather than inferring that it is merely switched off.

---

## 6. Claims this document forbids

- "TrustLens reads your WhatsApp messages." — False on both platforms.
- "Notification access only gives us bank messages." — The OS gives all; we filter.
- "We can tell you where the sender is." — A number's region is not a location.
- "Protected on every device." — Capabilities differ per OS and per grant.
- "We analyse call audio." — No recording, no voice analysis.
- "Verified sender." — Not without an authoritative source, which we do not have.

---

## 7. Open questions requiring the owner, not engineering

1. **Play policy review** for notification access needs a written privacy disclosure and a Data
   Safety declaration before submission.
2. **Apple review** of the SMS filter extension requires justifying the data flow.
3. **A device matrix** — which Android versions, OEM skins and work-profile configurations we
   commit to supporting — needs a decision before Phase 3 testing can be scoped.
