# Architecture

## Overview

Fit Check is a Next.js 15 App Router app with a two-column workspace layout (retractable sidebar + main canvas).
Core surfaces:

- Image tool (Style Studio)
- Video tool
- Templates library
- Assistant
- Guide
- Academy
- Bulk background remover
- First-run onboarding questionnaire (industry + content-goal intake)
- Personalized onboarding quick-start feed (post-intake guided sequence)
- In-canvas Single Swap guide

The backend handles auth, generation orchestration, credits, storage, gallery metadata, billing hooks, and shared model presets.

## App Route Surface

Canonical user routes:

- `/app/image`
- `/app/video`
- `/app/templates`
- `/app/assistant`
- `/app/guide`
- `/app/onboarding`
- `/app/academy`

Compatibility routes:

- `/app` redirects to canonical default (`/app/image`)
- Legacy query params like `/app?tool=video` are normalized to canonical routes

Implementation notes:

- `lib/app-routes.ts` contains route constants + mapping helpers.
- `app/app/layout.tsx` mounts `WorkspaceStateProvider` for shared transient workspace state.
- Route wrapper pages (`app/app/*/page.tsx`) currently render one shared workspace component: `app/app/AppWorkspacePage.tsx`.

## External Services

| Service | Purpose | Client |
|---------|---------|--------|
| Supabase | Auth + Postgres | `lib/supabase/` |
| kie.ai | Image + video generation | `lib/kie.ts` |
| Pixian.ai | Background removal | `lib/pixian.ts` |
| Cloudflare R2 | Blob/object storage | `lib/r2.ts` |
| Polar.sh | Billing + subscriptions | `lib/polar.ts` |
| Resend | Transactional email | `lib/resend.ts` |
| PostHog | Product analytics | `components/PostHogProvider.tsx` |
| Google Analytics | Page analytics | `app/layout.tsx` |

## Auth and Session

- Middleware refreshes Supabase session cookies on requests.
- Non-public routes require session.
- Browser + server clients use long-lived cookie/session settings.
- `/auth` auto-redirects to `/app` if session already exists.

## Data Model

### `user_profiles`

- `id` (FK to `auth.users`)
- `plan`
- `credits_remaining`
- `brand_dna` (JSONB style memory profile)
- `polar_customer_id`
- timestamps

RPCs:

- `deduct_credits(p_user_id, p_amount)`
- `add_credits(p_customer_id, p_amount)`

### `gallery_items`

Metadata table for user media:

- `type`: `upload | generation | video`
- `user_id`, `url`, `thumbnail_url`, `mime_type`, `folder_id`, timestamps

Important: frontend gallery is sourced from this table, not directly from R2 listing.

### `gallery_folders`

User-owned folder hierarchy for gallery organization:

- `id`, `user_id`, `name`
- `parent_id` (nullable, supports nested subfolders)
- timestamps

### `model_presets`

Shared subject presets (admin-created): label/category/tags + original/thumbnail URLs.

## Image Generation Flow

1. Client submits references + prompt + settings to `/api/generate/image`.
2. Server validates auth, resolution, generation count, and free-tier limits.
3. Server checks credits and returns `402 INSUFFICIENT_CREDITS` when needed.
4. Server uploads references to kie.ai.
5. Server creates N tasks in parallel (N = selected generation count).
6. If the user has Brand DNA saved, server appends normalized Brand DNA guidance to prompt.
7. Server deducts credits.
8. Client polls all task IDs concurrently and aggregates progress.
9. Completed outputs are saved through `/api/storage/upload`.
10. UI displays saved result URLs and refreshes credits.
11. Loading UI renders one animated placeholder card per requested generation count.

## Video Generation Flow

1. Client submits prompt (+ optional reference image) to `/api/generate/video`.
2. Server checks credits and creates video task.
3. Client polls `/api/generate/status`.
4. On completion, video is saved with `/api/storage/upload` as `type=video`.
5. Gallery `videos` tab updates.

## Gallery and Storage Reliability

### Upload path (`/api/storage/upload`)

- Uploads original (and image thumbnail) to R2.
- Inserts metadata row in `gallery_items`.
- For free generation images, applies watermark text `Fit Check App`.
- If DB metadata insert fails, API now returns error and cleans up uploaded R2 files (prevents orphaned blobs).

