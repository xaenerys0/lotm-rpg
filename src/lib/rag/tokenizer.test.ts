import { describe, expect, it } from "vitest";

import { countTokens } from "./tokenizer";

describe("countTokens", () => {
  it("returns 0 for empty input", () => {
    expect(countTokens("")).toBe(0);
  });

  it("counts tokens for non-empty text", () => {
    expect(countTokens("Hello world")).toBeGreaterThan(0);
  });

  it("grows monotonically with more text", () => {
    const short = countTokens("The Fool");
    const long = countTokens("The Fool who is not a Fool sits above the grey fog.");
    expect(long).toBeGreaterThan(short);
  });
});
