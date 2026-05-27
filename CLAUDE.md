# LOTM RPG

Lord of the Mysteries browser RPG — Next.js 16 + React 19 + Supabase + Vercel.

## Commands

| Command             | Purpose             |
| ------------------- | ------------------- |
| `pnpm dev`          | Start dev server    |
| `pnpm build`        | Production build    |
| `pnpm lint`         | ESLint              |
| `pnpm format`       | Prettier (write)    |
| `pnpm format:check` | Prettier (check)    |
| `pnpm typecheck`    | TypeScript check    |
| `pnpm test`         | Vitest (single run) |
| `pnpm test:watch`   | Vitest (watch mode) |

## Architecture

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          #   Login, signup (public)
│   ├── (game)/          #   Game pages (authenticated)
│   ├── auth/callback/   #   OAuth code-exchange route handler
│   ├── globals.css      #   Tailwind v4 theme tokens (@theme inline)
│   ├── layout.tsx       #   Root layout — fonts (Geist Sans/Mono, Lora)
│   └── page.tsx         #   Landing page (redirects to /login)
├── components/          # React components
│   ├── auth/            #   Login & signup forms (client components)
│   └── game/            #   Game shell — sidebar navigation
├── lib/
│   ├── ai/              # AI integration — providers, prompts, memory, validation
│   ├── lore/            # Lore database — RAG-ready chunks for AI layer
│   ├── rules/           # Rules engine — pathways, laws, validation
│   ├── supabase/        # Client factories (browser, server, middleware)
│   └── types/           # TypeScript type definitions
└── proxy.ts             # Middleware — CSP headers + auth session refresh
supabase/
├── config.toml          # Local dev config (ports, auth, runtime)
├── migrations/          # SQL migrations (RLS-enabled)
└── templates/           # Auth email HTML templates (Victorian themed)
docs/
├── lotm-lore-summary.md   # LOTM universe reference
├── lotm-research-outline.txt  # Extended research notes
└── rules/                 # Shared rule files (@-imported by scoped CLAUDE.md)
```

## Key Conventions

- **TypeScript strict mode** with path alias `@/*` -> `src/*`.
- **Tailwind CSS v4** with `@theme inline` tokens in `globals.css` — no `tailwind.config` file.
- **Server Components by default**; `"use client"` only when needed.
- **Supabase Auth** with email/password. RLS on all tables — users access only their own data.
- **CSP nonces** generated in `src/proxy.ts` with `'strict-dynamic'`.
- **Prettier**: double quotes, semicolons, trailing commas, 90-char print width. Config in `.prettierrc`.
- **Tests** colocated as `*.test.ts`, run with Vitest 4.x. Coverage enforced on `src/lib/{rules,lore,ai}/**/*.ts` (excluding index files).
- **No component libraries** — pure Tailwind utility classes.
- **PostCSS** via `@tailwindcss/postcss` plugin (config in `postcss.config.mjs`).
- **Typed routes** enabled in `next.config.ts` (`typedRoutes: true`).
- **pnpm** as the package manager. Workspace config in `pnpm-workspace.yaml`.

## Pre-Commit Checklist

Before every commit, verify **all** of the following pass:

1. `pnpm test` — all tests pass.
2. `pnpm vitest run --coverage` — **95% minimum** on statements, branches, functions, and lines. Thresholds are enforced in `vitest.config.mts`; the build fails if coverage drops below 95%. When adding new logic in `src/lib/`, add or update colocated `*.test.ts` files to maintain coverage.
3. `pnpm typecheck` — no TypeScript errors.
4. `pnpm lint` — no ESLint errors or warnings.
5. `pnpm format:check` — all files match Prettier style (run `pnpm format` to fix).
6. **Update scoped CLAUDE.md docs** — if you add, rename, or remove files in a directory that has a `CLAUDE.md`, update that doc to reflect the change. Stale docs mislead future work. Check the list under "Scoped Documentation" below.
7. **Keep database.ts in sync** — when adding Supabase migrations, update `src/lib/types/database.ts` to match the new schema.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (or local `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase publishable key
- `RESEND_API_KEY` — (optional) for direct email via Resend SDK
- `RESEND_FROM_EMAIL` — (optional) sender address

## Scoped Documentation

Each major directory has its own `CLAUDE.md` with context-specific rules:

- `src/app/CLAUDE.md` — routing, middleware, auth flow
- `src/components/CLAUDE.md` — component patterns, styling
- `src/lib/ai/CLAUDE.md` — AI integration, providers, prompts, memory
- `src/lib/lore/CLAUDE.md` — lore database, RAG chunking, query helpers
- `src/lib/rules/CLAUDE.md` — rules engine architecture
- `src/lib/supabase/CLAUDE.md` — client factories, RLS
- `src/lib/types/CLAUDE.md` — type conventions
- `supabase/CLAUDE.md` — database, migrations, templates

Shared rule files in `docs/rules/` are `@`-imported only where relevant:

- `docs/rules/nextjs.md` — Next.js 16 version-awareness
- `docs/rules/security.md` — CSP, RLS, env var safety
- `docs/rules/styling.md` — Tailwind v4 theme tokens and conventions
- `docs/rules/testing.md` — Vitest patterns
