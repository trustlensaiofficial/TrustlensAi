# TrustLens AI

An evidence-first AI assistant that helps people examine suspicious messages, payment requests, offers, links, and public claims—then choose a safer next step.

## Stack
- Next.js App Router + React
- Claude through Vercel AI Gateway and the Vercel AI SDK
- Supabase Auth + Postgres with row-level security
- GitHub as source control; Vercel for previews and hosting

## Local setup
1. Install Node.js 20+ and Git.
2. Clone this repository and check out `setup/trustlensai-starter-clean` until the reviewed changes are merged.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local` and fill in values.
5. Run `npm run dev`; open `http://localhost:3000`.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (browser-safe; database access must be protected by RLS).
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key for local development. Keep it server-side. Vercel deployments may use configured Vercel OIDC access if supported by the project.

Never commit `.env.local` or put AI credentials in variables prefixed with `NEXT_PUBLIC_`.

## Features
- Text analysis through the server-side `POST /api/analyze` endpoint.
- Transparent rule-based warning signals alongside Claude's interpretation.
- Optional email magic-link authentication.
- Private saved analysis history through `GET /api/history`.
- Supabase row-level security restricts history to its owner.
- `/ai-test` is retained as a developer integration test page.

## Supabase
The SQL used for history is in `database/schema.sql`. The matching migration is applied to the configured Supabase project. Ensure email auth and redirect URLs are configured in Supabase Auth for localhost and the chosen Vercel domain.

## Deployment
- Vercel project: `trustlensai`, connected to this GitHub repository.
- Deploy and verify the preview first. Add the AI Gateway credential in Vercel's Environment Variables UI (Preview and Production as needed); never commit it.
- After a successful preview build and an end-to-end test, promote/deploy the reviewed commit to Production.
- Redeploy after changing environment variables.

## Safety and scope
This is a hackathon prototype, not a guarantee of fraud detection. Rule-based signals are heuristics, not proof. The app does not browse or independently verify live websites. Never paste passwords, OTPs, recovery codes, or sensitive personal data. Before public launch, add durable per-user/IP rate limits, abuse monitoring, retention controls, budget alerts, and an external-source verification pipeline.
