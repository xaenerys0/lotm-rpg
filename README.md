# Lord of the Mysteries RPG

A single-player, AI-narrated browser RPG set in the Lord of the Mysteries universe. Your choices create an alternative timeline, grounded in the novel's metaphysical laws.

## Tech Stack

- **Runtime:** Next.js 16 (App Router, TypeScript strict, Turbopack)
- **Database & Auth:** Supabase (Postgres 17, Row Level Security, email/password auth)
- **Styling:** Tailwind CSS v4 (Victorian steampunk dark theme, `@theme inline` tokens)
- **AI:** Provider-agnostic LLM layer (Anthropic, OpenAI, OpenRouter, Ollama) — BYOK
- **Testing:** Vitest 4 with 95% coverage threshold
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

| Command             | Description               |
| ------------------- | ------------------------- |
| `pnpm dev`          | Start development server  |
| `pnpm build`        | Production build          |
| `pnpm lint`         | Run ESLint                |
| `pnpm format`       | Format with Prettier      |
| `pnpm format:check` | Check Prettier formatting |
| `pnpm typecheck`    | TypeScript type check     |
| `pnpm test`         | Run tests (single run)    |
| `pnpm test:watch`   | Run tests (watch mode)    |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login & signup pages (public)
│   ├── (game)/           # Protected game routes (authenticated)
│   └── auth/callback/    # Supabase auth code-exchange handler
├── components/           # React components
│   ├── auth/             # Auth forms (login, signup)
│   └── game/             # Game shell (sidebar navigation)
├── lib/
│   ├── ai/               # Provider-agnostic LLM interface
│   ├── lore/             # Structured lore data (RAG-ready chunks)
│   ├── rules/            # Rules engine (pathways, conservation laws)
│   ├── supabase/         # Supabase client factories
│   └── types/            # TypeScript type definitions
└── proxy.ts              # Middleware — CSP headers + auth session refresh
supabase/
├── config.toml           # Local dev config
├── migrations/           # SQL migrations (RLS-enabled)
└── templates/            # Victorian-themed auth email templates
docs/
├── lotm-lore-summary.md  # LOTM universe reference
└── rules/                # Shared development rule files
```

## Game Features

- **Beyonder Power System:** 4 pathways (Fool, Visionary, Sun, Death) with sequences 9–5
- **Conservation Laws:** Indestructibility, conservation, and convergence enforce lore-accurate mechanics
- **AI Narration:** Tiered prompt architecture — the AI generates narrative while the rules engine handles mechanics
- **BYOK Model:** Players bring their own API keys; keys stay client-side only

## License

Private.
