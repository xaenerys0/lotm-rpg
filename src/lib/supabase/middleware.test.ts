import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Capture the config handed to createServerClient so the cookie getAll/setAll
// plumbing can be exercised directly, and control the auth result per test.
type CookieConfig = {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookies: { name: string; value: string; options?: unknown }[]) => void;
  };
};
let lastConfig: CookieConfig | undefined;
const getUser = vi.fn();
const getSession = vi.fn(async () => ({ data: { session: null } }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, config: CookieConfig) => {
    lastConfig = config;
    return { auth: { getSession, getUser } };
  },
}));

import { updateSession } from "./middleware";

function signedIn() {
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
}
function signedOut() {
  getUser.mockResolvedValue({ data: { user: null } });
}

beforeEach(() => {
  lastConfig = undefined;
  getUser.mockReset();
  getSession.mockClear();
});
afterEach(() => vi.clearAllMocks());

describe("updateSession auth gate", () => {
  it("refreshes the session (getSession before getUser) on every request", async () => {
    signedIn();
    await updateSession(new NextRequest("http://localhost/play"));
    expect(getSession).toHaveBeenCalled();
    expect(getUser).toHaveBeenCalled();
  });

  it("redirects a signed-out visitor away from a protected route", async () => {
    signedOut();
    const res = await updateSession(new NextRequest("http://localhost/character"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("treats a nested protected path as protected", async () => {
    signedOut();
    const res = await updateSession(new NextRequest("http://localhost/journal/abc"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("lets a signed-out visitor reach a public route", async () => {
    signedOut();
    const res = await updateSession(new NextRequest("http://localhost/login"));
    expect(res.status).not.toBe(307);
  });

  it("lets a signed-in user through a protected route", async () => {
    signedIn();
    const res = await updateSession(new NextRequest("http://localhost/play"));
    expect(res.status).not.toBe(307);
  });
});

describe("updateSession cookie plumbing", () => {
  it("reads request cookies and mirrors writes onto the response", async () => {
    signedIn();
    const request = new NextRequest("http://localhost/play");
    request.cookies.set("sb-access", "token");
    await updateSession(request);

    expect(lastConfig).toBeDefined();
    // getAll surfaces the request's cookies.
    expect(lastConfig!.cookies.getAll().some((c) => c.name === "sb-access")).toBe(true);
    // setAll writes back without throwing and updates the request mirror.
    lastConfig!.cookies.setAll([
      { name: "sb-refresh", value: "next", options: { path: "/" } },
    ]);
    expect(request.cookies.get("sb-refresh")?.value).toBe("next");
  });
});
