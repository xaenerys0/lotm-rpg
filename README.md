# Lord of the Mysteries RPG

A single-player, AI-narrated browser RPG set in the Lord of the Mysteries universe. Your choices create an alternative timeline, grounded in the novel's metaphysical laws.

## Tech Stack

- **Runtime:** Next.js 16 (App Router, React 19, TypeScript strict, Turbopack)
- **Database & Auth:** Supabase (Postgres 17, Row Level Security, email/password auth)
- **Styling:** Tailwind CSS v4 (Victorian steampunk dark theme, `@theme inline` tokens — no config file)
- **AI:** Provider-agnostic LLM layer (Anthropic, OpenAI, OpenRouter, Ollama, Ollama Cloud, Custom) — BYOK
- **Retrieval:** Local-only RAG over the novel + wiki (CPU embeddings, pgvector)
- **Testing:** Vitest 4 with a 95% coverage threshold
- **PWA:** Installable on Android & iOS (manifest + minimal service worker)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase project URL and anon key

# (Optional) Start local Supabase
supabase start
# Copy URL + anon key from `supabase status` into .env.local

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm dev`          | Start development server     |
| `pnpm build`        | Production build             |
| `pnpm lint`         | Run ESLint                   |
| `pnpm format`       | Format with Prettier         |
| `pnpm format:check` | Check Prettier formatting    |
| `pnpm typecheck`    | TypeScript type check        |
| `pnpm test`         | Run tests (single run)       |
| `pnpm test:watch`   | Run tests (watch mode)       |
| `pnpm rag:novel`    | Parse the novel into chunks  |
| `pnpm rag:wiki`     | Parse wiki pages into chunks |
| `pnpm rag:chunk`    | RAG chunk stage              |
| `pnpm rag:embed`    | RAG embed stage (CPU)        |
| `pnpm rag:load`     | Load embedded chunks to DB   |
| `pnpm rag:eval`     | RAG retrieval eval harness   |

Run a single test file with `pnpm vitest run <path>`, filter to one test with `-t "<name>"`, and check coverage with `pnpm vitest run --coverage`.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login & signup pages (public)
│   ├── (game)/           # Protected game routes (authenticated)
│   └── auth/callback/    # Supabase auth code-exchange handler
├── components/           # React components
│   ├── auth/             # Auth forms (login, signup)
│   ├── game/             # Game shell, dashboard, game loop, panels
│   └── pwa/              # Service worker registrar + install prompt
├── lib/
│   ├── ai/               # Provider-agnostic LLM interface + prompt assembly
│   ├── game/             # Pure game-loop engine (state machine, sessions)
│   ├── lore/             # Curated narrator-only lore (RAG-ready chunks)
│   ├── rag/              # RAG ingestion core (JSONL chunk format, chunker)
│   ├── rules/            # Rules engine (pathways, sequences, laws)
│   ├── supabase/         # Supabase client factories (browser/server/middleware)
│   └── types/            # TypeScript type definitions
└── proxy.ts              # Middleware — CSP nonce headers + auth session refresh
scripts/rag/              # RAG pipeline stage drivers (dev-only, tsx)
supabase/
├── config.toml           # Local dev config
├── migrations/           # SQL migrations (RLS-enabled)
└── templates/            # Victorian-themed auth email templates
docs/
├── lotm-lore-summary.md  # LOTM universe reference
└── rules/                # Shared development rule files (@-imported by CLAUDE.md)
```

Most directories carry their own `CLAUDE.md` with context-specific architecture notes; start there when working in an area.

## Game Features

- **Beyonder Power System:** 9 playable pathways (Fool, Visionary, Sun, Death, Darkness, Tyrant, Door, Error, Hanged Man) advancing from Sequence 9 up to the Sequence 0 True God endgame.
- **Acting Method & Sanity:** potions digest only through in-character roleplay; a hidden sanity meter drives progressively unreliable narration toward loss of control.
- **Rules Engine:** pathway laws and conservation rules enforce lore-accurate mechanics — the AI narrates, the engine adjudicates.
- **RAG-grounded Narration:** a tiered prompt architecture retrieves source-material passages (novel + wiki) as narrator-only reference, never leaked to the character.
- **Consequence Systems:** permadeath with cross-character legacies and cross-timeline echoes, hybrid combat, a story journal, layered identities, secret societies, a player marketplace, and public leaderboards.
- **BYOK Model:** players bring their own API keys; keys stay client-side only and call the provider browser-direct.

## License

Private.
