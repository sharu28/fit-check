# Library Modules

Server-side utilities and API clients. All files here run on the server except `utils.ts` and `supabase/client.ts` (client-side).

## Modules

### `supabase/`
- `client.ts` — Browser-side Supabase client (`'use client'`, uses public anon key)
- `server.ts` — Server-side Supabase client (uses `cookies()` for session)
- `middleware.ts` — Auth session refresh + route protection logic

### `kie.ts` — AI Generation
- `uploadImageToKie(base64, mimeType)` — Upload image to kie.ai temp storage (3-day retention)
- `createImageGeneration(params)` — Create Nano Banana Pro task
- `createVideoGeneration(params)` — Create Kling 2.6 video task
- `getTaskStatus(taskId)` — Poll task status, map kie.ai states to `processing`/`completed`/`failed`

### `pixian.ts` — Background Removal
- `removeBackground(imageBuffer)` — POST to Pixian.ai API with Basic auth, returns PNG buffer

### `polar.ts` — Billing
- `getCustomerCredits(customerId)` — Fetch meter balance from Polar
- `getCustomerByEmail(email)` — Find Polar customer
- `createCustomer(email, name)` — Create Polar customer
- `createCustomerSession(customerId)` — Generate customer portal URL

### `r2.ts` — Cloud Storage
- `uploadToR2(key, body, contentType)` — PutObject to R2, returns public URL
- `deleteFromR2(key)` — DeleteObject from R2
- `getKeyFromUrl(url)` — Extract R2 object key from public domain URL

### `watermark.ts` — Free-Tier Watermark
- `applyWatermark(imageBuffer)` — Composite semi-transparent "Fit Check" SVG text overlay using sharp

### `utils.ts` — File Utilities (Client-Side)
- `fileToBase64(file)` — File → base64 string
- `readFileToDataUrl(file)` — File → data URL
- `dataURLToFile(dataUrl, filename)` — Data URL → File
- `createThumbnail(source, maxWidth, quality)` — Canvas-based WebP thumbnail

### `constants.ts` — App Configuration
- `PRESET_MODELS` — 8 demo portrait images
- `SCENE_PRESETS` / `STYLE_PRESETS` — Generation option lists
- `ASPECT_RATIOS` / `RESOLUTIONS` — Output settings
- `PLAN_CREDITS` — Monthly credit allocation per plan (`free: 10`, `pro: 100`, `premium: 500`)
- `CREDIT_COSTS` — Per-action credit pricing
- `KIE_MODELS` — AI model identifiers
- `MAX_GARMENTS` (4), `MAX_FILE_SIZE_MB` (20), `DEFAULT_PROMPT`
