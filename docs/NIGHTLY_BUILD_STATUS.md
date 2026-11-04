# Build Status Checkpoint

**Updated:** 2026-11-04, late session · **Branch:** `product/real-platform-foundation`

A handoff note: where things stand, what is proven, what is not, and the next command to run.

---

## 1. State

| | |
|---|---|
| Branch | `product/real-platform-foundation`, pushed |
| Web gate | `tsc` clean, `eslint` clean, **363 tests passing**, `next build` clean |
| Android CI | **Green** — compile, unit tests, lint, APK all pass |
| APK | `trustlens-debug-apk`, 51.4 MB, 563 entries, 14 dex files, structurally verified |
| Deployed | **Nothing.** No production deploy, no merge to `main`, no Play submission |

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
