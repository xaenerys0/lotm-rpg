# End-to-end / UI tests (Playwright)

These specs drive a real Chromium against the running app to verify things
jsdom cannot measure — chiefly **layout and responsiveness** (no horizontal
overflow, controls inside the viewport). They are separate from the Vitest unit
and jsdom-a11y suite under `src/**`.

```bash
pnpm test:e2e            # run the suite (boots the app via webServer)
pnpm test:e2e:ui         # interactive UI mode
pnpm exec playwright show-report
```

The `webServer` block in `playwright.config.ts` starts `pnpm dev` automatically,
so you don't need a server running first.

## Two tiers

### Public tier — always runs (no backend)

`responsive.spec.ts` and `auth-boundary.spec.ts` cover the unauthenticated
surface: the auth pages fit every viewport (320px → desktop) with no sideways
scroll, and every protected route bounces a signed-out visitor to `/login`. A
dummy Supabase URL lets the server boot; the auth call fails closed.

Runs across two device projects: **mobile** (Pixel 5) and **desktop**
(Desktop Chrome).

### Authenticated tier — runs only with a Supabase backend

The game pages (`/character`, `/journal`, …) are gated by a server-side
Supabase session, so they can't be reached without a real backend. When one is
configured, an extra `setup` project logs in once and saves the session
(`storageState`), and `authenticated.spec.ts` verifies the gated pages render
and fit the viewport while signed in.

Enable it by exporting:

```bash
export E2E_SUPABASE_URL=...        # e.g. http://127.0.0.1:54321 (supabase start) or your project URL
export E2E_SUPABASE_ANON_KEY=...   # publishable / anon key
export E2E_USER_EMAIL=...          # a confirmed test account
export E2E_USER_PASSWORD=...
pnpm test:e2e
```

With those set, `playwright.config.ts` registers the `setup`, `mobile-authed`,
and `desktop-authed` projects automatically. Without them, only the public tier
runs (so CI/sandboxes without Supabase stay green).

### In CI

The `CI` workflow (`.github/workflows/ci.yml`) runs the **public tier** on every
PR and push to `main` — the `webServer` block boots the app with dummy Supabase
env, so no backend is required.

The **authenticated tier** is a secret-gated follow-up. To enable it in CI,
store `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_USER_EMAIL`, and
`E2E_USER_PASSWORD` as repo/environment **secrets** and surface them to the job
as env. Gate the step so it skips cleanly when the secrets are absent (forks /
Dependabot can't read them), since the suite auto-registers the authenticated
projects only when `E2E_SUPABASE_URL` is present.

> The character-**delete** interaction (two-step confirm + removal) is exercised
> at the component level in `src/test/a11y.test.tsx`, which seeds a character
> and clicks through the flow. The authenticated e2e tier focuses on proving the
> real gated pages render and fit when signed in.
