import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";

function request(opts: { auth?: string | null; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.auth !== null) headers.Authorization = opts.auth ?? "Bearer key-123";
  return new NextRequest("http://localhost/api/proxy/ollama-cloud/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? { model: "gpt-oss", messages: [] }),
  });
}

const okChat = (content: string, finish = "stop") =>
  new Response(
    JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }),
    { status: 200 },
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.clearAllMocks());

describe("ollama-cloud chat proxy", () => {
  it("401s when the Bearer key is missing", async () => {
    const res = await POST(request({ auth: null }));
    expect(res.status).toBe(401);
  });

  it("401s when the Authorization header is not a Bearer token", async () => {
    const res = await POST(request({ auth: "Basic abc" }));
    expect(res.status).toBe(401);
  });

  it("forwards the body and key to ollama.com and relays a clean 2xx without logging", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(okChat('{"narrative":"ok"}'));
    const res = await POST(request());
    expect(res.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ollama.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer key-123");
    // A parseable game body logs nothing.
    expect(console.error).not.toHaveBeenCalled();
  });

  it("502s when the upstream is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const res = await POST(request());
    expect(res.status).toBe(502);
  });

  it("logs the status + model on an upstream error (never the key)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("model not found", { status: 404 }),
    );
    const res = await POST(request({ body: { model: "ghost", messages: [] } }));
    expect(res.status).toBe(404);
    const logged = JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).toContain("ghost");
    expect(logged).not.toContain("key-123");
  });

  it("diagnoses a 2xx body that is missing the game JSON key", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(okChat("just prose, no json key"));
    await POST(request());
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("unparseable 2xx body"),
      expect.any(String),
    );
  });

  it("diagnoses a truncated (finish_reason length) reasoning-model body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '{"narrative":"...',
                reasoning: "long chain of thought",
              },
              finish_reason: "length",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    await POST(request());
    const logged = JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).toContain("length");
    expect(logged).toContain("reasoning");
  });

  it("diagnoses a non-JSON 2xx body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>gateway</html>", { status: 200 }),
    );
    await POST(request());
    expect(console.error).toHaveBeenCalled();
  });

  it("treats a 2xx body with a 'thinking' field and no narrative as unparseable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "", thinking: "hmm" }, finish_reason: "stop" }],
        }),
        { status: 200 },
      ),
    );
    await POST(request());
    const logged = JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls);
    expect(logged).toContain("thinking");
  });

  it("treats a JSON body with no choices array as unparseable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    await POST(request());
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("unparseable 2xx body"),
      expect.any(String),
    );
  });

  it("logs model null when the request body carries no model id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 }),
    );
    await POST(request({ body: { messages: [] } }));
    const payload = (console.error as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string;
    expect(payload).toContain('"model":null');
  });

  it("logs model null when the request body is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 }),
    );
    const bad = new NextRequest(
      "http://localhost/api/proxy/ollama-cloud/chat/completions",
      { method: "POST", headers: { Authorization: "Bearer k" }, body: "{not json" },
    );
    await POST(bad);
    const payload = (console.error as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string;
    expect(payload).toContain('"model":null');
  });
});
