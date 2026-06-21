import { describe, expect, it } from "vitest";

import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_OPTIONS } from "./cookie-options";

describe("auth cookie options", () => {
  it("pins the browser-capped 400-day max-age so the session survives a PWA restart", () => {
    expect(AUTH_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 400);
    expect(AUTH_COOKIE_OPTIONS.maxAge).toBe(AUTH_COOKIE_MAX_AGE);
  });
});
