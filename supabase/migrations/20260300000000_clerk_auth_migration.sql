-- ============================================================
-- CLERK AUTH MIGRATION
-- Switches auth provider from Supabase to Clerk.
-- - Changes user ID columns from UUID to TEXT (Clerk IDs are strings like "user_2xxxx")
-- - Drops all FK references to auth.users (Clerk manages users externally)
-- - Drops the handle_new_user() trigger (Clerk webhook creates profiles instead)
-- - Updates deduct_credits() to accept TEXT user ID
-- - Recreates RLS policies using Clerk JWT claims (auth.jwt() ->> 'sub')
--
-- IMPORTANT: Run this BEFORE deploying the new Clerk-based application code.
-- IMPORTANT: Set Supabase JWT Secret to the Clerk JWT template signing key
--   in Supabase Dashboard → Settings → Auth → JWT Settings → JWT Secret
-- ============================================================

-- ---- Step 1: Drop the Supabase auth trigger (Clerk webhook replaces it) ----

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ---- Step 2: Drop all RLS policies (will be recreated with Clerk JWT claims) ----

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can read own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can insert own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can update own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can delete own gallery items" ON public.gallery_items;

DROP POLICY IF EXISTS "Users can read own gallery folders" ON public.gallery_folders;
DROP POLICY IF EXISTS "Users can insert own gallery folders" ON public.gallery_folders;
DROP POLICY IF EXISTS "Users can update own gallery folders" ON public.gallery_folders;
DROP POLICY IF EXISTS "Users can delete own gallery folders" ON public.gallery_folders;

-- model_presets: select policy is fine as-is (allows all authenticated users)
-- No changes needed there.

-- ---- Step 3: Drop indexes that depend on the columns we are altering ----
-- (PostgreSQL requires this before changing UUID columns to TEXT in some cases)

DROP INDEX IF EXISTS public.idx_gallery_items_user_created_at;
DROP INDEX IF EXISTS public.idx_gallery_items_user_type_created_at;
DROP INDEX IF EXISTS public.idx_gallery_items_user_folder;

DROP INDEX IF EXISTS public.idx_gallery_folders_user_parent;
DROP INDEX IF EXISTS public.ux_gallery_folders_name_per_parent;

-- ---- Step 4: Drop FK constraints referencing auth.users ----

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;

ALTER TABLE public.gallery_items DROP CONSTRAINT IF EXISTS gallery_items_user_id_fkey;
ALTER TABLE public.gallery_folders DROP CONSTRAINT IF EXISTS gallery_folders_user_id_fkey;
ALTER TABLE public.model_presets DROP CONSTRAINT IF EXISTS model_presets_created_by_fkey;

-- ---- Step 5: Change user ID columns from UUID to TEXT ----
-- Using USING ... ::text to handle any existing UUID values (converts to text representation)

ALTER TABLE public.user_profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.gallery_items ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.gallery_folders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.model_presets ALTER COLUMN created_by TYPE TEXT USING created_by::text;

-- ---- Step 6: Restore primary key on user_profiles ----

ALTER TABLE public.user_profiles ADD PRIMARY KEY (id);

-- ---- Step 7: Recreate indexes (no longer UUID-typed, but functionally the same) ----

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_created_at
  ON public.gallery_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_type_created_at
  ON public.gallery_items (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_folder
  ON public.gallery_items (user_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_gallery_folders_user_parent
  ON public.gallery_folders (user_id, parent_id);

-- Recreate unique index; parent_id stays UUID (self-referential within gallery_folders)
-- Use empty string as the null sentinel for user_id grouping
CREATE UNIQUE INDEX IF NOT EXISTS ux_gallery_folders_name_per_parent
  ON public.gallery_folders (
    user_id,
    COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::UUID),
    lower(name)
  );

-- ---- Step 8: Update deduct_credits() to accept TEXT user ID ----

CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id TEXT, p_amount INTEGER)
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
    SET credits_remaining = credits_remaining - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'remaining', v_current - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- Step 9: Recreate RLS policies using Clerk JWT claims ----
-- Clerk JWTs include "sub" = Clerk user ID and "role" = "authenticated"
-- Supabase reads the JWT via auth.jwt() once the JWT secret is set to Clerk's signing key.

-- user_profiles
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = id)
  WITH CHECK ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Service role full access"
  ON public.user_profiles
  USING (auth.role() = 'service_role');

-- gallery_items
CREATE POLICY "Users can read own gallery items"
  ON public.gallery_items FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own gallery items"
  ON public.gallery_items FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own gallery items"
  ON public.gallery_items FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete own gallery items"
  ON public.gallery_items FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- gallery_folders
CREATE POLICY "Users can read own gallery folders"
  ON public.gallery_folders FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own gallery folders"
  ON public.gallery_folders FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own gallery folders"
  ON public.gallery_folders FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete own gallery folders"
  ON public.gallery_folders FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- model_presets: existing SELECT policy is unchanged (allows all authenticated users)
-- No RLS changes needed for model_presets.
