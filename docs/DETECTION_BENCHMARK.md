# Detection Benchmark

**Date:** 2026-11-04 · **Corpus:** `tests/fixtures/corpus.ts` · **Runner:** `scripts/benchmark-detection.mjs`
**Regression test:** `tests/detection-benchmark.test.ts`

```bash
npx vite-node scripts/benchmark-detection.mjs
```

---

## 0. Read this before quoting any number from this page

The headline figure below is **100% precision and 100% recall on a 61-case corpus**. That sentence
is true and it is also the most misleading thing in this document if it is repeated without what
follows.

**What it means:** the engine correctly handles every case in a corpus of 61 labelled messages.

**What it does not mean:** that TrustLens detects 100% of scams. It does not, and nothing here
measures that.

The specific reasons to distrust the number as an accuracy claim:

1. **The corpus and the rules were written by the same process.** Several rules exist *because* a
   corpus case failed. That makes this a measure of how well the engine covers patterns someone
   already thought of — coverage, not accuracy. A corpus written independently would score lower,
   and that is the figure that would matter.
2. **61 cases is small.** With 33 scam cases, one miss moves recall by three points. The confidence
   interval around any of these percentages is wide.
3. **These are written messages, not collected ones.** Real messages contain typos, odd
   formatting, emoji, truncation and mixed scripts in proportions this corpus only approximates.
4. **It measures the deterministic layer only.** No network, no AI. That is deliberate — it is the
   part that is reproducible — but it is not the whole product.

`docs/PRODUCT_CHARTER.md` §6 item 7 required a measured figure before any accuracy claim could be
made. This is that figure, and the honest public form of it is **"we measure ourselves against a
published corpus, here are the numbers and here is the corpus"** — not a percentage on a slide.

**Still forbidden:** "99% accurate", "detects all scams", "never misses", or any figure presented
without the corpus it came from.

---

## 1. Method

| | |
|---|---|
| Corpus | 61 cases — 33 scam, 28 benign |
| Languages | English, Tamil (Latin script), Tamil script, Hindi (Latin script), Devanagari |
| Threshold | A case counts as **flagged** at `high_risk` or `elevated_risk` |
| `some_signals` | Counts as **not flagged** |
| Live checks | Off |
| Cloud AI | Off |

### Why `some_signals` does not count as a detection

It is the engine saying "worth a look", which is not a warning. Counting it would raise recall by
moving the goalposts rather than by detecting anything more, and it would make the figure
unfalsifiable — almost everything scores at least 3.

### Why the benign half is as large as the scam half

A detector that flags everything scores perfect recall and is worthless. Worse than worthless:
people stop reading warnings that are always on, and then the one that mattered is ignored too. So
28 of the 61 cases must come back clean, and several are written to look alarming while being
completely ordinary — a genuine bank debit alert, a real refund notice, a friend asking for money
back, a real UPI bill request, and the product's own safety advice.

---

## 2. Results

### Overall

| Metric | Value |
|---|---|
| True positives | 33 |
| False positives | **0** |
| False negatives | 0 |
| True negatives | 28 |
| Precision | 100% |
| Recall | 100% |

### By language

| Language | n | TP | FP | FN | TN | Precision | Recall |
|---|---|---|---|---|---|---|---|
| English | 34 | 18 | 0 | 0 | 16 | 100% | 100% |
| Tamil (Latin) | 11 | 6 | 0 | 0 | 5 | 100% | 100% |
| Tamil script | 5 | 3 | 0 | 0 | 2 | 100% | 100% |
| Hindi (Latin) | 7 | 4 | 0 | 0 | 3 | 100% | 100% |
| Devanagari | 4 | 2 | 0 | 0 | 2 | 100% | 100% |

Per-language figures are reported because an overall number hides a language scoring zero — which
is exactly what the first run found.

### Class separation

Benign cases score 0 almost without exception; the highest benign score is 1. Scam scores run from
10 to 42, median 20. The `elevated_risk` threshold sits at 10, so the margin is real rather than
balanced on a knife edge — a property the regression test asserts directly, because a threshold
that only just works today will stop working on the first new rule.

