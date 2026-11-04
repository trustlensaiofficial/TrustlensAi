# Competitor Research — Step 2

**Date:** 2026-11-04 · **Branch:** `product/real-platform-foundation`

Two things happened in the two months before this document was written that between them
invalidate most of what a 2025-era scam-detection pitch would have said. This document records
them accurately, including the parts that are bad news for TrustLens, because a positioning built
on a competitor we have mis-described collapses the first time a judge, an investor or a user
checks.

---

## 1. Truecaller Scam Checker — launched September 2026

### What it actually is

A free scam-checking destination on the Truecaller **web** site (global) and the **Android** app
(India first), announced 27–28 September 2026. No download and no sign-in required for basic use.

It accepts:

- a **phone number**
- a **link**, including shortened URLs
- a **suspicious message**
- a **free-text description** of a concern, in the user's own words

It answers by drawing on Truecaller's detection systems plus **Scamfeed**, its crowdsourced scam
report platform, and surfaces related reports from other people describing similar scams.

Screenshot upload, user authentication and broader scam-technique coverage are stated as planned,
not shipped. iOS is planned. Fuller phone-number detail stays behind an app login.

### What this kills

**The claim "Truecaller only identifies phone numbers" is now false.** It takes links, messages and
free-text. Any TrustLens material that says otherwise is wrong and must be corrected — this is
already on the forbidden-claims list in `docs/PLATFORM_CAPABILITIES.md` §6 and stays there.

It also removes "we have a web checker, they don't" from our differentiators entirely.

### Where Truecaller is genuinely stronger than us, and will stay stronger

1. **Crowdsourced scale.** Scamfeed has a reporting population we do not have and cannot
   manufacture. Our campaign clustering runs on synthetic data today (`docs/REPOSITORY_AUDIT.md`
   §3). Honest statement of our position: we have the *mechanism* for corroboration, not the
   *corpus*.
2. **Phone-number reputation.** Decade-scale number intelligence. We should not pretend to
   compete here and should not build a worse version of it.
3. **Distribution.** Hundreds of millions of installed users in India.

### Where it is weak, from the evidence available

- **It shows community reports rather than explaining its own reasoning.** The verdict's basis is
  "other people reported this", which is social proof, not evidence from the message in front of
  you. A novel scam with no reports yet is the exact case where a user needs help most.
- **No payment-instruction parsing** is described anywhere in the launch coverage. Nothing
  reads a `upi://` link and tells you which direction money would move.
- **No incident response.** Nothing in the launch addresses the user who has already paid.

---

## 2. Google — Android scam defences, announced 14 October 2026

### What was announced

- Google's Scam Detection flags **more than 5 million suspected scam calls and texts a month**.
- A new **enhanced protection mode** in Google Messages: on-device detection augmented by cloud
  Gemini models through **Private AI Compute**, to read complex conversation context and infer a
  scammer's intent earlier in a chat **with an unknown sender**. Encrypted, in an environment
  Google states it cannot otherwise access.
- Devices: Pixel 6 and up, Galaxy S24 and up, Galaxy Z Fold 6 / Flip 6 and up, and other Android
  AICore devices.
- **Scam Detection in chat notifications expands beyond Pixel** to HONOR, Infinix, iQOO, itel,
  JOVI, Motorola, OPPO, OnePlus, realme, TECNO, vivo and Xiaomi — on-device, flagging suspicious
  messages **in the notification shade, before the chat app is opened**.
- Redesigned link warnings, giving more time and clearer context before tapping a link from a
  number not in Contacts.

### This one hurts, and the plan has to change

TrustLens's Android design (`docs/PLATFORM_CAPABILITIES.md` §2) uses
`NotificationListenerService` to classify notifications from an allowlist of messaging apps. As of
October 2026 **Google ships that same capability at the OS layer, on twelve OEMs' devices,
on-device, with no permission for the user to grant and no third-party app to install.**

We cannot win that fight and should not enter it:

