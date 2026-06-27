# End-to-end / UI tests (Playwright)

These specs drive a real browser against the running app to verify things jsdom
cannot measure. They are separate from the Vitest unit and jsdom-a11y suite
under `src/**`, and cover:

- **Layout & responsiveness** (`responsive.spec.ts`) — no horizontal overflow,
  controls inside the viewport.
- **Auth redirect boundary** (`auth-boundary.spec.ts`) — protected routes bounce
  a signed-out visitor to `/login`.
- **Auth-form behaviour** (`auth-forms.spec.ts`) — signup/login field labels and
  autocomplete (paste-friendly), native validation, and the accessible error
  state (`role="alert"` + `aria-invalid`) when the backend is unreachable.
- **Security headers** (`security-headers.spec.ts`) — the running server actually
  emits the nonce-based CSP (`'strict-dynamic'`) and the hardening headers from
  `src/proxy.ts`. Backstops the proxy unit test against a real response.
- **PWA surface** (`pwa.spec.ts`) — the web app manifest parses with the right
  fields, the icon routes return PNGs, and `/sw.js` is scoped to `/`.
- **Real-browser accessibility** (`a11y.spec.ts`) — runs axe (the existing
  `axe-core` dep, injected via `page.evaluate` so the strict CSP doesn't block
  it) on the public pages with **`color-contrast` enabled**, which the jsdom
  suite must disable.

Specs run across three public-tier browser projects: **mobile** (Pixel 5,
Chromium), **mobile-webkit** (iPhone 13, WebKit/iOS Safari — the PWA's real
target), and **desktop** (Desktop Chrome). To add a new public spec, register
its filename in the `PUBLIC_SPECS` matcher in `playwright.config.ts`.

```bash
pnpm test:e2e            # run the suite (boots the app via webServer)
pnpm test:e2e:ui         # interactive UI mode
pnpm exec playwright show-report
```

The `webServer` block in `playwright.config.ts` starts `pnpm dev` automatically,
so you don't need a server running first.

## Two tiers

### Public tier — always runs (no backend)

The public specs (see the list above) cover the unauthenticated surface —
layout, the redirect boundary, auth-form behaviour, security headers, the PWA
surface, and real-browser a11y. A dummy Supabase URL lets the server boot; the
auth call fails closed, which is exactly what the auth-form error tests rely on.

Runs across three device projects: **mobile** (Pixel 5, Chromium),
**mobile-webkit** (iPhone 13, WebKit) and **desktop** (Desktop Chrome).

### Authenticated tier — runs only with a Supabase backend

The game pages (`/character`, `/journal`, …) are gated by a server-side
Supabase session, so they can't be reached without a real backend. When one is
configured, an extra `setup` project logs in once and saves the session
(`storageState`), and `authenticated.spec.ts` verifies the gated pages render
and fit the viewport while signed in. `canon-takeover-prologue.spec.ts` (issue
#92) also runs in this tier: it route-intercepts the AI provider and drives the
canon-character takeover — naming the character after a novel figure, accepting
the takeover affordance, walking the canon-faithful guided prologue, and opening
the chronicle. `combat.spec.ts` (issue #187) seeds a session plus an in-progress
combat encounter (persisted under the `lotm:combat:` key, re-hydrated on mount),
enters the game loop, and asserts the framed clarity surfaces render — the
mind-controlled framing card, the threat-assessment card, and the loss-of-control
meter `progressbar`.

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
env, so no backend is required. CI installs both **Chromium and WebKit** (the
iOS project), so a new browser project here needs the matching `playwright
install` target added to the workflow.

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
