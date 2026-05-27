# Security Rules

## Environment Variables
- `NEXT_PUBLIC_*` vars are exposed to the browser — never put secrets in them.
- Server-only secrets (e.g. `RESEND_API_KEY`) must never be imported in client components.
- Never commit `.env.local` or any file containing real keys.

## Content Security Policy
- CSP is enforced in `src/proxy.ts` with nonce-based `script-src` and `'strict-dynamic'`.
- When adding new external origins, update the CSP directives in `proxy.ts` — do not weaken the policy with blanket `'unsafe-inline'` for scripts.
- `'unsafe-eval'` is only allowed in development for React stack traces.

## Supabase Row-Level Security
- RLS is enabled on every table. All policies restrict access to the authenticated user's own rows.
- When creating new tables, always enable RLS and write policies before inserting data.
- Never use the service-role key in client-side code.