- Google sits below us in the stack. Their notification classification runs before ours.
- `NotificationListenerService` requires an intimidating Settings grant. Google's requires nothing.
- Google's on-device models and telemetry are beyond anything this project can match.

**Conclusion: notification monitoring is not a differentiator. It is table stakes we partially
duplicate.** It stays in the roadmap as a convenience for users on devices or apps Google does not
cover, and it is demoted from "core capability" to exactly that. Positioning TrustLens on
"we watch your notifications" would be positioning it against the operating system itself.

### Where Google is weak, from the evidence available

- **Scoped to unknown senders in Messages.** The documented behaviour targets conversations with
  senders not in Contacts. A great deal of Indian fraud arrives from a *saved* contact — a
  compromised account, a known number reused, a "family emergency" from a hijacked WhatsApp — and
  on WhatsApp, Telegram and Signal rather than in Messages.
- **Warning, not explanation.** The coverage describes redesigned warnings with "clearer context".
  There is no documented quoting of the specific span that triggered the flag, no account of which
  check fired, and no statement of what was *not* checked.
- **No payment-instruction reading** is described: not `upi://` parsing, not QR payloads, not the
  direction money would move.
- **Nothing after detection.** No reporting workflow, no evidence pack, no recovery steps.
- **Device-gated.** Enhanced protection needs recent flagship-class hardware. A large share of
  Indian handsets are not on that list.

---

## 3. What is left that is genuinely ours

Each of these is defensible because it is a product decision neither competitor has made, not a
claim about having better models. We do not have better models than Google. We should never say we
do.

### 3.1 The payment-action question — the strongest one

Neither competitor answers *"what is this message persuading me to do with my money, and which way
would the money move?"*

The specific mechanism, which is now implemented in `lib/analysis/payment-action.ts`:

- A UPI PIN **authorises a payment**. It is never how money is received. So "accept the request
  and enter your PIN to receive your refund" describes money moving in the opposite direction from
  what it promises, and that single sentence is worth more to a frightened reader than any score.
- **NPCI discontinued person-to-person collect requests on 1 October 2025** precisely because of
  this scam; only registered merchants can send one now. An individual claiming to send you a
  payment request is describing a mechanism UPI no longer offers. That is a hard, checkable fact,
  and it is the kind of finding a generic scam classifier cannot produce.
- "Scan this QR to receive your refund" is the same inversion: a pay QR presented as a collect.

This is deterministic, explainable, India-specific, and verifiable by the reader against NPCI's own
published position. It does not depend on a model, a corpus or a crowd.

### 3.2 Evidence and provenance

Both competitors return a judgement. Neither, on the available evidence, shows the quoted span
that caused it, separates a fixed rule from an AI reading, or states what it did not check.

TrustLens does all three, and `uncertainty.notChecked` is non-hideable in the contract
(`docs/FRONTEND_HANDOFF.md` §10). This is the one place where being smaller is an advantage: a
platform shipping to a billion handsets cannot afford to show its working; a focused product can.

### 3.3 Incident response — an unoccupied space

Nobody in either launch helps the person who has already paid. The Indian machinery that matters:

- **1930**, the national cyber-fraud helpline, logs into **CFCFRMS**, which alerts whichever bank
  or wallet currently holds the money and asks it to freeze the amount before it moves again.
- **cybercrime.gov.in** for the formal complaint.
- The **Money Restoration Module** under I4C (Ministry of Home Affairs) for funds already
  intercepted and held.
- Reporting in the **first 24–48 hours** materially improves the chance of a freeze.
- **Chakshu** for suspected fraudulent *communications* — not interchangeable with 1930, which is
  for actual financial cybercrime.

And the second-order harm, which is the part no product addresses: **fake recovery agents**, who
target people who have just been defrauded and are findable precisely because they complained in
public. A victim is at their most vulnerable immediately after the loss. A product that walks
someone through 1930 and CFCFRMS *and* tells them that anyone promising to recover their money for
an upfront fee is running the second scam is doing something genuinely unserved.

