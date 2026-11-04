# TrustLens AI — Mobile-first product experience specification

Status: implementation brief for the existing TrustLens AI codebase.
Base: `main` at `96e0c34f89ffe8a542495eaef4e3c79ff83d861d`.
Target: a polished, installable, mobile-first web application (PWA), not a marketing page or a fake demo.

## Product principles
- Preserve the existing deterministic analysis engine, URL checks, evidence provenance, incident response guidance, Kaval, Supabase auth/storage, RLS, rate limits and SSRF protections.
- Never replace working functionality with mock data or inert visual controls.
- Keep the interface simple, high-craft, cinematic and touch-first. Every interactive control must have a real outcome and visible feedback.
- Treat trust as a product property: clearly label evidence, unknowns, AI interpretation, unavailable checks and capability boundaries.
- Do not claim universal spam blocking, guaranteed scam detection, end-to-end encryption, background SMS/WhatsApp monitoring or contact scanning unless each is implemented, permissioned and independently verified.

## 1. Opening / welcome
- Full-screen immersive opening with the official TrustLens mark and wordmark.
- Animate the mark reveal, light bloom, wordmark and concise product promise in a deliberate cinematic sequence.
- Use a living dark visual environment: layered depth, subtle 3D parallax/orbiting geometry, light particles and slow motion. Keep performance excellent on mid-range phones; avoid heavy continuous GPU effects.
- Main Start action is a floating glass card/button with a tactile press state, a light ripple/bloom on touch and clear keyboard focus.
- Secondary sign-in path is understated.
- Respect prefers-reduced-motion, low-power/mobile performance and contrast requirements. Never trap a user in an intro; allow skip/continue and remember completion appropriately.

## 2. Authentication
- The first Start action routes to the real login flow.
- Google OAuth and WebAuthn/passkeys must be wired to existing Supabase auth implementation. No fake login buttons or simulated success.
- Preserve safe redirect handling, callback validation, session refresh and logout.
- Clearly explain first-time passkey enrollment requirements and fallback if the browser/device does not support passkeys.
- Test OAuth redirects against canonical domain and all allowed callback URLs. Never ask users to paste secrets into the UI or chat.

## 3. App shell and dashboard
- After authentication, show a true app-style home dashboard, not a generic admin dashboard.
- Mobile: safe-area-aware full-height shell, responsive content, thumb-reachable controls, sensible scroll behaviour and no horizontal overflow at 320px.
- Desktop: centered product canvas with deliberate max width; preserve the same visual language.
- Central feature grid in an intentional, easy-to-understand order. Cards are floating glass surfaces with depth, icon, short title, one-line explanation and tactile hover/press states.
- Suggested order: Message Check; Link & Website Check; Bank / UPI Protection; Job Offer Check; Invoice & Payment Check; Incident Response; Reports & History; Learn / Safety Guide.
- Each card navigates to its actual feature route with a refined transition (shared motion language, swipe/slide where appropriate). Each feature page has a clear back-to-dashboard action and preserves relevant state.
- Do not add a large conventional navigation menu. Use a compact floating utility panel for Kaval assistant, settings, account/profile and help. It must be accessible by keyboard and screen reader and dismiss predictably.
- Keep the interface copy short and understandable. Remove duplicated headings, filler copy and technical jargon from user-facing surfaces; retain important evidence, limitations and privacy explanations where they matter.

## 4. Interaction language / visual system
- Use a coherent design system: spacing, typography, icon sizes, radii, surfaces, glass blur, elevation, focus, active/pressed/disabled states and motion tokens.
- Touch feedback: soft light bloom/ripple, small press depth and restrained motion on card/button interaction. Do not make every decorative object move constantly.
- Provide dark and light themes with tested contrast in both.
- Use consistent, original iconography. Icons must be meaningful and every interactive icon must have an accessible name.
- Avoid layout shift, inaccessible low-contrast text, hover-only controls, excessive blur and animations that block use.

## 5. Kaval assistant
- Make Kaval easy to find and simple to use from the floating utility panel.
- Keep local deterministic safety guidance available without cloud AI.
- Cloud AI remains opt-in and must show what context is sent before consent. Clearly label unavailable/billing-blocked state.
- Kaval must not invent bank actions, claim to contact authorities, or imply it can reverse/freeze payments.

