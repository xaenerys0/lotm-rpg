@../../../docs/rules/security.md

# Supabase Clients

Three client factories for different execution contexts:

- `client.ts` — Browser client (`createBrowserClient`). Use in `"use client"` components.
- `server.ts` — Server client (`createServerClient`). Use in Server Components, route handlers, and Server Actions. Reads cookies from the request.
- `middleware.ts` — Session refresh client. Called by the proxy middleware on every request to keep the auth session alive and handle redirects.
- `cookie-options.ts` — Shared `AUTH_COOKIE_OPTIONS` (long `maxAge`, 400 days) passed as `cookieOptions` to all three factories so auth cookies are PERSISTENT, not session, cookies. Without it the cookies can be discarded when the browser/PWA closes, logging the player out on next launch.

## Conventions

- Always use the correct factory for the context — browser client in client components, server client in server code.
- The anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is the only key used client-side. Never expose the service-role key.
- All database access goes through RLS — the client operates as the authenticated user.
