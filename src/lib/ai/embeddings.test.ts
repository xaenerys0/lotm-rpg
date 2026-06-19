import { afterEach, describe, expect, it, vi } from "vitest";

import { AIError } from "./errors";
import {
  APPROVED_EMBEDDING_MODELS,
  CLOUDFLARE_EMBEDDING_PROXY_PATH,
  DEFAULT_EMBEDDING_MODEL_ID,
  EMBEDDING_DIMS,
  createEmbeddingProvider,
  getEmbeddingModel,
} from "./embeddings";
import { OllamaAdapter } from "./providers";

// One full-length vector and helpers to mock each provider's response shape.
function vec(value = 0.1, dims = EMBEDDING_DIMS): number[] {
  return Array.from({ length: dims }, () => value);
}

function mockEmbed(embeddings: number[][]): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ embeddings })),
  } as Response);
}

// Cloudflare Workers AI returns `{ result: { data, shape }, success }`.
function mockCloudflare(data: number[][]) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          result: { data, shape: [data.length, data[0]?.length ?? 0] },
          success: true,
        }),
      ),
  } as Response);
}

describe("approved embedding models", () => {
  it("are all 1024-dim and Cloudflare-hosted, default first", () => {
    expect(APPROVED_EMBEDDING_MODELS.map((m) => m.id)).toEqual([
      "qwen3-embedding-0.6b",
      "bge-m3",
    ]);
    for (const model of APPROVED_EMBEDDING_MODELS) {
      expect(model.dims).toBe(EMBEDDING_DIMS);
      // Pinned by an explicit tag, never `:latest`.
      expect(model.ollamaTag).toMatch(/:.+/);
      expect(model.ollamaTag).not.toContain(":latest");
      // Every approved model is hosted on Cloudflare Workers AI.
      expect(model.cloudflareModel).toMatch(/^@cf\//);
    }
    expect(getEmbeddingModel("bge-m3").cloudflareModel).toBe("@cf/baai/bge-m3");
    expect(getEmbeddingModel("qwen3-embedding-0.6b").cloudflareModel).toBe(
      "@cf/qwen/qwen3-embedding-0.6b",
    );
  });

  it("default id resolves to an approved model", () => {
    expect(getEmbeddingModel(DEFAULT_EMBEDDING_MODEL_ID).id).toBe(
      DEFAULT_EMBEDDING_MODEL_ID,
    );
  });

  it("getEmbeddingModel throws on an unknown model", () => {
    expect(() => getEmbeddingModel("voyage-4-lite")).toThrow(AIError);
    expect(() => getEmbeddingModel("voyage-4-lite")).toThrow(/Approved:/);
  });
});

describe("OllamaAdapter.embed", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts to /api/embed and returns the embeddings array", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [vec(0.2)] })),
    } as Response);

    const out = await new OllamaAdapter().embed("bge-m3:567m", ["hello"], "");

    expect(out).toHaveLength(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("http://localhost:11434/api/embed");
    const init = fetchSpy.mock.calls[0][1]!;
    expect(JSON.parse(init.body as string)).toEqual({
      model: "bge-m3:567m",
      input: ["hello"],
    });
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("sends a bearer header when an api key is given", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [vec()] })),
    } as Response);

    await new OllamaAdapter().embed("bge-m3:567m", ["hello"], "secret");

    expect(
      (fetchSpy.mock.calls[0][1]!.headers as Record<string, string>).Authorization,
    ).toBe("Bearer secret");
  });

  it("throws MALFORMED_OUTPUT when the response has no embeddings array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ model: "x" })),
    } as Response);

    await expect(new OllamaAdapter().embed("x", ["hi"], "")).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });

  it("throws MALFORMED_OUTPUT when an embedding row is not numeric", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [["x"]] })),
    } as Response);

    await expect(new OllamaAdapter().embed("x", ["hi"], "")).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });
});

