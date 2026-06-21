import { defineConfig, devices, type Project } from "@playwright/test";

// End-to-end / UI tests (separate from the Vitest unit + jsdom-a11y suite in
// src/**). These drive a real Chromium against the running Next.js app to
// verify layout and responsiveness — the things jsdom cannot measure.
//
// Two tiers:
//   • Public tier (always runs): the unauthenticated surface — auth pages and
//     the redirect boundary. No backend required; a dummy Supabase URL lets the
//     server boot and the auth call fails closed (no user → /login).
//   • Authenticated tier (runs only when a Supabase backend is configured via
//     E2E_SUPABASE_URL): a storageState `setup` project logs in once, then the
//     game pages are exercised with that session. See e2e/README.md.

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const authFile = "playwright/.auth/user.json";

// Only register the authenticated projects when a real backend is available,
// so the public tier stays green in sandboxes/CI without Supabase.
const hasBackend = Boolean(process.env.E2E_SUPABASE_URL);

// Public-tier specs: layout/responsiveness, the auth redirect boundary, the
// auth-form behaviour, the security headers, the PWA surface, and real-browser
// a11y. All run without a backend (the dummy Supabase URL fails closed).
const PUBLIC_SPECS =
  /(responsive|auth-boundary|auth-forms|security-headers|pwa|a11y)\.spec\.ts/;

const publicProjects: Project[] = [
  // Phone-sized viewport with touch + mobile UA — the case the user reported
  // ("various mobile screens don't fit naturally").
  {
    name: "mobile",
    testMatch: PUBLIC_SPECS,
    use: { ...devices["Pixel 5"] },
  },
  // iOS Safari (WebKit) — the PWA explicitly targets "Add to Home Screen" on
  // iOS and the original complaint was mobile fit, so exercise the engine that
  // actually ships those, not just Chromium.
  {
    name: "mobile-webkit",
    testMatch: PUBLIC_SPECS,
    use: { ...devices["iPhone 13"] },
  },
  // Desktop sanity check that the same pages still hold up wide.
  {
    name: "desktop",
    testMatch: PUBLIC_SPECS,
    use: { ...devices["Desktop Chrome"] },
  },
];

const authenticatedProjects: Project[] = [
  { name: "setup", testMatch: /auth\.setup\.ts/ },
  {
    name: "mobile-authed",
    testMatch: /authenticated\.spec\.ts/,
    use: { ...devices["Pixel 5"], storageState: authFile },
    dependencies: ["setup"],
  },
  {
    name: "desktop-authed",
    testMatch: /authenticated\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], storageState: authFile },
    dependencies: ["setup"],
  },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI, pair GitHub annotations with an HTML report (written to
  // playwright-report/, never auto-opened) so the workflow can upload it as a
  // failure artifact. Locally, the concise list reporter is enough.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: hasBackend ? [...publicProjects, ...authenticatedProjects] : publicProjects,
  webServer: {
    // Dev server is enough for layout assertions and boots faster than a full
    // production build. Dummy Supabase env lets the server start; without a
    // real backend the auth network call simply fails closed.
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.E2E_SUPABASE_ANON_KEY ?? "sb_publishable_e2e_dummy_key",
    },
  },
});
