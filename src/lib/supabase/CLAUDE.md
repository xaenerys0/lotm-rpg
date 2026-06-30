@../../../docs/rules/security.md

# Supabase Clients

Three client factories for different execution contexts:

- `client.ts` — Browser client (`createBrowserClient`). Use in `"use client"` components.
- `server.ts` — Server client (`createServerClient`). Use in Server Components, route handlers, and Server Actions. Reads cookies from the request.
- `middleware.ts` — Session refresh client. Called by the proxy middleware on every request to keep the auth session alive and handle redirects.
- `cookie-options.ts` — Shared `AUTH_COOKIE_OPTIONS` (long `maxAge`, 400 days) passed as `cookieOptions` to all three factories so auth cookies are PERSISTENT, not session, cookies. Without it the cookies can be discarded when the browser/PWA closes, logging the player out on next launch.
- `admin.ts` — `isAdmin(supabase, userId)`: the single admin gate read for the dev/test utilities surface (`/dev/admin`). Selects `profiles.is_admin` for the user (typed to the server client; the existing "read own profile" RLS policy exposes it); defensive — any error/missing row resolves to `false`, never a throw into a render. The flag is set ONLY in the database (Studio/SQL); migration `20260630040622` adds the column plus a BEFORE UPDATE trigger that blocks client self-escalation. Consumed by `src/app/(game)/dev/admin/page.tsx` (404s a non-admin) and `(game)/layout.tsx` (gates the sidebar "Dev Admin" link).

## Conventions

- Always use the correct factory for the context — browser client in client components, server client in server code.
- The anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is the only key used client-side. Never expose the service-role key.
- All database access goes through RLS — the client operates as the authenticated user.

## Testing

All four files are under the coverage gate (see `vitest.config.mts`) and have colocated `*.test.ts` tests: `@supabase/ssr` and `next/headers` are mocked, the cookie `getAll`/`setAll` plumbing is exercised directly (including the Server-Component `setAll` swallow), and `middleware.ts`'s auth gate + protected-route redirect is covered. When you change the protected-prefix list or the cookie handling, update `middleware.test.ts`. The CSP/redirect behaviour is additionally asserted against the live server in `e2e/security-headers.spec.ts`.
