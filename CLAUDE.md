# Fit Check

AI-powered virtual try-on and style studio. Users upload a subject image and outfit references, then generate styled outputs and save results.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth + DB**: Supabase (email/password + Google OAuth, PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI Generation**: kie.ai (Nano Banana Pro for images, Kling 2.6 for video)
- **Background Removal**: Pixian.ai
- **Billing**: Polar.sh (meter-based credits)
- **Email Delivery**: Resend
- **Image Processing**: sharp (server-side)
- **Analytics**: PostHog + Google Analytics
- **Icons**: lucide-react
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
npx tsc --noEmit  # Type-check without emitting
pnpm lint         # Run ESLint (if configured)
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
docs/             # Architecture, patterns, and SQL docs
middleware.ts     # Auth middleware (session refresh + route protection)
```

## Current Product Notes

- Subject preset library is now shared and searchable (category + keyword tags), not hardcoded.
- Grid Panel generation uses a server-built garment collage image for stability.
- Resolution options are `2K` and `4K` (no `1K`).
- Generation count supports up to 4 per request; free plan is capped to 1.
- Sign-in supports both password and Google OAuth.
- Transactional app emails are sent via Resend.

## Environment Variables

See `.env.example` for all required variables. Key groups:

- `NEXT_PUBLIC_SUPABASE_*` - Supabase client auth config
- `KIE_API_KEY` - kie.ai generation API
- `R2_*` - Cloudflare R2 storage
- `PIXIAN_API_*` - Background removal
- `POLAR_*` - Billing/subscriptions
- `RESEND_*` - Email delivery
- `MODEL_PRESET_ADMIN_EMAILS` - allowlist for shared preset uploads
- `NEXT_PUBLIC_POSTHOG_*` / `NEXT_PUBLIC_GA_*` - analytics

## Detailed Docs

- [Architecture](docs/architecture.md) - System design, services, data flow
- [Patterns](docs/patterns.md) - Coding conventions and project patterns
- [Model Presets SQL](docs/model-presets.sql) - Shared preset table and policies
