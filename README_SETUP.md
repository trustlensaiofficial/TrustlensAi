# TrustLens AI setup

## Stack
- Next.js App Router
- Supabase SSR client helpers
- Vercel deployment from GitHub
- Vercel AI Gateway with Anthropic Claude via the AI SDK

## Environment variables
Copy `.env.example` to `.env.local` for local development and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `AI_GATEWAY_API_KEY`

Create an AI Gateway key in the [Vercel AI Gateway dashboard](https://vercel.com/ai-gateway), then add it to Vercel project environment variables. Keep the key server-side and never commit real credentials or expose it via a `NEXT_PUBLIC_` variable. The app calls `anthropic/claude-sonnet-4.5` from a server route; the model can be changed in `app/api/ai/route.js`.

For Vercel, configure Preview first to validate the pull request deployment. Add Production values after the preview is reviewed.

## AI endpoint
- `POST /api/ai` accepts JSON: `{ "prompt": "..." }`
- Returns JSON: `{ "text": "..." }`
- Input is limited to 8,000 characters and output is capped.
- The system prompt instructs Claude to distinguish claims from verified facts and not claim to have checked external sources unless evidence is provided.

## Safety and current scope
This is an initial integration, not a production-ready public AI service. Before enabling it for public users, add authentication, per-user rate limiting/quotas, abuse monitoring, and usage budgets. The starter does not create database tables, change RLS policies, or implement authentication. Do not send sensitive personal data until the product's data handling and retention choices are reviewed.

## Dependencies
Run `npm install` to generate `package-lock.json`, then run `npm run build` before merging.
