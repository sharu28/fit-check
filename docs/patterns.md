# Coding Patterns & Conventions

## File Organization

| Directory | Contents | Runtime |
|-----------|----------|---------|
| `components/` | React UI components | Client (`'use client'`) |
| `hooks/` | Custom React hooks | Client (`'use client'`) |
| `lib/` | API clients, utilities, constants | Server (except `utils.ts`, `supabase/client.ts`) |
| `types/` | TypeScript type definitions | Shared |
| `app/api/` | API route handlers | Server |
| `app/*/page.tsx` | Page components | Client (main app), Server (landing) |

## Naming Conventions

- **Components**: PascalCase files and exports (`SubjectModal.tsx`, `GarmentGrid.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useGallery.ts`)
- **Libraries**: camelCase files (`kie.ts`, `polar.ts`, `r2.ts`)
- **API routes**: kebab-case folders (`remove-bg/`, `route.ts` inside)
- **Types**: PascalCase interfaces, camelCase for type aliases (`UploadedImage`, `GenerationMode`)

## Component Patterns

### Props
Props interfaces are defined inline in the same file, not exported separately:
```tsx
interface ResultDisplayProps {
  status: AppStatus;
  resultImage: string | null;
  onReset: () => void;
}

export function ResultDisplay({ status, resultImage, onReset }: ResultDisplayProps) {
```

### Icons
All icons come from `lucide-react`. Import individually:
```tsx
import { Wand2, Share2, Download, Trash2 } from 'lucide-react';
```

### Modals
Fixed overlay with backdrop blur:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
```

## State Management

No global state library. All state is managed via:
- `useState` in page components
- Custom hooks that encapsulate domain logic
- Props drilling from `app/app/page.tsx` down to components

Each domain has its own hook:
- `useAuth()` — user session
- `useGallery()` — uploads, generations, CRUD
- `useGeneration()` — image generation lifecycle
- `useVideoGeneration()` — video generation lifecycle
- `useCredits()` — billing info
- `useToast()` — notifications

## API Route Auth Pattern

Every protected API route follows this pattern:
```ts
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... route logic
}
```

## Polling Pattern

Used for async AI tasks (image and video generation):
```ts
const intervalRef = useRef<NodeJS.Timeout | null>(null);

// Start polling
intervalRef.current = setInterval(async () => {
  const res = await fetch(`/api/generate/status?taskId=${taskId}`);
  const data = await res.json();
  if (data.status === 'completed' || data.status === 'failed') {
    clearInterval(intervalRef.current!);
    // handle result
  }
}, 3000); // 3s for images, 5s for video

// Cleanup
useEffect(() => {
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, []);
```

## Optimistic Updates

Gallery deletions use optimistic update with rollback:
```ts
let previousItems: GalleryItem[] = [];
setter((prev) => {
  previousItems = prev;
  return prev.filter((i) => i.id !== id);
});

try {
  await fetch('/api/storage/delete', { ... });
} catch {
  setter(previousItems); // Rollback on error
}
```

## Error Handling

- API routes: try/catch → return JSON error with appropriate status code
- Client hooks: try/catch → `addToast(message, 'error')`
- Graceful fallbacks: e.g., watermark failure doesn't block upload, auto-save failure creates local fallback item

## Styling

- **Framework**: Tailwind CSS v4 (utility-first, no CSS modules)
- **Font**: Inter (Google Fonts, loaded in root layout)
- **Color scheme**: Gray backgrounds (`bg-gray-50`), white cards, indigo accents for active states
- **Border radius**: `rounded-xl` (cards), `rounded-2xl` (modals), `rounded-full` (badges/buttons)
- **Layout**: Two-column — 320px sticky sidebar (`w-80`) + fluid main area (`flex-1`)
- **Custom CSS**: Only for scrollbar styling and toast slide-in animation (`globals.css`)

## Image Processing

- **Server-side**: `sharp` for thumbnails (WebP, 300x400, quality 80), watermark compositing (SVG overlay)
- **Client-side**: Canvas API for preview thumbnails (`lib/utils.ts` → `createThumbnail`)
- **Formats**: Original preserved on upload; thumbnails always WebP; bg-removal output is PNG

## Constants

All presets, credit costs, and model identifiers are centralized in `lib/constants.ts`:
- `PRESET_MODELS` — demo portrait images
- `SCENE_PRESETS` / `STYLE_PRESETS` — generation options
- `ASPECT_RATIOS` / `RESOLUTIONS` — output settings
- `CREDIT_COSTS` — per-action credit pricing
- `KIE_MODELS` — AI model identifiers
- `MAX_GARMENTS` (4), `MAX_FILE_SIZE_MB` (20)
