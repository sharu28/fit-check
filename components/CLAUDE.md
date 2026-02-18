# Components

All components use `'use client'` directive and are pure UI — no direct API calls or data fetching.

## Conventions

- **Props**: Interfaces defined inline in each file, not exported
- **Icons**: `lucide-react` (import individually)
- **Styling**: Tailwind CSS utility classes only (no CSS modules)
- **State**: Minimal local state; most state lives in parent `app/app/page.tsx` and is passed via props

## Layout

Two-column layout driven by `app/app/page.tsx`:
- **Left sidebar** (`w-80`, sticky): Header + tool-specific controls
- **Main area** (`flex-1`): Result display or gallery, floating prompt bar

## Component List

| Component | Purpose |
|-----------|---------|
| `Header` | Logo, tool switcher (Style Studio / Video), credits display, sign out |
| `SubjectSelector` | Shows selected person image, button to open SubjectModal |
| `SubjectModal` | Preset models gallery, file upload, user gallery — for person selection |
| `GarmentGrid` | 2x2 grid for up to 4 garment uploads, single/panel mode toggle |
| `ImageUploader` | Reusable drag-drop image upload with validation (20MB, image/* only) |
| `SettingsPanel` | Aspect ratio, resolution, scene, and style selectors |
| `PromptBar` | Floating prompt input with rotating hint text + Generate button |
| `ResultDisplay` | Generation results grid with share/download/delete/remove-bg actions |
| `Gallery` | Tabbed browser for uploads and generations |
| `VideoControls` | Reference image, aspect ratio, duration, sound settings for video |
| `VideoGenerator` | Video prompt input + status display + video player |
| `Toast` / `ToastContainer` | Toast notification rendering |
| `PostHogProvider` | Analytics context wrapper |
| `PostHogIdentify` | Identifies user for analytics |

## Modal Pattern

Modals use fixed overlay with backdrop:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-2xl ...">
```
