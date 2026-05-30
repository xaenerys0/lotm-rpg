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

Two settings in `config.toml` control login persistence. **Both must also be set in the hosted Supabase project.** In the Supabase Dashboard → Authentication → Advanced settings:

| Setting                  | config.toml                                    | Dashboard value   |
| ------------------------ | ---------------------------------------------- | ----------------- |
| JWT expiry               | `jwt_expiry = 604800`                          | 604800 (7 days)   |
| Refresh token inactivity | `[auth.sessions] inactivity_timeout = "2160h"` | 7776000 (90 days) |

**Why both are needed:**

- `jwt_expiry`: The JWT in the cookie lasts 7 days. A cold PWA start (e.g. user opens the app the next morning) will have a valid JWT without needing a server refresh call.
- `inactivity_timeout`: The refresh token (server-side) stays valid for 90 days of inactivity. Users who play once a month won't be logged out.
- The middleware also calls `getSession()` before `getUser()` to explicitly refresh an expired JWT using the stored refresh token before validating server-side.

Session cookies are set with a 400-day max-age by `@supabase/ssr`, so cookie persistence is never the issue — it is always the server-side token lifetimes.

## Auth Email Templates

Custom HTML templates in `templates/`: confirmation, recovery, magic_link, invite, reauthentication, email_change. Victorian-themed to match the game UI.

## Conventions

- Always enable RLS on new tables and write restrictive policies before inserting data.
- Name migrations with a descriptive suffix: `YYYYMMDDHHMMSS_description.sql`.
- Test migrations locally with `supabase db reset` before applying to production.
