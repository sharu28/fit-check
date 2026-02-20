# Coding Patterns and Conventions

## File Organization

| Directory | Contents | Runtime |
|-----------|----------|---------|
| `components/` | React UI components | Client (`'use client'`) |
| `hooks/` | Custom React hooks | Client (`'use client'`) |
| `lib/` | API clients, utilities, constants | Server (except `utils.ts`, `supabase/client.ts`) |
| `types/` | Shared TypeScript models | Shared |
| `app/api/` | Route handlers | Server |

## State Management

No global state library. Domain state lives in hooks and page-level state:

- `useAuth` - session/user lifecycle
- `useGallery` - uploads and saved generations
- `useGeneration` - image generation tasks, polling, progress, autosave
- `useVideoGeneration` - video generation lifecycle
- `useCredits` - plan + credits
- `useToast` - notifications

## Auth Route Pattern

Protected routes use server Supabase auth checks:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Generation Patterns

### Image generation request

`/api/generate/image` currently enforces:
- `resolution` must be `2K` or `4K`
- `numGenerations` must be integer `1..4`
- free plan can request only `1`

### Multi-task polling

`useGeneration` polls all task IDs concurrently and aggregates progress as average across tasks.

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

Uploads and generations:
- Original files in R2
- Optional derived thumbnails in R2
- Metadata in Supabase (`gallery_items`)

Shared model presets:
- Stored under shared R2 keys
- Metadata in Supabase (`model_presets`)

## Constants

`lib/constants.ts` includes central configuration:

- `SCENE_PRESETS`, `STYLE_PRESETS`
- `ASPECT_RATIOS`, `RESOLUTIONS` (`2K`, `4K`)
- `CREDIT_COSTS`
- `KIE_MODELS`
- `MAX_GARMENTS`, `MAX_FILE_SIZE_MB`, `DEFAULT_PROMPT`

## Error Handling

- API routes return JSON with clear status codes.
- Client hooks surface user-facing errors through toasts/UI state.
- Non-critical failures (for example thumbnail creation) should degrade gracefully.
