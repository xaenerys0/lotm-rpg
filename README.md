# Lord of the Mysteries RPG

A single-player, AI-narrated browser RPG set in the _Lord of the Mysteries_
universe. The player climbs a Beyonder pathway from Sequence 9 toward godhood;
their choices spin out an **alternative timeline** that stays grounded in the
novel's metaphysical laws. The AI **narrates**, a deterministic **rules engine
adjudicates**, and a curated + retrieved **lore layer** keeps both honest to canon.

> This README is the orientation guide for **human developers**. Each major
> directory also carries its own `CLAUDE.md` with deep, context-specific notes —
> when you start working in an area, read that file first (see
> [Scoped documentation](#scoped-documentation)).

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
  - [Pre-commit checklist](#pre-commit-checklist)
  - [Testing & coverage](#testing--coverage)
  - [Database & migrations (Supabase)](#database--migrations-supabase)
  - [Lore & the RAG corpus](#lore--the-rag-corpus)
- [Key conventions](#key-conventions)
- [Environment variables](#environment-variables)
- [Scoped documentation](#scoped-documentation)
- [Game features](#game-features)
- [License](#license)

---

## Tech stack

| Area            | Choice                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, React 19, Turbopack)                                                              |
| Language        | **TypeScript** (strict mode, `@/*` → `src/*` path alias, typed routes)                                        |
| Database & auth | **Supabase** (Postgres 17, Row-Level Security on every table, email/password auth)                            |
| Styling         | **Tailwind CSS v4** — `@theme inline` tokens in `globals.css`, **no `tailwind.config`**; Victorian dark theme |
| AI              | Provider-agnostic LLM layer (Anthropic, OpenAI, OpenRouter, Ollama, Ollama Cloud, Custom) — **BYOK**          |
| Retrieval       | Local-only **RAG** over the novel + wiki (1024-dim CPU embeddings, pgvector, gated RPC)                       |
| Testing         | **Vitest 4** (unit + jsdom/axe-core a11y) with a **95% coverage gate**; **Playwright** for real-browser UI    |
| PWA             | Installable (Android/iOS) via manifest + minimal service worker                                               |
| Deployment      | **Vercel**                                                                                                    |

Package manager is **pnpm**; you need **Node.js 20.9+**.

---

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Environment
cp .env.example .env.local
#    Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

# 3. (Recommended) Local Supabase stack
supabase start                 # requires the Supabase CLI + Docker
#    Copy the API URL + publishable (anon) key from `supabase status` into .env.local.

# 4. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). To play, you'll also need an
LLM provider key — the app is **BYOK**: enter your key in Settings; it is stored
**client-side only** (localStorage) and calls the provider browser-direct, never
through our backend.

> The game corpus (`corpus/`) is **Git LFS** (novel EPUB + wiki XML). You don't
> need it to run the app, but RAG ingestion and lore fact-checking do — run
> `git lfs install && git lfs pull` to materialize the real files (otherwise they
> are ~130-byte pointer stubs).

---

## Scripts

| Command                      | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `pnpm dev`                   | Start the dev server (Turbopack)                   |
| `pnpm build`                 | Production build                                   |
| `pnpm start`                 | Serve the production build                         |
| `pnpm lint`                  | ESLint (must be warning-free)                      |
| `pnpm format`                | Prettier (write)                                   |
| `pnpm format:check`          | Prettier (check only — what CI runs)               |
| `pnpm typecheck`             | `tsc --noEmit`                                     |
| `pnpm test`                  | Vitest (single run)                                |
| `pnpm test:watch`            | Vitest (watch mode)                                |
| `pnpm test:e2e`              | Playwright UI/responsiveness tests                 |
| `pnpm test:e2e:ui`           | Playwright UI mode                                 |
| `pnpm rag:novel`             | Parse the novel EPUB into raw chunks               |
| `pnpm rag:wiki`              | Parse the wiki XML dump into raw chunks            |
| `pnpm rag:chunk`             | Normalize/segment into the JSONL chunk format      |
| `pnpm rag:embed`             | Embed chunks (CPU)                                 |
| `pnpm rag:load`              | Load embedded chunks into Supabase (operator-only) |
| `pnpm rag:eval`              | RAG retrieval eval harness                         |
| `pnpm rag:advancement-canon` | Extract canon advancement data from the corpus     |

Helpful invocations:

- **One test file:** `pnpm vitest run src/lib/game/character-admin.test.ts`
- **One test by name:** add `-t "<substring>"`
- **Coverage:** `pnpm vitest run --coverage` (this is the 95% gate)

---

## Architecture

The core design rule: **the AI never owns mechanics.** Narrative voice and soft
detail come from the LLM; every hard outcome (sequence advancement, sanity,
combat math, inventory, money, movement) is decided by pure, deterministic
TypeScript and only _described_ by the AI. This keeps runs lore-accurate,
testable, and reproducible.

```
            ┌─────────────────────────────────────────────────────────┐
            │  React UI  (src/components/game, src/app/(game))          │
            │  renders state, collects the player's action              │
            └───────────────┬─────────────────────────┬───────────────┘
                            │                          │
                  player action               narrated result
                            │                          ▲
                            ▼                          │
   ┌───────────────────────────────┐      ┌────────────────────────────┐
   │  Game loop  (src/lib/game)     │      │  AI layer  (src/lib/ai)     │
   │  pure state machine: phases,   │◀────▶│  provider-agnostic generate │
   │  world-state mutation, combat, │      │  tiered prompt assembly,    │
   │  advancement, sanity, sessions │      │  validation, memory         │
   └───────────────┬───────────────┘      └─────────────┬──────────────┘
                   │                                     │
        adjudicates against                      grounded by
                   ▼                                     ▼
   ┌───────────────────────────────┐      ┌────────────────────────────┐
   │  Rules engine (src/lib/rules)  │      │  Lore + RAG                 │
   │  pathways, sequences, laws,    │      │  src/lib/lore  (curated)    │
   │  conservation/validation       │      │  src/lib/rag   (corpus)     │
   └───────────────────────────────┘      └────────────────────────────┘
                   │                                     │
                   └──────────────► Supabase ◀───────────┘
                       (auth, saves, journal, market, gated corpus RPC)
```

- **`src/lib/rules`** — the source of mechanical truth: the 22 canon pathways,
  their Sequence 9→0 ladders, abilities, and the "laws" that validate outcomes.
- **`src/lib/game`** — a pure, side-effect-free state machine (`transition()`),
  plus world-state mutation, combat, advancement/apotheosis, sanity, hunts,
  journal, identities, and session (de)serialization. Persistence and AI calls
  live in the React layer; everything here is unit-testable.
- **`src/lib/ai`** — a provider-agnostic `generate()` with layered prompt
  assembly (system → epoch → lore → game-state → history → instruction), output
  parsing/validation, and tiered memory. BYOK, browser-direct, stateless calls.
- **`src/lib/lore`** — curated, hand-authored lore entries (locations, orgs,
  NPCs, pathways, epochs) injected as **narrator-only** guardrails. TypeScript is
  the canonical source; the SQL seed is generated from it.
- **`src/lib/rag`** — ingestion core for the source material (novel + wiki) into
  gated `source_chunks`, retrieved per-turn as additional narrator-only context.

---

## Project structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           #   Login & signup (public)
│   ├── (game)/           #   Game pages (authenticated)
│   ├── auth/callback/    #   Supabase OAuth code-exchange route handler
│   ├── globals.css       #   Tailwind v4 theme tokens (@theme inline)
│   └── layout.tsx        #   Root layout (fonts, PWA, skip link)
├── components/
│   ├── auth/             #   Login & signup forms (client)
│   ├── game/             #   Game shell, dashboard, game loop, panels
│   └── pwa/              #   Service-worker registrar + install prompt
├── lib/
│   ├── ai/               # Provider-agnostic LLM interface + prompt assembly
│   ├── game/             # Pure game-loop engine (state machine, sessions, combat…)
│   ├── lore/             # Curated narrator-only lore (TS-canonical, RAG-ready)
│   ├── rag/              # RAG ingestion core (JSONL chunk format, shared chunker)
│   ├── react/            # Shared React utilities (active-character session store)
│   ├── rules/            # Rules engine (pathways, sequences, laws, validation)
│   ├── supabase/         # Client factories (browser / server / middleware)
│   └── types/            # TypeScript type definitions (incl. generated database.ts)
└── proxy.ts              # Middleware — CSP nonce headers + auth session refresh
scripts/rag/              # RAG pipeline stage drivers (dev-only, tsx)
supabase/
├── config.toml           # Local dev config (ports, auth, runtime)
├── migrations/           # SQL migrations (RLS-enabled; lore seeds generated from TS)
└── templates/            # Victorian-themed auth email templates
docs/
├── rules/                # Shared rule files (@-imported by scoped CLAUDE.md)
├── lotm-lore-summary.md  # LOTM universe reference (convenience, not authoritative)
├── rag-ingestion.md      # RAG corpus ingestion runbook
└── …                     # anchors-design, rag-per-turn-budget, scene-art-testing, …
corpus/                   # Canon source material (Git LFS: novel EPUB + wiki XML)
e2e/                      # Playwright UI tests (real-browser responsiveness)
```

---

## Development workflow

### Pre-commit checklist

Run **all** of these before every commit; CI enforces them and the build fails
if any is red:

1. `pnpm test` — all tests pass.
2. `pnpm vitest run --coverage` — **≥ 95%** on statements, branches, functions,
   and lines (enforced in `vitest.config.mts`).
3. `pnpm typecheck` — no TypeScript errors.
4. `pnpm lint` — no ESLint errors or warnings.
5. `pnpm format:check` — matches Prettier (`pnpm format` to fix).
6. **Update scoped `CLAUDE.md`** if you add/rename/remove files in a directory
   that has one — stale docs mislead the next developer (and the AI agents).
7. **Keep `src/lib/types/database.ts` in sync** when you add a Supabase migration
   that changes schema.
8. **Accessibility (WCAG 2.2 AA)** for any frontend change — follow
   `docs/rules/accessibility.md` and keep `src/test/a11y.test.tsx` (axe-core)
   passing; add a case for new screens/interactive components.

### Testing & coverage

- **Unit / logic** — Vitest, colocated as `*.test.ts`. Prefer pure-function
  tests; `src/lib/rules/rules.test.ts` and `src/lib/lore/lore.test.ts` are the
  reference patterns.
- **Coverage gate** — the 95% threshold applies to
  `src/lib/{rules,lore,ai,game,rag}/**/*.ts` (index files excluded). When you add
  logic under `src/lib`, add/extend its colocated test. UI/networking shells that
  live outside that scope are deliberately not under the gate.
- **Accessibility** — `src/test/a11y.test.tsx` renders key screens through
  axe-core (jsdom). jsdom can't measure colour/layout, so verify contrast against
  the theme tokens and a real browser too.
- **Real-browser UI** — Playwright tests in `e2e/` catch layout/responsiveness
  regressions jsdom can't. The public tier needs no backend; the authenticated
  game-page tier runs only when `E2E_SUPABASE_URL` is set. Not part of the Vitest
  run or the coverage gate — see [`e2e/README.md`](e2e/README.md).

### Database & migrations (Supabase)

- Migrations live in `supabase/migrations/` (`YYYYMMDDHHMMSS_description.sql`),
  one per logical change, **RLS enabled with restrictive policies before any data
  is inserted**. `supabase/CLAUDE.md` documents every migration in order.
- **Lore seed migrations are generated from the TypeScript source** in
  `src/lib/lore` — TS is canonical, the SQL is derived, and TS ↔ row parity is
  verified after applying.
- **Keep local files aligned with the remote migration history.** When a
  migration is applied through tooling that assigns its own version timestamp,
  name the local file to that **remote-recorded version** so
  `supabase/migrations/` exactly matches the deployed history. Verify with the
  remote migration list before merging.
- When a migration changes schema, regenerate/update `src/lib/types/database.ts`.

### Lore & the RAG corpus

- **Canon is verified against `corpus/`, never memory.** Before authoring or
  editing any lore (NPCs, orgs, locations, pathways, relationships, events),
  fact-check against `corpus/wiki/lordofthemystery_pages_current.xml` (and the
  novel EPUB). The corpus is the authority; `docs/lotm-lore-summary.md` is a
  convenience summary that can be wrong. See the root `CLAUDE.md` "Canon & Source
  Material" section.
- **Leak control / spoiler gating** is a first-class concern. Curated lore is
  injected as `narratorOnly` reference and gated by **epoch** (era isolation),
  **city** (only injected when the character is there), **pathway**, and
  **sequence/concealment** (progressive spoiler disclosure). Deep secrets carry
  no city/pathway key so they are never auto-injected. Follow the patterns in
  `src/lib/lore/CLAUDE.md` so spoilers never reach a character who shouldn't have
  them.
- **RAG pipeline** (operator/dev): `rag:novel` / `rag:wiki` → `rag:chunk` →
  `rag:embed` → `rag:load`, evaluated with `rag:eval`. See `docs/rag-ingestion.md`.
  The corpus tables deny direct client access; gameplay reads them only through
  the timeline/epoch/concealment-gated `match_source_chunks` RPC.

---

## Key conventions

- **TypeScript strict** everywhere; import via the `@/*` alias, not deep relative
  paths. Typed routes are on (`typedRoutes` in `next.config.ts`).
- **Server Components by default** — add `"use client"` only when you need
  browser APIs, hooks, or event handlers.
- **Tailwind v4, tokens only** — style with the theme tokens in `globals.css`
  (`text-foreground`, `bg-surface`, accent/semantic tokens). No component
  libraries; no `tailwind.config` file. See `docs/rules/styling.md`.
- **Accessibility is required** (WCAG 2.2 AA) — accessible names, ARIA state,
  `role="status"`/`alert`, no meaningful low-opacity text, ≥24px targets. See
  `docs/rules/accessibility.md`.
- **Supabase RLS on every table**; users access only their own rows. Never use the
  service-role key in client code. See `src/lib/supabase/CLAUDE.md` and
  `docs/rules/security.md`.
- **CSP with nonces** is generated in `src/proxy.ts` (`'strict-dynamic'`). When
  you add an external origin, update the policy there — don't weaken it with
  blanket `'unsafe-inline'`.
- **BYOK boundary** — API keys live only in the browser (localStorage) and are
  never synced or logged. Don't add code paths that send a key to our backend.
- **Prettier**: double quotes, semicolons, trailing commas, 90-char width
  (`.prettierrc`).
- **Active character is a single shared pointer** (`src/lib/react/session-store`)
  — every page reads/writes the same active save; don't reintroduce per-component
  selection.
- **The AI adjudicates nothing** — if a change lets the model decide a mechanical
  outcome (sequence, sanity, inventory, money, cross-map movement), move that
  decision into the rules/game engine instead.

---

## Environment variables

Copy `.env.example` → `.env.local` (gitignored). Only the first two are required
to run the app; the rest are optional/operator-side. `NEXT_PUBLIC_*` vars reach
the browser, so **never** put secrets in them.

| Variable                                     | Required | Purpose                                                         |
| -------------------------------------------- | -------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                   | ✅       | Supabase API URL (local: `http://127.0.0.1:54321`)              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`              | ✅       | Supabase publishable (anon) key                                 |
| `NEXT_PUBLIC_CLOUDFLARE_EMBEDDING`           |          | Turn on the hosted Cloudflare Workers AI embed fallback for RAG |
| `CF_ACCOUNT_ID` / `CF_API_TOKEN`             |          | Server-only Cloudflare creds for the embed proxy (+ rag CI)     |
| `NEXT_PUBLIC_OPERATOR_EMBEDDING_URL`         |          | Alternative self-hosted Ollama embed endpoint                   |
| `EMBED_RATE_LIMIT_MAX` / `…_WINDOW_SECONDS`  |          | Per-user rate limit for the operator-funded embed proxy         |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL`       |          | Direct transactional email via the Resend SDK (optional)        |
| `NEXT_PUBLIC_DEV_TOOLS`                      |          | Unlock dev-only tools (`/dev/scene-art`, "Seed test character") |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` |          | Operator-only, for `pnpm rag:load`. Never ship to the browser.  |

AI provider keys are **not** environment variables — they're entered in-app and
stored client-side (BYOK).

---

## Scoped documentation

Architecture lives next to the code. Read the relevant `CLAUDE.md` before working
in an area; they're kept current as part of the pre-commit checklist.

| Path                         | Covers                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `CLAUDE.md` (root)           | Commands, architecture map, canon rules, pre-commit checklist |
| `src/app/CLAUDE.md`          | Routing, middleware, auth flow                                |
| `src/components/CLAUDE.md`   | Component patterns, styling, accessibility                    |
| `src/lib/ai/CLAUDE.md`       | Providers, prompt assembly, memory, validation                |
| `src/lib/game/CLAUDE.md`     | Game-loop engine, state machine, sessions, combat             |
| `src/lib/lore/CLAUDE.md`     | Lore database, gating/leak-control, RAG chunking              |
| `src/lib/rag/CLAUDE.md`      | RAG ingestion core, JSONL chunk format, stage contract        |
| `src/lib/rules/CLAUDE.md`    | Rules-engine architecture                                     |
| `src/lib/supabase/CLAUDE.md` | Client factories, RLS                                         |
| `src/lib/types/CLAUDE.md`    | Type conventions, `database.ts`                               |
| `scripts/rag/CLAUDE.md`      | RAG pipeline stage drivers                                    |
| `supabase/CLAUDE.md`         | Database schema, migrations (in order), auth/email config     |

Shared rule files in `docs/rules/` (`nextjs.md`, `security.md`, `styling.md`,
`accessibility.md`, `testing.md`) are `@`-imported by the scoped docs where they
apply.

---

## Game features

- **Beyonder power system** — **22 playable pathways** (Fool, Visionary, Sun,
  Death, Darkness, Tyrant, Door, Error, Hanged Man, White Tower, Twilight Giant,
  Justiciar, Black Emperor, Red Priest, Demoness, Mother, Moon, Hermit, Paragon,
  Wheel of Fortune, Abyss, Chained), each advancing Sequence 9 → the Sequence 0
  True God endgame (and the Pillar tier beyond it).
- **Acting Method & hidden sanity** — potions digest only through in-character
  roleplay; a hidden sanity meter drives progressively unreliable narration
  toward loss of control. Both are secret knowledge the player earns through play.
- **Rules engine** — pathway laws and conservation rules enforce lore-accurate
  mechanics: the AI narrates, the engine adjudicates.
- **RAG-grounded narration** — a tiered prompt architecture injects curated
  guardrail lore and retrieves source-material passages as **narrator-only**
  reference, gated by epoch/sequence/concealment so spoilers never leak to the
  character.
- **A built-out world** — five epochs and a multi-continent setting (the Northern
  Continent's nations, the colonized Southern Continent, the sealed Forsaken
  Land), with cities, organizations, the orthodox churches, the great Angel
  Families, and secret societies — each spoiler-gated.
- **Consequence systems** — permadeath with cross-character legacies and
  cross-timeline echoes, hybrid combat, a story journal, layered identities, a
  player marketplace, public leaderboards, and start-archetypes that embed a new
  character in an existing social circle.
- **BYOK** — players bring their own LLM API key; it stays client-side and calls
  the provider browser-direct.

---

## License

Private.
