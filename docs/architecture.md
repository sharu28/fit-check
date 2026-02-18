# Architecture

## Overview

Fit Check is a Next.js 15 App Router application with a two-column UI (sidebar + main content area). The server handles auth, AI generation orchestration, cloud storage, and billing. All AI processing happens via external APIs — no models run locally.

## External Services

| Service | Purpose | Client |
|---------|---------|--------|
| **Supabase** | Auth (email/password) + PostgreSQL database | `lib/supabase/` |
| **kie.ai** | Image generation (Nano Banana Pro), video generation (Kling 2.6) | `lib/kie.ts` |
| **Pixian.ai** | Background removal | `lib/pixian.ts` |
| **Cloudflare R2** | Image/video blob storage (S3-compatible) | `lib/r2.ts` |
| **Polar.sh** | Subscription billing, meter-based credits | `lib/polar.ts` |
| **PostHog** | Product analytics | `components/PostHogProvider.tsx` |
| **Google Analytics** | Page tracking | `app/layout.tsx` |

## App Router Structure

```
app/
  layout.tsx          # Root layout (PostHog provider, GA, Inter font)
  page.tsx            # Landing page (public)
  globals.css         # Tailwind + custom scrollbar + toast animation

  auth/
    page.tsx          # Sign in / Sign up form
    callback/route.ts # OAuth code exchange

  app/
    page.tsx          # Main application (protected)

  pricing/
    page.tsx          # Subscription plans display

  api/
    credits/route.ts           # GET  — user credits + plan
    download/route.ts          # GET  — proxy image download
    gallery/route.ts           # GET  — fetch user gallery items
    generate/
      image/route.ts           # POST — create image generation task
      video/route.ts           # POST — create video generation task
      status/route.ts          # GET  — poll task status
      remove-bg/route.ts       # POST — background removal
    storage/
      upload/route.ts          # POST — upload to R2 + save metadata
      delete/route.ts          # POST — delete from R2 + metadata
    webhooks/
      polar/route.ts           # POST — Polar subscription webhooks
```

## Authentication Flow

```
User → /auth (sign in/up with email+password)
  → Supabase creates session → stored in httpOnly cookies
  → Redirect to /app

Every request:
  → middleware.ts calls updateSession()
  → Refreshes auth cookies
  → Public routes: /, /auth, /pricing, /api/webhooks/*
  → Protected routes: redirect to /auth if no session

API routes:
  → createClient() from lib/supabase/server.ts
  → supabase.auth.getUser() → 401 if missing
```

## Data Model (Supabase PostgreSQL)

### `auth.users` (Supabase built-in)
Standard Supabase auth table. Referenced by `user_profiles.id`.

### `user_profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users.id` |
| `polar_customer_id` | TEXT | Polar.sh customer ID |
| `plan` | TEXT | `'free'` / `'pro'` / `'premium'` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### `gallery_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | References `auth.users.id` |
| `url` | TEXT | R2 public URL |
| `thumbnail_url` | TEXT | R2 thumbnail URL |
| `mime_type` | TEXT | e.g. `image/png` |
| `type` | TEXT | `'upload'` or `'generation'` |
| `created_at` | TIMESTAMP | |

## Image Generation Pipeline

```
1. Client: User selects person image + garments + prompt + settings
2. Client: POST /api/generate/image
3. Server: Upload person + garment images to kie.ai temporary storage
4. Server: Create Nano Banana Pro task → returns taskId
5. Client: Poll GET /api/generate/status?taskId=... every 3 seconds
6. Server: Query kie.ai for task status, map to processing/completed/failed
7. On completion: Client receives resultUrls
8. Client: Auto-save result via POST /api/storage/upload (base64 or URL)
9. Server: If free tier → apply watermark via sharp
10. Server: Generate WebP thumbnail (300x400, quality 80)
11. Server: Upload original + thumbnail to R2
12. Server: Insert metadata into gallery_items table
13. Client: Add to local gallery state
```

## Video Generation Pipeline

```
1. Client: User enters prompt + optional reference image + settings
2. Client: POST /api/generate/video
3. Server: Upload reference image to kie.ai (if provided)
4. Server: Create Kling 2.6 video task → returns taskId
5. Client: Poll GET /api/generate/status?taskId=... every 5 seconds
6. On completion: Client receives video URL, displays player
```

## Storage Architecture

- **Cloudflare R2**: Stores image/video blobs. User-scoped paths: `{userId}/uploads/{id}.{ext}` and `{userId}/generations/{id}.{ext}`
- **Supabase**: Stores metadata (`gallery_items` table). Queried for gallery listing, deleted on item removal.
- **kie.ai**: Temporary storage for uploaded images (auto-deletes after 3 days). Used during generation only.

R2 uploads use `@aws-sdk/client-s3` with R2-specific endpoint configuration.

## Credit System

Credits are tracked via Polar.sh meter-based billing:

| Action | Cost |
|--------|------|
| Image generation (1K) | 6 credits |
| Image generation (2K) | 10 credits |
| Image generation (4K) | 16 credits |
| Video generation (5s) | 30 credits |
| Video generation (10s) | 60 credits |

Plans: Free (0 credits), Pro ($9/100 credits), Premium ($29/500 credits).

Credit costs are defined in `lib/constants.ts` → `CREDIT_COSTS`.

## Watermark (Free Tier)

Free-tier generated images get a semi-transparent "Fit Check" text watermark in the bottom-right corner. Applied server-side in the upload route using `sharp` SVG compositing (`lib/watermark.ts`). Paid plans skip the watermark.

## API Routes Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/credits` | Yes | Fetch credits + plan from Polar |
| GET | `/api/download` | No | Proxy download for generated images |
| GET | `/api/gallery` | Yes | List user uploads + generations |
| POST | `/api/generate/image` | Yes | Submit image generation task |
| POST | `/api/generate/video` | Yes | Submit video generation task |
| GET | `/api/generate/status` | Yes | Poll generation task status |
| POST | `/api/generate/remove-bg` | Yes | Remove background from image |
| POST | `/api/storage/upload` | Yes | Upload to R2 + save to Supabase |
| POST | `/api/storage/delete` | Yes | Delete from R2 + Supabase |
| POST | `/api/webhooks/polar` | HMAC | Handle Polar subscription events |
