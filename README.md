# Fit Check

Fit Check is a Next.js 15 app for image generation, video generation, templates, and guided onboarding flows.

## Canonical App Routes

- `/app/image`
- `/app/video`
- `/app/templates`
- `/app/assistant`
- `/app/guide`
- `/app/onboarding`
- `/app/academy`

Compatibility behavior:
- `/app` redirects to canonical home (`/app/image`)
- `/app?tool=video` (and similar legacy tool params) redirect to canonical routes

## Local Development

Prerequisites:
- Node.js 18+

1. Install dependencies:
   `npm install`
2. Configure environment:
   Copy `.env.example` to `.env.local` and fill required keys.
3. Start dev server:
   `npm run dev`
4. Open:
   `http://localhost:3000/app/image`

## Quality Checks

- Type check: `npx tsc --noEmit`
- Production build: `npm run build`

## Routing QA

Use the routing smoke checklist after route/navigation changes:
- `docs/routing-smoke-checklist.md`
