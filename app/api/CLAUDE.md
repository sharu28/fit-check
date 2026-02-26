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

API clients live in `lib/` and routes import/call them:
- `lib/kie.ts` for image/video generation (`uploadImageToKie`, `createImageGeneration`, `createVideoGeneration`, `getTaskStatus`)
- `lib/pixian.ts` for background removal (`removeBackground`)
- `lib/polar.ts` for billing (`getCustomerCredits`, `getCustomerByEmail`, `createCustomer`)
- `lib/r2.ts` for storage (`uploadToR2`, `deleteFromR2`, `getKeyFromUrl`)
- `lib/watermark.ts` for free-tier watermarking (`applyWatermark`)
- `lib/resend.ts` for transactional email delivery (`sendEmailWithResend`)

## Storage Pattern

Upload flow: receive base64/URL -> decode to Buffer -> process (watermark, thumbnail) -> upload to R2 -> insert metadata into Supabase `gallery_items` table -> return GalleryItem JSON.

Delete flow: look up item in Supabase (user-scoped) -> extract R2 keys from URLs -> delete from R2 -> delete from Supabase.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `credits/` | Fetch user credits + plan from Supabase `user_profiles` |
| GET | `download/` | Proxy image download (CORS bypass) |
| GET | `gallery/` | List user uploads + generations |
| GET | `model-presets/` | Search shared model presets by keyword/category |
| POST | `model-presets/` | Admin-only upload + tag a shared model preset |
| POST | `generate/image/` | Create image generation task (kie.ai) |
| POST | `generate/video/` | Create video generation task (kie.ai) |
| GET | `generate/status/` | Poll task completion status |
| POST | `generate/remove-bg/` | Remove background (Pixian.ai) |
| POST | `storage/upload/` | Upload image to R2 + save metadata |
| POST | `storage/delete/` | Delete image from R2 + metadata |
| POST | `email/send/` | Send transactional email to authenticated user via Resend |
| POST | `webhooks/polar/` | Handle Polar subscription events (HMAC verified) |
