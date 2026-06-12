import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chunkDocument, chunkDocuments, splitSentences } from "./chunk";
import { parseJsonl } from "./jsonl";
import {
  RAG_CHUNK_MAX_TOKENS,
  RAG_CHUNK_MIN_TOKENS,
  type ChunkRecord,
  type SourceDocument,
} from "./types";

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), "utf8");

// A simple word-based counter keeps the unit tests deterministic and readable
// without depending on the exact BPE of the real tokenizer.
const wordCount = (text: string): number =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

describe("splitSentences", () => {
  it("returns no sentences for empty/whitespace text", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   \n\t ")).toEqual([]);
  });

  it("splits on terminal punctuation and trims/normalizes whitespace", () => {
    expect(splitSentences("One thing.  Two things!  Three?")).toEqual([
      "One thing.",
      "Two things!",
      "Three?",
    ]);
  });

  it("does not split on common abbreviations", () => {
    expect(splitSentences("Mr. Klein nodded. He left.")).toEqual([
      "Mr. Klein nodded.",
      "He left.",
    ]);
  });

  it("does not split on single-letter initials", () => {
    expect(splitSentences("Klein K. Moretti waited. Then he moved.")).toEqual([
      "Klein K. Moretti waited.",
      "Then he moved.",
    ]);
  });

  it("does not split when the next token is not a sentence opening", () => {
    // The period after "3" is followed by lowercase "and", so it is mid-sentence.
    expect(splitSentences("He counted to 3. and then he stopped.")).toEqual([
      "He counted to 3. and then he stopped.",
    ]);
  });

  it("keeps trailing closing quotes with the sentence and splits after them", () => {
    expect(splitSentences('"Run!" he shouted. She ran.')).toEqual([
      '"Run!" he shouted.',
      "She ran.",
    ]);
  });

  it("tolerates a boundary with no preceding word (leading punctuation)", () => {
    // The leading "..." has empty text before it — the splitter must not crash.
    expect(splitSentences("... Then silence. Home.")).toEqual([
      "...",
      "Then silence.",
      "Home.",
    ]);
  });
});

