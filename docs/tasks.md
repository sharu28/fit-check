# Tasks - Done and Next

## Completed

### Navigation and Core UX
- [x] Retractable sidebar (expanded/collapsed)
- [x] Bottom-left profile control in open menu
- [x] Added Guide and Academy sections
- [x] Added top-level Image and Video tool navigation
- [x] Collapsed sidebar uses icons
- [x] Template library scrolling fixed
- [x] Added Batch Background Removal screen + template

### Templates and Prompting
- [x] Added Launch Campaign Video template
- [x] Added curated `presetPrompts` for templates that already had baked prompts
- [x] `Use Template` now applies a selected preset prompt variant to the target tool
- [x] Added template product-type picker and industry-aware prompt adaptation before template application

### Single Swap and Onboarding
- [x] Added first-run onboarding wizard
- [x] Added first-run business onboarding questionnaire (industry + content goal)
- [x] Legacy onboarding wizard kept in codebase but hidden from end users
- [x] Upgraded onboarding intake to large visual poster cards for industry and content-goal selection
- [x] Added personalized post-intake quick-start feed to guide relevant first inputs and templates
- [x] Fixed onboarding modal layout so card grid scrolls while footer actions stay visible
- [x] Fixed quick-start step actions to keep users in-context (no fallback jump to garment-first view)
- [x] Added Single Swap guided workflow with required-asset states
- [x] Single Swap guide now remains visible for partial input states (subject-only or garment-only)
- [x] Added direct upload actions inside Single Swap guide
- [x] Added quick rerun toolbar actions in Style Studio (`Change Garment`, `Change Subject`)
- [x] Image navigation defaults to Single Swap mode

### Generation UX
- [x] Multi-generation requests are submitted in parallel on backend
- [x] Result loading UI now renders one placeholder card per selected generation count
- [x] Added aesthetic glow-style loading cards (no text)

### Auth and Sessions
- [x] Long-lived Supabase session cookie options
- [x] Browser Supabase singleton for stable sessions
- [x] `/auth` auto-redirect to `/app` when already signed in

### Credits and Billing
- [x] Server-side credit helpers + enforcement for image/video generation
- [x] Unlimited admin bypass (email allowlist) and Admin/Unlimited display
- [x] Billing checkout/portal routes and Polar webhook DB wiring

### Storage and Gallery Reliability
- [x] Video persistence to R2 + gallery support
- [x] Watermark enforced for free generation images (`Fit Check App` label)
- [x] `/api/storage/upload` now errors and cleans up R2 objects when metadata insert fails
- [x] `/api/gallery` includes recovery path that can rebuild metadata rows from current-user R2 prefix when DB is empty
- [x] Foldered gallery organization: create/rename/delete folders + nested subfolders
- [x] Move images/videos between folders, including root (`All Items`)

### Strategic Foundations
- [x] Added `brand_dna` field to `user_profiles` (migration scaffold)
- [x] Added authenticated Brand DNA API (`GET/POST /api/brand-dna`)
- [x] Wired Brand DNA prompt enrichment into `/api/generate/image`

### Docs and Hygiene
- [x] Removed screenshot PNG files from `docs/`
- [x] Updated `docs/architecture.md`
- [x] Updated `docs/patterns.md`
- [x] Updated `docs/tasks.md`

---

## Pending

### OAuth / Auth Config
- [ ] Confirm Google provider is enabled in Supabase Auth for target environments
- [ ] Verify OAuth redirect URLs for local + production
- [ ] Re-test end-to-end Google sign-in flow in production

### Billing Environment Setup
- [ ] Ensure Polar product IDs are configured in production env vars
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` exists in production
- [ ] Run full billing webhook E2E test

### Gallery Data Integrity
- [ ] If historical R2 assets were written under old user IDs, run one-time migration/backfill to current user IDs
- [ ] Add operator/admin script for manual gallery metadata repair by user

### Product Improvements
- [ ] Add explicit per-item save state in gallery cards
- [ ] Add retry-save action in UI when persistence fails
- [ ] Add lightweight telemetry/alerts for gallery metadata failures
- [ ] Build `Brand DNA` memory: let users save visual identity preferences and auto-apply them to prompts/settings
- [ ] Build `Launch Pack Autopilot`: one-click goal-to-campaign flow that generates a launch pack (hero image, channel variants, remove-bg asset, short video, and caption drafts)

---

## Next Recommended Steps

1. Validate OAuth provider config in production and test Google login.
2. Run a one-time audit of `gallery_items` vs R2 prefixes for legacy data mismatch.
3. Complete Polar env + webhook E2E verification.
4. Add gallery save-status + retry UX polish.
5. Start implementation spike for `Brand DNA` and `Launch Pack Autopilot` architecture.
