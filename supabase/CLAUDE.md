@../docs/rules/security.md

# Supabase Configuration

## Local Development

Config: `config.toml` (project ID: `lotm-rpg`, PostgreSQL 17, Deno v2 edge runtime).

Local ports: DB 54322, API 54321, Studio 54323, Inbucket 54324.

Start local stack: `supabase start`. Copy URL + anon key from `supabase status` into `.env.local`.

## Migrations

Migrations live in `migrations/`. Current schema:

- `profiles` — `id` (UUID FK to `auth.users`), `display_name`, `created_at`, `updated_at`
  - RLS: users read/insert/update own rows only
  - Trigger: auto-create profile on signup
  - Trigger: auto-update `updated_at`

## Auth Email Templates

Custom HTML templates in `templates/`: confirmation, recovery, magic_link, invite, reauthentication, email_change. Victorian-themed to match the game UI.

## Conventions

- Always enable RLS on new tables and write restrictive policies before inserting data.
- Name migrations with a descriptive suffix: `YYYYMMDDHHMMSS_description.sql`.
- Test migrations locally with `supabase db reset` before applying to production.
