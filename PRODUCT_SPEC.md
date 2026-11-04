# TrustLens AI — Product Contract and Feature Status

**Positioning:** India-first scam investigation and response assistant.

**Core promise:** Help a person understand what a suspicious communication is asking them to do, inspect the evidence available, and choose a safer next action. TrustLens does not promise to eliminate spam, identify every fraudster, or guarantee that a message is genuine.

This document distinguishes working web-prototype capabilities from proposed future product capabilities. A screen or roadmap item is not proof of a working integration.

## 1. The problem we own

Caller-ID and spam filters are useful, but caller identity is not the same as request legitimacy. A scam may move from a call to a messaging application, then to a website, a QR/payment request or remote-access software. A warning about one message may not explain the payment action, preserve the evidence or guide someone who has already acted.

TrustLens focuses on the **scam-to-action gap**:

1. What is the person trying to make me do?
2. What evidence supports concern, and what remains unknown?
3. What should I do before acting — or immediately after I already acted?

TrustLens complements existing call and message protections. It is not a Truecaller replacement or a universal blocker.

## 2. Current web-prototype features

| Feature | Current implementation | Important boundary |
|---|---|---|
| Manual message investigation | Paste message/chat/email text into the web checker. | The text is sent to the TrustLens web backend for analysis; it is not currently analysed entirely on-device. |
| Context-aware rules | Generic, bank/payment, job-offer, invoice, investment proposal and website contexts. | Rule-based patterns are not proof of fraud or identity. |
| Indian bank and UPI scam signals | OTP/PIN/password requests, account-block threats, safe-account transfers, fake support numbers, remote-access requests and UPI collect/approve-to-receive wording. | It cannot inspect a bank's private systems or confirm the bank account holder. |
| QR-payment wording | Detects text that claims scanning a QR code is how to receive a refund or money. | The current web prototype does **not** decode QR images or inspect an actual UPI payment intent. |
| English and Tanglish detection | Deterministic rules for English and common Tamil-in-Latin-script scam wording. | Tanglish spelling varies. Native Tamil-script detection is not implemented. |
| Explanation language | Indian English, Tamil explanation written in Latin letters, and Hindi explanation written in Latin letters. | This is not full native-script Tamil/Hindi support or a guarantee of equivalent detection quality. |
| URL structure analysis | Offline URL parsing, hostname/domain structure and lookalike comparisons. | A structurally unusual URL is a signal, not proof the site is malicious. The public-suffix approximation can mis-handle unusual domains. |
| Optional live URL evidence | User can opt to make a server-side DNS and metadata-only HTTP check. Redirects are followed manually and each destination is revalidated; time and response-size caps apply. | No full browser rendering, JavaScript execution, download, WHOIS/domain-age lookup, certificate identity investigation or comprehensive reputation feed. DNS rebinding is not fully eliminated because the resolved address is not pinned to the socket connection. |
| Evidence provenance | Separates deterministic rule matches, retrieved observations and model inferences. | Retrieved page metadata does not authenticate a sender or prove a site's ownership. |
| Uncertainty and unknowns | Displays checks performed, checks not performed and method limits. | Missing warning signals must never be interpreted as a safety certificate. |
| Next-step checklist and verification questions | Context-sensitive checklist and questions to ask through an independently chosen channel. | Guidance is general information, not a substitute for the bank, regulator, lawyer or police. |
| Interactive incident response | After each report, the user selects the furthest action taken: received only, opened link, shared credentials, installed app, remote access, approved payment or sent money. The response plan changes to match that state. | The selected state is local UI state and is not added to the stored report. Detailed action steps are currently English-only. TrustLens cannot reverse a payment, freeze an account, remove malware remotely or guarantee recovery. |
| India escalation | Surfaces 1930 and the National Cyber Crime Reporting Portal for suspected financial cyber fraud. | Users must contact their bank/payment provider directly. A TrustLens report is not an official police complaint. |
| Kaval safety guide | Built-in local rule-based answers for report explanations and common incident questions; cloud AI is separately opt-in. | Local Kaval is a limited deterministic guide, not a general-purpose AI assistant. |
| Report history | Browser IndexedDB, up to a bounded number of recent reports, with individual and clear-all deletion. | Device/browser-specific, not encrypted by TrustLens at rest, not synced, and may be lost if site data is cleared. |
| Account-synced reports | Optional, explicit user choice; requires signed-in user, service-side storage and ownership column. Authenticated history lists only that account's reports, with delete controls. | Depends on Google/passkey auth and the owner-column migration/config being enabled. Otherwise save fails closed and the report stays local. |
| Campaign examples | Demonstration campaign cards are explicitly simulated. | No live, validated community threat-intelligence network is currently operating. |
| Accessibility and presentation | Responsive web UI, theme toggle, demo cases and status notices. | This is a web prototype, not the Android app. |

## 3. Privacy and consent contract