## 6. Analysis and alerts
- Preserve existing deterministic checks and evidence-first reports.
- Clearly identify source/channel where known (user-pasted SMS, email, chat, URL, notification shared by the user, etc.). Never guess the source.
- Explain risk type, exact matched evidence, checks performed, unknowns, recommended next steps and emergency steps if money/credentials were shared.
- Alerting in the web app is limited to events the browser is actually allowed to observe: in-app analysis, user-shared content and user-enabled browser notifications. Do not claim to inspect incoming SMS, WhatsApp, phone calls, contacts or other apps in the background from a normal website.
- If a native Android app is developed later, notification-listener access must be an explicit optional permission with a clear explanation, local processing/app allowlist where feasible, revocation path and Play policy review. Do not request SMS/call-log, accessibility, overlay, microphone or location permissions for the web MVP.
- Number changes, spoofing and impersonation should be explained as risk factors; do not claim to identify the real caller or track scammers without authoritative data.

## 7. Privacy and permissions
- Ask for no permission at first launch unless a feature truly needs it.
- Use progressive consent at the moment of need. Explain purpose, scope, processing location, retention and how to revoke before opening the system permission prompt.
- Contacts are not required for core protection. Prefer a system contact picker only if a future feature has a justified need; never upload the address book.
- No permission should be requested merely to make the app feel powerful.
- Do not claim end-to-end encryption unless the system encrypts content end-to-end with a documented key model and tested implementation. Explain transport encryption, server processing, local history and account sync accurately.
- Keep cloud AI and account report sync separately opt-in. Redaction guidance must be visible before sending OTPs, PINs, passwords, CVVs or sensitive identifiers.

## 8. Reports and exports
- Preserve evidence provenance and uncertainty.
- Provide a clean, professional PDF/report layout with date, report reference, summary, risk classification, source as provided, exact evidence excerpts, checks performed, unknowns, recommended next actions and emergency resources.
- PDF export must be readable on phone and desktop, printable and localized where translation is available.
- Saved report history must show whether a report is local or account-synced; provide delete controls and honest retention behaviour.

## 9. Full interface localization
- Implement a central translation system for every user-facing string, not just Kaval output.
- Initial language set: Indian English, Tamil (native script), Hindi, Telugu; design the catalog so Kannada, Malayalam, Bengali and Marathi can be added.
- Language selection must update navigation, cards, forms, validation, statuses, errors, alerts, settings, privacy text, reports and accessible labels.
- Use locale-appropriate fonts and line heights; test text expansion, mixed-script rendering and screen-reader pronunciation.
- Do not machine-translate legal/security-critical content without review. Mark any untranslated strings rather than silently falling back inconsistently.
- Detection-language coverage must be separately benchmarked; translating the UI does not mean the detection engine supports that language.

## 10. PWA / phone experience
- Validate manifest, icons, service worker, install prompts and offline fallback.
- Ensure installable on supported Android browsers and iOS Add to Home Screen guidance.
- Offline mode may show cached shell and saved local reports; new server analysis/live URL checks require connectivity and must be labelled.
- Test on 320px, 360px, 390px, 430px widths and tablet/desktop; verify safe areas, keyboard, virtual keyboard, orientation, scroll and no overflow.
- Do not imply that PWA can access native-only capabilities.

## 11. Quality and release gates
- Run lint, typecheck, full test suite and production build.
- Add unit/integration tests for auth redirects, localization completeness, feature navigation, consent gates, alert permissions, report export and reduced motion.
- Run mobile browser QA on real routes and real API responses, including benign and malicious test cases in every claimed detection language.
- Verify Supabase migrations, RLS, ownership, auth providers and redirect URLs. Verify server-only secrets remain server-only.
- Verify live deployment and domain after release. A READY deployment alone is not proof the custom domain serves it.
- Keep a release checklist with PASS / FAIL / NOT TESTED and evidence. Never describe unimplemented work as complete.

## 12. Implementation order
1. Audit current repo and live deployment; map every existing route, component, API and integration. Do not overwrite working modules.
2. Build the cinematic opening and cohesive motion/surface design system.
3. Refine real login and auth states.
4. Rebuild the app shell/dashboard/feature navigation around existing working routes.
5. Refine feature screens and Kaval.
6. Implement centralized full-UI localization.
7. Complete report export and mobile PWA QA.
8. Harden privacy, consent and permission flows; document web/native boundaries.
9. Run full checks, fix failures, deploy a candidate, manually verify candidate, then promote and verify the canonical domain.
10. Publish an honest release report and known limitations.

## Definition of done
The user can install/open TrustLens on a phone, start at the cinematic welcome screen, sign in with a real supported provider/passkey, reach a polished feature dashboard, navigate each real feature, investigate a message/link, understand evidence and unknowns, get context-aware next steps, use Kaval, switch the entire UI language, export a professional report, manage privacy/settings/profile and return to the dashboard. All critical paths work on mobile and desktop; all permissions are justified; no false capability claims remain; the actual production domain is smoke-tested.
