# TRUSTLENS AI — PROJECT SHOWCASE EXPERIENCE
## Cinematic Introduction • Official Branding • Voice-Narrated Explainer • Interactive Feature Tour • Premium Futuristic UI

## Mission

Build an exceptionally polished, creative, and fully interactive **TrustLens AI hackathon prototype** inside the existing project. This prototype is being prepared for second-round selection, so judges must quickly understand the problem, experience the solution, and remember the innovation.

This is a prototype for selection and demonstration, not a production launch. Prioritize the visitor experience, strong visual storytelling, working interactions, realistic scenarios, and reliable operation.

**The experience must begin with a cinematic TrustLens AI introduction, display the official logo directly beneath the product name, present a start button, play a short animated explainer with voice narration and captions, and then guide judges through the features one by one through interactive clicks.**

Do not return only a plan, screenshots, a design description, or code snippets that are not integrated. Implement the experience in the actual codebase and test it.

## 1. Work in the existing project

- GitHub: https://github.com/trustlensaiofficial/TrustlensAi
- Existing prototype reference: https://trustlensai-u2r6.vercel.app
- Vercel project: trustlensai-u2r6
- Supabase project reference: pwieplvvzftxdxvoueed

Inspect the repository, current design, routes, components, assets, dependencies, and documentation before changing anything. Use connected GitHub, Vercel, and Supabase tools where relevant.

Preserve the existing Next.js, React, and TypeScript foundation. Reuse working components and analysis logic. Create a dedicated showcase route if that is the safest way to add the experience, and connect the existing entry point to it clearly.

Do not replace the project with an unrelated template, break current functionality, overwrite unrelated user changes, or make unnecessary production infrastructure changes. This is a prototype build, not a reason to create an entirely new production backend.

## 2. Cinematic opening screen

Create a full-screen opening scene that feels like a premium, futuristic technology experience.

Use:
- Deep obsidian and midnight backgrounds.
- Restrained champagne-gold illumination and delicate metallic hairlines.
- Soft ambient light blooms and carefully layered depth.
- Elegant typography, balanced negative space, and subtle geometric motion.
- A consistent visual system that feels sophisticated rather than noisy.

Present the content in this exact visual order:

1. **TRUSTLENS AI** — prominent, carefully animated brand name.
2. **The official TrustLens AI logo directly beneath the name.**
3. Tagline: *See the signal. Understand the evidence. Know your next move.*
4. A prominent curved, pill-shaped **ENTER THE EXPERIENCE** button.
5. A smaller accessible **Skip Intro** action.

The product name and official logo must feel like one composed brand presentation. Use the actual logo asset supplied to the working environment. Preserve its appearance and aspect ratio. Do not invent, redraw, distort, or replace it. If the supplied asset truly cannot be found, continue the rest of the work and report this limitation.

Opening motion should reveal the atmospheric background, product name, logo, tagline, and CTA in a deliberate sequence. Keep the experience fast, responsive, and skippable; never trap visitors in an animation. Respect reduced-motion preferences.

The curved main CTA needs a refined gold-lit edge, precise icon alignment, a clear focus state, and a satisfying pressed state. It must respond immediately and work reliably.

## 3. Animated explainer with voice narration

After the visitor activates ENTER THE EXPERIENCE, transition into a short, cinematic, video-like explanation. Implement it as a real animated web experience, not an empty video placeholder or static image with a play button.

Aim for about 25–40 seconds, with five coordinated scenes:

1. **The problem:** Show a fictional suspicious job offer, unexpected invoice-payment change, or misleading link.
2. **The investigation:** Transition into the TrustLens AI interface as it examines the submitted content.
3. **The evidence:** Reveal sample indicators while clearly distinguishing observations, interpretations, and unknowns.
4. **The next step:** Turn the findings into practical actions that help the user make a more informed decision.
5. **The invitation:** Bring the experience together and invite the judge to explore the working prototype.

