# Lord of the Mysteries RPG

A single-player, AI-narrated browser RPG set in the Lord of the Mysteries universe. Your choices create an alternative timeline, grounded in the novel's metaphysical laws.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Database & Auth:** Supabase (Postgres, Row Level Security, email/password auth)
- **Styling:** Tailwind CSS v4 (Victorian steampunk dark theme)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase project URL and anon key

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | TypeScript type check |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login & signup pages
│   ├── (game)/           # Protected game routes
│   └── auth/callback/    # Supabase auth callback
├── components/           # React components
│   ├── auth/             # Auth forms
│   ├── ui/               # Shared UI primitives
│   └── game/             # Game-specific components
├── lib/
│   ├── supabase/         # Supabase client factories
│   ├── rules/            # Rules engine (pathways, sequences, conservation laws)
│   ├── ai/               # Provider-agnostic LLM interface
│   └── types/            # TypeScript type definitions
└── middleware.ts          # Auth session refresh + CSP headers
```
