ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS brand_dna JSONB NOT NULL DEFAULT '{}'::jsonb;
