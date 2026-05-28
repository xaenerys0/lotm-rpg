@../../docs/rules/styling.md

# Components

## Organization

- `auth/` — Authentication forms (`login-form.tsx`, `signup-form.tsx`)
- `game/` — Game shell and gameplay components:
  - `game-sidebar.tsx` — Sidebar navigation, sign-out
  - `provider-config.tsx` — AI provider BYOK configuration (provider, API key, models)
  - `play-dashboard.tsx` — Play page dashboard (new game, continue, pathway selection)
  - `game-loop.tsx` — Core game loop UI (situation/choices/resolution/consequences phases)

## Conventions

- Server Components by default. Only use `"use client"` when the component needs browser APIs, hooks, or event handlers.
- Auth forms are client components — they manage form state and call Supabase Auth methods directly.
- Game sidebar is a client component — uses `usePathname` for active route highlighting and `useState` for mobile toggle.
- Provider config, play dashboard, and game loop are client components — manage localStorage for BYOK keys and session persistence.
- Game loop orchestrates AI calls via `generate()` from `@/lib/ai` and state transitions via `transition()` from `@/lib/game`.
- No component libraries. Build with Tailwind utility classes using the Victorian steampunk theme tokens.
- Forms handle loading state, error display, and success redirects internally.
- Use `useSyncExternalStore` for initial localStorage reads — avoid `setState` inside `useEffect` bodies (React 19 lint rule).
