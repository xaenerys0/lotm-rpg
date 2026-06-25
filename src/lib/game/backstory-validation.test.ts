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

  // --- Tier / role title claims ---

  it("flags 'Saint' claim when startSequence is above the Saint threshold", () => {
    const result = validateBackstorySequence("I am a Saint of the Lord of Storms.", 9);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].claim.toLowerCase()).toBe("saint");
  });

  it("allows 'Saint' claim when startSequence is exactly at the Saint threshold (4)", () => {
    const result = validateBackstorySequence("I am recognised as a Saint.", 4);
    expect(result.valid).toBe(true);
  });

  it("flags 'Saint' claim when startSequence is 5 (just above the threshold)", () => {
    const result = validateBackstorySequence("People call me a Saint.", 5);
    expect(result.valid).toBe(false);
    expect(result.violations[0].reason).toContain("Sequence 4 or lower");
  });

  it("flags plural 'Saints' the same as singular", () => {
    const result = validateBackstorySequence(
      "I walk among the Saints of the Fifth Epoch.",
      9,
    );
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim.toLowerCase()).toBe("saints");
  });

  it("does NOT flag 'saintly' (word-boundary guard)", () => {
    const result = validateBackstorySequence("My master displayed saintly patience.", 9);
    expect(result.valid).toBe(true);
  });

  it("flags 'Angel' claim when startSequence is above the Angel threshold", () => {
    const result = validateBackstorySequence("I have reached the level of an Angel.", 5);
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim.toLowerCase()).toBe("angel");
  });

  it("allows 'Angel' claim when startSequence is exactly 2", () => {
    const result = validateBackstorySequence("I rose to become an Angel.", 2);
    expect(result.valid).toBe(true);
  });

  it("does NOT flag 'angelic' (word-boundary guard)", () => {
    const result = validateBackstorySequence("She possessed an angelic voice.", 9);
    expect(result.valid).toBe(true);
  });

  it("flags 'Demigod' claim when startSequence is above the Demigod threshold", () => {
    const result = validateBackstorySequence("I am a Demigod of the Fate pathway.", 7);
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim.toLowerCase()).toBe("demigod");
  });

  it("flags 'King of Angels' claim when startSequence is above the threshold", () => {
    const result = validateBackstorySequence(
      "I became King of Angels in a past life.",
      5,
    );
    expect(result.valid).toBe(false);
    // Must be exactly 1 — the angel pattern must not double-match "angels" inside the phrase.
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].claim.toLowerCase()).toContain("king of angel");
  });

  it("flags 'True God' claim at any realistic starting sequence", () => {
    const result = validateBackstorySequence("I once witnessed a True God descend.", 9);
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim.toLowerCase()).toContain("true god");
  });

  it("flags 'Above the Sequence' claim at any realistic starting sequence", () => {
    const result = validateBackstorySequence(
      "My ancestor was said to be Above the Sequence.",
      5,
    );
    expect(result.valid).toBe(false);
    expect(result.violations[0].claim.toLowerCase()).toContain("above the sequence");
  });

  it("tier claims are case-insensitive", () => {
    expect(validateBackstorySequence("I AM A SAINT.", 9).valid).toBe(false);
    expect(validateBackstorySequence("i am an angel.", 9).valid).toBe(false);
    expect(validateBackstorySequence("A TRUE GOD blessed me.", 9).valid).toBe(false);
  });

  it("reports both explicit numeric and tier violations when both appear", () => {
    const result = validateBackstorySequence(
      "I hold Sequence 3 power and am known as a Saint.",
      9,
    );
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });
});
