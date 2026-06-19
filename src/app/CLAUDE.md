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
3. Redirects unauthenticated users away from protected routes (`/play`, `/character`, `/journal`, `/map`, `/glossary`, `/guide`, `/market`, `/profile`, `/leaderboard`, `/society`, `/settings` -> `/login`)

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
6. The root landing page (`page.tsx`) also checks auth server-side and redirects a signed-in player straight to `/play` (no "Begin / Sign In" choices on the base URL once logged in)
7. Auth cookies are persistent (long `maxAge` via `@/lib/supabase/cookie-options`) so an installed PWA stays signed in after being closed and reopened

## Layouts

- Root layout (`layout.tsx`): loads Geist Sans/Mono and Lora fonts, sets CSS custom properties
- Auth layout (`(auth)/layout.tsx`): passthrough (`<>{children}</>`)
- Game layout (`(game)/layout.tsx`): authenticated shell with sidebar navigation and user profile. Fetches user server-side and redirects to `/login` if unauthenticated.

## Game Routes

- `/play` — Dashboard with pathway selection, new game, continue, and active game loop. Server component wraps `PlayDashboard` client component.
- `/character` — Character sheet (issue #13). Server component wraps `CharacterSheet` client component.
- `/journal` — Story journal (issue #11). Server component wraps `JournalPanel` client component.
- `/map` — Per-city district gazetteer (issue #13, #101) + farther-afield city travel (issue #23). The page `<h1>` is the city-neutral "The Gazetteer"; `MapPanel` names the character's actual current city dynamically. Server component wraps `MapPanel` client component.
- `/glossary` — In-game glossary with progressive disclosure (issue #14). Server component wraps `GlossaryPanel` client component.
- `/guide` — On-demand onboarding Guide: a browsable, out-of-world reference (first steps, how a turn works, a screen-by-screen "where to find things" map with deep links, the active-character explainer, and key concepts). Server component wraps `GuidePanel` (also a Server Component — all disclosures are native `<details>`). Reached from the sidebar; never auto-opens. A one-shot `FirstTimeHint` (`id="guide-pointer"`) on `/play` points newcomers to it.
- `/market` — Player trading post (issue #16). Server component wraps `MarketPanel` client component.
- `/profile` — Player showcase with privacy controls (issue #18). Server component wraps `ShowcasePanel`.
- `/leaderboard` — Public leaderboards (issue #18). Server component wraps `LeaderboardPanel`.
- `/society` — Secret society hub (issue #32). Server component wraps `SocietyPanel`.
- `/settings` — AI provider configuration (BYOK) and preferences. Server component wraps `ProviderConfig` client component.

## API Routes

- `/api/proxy/ollama-cloud/chat/completions` — Server-side proxy for ollama.com. The cloud service does not send CORS headers, so direct browser fetches fail with status 0. This route forwards the OpenAI-compatible request body to `https://ollama.com/v1/chat/completions` with the caller's Bearer key and relays the response. On a non-2xx upstream status it `console.error`s the status, requested model, and (truncated) upstream body so the real reason surfaces in Vercel logs. On a **2xx** it additionally runs `summarizeUnparseableChat` and logs a structured diagnostic **only** when the body doesn't look like the game's JSON (reasoning models like gpt-oss/Harmony can pollute `content`, put reasoning in a separate `reasoning`/`thinking` field, or truncate via `finish_reason: "length"`) — capturing the finish reason, content length/empty flag, whether a `"narrative"` key is present, the reasoning field/length, and head/tail snippets of the AI's own output. The `Authorization` header/key and the player's request text are never logged. Used exclusively by `OllamaCloudAdapter`.
- `/api/proxy/ollama-cloud/models` — Companion GET proxy that forwards to `https://ollama.com/v1/models` (same CORS workaround) so `OllamaCloudAdapter.listModels()` can populate the model dropdown.
- `/api/proxy/ollama-cloud/images/generations` — Companion POST proxy that forwards the OpenAI-compatible images body to `https://ollama.com/v1/images/generations` (same CORS workaround) so the `ollama-cloud` image provider (`@/lib/ai/image-providers`, image model selection) can generate scene art. Logs upstream ≥400 status + body to Vercel logs; the Authorization header/key is never logged.
