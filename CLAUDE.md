@AGENTS.md

# LOTM RPG

Lord of the Mysteries browser RPG — Next.js + Supabase + Vercel.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — run ESLint
- `pnpm format` — format with Prettier
- `pnpm typecheck` — TypeScript check

## Architecture

- `src/app/` — Next.js App Router (route groups: `(auth)`, `(game)`)
- `src/components/` — React components (`auth/`, `ui/`, `game/`)
- `src/lib/supabase/` — Supabase client factories (browser, server, middleware)
- `src/lib/rules/` — Rules engine (pathway definitions, sequence math, conservation laws)
- `src/lib/ai/` — AI integration (provider-agnostic LLM interface)
- `src/lib/types/` — TypeScript type definitions
- `src/middleware.ts` — Auth session refresh + CSP security headers

## Key Conventions

- Tailwind CSS v4 with Victorian steampunk dark theme tokens (see `globals.css`)
- Supabase Auth with email/password; API keys never touch the server
- RLS enabled on all tables — users can only access their own data
- CSP with nonces generated in middleware
