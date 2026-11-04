# Master Build Audit

**Date:** 2026-11-04 · **Branch:** `product/real-platform-foundation`

Everything below was verified by running it. Where a claim could not be verified, it says so rather
than rounding up — a status table that reports intent as fact is worse than no table.

---

## 1. Repository state — verified

| Fact | Verified value |
|---|---|
| Working branch | `product/real-platform-foundation`, tracking `origin/` |
| Working tree | Clean at each commit |
| Remote | `github.com/trustlensaiofficial/TrustlensAi` |
| Tests | **363 passing**, 30 files (`npx vitest run`) |
| Typecheck | Clean (`tsc --noEmit`) |
| Lint | Clean (`eslint .`) |
| Web build | Compiles (`next build`) |

### Two corrections to the brief's starting assumptions

**"No changes merged into main" is out of date.** PR #50 merged six of the ten earlier commits into
`main`. Verified with `git merge-base --is-ancestor` against each commit.

**The local repository path in the brief is a stale second clone.**
`/Users/thajudeen/Projects/TrustlensAi` exists but sits **91 commits behind `main`**, on `main`, at
PR #34. The live work is in the worktree at
`/Users/thajudeen/trustlensAI/.claude/worktrees/trustlens-ai-vercel-setup-4b64a4`, which is on the
right branch with the right upstream and a working `.env.local`. Two clones of the same repository
on one machine is a hazard worth knowing about: a command run in the wrong one looks like it
succeeded and changes nothing.

---

## 2. Component status

Classified as the brief asks: implemented and tested / implemented but under-tested / partial /
planned / blocked / unsupported.

| Component | Status | Evidence | Next action |
|---|---|---|---|
| **Detection engine** | Implemented and tested | 363 tests; benchmark 100% P/R on 61 cases across 5 languages | Independent corpus |
| **Payment-action reading** | Implemented and tested | 30 tests; wired to `report.paymentAction` and verified over HTTP | — |
| **Incident response** | Implemented and tested | 12 contract states, 41 tests, channel routing asserted | — |
| **Capability reporting** | Implemented and tested | 22 tests; `/api/v1/capabilities` verified live per platform | — |
| **SSRF guard** | Implemented and tested | 5 layers; **DNS rebinding now closed** by connection pinning, 14 tests incl. a real-socket attack | — |
| **Shared rate limiting** | Implemented and verified | Live: 12 allowed, 13th refused with `Retry-After: 52`, `scope=shared` | Set `TRUSTLENS_HMAC_KEY` |
| **RLS / ownership / triggers** | Implemented and verified | `scripts/verify-security.mjs`, 23 checks, all passing | — |
| **API contract** | Implemented | `openapi.yaml`, 11 paths, 16 schemas, validated | Typed client package |
| **`/api/v1` routes** | Implemented | 8 routes build and respond; old paths are deprecated aliases | — |
| **Case endpoints** | Implemented, under-tested | Routes build; 401 and validation paths verified live. HTTP round trips need a browser session | End-to-end with a real session |
| **Consent endpoints** | Planned | Table exists and is verified; no routes | Build them |
| **Android app** | Implemented, compiles in CI | Kotlin + Compose, share target, QR parsing, 29 JVM tests | Device testing |
| **Android device testing** | **Blocked** | No JDK, SDK, Gradle, ADB or emulator on this machine — all verified absent | Needs a machine with the SDK |
| **Threat-intel providers** | Planned | No abstraction, no provider, no URL reputation consulted at all | Evaluate commercial terms |
| **Image / screenshot analysis** | **Unsupported** | Not implemented. A scam sent as a picture is missed entirely | Stated in every report's limits |
| **Google sign-in / passkeys (Android)** | Planned | Supabase SDK wired; no sign-in screen | — |
| **Notification monitoring** | **Deliberately out of V1** | Google shipped this at OS layer across 12 OEMs | Documented, not hidden |
| **Call screening** | **Deliberately out of V1** | 5s deadline needs a local indicator set that does not exist | Documented |
| **iOS** | **Out of scope** | Owner scoped the project to Android only | — |

---

## 3. What this session verified rather than assumed

The brief is explicit that reported results are not permission to assume. Each of these was tested:

1. **Test count.** 317 claimed, 317 confirmed, now 363.
2. **RLS.** Tested with the **publishable key** — the one in every browser bundle. All six tables
   return nothing and `consume_rate_limit` refuses to execute. A service-role query was deliberately
   not treated as evidence, because the service role bypasses RLS.
