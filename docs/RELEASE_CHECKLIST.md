# Release Checklist

**Nothing in this repository has been deployed or published.** No production deploy, no merge to
`main` from this branch, no Play submission. The owner has said explicitly not to deploy, and this
page is what a release would require — not a record of one.

---

## 1. Ready

| Item | Evidence |
|---|---|
| Web app builds | `next build` clean |
| Typecheck, lint, tests | `tsc --noEmit`, `eslint .`, 363 tests |
| Debug APK builds | CI run on `product/real-platform-foundation`, artifact `trustlens-debug-apk` |
| Android Lint clean | Its own CI step; it caught a real Android-12 crash |
| App id | `com.trustlensai.android` |
| targetSdk 36 | Play requirement since 31 Aug 2026 |
| compileSdk 37 | Current AndroidX requires it |
| Permissions minimal | Two, verified in the compiled manifest — `ANDROID_PERMISSIONS.md` §1 |
| RLS, ownership, triggers | `scripts/verify-security.mjs`, 23 checks |
| Case + consent API | `scripts/verify-case-api.mjs`, 61 checks |
| Shared rate limiting | Verified live: 12 allowed, 13th refused |
| DNS rebinding closed | `tests/pinned-fetch.test.ts`, incl. a real-socket attack |
| Detection measured | `DETECTION_BENCHMARK.md`, with the coverage-not-accuracy caveat |

---

## 2. Blocking a release

| # | Item | Who |
|---|---|---|
| 1 | **No device or emulator run.** Nothing has launched the APK. Every Android claim is "compiles, pure logic tested" | Needs a machine with the SDK |
| 2 | **Release signing.** No keystore, by design — one must never be committed | Owner |
| 3 | **Play App Signing enrolment** | Owner |
| 4 | **Privacy policy published** at a stable URL, matching `PRIVACY_AND_CONSENT.md` | Owner |
| 5 | **Data Safety declaration** | Owner |
| 6 | **Terms of service** | Owner |
| 7 | **Store assets** — icon, screenshots, description | Owner |
| 8 | **Account deletion reachable in-app.** The backend cascade is verified; there is no screen | Engineering |
| 9 | **Support contact** | Owner |
| 10 | **`TRUSTLENS_HMAC_KEY` set** in the canonical project, so rate-limit tokens are keyed | Owner |
| 11 | **Google sign-in on Android.** Case features need an account and there is no sign-in screen | Engineering |
| 12 | **DPDP Act position** — grievance officer, consent-manager posture, children's data | Legal |

Items 1, 8 and 11 are the ones that would make a reviewer's first five minutes go badly.

---

## 3. Before any production deploy

1. Full gate green: `tsc`, `eslint`, `vitest`, `next build`.
2. `scripts/verify-security.mjs` green against the target project.
3. `scripts/verify-case-api.mjs` green against the target deployment.
4. `/api/health` inspected on the target — it probes rather than infers, so `caseStorage` and
   `sharedRateLimiting` reflect reality there.
5. A release decision from the owner, separately from any code review.

The two migrations on this branch are additive and already applied to
`pwieplvvzftxdxvoueed` (`DATABASE_DICTIONARY.md` §0). Confirm the deployment's environment points
at that project before assuming the schema is present.

---

## 4. Before any Play submission

1. A signed AAB, not the debug APK.
2. The APK installed and exercised on at least three real devices across Android 8, 12 and 16 —
   the API 33 parcelable crash lint caught would have shown up only on the older two.
3. A real share tested from WhatsApp, Telegram, Gmail and Chrome. The source app decides what it
   includes, so this cannot be reasoned about from code.
4. Camera permission grant *and* refusal both walked through.
5. Offline behaviour checked with the network off.
6. Internal testing track before anything wider.

**Never claim a release is approved before Google Play has approved it.**

---

## 5. Claims that must not appear in any listing

| Forbidden | Why |
|---|---|
| "99% accurate", "detects all scams" | Measured on a 61-case corpus we wrote. `DETECTION_BENCHMARK.md` §0 |
| "Reads your WhatsApp messages" | Impossible. Notification monitoring is not shipped and would not mean this |
| "Blocks scam calls" | Call screening is not shipped |
| "First AI scam detector" | Google flags 5M+/month; Truecaller shipped in September 2026 |
| "Safer than Truecaller" | Unmeasured |
| "Recovers your money" | Nothing can promise this, and `recoveryPlan.disclaimer` says so |
| "Verified sender" | We have no authoritative source for that |
