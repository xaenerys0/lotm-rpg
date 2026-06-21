import { expect, test } from "@playwright/test";

// The proxy middleware (src/proxy.ts) is the only place the CSP + hardening
// headers are set, and `docs/rules/security.md` calls them non-negotiable. The
// unit test (src/proxy.test.ts) checks the logic in isolation; this asserts the
// real running server actually emits them, so a middleware/matcher regression
// can't ship a page with a missing or weakened policy.

test("an app route is served with a nonce-based CSP and hardening headers", async ({
  page,
}) => {
  const response = await page.goto("/login");
  expect(response).not.toBeNull();
  const headers = response!.headers();

  const csp = headers["content-security-policy"];
  expect(csp).toBeTruthy();
  expect(csp).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/);
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");

  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  // The nonce is also surfaced for the document's own scripts.
  expect(headers["x-nonce"]).toBeTruthy();
});
