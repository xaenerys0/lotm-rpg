# Next.js Rules

This project uses **Next.js 16.2.6** with **React 19** — APIs, conventions, and file structure may differ from your training data.

- Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- The middleware entrypoint is `src/proxy.ts` (not `middleware.ts`). It exports `proxy()` and a `config` with a route matcher.
- `next.config.ts` enables `typedRoutes: true` — use the `Route` type for route strings and the framework will type-check them.
- Server Components are the default; only add `"use client"` when the component needs browser APIs, hooks, or event handlers.
