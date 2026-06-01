-- RAG foundation (sub-issue #58 of #57): the private source corpus, a
-- model-keyed embedding store, a shared full-text index, and one server-side
-- RPC that enforces privacy + the timeline/concealment gate.
--
-- Design as resolved in #57's comment thread: local-only embedding, model-keyed
-- `chunk_embeddings` (multiple 1024-dim "maps" coexist), hybrid FTS + pgvector
-- retrieval fused via Reciprocal Rank Fusion, and a first-class four-signal
-- chronology/concealment gate. The corpus is copyrighted (risk-accepted by the
-- owner) so it has NO direct client query path — RLS denies anon/authenticated
-- and the only read path is the SECURITY DEFINER RPC below.

-- pgvector is already provisioned by the lore_entries migration; keep idempotent.
create extension if not exists vector with schema extensions;

-- Where a chunk came from. The corpus is dominated by the novel + Fandom wiki;
-- 'curated' lets the existing hand-authored guardrails live in the same store.
create type public.source_chunk_source as enum (
  'novel',
  'wiki',
  'curated'
);

-- The corpus table. One row per 300-800-token chunk. The FTS half of hybrid
-- retrieval lives here (shared across every embedding model); the vector half
-- lives in chunk_embeddings, one row per (chunk, model).
create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source public.source_chunk_source not null,
  title text not null,
  -- Source-shaped locator: {"chapter": 42} for the novel, {"page","url"} for wiki.
  ref jsonb not null default '{}'::jsonb,
  content text not null,
  tags text[] not null default '{}',
  token_count integer not null,
  -- Four chronology/concealment signals (the timeline gate's first-class axes):
  -- 1. monotonic canon-order position, derived from chapter/section boundaries.
  canon_order integer,
  -- 2. coarse arc axis for UX / player advancement (e.g. 'clown', 'tarot-club').
  arc_bucket text,
  -- 3. spoiler tier, enforced server-side only (0 = freely visible, higher = more concealed).
  concealment_tier smallint not null default 0,
  -- 4. true in-world date where canon provides one (fictional calendar → text).
  in_world_date text,
  -- Shared full-text vector over title + content; stored once, model-agnostic.
  tsv tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_chunks_token_count_positive check (token_count > 0),
  constraint source_chunks_concealment_tier_nonneg check (concealment_tier >= 0)
);

comment on table public.source_chunks is
  'Private RAG corpus (novel/wiki/curated). Copyrighted — no direct client query path; read only via match_source_chunks RPC.';
comment on column public.source_chunks.ref is
  'Source-shaped locator: {chapter} for novel, {page,url} for wiki.';
comment on column public.source_chunks.canon_order is
  'Monotonic canon-order position; the timeline gate filters canon_order <= player_position.';
comment on column public.source_chunks.arc_bucket is
  'Coarse arc axis for UX / advancement.';
comment on column public.source_chunks.concealment_tier is
  'Spoiler tier, enforced server-side in the RPC only — never client-filterable.';
comment on column public.source_chunks.in_world_date is
  'True in-world date where canon provides one (nullable).';
comment on column public.source_chunks.tsv is
  'Generated FTS vector over title || content; the lexical half of hybrid retrieval, shared across all embedding models.';

-- GIN index for the FTS half of hybrid retrieval.
create index source_chunks_tsv_idx on public.source_chunks using gin (tsv);
-- Metadata filters used by the timeline/concealment gate and source/tag filters.
create index source_chunks_canon_order_idx on public.source_chunks (canon_order) where canon_order is not null;
create index source_chunks_source_idx on public.source_chunks (source);
create index source_chunks_tags_idx on public.source_chunks using gin (tags);

-- Model-keyed embedding store. One row per (chunk, model) so multiple embedding
-- "maps" (qwen3-embedding-0.6B, bge-m3, …) coexist — adding a model later is
-- another offline batch, no schema change.
create table public.chunk_embeddings (
  chunk_id uuid not null references public.source_chunks(id) on delete cascade,
  model_id text not null,
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now(),
  primary key (chunk_id, model_id)
);

comment on table public.chunk_embeddings is
  'Model-keyed vector store: one row per (chunk, model) so multiple 1024-dim embedding maps coexist with no schema change.';

-- HNSW over cosine distance. 1024-dim is comfortably under pgvector's 2000-dim
-- cap, so no halfvec needed. The opclass must match the operator used by the RPC.
create index chunk_embeddings_embedding_idx
  on public.chunk_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

-- RLS: deny anon + authenticated on BOTH tables. The copyrighted corpus has no
-- direct client query path — no policies means no row is selectable. Reads go
-- exclusively through the SECURITY DEFINER RPC, which bypasses RLS as its owner.
alter table public.source_chunks enable row level security;
alter table public.chunk_embeddings enable row level security;

revoke all on public.source_chunks from anon, authenticated;
revoke all on public.chunk_embeddings from anon, authenticated;

-- Reuse the updated_at trigger from the profiles migration.
create trigger source_chunks_updated_at
  before update on public.source_chunks
  for each row execute function public.update_updated_at();

-- Hybrid retrieval RPC: Postgres FTS ⊕ pgvector cosine distance fused via
-- Reciprocal Rank Fusion (deterministic given fixed inputs). Parameterized by
-- model_id (searches the matching map). The timeline filter (canon_order <=
-- player_position) and the concealment_tier gate are applied INSIDE the function
-- so neither is client-filterable.
--
-- p_query_text drives the FTS half; p_query_embedding the vector half. A NULL/
-- empty player_position means "no timeline limit" (e.g. operator/eval use).
create or replace function public.match_source_chunks(
  p_query_embedding extensions.vector(1024),
  p_query_text text,
  p_model_id text,
  p_player_position integer default null,
  p_max_concealment_tier smallint default 0,
  p_sources public.source_chunk_source[] default null,
  p_tags text[] default null,
  p_match_count integer default 10,
  p_rrf_k integer default 60
)
returns table (
  id uuid,
  source public.source_chunk_source,
  title text,
  ref jsonb,
  content text,
  tags text[],
  token_count integer,
  canon_order integer,
  arc_bucket text,
  concealment_tier smallint,
  in_world_date text,
  fts_rank integer,
  vec_rank integer,
  rrf_score double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select sc.*
    from public.source_chunks sc
    where (p_sources is null or sc.source = any (p_sources))
      and (p_tags is null or sc.tags && p_tags)
      -- Timeline gate: chunks with no canon order (e.g. curated) are timeless.
      and (p_player_position is null or sc.canon_order is null or sc.canon_order <= p_player_position)
      -- Concealment gate: server-enforced spoiler tier.
      and sc.concealment_tier <= p_max_concealment_tier
  ),
  -- Vector half: nearest neighbours within the model's map, over filtered rows.
  vec as (
    select f.id,
           row_number() over (
             order by ce.embedding operator(extensions.<=>) p_query_embedding
           )::integer as rank
    from filtered f
    join public.chunk_embeddings ce
      on ce.chunk_id = f.id and ce.model_id = p_model_id
    order by ce.embedding operator(extensions.<=>) p_query_embedding
    limit least(greatest(p_match_count, 1) * 10, 200)
  ),
  -- Lexical half: full-text matches over the shared tsvector.
  fts as (
    select f.id,
           row_number() over (
             order by ts_rank_cd(f.tsv, query) desc
           )::integer as rank
    from filtered f,
         websearch_to_tsquery('english', p_query_text) as query
    where p_query_text is not null
      and p_query_text <> ''
      and f.tsv @@ query
    order by ts_rank_cd(f.tsv, query) desc
    limit least(greatest(p_match_count, 1) * 10, 200)
  ),
  -- Reciprocal Rank Fusion: deterministic combination of the two rank lists.
  fused as (
    select coalesce(vec.id, fts.id) as id,
           vec.rank as vec_rank,
           fts.rank as fts_rank,
           coalesce(1.0 / (p_rrf_k + vec.rank), 0.0)
             + coalesce(1.0 / (p_rrf_k + fts.rank), 0.0) as rrf_score
    from vec
    full outer join fts on vec.id = fts.id
  )
  select sc.id,
         sc.source,
         sc.title,
         sc.ref,
         sc.content,
         sc.tags,
         sc.token_count,
         sc.canon_order,
         sc.arc_bucket,
         sc.concealment_tier,
         sc.in_world_date,
         fused.fts_rank,
         fused.vec_rank,
         fused.rrf_score
  from fused
  join public.source_chunks sc on sc.id = fused.id
  -- Deterministic ordering: fused score, then canon order, then id.
  order by fused.rrf_score desc, sc.canon_order asc nulls last, sc.id asc
  limit greatest(p_match_count, 1);
$$;

comment on function public.match_source_chunks is
  'Hybrid FTS + pgvector (cosine) retrieval fused via RRF, parameterized by model_id. Applies the timeline (canon_order <= player_position) and concealment_tier gates server-side. SECURITY DEFINER: the sole read path to the private corpus.';

-- The RPC is the only corpus read path; expose it to authenticated players only.
revoke all on function public.match_source_chunks(
  extensions.vector(1024), text, text, integer, smallint,
  public.source_chunk_source[], text[], integer, integer
) from public;
grant execute on function public.match_source_chunks(
  extensions.vector(1024), text, text, integer, smallint,
  public.source_chunk_source[], text[], integer, integer
) to authenticated;

-- Align the reserved lore_entries.embedding with the corpus dimension (1024).
-- The column is nullable and entirely unpopulated today, so the retype is a
-- no-op on existing rows.
alter table public.lore_entries
  alter column embedding type extensions.vector(1024);

comment on column public.lore_entries.embedding is
  'pgvector embedding (nullable — populated post-MVP). 1024-dim, matching the RAG corpus (chunk_embeddings).';
