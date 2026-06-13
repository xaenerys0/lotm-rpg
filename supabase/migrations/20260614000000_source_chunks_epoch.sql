-- Character epoch isolation: gate the RAG corpus by epoch so a non-Fifth-Epoch
-- character never retrieves Fifth-Epoch canon chunks. Adds an `epoch` column to
-- source_chunks (nullable = universal, like a null canon_order is timeless) and
-- threads a `p_epoch` gate through match_source_chunks, mirroring the existing
-- timeline gate's shape (untagged rows always pass; a tagged row passes only on
-- exact epoch match).

-- 1. The epoch column. Nullable: a NULL epoch is universal Beyonder knowledge
--    that holds in every era (the curated guardrails, shared mechanics).
alter table public.source_chunks add column epoch smallint;

comment on column public.source_chunks.epoch is
  'Epoch tag for the content gate. NULL = universal (passes for every epoch); otherwise the chunk is shown only to a character of that exact epoch. Mirrors canon_order''s "null is timeless" semantics.';

-- Metadata filter for the epoch gate (partial — only tagged rows are indexed).
create index source_chunks_epoch_idx on public.source_chunks (epoch) where epoch is not null;

-- 2. Backfill: the loaded novel + wiki corpus is entirely Fifth-Epoch canon, so
--    stamp it epoch 5 — a non-Fifth character must receive none of it. Curated
--    guardrails are left NULL (universal) unless individually tagged later.
update public.source_chunks set epoch = 5 where source in ('novel', 'wiki');

-- 3. Re-create the retrieval RPC with the epoch gate. Adding a parameter changes
--    the function's argument signature, so the old overload is dropped first
--    (create-or-replace cannot change the argument list in place).
drop function if exists public.match_source_chunks(
  extensions.vector(1024), text, text, integer, smallint,
  public.source_chunk_source[], text[], integer, integer
);

create function public.match_source_chunks(
  p_query_embedding extensions.vector(1024),
  p_query_text text,
  p_model_id text,
  p_player_position integer default null,
  p_epoch smallint default null,
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
  epoch smallint,
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
      -- Epoch gate: untagged chunks are universal; a tagged chunk passes only on
      -- an exact epoch match. A null p_epoch means "no limit" (operator/eval).
      and (p_epoch is null or sc.epoch is null or sc.epoch = p_epoch)
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
         sc.epoch,
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
  'Hybrid FTS + pgvector (cosine) retrieval fused via RRF, parameterized by model_id. Applies the timeline (canon_order <= player_position), epoch (sc.epoch null or = p_epoch), and concealment_tier gates server-side. SECURITY DEFINER: the sole read path to the private corpus.';

-- The RPC is the only corpus read path; expose it to authenticated players only.
revoke all on function public.match_source_chunks(
  extensions.vector(1024), text, text, integer, smallint, smallint,
  public.source_chunk_source[], text[], integer, integer
) from public;
grant execute on function public.match_source_chunks(
  extensions.vector(1024), text, text, integer, smallint, smallint,
  public.source_chunk_source[], text[], integer, integer
) to authenticated;
