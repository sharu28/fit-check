# API Routes

All routes are Next.js App Router route handlers (`route.ts` files).

## Auth

Every route (except webhooks) requires Supabase auth:
```ts
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

## External API Clients

API clients live in `lib/` — routes import and call them:
- `lib/kie.ts` — image/video generation (uploadImageToKie, createImageGeneration, createVideoGeneration, getTaskStatus)
- `lib/pixian.ts` — background removal (removeBackground)
- `lib/polar.ts` — billing (getCustomerCredits, getCustomerByEmail, createCustomer)
- `lib/r2.ts` — storage (uploadToR2, deleteFromR2, getKeyFromUrl)
- `lib/watermark.ts` — free-tier watermark (applyWatermark)

## Storage Pattern

Upload flow: receive base64/URL → decode to Buffer → process (watermark, thumbnail) → upload to R2 → insert metadata into Supabase `gallery_items` table → return GalleryItem JSON.

Delete flow: look up item in Supabase (user-scoped) → extract R2 keys from URLs → delete from R2 → delete from Supabase.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `credits/` | Fetch user credits + plan from Polar |
| GET | `download/` | Proxy image download (CORS bypass) |
| GET | `gallery/` | List user uploads + generations |
| POST | `generate/image/` | Create image generation task (kie.ai) |
| POST | `generate/video/` | Create video generation task (kie.ai) |
| GET | `generate/status/` | Poll task completion status |
| POST | `generate/remove-bg/` | Remove background (Pixian.ai) |
| POST | `storage/upload/` | Upload image to R2 + save metadata |
| POST | `storage/delete/` | Delete image from R2 + metadata |
| POST | `webhooks/polar/` | Handle Polar subscription events (HMAC verified) |
