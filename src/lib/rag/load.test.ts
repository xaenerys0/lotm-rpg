import { describe, expect, it } from "vitest";

import { chunkUuid, toEmbeddingRow, toSourceChunkRow } from "./load";
import { type ChunkRecord } from "./types";

const record = (overrides: Partial<ChunkRecord> = {}): ChunkRecord => ({
  id: "novel-ch1-0000",
  source: "novel",
  title: "Chapter 1",
  ref: { chapter: 1 },
  content: "The fog came in.",
  tags: ["novel", "clown"],
  tokenCount: 5,
  canon_order: 1,
  arc_bucket: "clown",
  concealment_tier: 0,
  in_world_date: "1349",
  embedding: null,
  ...overrides,
});

describe("chunkUuid", () => {
  it("is a deterministic RFC-4122 v5-style uuid", () => {
    const a = chunkUuid("novel-ch1-0000");
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(chunkUuid("novel-ch1-0000")).toBe(a);
    expect(chunkUuid("novel-ch1-0001")).not.toBe(a);
  });
});

describe("toSourceChunkRow", () => {
  it("maps every column, derives a stable uuid, and preserves the pipeline id", () => {
    const row = toSourceChunkRow(record());
    expect(row).toEqual({
      id: chunkUuid("novel-ch1-0000"),
      source: "novel",
      title: "Chapter 1",
      ref: { chapter: 1, chunk_key: "novel-ch1-0000" },
      content: "The fog came in.",
      tags: ["novel", "clown"],
      token_count: 5,
      canon_order: 1,
      arc_bucket: "clown",
      concealment_tier: 0,
      in_world_date: "1349",
    });
  });
});

describe("toEmbeddingRow", () => {
  it("serializes the vector into pgvector text under the model's map", () => {
    const vector = Array.from({ length: 1024 }, (_, i) => (i === 0 ? 0.5 : 0));
    const row = toEmbeddingRow(record({ embedding: vector }), "qwen3-embedding-0.6b");
    expect(row.chunk_id).toBe(chunkUuid("novel-ch1-0000"));
    expect(row.model_id).toBe("qwen3-embedding-0.6b");
    expect(row.embedding.startsWith("[0.5,0,")).toBe(true);
  });

  it("rejects unembedded records and wrong dimensionality", () => {
    expect(() => toEmbeddingRow(record(), "qwen3-embedding-0.6b")).toThrow(
      /has no embedding/,
    );
    expect(() =>
      toEmbeddingRow(record({ embedding: [1, 2, 3] }), "qwen3-embedding-0.6b"),
    ).toThrow(/3-dim embedding; expected 1024/);
    expect(toEmbeddingRow(record({ embedding: [1, 2, 3] }), "m", 3).embedding).toBe(
      "[1,2,3]",
    );
  });
});
