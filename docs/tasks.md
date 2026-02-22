# Tasks - Done and TODO

## Completed

### UX + Navigation (Latest)
- [x] Added retractable sidebar (expanded + collapsed states)
- [x] Moved profile/account control to bottom-left area in open menu
- [x] Added Guide navigation screen
- [x] Added Academy section for courses and demo videos
- [x] Added Image and Video menu options as dedicated tool entries
- [x] Updated collapsed sidebar to icons (no letter placeholders)
- [x] Added Launch Campaign Video template (routes to video generator)
- [x] Fixed Template Library scrolling (TemplatesExplorer now scrollable)
- [x] Added Batch Background Removal screen and template entry

### Single Swap Onboarding UX
- [x] Added guided empty state for single-swap mode (SingleSwapGuide)
- [x] Added explicit 3-step progress strip: Upload Garment -> Choose Subject -> Generate
- [x] Added required input cards with readiness states and actions
- [x] Added sidebar focus/highlight jump from guide actions
- [x] Disabled Generate until required garment + subject inputs are present
- [x] Added clear blocked reason in prompt bar CTA

### Assistant UX
- [x] Redesigned assistant workspace to match current app visual language
- [x] Added dynamic greeting by local time (morning / afternoon / night)

### Auth + Session Persistence
- [x] Added persistent Supabase session cookie options (browser/server/middleware)
- [x] Added singleton browser Supabase client to prevent session churn
- [x] Auto-redirect /auth -> /app when an active session exists

### Admin Credits
- [x] Added unlimited-credits admin bypass in server credit checks/deductions
- [x] Added admin plan display (Admin | Unlimited) in header
- [x] Added env support: UNLIMITED_CREDITS_ADMIN_EMAILS

### Credit Enforcement (Phase 1)
- [x] Added credits_remaining to UserProfile type
- [x] Created lib/credits.ts server-side credit helpers
- [x] Created lib/supabase/admin.ts service-role Supabase client for webhooks
- [x] Updated /api/credits to read from DB instead of Polar
- [x] Added credit check + deduction to /api/generate/image (returns 402 INSUFFICIENT_CREDITS)
- [x] Added credit check + deduction to /api/generate/video (returns 402 INSUFFICIENT_CREDITS)
- [x] Client hooks handle 402 responses and call onCreditsRefresh
- [x] app/app/page.tsx checks credits <= 0 and redirects to /pricing

### Video Persistence (Phase 2)
- [x] /api/storage/upload handles video MIME types (skip thumbnails, .mp4 ext)
- [x] /api/gallery returns uploads, generations, and videos
- [x] useGallery manages videos state with addVideo and deleteVideo
- [x] useVideoGeneration persists videos to R2 after generation, calls onVideoSaved
- [x] Gallery has My Videos tab with inline play, download, delete

### Polar Billing Preparation (Phase 3)
- [x] /api/webhooks/polar wired to DB updates (subscription create/cancel, order paid, customer link)
- [x] Created /api/billing/checkout (503 if product IDs unconfigured)
- [x] Created /api/billing/portal
- [x] pricing/page.tsx wired to checkout API with subscribe + top-up buttons

### Polish & Cleanup (Phase 4)
- [x] Removed dead code: GenerationRecord, AppStatus.ANALYZING, dataURLToFile(), createThumbnail()
- [x] Fixed DEFAULT_PROMPT to be gender/ethnicity neutral
- [x] R2 hostname read from R2_PUBLIC_DOMAIN env var
- [x] Polling timeout: image ~6 min (120 x 3s), video ~10 min (120 x 5s)
- [x] Auth check added to /api/download
- [x] Free-tier watermark on generation images (lib/watermark.ts + storage/upload)
- [x] Removed unused galleryId from /api/generate/remove-bg
- [x] Removed unused videoUrl prop from VideoGenerator
- [x] Fixed useVideoGeneration dependency array
- [x] Type-check passes (npx tsc --noEmit)
- [x] Updated docs (CLAUDE.md, architecture.md, patterns.md)

---

## TODO - Pending

### Critical: Supabase OAuth Provider Setup
- [ ] Enable Google provider in Supabase Auth -> Providers
- [ ] Configure Google OAuth client ID/secret in Supabase
- [ ] Add redirect URLs for local and production callbacks
- [ ] Validate end-to-end Google sign-in flow

### Critical: Database Migration Validation
- [ ] Confirm user_profiles table + RPCs exist in production
- [ ] Backfill profiles for any existing auth.users rows
- [ ] Validate RLS and service role access in production

### Polar Billing Setup
- [ ] Create products in Polar dashboard (Pro, Premium, top-up packs)
- [ ] Set env vars: POLAR_PRO_PRODUCT_ID, POLAR_PREMIUM_PRODUCT_ID, POLAR_TOPUP_50_PRODUCT_ID, POLAR_TOPUP_150_PRODUCT_ID, POLAR_TOPUP_500_PRODUCT_ID
- [ ] Set SUPABASE_SERVICE_ROLE_KEY env var in production
- [ ] Test webhook flow end-to-end (subscribe -> credits updated -> portal works)

### Reliability and Visibility
- [ ] Add explicit per-item save status for generated image/video uploads
- [ ] Add retry-save action when /api/storage/upload fails
- [ ] Add lightweight telemetry for gallery persistence failures

### Nice-to-Have
- [ ] Add OAuth buttons beyond Google (GitHub, Apple)
- [ ] Email notification when credits run low
- [ ] Admin dashboard for credit management

---

## Next (Recommended Order)

1. Fix Google provider setup in Supabase so OAuth sign-in works.
2. Add save-status + retry on generation persistence so users never lose visibility of outputs.
3. Complete Polar product/env setup and run billing webhook E2E tests.
4. Build a minimal admin credit operations page (view + adjust balances with audit log).
