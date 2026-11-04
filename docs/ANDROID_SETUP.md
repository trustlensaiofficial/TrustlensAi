# Android Setup

How to get the app building on a machine that has a toolchain. The machine this was written on
does not — see §4.

---

## 1. Requirements

| Tool | Version | Why that version |
|---|---|---|
| JDK | 17 | AGP 9 requires ≥ 17 |
| Android Studio | Any release supporting AGP 9.5 | — |
| Android SDK | Platform **37**, Build Tools 36+ | Current AndroidX refuses to resolve below compileSdk 37 |
| Gradle | 9.8.2 | AGP 9.5.0 requires ≥ 9.1.0. Pinned in `gradle-wrapper.properties` |

Everything else is pinned in [`apps/android/gradle/libs.versions.toml`](../apps/android/gradle/libs.versions.toml).

---

## 2. First build

```bash
open -a "Android Studio" apps/android
```

Accept the SDK download and the Gradle wrapper generation when Studio offers them. The wrapper JAR
is **not committed** — it is a binary that could not be produced on the authoring machine, and
committing one from elsewhere is not a habit worth starting. The properties file pins the version,
so the wrapper Studio generates is the right one.

From a terminal, once a JDK and the SDK are present:

```bash
cd apps/android
gradle wrapper          # once, to create ./gradlew
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest
./gradlew :app:lintDebug
```

---

## 3. Configuration

Create `apps/android/local.properties` — it is gitignored:

```properties
sdk.dir=/Users/you/Library/Android/sdk
TRUSTLENS_API_BASE_URL=https://trustlensai-u2r6.vercel.app/
SUPABASE_URL=https://pwieplvvzftxdxvoueed.supabase.co
SUPABASE_PUBLISHABLE_KEY=<the publishable key>
```

The publishable key is already public — it ships in the web bundle, and row-level security protects
the data rather than the obscurity of that key. **The service-role key must never appear here.**
There is deliberately no build field for one: privileged work stays on the server, and
[`THREAT_MODEL.md`](THREAT_MODEL.md) treats a service key in a mobile package as a total
compromise.

Without the Supabase values the app still builds and still analyses messages. Only the account
features need them, which is the same trade the product makes everywhere else.

---

## 4. Why CI is the build

This project was written on a machine with **no JDK, no Android SDK, no Gradle, no Android Studio,
no ADB and no emulator** — all verified absent rather than assumed. So
[`.github/workflows/android.yml`](../.github/workflows/android.yml) is the build: it compiles, runs
the unit tests, runs Android Lint and assembles a debug APK on a runner with the real toolchain, in
four separate steps so a failure names its stage.

A green run there is the only evidence this code builds, and the uploaded APK is the only APK that
exists. That arrangement earned itself three times over — see
[`MASTER_BUILD_AUDIT.md`](MASTER_BUILD_AUDIT.md) §4, items 10 to 12.

### Getting the APK

```bash
gh run list --workflow=android.yml --limit 5
gh run download <run-id> -n trustlens-debug-apk
adb install app-debug.apk
```

---

## 5. Running the tests

```bash
./gradlew :app:testDebugUnitTest     # 29 JVM tests, no device needed
```

The JVM tests cover the logic with no Android dependency — UPI parsing and share extraction. That
split is deliberate: `ShareReceiverActivity` passes the MIME and size lookups *into* the pure
extractor, so every rule about dropped attachments, oversized images and truncated text is testable
without an emulator.

**Not tested, and not claimed:** anything on a real device or emulator. No instrumentation tests,
no screenshot tests, no real share from WhatsApp or Gmail. Every Android claim in this repository is
"it compiles and its pure logic is tested".

---

## 6. Troubleshooting

| Symptom | Cause |
|---|---|
| `requires Android Gradle plugin 9.1.0 or higher` | AGP below 9.1. The catalogue pins 9.5.0 |
| `compile against version 37 or later` | `compileSdk` below 37, or SDK platform 37 not installed |
| `Class 'kotlin.Unit' was compiled with an incompatible version` | KGP below the stdlib the dependencies pull. The root build file raises it to 2.4.21 |
| `Cannot add extension with name 'kotlin'` | The `kotlin-android` plugin is applied somewhere. AGP 9 compiles Kotlin itself; remove it |
| `resource android:style/Theme.Material.DayNight... not found` | There is no DayNight parent in the framework. Day and night are separate resource folders here |
| `NoSuchMethodError: getParcelableExtra` on Android 12 | A typed parcelable overload used unguarded. Both call sites branch on `Build.VERSION.SDK_INT` |
