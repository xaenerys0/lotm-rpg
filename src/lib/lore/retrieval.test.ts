import { describe, expect, it, vi } from "vitest";

import type { EmbeddingProvider } from "@/lib/ai/embeddings";
import { AIError } from "@/lib/ai/errors";
import {
  createSupabaseChunkMatcher,
  DEFAULT_RETRIEVAL_COUNT,
  retrievalChunkIds,
  retrieveChunks,
  toPgVector,
  type MatchSourceChunksRpc,
  type RetrievedChunk,
} from "./retrieval";

const MODEL_ID = "qwen3-embedding-0.6b";

// A deterministic 3-dim fake embedder: the vector encodes which topic words
// appear in the text, so cosine-style matching is exact and readable.
const TOPICS = ["fog", "tarot", "canal"] as const;
const fakeEmbedder = (modelId: string = MODEL_ID): EmbeddingProvider => ({
  id: "ollama",
  dims: 3,
  model_id: modelId,
  embed: (texts) =>
    Promise.resolve(
      texts.map((text) => TOPICS.map((topic) => (text.includes(topic) ? 1 : 0))),
    ),
});

const chunk = (overrides: Partial<RetrievedChunk>): RetrievedChunk => ({
  id: "00000000-0000-0000-0000-000000000001",
  source: "novel",
  title: "Chapter 1",
  ref: { chapter: 1 },
  content: "The fog came in over the canal.",
  tags: ["novel"],
  token_count: 8,
  canon_order: 1,
  arc_bucket: "clown",
  concealment_tier: 0,
  in_world_date: "1349",
  epoch: 5,
  fts_rank: 1,
  vec_rank: 1,
  rrf_score: 0.03,
  ...overrides,
});

// An in-memory stand-in for `match_source_chunks` that mirrors the SQL gates
// exactly (timeline, concealment, sources, tags) and ranks by how many topic
// dimensions the query vector and chunk content share.
const CORPUS: RetrievedChunk[] = [
  chunk({
    id: "00000000-0000-0000-0000-00000000000a",
    title: "The Fog of Tingen",
    content: "The grey fog rolls over Tingen each night.",
    canon_order: 1,
  }),
  chunk({
    id: "00000000-0000-0000-0000-00000000000b",
    title: "The Tarot Club",
    content: "Above the fog, the tarot gathering convenes.",
    canon_order: 120,
  }),
  chunk({
    id: "00000000-0000-0000-0000-00000000000c",
    title: "A Future Reveal",
    content: "The truth about the fog, far in the future of the story.",
    canon_order: 900,
  }),
  chunk({
    id: "00000000-0000-0000-0000-00000000000d",
    title: "Concealed Cosmology",
    content: "A concealed truth about the fog beyond mortal tiers.",
    canon_order: null,
    concealment_tier: 4,
    source: "wiki",
    tags: ["wiki"],
  }),
  chunk({
    id: "00000000-0000-0000-0000-00000000000e",
    title: "Timeless Geography",
    content: "The canal district and its bridges.",
    canon_order: null,
    source: "wiki",
    tags: ["wiki", "cities"],
  }),
];

