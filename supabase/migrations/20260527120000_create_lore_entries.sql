-- Lore entries table for RAG retrieval
-- Each row is a semantic chunk (300-800 tokens) of lore content

create type public.lore_category as enum (
  'pathway',
  'npc',
  'location',
  'event',
  'organization',
  'metaphysics'
);

create table public.lore_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category public.lore_category not null,
  content text not null,
  pathway text,
  epoch smallint,
  city text,
  npcs text[] not null default '{}',
  sequences smallint[] not null default '{}',
  tags text[] not null default '{}',
  token_count smallint not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lore_entries is
  'Semantic lore chunks for RAG retrieval. One chunk per logical entity.';
comment on column public.lore_entries.slug is
  'URL-safe unique identifier, e.g. "fool-seq9-seer"';
comment on column public.lore_entries.token_count is
  'Approximate token count for retrieval budget enforcement';
comment on column public.lore_entries.embedding is
  'pgvector embedding (nullable — populated post-MVP)';

-- Indexes for metadata-only retrieval (MVP approach)
create index lore_entries_category_idx on public.lore_entries (category);
create index lore_entries_pathway_idx on public.lore_entries (pathway) where pathway is not null;
create index lore_entries_city_idx on public.lore_entries (city) where city is not null;
create index lore_entries_epoch_idx on public.lore_entries (epoch) where epoch is not null;
create index lore_entries_tags_idx on public.lore_entries using gin (tags);
create index lore_entries_npcs_idx on public.lore_entries using gin (npcs);
create index lore_entries_sequences_idx on public.lore_entries using gin (sequences);

-- Enable RLS — lore is public read, no user writes
alter table public.lore_entries enable row level security;

create policy "Lore entries are publicly readable"
  on public.lore_entries for select
  using (true);

-- Reuse the updated_at trigger from profiles migration
create trigger lore_entries_updated_at
  before update on public.lore_entries
  for each row execute function public.update_updated_at();
