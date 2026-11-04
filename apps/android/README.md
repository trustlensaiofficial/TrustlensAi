# TrustLens for Android

The native Android client. It talks to the existing TypeScript backend through
`/api/v1`, which is documented in [`docs/openapi.yaml`](../../docs/openapi.yaml).
There is no Android-specific backend and there should never be one.

---

## Build state — read this first

**Nothing in this directory has been compiled locally.** The machine it was
written on has no JDK, no Android SDK, no Gradle and no Android Studio — all
verified absent, not assumed. The GitHub Actions workflow
[`android.yml`](../../.github/workflows/android.yml) is therefore the build:
it compiles the Kotlin, runs the unit tests, runs Android Lint and assembles a
debug APK on a runner with the real toolchain.

Treat a green run there as the only evidence this code builds. Treat the APK
it uploads as the only APK that exists.

---

## Toolchain

Every version is pinned in [`gradle/libs.versions.toml`](gradle/libs.versions.toml)
and was read from the actual Maven repository rather than recalled.

| Tool | Version | Why |
|---|---|---|
| Android Gradle Plugin | 8.13.2 | Newest of the mature 8.x line. Supports compileSdk up to 36.1; API 36 needs ≥ 8.9.1 |
| Gradle | 8.14.6 | AGP 8.13.2 requires ≥ 8.13 |
| JDK | 17 | AGP 8.13.2 requires ≥ 17 |
| Kotlin | 2.2.0 | Compose compiler ships with Kotlin since 2.0, so the Compose plugin tracks this exactly |
| compileSdk / targetSdk | 36 | **Mandatory.** Since 31 August 2026 Google Play requires new apps and updates for phones, tablets and foldables to target Android 16 (API 36) |
| minSdk | 26 | Wide reach without legacy workarounds. Every dependency supports it |

**AGP 9.x is deliberately not used.** 9.5.0 is current, but it carries breaking
build-DSL changes and this project cannot be compiled where it was written.
Pinning the proven line is the responsible choice until a real build has run;
moving to 9.x should be its own change with a green build behind it.

---

## Opening it

```bash
# From the repository root
open -a "Android Studio" apps/android
```

Android Studio will offer to download the SDK and generate the Gradle wrapper.
Accept both. The wrapper JAR is **not** committed — it is a binary that could
not be produced on the authoring machine, and committing one from elsewhere is
not a habit worth starting. `gradle/wrapper/gradle-wrapper.properties` pins the
version, so the wrapper Studio generates is the right one.

From the command line, once a JDK and the SDK are present:

```bash
cd apps/android && gradle wrapper && ./gradlew :app:assembleDebug
```

### Configuration

Copy nothing secret into this app. Create `apps/android/local.properties`:

```properties
sdk.dir=/Users/you/Library/Android/sdk
TRUSTLENS_API_BASE_URL=https://trustlensai-u2r6.vercel.app/
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<the publishable key>
```

`local.properties` is gitignored.

The publishable key is already public — it ships in the web bundle, and
row-level security is what protects the data rather than the obscurity of that
key. **The service-role key must never appear here.** There is deliberately no
build field for one: privileged work stays on the server.

---

## What the app does

| Flow | State |
|---|---|
| First-run privacy explanation, consent defaults off | Built |
| Paste a message and check it | Built |
| Receive a share from another app, with a preview before anything is sent | Built |
| Report: verdict, payment action, quoted evidence, provenance, uncertainty, next steps | Built |
| Incident response — 12 action states, routed official channels | Built |
| Settings: per-capability consent, honest capability list | Built |
| QR scanning with the camera | Parser and models built; camera screen not yet |
| Google sign-in and passkeys | Not yet |
| Case history | Endpoints exist; screens not yet |

### Three rules this client does not break

1. **It never computes a verdict.** `assessment.level` and each
   `signals[].severity` are rendered exactly as the server sends them. If the
   client coloured findings independently, a backend fix for a false positive
   would never reach an installed copy, and the two could disagree on screen —
   which destroys the argument that findings are traceable.
2. **`signalScore` is never shown as a percentage.** It is not calibrated.
3. **It never asks for an OTP, a PIN, a password or a card number.** There is
   no screen, field or code path that could.

---

## Permissions

Only two are declared: `INTERNET`, and `CAMERA` for QR scanning — requested at
the moment a scan opens, with the camera marked not-required so the app still
installs without one.

Deliberately absent: SMS, call log, contacts, microphone, location, overlay,
screen capture, and any Accessibility service.

### Two features left out of this release on purpose

**Notification monitoring.** Google shipped on-device notification scam
detection across twelve OEMs in October 2026
([`docs/COMPETITOR_RESEARCH.md`](../../docs/COMPETITOR_RESEARCH.md) §2). A
`NotificationListenerService` here would duplicate an OS feature while asking
for one of Android's most invasive grants, so
[`docs/PRODUCT_CHARTER.md`](../../docs/PRODUCT_CHARTER.md) §4 demotes it from a
core capability. It stays a roadmap item for devices and apps Google does not
reach — never described as a differentiator.

**Call screening.** `CallScreeningService` must answer in about five seconds,
so it needs a local cached indicator set that does not exist yet. Shipping it
against a network lookup would miss the deadline and fail silently.

Both have a documented mechanism in
[`docs/PLATFORM_CAPABILITIES.md`](../../docs/PLATFORM_CAPABILITIES.md). Neither
is a silent omission.

---

## Tests

JVM unit tests cover the logic that has no Android dependency — UPI parsing and
share extraction — which is deliberate: the Android glue passes MIME and size
lookups *into* the pure extractor so every rule about dropped attachments,
oversized images and truncated text is testable without a device.

```bash
./gradlew :app:testDebugUnitTest
```

Not yet tested, and not claimed: real device behaviour, real shares from
WhatsApp/Telegram/Gmail, camera scanning, and anything requiring an emulator.
[`docs/REPOSITORY_AUDIT.md`](../../docs/REPOSITORY_AUDIT.md) tracks that.

---

## Release

There is no signing configuration, because a keystore must never be committed.
A release build is configured by whoever holds the key.

Play submission needs, and does not yet have: a privacy policy matching
[`docs/PRIVACY_AND_CONSENT.md`](../../docs/PRIVACY_AND_CONSENT.md), a Data
Safety declaration, store assets, and a signed AAB.