const fakeRpc: MatchSourceChunksRpc = (args) => {
  const queryVector = JSON.parse(args.p_query_embedding) as number[];
  const gated = CORPUS.filter(
    (row) =>
      (args.p_sources == null || args.p_sources.includes(row.source)) &&
      (args.p_tags == null || row.tags.some((t) => args.p_tags?.includes(t))) &&
      (args.p_player_position == null ||
        row.canon_order === null ||
        row.canon_order <= args.p_player_position) &&
      (args.p_epoch == null || row.epoch === null || row.epoch === args.p_epoch) &&
      row.concealment_tier <= (args.p_max_concealment_tier ?? 0),
  );
  const scored = gated
    .map((row) => ({
      row,
      score: TOPICS.reduce(
        (sum, topic, i) => sum + (row.content.includes(topic) ? queryVector[i] : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id));
  return Promise.resolve(scored.slice(0, args.p_match_count ?? 10).map(({ row }) => row));
};

describe("toPgVector", () => {
  it("serializes to pgvector's text literal", () => {
    expect(toPgVector([0.25, -1, 3])).toBe("[0.25,-1,3]");
    expect(toPgVector([])).toBe("[]");
  });
});

describe("retrieveChunks", () => {
  const base = {
    embedder: fakeEmbedder(),
    rpc: fakeRpc,
    lockedModelId: MODEL_ID,
    canonPosition: 200,
  };

  it("returns the expected chunk in the top-k for a known query", async () => {
    const results = await retrieveChunks("what is the tarot gathering?", base);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("The Tarot Club");
  });

  it("denies chunks beyond the player's timeline position", async () => {
    const results = await retrieveChunks("the fog", base);
    expect(results.map((r) => r.title)).not.toContain("A Future Reveal");
    // ...but past + present canon and timeless chunks remain reachable.
    expect(results.map((r) => r.title)).toContain("The Fog of Tingen");
  });

  it("denies concealed chunks above the tier ceiling and allows them under it", async () => {
    const denied = await retrieveChunks("the fog", base);
    expect(denied.map((r) => r.title)).not.toContain("Concealed Cosmology");

    const allowed = await retrieveChunks("the fog", {
      ...base,
      maxConcealmentTier: 4,
    });
    expect(allowed.map((r) => r.title)).toContain("Concealed Cosmology");
  });

  it("threads filters and defaults into the RPC arguments", async () => {
    const rpc = vi.fn<MatchSourceChunksRpc>().mockResolvedValue([]);
    await retrieveChunks("fog", { ...base, rpc });
    expect(rpc).toHaveBeenCalledWith({
      p_query_embedding: "[1,0,0]",
      p_query_text: "fog",
      p_model_id: MODEL_ID,
      p_player_position: 200,
      p_epoch: null,
      p_max_concealment_tier: 0,
      p_sources: null,
      p_tags: null,
      p_match_count: DEFAULT_RETRIEVAL_COUNT,
    });

    await retrieveChunks("fog", {
      ...base,
      rpc,
      sources: ["wiki"],
      tags: ["cities"],
      count: 3,
      maxConcealmentTier: 1,
      canonPosition: null,
    });
    expect(rpc).toHaveBeenLastCalledWith(
      expect.objectContaining({
        p_sources: ["wiki"],
        p_tags: ["cities"],
        p_match_count: 3,
        p_max_concealment_tier: 1,
        p_player_position: null,
      }),
    );
  });

  it("honors source and tag filters end-to-end", async () => {
    const results = await retrieveChunks("the canal", {
      ...base,
      sources: ["wiki"],
      tags: ["cities"],
    });
    expect(results.map((r) => r.title)).toEqual(["Timeless Geography"]);
  });

  it("enforces the per-character model lock", async () => {
    await expect(
      retrieveChunks("fog", { ...base, embedder: fakeEmbedder("bge-m3") }),
    ).rejects.toThrow(/locked model/);
    await expect(
      retrieveChunks("fog", { ...base, embedder: fakeEmbedder("bge-m3") }),
    ).rejects.toBeInstanceOf(AIError);
  });

  it("drops rows that somehow violate a gate (defense in depth)", async () => {
    const leakyRpc: MatchSourceChunksRpc = () =>
      Promise.resolve([
        chunk({ id: "00000000-0000-0000-0000-00000000001a", canon_order: 999 }),
        chunk({
          id: "00000000-0000-0000-0000-00000000001b",
          canon_order: null,
          concealment_tier: 9,
        }),
        chunk({ id: "00000000-0000-0000-0000-00000000001c", canon_order: 10 }),
      ]);
    const results = await retrieveChunks("fog", { ...base, rpc: leakyRpc });
    expect(results.map((r) => r.id)).toEqual(["00000000-0000-0000-0000-00000000001c"]);
  });

  it("is deterministic: identical inputs return identical ranked ids", async () => {
    const a = await retrieveChunks("fog and tarot", base);
    const b = await retrieveChunks("fog and tarot", base);
    expect(retrievalChunkIds(a)).toEqual(retrievalChunkIds(b));
  });

  it("forwards the epoch gate and excludes other-epoch chunks", async () => {
    const rpc = vi.fn<MatchSourceChunksRpc>().mockResolvedValue([]);
    await retrieveChunks("fog", { ...base, rpc, epoch: 1 });
    expect(rpc).toHaveBeenCalledWith(expect.objectContaining({ p_epoch: 1 }));

    // End-to-end through the gated fake RPC: a First-Epoch character sees none of
    // the Fifth-Epoch corpus (every CORPUS chunk is epoch 5).
    const results = await retrieveChunks("the fog", { ...base, epoch: 1 });
    expect(results).toEqual([]);
  });

  it("lets a universal (null-epoch) chunk through the epoch gate", async () => {
    const universalRpc: MatchSourceChunksRpc = () =>
      Promise.resolve([
        chunk({ id: "00000000-0000-0000-0000-00000000002a", epoch: null }),
        chunk({ id: "00000000-0000-0000-0000-00000000002b", epoch: 5 }),
      ]);
    const results = await retrieveChunks("fog", {
      ...base,
      rpc: universalRpc,
      epoch: 2,
    });
    // The null-epoch chunk passes for every epoch; the Fifth-tagged one is dropped
    // by the defense-in-depth filter for a Second-Epoch character.
    expect(results.map((r) => r.id)).toEqual(["00000000-0000-0000-0000-00000000002a"]);
  });

  it("drops an other-epoch row that slips past the RPC (defense in depth)", async () => {
    const leakyRpc: MatchSourceChunksRpc = () =>
      Promise.resolve([
        chunk({ id: "00000000-0000-0000-0000-00000000003a", epoch: 5 }),
        chunk({ id: "00000000-0000-0000-0000-00000000003b", epoch: 3 }),
      ]);
    const results = await retrieveChunks("fog", { ...base, rpc: leakyRpc, epoch: 3 });
    expect(results.map((r) => r.id)).toEqual(["00000000-0000-0000-0000-00000000003b"]);
  });
});

describe("retrievalChunkIds", () => {
  it("extracts ids in ranked order for the turn record", () => {
    const rows = [chunk({ id: "00000000-0000-0000-0000-000000000002" }), chunk({})];
    expect(retrievalChunkIds(rows)).toEqual([
      "00000000-0000-0000-0000-000000000002",
      "00000000-0000-0000-0000-000000000001",
    ]);
  });
});

describe("createSupabaseChunkMatcher", () => {
  it("unwraps data and defaults a null payload to an empty list", async () => {
    const rows = [chunk({})];
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    const matcher = createSupabaseChunkMatcher(client);
    await expect(
      matcher({ p_query_embedding: "[]", p_query_text: "", p_model_id: MODEL_ID }),
    ).resolves.toEqual(rows);

    client.rpc.mockResolvedValue({ data: null, error: null });
    await expect(
      matcher({ p_query_embedding: "[]", p_query_text: "", p_model_id: MODEL_ID }),
    ).resolves.toEqual([]);
  });

  it("raises an AIError when the RPC reports a failure", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    };
    const matcher = createSupabaseChunkMatcher(client);
    await expect(
      matcher({ p_query_embedding: "[]", p_query_text: "", p_model_id: MODEL_ID }),
    ).rejects.toThrow(/Chunk retrieval failed: boom/);
  });
});
