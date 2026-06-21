import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from "./route";

afterEach(() => vi.clearAllMocks());

describe("auth callback route", () => {
  it("exchanges the code and redirects to the default landing page", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(new Request("http://localhost/auth/callback?code=abc"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/play");
  });

  it("honours an explicit next destination", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(
      new Request("http://localhost/auth/callback?code=abc&next=/character"),
    );
    expect(res.headers.get("location")).toBe("http://localhost/character");
  });

  it("redirects to the login error page when the exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });
    const res = await GET(new Request("http://localhost/auth/callback?code=abc"));
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?error=auth_callback_failed",
    );
  });

  it("redirects to the login error page when no code is present", async () => {
    const res = await GET(new Request("http://localhost/auth/callback"));
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?error=auth_callback_failed",
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
