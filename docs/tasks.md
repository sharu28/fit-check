# Tasks — Done and TODO

## Completed

### Credit Enforcement (Phase 1)
- [x] Added `credits_remaining` to `UserProfile` type
- [x] Created `lib/credits.ts` — server-side credit helpers (`getUserCredits`, `deductCredits`, cost calculators)
- [x] Created `lib/supabase/admin.ts` — service-role Supabase client for webhooks
- [x] Updated `/api/credits` to read from DB instead of Polar
- [x] Added credit check + deduction to `/api/generate/image` (returns 402 `INSUFFICIENT_CREDITS`)
- [x] Added credit check + deduction to `/api/generate/video` (returns 402 `INSUFFICIENT_CREDITS`)
- [x] Client hooks handle 402 responses and call `onCreditsRefresh`
- [x] `app/app/page.tsx` checks `credits <= 0` → toast + redirect to `/pricing`

### Video Persistence (Phase 2)
- [x] `/api/storage/upload` handles video MIME types (skip thumbnails, .mp4 ext)
- [x] `/api/gallery` returns three categories: uploads, generations, videos
- [x] `useGallery` manages videos state with `addVideo` and `deleteVideo`
- [x] `useVideoGeneration` persists videos to R2 after generation, calls `onVideoSaved`
- [x] `Gallery.tsx` has "My Videos" tab with inline play, download, delete

### Polar Billing Preparation (Phase 3)
- [x] `/api/webhooks/polar` wired to DB updates (subscription create/cancel, order paid, customer link)
- [x] Created `/api/billing/checkout` — maps plan to product ID, creates Polar checkout (503 if unconfigured)
- [x] Created `/api/billing/portal` — creates Polar customer session
- [x] `pricing/page.tsx` wired to checkout API with subscribe + top-up buttons

### Polish & Cleanup (Phase 4)
- [x] Removed dead code: `GenerationRecord`, `AppStatus.ANALYZING`, `dataURLToFile()`, `createThumbnail()`
- [x] Fixed `DEFAULT_PROMPT` to be gender/ethnicity neutral
- [x] R2 hostname read from `R2_PUBLIC_DOMAIN` env var instead of hardcoded
- [x] Polling timeout: image generation ~6 min (120 × 3s), video ~10 min (120 × 5s)
- [x] Auth check added to `/api/download`
- [x] Free-tier watermark on generation images (`lib/watermark.ts` + `storage/upload`)
- [x] Removed unused `galleryId` from `/api/generate/remove-bg`
- [x] Removed unused `videoUrl` prop from `VideoGenerator`
- [x] Fixed `useVideoGeneration` dependency array (added `onCreditsRefresh`, `onVideoSaved`)
- [x] Type-check passes (`npx tsc --noEmit`)
- [x] Updated CLAUDE.md, architecture.md, patterns.md

---

## TODO — Pending

### CRITICAL: Database Migration
The `user_profiles` table must be created in Supabase before credits work. Run this SQL in the Supabase SQL editor (or via MCP):

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.user_profiles
  USING (auth.role() = 'service_role');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic credit deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS JSON AS $$
DECLARE v_current INTEGER;
BEGIN
  SELECT credits_remaining INTO v_current
    FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current IS NULL THEN
    RETURN json_build_object('success', false, 'remaining', 0);
  END IF;
  IF v_current < p_amount THEN
    RETURN json_build_object('success', false, 'remaining', v_current);
  END IF;
  UPDATE public.user_profiles
    SET credits_remaining = credits_remaining - p_amount, updated_at = NOW()
    WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'remaining', v_current - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits (for Polar webhook top-ups)
CREATE OR REPLACE FUNCTION public.add_credits(p_customer_id TEXT, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
    SET credits_remaining = credits_remaining + p_amount, updated_at = NOW()
    WHERE polar_customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

After creating the table, manually insert a profile for any existing users:
```sql
INSERT INTO public.user_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

### Polar Billing Setup
- [ ] Create products in Polar dashboard (Pro, Premium, top-up packs)
- [ ] Set env vars: `POLAR_PRO_PRODUCT_ID`, `POLAR_PREMIUM_PRODUCT_ID`, `POLAR_TOPUP_50_PRODUCT_ID`, `POLAR_TOPUP_150_PRODUCT_ID`, `POLAR_TOPUP_500_PRODUCT_ID`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` env var in production
- [ ] Test webhook flow end-to-end (subscribe → credits updated → portal works)

### Env Vars to Add
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — needed by `lib/supabase/admin.ts` for webhook handlers
- [ ] `R2_PUBLIC_DOMAIN` — used by `next.config.ts` for image hostname (currently has hardcoded fallback)
- [ ] `POLAR_*_PRODUCT_ID` — billing product IDs (checkout returns 503 without these)

### Nice-to-Have
- [x] Password reset flow — inline on auth page (mode toggle: login / signup / reset)
- [ ] Add OAuth buttons beyond Google (GitHub, Apple)
- [x] PromptBar disable Generate button when `credits === 0`
- [x] VideoGenerator disable Generate button when `credits === 0`
- [ ] Email notification when credits run low
- [ ] Admin dashboard for credit management