describe("createEmbeddingProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("defaults to the qwen3 model on the player's Ollama", async () => {
    const provider = createEmbeddingProvider({ id: "ollama" });
    expect(provider.id).toBe("ollama");
    expect(provider.model_id).toBe(DEFAULT_EMBEDDING_MODEL_ID);
    expect(provider.dims).toBe(EMBEDDING_DIMS);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [vec()] })),
    } as Response);
    await provider.embed(["q"]);
    // Uses the pinned Ollama tag, not the registry id, when calling the daemon.
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string).model).toBe(
      "qwen3-embedding:0.6b",
    );
    expect(fetchSpy.mock.calls[0][0]).toBe("http://localhost:11434/api/embed");
  });

  it("targets the operator endpoint from the env var", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EMBEDDING_URL", "https://embed.example.com");
    const provider = createEmbeddingProvider({
      id: "operator",
      modelId: "bge-m3",
    });
    expect(provider.model_id).toBe("bge-m3");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [vec()] })),
    } as Response);
    await provider.embed(["q"]);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://embed.example.com/api/embed");
  });

  it("honours an explicit base URL over the operator env default", async () => {
    const provider = createEmbeddingProvider({
      id: "operator",
      baseUrl: "https://override.example.com",
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ embeddings: [vec()] })),
    } as Response);
    await provider.embed(["q"]);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://override.example.com/api/embed");
  });

  it("routes cloudflare through the same-origin proxy by default, sending the model id", async () => {
    const provider = createEmbeddingProvider({ id: "cloudflare" });
    expect(provider.id).toBe("cloudflare");
    expect(provider.model_id).toBe("qwen3-embedding-0.6b");

    const fetchSpy = mockCloudflare([vec()]);
    const out = await provider.embed(["q"]);

    expect(out).toHaveLength(1);
    // Relative proxy path → send the approved model id; the proxy maps + injects.
    expect(fetchSpy.mock.calls[0][0]).toBe(CLOUDFLARE_EMBEDDING_PROXY_PATH);
    const init = fetchSpy.mock.calls[0][1]!;
    expect(JSON.parse(init.body as string)).toEqual({
      text: ["q"],
      model: "qwen3-embedding-0.6b",
    });
    // The browser sends no key — the proxy injects the operator token server-side.
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("appends the Cloudflare model id to an absolute run base with a key (CI path)", async () => {
    const base = "https://api.cloudflare.com/client/v4/accounts/acc/ai/run";
    const provider = createEmbeddingProvider({
      id: "cloudflare",
      modelId: "bge-m3",
      baseUrl: base,
      apiKey: "cf-token",
    });

    const fetchSpy = mockCloudflare([vec()]);
    await provider.embed(["q"]);

    // Absolute URL → append the CF model id to the path; body carries only text.
    expect(fetchSpy.mock.calls[0][0]).toBe(`${base}/@cf/baai/bge-m3`);
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)).toEqual({
      text: ["q"],
    });
    expect(
      (fetchSpy.mock.calls[0][1]!.headers as Record<string, string>).Authorization,
    ).toBe("Bearer cf-token");
  });

  it("throws MALFORMED_OUTPUT when the cloudflare response lacks result.data", async () => {
    const provider = createEmbeddingProvider({ id: "cloudflare" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true })),
    } as Response);
    await expect(provider.embed(["q"])).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });

  it("throws MALFORMED_OUTPUT when a cloudflare row is not numeric", async () => {
    const provider = createEmbeddingProvider({ id: "cloudflare" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({ result: { data: [["x"]] }, success: true })),
    } as Response);
    await expect(provider.embed(["q"])).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });

  it("cloudflare returns [] for an empty batch without calling fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = createEmbeddingProvider({ id: "cloudflare" });
    expect(await provider.embed([])).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws when the operator endpoint is unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EMBEDDING_URL", "");
    expect(() => createEmbeddingProvider({ id: "operator" })).toThrow(AIError);
    expect(() => createEmbeddingProvider({ id: "operator" })).toThrow(
      /NEXT_PUBLIC_OPERATOR_EMBEDDING_URL/,
    );
  });

  it("returns [] for an empty batch without calling the endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = createEmbeddingProvider({ id: "ollama" });
    expect(await provider.embed([])).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws when the count of returned vectors mismatches the inputs", async () => {
    const provider = createEmbeddingProvider({ id: "ollama" });
    mockEmbed([vec()]);
    await expect(provider.embed(["a", "b"])).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });

  it("throws when a returned vector has the wrong dimensionality", async () => {
    const provider = createEmbeddingProvider({ id: "ollama" });
    mockEmbed([[1, 2, 3]]);
    await expect(provider.embed(["a"])).rejects.toThrow(/1024-dim/);
  });
});
