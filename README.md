# ViralMotion AI

A modern, production-ready video generation platform integrating Runway ML for high‑quality, AI-assisted short-form video creation. The app provides a streamlined creation wizard, real-time job tracking with progress, queue and retry logic, premium advanced controls (A/B testing, batch variations, presets), smart suggestions, mobile optimizations (offline queue and notifications), team collaboration (shared templates, approvals, usage), and post-generation workflows (preview, versioning, download, share, and publishing).

Highlights
- Next.js App Router architecture with colocated UI, API routes, and server actions for a fast full-stack workflow. Environment variables are handled on the server by default; client-visible variables must be prefixed with NEXT_PUBLIC. [^1]
- Runway ML integration via secure server-side route handlers for job creation, status polling, analytics, queue, and retries.
- Premium experience: advanced generation controls, A/B testing, batch generation, presets, smart suggestions, and brand compliance checks.
- Mobile-first design with touch-friendly controls, offline queue management, and job completion notifications.
- Team features: shared generation templates, approval workflows, per-member usage analytics, and centralized billing/limits.
- Clean UI built with shadcn/ui components, Tailwind CSS, and Lucide icons for a consistent, accessible interface.

## Quick start

Prerequisites
- Node.js 18 or newer
- PNPM (recommended) or NPM/Yarn
- A Runway ML API key (for live generation)
- Optional: Supabase and Neon (Postgres) if you plan to persist jobs, analytics, templates

Clone and install
1. Clone this repository to your machine
2. Install dependencies
   - pnpm install
   - or: npm install

Environment configuration
- Local development (Next.js):
  - Create a file named .env.local in the repo root and add the environment variables listed below in the “Environment variables” section. Only expose values to the browser if they are prefixed with NEXT_PUBLIC. [^1]
- v0.dev preview:
  - .env files are not supported in the Next.js runtime. Configure variables from the project’s Environment panel or the integration settings in v0.dev.

Run the app
- Start dev server: pnpm dev
- Open the app at: http://localhost:3000

Build and run production
- Build: pnpm build
- Start: pnpm start

## Environment variables

These are commonly used variables in this project. Not all are required to start the UI, but Runway-related features need at least one API key configured.

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| RUNWAY_API_KEY | Yes (for live generation) | Server | Primary Runway ML API key used by server routes calling Runway. |
| RUNWAY_API_KEYS | Optional | Server | Comma-separated list of Runway API keys for key rotation and quota balancing. |
| NEXT_PUBLIC_SUPABASE_URL | Optional | Client | Supabase URL if using client features. Must be prefixed with NEXT_PUBLIC to be available in the browser. [^1] |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Optional | Client | Supabase anon key for browser usage. [^1] |
| SUPABASE_URL | Optional | Server | Supabase URL for server usage (auth, persistence). |
| SUPABASE_ANON_KEY | Optional | Server | Server usage of anon key (e.g., server actions). |
| SUPABASE_JWT_SECRET | Optional | Server | Supabase JWT secret if validating tokens server-side. |
| SUPABASE_SERVICE_ROLE_KEY | Optional | Server | Service role key for privileged operations on the server only. |
| POSTGRES_URL | Optional | Server | Neon/Vercel Postgres connection URL if persisting jobs/analytics. |
| POSTGRES_URL_NON_POOLING | Optional | Server | Alternative connection for background tasks or migrations. |
| POSTGRES_USER | Optional | Server | Postgres user. |
| POSTGRES_PASSWORD | Optional | Server | Postgres password. |
| POSTGRES_DATABASE | Optional | Server | Postgres database name. |
| POSTGRES_HOST | Optional | Server | Postgres host. |

Notes
- Never expose secret keys to the client; only variables prefixed with NEXT_PUBLIC are available in the browser. [^1]
- Configure variables in Vercel/V0 dashboard for deployed environments; use .env.local for local dev.

## What’s inside

Tech stack
- Next.js (App Router with server components and route handlers) [^1]
- TypeScript
- Tailwind CSS
- shadcn/ui component library
- lucide-react icons

Key features and modules
- Creation wizard: prompt optimization, style and quality mapping to Runway parameters, preflight cost estimation
- Progress and queue: animated progress UI with stages, ETA, queue position, cancel/retry; smart backoff and rate limiting
- Video management: instant preview on completion, versions, metadata, download/share, publish sheet
- Premium controls: side-by-side settings compare, A/B prompts, batch variations, custom presets
- Smart suggestions: AI-guided prompt improvements and style/duration/cost suggestions; designed to plug in AI SDK for prompt intelligence [^2]
- Team collaboration: shared templates, approvals, per-member usage analytics, centralized limits/billing
- Mobile-first: touch-friendly controls, offline queue, notifications for job completion

Monorepo: No (single app)
UI framework: shadcn/ui on Tailwind
Routing: Next.js App Router with colocated server logic

## Project structure

High-level overview of notable files and directories (non-exhaustive):

- app
  - (dashboard)
    - create
      - page.tsx — wizard screen
    - jobs
      - page.tsx — job center with real-time tracking
    - videos
      - page.tsx — generated videos list
      - [id]/page.tsx — video detail
    - analytics/page.tsx — analytics dashboard
    - preferences/page.tsx — user defaults and notifications
    - team/templates, team/approvals, team/usage — collaboration features
  - api
    - runway/jobs — job creation, status, retry
    - runway/queue — queue metrics
    - runway/analytics — job analytics
    - runway/quality-check — optional content checks
    - templates — job templates CRUD
    - trends — trend data for smart suggestions
- components
  - create — advanced controls, smart suggestions, progress, overlay
  - jobs — job center
  - publish — publish sheet
  - brand — brand compliance checks
  - dashboard — navigation components
  - ui — shadcn/ui wrappers and primitives
- hooks — use-job-tracker, use-offline-queue, use-notifications, use-presets, etc.
- services — Runway client, job manager, mock services, cost/quality helpers
- lib — queue, retry/backoff, rate limit, analytics, templates store, session utils
- public — images, audio, sample preview assets

## Development notes

- Server-only keys: Route Handlers keep provider keys off the client. Access environment variables exclusively on the server by default; only explicitly prefixed variables are exposed to the client. [^1]
- AI SDK: The UI and hooks are structured to plug in the AI SDK for prompt generation, rewriters, and suggestions when you choose to add it. [^2]
- v0.dev preview: When running in v0’s Next.js runtime, set environment variables via the v0 environment settings; local .env files are not read in that preview.

## Common scripts

Use these with PNPM or your package manager of choice.
- pnpm dev — start development server
- pnpm build — build for production
- pnpm start — run the production build
- pnpm lint — lint the codebase (if configured)

## Troubleshooting

- Missing Runway key: Ensure RUNWAY_API_KEY or RUNWAY_API_KEYS are configured on the server. Without them, generation routes will return an error.
- Client errors about missing env: Move sensitive values to server-only variables; only use NEXT_PUBLIC_ for safe, public values. [^1]
- Long-running jobs: The queue and retry logic will handle transient failures. Check app/api/runway/jobs and lib/backoff.ts.


[^1]: Creating a full-stack app with Next.js App Router on Vercel. Client-side env variables must be prefixed with NEXT_PUBLIC. Route Handlers keep provider keys server-only.
https://vercel.com/docs/v0/workflows/full-stack-app

[^2]: Vercel AI SDK overview and examples for text generation and chat. Great for structured prompt tools and model-agnostic integrations.
https://sdk.vercel.ai
