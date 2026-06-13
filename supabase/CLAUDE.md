@../docs/rules/security.md

# Supabase Configuration

## Local Development

Config: `config.toml` (project ID: `lotm-rpg`, PostgreSQL 17, Deno v2 edge runtime).

Local ports: DB 54322, API 54321, Studio 54323, Inbucket 54324.

Start local stack: `supabase start`. Copy URL + anon key from `supabase status` into `.env.local`.

## Migrations

Migrations live in `migrations/`. Eleven migrations in order:

1. `20260527002635_init_profiles.sql` — `profiles` table
   - `id` (UUID FK to `auth.users`), `display_name`, `created_at`, `updated_at`
   - RLS: users read/insert/update own rows only
   - Trigger: auto-create profile on signup
   - Trigger: auto-update `updated_at`

2. `20260527111842_create_lore_entries.sql` — `lore_entries` table
   - `id`, `slug`, `title`, `category` (enum), `content`, `pathway`, `epoch`, `city`, `npcs`, `sequences`, `tags`, `token_count`, `embedding` (vector 1024, nullable — retyped from 1536 in migration 4)
   - RLS: authenticated users can read all entries
   - Unique index on `slug`

3. `20260527113655_seed_lore_entries.sql` — Seed data for lore entries (4 pathways, NPCs, locations, organizations)

