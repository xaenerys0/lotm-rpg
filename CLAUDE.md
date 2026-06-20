# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# LOTM RPG

Lord of the Mysteries browser RPG — Next.js 16 + React 19 + Supabase + Vercel.

## Commands

| Command             | Purpose              |
| ------------------- | -------------------- |
| `pnpm dev`          | Start dev server     |
| `pnpm build`        | Production build     |
| `pnpm lint`         | ESLint               |
| `pnpm format`       | Prettier (write)     |
| `pnpm format:check` | Prettier (check)     |
| `pnpm typecheck`    | TypeScript check     |
| `pnpm test`         | Vitest (single run)  |
| `pnpm test:watch`   | Vitest (watch mode)  |
| `pnpm test:e2e`     | Playwright UI tests  |
| `pnpm test:e2e:ui`  | Playwright (UI mode) |
| `pnpm rag:chunk`    | RAG chunk stage CLI  |
| `pnpm rag:embed`    | RAG embed stage CLI  |
| `pnpm rag:novel`    | RAG novel parse CLI  |
| `pnpm rag:wiki`     | RAG wiki parse CLI   |
| `pnpm rag:eval`     | RAG eval harness     |
| `pnpm rag:load`     | RAG load stage CLI   |

Run a **single test file** with `pnpm vitest run <path>` (e.g. `pnpm vitest run src/lib/game/character-admin.test.ts`); filter to **one test by name** with `-t "<substring>"`. Check coverage with `pnpm vitest run --coverage` (the 95% gate that the pre-commit checklist enforces).

**Playwright UI tests** live in `e2e/` (real-browser layout/responsiveness checks jsdom can't do — see `e2e/README.md`). The public tier runs with no backend; the authenticated game-page tier runs only when `E2E_SUPABASE_URL` is set. Not part of the Vitest run or the coverage gate.

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
│   └── game/            #   Game shell, provider config, game loop UI
├── lib/
│   ├── ai/              # AI integration — providers, prompts, memory, validation
│   ├── game/            # Game loop engine — state machine, world state, sessions
│   ├── lore/            # Lore database — RAG-ready chunks for AI layer
│   ├── rag/             # RAG ingestion core — JSONL chunk format + shared chunker
│   ├── react/           # React utilities: noopSubscribe + session-store (the shared active-character pointer + reactive hooks)
│   ├── rules/           # Rules engine — pathways, laws, validation
│   ├── supabase/        # Client factories (browser, server, middleware)
│   └── types/           # TypeScript type definitions
└── proxy.ts             # Middleware — CSP headers + auth session refresh
scripts/
└── rag/                 # RAG pipeline stage drivers (chunk stage CLI; dev-only, tsx)
supabase/
├── config.toml          # Local dev config (ports, auth, runtime)
├── migrations/          # SQL migrations (RLS-enabled)
└── templates/           # Auth email HTML templates (Victorian themed)
docs/
├── lotm-lore-summary.md   # LOTM universe reference
├── lotm-research-outline.txt  # Extended research notes
├── rag-per-turn-budget.md # RAG latency/token/operator-cost budget (issue #64)
├── rag-ingestion.md       # RAG corpus ingestion runbook (novel + wiki → source_chunks)
├── anchors-design.md      # Anchors system design (issue #35) — canon + data model
└── rules/                 # Shared rule files (@-imported by scoped CLAUDE.md)
e2e/                       # Playwright UI tests (real-browser responsiveness) — see e2e/README.md
corpus/                     # Canon source material, committed via Git LFS (novel EPUB + wiki XML dump). The grounding for RAG ingestion and the canon advancement data — see docs/rag-ingestion.md
```

## Canon & Source Material (READ BEFORE AUTHORING LORE)

The game's canon is **Lord of the Mysteries**, and the authoritative source lives in `corpus/`:

- `corpus/wiki/lordofthemystery_pages_current.xml` — the full LOTM wiki dump (MediaWiki XML; `<page><title>…</title>…<text>…</text></page>`). The primary fact-check reference.
- `corpus/novel/LordofMysteriesCuttlefishTha1.EPUB` — the novel text.

**Rules:**

1. **Never assume or invent canon from memory.** When authoring or reviewing lore (NPCs, organizations, locations, pathways, relationships, affiliations, events), VERIFY every factual claim against `corpus/` first. Memory of LOTM is unreliable and has produced wrong affiliations/relationships before.
2. **The corpus is Git LFS.** If a `corpus/` file is a ~130-byte LFS pointer (`version https://git-lfs.github.com/spec/v1`), install and pull it before reading: `git lfs install && git lfs pull`. (`git-lfs` installs via `apt-get install -y git-lfs`.) Do this proactively — do not skip a canon check because the file "looks" empty.
3. **The corpus outranks an issue's parenthetical.** If a task description's canon hint conflicts with the corpus, the corpus wins — fix the content to the corpus and flag the discrepancy to the user.
4. `docs/lotm-lore-summary.md` and `docs/lotm-research-outline.txt` are convenience summaries, not authoritative — they can be incomplete or wrong; confirm against `corpus/`.

## Key Conventions

- **TypeScript strict mode** with path alias `@/*` -> `src/*`.
- **Tailwind CSS v4** with `@theme inline` tokens in `globals.css` — no `tailwind.config` file.
- **Server Components by default**; `"use client"` only when needed.
- **Supabase Auth** with email/password. RLS on all tables — users access only their own data.
- **CSP nonces** generated in `src/proxy.ts` with `'strict-dynamic'`.
- **Prettier**: double quotes, semicolons, trailing commas, 90-char print width. Config in `.prettierrc`.
- **Tests** colocated as `*.test.ts`, run with Vitest 4.x. Coverage enforced on `src/lib/{rules,lore,ai,game,rag}/**/*.ts` (excluding index files).
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
8. **Accessibility (WCAG 2.2 AA)** — when adding or changing frontend code, follow `docs/rules/accessibility.md` and keep `src/test/a11y.test.tsx` (axe-core) passing; extend it for new screens/interactive components.

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
- `src/lib/game/CLAUDE.md` — game loop engine, state machine, sessions
- `src/lib/lore/CLAUDE.md` — lore database, RAG chunking, query helpers
- `src/lib/rag/CLAUDE.md` — RAG ingestion core: JSONL chunk format, stage contract, shared chunker
- `src/lib/rules/CLAUDE.md` — rules engine architecture
- `src/lib/supabase/CLAUDE.md` — client factories, RLS
- `src/lib/types/CLAUDE.md` — type conventions
- `scripts/rag/CLAUDE.md` — RAG pipeline stage drivers (chunk stage CLI)
- `supabase/CLAUDE.md` — database, migrations, templates

Shared rule files in `docs/rules/` are `@`-imported only where relevant:

- `docs/rules/nextjs.md` — Next.js 16 version-awareness
- `docs/rules/security.md` — CSP, RLS, env var safety
- `docs/rules/styling.md` — Tailwind v4 theme tokens and conventions
- `docs/rules/accessibility.md` — WCAG 2.2 AA requirements for frontend code
- `docs/rules/testing.md` — Vitest patterns