Use carefully timed scene transitions, animated interface elements, evidence cards, subtle parallax, and refined lighting. Avoid random particles, constant pulsing, excessive effects, and long pauses.

Use CSS, SVG, and React components or existing project dependencies where appropriate. Do not make the prototype depend on a fragile external video URL.

### Narration script

Use a clear, natural, professional voice to deliver this short explanation:

“Every day, people encounter suspicious job offers, unexpected payment requests, and links that may not be what they seem.

TrustLens AI helps you examine the warning signs, understand the evidence, and see what still needs to be verified.

But it goes beyond a warning. It guides you toward practical next steps, so you can make a more informed decision.

Welcome to TrustLens AI. Explore the investigation, discover the evidence, and find your next safe action.”

Synchronize the narration with the relevant visual scenes.

Use browser-native speech synthesis if supported and reliable, or an existing appropriate audio asset/service if genuinely available. Do not depend on a missing API key or an unstable external service.

Provide:
- Play, pause, resume, and replay controls.
- A visible voice on/off control.
- Readable captions synchronized with scenes and narration.
- An accessible text transcript.
- A progress indicator and current scene label.
- A Skip control available throughout the explainer.
- A way to continue when speech synthesis is unavailable.
- Reliable voice cleanup when the explainer is skipped, closed, replayed, or unmounted.
- Protection against overlapping speech caused by repeated clicks.
- No unexpected audible narration before user interaction.

Browser speech voices vary. Captions and the transcript must always be available, and the explainer must remain excellent when muted.

At the end, offer **EXPLORE THE PROTOTYPE** and **Skip to Features**. Both must lead to the real interactive feature tour.

## 4. Interactive feature tour

Build a guided experience in which judges explore one feature at a time. It must feel like using a live prototype, not moving through a static slideshow.

Provide:
- A central interactive demonstration area.
- Active-feature title and concise plain-English explanation.
- An interactive example of the selected feature.
- A feature navigation panel.
- Current-step indicator and progress.
- Previous and Next controls.
- Direct clickable selection of any feature.
- Restart Tour and Return to Introduction options.
- Persistent access to Start Investigation.
- Mobile-friendly navigation such as a compact stepper or dropdown.

Selecting a feature must update the active selection, content, explanation, and progress. Previous/Next must remain synchronized with direct selection. Each feature must demonstrate distinct behavior; do not repeat one generic screen with different headings.

At the end, show a clear completion state and options to restart or start an investigation. Support keyboard and touch navigation.

## 5. Features to demonstrate

### Feature 01 — Meet TrustLens AI

Introduce the problem, the solution, and the workflow:

**Input → Investigation → Evidence → Uncertainty → Next action**

Let the visitor reveal or highlight each step. Include a working action to start a sample investigation.

### Feature 02 — Choose an investigation

Expose input types the existing application truly supports, such as messages, URLs, and claims. Provide these fictional sample scenarios:
- Suspicious recruitment offer.
- Changed invoice payment details.
- Suspicious link or possible impersonation.

Selecting a scenario must populate the correct example and update the state. Use helpful labels and guidance. Do not present unsupported file uploads or input types as functional.

### Feature 03 — Watch the investigation

Show a polished, clearly labeled demo sequence:
- Understand the submitted content.
- Identify relevant signals.
- Examine available evidence.
- Separate observations from interpretation.
- Prepare practical next steps.

Use clear stage indicators, an animated progress line, and refined motion. The sequence must finish reliably, allow retries, and reset cleanly. Do not fake live network activity or pretend that a backend exposes progress stages when it does not.

### Feature 04 — Explore the evidence

Present an interactive report with expandable/collapsible findings. Each finding should explain:
- What was noticed.
- The exact wording or observation involved.
- Why it matters.
- What the observation does and does not establish.