- No contacts permission is required for the core web experience.
- No SMS inbox, call-log, accessibility, location, microphone or overlay permission is required by the current web prototype.
- The user manually submits content. The content is sent to TrustLens' backend because deterministic analysis currently runs on the server.
- External model interpretation is **off by default**. Only when the user enables the cloud-AI control is the submitted text, warning matches and available link evidence sent to the configured AI provider.
- Kaval external AI is also **off by default**. When enabled, the recent chat and visible report context are sent to the configured provider.
- Account storage is **off by default**. Only a signed-in user who explicitly enables account sync can save the report to their account. A missing ownership column causes a failed save, never an ownerless fallback.
- Device history uses browser IndexedDB. It is local to the browser profile; it is not a substitute for encrypted backup.
- Users should redact passwords, OTPs, UPI PINs, CVVs, full card numbers and unnecessary identifiers before submitting text or opting into an external model.
- Do not claim that data is never processed by the TrustLens server, never retained by a model provider, or used under a particular provider's training/retention terms unless those terms and the deployment configuration have been verified.

### Future Android permission model (not implemented)

| Capability | Policy |
|---|---|
| Manual share/paste | Preferred default; no broad device permission. |
| Optional notification monitoring | Requires Android notification-listener access. Android can deliver notifications from multiple apps; an app allowlist is a TrustLens-side filter, not a narrower Android permission. Must disclose this plainly and process only selected app notifications locally where possible. |
| Contacts | Not needed for MVP. Consider a system contact picker for user-selected comparisons only; never upload the address book. |
| SMS/Call Log | Do not request in MVP. Google Play restricts these permissions and default-handler/exception rules apply. |
| Accessibility / overlay | Do not request for this product. |
| Location / microphone | Do not request for core scam analysis. |
| QR camera | Only request camera access when the user starts QR scanning; provide image-picker alternative. |

The Android service, notification filtering, local model, contact picker and Play Store policy declarations must be separately implemented and tested before those features can be claimed.

## 4. Security and reliability boundaries

- Server-side input validation and rate limiting are present; the current rate limiter is per serverless instance, not globally coordinated.
- URL fetching refuses many private/reserved address ranges, revalidates redirects and caps time/bytes. DNS rebinding is a known residual risk until IP pinning or a hardened fetch proxy is used.
- User-submitted content is treated as untrusted data in AI prompts. This reduces prompt-injection risk but cannot make model output infallible.
- No analysed content should be logged. Only short operational error markers may be logged.
- Database writes require server credentials; browser clients should not receive a service-role key. RLS must remain fail-closed.
- Cloud AI errors or disabled consent must not remove deterministic findings. UI must identify whether cloud interpretation ran.
- Confidence labels are not calibrated probabilities. Do not publish accuracy numbers without a labelled test set.

## 5. Not implemented — do not claim in a demo

1. Native Android application, notification-listener service or automatic monitoring of SMS/WhatsApp notifications.
2. Universal call identification, call blocking, SMS blocking or automatic spam deletion.
3. Access to WhatsApp's private database, private chats or encrypted message contents.
4. Contacts upload or complete address-book analysis.
5. QR image decoding, UPI intent verification, payment confirmation or automated payment blocking.
6. Screenshot/OCR, document attachment, image, audio, voice-clone or video/deepfake analysis.
7. Live fact-checking against academic publications, news archives, company registers, bank APIs or government databases.
8. Phone-number reputation, SIM identity, caller authentication or proof of a sender's identity.
9. Live community reporting/campaign intelligence. Current campaign cards are demo-only synthetic data.
10. Automatic police, bank, RBI, NPCI or telecom integration; automatic account freeze or payment reversal.
11. Guaranteed offline new-message analysis. Saved reports and local guidance may open offline; new web analysis and live checks require connectivity.
12. 100% scam/spam detection or a guarantee that a message with no matched rules is safe.

## 6. Evaluation gates before any production claim

Maintain a versioned, consented and lawfully sourced benchmark with malicious and benign examples. Include English, Tanglish and Tamil-script inputs; real UPI/QR wording; job, loan, invoice, KYC, remote-access and impersonation scenarios; and adversarial variants.

Measure precision, recall, false-positive rate, false-negative rate, confidence calibration, per-language/category performance, detection latency, user task success and privacy leakage. A new rule is not accepted just because it catches one scam: it must also pass benign controls and negative-instruction tests.

Release gates:
- Typecheck, lint, unit tests and production build pass.
- Every demo produces the expected result; benign examples are not over-flagged.
- No cloud model call occurs without the explicit opt-in field.
- No account write occurs without an authenticated user and the ownership column.
- Account history returns only the session owner's reports; delete removes the server copy.
- SSRF tests cover IPv4/IPv6 private ranges, redirect chains and DNS rebinding mitigations.
- Mobile layout, keyboard access, screen-reader labels and reduced motion are verified.
- Production smoke tests verify actual deployment behaviour, not just successful CI.

## 7. Product roadmap

**Immediate web-prototype hardening:** opt-in AI and storage, fail-closed account ownership, account history/delete, QR refund wording demo, protective OTP-warning regression tests, privacy copy and honest capability labels.

**2–4 week pilot:** native Android manual share target, user-selected QR image scanning, on-device deterministic checks, optional notification-listener prototype with app allowlist and local processing, language benchmark and a small consented pilot.

**3–6 month production work:** hardened SSRF fetch proxy with DNS pinning, shared rate limiting, reviewed threat-intelligence integrations, calibrated detection benchmark, abuse-resistant opt-in campaign intelligence, accessibility/security review, Play policy review and Indian privacy/legal review.

The roadmap is not a statement that these future capabilities already exist.
