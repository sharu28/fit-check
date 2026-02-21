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
- **Image Processing**: sharp (server-side, watermark + thumbnails)
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
    billing/      # Polar checkout + portal routes
    credits/      # Credit balance API
    download/     # Authenticated file download proxy
    email/        # Transactional email via Resend
    gallery/      # Gallery CRUD (uploads, generations, videos)
    generate/     # AI generation (image, video, status polling, remove-bg)
    model-presets/# Shared subject preset CRUD
    storage/      # R2 upload/delete + watermark
    webhooks/     # Polar webhook handler
  app/            # Main app page (protected)
  auth/           # Login/signup page + OAuth callback
  pricing/        # Pricing page with checkout
components/       # React UI components (all 'use client')
hooks/            # Custom React hooks (auth, gallery, generation, credits, etc.)
lib/              # Server utilities, API clients, constants
  supabase/       # Supabase client/server/middleware/admin setup
types/            # TypeScript type definitions
docs/             # Architecture, patterns, SQL docs, and task tracking
middleware.ts     # Auth middleware (session refresh + route protection)
```

## Current Product Notes

- Subject preset library is shared and searchable (category + keyword tags), not hardcoded.
- Grid Panel generation uses a server-built garment collage image for stability.
- Resolution options are `2K` and `4K` (no `1K`).
- Generation count supports up to 4 per request; free plan is capped to 1.
- Sign-in supports both password and Google OAuth.
- Transactional app emails are sent via Resend.
- **Credits are tracked server-side** in `user_profiles.credits_remaining` with atomic deduction via Supabase RPC.
- **Free-tier generation images get a "Fit Check" watermark** applied via sharp before R2 upload.
- **Videos are persisted to R2/DB** and shown in a dedicated "My Videos" gallery tab.
- **Polling has timeouts**: ~6 min for images (120 attempts × 3s), ~10 min for videos (120 × 5s).
- **Billing routes return 503** until Polar product IDs are configured in env vars.

## Credit System

Credits are stored in `user_profiles.credits_remaining` (default 10 for free tier).

| Action | Cost |
|--------|------|
| Image generation (2K) | 10 credits |
| Image generation (4K) | 16 credits |
| Video generation (5s) | 30 credits |
| Video generation (10s) | 60 credits |

Server-side enforcement:
- `lib/credits.ts` provides `getUserCredits()`, `deductCredits()`, cost helpers
- API routes check credits before generation, return 402 `INSUFFICIENT_CREDITS` if insufficient
- Credits deducted atomically via `deduct_credits` Supabase RPC (prevents race conditions)

Client-side enforcement:
- Hooks handle 402 responses and surface `INSUFFICIENT_CREDITS` error
- `app/app/page.tsx` checks `credits <= 0` and redirects to `/pricing`

## Environment Variables

See `.env.example` for all required variables. Key groups:

- `NEXT_PUBLIC_SUPABASE_*` - Supabase client auth config
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for webhook handlers
- `KIE_API_KEY` - kie.ai generation API
- `R2_*` - Cloudflare R2 storage (including `R2_PUBLIC_DOMAIN`)
- `PIXIAN_API_*` - Background removal
- `POLAR_*` - Billing/subscriptions + product IDs
- `RESEND_*` - Email delivery
- `MODEL_PRESET_ADMIN_EMAILS` - allowlist for shared preset uploads
- `NEXT_PUBLIC_POSTHOG_*` / `NEXT_PUBLIC_GA_*` - analytics

## Database Migration

**IMPORTANT**: The `user_profiles` table with `credits_remaining` column and RPC functions (`deduct_credits`, `add_credits`) must be created before the credit system works. See `docs/tasks.md` for the pending migration SQL.

## Detailed Docs

- [Architecture](docs/architecture.md) - System design, services, data flow
- [Patterns](docs/patterns.md) - Coding conventions and project patterns
- [Model Presets SQL](docs/model-presets.sql) - Shared preset table and policies
- [Tasks](docs/tasks.md) - Completed work and pending tasks

## UI and Design Steering Rules

For all future UI/design changes, follow `AGENTS.md` "UI and Design Harness".

Minimum expectations:
- Propose 2-3 visual directions before coding new UI.
- Use explicit design tokens and a coherent visual direction.
- Deliver mobile + desktop behavior together.
- Pass keyboard/focus/label/contrast accessibility checks.
- Capture and review local screenshots before confirming UI changes, and run `npx tsc --noEmit`.
