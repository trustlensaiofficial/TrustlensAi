# Build Status Checkpoint

**Updated:** 2026-11-05 · **Merged to:** `main` at `054c0ae`

A handoff note: where things stand, what is proven, what is not, and the next command to run.

---

## 1. State

| | |
|---|---|
| Branch | Merged into `main` via PR #55 as `054c0ae`. PR #54 closed as merged; `integration/final-release` preserved |
| Web gate | `tsc` clean, `eslint` clean, **363 tests passing**, `next build` clean |
| Android CI | **Green** — compile, unit tests, lint, APK all pass |
| APK | `trustlens-debug-apk`, 51.4 MB, 563 entries, 14 dex files, structurally verified |
| Deployed | **Not deployed.** `main` is green in GitHub Actions, but all three Vercel projects refuse to build — `upgradeToPro=build-rate-limit`. The same failure is on `main` from before this release, so it is an account quota, not this code |
| Production right now | `https://trustlens.in` serves the **previous** build and is healthy — a real analysis returns `high_risk` with 8 signals. It has `/api/v1/analyses` and `paymentAction`, but not `/api/v1/consent`, `/api/v1/recovery-plan` or the case endpoints |

---

## 2. Verified by execution, not assertion

| What | How | Result |
|---|---|---|
| RLS, cross-user isolation, forged ownership, append-only triggers, delete cascade | `scripts/verify-security.mjs` | 23/23 |
| Case + consent API over HTTP with real sessions | `scripts/verify-case-api.mjs` | 61/61 |
| Detection, per language | `scripts/benchmark-detection.mjs` | 100% P/R on 61 cases |
| DNS rebinding closed | `tests/pinned-fetch.test.ts` | 14/14, incl. a live-socket attack |
| Shared rate limiting | 13 live requests | 12 allowed, 13th refused, `Retry-After: 52` |
| APK permissions | Compiled manifest read out of the artifact | 2 declared, 8 forbidden ones absent |
| Live URL checking still works after pinning | Real HTTPS fetch | Page title read; metadata/loopback refused |

---

## 3. Not verified, and therefore not claimed

1. **Nothing has run on an Android device or emulator.** No JDK or SDK on this machine. Every
   Android claim is "compiles in CI and its pure logic is tested".
2. **No real share tested from WhatsApp, Telegram or Gmail.** The source app decides what it
   includes; this cannot be reasoned about from code.
3. **The detection corpus and the detection rules share an author.** 100% on it measures coverage,
   not field accuracy. `DETECTION_BENCHMARK.md` §0.
4. **No URL reputation is consulted.** No provider, no abstraction.
5. **No image or screenshot analysis.** A scam sent as a picture is missed, and every report says so.
6. **`TRUSTLENS_HMAC_KEY` is unset**, so rate-limit tokens are an unkeyed hash.

---

## 4. Defects found and fixed this session

Twelve, each found by running something. Full list in [`MASTER_BUILD_AUDIT.md`](MASTER_BUILD_AUDIT.md) §4.

The three worth remembering:

- **Bearer tokens were rejected.** `getCurrentUser` read cookies only, so every authenticated route
  answered a native client 401 and the case endpoints were unreachable from a phone. The routes,
  the store and RLS were all correct; the gap sat exactly between the layers each suite covered.
- **The product flagged its own safety advice.** "Never share your OTP or UPI PIN with anyone" came
  back `elevated_risk`.
- **A typed parcelable call would have crashed on Android 12.** API 33 method, minSdk 26 — a
  `NoSuchMethodError` the first time anyone shared a message, on a large share of the target
  handsets. The compiler could not see it; lint could.

---

## 5. Next, in order

1. **Google sign-in on Android.** Case features need an account and there is no sign-in screen.
2. **Case history screens.** Endpoints verified; nothing renders them.
3. **A device or emulator run.** Until then no Android behaviour is claimed.
4. **Account deletion in-app.** The backend cascade is verified; there is no screen.
5. **Threat-intelligence provider evaluation**, including commercial-use rights.

### The next command

```bash
cd /Users/thajudeen/trustlensAI/.claude/worktrees/trustlens-ai-vercel-setup-4b64a4
npx vitest run && gh run list --workflow=android.yml --limit 3
```

---

## 6. Running the verifications

```bash
# Database access controls — creates and deletes its own test users
TRUSTLENS_ALLOW_DB_TESTS=1 node scripts/verify-security.mjs

# Case + consent API — needs a dev server
npx next dev -p 3000 &
TRUSTLENS_ALLOW_DB_TESTS=1 node scripts/verify-case-api.mjs http://localhost:3000

# Detection, with every miss and false alarm listed
npx vite-node scripts/benchmark-detection.mjs
```

Both verification scripts are guarded behind `TRUSTLENS_ALLOW_DB_TESTS=1`, create their users at
reserved `.invalid` addresses, touch no pre-existing row, and delete everything they made.


---

## 7. The release, and why production is still behind

`main` is at `054c0ae` with both GitHub Actions workflows green. Production is not on it.

**The blocker:** every Vercel deployment returns `?upgradeToPro=build-rate-limit`. Three separate
Vercel projects — `trustlensai`, `trustlensai-u2r6` and `trustlensaivoid` — are attached to this
repository, so a single push consumes three builds against one free-tier quota. The same checks
were already failing on `main` before this release, which is how we know it is not the code.

**What is actually live**, verified against `https://trustlens.in`:

| | |
|---|---|
| Site | HTTP 200 |
| `www.trustlens.in` | HTTP 308 → `https://trustlens.in/` — the required behaviour, already correct |
| Real analysis | Works: `high_risk`, 8 signals, `paymentAction` present, 6 not-checked items, AI honestly reported degraded |
| `/api/v1/analyses`, `/api/v1/capabilities` | Present |
| `/api/v1/consent`, `/api/v1/recovery-plan`, case endpoints | **404 — not deployed** |
| `caseStorage` in `/api/health` | Absent — predates this release |
| `trustlensai.in` | **No DNS records at all.** Not expired-looking, simply unresolved — not even NS |

**What the deploy would bring:** connection pinning against DNS rebinding, bearer-token auth (so
the case API is reachable from the phone at all), Hindi and native-script detection, the
safety-advice false positive fix, the UPI amount-truncation fix, consent endpoints, and the
case endpoints.

### Three owner actions, each one dashboard entry

1. **Vercel build quota.** Either upgrade the plan, or disconnect two of the three projects from
   this repository so one push costs one build instead of three.
2. **`AI_GATEWAY_API_KEY` billing** — `/api/health` has reported `billing_blocked` throughout.
   The product degrades honestly without it, so this is an enhancement rather than a fix.
3. **`TRUSTLENS_HMAC_KEY`** — unset, so rate-limit tokens are an unkeyed hash. Any long random
   string, set as a Vercel environment variable.

And one that needs the registrar rather than a dashboard: **`trustlensai.in` has no DNS.** Nothing
in this repository can restore it.
