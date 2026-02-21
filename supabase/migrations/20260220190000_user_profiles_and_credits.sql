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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.user_profiles
      USING (auth.role() = 'service_role');
  END IF;
END
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
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
    SET credits_remaining = credits_remaining - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'remaining', v_current - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits (for Polar webhook top-ups)
CREATE OR REPLACE FUNCTION public.add_credits(p_customer_id TEXT, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
    SET credits_remaining = credits_remaining + p_amount,
        updated_at = NOW()
    WHERE polar_customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill any existing auth users
INSERT INTO public.user_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
