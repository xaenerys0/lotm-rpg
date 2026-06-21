import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse, type NextRequest } from "next/server";

// updateSession is the auth-refresh half of the middleware; the proxy's own job
// is the CSP nonce + security headers. Stub the session refresh so these tests
// isolate the header logic (the refresh client is covered in
// src/lib/supabase/middleware.test.ts).
const updateSession = vi.fn(async (request: NextRequest) =>
  NextResponse.next({ request }),
);
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (request: NextRequest) => updateSession(request),
}));

import { config, proxy } from "./proxy";

async function makeRequest(path = "/play"): Promise<NextRequest> {
  const { NextRequest } = await import("next/server");
  return new NextRequest(`http://localhost${path}`);
}

afterEach(() => {
  vi.unstubAllEnvs();
  updateSession.mockClear();
});

describe("proxy middleware security headers", () => {
  it("sets a per-request nonce wired into the CSP script-src and the x-nonce header", async () => {
    const response = await proxy(await makeRequest());

    const csp = response.headers.get("Content-Security-Policy")!;
    const nonce = response.headers.get("x-nonce")!;

    expect(nonce).toBeTruthy();
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("emits a fresh nonce on every request", async () => {
    const first = await proxy(await makeRequest());
    const second = await proxy(await makeRequest());
    expect(first.headers.get("x-nonce")).not.toBe(second.headers.get("x-nonce"));
  });

  it("sets the hardening headers", async () => {
    const response = await proxy(await makeRequest());
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("allows 'unsafe-eval' only outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const dev = await proxy(await makeRequest());
    expect(dev.headers.get("Content-Security-Policy")).toContain("'unsafe-eval'");

    vi.stubEnv("NODE_ENV", "production");
    const prod = await proxy(await makeRequest());
    expect(prod.headers.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
  });

  it("delegates session refresh to updateSession", async () => {
    await proxy(await makeRequest("/character"));
    expect(updateSession).toHaveBeenCalledTimes(1);
  });
});

describe("proxy matcher config", () => {
  it("matches app routes and skips files with an extension", () => {
    const matcher = config.matcher[0];
    const re = new RegExp(`^${matcher}$`);
    expect(re.test("/play")).toBe(true);
    expect(re.test("/api/proxy/cloudflare/embed")).toBe(true);
    expect(re.test("/manifest.webmanifest")).toBe(false);
    expect(re.test("/sw.js")).toBe(false);
    expect(re.test("/_next/static/chunk.js")).toBe(false);
  });
});
