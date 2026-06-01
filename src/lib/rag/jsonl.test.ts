import { describe, expect, it } from "vitest";

import { iterateJsonl, parseJsonl, toJsonl } from "./jsonl";

describe("parseJsonl", () => {
  it("parses one record per line, skipping blank lines", () => {
    const text = '{"a":1}\n\n  \n{"a":2}\n';
    expect(parseJsonl<{ a: number }>(text)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseJsonl("")).toEqual([]);
    expect(parseJsonl("\n  \n")).toEqual([]);
  });
});

describe("iterateJsonl", () => {
  it("yields parsed records lazily", () => {
    const records = [...iterateJsonl<{ n: number }>('{"n":1}\n{"n":2}')];
    expect(records).toEqual([{ n: 1 }, { n: 2 }]);
  });
});

describe("toJsonl", () => {
  it("serializes records one-per-line with a trailing newline", () => {
    expect(toJsonl([{ a: 1 }, { b: 2 }])).toBe('{"a":1}\n{"b":2}\n');
  });

  it("returns an empty string for no records", () => {
    expect(toJsonl([])).toBe("");
  });

  it("round-trips through parseJsonl", () => {
    const records = [
      { id: "x", tags: ["a", "b"] },
      { id: "y", tags: [] },
    ];
    expect(parseJsonl(toJsonl(records))).toEqual(records);
  });
});
