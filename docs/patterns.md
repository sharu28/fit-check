# Coding Patterns and Conventions

## File Organization

| Directory | Contents | Runtime |
|-----------|----------|---------|
| `components/` | React UI components | Client (`'use client'`) |
| `hooks/` | Custom React hooks | Client (`'use client'`) |
| `lib/` | API clients, utilities, constants | Server (except `utils.ts`, `supabase/client.ts`) |
| `lib/supabase/admin.ts` | Service-role Supabase client | Server only (webhooks) |
| `types/` | Shared TypeScript models | Shared |
| `app/api/` | Route handlers | Server |

## State Management

No global state library. Domain state lives in hooks and page-level state:

- `useAuth` - session/user lifecycle
- `useGallery` - uploads, saved generations, and videos (CRUD + optimistic delete)
- `useGeneration` - image generation tasks, polling, progress, autosave, credit refresh
- `useVideoGeneration` - video generation lifecycle, R2 persistence, credit refresh
- `useCredits` - plan + credits (reads from /api/credits)
- `useToast` - notifications

## Auth Route Pattern

Protected routes use server Supabase auth checks:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Credit Enforcement Pattern

Server-side (in API routes):

```ts
import { getImageCreditCost, getUserCredits, deductCredits } from '@/lib/credits';

const creditCost = getImageCreditCost(resolution, numGenerations);
const { credits } = await getUserCredits(supabase, user.id);
if (credits < creditCost) {
  return NextResponse.json(
    { error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS', required: creditCost, available: credits },
    { status: 402 }
  );
}
// ... do generation ...
await deductCredits(supabase, user.id, creditCost);
```

Client-side (in hooks):

```ts
// Handle 402 in fetch response
if (err.code === 'INSUFFICIENT_CREDITS') throw new Error('INSUFFICIENT_CREDITS');

// After successful generation
onCreditsRefresh?.();
```

## Generation Patterns

### Image generation request

`/api/generate/image` enforces:
- `resolution` must be `2K` or `4K`
- `numGenerations` must be integer `1..4`
- free plan can request only `1`
- credit check + deduction

### Multi-task polling

`useGeneration` polls all task IDs concurrently and aggregates progress as average across tasks. Timeout after 120 attempts (~6 min).

### Video polling

`useVideoGeneration` polls single task at 5s intervals. Timeout after 120 attempts (~10 min). On success, persists video to R2 and adds to gallery.

### Mode-specific reference handling

- `single` mode: person image + first garment reference.
- `panel` mode: person image + server-generated 2x2 garment collage.

## Subject Preset Pattern

Hardcoded preset images are removed. Subject presets are shared data:

- Read via `GET /api/model-presets?q=&category=`
- Admin create via `POST /api/model-presets`
- Tags and categories are stored in Supabase table `model_presets`
- UI search/filter is implemented in `components/SubjectModal.tsx`

## Email Pattern

Transactional email delivery uses Resend through `lib/resend.ts`.
API entrypoint: `POST /api/email/send`.

## Storage Pattern

Uploads, generations, and videos:
- Original files in R2 (keyed by `{userId}/{type}s/{id}.{ext}`)
- Optional derived thumbnails in R2 (images only, not videos)
- Metadata in Supabase (`gallery_items`)
- Free-tier generation images get watermark before upload

Shared model presets:
- Stored under shared R2 keys
- Metadata in Supabase (`model_presets`)

## Gallery Types

`GalleryItem.type` union: `'upload' | 'generation' | 'video'`

Gallery tabs:
- "My Uploads" — user-uploaded images
- "My Designs" — generated images
- "My Videos" — generated videos (with inline play, download, delete)

## Billing Pattern

Checkout and portal routes return 503 "Billing not configured" if Polar product IDs not set in env vars. This allows the app to function without Polar being fully set up.

Webhook handler (`/api/webhooks/polar`) uses `lib/supabase/admin.ts` (service-role client) since webhooks have no user session.

## Constants

`lib/constants.ts` includes central configuration:

- `SCENE_PRESETS`, `STYLE_PRESETS`
- `ASPECT_RATIOS`, `RESOLUTIONS` (`2K`, `4K`)
- `CREDIT_COSTS` — image_2k: 10, image_4k: 16, video_5s: 30, video_10s: 60
- `PLAN_CREDITS` — free: 10, pro: 100, premium: 500
- `KIE_MODELS`
- `MAX_GARMENTS`, `MAX_FILE_SIZE_MB`, `DEFAULT_PROMPT`

## Error Handling

- API routes return JSON with clear status codes (401, 402, 400, 500).
- 402 with `code: 'INSUFFICIENT_CREDITS'` for credit enforcement.
- Client hooks surface user-facing errors through toasts/UI state.
- Non-critical failures (thumbnails, watermarks) degrade gracefully with console.error.
