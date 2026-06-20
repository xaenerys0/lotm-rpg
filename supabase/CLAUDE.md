@../docs/rules/security.md

# Supabase Configuration

## Local Development

Config: `config.toml` (project ID: `lotm-rpg`, PostgreSQL 17, Deno v2 edge runtime).

Local ports: DB 54322, API 54321, Studio 54323, Inbucket 54324.

Start local stack: `supabase start`. Copy URL + anon key from `supabase status` into `.env.local`.

## Migrations

Migrations live in `migrations/`. Twenty-five migrations in order:

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

12. `20260614000000_source_chunks_epoch.sql` — Epoch gate for the RAG corpus (character epoch isolation). Adds a nullable `source_chunks.epoch smallint` column (+ partial index; `NULL` = universal, mirroring a null `canon_order`), backfills the loaded novel/wiki corpus to `epoch = 5`, and **re-creates** `match_source_chunks` with a new `p_epoch smallint default null` argument + an `epoch` return column and the gate clause `(p_epoch is null or sc.epoch is null or sc.epoch = p_epoch)`. The old 9-arg overload is dropped and the new signature re-granted to `authenticated`. Keep `database.ts` in sync.

13. `20260614010000_seed_epoch_lore.sql` — Seed the four pre-Iron-Age epochs' curated lore (First-Fourth, 16 entries), generated from `src/lib/lore/epoch-{first,second,third,fourth}.ts` (TS source is canonical). Same `lore_entries` INSERT format as migration 3. The Fifth-Epoch rows were already seeded and epoch-tagged by the earlier migrations.

14. `20260614020000_seed_region_lore.sql` — Seed lore for the farther Fifth-Epoch start regions (varied story openings): Pritz Harbor, Enmat Harbor, and the Feysac Empire (3 entries). Generated from `src/lib/lore/regions.ts` (TS source is canonical). Same `lore_entries` INSERT format as migration 3.

15. `20260618102315_create_game_sessions.sql` — Cloud-synced character saves (cross-device sync). The full `GameSession` lived only in localStorage; this is the durable, authoritative copy. `game_sessions` — `id` (client-supplied uuid), `user_id` (FK `auth.users`), `data` (jsonb — the whole serialized save), `is_active` (the active-character pointer), `updated_at`/`created_at`. Index `(user_id, updated_at desc)` (the save list); **partial-unique** `(user_id) where is_active` (one active character). RLS owner-only. `set_active_session(p_id uuid)` — SECURITY DEFINER: atomically clears the prior active row and sets the chosen one, scoped to `auth.uid()`. Keep `database.ts` in sync.

16. `20260618102323_create_world_memory.sql` — Cloud-synced cross-timeline world memory (legacies + echoes), previously browser-only. `world_memory` — one row per user: `user_id` PK, `legacies` jsonb, `echoes` jsonb, `updated_at`. RLS owner-only.

17. `20260618102336_create_user_preferences.sql` — Cloud-synced display preferences + first-time-hint dismissals (cross-device). `user_preferences` — one row per user: `user_id` PK, `preferences` jsonb, `dismissed_hints` text[], `updated_at`. RLS owner-only.

18. `20260618102520_harden_set_active_session_grants.sql` — Locks the `set_active_session` RPC's EXECUTE to `authenticated` only (`revoke … from public, anon; grant … to authenticated`), matching the `purchase_listing`/`rate_world_message` convention and clearing the security advisor warning. Kept as its own versioned file so `migrations/` mirrors the remote history exactly (the grant was applied out-of-band alongside migration 15, so migration 15 creates the RPC but does NOT grant it — this file does).

19. `20260618130000_resync_pathway_lore_seq0.sql` — Resync the thirteen pathway-overview `lore_entries` with the canonical TS source after issue #99 Part A completed Seq 4-1/0 for these pathways. The earlier seed (`20260613030000`) predated the completion (Seq 9-5 only, pre-reconciliation Demoness names, under-counted tokens); this idempotent `UPDATE` (keyed by slug) brings the rows back in sync. TS (`src/lib/lore/pathway-*.ts`) is canonical.

