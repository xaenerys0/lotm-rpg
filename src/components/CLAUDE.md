@../../docs/rules/styling.md

# Components

## Organization

- `auth/` — Authentication forms (login, signup)
- `ui/` — Shared UI primitives (planned)
- `game/` — Game shell components (sidebar navigation, sign-out)

## Conventions

- Server Components by default. Only use `"use client"` when the component needs browser APIs, hooks, or event handlers.
- Auth forms are client components — they manage form state and call Supabase Auth methods directly.
- Game sidebar is a client component — uses `usePathname` for active route highlighting and `useState` for mobile toggle.
- No component libraries. Build with Tailwind utility classes using the Victorian steampunk theme tokens.
- Forms handle loading state, error display, and success redirects internally.
