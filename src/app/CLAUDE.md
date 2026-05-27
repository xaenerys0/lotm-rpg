@../../docs/rules/nextjs.md
@../../docs/rules/security.md

# App Router

Next.js App Router with two route groups:

- `(auth)/` — Login and signup pages (public)
- `(game)/` — Protected game pages (require authentication)
- `auth/callback/` — OAuth code-exchange route handler

## Middleware

`src/proxy.ts` is the middleware entrypoint. It:

1. Generates a CSP nonce and sets security headers
2. Calls `updateSession()` from `@/lib/supabase/middleware` to refresh the auth session
3. Redirects unauthenticated users away from protected routes (`/play`, `/character`, `/journal`, `/settings` -> `/login`)

## Auth Flow

1. User signs up at `/signup` -> confirmation email sent
2. User confirms email -> can log in at `/login`
3. `supabase.auth.signInWithPassword()` sets the session cookie
4. OAuth callback at `/auth/callback` exchanges the code for a session
5. Authenticated users are redirected to `/play`; auth pages redirect authenticated users away

## Layouts

- Root layout (`layout.tsx`): loads Geist Sans/Mono and Lora fonts, sets CSS custom properties
- Auth layout (`(auth)/layout.tsx`): passthrough (`<>{children}</>`)
- Game layout (`(game)/layout.tsx`): authenticated shell with sidebar navigation and user profile. Fetches user server-side and redirects to `/login` if unauthenticated.

## Game Routes

- `/play` — Dashboard with pathway selection, new game, continue, and active game loop. Server component wraps `PlayDashboard` client component.
- `/character` — Character creation and sheet (stub)
- `/journal` — Story journal (stub)
- `/settings` — AI provider configuration (BYOK) and preferences. Server component wraps `ProviderConfig` client component.
