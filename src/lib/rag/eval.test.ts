import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chunkDocuments } from "./chunk";
import {
  createLexicalRetriever,
  evalLeakage,
  evalRecallAtK,
  formatEvalReport,
  type EvalCase,
  type EvalRetriever,
} from "./eval";
import { parseJsonl } from "./jsonl";
import { type ChunkRecord, type SourceDocument } from "./types";

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), "utf8");

// The offline eval corpus: the novel + wiki golden documents, cut by the real
// chunker (default window — each fixture doc fits in one chunk).
const corpus: ChunkRecord[] = chunkDocuments([
  ...parseJsonl<SourceDocument>(fixture("novel-docs.expected.jsonl")),
  ...parseJsonl<SourceDocument>(fixture("wiki-docs.expected.jsonl")),
]);

const cases = parseJsonl<EvalCase>(fixture("eval-cases.jsonl"));

const evalCase = (overrides: Partial<EvalCase>): EvalCase => ({
  id: "case",
  query: "fog",
  expectedChunkIds: [],
  canonPosition: null,
  maxConcealmentTier: 0,
  ...overrides,
});

describe("evalRecallAtK", () => {
  it("scores a perfect retriever at 1 and reports per-case detail", async () => {
    const retriever: EvalRetriever = (c) =>
      Promise.resolve(
        c.expectedChunkIds.map((id) => ({
          id,
          canon_order: null,
          concealment_tier: 0,
        })),
      );
    const report = await evalRecallAtK(
      [evalCase({ id: "a", expectedChunkIds: ["x", "y"] })],
      retriever,
      5,
    );
    expect(report.recallAtK).toBe(1);
    expect(report.cases).toEqual([
      { caseId: "a", expected: 2, found: 2, recall: 1, missing: [] },
    ]);
  });

  it("averages partial recall across cases and lists the missing ids", async () => {
    const retriever: EvalRetriever = () =>
      Promise.resolve([{ id: "x", canon_order: null, concealment_tier: 0 }]);
    const report = await evalRecallAtK(
      [
        evalCase({ id: "half", expectedChunkIds: ["x", "y"] }),
        evalCase({ id: "none", expectedChunkIds: ["z"] }),
        evalCase({ id: "trivial", expectedChunkIds: [] }),
      ],
      retriever,
    );
    expect(report.cases[0]).toMatchObject({ recall: 0.5, missing: ["y"] });
    expect(report.cases[1]).toMatchObject({ recall: 0, missing: ["z"] });
    expect(report.cases[2]).toMatchObject({ recall: 1, missing: [] });
    expect(report.recallAtK).toBeCloseTo((0.5 + 0 + 1) / 3);
  });

  it("treats an empty case set as vacuously perfect", async () => {
    const report = await evalRecallAtK([], () => Promise.resolve([]));
    expect(report.recallAtK).toBe(1);
  });
});

describe("evalLeakage", () => {
  it("flags future-canon and concealed chunks in player-visible results", async () => {
    const leaky: EvalRetriever = () =>
      Promise.resolve([
        { id: "future", canon_order: 500, concealment_tier: 0 },
        { id: "secret", canon_order: null, concealment_tier: 4 },
        { id: "fine", canon_order: 3, concealment_tier: 0 },
      ]);
    const report = await evalLeakage(
      [evalCase({ id: "probe", canonPosition: 10 })],
      leaky,
    );
    expect(report.clean).toBe(false);
    expect(report.violations).toEqual([
      { caseId: "probe", chunkId: "future", kind: "future-canon" },
      { caseId: "probe", chunkId: "secret", kind: "concealed" },
    ]);
  });

  it("does not flag future canon when the case has no timeline limit", async () => {
    const retriever: EvalRetriever = () =>
      Promise.resolve([{ id: "late", canon_order: 9999, concealment_tier: 0 }]);
    const report = await evalLeakage([evalCase({ canonPosition: null })], retriever);
    expect(report.clean).toBe(true);
  });
});

describe("createLexicalRetriever", () => {
  const retrieve = createLexicalRetriever(corpus);

  it("ranks the chunk sharing the most query terms first", async () => {
    const results = await retrieve(
      evalCase({ query: "augury and dream interpretation", canonPosition: 1 }),
      3,
    );
    expect(results[0].id).toBe("wiki-seer-fixture-101-0000");
  });

  it("applies the timeline and concealment gates", async () => {
    // Chapter 3 (canon_order 3) must be invisible at position 2.
    const results = await retrieve(
      evalCase({ query: "the gathering above the grey fog", canonPosition: 2 }),
      10,
    );
    expect(results.map((r) => r.id)).not.toContain("novel-ch3-0000");

    const concealed = createLexicalRetriever([
      { ...corpus[0], id: "tiered", concealment_tier: 3 },
    ]);
    await expect(
      concealed(evalCase({ query: corpus[0].title, maxConcealmentTier: 0 }), 5),
    ).resolves.toEqual([]);
  });

  it("returns nothing when no term matches, and honors k", async () => {
    await expect(
      retrieve(evalCase({ query: "zeppelin quartz xylophone" }), 5),
    ).resolves.toEqual([]);
    const limited = await retrieve(evalCase({ query: "the fog" }), 2);
    expect(limited.length).toBeLessThanOrEqual(2);
  });
});

describe("labeled fixture set (advisory CI metrics)", () => {
  it("achieves full recall@10 over the labeled cases with the lexical retriever", async () => {
    const report = await evalRecallAtK(cases, createLexicalRetriever(corpus));
    expect(report.recallAtK).toBe(1);
  });

  it("leaks nothing — the timeline gate's safety net", async () => {
    const report = await evalLeakage(cases, createLexicalRetriever(corpus));
    expect(report.clean).toBe(true);
    expect(report.casesChecked).toBe(cases.length);
  });
});

describe("formatEvalReport", () => {
  it("renders recall detail, missing ids, and violations", async () => {
    const recall = await evalRecallAtK(
      [evalCase({ id: "half", expectedChunkIds: ["x", "y"] })],
      () => Promise.resolve([{ id: "x", canon_order: null, concealment_tier: 0 }]),
      7,
    );
    const dirty = await evalLeakage([evalCase({ id: "probe", canonPosition: 1 })], () =>
      Promise.resolve([{ id: "bad", canon_order: 2, concealment_tier: 0 }]),
    );
    const text = formatEvalReport(recall, dirty);
    expect(text).toContain("recall@7: 0.500");
    expect(text).toContain("half: 1/2 missing: y");
    expect(text).toContain("1 VIOLATION");
    expect(text).toContain("probe: future-canon chunk bad");

    const clean = await evalLeakage([], () => Promise.resolve([]));
    expect(formatEvalReport(recall, clean)).toContain("leakage: CLEAN");
  });
});
