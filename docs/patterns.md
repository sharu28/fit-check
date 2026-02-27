# Coding Patterns and Conventions

## Project Layout

| Path | Purpose | Runtime |
|------|---------|---------|
| `app/` | App Router pages + API routes | Mixed |
| `components/` | UI components | Mostly client |
| `hooks/` | Stateful client logic | Client |
| `lib/` | Shared utilities, service adapters, constants | Mostly server |
| `types/` | Shared TypeScript types | Shared |
| `docs/` | Product/engineering docs | N/A |

## State Pattern

No global state library. State is local/page-level and composed via hooks:

- `useAuth` - user/session lifecycle
- `useGallery` - uploads/generations/videos state and CRUD
- `useGeneration` - image generation polling and autosave
- `useVideoGeneration` - video generation polling and autosave
- `useCredits` - plan/credits fetch and refresh
- `useToast` - transient notifications

Shared workspace transient state is provided at `app/app/layout.tsx` via:

- `WorkspaceStateProvider` (`components/WorkspaceStateProvider.tsx`)
  - currently persists gallery-open state across `/app/*` route transitions.

## Routing Pattern

- Canonical routes are defined in `lib/app-routes.ts`.
- Workspace navigation should use route pushes (`router.push`) instead of local-only section toggles.
- Compatibility parser supports legacy URLs (`/app?tool=...`) and redirects to canonical routes.
- Wrapper pages under `app/app/*/page.tsx` render shared workspace logic (`AppWorkspacePage`) during migration.

## Auth Guard Pattern (API)

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Credit Enforcement Pattern

Server-side:

```ts
const { credits, isUnlimited } = await getUserCredits(supabase, user.id, user.email);
if (!isUnlimited && credits < required) {
  return NextResponse.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, { status: 402 });
}
await deductCredits(supabase, user.id, required, user.email);
```

Client-side:

- Hooks detect `402` and surface actionable messages.
- `onCreditsRefresh` runs after successful generation saves.

## Image Generation Pattern

- Supports `single` and `panel` modes.
- `numGenerations` can submit multiple tasks in one request.
- Client polls each task concurrently.
- Progress is aggregated.
- Latest displayed result should prefer saved URL returned by `/api/storage/upload`.

## Loading UI Pattern

- During image generation, UI renders one placeholder card per requested generation count.
- Placeholder cards use the same aspect ratio as result cards.
- Loader visuals should avoid blocking actions and preserve layout stability.

## Single Swap UX Pattern

- Single Swap guide remains visible while required inputs are incomplete (including partial states).
- Guide supports direct garment/subject uploads.
- Subject library action remains available.
- Prompt generate action is disabled until required inputs are present.
- Main Style Studio toolbar exposes quick rerun actions:
  - `Change Garment`
  - `Change Subject`

## Onboarding Intake Pattern

- First-run onboarding is business-intent-first (industry + content goal), not tool-first.
- Intake completion maps users to a recommended template/tool and preloads contextual prompt guidance.
- Completion state is stored per-user in local storage (versioned key).
- Intake choices are shown as large visual poster cards with optional media from:
- `public/onboarding/industries/<industry-slug>.{webp|jpg|jpeg|png}`
- `public/onboarding/goals/<goal-slug>.{webp|jpg|jpeg|png}`
- Missing files gracefully fall back to gradient-only cards.
- Card bodies prioritize title-only scanning for low-friction decision making.
- Post-intake, users see a personalized quick-start feed (instead of default garment-first empty state) until dismissed or they begin input actions.
- Quick-start step actions should keep users in the same context (open upload/modal in place) and must not auto-switch to garment-first fallback views.
- Onboarding intake card grids scroll independently while footer actions remain fixed and always visible.
- Legacy onboarding wizard is retained in codebase for rollback/reference but hidden from users.

## Template Pattern

`TemplateOption` supports:

- `defaultPrompt`
- `presetPrompts` (optional curated prompt variants)
- `targetTool`
- `generationMode` (when relevant)

On `Use Template`, one prompt variant is selected and applied to the target tool.
- Before applying a template, users choose product type in a dedicated visual picker.
- Prompt text is then adapted from template flow + selected product type so non-garment users do not receive clothing-only prompt language.

## Brand DNA Pattern

- Persist per-user brand style memory in `user_profiles.brand_dna` (JSONB).
- Use authenticated API route (`/api/brand-dna`) for read/update.
- Normalize user input before save (trim, dedupe, length limits) to keep prompts stable.
- During image generation, append Brand DNA prompt guidance only when profile has values.
- If Brand DNA lookup fails, generation should continue without blocking.

## Storage and Gallery Pattern

Write path (`/api/storage/upload`):

- Upload file to R2.
- Create optional thumbnail for images.
- Insert metadata row into `gallery_items` (with optional `folder_id`).
- If metadata insert fails, cleanup uploaded R2 objects and return error.

Read path (`/api/gallery`):

- Query `gallery_items` and `gallery_folders` by `user_id`.
- If empty, attempt metadata recovery from current user R2 prefix and upsert rows.

Key principle: UI gallery is metadata-driven (`gallery_items` is source of truth).

## Gallery Folder Pattern

- Folders are stored in `gallery_folders` with optional `parent_id` for subfolders.
- Folder deletion removes folder/subfolders and moves affected items back to root (`folder_id = null`).
- Item organization uses explicit move API (`POST /api/gallery/items/move`) to avoid accidental cross-user writes.
- Upload API accepts `folderId` so new uploads can be saved directly into the active folder.

## Watermark Pattern

- Applies only to free-tier generation images.
- Text watermark label: `Fit Check App`.
- Applied in `/api/storage/upload` before R2 upload.

## Error Handling Pattern

- API routes return explicit JSON errors with meaningful status codes (`400`, `401`, `402`, `500`).
- Non-critical derived-step failures (e.g. thumbnail) should degrade gracefully.
- Critical persistence failures should return errors and not silently succeed.

## UI Quality Gates (for future changes)

- Run `npx tsc --noEmit` for UI-impacting work.
- Capture fresh local screenshots before marking UI work complete.
- Check no overlap, clipping, or spacing regression on desktop and mobile.
- Ensure interactive controls have accessible names and visible focus styles.

## Frontend Skill Usage

- External frontend skill stack and install commands are documented in `docs/frontend-skill-pack.md`.
- Apply those skills primarily to onboarding, quick-start feed, upload/dropzone cards, and prompt/action surfaces.

## Video Input Composition Pattern

- Video API currently accepts one `imageInput`.
- Client composes product-first inputs into one effective reference image:
  - `productImages` (up to 4)
  - optional `subjectImage`
  - optional `environment` (`preset` or uploaded image)
- Composition utility: `lib/video-composite.ts`.
- Environment presets metadata: `lib/video-environment-presets.ts`.
- Fallback behavior:
  - if composition fails, use first available image input when possible
  - prompt-only generation remains valid when no images are provided