describe("chunkDocument", () => {
  const doc: SourceDocument = {
    source: "novel",
    title: "Test Chapter",
    ref: { chapter: 7 },
    content:
      "Alpha sentence here. Beta sentence here. Gamma sentence here. " +
      "Delta sentence here. Epsilon sentence here. Zeta sentence here.",
    tags: ["t"],
    canon_order: 7,
    arc_bucket: "arc",
    concealment_tier: 2,
    in_world_date: "Day 7",
  };

  it("emits a single chunk when the document fits the window", () => {
    const chunks = chunkDocument(doc, { countTokens: wordCount });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(doc.content);
    expect(chunks[0].tokenCount).toBe(wordCount(doc.content));
  });

  it("carries the chronology/concealment signals onto every chunk", () => {
    const chunks = chunkDocument(doc, {
      countTokens: wordCount,
      minTokens: 3,
      maxTokens: 6,
    });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.canon_order).toBe(7);
      expect(chunk.arc_bucket).toBe("arc");
      expect(chunk.concealment_tier).toBe(2);
      expect(chunk.in_world_date).toBe("Day 7");
      expect(chunk.tags).toEqual(["t"]);
      expect(chunk.source).toBe("novel");
      expect(chunk.embedding).toBeNull();
    }
  });

  it("assigns deterministic, position-derived, chapter-scoped ids", () => {
    const chunks = chunkDocument(doc, {
      countTokens: wordCount,
      minTokens: 3,
      maxTokens: 6,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((c) => c.id)).toEqual(
      chunks.map((_, i) => `novel-ch7-${String(i).padStart(4, "0")}`),
    );
    // Stable across re-runs.
    const again = chunkDocument(doc, {
      countTokens: wordCount,
      minTokens: 3,
      maxTokens: 6,
    });
    expect(again.map((c) => c.id)).toEqual(chunks.map((c) => c.id));
  });

  it("overlaps whole trailing sentences between consecutive chunks", () => {
    const chunks = chunkDocument(doc, {
      countTokens: wordCount,
      minTokens: 3,
      maxTokens: 6,
      overlapRatio: 0.25,
    });
    const first = chunks[0].content;
    const second = chunks[1].content;
    // The opening sentence of chunk 2 is a trailing sentence of chunk 1.
    const secondOpening = second.split(". ")[0];
    expect(first).toContain(secondOpening);
  });

  it("produces no overlap when the ratio is zero", () => {
    const chunks = chunkDocument(doc, {
      countTokens: wordCount,
      minTokens: 3,
      maxTokens: 6,
      overlapRatio: 0,
    });
    const joined = chunks.map((c) => c.content).join(" ");
    // With no overlap, each sentence appears exactly once across all chunks.
    expect(joined.match(/Alpha sentence here\./g)).toHaveLength(1);
  });

  it("word-windows a single sentence that exceeds the max window", () => {
    const longSentence = `${Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ")}.`;
    const chunks = chunkDocument(
      { source: "wiki", title: "Long", ref: {}, content: longSentence },
      { countTokens: wordCount, minTokens: 5, maxTokens: 10 },
    );
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      // No window runs far past the ceiling.
      expect(chunk.tokenCount).toBeLessThanOrEqual(11);
    }
  });

  it("splits CJK sentences on fullwidth terminators without needing whitespace", () => {
    expect(
      splitSentences("寄生属于窃取的一种。窃取的是生命！它有两种形态？最后一句"),
    ).toEqual(["寄生属于窃取的一种。", "窃取的是生命！", "它有两种形态？", "最后一句"]);
  });

  it("keeps fullwidth closing quotes with their sentence", () => {
    expect(splitSentences("他说：“走。”然后离开了。")).toEqual([
      "他说：“走。”",
      "然后离开了。",
    ]);
  });

  it("character-windows a spaceless oversize word so no chunk can run unbounded", () => {
    // One space-free "word" (an untranslated CJK passage shape) at 1 token per
    // character via a char-count tokenizer.
    const charCount = (text: string): number => text.length;
    const spaceless = "字".repeat(95);
    const chunks = chunkDocument(
      { source: "wiki", title: "CJK", ref: {}, content: spaceless },
      { countTokens: charCount, minTokens: 5, maxTokens: 10 },
    );
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(11);
    }
    expect(chunks.map((c) => c.content).join("")).toBe(spaceless);
  });

  it("emits a trailing window when a long sentence does not divide evenly", () => {
    // 25 words at maxTokens 10 → windows of 10, 10, then a 5-word remainder.
    const longSentence = `${Array.from({ length: 25 }, (_, i) => `w${i}`).join(" ")}.`;
    const chunks = chunkDocument(
      { source: "wiki", title: "Remainder", ref: {}, content: longSentence },
      { countTokens: wordCount, minTokens: 5, maxTokens: 10 },
    );
    const rejoined = chunks.map((c) => c.content).join(" ");
    expect(rejoined).toContain("w24");
  });

  it("applies defaults for omitted optional document fields", () => {
    const minimal: SourceDocument = {
      source: "wiki",
      title: "Bare",
      ref: { page: "Bare Page" },
      content: "Only one short sentence.",
    };
    const [chunk] = chunkDocument(minimal, { countTokens: wordCount });
    expect(chunk.tags).toEqual([]);
    expect(chunk.canon_order).toBeNull();
    expect(chunk.arc_bucket).toBeNull();
    expect(chunk.concealment_tier).toBe(0);
    expect(chunk.in_world_date).toBeNull();
    expect(chunk.id).toBe("wiki-bare-page-0000");
  });

  it("derives the id ref-key from url, then title, with a doc fallback", () => {
    const fromUrl = chunkDocument(
      {
        source: "wiki",
        title: "U",
        ref: { url: "https://x.test/Foo_Bar" },
        content: "Hi.",
      },
      { countTokens: wordCount },
    );
    expect(fromUrl[0].id).toBe("wiki-https-x-test-foo-bar-0000");

    const fromTitle = chunkDocument(
      { source: "curated", title: "Sequence 9", ref: {}, content: "Hi." },
      { countTokens: wordCount },
    );
    expect(fromTitle[0].id).toBe("curated-sequence-9-0000");

    const fallback = chunkDocument(
      { source: "curated", title: "###", ref: {}, content: "Hi." },
      { countTokens: wordCount },
    );
    expect(fallback[0].id).toBe("curated-doc-0000");
  });

  it("returns no chunks for empty content", () => {
    expect(
      chunkDocument(
        { source: "novel", title: "Empty", ref: { chapter: 1 }, content: "" },
        { countTokens: wordCount },
      ),
    ).toEqual([]);
  });
});

