# App Routing Smoke Checklist

Run this checklist after each routing refactor increment.

## Route Reachability
- Open `/app` and verify it redirects to `/app/image`.
- Open `/app?tool=video` and verify it redirects to `/app/video`.
- Open each canonical route directly:
  - `/app/image`
  - `/app/video`
  - `/app/templates`
  - `/app/assistant`
  - `/app/guide`
  - `/app/onboarding`
  - `/app/academy`

## Sidebar / Header Navigation
- Click `Image`, `Video`, `Templates`, `Assistant`, `Guide`, `Onboarding`, `Academy`.
- Confirm URL changes to the expected canonical route.
- Use browser Back/Forward and confirm active navigation state follows the URL.

## Core Feature Parity
- Image tool: upload image(s), generate, and open Gallery.
- Video tool: add product input, set prompt, generate.
- Templates: select a template and verify it routes to the expected workspace.
- Onboarding: first-time flow routes to onboarding, completion routes to `/app/image`.

## Visual / Layout Checks
- Desktop: no clipping/overlap on sidebar + workspace content.
- Mobile: sidebar collapse/expand still works and route changes remain functional.

## Quality Gates
- `npx tsc --noEmit`
- `npm run build`
