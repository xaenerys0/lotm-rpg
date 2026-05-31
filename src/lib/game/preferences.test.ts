import { describe, it, expect } from "vitest";
import {
  DEFAULT_PREFERENCES,
  isValidPreferencesShape,
  mergePreferences,
  serializePreferences,
  deserializePreferences,
} from "./preferences";

describe("preferences", () => {
  describe("DEFAULT_PREFERENCES", () => {
    it("hides the sanity meter by default", () => {
      expect(DEFAULT_PREFERENCES.sanityMeterVisible).toBe(false);
    });
  });

  describe("isValidPreferencesShape", () => {
    it("accepts a well-formed object", () => {
      expect(isValidPreferencesShape({ sanityMeterVisible: true })).toBe(true);
      expect(isValidPreferencesShape({ sanityMeterVisible: false })).toBe(true);
    });

    it("rejects non-objects and arrays", () => {
      expect(isValidPreferencesShape(null)).toBe(false);
      expect(isValidPreferencesShape("nope")).toBe(false);
      expect(isValidPreferencesShape(42)).toBe(false);
      expect(isValidPreferencesShape([])).toBe(false);
    });

    it("rejects objects with the wrong field type", () => {
      expect(isValidPreferencesShape({ sanityMeterVisible: "yes" })).toBe(false);
      expect(isValidPreferencesShape({})).toBe(false);
    });
  });

  describe("mergePreferences", () => {
    it("keeps a provided boolean", () => {
      expect(mergePreferences({ sanityMeterVisible: true })).toEqual({
        sanityMeterVisible: true,
      });
    });

    it("falls back to the default for a missing/invalid field", () => {
      expect(mergePreferences({})).toEqual(DEFAULT_PREFERENCES);
      expect(
        mergePreferences({ sanityMeterVisible: "x" } as unknown as {
          sanityMeterVisible: boolean;
        }),
      ).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe("serialize / deserialize", () => {
    it("round-trips preferences", () => {
      const prefs = { sanityMeterVisible: true };
      expect(deserializePreferences(serializePreferences(prefs))).toEqual(prefs);
    });

    it("falls back to defaults on invalid JSON", () => {
      expect(deserializePreferences("{not json")).toEqual(DEFAULT_PREFERENCES);
    });

    it("falls back to defaults on non-object JSON", () => {
      expect(deserializePreferences("42")).toEqual(DEFAULT_PREFERENCES);
      expect(deserializePreferences("[]")).toEqual(DEFAULT_PREFERENCES);
      expect(deserializePreferences("null")).toEqual(DEFAULT_PREFERENCES);
    });

    it("merges partial stored objects over the defaults", () => {
      expect(deserializePreferences("{}")).toEqual(DEFAULT_PREFERENCES);
    });
  });
});