We must still never promise recovery. `recoveryPlan.disclaimer` is mandatory in the contract.

### 3.4 Coverage Google's scope leaves open

Known senders. Apps other than Messages. Pasted screenshots. Devices outside the enhanced-protection
list. None of this is a claim to be better — it is a claim to be *present* where the OS feature is
not.

### 3.5 Tamil and Indian-language explanation

Not detection in Tamil — explanation in Tamil. The reason this matters is that the person being
defrauded is often not the person holding the phone's default language setting.

---

## 4. Positioning, in one paragraph

> TrustLens AI is not a better scam detector than Google or Truecaller, and does not claim to be.
> It answers a different question. Where they tell you a message is suspicious, TrustLens tells you
> what the message is trying to make you *do with your money* — which way the money would actually
> move, which specific words made it think so, and what it could not check. And where they stop at
> the warning, TrustLens keeps going: the official reporting channel for your situation, the
> evidence pack to file with it, and a warning about the recovery scam that comes next.

Three sentences, no superlatives, nothing a journalist could falsify.

---

## 5. Claims now banned by this research

| Never say | Because |
|---|---|
| "Truecaller only detects phone numbers" | Scam Checker takes links, messages and free text |
| "We're the first AI scam detector" | Google has flagged 5M+/month and Truecaller shipped in September |
| "Unlike Google, we use AI" | Google uses on-device models plus cloud Gemini via Private AI Compute |
| "Our AI is more accurate than Google's" | Unmeasured, unmeasurable by us, and almost certainly untrue |
| "Nobody else checks links or messages" | Both do |
| "Only we work on Android notifications" | Google ships this on twelve OEMs as of October 2026 |
| "We can monitor WhatsApp messages" | Forbidden on both platforms — `PLATFORM_CAPABILITIES.md` §6 |

---

## 6. Sources

- [Truecaller takes its scam intelligence to the open web — TechCrunch, 27 Sep 2026](https://techcrunch.com/2026/09/27/truecaller-takes-its-scam-intelligence-to-the-open-web-as-it-looks-beyond-caller-id/)
- [Truecaller takes scam intelligence to the open web with a checker — MediaNama, Sep 2026](https://www.medianama.com/2026/09/223-truecaller-scam-intelligence-open-web-checker/)
- [Truecaller Scam Checker Brings Together Scam Detection and Community Intelligence — ANI, 28 Sep 2026](https://aninews.in/news/business/truecaller-scam-checker-brings-together-scam-detection-and-community-intelligence20260928140741/)
- [Google Messages adding 'enhanced protection mode' — 9to5Google, 14 Oct 2026](https://9to5google.com/2026/10/14/google-messages-enhanced-protection-mode/)
- [Google Rolls Out AI Scam Defenses Across Android Messages and Calls — Unite.AI](https://www.unite.ai/google-rolls-out-ai-scam-defenses-across-android-messages-and-calls/)
- [Google expands Android scam protection with AI checks for texts and calls — Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/android-scam-protection-ai-messages-calls)
- [NPCI to end UPI P2P collect requests from October 1 — Outlook Money](https://www.outlookmoney.com/banking/npci-to-end-upi-p2p-collect-requests-from-october-1-to-reduce-fraud)
- [NPCI notification on discontinuation of UPI Collect Request for P2P — TeamLease RegTech](https://www.teamleaseregtech.com/updates/article/45492/npci-issued-a-notification-regarding-the-discontinuation-of-the-servic/)
- [MRM Portal: Recover Money Lost to Cyber Fraud](https://myarjuna.com/mrm-portal-cyber-fraud-money-recovery)
- [Fake Fund Recovery Agents: How Investment Scams Work — HDFC Sky](https://hdfcsky.com/sky-learn/scam-shield-by-sky/fake-fund-recovery-agent-scams)

Dated claims above are as of 4 November 2026. Competitor capability moves fast; re-verify before
any public statement.
