import { describe, expect, it } from "vitest";

import { transformationRiteFor, TRANSFORMATION_RITES } from "./transformation-rites";

describe("TRANSFORMATION_RITES", () => {
  it("every rite is well-formed", () => {
    for (const rite of TRANSFORMATION_RITES) {
      expect(Number.isInteger(rite.pathwayId)).toBe(true);
      expect(rite.sequenceLevel).toBeGreaterThanOrEqual(0);
      expect(rite.sequenceLevel).toBeLessThanOrEqual(9);
      expect(rite.riteName.length).toBeGreaterThan(0);
      expect(rite.prompt.length).toBeGreaterThan(0);
      expect(Array.isArray(rite.demeanorSuggestions)).toBe(true);
      expect(typeof rite.suggestsRename).toBe("boolean");
      expect(typeof rite.pretickRecognitionGap).toBe("boolean");
    }
  });

  it("seeds the Demoness Seq 7 'Witch' rite", () => {
    const witch = transformationRiteFor(15, 7);
    expect(witch?.riteName).toBe("Witch");
    expect(witch?.suggestsRename).toBe(true);
    expect(witch?.pretickRecognitionGap).toBe(true);
    expect(witch?.demeanorSuggestions[0].label).toMatch(/allure/i);
  });
});

describe("transformationRiteFor", () => {
  it("returns undefined when no rite fires at that rung", () => {
    expect(transformationRiteFor(15, 6)).toBeUndefined();
    expect(transformationRiteFor(1, 7)).toBeUndefined();
  });
});
