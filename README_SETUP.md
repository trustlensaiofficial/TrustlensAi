# TrustLens AI setup

## Stack
- Next.js App Router
- Supabase SSR client helpers
- Vercel deployment from GitHub

## Environment variables
Copy `.env.example` to `.env.local` for local development and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the Supabase project URL and publishable key only. Never expose a Supabase secret/service-role key in browser code or commit any real credentials.

For Vercel, add both variables to Preview first to validate the pull request deployment. Add Production values after the preview is reviewed.

## Current scope
This branch contains a starter UI and client helpers only. It does not create database tables, change RLS policies, implement authentication, or call an AI provider. Those should be designed and reviewed separately before use with real user data.

## Dependencies
Dependency versions are pinned in `package.json`. Generate and commit `package-lock.json` with npm before merging to establish a reproducible install.
