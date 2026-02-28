CREATE TABLE IF NOT EXISTS public.model_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_presets_created_at_idx
  ON public.model_presets (created_at DESC);

CREATE INDEX IF NOT EXISTS model_presets_category_idx
  ON public.model_presets (category);

CREATE INDEX IF NOT EXISTS model_presets_tags_gin_idx
  ON public.model_presets USING GIN (tags);

ALTER TABLE public.model_presets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'model_presets'
      AND policyname = 'model_presets_select_authenticated'
  ) THEN
    CREATE POLICY "model_presets_select_authenticated"
      ON public.model_presets
      FOR SELECT
      TO authenticated
      USING (TRUE);
  END IF;
END
$$;
