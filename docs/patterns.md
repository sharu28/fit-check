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

## Template Pattern

`TemplateOption` supports:

- `defaultPrompt`
- `presetPrompts` (optional curated prompt variants)
- `targetTool`
- `generationMode` (when relevant)

On `Use Template`, one prompt variant is selected and applied to the target tool.

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