### Read path (`/api/gallery`)

- Reads current user via Supabase auth.
- Queries `gallery_items` by `user_id`.
- If no rows exist, attempts metadata recovery from current user R2 prefix and upserts recovered rows.

Note: rebuilding the app does not wipe gallery; empty gallery is usually metadata/user-session mismatch.

## Credits

- Server-side source of truth: `user_profiles.credits_remaining`.
- Admin unlimited bypass supported via allowlist (`UNLIMITED_CREDITS_ADMIN_EMAILS`).
- Image and video routes both enforce credit checks and deductions.

## Billing

- Checkout: `/api/billing/checkout`
- Portal: `/api/billing/portal`
- Polar webhook: `/api/webhooks/polar`

If Polar products are not configured, billing routes return `503` and app core still works.

## UX/Navigation Notes

- Sidebar supports expanded + collapsed modes.
- Collapsed nav uses icons.
- Sidebar/top navigation is route-driven and updates URL for each workspace section.
- Image/Video are top-level tool entries.
- Image nav defaults to Single Swap mode.
- On first session, users see business-intake onboarding and are routed to a recommended starter use case.
- Returning users are routed to canonical home (`/app/image`), while onboarding remains accessible via sidebar route (`/app/onboarding`).
- Intake cards pull optional media from `public/onboarding/industries/<industry-slug>.{webp|jpg|jpeg|png}` and `public/onboarding/goals/<goal-slug>.{webp|jpg|jpeg|png}` (gradient fallback is used when files are missing).
- Intake modal keeps footer actions fixed while card grids scroll, so navigation buttons stay visible.
- Style Studio empty-state can switch to personalized quick-start feed driven by onboarding answers.
- Quick-start input actions stay in-context (upload/modal) and do not auto-jump to garment-first fallback screens.
- Template selection flow now includes product-type picker before prompt preload so template prompts can be industry-aware.
- Legacy onboarding wizard remains in codebase but is not exposed to users.
- Style Studio top bar includes quick rerun actions:
  - `Change Garment`
  - `Change Subject`
- Single Swap guide remains visible through partial input states and supports direct in-guide uploads.
- Assistant greeting is local-time based (`morning/afternoon/night`).
- Video workspace now follows product-first quick-start:
  - Multi-product inputs (up to 4)
  - Optional Subject picker
  - Optional Environment picker
  - Client-side composition into a single `imageInput` for current video API compatibility

## Template Prompt Presets

- Templates support curated `presetPrompts`.
- Clicking `Use Template` picks one prompt variant and applies it to image/video tool.
- `defaultPrompt` remains fallback.

## API Reference

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/credits` | Fetch user plan + credits |
| GET | `/api/brand-dna` | Fetch saved Brand DNA profile |
| POST | `/api/brand-dna` | Save/update Brand DNA profile |
| GET | `/api/download` | Authenticated download proxy |
| GET | `/api/gallery` | List gallery items (+ recovery attempt) |
| GET | `/api/gallery/folders` | List user folders |
| POST | `/api/gallery/folders` | Create folder or subfolder |
| PATCH | `/api/gallery/folders` | Rename folder |
| DELETE | `/api/gallery/folders` | Delete folder subtree and unassign items to root |
| POST | `/api/gallery/items/move` | Move an item into/out of a folder |
| GET | `/api/model-presets` | Search subject presets |
| POST | `/api/model-presets` | Admin create preset |
| POST | `/api/generate/image` | Submit image generation tasks |
| POST | `/api/generate/video` | Submit video generation task |
| GET | `/api/generate/status` | Poll generation status |
| POST | `/api/generate/remove-bg` | Remove background |
| POST | `/api/storage/upload` | Save file + metadata (+ watermark/cleanup) |
| POST | `/api/storage/delete` | Delete metadata + R2 objects |
| POST | `/api/billing/checkout` | Create checkout session |
| POST | `/api/billing/portal` | Create customer portal session |
| POST | `/api/webhooks/polar` | Billing webhook handler |
| POST | `/api/email/send` | Send transactional email |
