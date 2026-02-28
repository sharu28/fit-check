CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  type TEXT NOT NULL CHECK (type IN ('upload', 'generation', 'video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_created_at
  ON public.gallery_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_type_created_at
  ON public.gallery_items (user_id, type, created_at DESC);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Users can read own gallery items'
  ) THEN
    CREATE POLICY "Users can read own gallery items"
      ON public.gallery_items FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Users can insert own gallery items'
  ) THEN
    CREATE POLICY "Users can insert own gallery items"
      ON public.gallery_items FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Users can update own gallery items'
  ) THEN
    CREATE POLICY "Users can update own gallery items"
      ON public.gallery_items FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Users can delete own gallery items'
  ) THEN
    CREATE POLICY "Users can delete own gallery items"
      ON public.gallery_items FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
