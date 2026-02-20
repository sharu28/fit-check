# Architecture

## Overview

Fit Check is a Next.js 15 App Router application with a two-column UI (sidebar + main content). The server handles auth, AI generation orchestration, cloud storage, billing, shared model presets, and transactional email.

## External Services

| Service | Purpose | Client |
|---------|---------|--------|
| **Supabase** | Auth (password + Google OAuth) + PostgreSQL | `lib/supabase/` |
| **kie.ai** | Image generation (Nano Banana Pro), video generation (Kling 2.6) | `lib/kie.ts` |
| **Pixian.ai** | Background removal | `lib/pixian.ts` |
| **Cloudflare R2** | Blob storage for uploads, generations, and shared presets | `lib/r2.ts` |
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
`id`, `polar_customer_id`, `plan`, timestamps.

### `gallery_items`
User-scoped uploads and generated assets metadata.

### `model_presets`
Shared subject presets used by all users:
- `label`
- `category`
- `tags` (`text[]`)
- `image_url`
- `thumbnail_url`
- `created_by`
- `created_at`

Schema and RLS setup: `docs/model-presets.sql`.

## Image Generation Flow

```
1. Client sends person image + garments + prompt + settings to /api/generate/image
2. Server validates:
   - auth
   - resolution in {2K, 4K}
   - numGenerations in 1..4
   - free users max 1 generation per request
3. Server uploads references to kie.ai:
   - single mode: person + first garment
   - panel mode: person + server-built 2x2 garment collage
4. Server creates N tasks (N = numGenerations), returns taskIds[]
5. Client polls /api/generate/status for each task, aggregates progress
6. On completion, client auto-saves returned URLs via /api/storage/upload
```

## Video Generation Flow

```
1. Client posts prompt (+ optional reference image) to /api/generate/video
2. Server uploads reference image if present
3. Server creates Kling task, returns taskId
4. Client polls /api/generate/status until completion
```

## Shared Model Presets

- `GET /api/model-presets`
  - Authenticated users can search with `q` and optional `category`.
- `POST /api/model-presets`
  - Admin-only (email allowlist via `MODEL_PRESET_ADMIN_EMAILS`).
  - Accepts base64 or URL source image.
  - Uploads original + thumbnail to R2 and stores metadata/tags in Supabase.

## Credits and Plans

Credits are tracked with Polar meters.

| Action | Cost |
|--------|------|
| Image generation (2K) | 10 credits |
| Image generation (4K) | 16 credits |
| Video generation (5s) | 30 credits |
| Video generation (10s) | 60 credits |

Plan behavior:
- Free: limited credits and max 1 image generation at a time.
- Paid: up to 4 image generations per request.

## API Routes Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/credits` | Yes | Fetch user credits + plan |
| GET | `/api/download` | No | Proxy file download |
| POST | `/api/email/send` | Yes | Send transactional email to signed-in user |
| GET | `/api/gallery` | Yes | List user uploads + generations |
| GET | `/api/model-presets` | Yes | Search shared model presets |
| POST | `/api/model-presets` | Admin | Create tagged shared model preset |
| POST | `/api/generate/image` | Yes | Submit image generation tasks |
| POST | `/api/generate/video` | Yes | Submit video generation task |
| GET | `/api/generate/status` | Yes | Poll generation status |
| POST | `/api/generate/remove-bg` | Yes | Remove background |
| POST | `/api/storage/upload` | Yes | Upload to R2 + save metadata |
| POST | `/api/storage/delete` | Yes | Delete R2 + metadata |
| POST | `/api/webhooks/polar` | HMAC | Polar webhook handler |
