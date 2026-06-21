import { expect, test } from "@playwright/test";

// PWA installability surface (app/CLAUDE.md): the web app manifest, the icon
// route handler, and the service worker. None of it was covered before — these
// are concrete HTTP assertions a real server either satisfies or doesn't. The
// middleware matcher excludes file-extension paths, so all three are public.

test("serves a valid web app manifest", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = await response.json();
  expect(manifest.name).toContain("Lord of the Mysteries");
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(Array.isArray(manifest.icons)).toBe(true);
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
});

test("renders the manifest icons as PNGs", async ({ request }) => {
  for (const file of ["192.png", "512.png", "512-maskable.png"]) {
    const response = await request.get(`/icons/${file}`);
    expect(response.ok(), `${file} should be served`).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});

test("serves the service worker scoped to the site root", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBeTruthy();
  // next.config.ts widens the worker's scope to the whole origin.
  expect(response.headers()["service-worker-allowed"]).toBe("/");
});
