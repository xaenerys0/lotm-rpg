import { describe, expect, it } from "vitest";

import {
  addUsage,
  DEFAULT_TOKEN_RATES,
  deserializeUsage,
  emptyUsage,
  estimateSessionCost,
  formatTokenCount,
  formatUsage,
  serializeUsage,
} from "./usage";

describe("addUsage", () => {
  it("accumulates turns and token counts immutably", () => {
    const start = emptyUsage();
    const once = addUsage(start, { promptTokens: 1000, outputTokens: 200 });
    const twice = addUsage(once, { promptTokens: 500, outputTokens: 100 });
    expect(start).toEqual({ turns: 0, promptTokens: 0, outputTokens: 0 });
    expect(twice).toEqual({ turns: 2, promptTokens: 1500, outputTokens: 300 });
  });

  it("ignores negative deltas rather than shrinking the tally", () => {
    const usage = addUsage(emptyUsage(), { promptTokens: -50, outputTokens: -1 });
    expect(usage).toEqual({ turns: 1, promptTokens: 0, outputTokens: 0 });
  });
});

describe("estimateSessionCost", () => {
  it("prices input and output sides at the given per-million rates", () => {
    const usage = { turns: 1, promptTokens: 1_000_000, outputTokens: 500_000 };
    expect(estimateSessionCost(usage, { inputPerMillion: 2, outputPerMillion: 10 })).toBe(
      2 + 5,
    );
    expect(estimateSessionCost(usage)).toBe(
      DEFAULT_TOKEN_RATES.inputPerMillion + DEFAULT_TOKEN_RATES.outputPerMillion / 2,
    );
  });
});

describe("formatTokenCount", () => {
  it("uses compact suffixes", () => {
    expect(formatTokenCount(950)).toBe("950");
    expect(formatTokenCount(12_340)).toBe("12.3k");
    expect(formatTokenCount(2_000_000)).toBe("2.0M");
  });
});

describe("formatUsage", () => {
  it("summarizes tokens and cost, flooring tiny costs", () => {
    expect(formatUsage({ turns: 3, promptTokens: 12_340, outputTokens: 2_100 })).toBe(
      "≈12.3k in / 2.1k out · ~$0.07",
    );
    expect(formatUsage({ turns: 1, promptTokens: 100, outputTokens: 10 })).toContain(
      "<$0.01",
    );
  });
});

describe("serializeUsage / deserializeUsage", () => {
  it("round-trips a valid tally", () => {
    const usage = { turns: 5, promptTokens: 100, outputTokens: 20 };
    expect(deserializeUsage(serializeUsage(usage))).toEqual(usage);
  });

  it("rejects malformed payloads", () => {
    expect(deserializeUsage("not json")).toBeNull();
    expect(deserializeUsage("[]")).toBeNull();
    expect(deserializeUsage('{"turns":1,"promptTokens":-2,"outputTokens":0}')).toBeNull();
    expect(
      deserializeUsage('{"turns":1,"promptTokens":"x","outputTokens":0}'),
    ).toBeNull();
  });
});