Use real report data where possible. Where the experience uses prewritten sample data, identify it as illustrative. Preserve provenance distinctions when available:
- Deterministic rule findings.
- Retrieved observations from checks that actually ran.
- Model-generated interpretation.

Do not invent sources, completed external checks, or verification results.

### Feature 05 — Understand what remains unknown

Separate what is supported from what cannot currently be established. Let the visitor expand unknowns and see why additional information may be needed.

Do not invent confidence probabilities or imply that the absence of a warning proves something is genuine. Make uncertainty a strength of the product experience.

### Feature 06 — Find the next safe action

Make this the most memorable differentiator. Display a scenario-specific checklist with:
- Recommended action.
- Why it matters.
- The finding that prompted it.
- How to do it safely.
- A working checkable control.

Examples include independently checking an employer’s official careers page or confirming a payment change through a previously trusted contact method.

Checklist interaction must visibly work. Distinguish a suggested action from completed verification. Persist state only when genuinely supported; otherwise keep it in the demo session and label it accordingly.

### Feature 07 — Review the report

Provide a coherent report view containing assessment, summary, findings, uncertainty, and recommended actions. Add real interactions such as expanding details, jumping to a finding, copying the actual summary, returning to actions, and starting another investigation.

Clipboard actions must copy the content currently displayed and accurately report success or failure. If file export is implemented, it must generate a real downloadable file.

### Feature 08 — History and quick navigation

Show available sample reports, reports created in the current demo session, or genuine stored reports if supported by the existing implementation. Clicking an item must open the correct report. Clearly distinguish demo records from actual analysis results.

Provide working navigation to the workspace, feature tour, and new investigation. Do not claim browser-local demo history is permanent cloud storage or cross-device synchronization.

## 6. The signature LensDock floating button and menu

Create a branded floating action control called **LensDock**. It should be a polished, curved pill or carefully shaped floating button with a precise icon, subtle gold-lit border, restrained glow, and refined interaction states.

When activated, reveal an elegant floating menu panel. Potential actions include:
- Explore Features.
- Start Investigation.
- Load a Sample Scenario.
- Return to the Current Report.
- Open the Next-Action Checklist.
- View Available History.
- Open Quick Help.
- Return to Introduction.

Show only contextually relevant actions.

Requirements:
- Trigger opens and closes reliably.
- Each menu item performs its intended action.
- Smooth but quick transitions.
- Appropriate outside-click dismissal.
- Escape key closes the panel.
- Keyboard focus is visible and logical.
- Accessible semantics and names.
- No overlap with essential content or forms.
- Responsive placement within mobile safe areas.
- Compact mobile panel or bottom sheet when more usable.

No decorative menu items or dead buttons. Keep icon sizes, alignment, labels, spacing, and radii consistent.

## 7. Visual quality and animation system

Make the entire experience feel like one carefully designed product. Apply a coherent system for:
- Obsidian backgrounds and gold-lit edges.
- Typography and spacing.
- Curved buttons and consistent radii.
- Icon sizes and visual weight.
- Cards, panels, borders, and glows.
- Hover, pressed, active, and focus states.
- Loading states and scene transitions.
- Evidence reveals, dialogs, and floating panels.

Use subtle, purposeful motion: gentle entrance transitions, small directional movement, refined panel expansion, animated evidence reveals, and restrained atmospheric depth. Do not animate everything simultaneously. Avoid aggressive neon, incessant pulsing, random motion, unnecessary particles, or effects that hurt readability, battery life, or performance.

Gold must not be the sole indicator of meaning or status. Respect reduced-motion preferences. Do not replace the existing product identity with a generic template.

## 8. Make the prototype reliable without production dependencies

Reuse real APIs and services where functional, but make the introduction, narrated explainer, feature navigation, sample scenarios, evidence exploration, and checklist work without unnecessary external network requests.

Keep three modes distinct:
1. Actual functionality supported by the application.
2. Deterministic prototype/demo behavior with sample data.
3. Features that require a service that may be unavailable.

