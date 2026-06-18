-- Cloud-synced cross-timeline world memory (legacies + echoes).
--
-- Legacies (fallen-character death records, LEGACIES_KEY) and echoes (timeline
-- artifacts, ECHOES_KEY) are world memory that deliberately outlives any single
-- character — but they too lived only in localStorage. One row per user holds
-- both as jsonb arrays (they are read and written wholesale by the engine).

create table public.world_memory (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  legacies   jsonb not null default '[]'::jsonb,
  echoes     jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.world_memory enable row level security;

create policy "Players manage their own world memory"
  on public.world_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