describe("chunkDocuments", () => {
  it("flat-maps chunks across documents in order", () => {
    const docs: SourceDocument[] = [
      { source: "novel", title: "A", ref: { chapter: 1 }, content: "One." },
      { source: "novel", title: "B", ref: { chapter: 2 }, content: "Two." },
    ];
    const chunks = chunkDocuments(docs, { countTokens: wordCount });
    expect(chunks.map((c) => c.id)).toEqual(["novel-ch1-0000", "novel-ch2-0000"]);
  });
});

describe("default token sizing (real tokenizer)", () => {
  it("keeps a fitting document in one chunk within the production window", () => {
    const docs = parseJsonl<SourceDocument>(fixture("normalized-docs.jsonl"));
    // Each fixture document is comfortably under the 800-token ceiling.
    for (const doc of docs) {
      const chunks = chunkDocument(doc);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].tokenCount).toBeLessThanOrEqual(RAG_CHUNK_MAX_TOKENS);
    }
  });
});

// --- Golden-fixture test (issue #59 §8: the chunker is the risky code) -------
// JSONL in -> expected chunk JSONL out, on real prose fixtures. Regenerate the
// expected file via the chunk stage if the chunker intentionally changes.
describe("golden fixtures", () => {
  const GOLDEN_OPTIONS = { minTokens: 60, maxTokens: 140, overlapRatio: 0.15 };

  it("chunks the normalized-docs fixture into the expected records", () => {
    const docs = parseJsonl<SourceDocument>(fixture("normalized-docs.jsonl"));
    const expected = parseJsonl<ChunkRecord>(fixture("chunks.expected.jsonl"));
    expect(chunkDocuments(docs, GOLDEN_OPTIONS)).toEqual(expected);
  });

  it("the expected golden output honors the chunker's invariants", () => {
    const expected = parseJsonl<ChunkRecord>(fixture("chunks.expected.jsonl"));
    expect(expected.length).toBeGreaterThan(0);
    for (const chunk of expected) {
      expect(chunk.embedding).toBeNull();
      // Non-tail chunks respect the floor; all chunks respect a sane ceiling.
      expect(chunk.tokenCount).toBeLessThanOrEqual(GOLDEN_OPTIONS.maxTokens + 5);
      expect(chunk.tokenCount).toBeGreaterThan(0);
    }
    // Chronology metadata survived: the novel chapters keep canon order and the
    // wiki page (no canon position) is timeless.
    const novel = expected.filter((c) => c.source === "novel");
    expect(novel.every((c) => typeof c.canon_order === "number")).toBe(true);
    expect(expected.some((c) => c.source === "wiki" && c.canon_order === null)).toBe(
      true,
    );
    // The concealment tier rode along from the source document (chapter 2 = 1).
    expect(
      expected
        .filter((c) => c.arc_bucket === "tarot-club")
        .every((c) => c.concealment_tier === 1),
    ).toBe(true);
  });
});

describe("constants", () => {
  it("expose the resolved 300–800 window", () => {
    expect(RAG_CHUNK_MIN_TOKENS).toBe(300);
    expect(RAG_CHUNK_MAX_TOKENS).toBe(800);
  });
});
