// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createEmbeddingProvider = vi.fn((args: { id: string }) => ({ id: args.id }));
vi.mock("@/lib/ai", () => ({
  createEmbeddingProvider: (args: { id: string }) => createEmbeddingProvider(args),
}));

const retrieveChunks = vi.fn();
vi.mock("@/lib/lore", () => ({
  createSupabaseChunkMatcher: (c: unknown) => ({ matcher: c }),
  concealmentTierForSequence: () => 3,
  retrieveChunks: (...args: unknown[]) => retrieveChunks(...args),
  DEFAULT_EPOCH_ID: "fifth",
}));

const buildRetrievalQuery = vi.fn();
const toRetrievedLoreChunks = vi.fn((chunks: unknown[]) =>
  chunks.map((_, i) => ({ id: i })),
);
vi.mock("@/lib/game", () => ({
  buildRetrievalQuery: (s: unknown) => buildRetrievalQuery(s),
  toRetrievedLoreChunks: (c: unknown[]) => toRetrievedLoreChunks(c),
}));

const createBrowserClientSafe = vi.fn((): { rpc: unknown } | null => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserClientSafe: () => createBrowserClientSafe(),
}));

import { retrieveLoreForTurn } from "./lore-retrieval-client";

// Minimal GameSession shape the module reads.
const session = () =>
  ({
    embeddingModelId: "qwen3-embedding-0.6b",
    canonPosition: 100,
    gameState: { epoch: "fifth", sequenceLevel: 7 },
  }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  createEmbeddingProvider.mockImplementation((args: { id: string }) => ({ id: args.id }));
  buildRetrievalQuery.mockReturnValue("query text");
  retrieveChunks.mockResolvedValue([{ chunk: 1 }]);
  createBrowserClientSafe.mockReturnValue({ rpc: vi.fn() });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("resolveEmbedder transport selection", () => {
  it("uses the player's own Ollama when it is their chat provider", async () => {
    await retrieveLoreForTurn(session(), {
      providerId: "ollama",
      baseUrl: "http://localhost:11434",
    } as never);
    expect(createEmbeddingProvider).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ollama" }),
    );
  });

  it("uses a self-hosted operator endpoint when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EMBEDDING_URL", "http://box/embed");
    await retrieveLoreForTurn(session(), null);
    expect(createEmbeddingProvider).toHaveBeenCalledWith(
      expect.objectContaining({ id: "operator" }),
    );
  });

  it("falls back to the Cloudflare proxy when the flag is truthy", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", "true");
    await retrieveLoreForTurn(session(), null);
    expect(createEmbeddingProvider).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cloudflare" }),
    );
  });

  it.each(["0", "false", "", undefined])(
    "treats %s as flag-off and resolves no embedder",
    async (flag) => {
      if (flag !== undefined) vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", flag);
      const result = await retrieveLoreForTurn(session(), null);
      expect(result).toEqual([]);
      expect(createEmbeddingProvider).not.toHaveBeenCalled();
    },
  );
});

describe("retrieveLoreForTurn", () => {
  it("returns shaped chunks on the happy path", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", "1");
    const result = await retrieveLoreForTurn(session(), null);
    expect(retrieveChunks).toHaveBeenCalled();
    expect(result).toEqual([{ id: 0 }]);
  });

  it("returns [] when no Supabase client is available", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", "1");
    createBrowserClientSafe.mockReturnValue(null);
    expect(await retrieveLoreForTurn(session(), null)).toEqual([]);
  });

  it("returns [] (best-effort) when retrieval throws", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", "1");
    retrieveChunks.mockRejectedValue(new Error("rpc down"));
    expect(await retrieveLoreForTurn(session(), null)).toEqual([]);
  });

  it("defaults the epoch when the game state has none", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_EMBEDDING", "1");
    const noEpoch = {
      embeddingModelId: "bge-m3",
      canonPosition: 1,
      gameState: { sequenceLevel: 9 },
    } as never;
    await retrieveLoreForTurn(noEpoch, null);
    expect(retrieveChunks).toHaveBeenCalledWith(
      "query text",
      expect.objectContaining({ epoch: "fifth" }),
    );
  });
});
