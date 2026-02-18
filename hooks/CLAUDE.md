# Hooks

All hooks use `'use client'` directive. Each hook encapsulates a single domain.

## Hook List

| Hook | Purpose | Key State |
|------|---------|-----------|
| `useAuth()` | Auth session management | `user`, `loading`, `signOut()` |
| `useCredits(userId)` | Fetch credits + plan from `/api/credits` | `credits`, `plan`, `refreshCredits()` |
| `useGallery({ userId })` | Gallery CRUD (uploads + generations) | `uploads`, `generations`, `saveUpload()`, `deleteItem()` |
| `useGeneration({ onGenerationSaved })` | Image generation with polling | `status`, `resultImage`, `progress`, `generateImage()` |
| `useVideoGeneration()` | Video generation with polling | `status`, `videoUrl`, `progress`, `generate()` |
| `useToast()` | Toast notifications | `toasts`, `addToast()`, `removeToast()` |

## Patterns

### Polling
`useGeneration` and `useVideoGeneration` poll `/api/generate/status` at intervals (3s and 5s respectively). They use `useRef` to store the interval ID for cleanup on unmount or reset.

### Optimistic Updates
`useGallery.deleteItem()` removes the item from state immediately, then calls the API. On failure, it rolls back to the previous state.

### Stable References
All returned functions use `useCallback` to maintain stable references and avoid unnecessary re-renders in consuming components.

### Auto-save
`useGeneration` auto-saves completed results to the gallery via `/api/storage/upload`. If the upload fails, it creates a fallback local GalleryItem so the result isn't lost.