---

## 3. What the first run found

The benchmark earned its place immediately. Measured before any of the fixes below:

**Overall: precision 95.2%, recall 60.6%.**

| Language | Recall, first run |
|---|---|
| English | 77.8% |
| Tamil (Latin) | 83.3% |
| **Tamil script** | **0%** |
| **Hindi (Latin)** | **25%** |
| **Devanagari** | **0%** |

Eight defects, each found by measurement rather than by reading the code:

1. **The product flagged its own safety advice.** "Never share your OTP or UPI PIN with anyone" came
   back `elevated_risk` — the isolation rule matched the surface form of a secrecy demand. The
   distinguishing feature is the object: a scammer telling you to keep your OTP from *everyone* is
   incoherent, because they are the one who wants it. Fixed in `match-safety.ts`.
2. **Tamil script and Devanagari scored zero.** The Tamil rules covered Latin script only and there
   was no Hindi coverage at all, so a message naming an OTP and demanding it in Hindi returned
   `no_signals_detected` — not a warning, and not an admission of ignorance either. `lib/analysis/indic.ts`
   now covers Hindi in both scripts and Tamil script, with the demand allowed on either side of its
   object because these languages put the verb last.
3. **A Tamil rule fired on bare English.** `ta.account_block` matched the phrase "KYC update",
   so a genuine bank notice saying "no action is needed online" scored 6. Tightened to require a
   Tamil marker.
4. **Investment promises were under-weighted.** "Guaranteed returns of 20% per month with zero
   risk" produced one signal. Added `investment.guaranteed_return`.
5. **Utility disconnection threats had no rule.** Added `utility.disconnection_threat` and
   `channel.supplied_number` — a number inside the message is the sender's number, whoever they
   claim to be.
6. **The "new number" impersonation had no rule.** Added `impersonation.new_number`.
7. **"No interview required" had no rule**, in any language. Added `job.no_screening`.
8. **A capital I defeated brand detection.** `netfIix-billing.example.com` lowercases to `netfiix`,
   which a reader sees as "netflix" because the glyphs are identical in most fonts — but the case is
   gone before the URL arrives, and mapping every `i` to `l` would wreck ordinary words. Brand
   checking also only compared the *registrable* domain, so a brand in a subdomain was invisible.
   `url.ts` now checks each subdomain token for a near miss.

**Deliberately not changed: the risk threshold.** Three misses sat at score 9, one point below
`elevated_risk`, and lowering the threshold to 6 would have cleared several at once. The score
distribution said no — one genuine benign case also scored 6, so the cut would have created a false
positive on a real bank notice. The threshold was right; the detection was incomplete. Fixing rules
is slower than moving a number and it is the only one of the two that is actually an improvement.

---

## 4. Known gaps

Not measured, and therefore not claimed:

- **An independent corpus.** The single most valuable next step, and the only thing that would turn
  coverage into accuracy.
- **Field false-positive rate.** Zero on 28 benign cases is encouraging and is not a rate.
- **Adversarial robustness.** Nobody has tried to write a message specifically to defeat these
  rules. Someone who reads `detectors.ts` can.
- **Image and screenshot analysis.** Not implemented, so a scam delivered as a picture is missed
  entirely. Stated in `uncertainty.limits` on every report.
- **Volume.** 61 cases. A production corpus would be thousands.
- **Bengali, Telugu, Marathi, Kannada, Malayalam, Gujarati, Punjabi.** No coverage, and none
  claimed.

---

## 5. Reproducing it

```bash
# The full table, with every miss and false alarm listed
npx vite-node scripts/benchmark-detection.mjs

# The floors, as a test
npx vitest run tests/detection-benchmark.test.ts
```

The test asserts floors rather than exact figures — precision ≥ 95%, overall recall ≥ 90%,
per-language recall ≥ 80% — so an improvement is never a failure. The one assertion with no slack is
**zero false positives**, and nine specific cases are pinned individually because each was a real
defect that must stay fixed.
