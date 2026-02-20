# Architecture

## Overview

Fit Check is a Next.js 15 App Router application with a two-column UI (sidebar + main content). The server handles auth, AI generation orchestration, cloud storage, billing, shared model presets, credit enforcement, and transactional email.

## External Services

| Service | Purpose | Client |
|---------|---------|--------|
| **Supabase** | Auth (password + Google OAuth) + PostgreSQL | `lib/supabase/` |
| **kie.ai** | Image generation (Nano Banana Pro), video generation (Kling 2.6) | `lib/kie.ts` |
| **Pixian.ai** | Background removal | `lib/pixian.ts` |
| **Cloudflare R2** | Blob storage for uploads, generations, videos, and shared presets | `lib/r2.ts` |
| **Polar.sh** | Credit and subscription billing | `lib/polar.ts` |
| **Resend** | Transactional email sending | `lib/resend.ts` |
| **PostHog** | Product analytics (pageview/pageleave + identify) | `components/PostHogProvider.tsx` |
| **Google Analytics** | Page analytics | `app/layout.tsx` |

## App Router Structure

```
app/
  layout.tsx
  page.tsx
  globals.css

  auth/
    page.tsx
    callback/route.ts

  app/
    page.tsx

  pricing/
    page.tsx

  api/
    billing/
      checkout/route.ts
      portal/route.ts
    credits/route.ts
    download/route.ts
    email/
      send/route.ts
    gallery/route.ts
    model-presets/route.ts
    generate/
      image/route.ts
      video/route.ts
      status/route.ts
      remove-bg/route.ts
    storage/
      upload/route.ts
      delete/route.ts
    webhooks/
      polar/route.ts
```

## Authentication Flow

```
User -> /auth
  -> Sign in with password OR Continue with Google
  -> /auth/callback exchanges OAuth code for session
  -> redirect to /app

Every request:
  -> middleware.ts calls updateSession()
  -> refreshes auth cookies
  -> public routes: /, /auth, /pricing, /api/webhooks/*
  -> all other routes require session
```

## Data Model (Supabase)

### `auth.users`
Supabase built-in auth users.

### `user_profiles`
`id` (UUID, FK to auth.users), `polar_customer_id`, `plan` (default 'free'), `credits_remaining` (default 10), timestamps.

- Auto-created via `handle_new_user` trigger on signup
- RLS: users can read/update own row, service role has full access
- RPC: `deduct_credits(p_user_id, p_amount)` — atomic credit deduction with `FOR UPDATE` row lock
- RPC: `add_credits(p_customer_id, p_amount)` — for Polar webhook top-ups

### `gallery_items`
User-scoped uploads, generated images, and videos metadata.
- `type`: `'upload' | 'generation' | 'video'`

### `model_presets`
Shared subject presets used by all users:
- `label`, `category`, `tags` (`text[]`)
- `image_url`, `thumbnail_url`
- `created_by`, `created_at`

Schema and RLS setup: `docs/model-presets.sql`.

## Image Generation Flow

```
1. Client sends person image + garments + prompt + settings to /api/generate/image
2. Server validates:
   - auth
   - resolution in {2K, 4K}
   - numGenerations in 1..4
   - free users max 1 generation per request
3. Server checks credits via getUserCredits() — returns 402 if insufficient
4. Server uploads references to kie.ai:
   - single mode: person + first garment
   - panel mode: person + server-built 2x2 garment collage
5. Server creates N tasks (N = numGenerations), returns taskIds[]
6. Server deducts credits atomically via deductCredits()
7. Client polls /api/generate/status for each task, aggregates progress
   - Polling timeout: 120 attempts × 3s = ~6 minutes
8. On completion, client auto-saves returned URLs via /api/storage/upload
   - Free tier: watermark applied before R2 upload
   - Thumbnail generated via sharp (images only)
9. Client calls onCreditsRefresh() to update header display
```

## Video Generation Flow

```
1. Client posts prompt (+ optional reference image) to /api/generate/video
2. Server checks credits via getVideoCreditCost() + getUserCredits()
3. Server uploads reference image if present
4. Server creates Kling task, deducts credits, returns taskId
5. Client polls /api/generate/status until completion
   - Polling timeout: 120 attempts × 5s = ~10 minutes
6. On completion, video is persisted to R2 via /api/storage/upload (type: 'video')
7. Video appears in gallery "My Videos" tab
```

## Credit System

```
Credits tracked in: user_profiles.credits_remaining
Default free tier: 10 credits

Server-side (lib/credits.ts):
  getUserCredits(supabase, userId) -> { credits, plan }
  deductCredits(supabase, userId, amount) -> { success, remaining }
  getImageCreditCost(resolution, count)
  getVideoCreditCost(duration)

API enforcement:
  - /api/generate/image checks + deducts credits
  - /api/generate/video checks + deducts credits
  - Returns 402 { code: 'INSUFFICIENT_CREDITS' } when insufficient

Client enforcement:
  - useGeneration and useVideoGeneration handle 402 responses
  - page.tsx checks credits <= 0 -> redirect to /pricing
```

## Billing Flow (Polar)

```
Subscription checkout:
  POST /api/billing/checkout { plan: 'pro' | 'premium' }
  -> Maps plan to POLAR_*_PRODUCT_ID env var
  -> Creates Polar checkout session
  -> Returns { checkoutUrl }
  -> Returns 503 if product IDs not configured

Customer portal:
  POST /api/billing/portal
  -> Gets polar_customer_id from user_profiles
  -> Creates Polar customer session
  -> Returns { portalUrl }

Webhook handling (POST /api/webhooks/polar):
  subscription.created/active -> update plan + credits_remaining
  subscription.canceled -> downgrade to free
  order.paid -> add credits via add_credits RPC
```

## Shared Model Presets

- `GET /api/model-presets`
  - Authenticated users can search with `q` and optional `category`.
- `POST /api/model-presets`
  - Admin-only (email allowlist via `MODEL_PRESET_ADMIN_EMAILS`).
  - Accepts base64 or URL source image.
  - Uploads original + thumbnail to R2 and stores metadata/tags in Supabase.

## Watermark System

Free-tier users get a semi-transparent "Fit Check" watermark on generated images:
- Applied in `/api/storage/upload` when `type === 'generation'` and `plan === 'free'`
- Uses `lib/watermark.ts` with sharp composite
- SVG text overlay scaled to image dimensions
- Graceful fallback if watermark fails

## API Routes Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/credits` | Yes | Fetch user credits + plan from DB |
| GET | `/api/download` | Yes | Proxy file download (authenticated) |
| POST | `/api/billing/checkout` | Yes | Create Polar checkout session |
| POST | `/api/billing/portal` | Yes | Create Polar customer portal session |
| POST | `/api/email/send` | Yes | Send transactional email to signed-in user |
| GET | `/api/gallery` | Yes | List user uploads, generations, and videos |
| GET | `/api/model-presets` | Yes | Search shared model presets |
| POST | `/api/model-presets` | Admin | Create tagged shared model preset |
| POST | `/api/generate/image` | Yes | Submit image generation tasks (credit check) |
| POST | `/api/generate/video` | Yes | Submit video generation task (credit check) |
| GET | `/api/generate/status` | Yes | Poll generation status |
| POST | `/api/generate/remove-bg` | Yes | Remove background |
| POST | `/api/storage/upload` | Yes | Upload to R2 + save metadata + watermark |
| POST | `/api/storage/delete` | Yes | Delete R2 + metadata |
| POST | `/api/webhooks/polar` | HMAC | Polar webhook handler |
