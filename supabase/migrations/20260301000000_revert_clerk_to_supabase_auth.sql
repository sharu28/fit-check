-- ============================================================
-- Revert Clerk migration → back to Supabase Auth
-- Run this in Supabase SQL Editor BEFORE deploying new code
-- ============================================================

-- 1. Drop RLS policies created for Clerk (use auth.jwt()->'sub')
-- ── user_profiles ──
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON user_profiles;

-- ── gallery_items ──
DROP POLICY IF EXISTS "Users can view own gallery items" ON gallery_items;
DROP POLICY IF EXISTS "Users can insert own gallery items" ON gallery_items;
DROP POLICY IF EXISTS "Users can delete own gallery items" ON gallery_items;
DROP POLICY IF EXISTS "Users can update own gallery items" ON gallery_items;
DROP POLICY IF EXISTS "Service role full access to gallery_items" ON gallery_items;

-- ── gallery_folders ──
DROP POLICY IF EXISTS "Users can view own folders" ON gallery_folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON gallery_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON gallery_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON gallery_folders;

-- ── model_presets ──
DROP POLICY IF EXISTS "Anyone can view presets" ON model_presets;
DROP POLICY IF EXISTS "Admins can insert presets" ON model_presets;
DROP POLICY IF EXISTS "Admins can update presets" ON model_presets;
DROP POLICY IF EXISTS "Admins can delete presets" ON model_presets;

-- 2. Drop Clerk webhook trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Revert column types from TEXT back to UUID
--    (safe: Supabase UUIDs are stored as text-compatible UUID strings)

-- Drop FK constraints first
ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_items_user_id_fkey;
ALTER TABLE gallery_folders DROP CONSTRAINT IF EXISTS gallery_folders_user_id_fkey;
ALTER TABLE model_presets DROP CONSTRAINT IF EXISTS model_presets_created_by_fkey;

-- Revert user_profiles.id
ALTER TABLE user_profiles ALTER COLUMN id TYPE UUID USING id::uuid;

-- Revert gallery_items.user_id
ALTER TABLE gallery_items ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Revert gallery_folders.user_id
ALTER TABLE gallery_folders ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Revert model_presets.created_by
ALTER TABLE model_presets ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- 4. Restore FK constraints referencing auth.users
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE gallery_items
  ADD CONSTRAINT gallery_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE gallery_folders
  ADD CONSTRAINT gallery_folders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- model_presets.created_by may allow nulls so use nullable FK
ALTER TABLE model_presets
  ADD CONSTRAINT model_presets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Restore handle_new_user() trigger (auto-create user_profiles on sign up)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits_remaining)
  VALUES (NEW.id, 10)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Restore deduct_credits RPC with UUID parameter
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE user_profiles
  SET credits_remaining = GREATEST(credits_remaining - p_amount, 0)
  WHERE id = p_user_id
  RETURNING credits_remaining INTO v_remaining;
  RETURN v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Restore RLS policies using auth.uid()

-- ── user_profiles ──
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to user_profiles"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ── gallery_items ──
CREATE POLICY "Users can view own gallery items"
  ON gallery_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gallery items"
  ON gallery_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gallery items"
  ON gallery_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery items"
  ON gallery_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to gallery_items"
  ON gallery_items FOR ALL
  USING (auth.role() = 'service_role');

-- ── gallery_folders ──
CREATE POLICY "Users can view own folders"
  ON gallery_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON gallery_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON gallery_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON gallery_folders FOR DELETE
  USING (auth.uid() = user_id);

-- ── model_presets ──
CREATE POLICY "Anyone can view presets"
  ON model_presets FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert presets"
  ON model_presets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update presets"
  ON model_presets FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete presets"
  ON model_presets FOR DELETE
  USING (auth.uid() = created_by);
