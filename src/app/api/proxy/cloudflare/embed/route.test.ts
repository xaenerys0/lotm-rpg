import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Supabase server client: control the auth user and the rate-limit RPC result.
const getUser = vi.fn();
const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, rpc }),
}));

import { POST } from "./route";

function request(
  body: unknown = { text: ["hello"], model: "qwen3-embedding-0.6b" },
): NextRequest {
  return new NextRequest("http://localhost/api/proxy/cloudflare/embed", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const signedIn = () => getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
const allowRpc = () => rpc.mockResolvedValue({ data: [{ allowed: true }], error: null });

beforeEach(() => {
  vi.restoreAllMocks();
  getUser.mockReset();
  rpc.mockReset();
  vi.stubEnv("CF_ACCOUNT_ID", "acct");
  vi.stubEnv("CF_API_TOKEN", "tok");
  vi.stubEnv("EMBED_RATE_LIMIT_MAX", "30");
  vi.stubEnv("EMBED_RATE_LIMIT_WINDOW_SECONDS", "60");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe("cloudflare embed proxy", () => {
  it("401s a signed-out caller before spending the operator quota", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(request());
    expect(res.status).toBe(401);
  });

  it("503s when the operator credentials are not configured", async () => {
    signedIn();
    vi.stubEnv("CF_ACCOUNT_ID", "");
    const res = await POST(request());
    expect(res.status).toBe(503);
  });

  it("429s with Retry-After when the user exceeds the rate limit", async () => {
    signedIn();
    rpc.mockResolvedValue({
      data: [{ allowed: false, reset_at: new Date(Date.now() + 30_000).toISOString() }],
      error: null,
    });
    const res = await POST(request());
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("falls back to the window length when reset_at is unparseable", async () => {
    signedIn();
    rpc.mockResolvedValue({
      data: [{ allowed: false, reset_at: "not-a-date" }],
      error: null,
    });
    const res = await POST(request());
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("fails closed (503) when the rate-limit decision cannot be verified", async () => {
    signedIn();
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    const res = await POST(request());
    expect(res.status).toBe(503);
  });

  it("fails closed (503) when the RPC returns no decision row and no error", async () => {
    signedIn();
    rpc.mockResolvedValue({ data: [], error: null });
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(console.error).toHaveBeenCalled();
  });

  it("defaults to the qwen3 model when the request omits one", async () => {
    signedIn();
    allowRpc();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ result: {} }), { status: 200 }));
    const res = await POST(request({ text: ["hi"] }));
    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0] as string).toContain("qwen3-embedding-0.6b");
  });

  it("400s an unsupported embedding model without calling upstream", async () => {
    signedIn();
    allowRpc();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await POST(request({ text: ["hi"], model: "totally-unknown" }));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("400s a request missing a text payload", async () => {
    signedIn();
    allowRpc();
    const res = await POST(request({ model: "qwen3-embedding-0.6b" }));
    expect(res.status).toBe(400);
  });

  it("400s an unparseable JSON body", async () => {
    signedIn();
    allowRpc();
    const bad = new NextRequest("http://localhost/api/proxy/cloudflare/embed", {
      method: "POST",
      body: "{not json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });

  it("502s when the upstream fetch throws", async () => {
    signedIn();
    allowRpc();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const res = await POST(request());
    expect(res.status).toBe(502);
  });

  it("relays the upstream response and forwards only a {text} body with the operator token", async () => {
    signedIn();
    allowRpc();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ result: { data: [[1]] } }), { status: 200 }),
      );
    const res = await POST(
      request({ text: ["hi"], model: "qwen3-embedding-0.6b", junk: "x" }),
    );
    expect(res.status).toBe(200);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/accounts/acct/ai/run/");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    // Extra fields are stripped; only { text } reaches Cloudflare.
    expect(JSON.parse(init.body as string)).toEqual({ text: ["hi"] });
  });

  it("logs (status only) and relays an upstream error", async () => {
    signedIn();
    allowRpc();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream boom", { status: 500 }),
    );
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalled();
  });

  it("skips the rate-limit check entirely when EMBED_RATE_LIMIT_MAX=0", async () => {
    signedIn();
    vi.stubEnv("EMBED_RATE_LIMIT_MAX", "0");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: {} }), { status: 200 }),
    );
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the built-in rate-limit defaults when the env vars are unset", async () => {
    signedIn();
    vi.stubEnv("EMBED_RATE_LIMIT_MAX", undefined as unknown as string);
    vi.stubEnv("EMBED_RATE_LIMIT_WINDOW_SECONDS", undefined as unknown as string);
    allowRpc();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: {} }), { status: 200 }),
    );
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "check_rate_limit",
      expect.objectContaining({ p_max_requests: 30, p_window_seconds: 60 }),
    );
  });

  it("defaults the rate-limit config when env values are non-numeric", async () => {
    signedIn();
    vi.stubEnv("EMBED_RATE_LIMIT_MAX", "not-a-number");
    vi.stubEnv("EMBED_RATE_LIMIT_WINDOW_SECONDS", "0");
    allowRpc();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: {} }), { status: 200 }),
    );
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "check_rate_limit",
      expect.objectContaining({ p_max_requests: 30, p_window_seconds: 60 }),
    );
  });
});
