-- The `timestamp` bigint column was never populated by application code
-- (inserts used `created_at` instead), causing every gallery save to fail
-- with a NOT NULL constraint violation. Drop it; `created_at` serves the same purpose.
ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS "timestamp";