4. `20260601120000_create_source_chunks_rag.sql` — RAG foundation (issue #58)
   - `source_chunks` — private corpus: `id`, `source` (enum `novel`/`wiki`/`curated`), `title`, `ref` (jsonb locator), `content`, `tags`, `token_count`, the four chronology/concealment signals (`canon_order`, `arc_bucket`, `concealment_tier`, `in_world_date`), a generated `tsv` (FTS) column, timestamps
   - `chunk_embeddings` — model-keyed vector store: PK `(chunk_id, model_id)`, `embedding vector(1024)`; one row per (chunk, model) so multiple embedding maps coexist with no schema change
   - Indexes: GIN on `source_chunks.tsv`, HNSW (cosine) on `chunk_embeddings.embedding`, plus `canon_order`/`source`/`tags` filters
   - RLS: **deny `anon` + `authenticated`** on both tables (copyrighted corpus, no direct client query path)
   - `match_source_chunks(...)` — `SECURITY DEFINER` RPC: hybrid FTS ⊕ pgvector (cosine) fused via Reciprocal Rank Fusion, parameterized by `model_id`; applies the timeline (`canon_order <= player_position`) and `concealment_tier` gates server-side. The sole corpus read path; granted to `authenticated` only.
   - Also retypes the reserved `lore_entries.embedding` from `vector(1536)` → `vector(1024)` for consistency (column is unpopulated, so a no-op on data).

5. `20260612160000_create_journal.sql` — Story journal (issue #11)
   - `journal_entries` — auto-recorded events: `id` (client-supplied uuid), `user_id` (FK `auth.users`), `session_id`, `character_id`/`character_name`, `turn_number`, `event_type` (checked against the seven journal event types), `summary`, `narrative`, `location`, `involved_npcs`, `arc`, `created_at`
   - `journal_annotations` — player-only notes: `id`, `user_id`, `entry_id` (FK cascade), `text`, timestamps. **Never included in AI context.**
   - RLS: owner-only (`auth.uid() = user_id`) for all operations on both tables

6. `20260612170000_seed_additional_pathways_lore.sql` — Seed lore for the five additional pathways (issue #21): Darkness, Tyrant, Door, Error, Hanged Man (Seq 9-5 + overview, 30 entries). Generated from `src/lib/lore/pathway-{darkness,tyrant,door,error,hanged-man}.ts` (TS remains the canonical source).

7. `20260612230000_create_world_messages.sql` — Shared world messages (issue #17)
   - `world_messages` — template-composed notes: `id`, `user_id`, `location` (indexed), `template_id`, `fills` (jsonb), `text` (CHECK ≤120 chars), `helpful`/`unhelpful` counters
   - `world_message_votes` — PK `(message_id, user_id)`; written only via the RPC
   - RLS: authenticated read ALL messages (shared world), owner insert/delete; votes readable by owner
   - `rate_world_message(uuid, boolean)` — SECURITY DEFINER: one vote per player (unique violation = silent no-op), maintains counters atomically; EXECUTE granted to `authenticated` only

8. `20260613000000_create_marketplace.sql` — Item marketplace (issue #16)
   - `market_listings` — `id`, `seller_id`, `item_name`/`item_description`/`item_category` (checked against rules-engine categories), `price_pence` (CHECK positive int under cap), `status` (`active`/`sold`/`delisted`), `buyer_id`, timestamps
   - RLS: authenticated read active listings + own history; owner insert/delist
   - `purchase_listing(uuid)` — SECURITY DEFINER: row-locked atomic purchase, self-purchase and stale listings rejected server-side; the ONLY path to `sold`; EXECUTE granted to `authenticated` only

9. `20260613010000_create_player_showcases.sql` — Player showcase + leaderboards (issue #18)
   - `player_showcases` — one row per player: `display_name`, `public` (default false), `pathway_id`, `sequence_level`, `achievement_ids`, `divergence_score` (CHECK 0-100), `stats` jsonb
   - RLS: owners full access; other authenticated users may SELECT only rows where `public = true` — private data is never selectable, so it cannot leak

10. `20260613020000_seed_additional_city_lore.sql` — Seed lore for the three additional cities (issue #23): Backlund, Trier, and Bayam (18 entries). Generated from `src/lib/lore/{backlund,trier,bayam}.ts` (TS source is canonical). Same `lore_entries` INSERT format as migration 3.

11. `20260613030000_seed_remaining_pathways_lore.sql` — Seed lore for the thirteen remaining pathways (issue #28): White Tower, Twilight Giant, Justiciar, Black Emperor, Red Priest, Demoness, Mother, Moon, Hermit, Paragon, Wheel of Fortune, Abyss, Chained (13 overview entries). Generated from `src/lib/lore/pathway-*.ts` (TS source is canonical). Same `lore_entries` INSERT format as migration 3.

## Auth Session Persistence

Two settings control login persistence. **Both must be set in the hosted Supabase project** via the Dashboard → Authentication → Advanced settings:

| Setting                  | Source of truth                                    | Dashboard value   |
| ------------------------ | -------------------------------------------------- | ----------------- |
| JWT expiry               | `config.toml` `jwt_expiry = 604800` + Dashboard    | 604800 (7 days)   |
| Refresh token inactivity | **Dashboard only** (`[auth.sessions]` is Pro-only) | 7776000 (90 days) |

**Why both are needed:**

- `jwt_expiry`: The JWT in the cookie lasts 7 days. A cold PWA start (e.g. user opens the app the next morning) will have a valid JWT without needing a server refresh call.
- Refresh token inactivity: The refresh token (server-side) stays valid for 90 days of inactivity. Users who play once a month won't be logged out.
- The middleware also calls `getSession()` before `getUser()` to explicitly refresh an expired JWT using the stored refresh token before validating server-side.

> **`[auth.sessions]` is commented out in `config.toml`.** It is a Pro-plan-only feature — applying it on a Free-plan project (Supabase branching preview environments) fails with HTTP 402 and blocks the Configurations → Migrations pipeline. It is therefore managed exclusively in the hosted project's Dashboard. Removing it from `config.toml` does not weaken persistence: that is driven by `jwt_expiry`, the `@supabase/ssr` 400-day cookie max-age, and the middleware refresh — none of which depend on `[auth.sessions]`.

Session cookies are set with a 400-day max-age by `@supabase/ssr`, so cookie persistence is never the issue — it is always the server-side token lifetimes.

## Auth Email Templates

Custom HTML templates in `templates/`: confirmation, recovery, magic_link, invite, reauthentication, email_change. Victorian-themed to match the game UI.

## Conventions

- Always enable RLS on new tables and write restrictive policies before inserting data.
- Name migrations with a descriptive suffix: `YYYYMMDDHHMMSS_description.sql`.
- Test migrations locally with `supabase db reset` before applying to production.
