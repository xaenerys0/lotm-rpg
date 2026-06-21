import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

function request(auth: string | null = "Bearer key-123"): NextRequest {
  const headers: Record<string, string> = {};
  if (auth !== null) headers.Authorization = auth;
  return new NextRequest("http://localhost/api/proxy/ollama-cloud/models", { headers });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.clearAllMocks());

describe("ollama-cloud models proxy", () => {
  it("401s when the Bearer key is missing", async () => {
    const res = await GET(request(null));
    expect(res.status).toBe(401);
  });

  it("forwards the catalog request with the caller's key and relays the body", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    const res = await GET(request());
    expect(res.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ollama.com/v1/models");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer key-123");
  });

  it("502s when the upstream is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const res = await GET(request());
    expect(res.status).toBe(502);
  });

  it("logs an upstream error status without the key", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("forbidden", { status: 403 }),
    );
    const res = await GET(request());
    expect(res.status).toBe(403);
    const logged = JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).not.toContain("key-123");
  });
});
