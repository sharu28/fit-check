-- ============================================================
-- Revert Clerk migration → back to Supabase Auth
-- Run this in Supabase SQL Editor BEFORE deploying new code
-- ============================================================

-- 1. Drop ALL RLS policies on affected tables (dynamic — handles any name variant)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE tablename IN ('user_profiles', 'gallery_items', 'gallery_folders')
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Drop Clerk webhook trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Revert column types from TEXT back to UUID
--    (safe: Supabase UUIDs are stored as text-compatible UUID strings)

-- Drop FK constraints first
ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_items_user_id_fkey;
ALTER TABLE gallery_folders DROP CONSTRAINT IF EXISTS gallery_folders_user_id_fkey;

-- Revert user_profiles.id
ALTER TABLE user_profiles ALTER COLUMN id TYPE UUID USING id::uuid;

-- Revert gallery_items.user_id
ALTER TABLE gallery_items ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Revert gallery_folders.user_id
ALTER TABLE gallery_folders ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 4. Restore FK constraints referencing auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_items_user_id_fkey;
ALTER TABLE gallery_items
  ADD CONSTRAINT gallery_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE gallery_folders DROP CONSTRAINT IF EXISTS gallery_folders_user_id_fkey;
ALTER TABLE gallery_folders
  ADD CONSTRAINT gallery_folders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

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
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer);
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

-- model_presets table not yet created — its migration runs separately
