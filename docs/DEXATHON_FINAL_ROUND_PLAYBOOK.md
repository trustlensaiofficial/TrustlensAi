# DEXATHON 2026 — Sathyabama Final-Round Playbook

**Team:** Reshiram  
**Team ID:** DEX26223  
**Project submitted:** TrustLens AI  
**Track:** Open Innovation / Software  
**Planning date:** 2 November 2026

This document is the working preparation guide for the 24-hour on-campus final. It distinguishes published event information from details that still require organizer confirmation.

## 1. What the published event pages say

The DEXATHON event pages describe three stages:
1. Round 1 — PPT / idea submission.
2. Round 2 — prototype submission and evaluation.
3. Final — a 24-hour physical hackathon at Sathyabama, followed by project presentation and judging.

The final-stage description says finalists come together to build, test, and present a solution during the 24-hour sprint. The public pages do **not clearly state** whether teams must continue the submitted project unchanged, respond to a new on-the-spot problem statement, or adapt their submitted project to a surprise challenge. Get written confirmation from an organizer before changing the project direction.

## 2. Published logistics (verify before travel)

- Event dates shown: **4–5 November 2026**.
- Published schedule: on-spot registration 8:00–9:00 AM on 4 Nov; inauguration 9:30 AM; sprint begins 10:30 AM; sprint ends 10:30 AM on 5 Nov; valedictory / winner announcement 10:30–11:30 AM.
- Team size: **4–6 members**.
- Every participant should bring a valid college/student ID.
- The pages state a final-round fee of **₹250 per participant**.
- The pages advertise food, midnight snacks, and campus accommodation/rest facilities.
- One page names **Dr. Remibai Jeppiaar Auditorium – Hall No. 01**; another names **Indoor Auditorium**. Confirm the exact reporting gate, hall, and accommodation instructions with the organizers.
- Published organizer contacts include Mukesh M. (+91 97909 17850), Cyril Jones (+91 97515 61948), M.S. Viswa Shree (+91 73056 29539), and Pragalya R. (+91 87546 63949). Confirm these numbers from the current official event communication before relying on them.

## 3. Project decision: preserve TrustLens AI

The team's selected and submitted project is TrustLens AI. The recommended default is to continue and materially improve that same project rather than arrive with an unrelated idea. The event pages describe one project submission per team and a final build/present stage; they do not publish a definitive new-problem-statement rule.

**Do not switch project themes unless the organizers explicitly instruct all finalists to solve a new prompt.**

TrustLens AI should demonstrate:
- Analysis of suspicious messages and payment requests.
- URL / website risk inspection with safe-fetch controls.
- Clear evidence excerpts and why each matters.
- Separation of deterministic rules, retrieved evidence, and AI interpretation.
- Explicit unknowns and failed/unavailable checks.
- Actionable next steps (verify independently, do not share OTP/PIN, contact the institution using a known channel).
- A saved, shareable analysis report where authentication and persistence are available.

Never claim a message or website is definitively safe or verified without authoritative evidence.

## 4. 24-hour build plan

### Before the event (2–3 Nov)
- Freeze a known-good baseline; keep the production deployment stable.
- Clone the GitHub repository onto at least two team laptops.
- Confirm Node/npm versions, install with `npm ci`, and run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Verify required environment variables locally using `.env.example`; never commit `.env.local` or secrets.
- Test the production URL and health endpoint; separately test actual analysis, report save/read, Google sign-in, and passkey flows.
- Prepare a demo dataset of safe, synthetic scam examples. Do not use real victims' private messages or live payment details.
- Prepare an offline fallback: deterministic analysis, local screenshots/video, and a short scripted walkthrough in case Wi-Fi, AI Gateway, or auth is unavailable.
- Confirm team roles, laptops, chargers, hotspot, extension board rules, and presentation responsibilities.

### Sprint timeline (10:30 AM 4 Nov → 10:30 AM 5 Nov)
| Time window | Focus | Exit condition |
|---|---|---|
| 10:30–11:30 | Read the final instructions; clarify any surprise prompt; agree scope | One-page scope and acceptance criteria |
| 11:30–13:00 | Reproduce baseline; select one high-value improvement | Baseline runs on a clean laptop |
| 13:00–18:00 | Build core improvement and tests | Main user flow works end-to-end |
| 18:00–22:00 | Integrate UI, analysis, evidence, persistence | No fake buttons or placeholder results |
| 22:00–02:00 | Test edge cases, security, failure modes | Demo cases pass; failures explained |
| 02:00–05:00 | Polish UX, accessibility, performance | Stable presentation build |
| 05:00–08:00 | Prepare slides, architecture, impact, limitations | Pitch and demo rehearsed |
| 08:00–10:00 | Freeze features; final clean build and backup | Tagged final commit and backup |
| 10:00–10:30 | Final submission and handoff | Submission confirmed before cutoff |