If AI Gateway or Supabase is unavailable, the prototype must still demonstrate its intended journey using clearly labeled sample data. Different scenarios must produce distinct, internally consistent reports; do not return the same canned report for every case.

Never present a prewritten report as real live AI analysis. Never claim a URL was externally checked unless that check actually ran. Do not expose credentials in client code.

Provide predictable replay, reset, skip, restart, and error recovery. Ensure navigation does not leave the application in a broken state.

## 9. Existing project and service safety

Inspect the repository’s existing routes, components, analysis pipeline, and report contract. Preserve working functionality. Avoid unnecessary schema and backend changes.

The connected Supabase project has previously contained public.scans, public.analysis_reports, and public.analysis_history; inspect current state before making any change. Do not reset data, drop tables, replay migrations blindly, expose private records, or change security policies simply to simplify the demo.

Do not commit secrets. Do not deploy to production or merge changes without authorization. Keep changes reviewable and preserve unrelated working-tree changes.

## 10. Responsive and accessible behavior

Test narrow phones (including widths around 320–375 CSS pixels), common iPhone and Android sizes, tablets, and desktop screens.

Check:
- No horizontal overflow.
- Correct title and logo alignment.
- Opening scene fits the viewport.
- Captions and transcript remain readable.
- Voice controls are obvious and accessible.
- Feature navigation adapts to mobile.
- LensDock remains reachable and safe-area aware.
- Report details remain readable.
- Dialogs fit the screen.
- Essential controls do not rely on hover.
- Keyboard navigation and focus visibility work.
- Reduced-motion preferences are respected.
- The whole experience remains understandable when muted.

Voice must enhance the prototype, never be the sole means of understanding it.

## 11. Implementation and testing

Work directly in the existing codebase. Inspect first, implement the full experience, and test it.

Run the actual project checks when available:
- npm run typecheck
- npm run lint
- npm test
- npm run build

Then test this whole journey:
1. Open the project.
2. See the TrustLens AI name and official logo.
3. Enter the experience.
4. Play, pause, resume, mute, and replay the animated explainer.
5. Read the captions and transcript.
6. Skip or finish the explainer.
7. Open the feature tour.
8. Select every feature directly.
9. Navigate forward and backward.
10. Start, reset, and switch between all sample scenarios.
11. Expand and collapse evidence and unknowns.
12. Use the next-action checklist.
13. Copy the actual report summary.
14. Open and close LensDock and test each item.
15. Navigate to history and reopen the correct available report.
16. Refresh and restart the demonstration.
17. Check mobile layouts.
18. Check for console errors, dead controls, and broken links.

Use browser automation if available. Do not claim a test passed unless it was run. Fix discovered defects before completion. If something cannot be tested because of missing permissions or unavailable tools, state the exact limitation.

## 12. Final handoff

Report:
- What was actually implemented.
- The entry point or route for the showcase.
- Whether the official logo was located and integrated.
- How narration and captions work and which environments were tested.
- Which tour features and demo interactions were verified.
- Commands executed and their actual results.
- Remaining issues or missing assets.
- Verified repository and deployment status, if applicable.

Clearly distinguish tested work from partial or untested work.

## Final standard

When a judge opens TrustLens AI, they should experience:
1. A stunning cinematic brand reveal.
2. The official logo displayed directly beneath the product name.
3. A clear button that starts the experience.
4. A short animated explanation with voice, synchronized captions, and controls.
5. A guided feature tour where every feature can be opened individually.
6. A convincing investigation from suspicious content to evidence, uncertainty, and the next safe action.
7. A polished floating LensDock with genuinely working shortcuts.

The judge must understand what TrustLens AI does, why it matters, and how this prototype demonstrates its innovation.

**Do not stop at the opening animation. Build the entire experience behind it, integrate it into the existing project, and verify the full visitor journey.**