3. **Cross-user isolation.** Two real signed-in users. The non-owner reads 0 rows and cannot update
   or delete. A forged `user_id` is refused by the policy's `WITH CHECK`, so ownership does not
   depend on the server remembering to filter.
4. **Append-only triggers.** Attempted as the **service role**, the one role RLS cannot stop:
   refused with `relation public.case_events is append-only; rows cannot be updated`. This was the
   claim the previous session explicitly could not support.
5. **Delete cascade.** Deleting the account removed its case, artifacts, events and consent receipts.
6. **Migration state.** The previous session recorded two migrations as unapplied. They are applied —
   every table and column confirmed by probing, with the probe first validated against a
   deliberately non-existent table.
7. **Rate limiting.** 12 allowed, 13th refused, correct `Retry-After`, `scope=shared` throughout.
8. **Android toolchain.** Re-checked as the brief asks. `java`, `adb`, `sdkmanager`, `gradle`,
   `kotlinc`, `emulator` all absent; no Android Studio; `ANDROID_HOME` unset.

---

## 4. Defects found and fixed this session

Each was found by running something, not by reading.

| # | Defect | How it was found |
|---|---|---|
| 1 | `/api/health` reported `caseStorage: true` and `sharedRateLimiting: true` from configuration alone — a green tick over tables that might not exist | Wiring the health check |
| 2 | Contract divergence: the route accepted `allowCloudAI`, the contract documented `allowCloudAi`. A client built from the contract would have had cloud AI silently stuck off, with no error | Writing the Android client from the contract |
| 3 | DNS rebinding in the SSRF guard — validate-then-fetch, with `fetch` resolving a second time | The threat model's own open-gap list |
| 4 | Both UPI parsers stopped at the first space, dropping the **amount** from a QR whose payee name contained an unencoded space | An Android unit test in CI |
| 5 | The product flagged **its own safety advice** as `elevated_risk` | The detection benchmark |
| 6 | Tamil script and Devanagari scored **0% recall** — no coverage at all | The detection benchmark |
| 7 | A Tamil rule fired on bare English "KYC update", scoring a genuine bank notice at 6 | The detection benchmark |
| 8 | A capital `I` in `netfIix` defeated brand detection, and brand checks ignored subdomains entirely | The detection benchmark |
| 9 | Prototype pollution: `actionState: "toString"` passed enum validation and returned `Object.prototype.toString` as a recovery plan | A guard test |
| 10 | AGP 8 could not resolve current AndroidX at all — 32 AAR errors demanding AGP 9.1+ | The first CI run |
| 11 | Kotlin pinned to 2.2.10 while dependencies carried 2.4.0 metadata | The second CI run |
| 12 | `android:Theme.Material.DayNight.NoActionBar` does not exist | The third CI run |

Items 10–12 are the argument for CI being the build: none of them was findable on a machine with no
JDK, and all three were found within an hour of pushing a workflow.

---

## 5. Honest gaps, restated

No feature in §2 marked tested is untested, and nothing marked verified was inferred. The gaps
worth naming plainly:

- **Nothing has run on an Android device or emulator.** The APK is built by CI; no human or test has
  launched it. Every Android claim in this repository is "compiles and its pure logic is tested".
- **The detection corpus and the detection rules share an author.** 100% on it measures coverage of
  anticipated patterns. `docs/DETECTION_BENCHMARK.md` §0 refuses the accuracy reading at length.
- **Case endpoints have never completed an HTTP round trip.** The store layer is verified directly
  against the database; the routes are verified only on their refusal paths.
- **No URL reputation is consulted.** There is no provider and no abstraction.
- **No image analysis.** A screenshot of a scam is not analysed.
- **`TRUSTLENS_HMAC_KEY` is unset**, so rate-limit tokens are an unkeyed hash.
- **Nothing is deployed.** No production deploy, no merge to `main`, no Play submission.

---

## 6. The next five things, in order

1. Case endpoints end to end with a real session — the last unverified backend layer.
2. Consent endpoints, so the verified `consent_receipts` table is actually used.
3. Google sign-in on Android, then the case-history screens.
4. A device or emulator run. Until then no Android behaviour is claimed.
5. Threat-intelligence provider evaluation, including commercial-use rights.