20. `20260619103613_create_rate_limits.sql` — Per-user rate limiting for the operator-funded embed proxy (`/api/proxy/ollama-cloud/api/embed`, issue #60 follow-up), so one signed-in account can't run up the operator's ollama.com bill. `rate_limits` — PK `(user_id, bucket)`, `window_start`, `counter`; the `bucket` column keeps it reusable for future operator-funded limits. RLS enabled with **no policies** — written only via the RPC (bypasses RLS), so players can neither read nor tamper with their own counter (the `world_message_votes` posture). `check_rate_limit(p_bucket text, p_max_requests int, p_window_seconds int)` — SECURITY DEFINER, `search_path = ''`, keyed by `auth.uid()`: one atomic `INSERT … ON CONFLICT DO UPDATE` fixed-window check-and-increment (the single statement's row lock serializes concurrent calls), returns `(allowed, remaining, reset_at)`; EXECUTE granted to `authenticated` only. Limits are env-tunable in the route (`EMBED_RATE_LIMIT_MAX` / `EMBED_RATE_LIMIT_WINDOW_SECONDS`; `0` disables). Keep `database.ts` in sync.

21. `20260620125028_seed_forsaken_land_lore.sql` — Seed the Forsaken Land of the Gods (world build-out 3, issue #132): the City of Silver / Giant King's Court locations + the Third-Epoch fall, the Numinous Episcopate organization, and the City-of-Silver NPCs (12 entries). Generated from the TS source (`src/lib/lore/{forsaken-land,organizations,npcs}.ts` — canonical); same `lore_entries` INSERT format as migration 3. `narratorOnly` is a TS-only prompt flag (no column), intentionally not persisted, matching the prior lore seeds. Parity (TS ↔ rows) verified via the Supabase MCP after apply.

22. `20260620152919_seed_backlund_deepdive_lore.sql` — Seed the Backlund deep-dive (world build-out 4, issue #133): notable boroughs/landmarks (borough structure, harbour & docklands, the underground & Tudor-Trunsoest ruins, the financial district), the Rose School of Thought, the capital's Nighthawks division, the Tarot Club, and the Backlund NPCs (Audrey Hall, the Hall family, Alger Wilson) — 12 entries. Generated from the TS source (`src/lib/lore/{backlund,organizations,npcs}.ts` — canonical); same `lore_entries` INSERT format as migration 3. `narratorOnly` is a TS-only prompt flag (no column), intentionally not persisted. Parity (TS ↔ rows: 12 rows, total `token_count` 2605) verified via the Supabase MCP after apply.

23. `20260620161223_correct_world_buildout_lore.sql` — Resync the world-build-out lore to the canon corpus (issues #132/#133), in the `resync_pathway_lore_seq0` pattern. The Forsaken-Land (21) and Backlund (22) seeds carried memory-sourced errors caught against `corpus/wiki` (see the root `CLAUDE.md` "Canon & Source Material"): the Rose School of Thought worships the Mother Tree of Desire on the Chained pathway (NOT the Evernight Goddess); Alger Wilson is not a Rose-School/Backlund figure; the City of Silver is giant-descended (Twilight Giant), not a faith-order with a "Silver Knights" corps. Upserts (delete-then-insert) the corrected rows from the canonical TS and deletes the obsolete slugs (`npc-alger-wilson`, `rose-school-of-thought-doctrine`). Applied + parity-verified via the Supabase MCP.

24. `20260620172406_canon_pass_and_moon_city.sql` — A second canon-correction resync (corpus-verified) plus Moon City (issues #132/#133). Fixes memory-sourced errors caught against `corpus/wiki`: NPC pathways (Pallez Zoroast → Error, Old Neil → Hermit, Ince Zangwill → Death/Darkness) and seven pathway-overview group attributions (abyss/chained → Fountain of Darkness; black-emperor/justiciar → Trickster Apostle; moon/mother → Goddess of Origin; wheel-of-fortune → Key of Light). Adds the second Forsaken-Land city, **Moon City** (city-keyed `moon`, gated behind its own `moon-city-passage` flag so a City-of-Silver native and a Moon native are mutually unaware — canon until late) and its High Priest Nim, and re-keys the gray-fog eastern edge from `silver` to `moon` (Moon City is the fog's canon watcher). Upsert (delete-then-insert) of the corrected/added rows from the canonical TS; applied + parity-verified via the Supabase MCP.

25. `20260620181720_seed_loen_kingdom_lore.sql` — Seed the wider Loen Kingdom lore (world build-out 5, issue #134): Awwa County + the city of Constant + added Pritz/Enmat depth (locations), the Loen Relic Search & Preservation Foundation and its Compliance Department, the regional Mandated Punishers (Pritz) / Machinery Hivemind (Constant) / Red Gloves presences (organizations), and the notable NPCs Gawain, Welch McGovern, Pacheco Dwayne, and Barton — 15 entries. Generated from the TS source (`src/lib/lore/{loen,organizations,npcs}.ts` — canonical); same `lore_entries` INSERT format as migration 3. `narratorOnly` is a TS-only prompt flag (no column), intentionally not persisted. Parity (TS ↔ rows: 176 total, 15 new, new `token_count` 3285) verified via the Supabase MCP after apply. All canon corpus-verified.

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

> **Email templates + SMTP are managed in the hosted Dashboard, NOT `config.toml`** (the `[auth.email.template.*]` blocks and `[auth.email.smtp]` are commented out — same pattern as `[auth.sessions]`). Two reasons: (1) Supabase **ignores Auth config on production deploys** ("All other configurations, including API, Auth, and seed files, are ignored by default"), so these never reach prod from `config.toml` anyway — prod's Resend SMTP + templates live in the Dashboard. (2) On a free-tier **branching preview** environment they actively break the branch action: applying a custom template on the default email provider returns HTTP 400 (`MIGRATIONS_FAILED`, unrelated to the SQL migrations), and adding SMTP to satisfy it needs a per-branch secret (`supabase secrets set RESEND_API_KEY=…`) for an ephemeral branch that gains nothing. Preview branches therefore use default email. Re-add the blocks only if branching moves to Pro with a branch SMTP secret.

## Conventions

- Always enable RLS on new tables and write restrictive policies before inserting data.
- Name migrations with a descriptive suffix: `YYYYMMDDHHMMSS_description.sql`.
- Test migrations locally with `supabase db reset` before applying to production.
