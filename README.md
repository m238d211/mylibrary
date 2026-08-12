# MyLibrary

MyLibrary is a public, login-free directory of useful and recently active web-development tools. It collects public GitHub and npm signals on a bounded weekly schedule, classifies tools with deterministic keyword rules, and stores a transparent score breakdown in Supabase.

## Architecture

- Next.js App Router and Server Components for public pages.
- Supabase PostgreSQL for tools, metrics, collection runs, and private report idempotency.
- Server-only Route Handler for the Vercel Cron entrypoint.
- GitHub REST and npm APIs are called from the server only. Nodemailer sends the weekly report through private SMTP credentials to `OWNER_EMAIL` and the optional `SECONDARY_OWNER_EMAIL`.
- No visitor accounts, subscriptions, Firebase, or client-side API secrets.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

The public UI intentionally renders an empty state until Supabase is configured and the first collection is reviewed and published.

## Environment variables

Required for the public database-backed app: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Supabase calls this the low-privilege publishable key; it is safe to expose in the browser because RLS still protects the database.

Required for collection and email: `SUPABASE_SECRET_KEY`, `GITHUB_TOKEN` (optional for low-volume public requests), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `OWNER_EMAIL`, and `CRON_SECRET`. Set `EMAIL_FROM` and `SECONDARY_OWNER_EMAIL` when needed. The Supabase secret key and SMTP password are server-only and must never begin with `NEXT_PUBLIC_`.

Never expose the Supabase secret/service-role key, SMTP password, GitHub, or Cron secrets to client code. Keep values in Vercel Environment Variables or local `.env.local`; `.env*` files are ignored except `.env.example`.

## Supabase

Run `supabase/migrations/202608120001_initial.sql` in the Supabase SQL editor or through the Supabase CLI. The migration creates `categories`, `tools`, `tool_metrics`, `collection_runs`, and `weekly_reports`, plus public-read RLS policies. Anonymous writes are intentionally not granted; collection writes must use the service-role client from a server-only module.

For the MVP, review and publish records directly in Supabase. A full owner authentication system is deliberately excluded to avoid introducing a second identity system before the data model is proven.

## Collection schedule

`vercel.json` runs `/api/cron/collect` every Monday at 03:00 UTC (07:00 in Iraq during UTC+4; 06:00 when Iraq is UTC+3). Vercel must provide the matching `CRON_SECRET` authorization. The current route validates the boundary; API fetching, upserts, and private reporting are the next collection phase.

## Scoring and classification

Scores are capped and normalized: downloads (30), GitHub stars (25), repository activity (20), release recency (15), plus a small baseline, with penalties for archived repositories and missing repositories. The weekly collector searches multiple npm queries including React, Tailwind CSS, Axios, TanStack, TypeScript, testing, forms, authentication, animation, accessibility, databases, and build tools, then enriches candidates with GitHub metadata and npm weekly downloads. Status labels are derived only from the resulting score. Category classification uses documented keyword mappings in `lib/classification.ts`; it is deterministic and does not claim that any tool is objectively best.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment notes

1. Create a Supabase project and run the migration.
2. Create a GitHub token with the least access required for public repository reads.
3. Create an SMTP app password or SMTP credential with your email provider and set the SMTP variables.
4. Add environment variables to Vercel for Preview and Production.
5. Deploy and confirm the Cron request returns `401` without the secret and proceeds with it.

The current workspace has no credentials, so live Supabase, GitHub, Resend, Vercel, mobile-browser, and production bundle verification remain pending.
