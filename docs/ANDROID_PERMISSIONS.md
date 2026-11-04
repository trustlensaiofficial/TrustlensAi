# Android Permissions

**Date:** 2026-11-04 · **Verified against:** the built debug APK, not the source

Two permissions are declared. Everything else on this page is a list of things TrustLens
deliberately does not ask for, and why.

---

## 1. Verified from the shipped artifact

The checks below were run against `app-debug.apk` as CI produced it — 51.4 MB, 563 entries, 14 dex
files — by reading the compiled `AndroidManifest.xml` out of the package. Source code can say
anything; this is what is actually in the file a phone would install.

### Declared

| Permission | Why | When it is requested |
|---|---|---|
| `INTERNET` | Reaching the analysis API | Install time, as Android requires |
| `CAMERA` | Reading a QR code | **Only when the scan screen opens**, and released in `onDispose` |

`android.hardware.camera` is marked `required="false"`, so the app installs on a device without
one. Picking an image from the photo picker decodes identically and needs no permission at all.

### Confirmed present in the APK

- `com.trustlensai.android` as the application id
- `MainActivity`, `ShareReceiverActivity`
- `android.intent.action.SEND`, `SEND_MULTIPLE`, `PROCESS_TEXT`
- `com.google.mlkit.vision.DEPENDENCIES` — the on-device barcode model

### Confirmed ABSENT from the APK

Every one of these was checked and is not there:

| Not declared | What it would have allowed |
|---|---|
| `READ_SMS`, `RECEIVE_SMS` | Reading the message inbox |
| `READ_CALL_LOG` | Who you have called |
| `READ_CONTACTS` | The address book |
| `RECORD_AUDIO` | The microphone |
| `ACCESS_FINE_LOCATION` | Where you are |
| `SYSTEM_ALERT_WINDOW` | Drawing over other apps |
| `BIND_NOTIFICATION_LISTENER_SERVICE` | Other apps' notifications |
| Any `accessibilityservice` | Reading and acting on any screen |

A permission list is the one privacy claim a user can verify for themselves, from the Play listing,
without trusting a word of this document. That is why it is kept this short.

---

## 2. How each capability is obtained

| Capability | Mechanism | Permission |
|---|---|---|
| Analyse pasted text | The app's own input field | None |
| Receive a shared message | `ACTION_SEND` / `SEND_MULTIPLE` / `PROCESS_TEXT` | None — the user chose to share |
| Read a QR code with the camera | CameraX + ML Kit, on-device | `CAMERA`, at scan time |
| Read a QR code from an image | Android Photo Picker + ML Kit | **None** |
| Reach the API | — | `INTERNET` |

### Why the share sheet needs no permission

Because the user initiated it. Android hands over exactly what the source app chose to include,
and nothing else. That is also the honest limit:

> **A share is not the conversation.** It is whatever the other app put in the intent — often one
> message, sometimes a caption without its image, sometimes an image without its caption. The
> preview screen reports anything it could not use rather than dropping it silently, because a
> confident verdict on half of what someone sent is the worst outcome available.

### Why the photo picker is offered as an equal path

The camera permission is the one people are most reluctant to grant, and in practice these codes
arrive *inside messages* as screenshots. So declining the camera leaves a fully working screen
rather than a degraded one. This is also why the camera is unbound in `onDispose`: the permission
is genuinely in use only while that screen is visible.

---

## 3. Two capabilities deliberately left out of V1

Neither is a silent omission. Both have a documented mechanism in
[`PLATFORM_CAPABILITIES.md`](PLATFORM_CAPABILITIES.md) and a reason here.

### Notification monitoring — `NotificationListenerService`

**Not shipped.** Google rolled out on-device notification scam detection across twelve OEMs in
October 2026 ([`COMPETITOR_RESEARCH.md`](COMPETITOR_RESEARCH.md) §2). Shipping this would duplicate
an operating-system feature while asking the user for one of Android's most invasive grants — the
OS hands over notifications from *every* app, and the restriction to chosen apps would be a
TrustLens-side filter rather than a permission boundary. That is a trade worth refusing.

[`PRODUCT_CHARTER.md`](PRODUCT_CHARTER.md) §4 demotes it from a core capability for exactly this
reason. If it ever ships it will be as coverage for devices and apps Google does not reach, and
never described as a differentiator.

**The claim that would be false:** "notification access lets TrustLens see your bank messages".
Android offers no such guarantee.

### Call screening — `CallScreeningService`

**Not shipped.** It must answer within about five seconds, which rules out any network call, AI
request or reputation lookup in that path. It needs a local cached indicator set, and that does not
exist yet. Shipping it against a network lookup would miss the deadline and fail silently, which is
worse than not having it.

It would also take the `ROLE_CALL_SCREENING` role, and only one app can hold it — so enabling it
would displace whatever caller-ID app the user already relies on. That is their decision to make
knowingly, not a side effect of installing a scam checker.

---

## 4. Permissions and the Play listing

| Requirement | State |
|---|---|
| Permission declarations minimal and justified | **Done** — two |
| No restricted permissions (SMS, Call Log) | **Done** — none declared, so no declaration form is needed |
| Data Safety declaration | **Not written.** Owner action |
| Privacy policy URL | **Not published.** Owner action |
| Notification-access disclosure | **Not applicable** — the feature is not shipped |
| Account deletion path | Backend cascade verified; no in-app screen yet |

---

## 5. What the app does when a permission is refused

Refusal must never be a dead end, and these are the actual behaviours:

| Refused | What happens |
|---|---|
| Camera | The scan screen stays usable; the photo picker does the same job. The copy says declining is fine, because it is |
| Camera, permanently | Same. No repeated prompt, and no link into Settings for something that has an alternative |
| Everything optional | The product still analyses text, reads payment codes from images, explains evidence, and gives the full recovery plan. That is not a degraded mode — it is the product |

The one thing refused permissions cannot do is make TrustLens claim it is watching something it is
not. `GET /api/v1/capabilities` reports the true per-platform state, and the settings screen renders
only what is *not* available — silence means working, and there is no aggregate green tick.
