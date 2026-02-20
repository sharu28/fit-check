-- Shared model presets table for subject reference browsing.
create table if not exists public.model_presets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null default '',
  tags text[] not null default '{}',
  image_url text not null,
  thumbnail_url text,
  mime_type text not null default 'image/jpeg',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists model_presets_created_at_idx
  on public.model_presets (created_at desc);

create index if not exists model_presets_category_idx
  on public.model_presets (category);

create index if not exists model_presets_tags_gin_idx
  on public.model_presets using gin (tags);

alter table public.model_presets enable row level security;

-- Logged-in users can read presets.
drop policy if exists "model_presets_select_authenticated" on public.model_presets;
create policy "model_presets_select_authenticated"
on public.model_presets
for select
to authenticated
using (true);

-- Do not grant insert/update/delete to general authenticated users.
-- Admin creation is handled by API route with server-side checks.
