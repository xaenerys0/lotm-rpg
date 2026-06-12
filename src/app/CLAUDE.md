@../../docs/rules/nextjs.md
@../../docs/rules/security.md
@../../docs/rules/accessibility.md

# App Router

Next.js App Router with two route groups:

- `(auth)/` — Login and signup pages (public)
- `(game)/` — Protected game pages (require authentication)
- `auth/callback/` — OAuth code-exchange route handler

## Middleware

`src/proxy.ts` is the middleware entrypoint. It:

1. Generates a CSP nonce and sets security headers
2. Calls `updateSession()` from `@/lib/supabase/middleware` to refresh the auth session
3. Redirects unauthenticated users away from protected routes (`/play`, `/character`, `/journal`, `/map`, `/glossary`, `/market`, `/profile`, `/leaderboard`, `/society`, `/settings` -> `/login`)

The matcher excludes static/PWA assets so they bypass the auth session refresh:
`_next/*`, `favicon.ico`, image extensions, plus `manifest.webmanifest` and `sw.js`.
CSP includes `manifest-src 'self'` and `worker-src 'self'` for the PWA.

## PWA

The app is installable on Android and iOS ("Add to Home Screen"):

- `manifest.ts` — web app manifest, served at `/manifest.webmanifest` (Next auto-injects the `<link rel="manifest">`).
- `apple-icon.tsx` — iOS 180×180 touch icon (Next auto-injects `<link rel="apple-touch-icon">`).
- `icons/[icon]/route.tsx` — Android manifest icons at `/icons/192.png`, `/icons/512.png`, `/icons/512-maskable.png`.
- `_pwa/icon-art.tsx` — shared, font-free emblem rendered to PNG via `ImageResponse` (no binary icon assets). Used by all of the above.
- Apple meta tags + `theme-color` + viewport come from the `appleWebApp`/`metadata`/`viewport` exports in `layout.tsx`.
- `public/sw.js` (minimal, no offline caching) is registered by `ServiceWorkerRegistrar`; `InstallPrompt` shows the Android button / iOS instructions. Both live in `@/components/pwa` and are mounted in `layout.tsx`.
- `next.config.ts` sets no-cache + `Service-Worker-Allowed: /` headers on `/sw.js`.

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
- `/character` — Character sheet (issue #13). Server component wraps `CharacterSheet` client component.
- `/journal` — Story journal (issue #11). Server component wraps `JournalPanel` client component.
- `/map` — Tingen district gazetteer (issue #13) + farther-afield city travel (issue #23). Server component wraps `MapPanel` client component.
- `/glossary` — In-game glossary with progressive disclosure (issue #14). Server component wraps `GlossaryPanel` client component.
- `/market` — Player trading post (issue #16). Server component wraps `MarketPanel` client component.
- `/profile` — Player showcase with privacy controls (issue #18). Server component wraps `ShowcasePanel`.
- `/leaderboard` — Public leaderboards (issue #18). Server component wraps `LeaderboardPanel`.
- `/society` — Secret society hub (issue #32). Server component wraps `SocietyPanel`.
- `/settings` — AI provider configuration (BYOK) and preferences. Server component wraps `ProviderConfig` client component.

## API Routes

- `/api/proxy/ollama-cloud/chat/completions` — Server-side proxy for ollama.com. The cloud service does not send CORS headers, so direct browser fetches fail with status 0. This route forwards the OpenAI-compatible request body to `https://ollama.com/v1/chat/completions` with the caller's Bearer key and relays the response. Used exclusively by `OllamaCloudAdapter`.
- `/api/proxy/ollama-cloud/models` — Companion GET proxy that forwards to `https://ollama.com/v1/models` (same CORS workaround) so `OllamaCloudAdapter.listModels()` can populate the model dropdown.
