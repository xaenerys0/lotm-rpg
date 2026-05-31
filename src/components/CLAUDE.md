@../../docs/rules/styling.md

# Components

## Organization

- `auth/` — Authentication forms (`login-form.tsx`, `signup-form.tsx`)
- `pwa/` — Progressive Web App helpers (mounted globally in the root layout):
  - `service-worker-registrar.tsx` (`ServiceWorkerRegistrar`) — registers `/sw.js`; renders nothing
  - `install-prompt.tsx` (`InstallPrompt`) — Android install button (via `beforeinstallprompt`) / iOS "Add to Home Screen" hint; self-hides when already installed
- `game/` — Game shell and gameplay components:
  - `game-sidebar.tsx` — Sidebar navigation, sign-out
  - `provider-config.tsx` — AI provider BYOK configuration (provider, API key, models). Model dropdowns prefer a live catalog fetched via `listProviderModels()` (cached in localStorage with a TTL, refreshable, auto-fetched after a successful connection test), falling back to the static `PROVIDER_MODELS` map.
  - `play-dashboard.tsx` — Play page dashboard (new game, continue, character creation)
  - `character-creation.tsx` — Multi-step character creation flow. Two paths: (1) AI-driven prologue: 5 AI-generated scenes where the AI silently tracks Beyonder pathway affinity and ends with a pathway-specific chance encounter; (2) Manual path: direct pathway selection + character sheet. Both paths end with the first-potion narrative scene.
  - `game-loop.tsx` — Core game loop UI (situation/choices/resolution/consequences phases). Status bar shows the sanity and potion-digestion meters; the consequences panel previews the digestion change from the acting evaluation and surfaces a completion event when a potion is fully digested.

## Conventions

- Server Components by default. Only use `"use client"` when the component needs browser APIs, hooks, or event handlers.
- Auth forms are client components — they manage form state and call Supabase Auth methods directly.
- Game sidebar is a client component — uses `usePathname` for active route highlighting and `useState` for mobile toggle.
- Provider config, play dashboard, and game loop are client components — manage localStorage for BYOK keys and session persistence.
- Game loop orchestrates AI calls via `generate()` from `@/lib/ai` and state transitions via `transition()` from `@/lib/game`.
- No component libraries. Build with Tailwind utility classes using the Victorian steampunk theme tokens.
- Forms handle loading state, error display, and success redirects internally.
- Use `useSyncExternalStore` for initial localStorage reads — avoid `setState` inside `useEffect` bodies (React 19 lint rule).
