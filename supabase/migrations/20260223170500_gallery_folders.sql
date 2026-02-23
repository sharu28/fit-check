CREATE TABLE IF NOT EXISTS public.gallery_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.gallery_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_folders_user_parent
  ON public.gallery_folders (user_id, parent_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_gallery_folders_name_per_parent
  ON public.gallery_folders (
    user_id,
    COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::UUID),
    lower(name)
  );

ALTER TABLE public.gallery_folders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gallery_folders' AND policyname = 'Users can read own gallery folders'
  ) THEN
    CREATE POLICY "Users can read own gallery folders"
      ON public.gallery_folders FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gallery_folders' AND policyname = 'Users can insert own gallery folders'
  ) THEN
    CREATE POLICY "Users can insert own gallery folders"
      ON public.gallery_folders FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gallery_folders' AND policyname = 'Users can update own gallery folders'
  ) THEN
    CREATE POLICY "Users can update own gallery folders"
      ON public.gallery_folders FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gallery_folders' AND policyname = 'Users can delete own gallery folders'
  ) THEN
    CREATE POLICY "Users can delete own gallery folders"
      ON public.gallery_folders FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_gallery_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gallery_folders_set_updated_at ON public.gallery_folders;
CREATE TRIGGER trg_gallery_folders_set_updated_at
  BEFORE UPDATE ON public.gallery_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_gallery_folder_updated_at();

ALTER TABLE public.gallery_items
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.gallery_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_items_user_folder
  ON public.gallery_items (user_id, folder_id);
