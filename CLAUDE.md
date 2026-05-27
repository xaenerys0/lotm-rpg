# LOTM RPG

Lord of the Mysteries browser RPG — Next.js 16 + React 19 + Supabase + Vercel.

## Commands

| Command             | Purpose              |
|---------------------|----------------------|
| `pnpm dev`          | Start dev server     |
| `pnpm build`        | Production build     |
| `pnpm lint`         | ESLint               |
| `pnpm format`       | Prettier (write)     |
| `pnpm format:check` | Prettier (check)     |
| `pnpm typecheck`    | TypeScript check     |
| `pnpm test`         | Vitest (single run)  |
| `pnpm test:watch`   | Vitest (watch mode)  |

## Architecture

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          #   Login, signup (public)
│   ├── (game)/          #   Game pages (authenticated)
│   └── auth/callback/   #   OAuth code-exchange handler
├── components/          # React components (auth/, ui/, game/)
├── lib/
│   ├── rules/           # Rules engine — pathways, laws, validation
│   ├── supabase/        # Client factories (browser, server, middleware)
│   ├── types/           # TypeScript type definitions
│   └── ai/              # AI integration (planned)
├── proxy.ts             # Middleware — CSP headers + auth session refresh
└── app/globals.css      # Tailwind v4 theme tokens
supabase/
├── config.toml          # Local dev config (ports, auth, runtime)
├── migrations/          # SQL migrations (RLS-enabled)
└── templates/           # Auth email HTML templates
docs/
├── lotm-lore-summary.md # LOTM universe reference
└── rules/               # Shared rule files (@-imported by scoped CLAUDE.md)
```

## Key Conventions

- **TypeScript strict mode** with path alias `@/*` -> `src/*`.
- **Tailwind CSS v4** with `@theme inline` tokens in `globals.css` — no `tailwind.config` file.
- **Server Components by default**; `"use client"` only when needed.
- **Supabase Auth** with email/password. RLS on all tables — users access only their own data.
- **CSP nonces** generated in `src/proxy.ts` with `'strict-dynamic'`.
- **Prettier**: double quotes, semicolons, trailing commas, 90-char width.
- **Tests** colocated as `*.test.ts`, run with Vitest.
- **No component libraries** — pure Tailwind utility classes.

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
- `src/lib/rules/CLAUDE.md` — rules engine architecture
- `src/lib/supabase/CLAUDE.md` — client factories, RLS
- `src/lib/types/CLAUDE.md` — type conventions
- `supabase/CLAUDE.md` — database, migrations, templates

Shared rule files in `docs/rules/` are `@`-imported only where relevant:
- `docs/rules/nextjs.md` — Next.js 16 version-awareness
- `docs/rules/security.md` — CSP, RLS, env var safety
- `docs/rules/styling.md` — Tailwind v4 theme tokens and conventions
- `docs/rules/testing.md` — Vitest patterns
