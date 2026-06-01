import { describe, expect, it, vi } from "vitest";

import { DEFAULT_EMBED_BATCH_SIZE, embedChunks, type ChunkEmbedder } from "./embed";
import type { ChunkRecord } from "./types";

function makeChunk(id: string, content: string): ChunkRecord {
  return {
    id,
    source: "novel",
    title: "A Chapter",
    ref: { chapter: 1 },
    content,
    tags: [],
    tokenCount: 5,
    canon_order: 1,
    arc_bucket: null,
    concealment_tier: 0,
    in_world_date: null,
    embedding: null,
  };
}

/** A deterministic fake embedder: each vector encodes its text length. */
function fakeEmbedder(overrides: Partial<ChunkEmbedder> = {}): ChunkEmbedder {
  return {
    embed: vi.fn(async (texts: string[]) => texts.map((t) => [t.length])),
    ...overrides,
  };
}

describe("embedChunks", () => {
  it("fills each chunk's embedding, preserving order, without mutating inputs", async () => {
    const inputs = [makeChunk("a", "one"), makeChunk("b", "three!")];
    const provider = fakeEmbedder();

    const out = await embedChunks(inputs, provider);

    expect(out.map((r) => r.id)).toEqual(["a", "b"]);
    expect(out.map((r) => r.embedding)).toEqual([[3], [6]]);
    // Inputs are untouched (returns new records).
    expect(inputs.every((r) => r.embedding === null)).toBe(true);
  });

  it("batches the corpus by the configured size", async () => {
    const inputs = Array.from({ length: 5 }, (_, i) => makeChunk(`c${i}`, "x"));
    const provider = fakeEmbedder();

    await embedChunks(inputs, provider, { batchSize: 2 });

    // 5 chunks / batch 2 => batches of 2, 2, 1.
    const calls = (provider.embed as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.map((c) => c[0].length)).toEqual([2, 2, 1]);
  });

  it("defaults to DEFAULT_EMBED_BATCH_SIZE in one pass for a small corpus", async () => {
    const inputs = Array.from({ length: 3 }, (_, i) => makeChunk(`c${i}`, "x"));
    const provider = fakeEmbedder();

    await embedChunks(inputs, provider);

    const calls = (provider.embed as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    expect(DEFAULT_EMBED_BATCH_SIZE).toBeGreaterThanOrEqual(3);
  });

  it("returns [] for an empty corpus", async () => {
    const provider = fakeEmbedder();
    expect(await embedChunks([], provider)).toEqual([]);
    expect(provider.embed).not.toHaveBeenCalled();
  });

  it("rejects a batch size below 1", async () => {
    await expect(embedChunks([], fakeEmbedder(), { batchSize: 0 })).rejects.toThrow(
      /batchSize must be >= 1/,
    );
  });

  it("throws when the provider returns the wrong number of vectors", async () => {
    const provider = fakeEmbedder({ embed: vi.fn(async () => [[1]]) });
    await expect(
      embedChunks([makeChunk("a", "x"), makeChunk("b", "y")], provider),
    ).rejects.toThrow(/returned 1 vectors for 2 chunks/);
  });
});
