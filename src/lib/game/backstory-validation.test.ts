import { describe, expect, it } from "vitest";
import {
  validateBackstorySequence,
  type BackstoryValidationResult,
} from "./backstory-validation";

describe("validateBackstorySequence", () => {
  it("returns valid for a clean backstory with no sequence claims", () => {
    const result = validateBackstorySequence(
      "I work as a newspaper writer in Tingen City.",
      9,
    );
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("returns valid when the claimed sequence equals the start sequence", () => {
    const result = validateBackstorySequence("I am a Sequence 8 Beyonder.", 8);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("returns valid for a higher-numbered (less powerful) claim", () => {
    const result = validateBackstorySequence("I started as Sequence 9 and survived.", 7);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("returns invalid for a claim to a more powerful sequence", () => {
    const result = validateBackstorySequence("I am already a Sequence 6 Beyonder.", 8);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].claim).toBe("Sequence 6");
  });

  it("reports all violations when multiple overpowered claims appear", () => {
    const result = validateBackstorySequence(
      "I am a Sequence 5 master and have Seq 4 knowledge.",
      9,
    );
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].claim).toBe("Sequence 5");
    expect(result.violations[1].claim).toBe("Seq 4");
  });

  it("matches case-insensitively", () => {
    const result = validateBackstorySequence("I am a sequence 6 veteran.", 9);
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim).toBe("sequence 6");
  });

  it("matches hyphenated form (Seq-6)", () => {
    const result = validateBackstorySequence("I mastered Seq-6 long ago.", 9);
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim).toBe("Seq-6");
  });

  it("does not flag 'Sequence 10' as a violation (multi-digit capture)", () => {
    // Regression: the old regex (\d) would match "Sequence 1" out of "Sequence 10",
    // giving claimed=1 and falsely blocking a valid backstory.
    const result = validateBackstorySequence(
      "I once read about Sequence 10 phenomena.",
      9,
    );
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("does not throw on a very long backstory", () => {
    const longBackground = "I am a Sequence 9 adventurer. ".repeat(500);
    expect(() => validateBackstorySequence(longBackground, 9)).not.toThrow();
    const result = validateBackstorySequence(longBackground, 9);
    expect(result.valid).toBe(true);
  });

  it("returns valid for an empty backstory", () => {
    const result = validateBackstorySequence("", 9);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("result type satisfies BackstoryValidationResult shape", () => {
    const result: BackstoryValidationResult = validateBackstorySequence(
      "Seq 5 veteran here.",
      9,
    );
    expect(typeof result.valid).toBe("boolean");
    expect(Array.isArray(result.violations)).toBe(true);
  });
});
