# Fit Check

AI-powered virtual try-on and style studio. Users upload a person image + garment images, and the app generates realistic outfit previews using AI.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth & DB**: Supabase (email/password auth, PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI Generation**: kie.ai (Nano Banana Pro for images, Kling 2.6 for video)
- **Background Removal**: Pixian.ai
- **Billing**: Polar.sh (meter-based credits)
- **Image Processing**: sharp (server-side)
- **Analytics**: PostHog + Google Analytics
- **Icons**: lucide-react
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
npx tsc --noEmit  # Type-check without emitting
pnpm lint         # Run ESLint
```

## Project Structure

```
app/              # Next.js App Router pages and API routes
  api/            # Server-side API endpoints
  app/            # Main app page (protected)
  auth/           # Login/signup page + OAuth callback
  pricing/        # Pricing page
components/       # React UI components (all 'use client')
hooks/            # Custom React hooks (auth, gallery, generation, etc.)
lib/              # Server utilities, API clients, constants
  supabase/       # Supabase client/server/middleware setup
types/            # TypeScript type definitions
middleware.ts     # Auth middleware (session refresh + route protection)
```

## Environment Variables

See `.env.example` for all required variables. Key groups:
- `NEXT_PUBLIC_SUPABASE_*` — Supabase auth (client-side)
- `KIE_API_KEY` — kie.ai generation API
- `R2_*` — Cloudflare R2 storage
- `PIXIAN_API_*` — Background removal
- `POLAR_*` — Billing/subscriptions
- `NEXT_PUBLIC_POSTHOG_*` / `NEXT_PUBLIC_GA_*` — Analytics

## Detailed Docs

- [Architecture](docs/architecture.md) — System design, services, data flow
- [Patterns](docs/patterns.md) — Coding conventions and project patterns
