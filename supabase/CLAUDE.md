@../docs/rules/security.md

# Supabase Configuration

## Local Development

Config: `config.toml` (project ID: `lotm-rpg`, PostgreSQL 17, Deno v2 edge runtime).

Local ports: DB 54322, API 54321, Studio 54323, Inbucket 54324.

Start local stack: `supabase start`. Copy URL + anon key from `supabase status` into `.env.local`.

## Migrations

Migrations live in `migrations/`. Three migrations in order:

1. `20260527002635_init_profiles.sql` — `profiles` table
   - `id` (UUID FK to `auth.users`), `display_name`, `created_at`, `updated_at`
   - RLS: users read/insert/update own rows only
   - Trigger: auto-create profile on signup
   - Trigger: auto-update `updated_at`

2. `20260527111842_create_lore_entries.sql` — `lore_entries` table
   - `id`, `slug`, `title`, `category` (enum), `content`, `pathway`, `epoch`, `city`, `npcs`, `sequences`, `tags`, `token_count`, `embedding` (vector 1536, nullable)
   - RLS: authenticated users can read all entries
   - Unique index on `slug`

3. `20260527113655_seed_lore_entries.sql` — Seed data for lore entries (4 pathways, NPCs, locations, organizations)

## Auth Session Persistence

`config.toml` sets `[auth.sessions].inactivity_timeout = "2160h"` (90 days) for local dev. **The hosted Supabase project must match.** In the Supabase Dashboard:

1. Authentication → Advanced settings
2. Set **Refresh token expiry** to `7776000` (90 days in seconds)

Without this, the hosted project uses the default 7-day refresh token expiry, which logs mobile/PWA users out after a week of inactivity.

Session cookies are set with a 400-day max-age by `@supabase/ssr`, so cookie persistence is not the issue — it is always the server-side refresh token lifetime.

## Auth Email Templates

Custom HTML templates in `templates/`: confirmation, recovery, magic_link, invite, reauthentication, email_change. Victorian-themed to match the game UI.

## Conventions

- Always enable RLS on new tables and write restrictive policies before inserting data.
- Name migrations with a descriptive suffix: `YYYYMMDDHHMMSS_description.sql`.
- Test migrations locally with `supabase db reset` before applying to production.