The schedule above is a team planning proposal, not an organizer-issued timetable beyond the published start/end times.

## 5. Suggested team roles

Assign these roles to the actual team members before the event:
1. **Team lead / product & pitch:** scope, judge communication, final narrative.
2. **Frontend / UX:** analysis flow, evidence display, responsive UI.
3. **Backend / integration:** API routes, AI Gateway, persistence and auth integration.
4. **Analysis / security:** deterministic rules, URL safety, evidence provenance, test cases.
5. **QA / demo / documentation (if fifth member):** regression tests, demo data, slides, backups.
6. **Flexible integrator (if sixth member):** integration support, deployment, test automation.

One person may cover multiple roles in a 4-person team. Keep one person responsible for final integration and one for final presentation.

## 6. Judging story

Use this simple narrative:
1. **Problem:** people are asked to act quickly on messages, links, job offers, invoices, and payment requests, often without enough evidence.
2. **Gap:** a generic “scam / not scam” label does not explain what was checked, what remains unknown, or what action to take.
3. **Solution:** TrustLens AI combines transparent deterministic checks, source evidence, cautious AI explanation, uncertainty, and safe next steps.
4. **Live demo:** paste a synthetic bank-impersonation message → inspect highlighted warning signs → open the evidence trail → show unknowns → follow the action checklist → save/report.
5. **Trust boundary:** show that the tool assists decisions; it does not certify a sender or guarantee safety.

## 7. Final-round acceptance checklist

- [ ] Final instruction / problem-statement policy confirmed with organizers.
- [ ] Venue hall, reporting time, fee, and accommodation confirmed.
- [ ] Every participant has student ID and registration confirmation.
- [ ] Clean clone and dependency install work on two laptops.
- [ ] Lint, type-check, tests, and production build pass.
- [ ] Core analysis works with AI enabled and with AI unavailable.
- [ ] URL analysis rejects private, loopback, link-local, and metadata destinations.
- [ ] Reports do not expose another user's data.
- [ ] No secret is committed to GitHub or included in demo slides.
- [ ] Demo examples are synthetic and reproducible.
- [ ] Final commit, source backup, slides, screenshots, and demo video are saved.
- [ ] Final presentation rehearsed within the organizer's time limit.

## 8. Important discrepancy in public event information

Two public DEXATHON pages were indexed with inconsistent details:
- `https://dexathonwebsite2026.vercel.app/` lists Round 1 deadline 23 Oct, Round 1 result 26 Oct, Round 2 prototype deadline 28 Oct, result 31 Oct, and venue Dr. Remibai Jeppiaar Auditorium – Hall No. 01.
- `https://dexathon-2026.vercel.app/` lists different Round 1 / Round 2 deadlines and results, and calls the venue Indoor Auditorium.

Both pages show the 4–5 Nov final and 24-hour format. Since your team has already qualified, use the finalist confirmation message / organizer communication as the source of truth for exact hall, reporting time, and any last-minute instructions.

## 9. Message to send the organizer

Hello, we are Team Reshiram (DEX26223), qualified for the DEXATHON 2026 final round at Sathyabama. Our submitted project is TrustLens AI (Open Innovation / Software).

Could you please confirm:
1. In the 24-hour final, should we continue developing the same project submitted in Round 2, or will a new/on-the-spot problem statement be given?
2. If there is a surprise prompt, are we expected to adapt our submitted project or build a separate solution?
3. What is the confirmed reporting venue/hall and reporting time?
4. Are there any required technology, submission, presentation, or laptop/setup rules?

Thank you.

## Official/public links

- DEXATHON event page (bulletin version): https://dexathonwebsite2026.vercel.app/
- DEXATHON event page (alternate published version): https://dexathon-2026.vercel.app/
- TrustLens AI repository: https://github.com/trustlensaiofficial/TrustlensAi
- TrustLens AI production app: https://trustlensai-u2r6.vercel.app/
- TrustLens AI health endpoint: https://trustlensai-u2r6.vercel.app/api/health
- Vercel project: https://vercel.com/void-076c/trustlensai-u2r6
- Supabase project: https://supabase.com/dashboard/project/pwieplvvzftxdxvoueed

