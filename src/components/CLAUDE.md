@../../docs/rules/styling.md
@../../docs/rules/accessibility.md

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
  - `character-creation.tsx` — Multi-step character creation flow. Two paths: (1) AI-driven prologue: AI-generated scenes that each offer four affinity-tagged choices. The engine accumulates the picked choices' affinity weights via `tallyAffinities` and computes the finale candidate potions via `selectTopCandidates` (deterministic — the AI never decides the pathway). A separate `generatePrologueFinale` call renders those top candidates as potions; the player's pick (`dominantAffinity` of the chosen potion) sets the pathway. The picked finale potion is NOT fed back into the tally. (2) Manual path: direct pathway selection + character sheet. Both paths end with the first-potion narrative scene.
  - `game-loop.tsx` — Core game loop UI (situation/choices/resolution/consequences phases). The whole surface is wrapped in `SanityEffects` so CSS distortion tracks the (hidden) sanity meter. The status bar shows the potion-digestion meter and — only when the player has enabled it in Settings (`sanityMeterVisible`) — the numeric sanity meter; otherwise sanity is communicated purely through the visual effects. The consequences panel previews the digestion change from the acting evaluation and surfaces a completion event when a potion is fully digested. A `LossOfControlNotice` appears when sanity bottoms out (`isLossOfControl`), with severity from `evaluateLossOfControl` (placeholder pending the death/failure system, issue #12).
  - `sanity-effects.tsx` (`SanityEffects`) — wraps the game surface and applies the per-tier CSS class + vignette/corruption overlay (`globals.css` `.sanity-fx-*` / `.sanity-overlay`) based on `sanityEffects()`. The primary channel for the hidden sanity meter.
  - `sanity-preferences.tsx` (`SanityPreferences`) — Settings toggle for `sanityMeterVisible`, persisted to localStorage (`PREFERENCES_KEY`). Hidden by default.

## Conventions

- Server Components by default. Only use `"use client"` when the component needs browser APIs, hooks, or event handlers.
- Auth forms are client components — they manage form state and call Supabase Auth methods directly.
- Game sidebar is a client component — uses `usePathname` for active route highlighting and `useState` for mobile toggle.
- Provider config, play dashboard, and game loop are client components — manage localStorage for BYOK keys and session persistence.
- Game loop orchestrates AI calls via `generate()` from `@/lib/ai` and state transitions via `transition()` from `@/lib/game`.
- No component libraries. Build with Tailwind utility classes using the Victorian steampunk theme tokens.
- Forms handle loading state, error display, and success redirects internally.
- Use `useSyncExternalStore` for initial localStorage reads — avoid `setState` inside `useEffect` bodies (React 19 lint rule).
- **Accessibility is required (WCAG 2.2 AA).** Follow `docs/rules/accessibility.md` for every component: accessible names, ARIA state, `role="status"`/`alert`, decorative `aria-hidden`, no low-opacity meaningful text, and ≥24px targets. Add/extend the axe suite in `src/test/a11y.test.tsx` when adding a screen or significant interactive component.
