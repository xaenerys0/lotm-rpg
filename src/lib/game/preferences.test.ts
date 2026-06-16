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
    it("hides the sanity meter and normal contrast by default", () => {
      expect(DEFAULT_PREFERENCES.sanityMeterVisible).toBe(false);
      expect(DEFAULT_PREFERENCES.digestionMeterVisible).toBe(false);
      expect(DEFAULT_PREFERENCES.highContrast).toBe(false);
      expect(DEFAULT_PREFERENCES.sceneArtEnabled).toBe(false);
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
      expect(
        isValidPreferencesShape({ sanityMeterVisible: true, highContrast: "x" }),
      ).toBe(false);
      expect(
        isValidPreferencesShape({ sanityMeterVisible: true, sceneArtEnabled: "x" }),
      ).toBe(false);
    });

    it("accepts legacy payloads without highContrast (issue #13)", () => {
      expect(isValidPreferencesShape({ sanityMeterVisible: true })).toBe(true);
      expect(
        isValidPreferencesShape({ sanityMeterVisible: true, highContrast: true }),
      ).toBe(true);
    });

    it("treats digestionMeterVisible as legacy-optional but type-checked (issue #95)", () => {
      // Absent on legacy payloads — still valid.
      expect(isValidPreferencesShape({ sanityMeterVisible: true })).toBe(true);
      // Present and well-typed — valid.
      expect(
        isValidPreferencesShape({
          sanityMeterVisible: true,
          digestionMeterVisible: true,
        }),
      ).toBe(true);
      // Present but wrong type — rejected.
      expect(
        isValidPreferencesShape({
          sanityMeterVisible: true,
          digestionMeterVisible: "x",
        }),
      ).toBe(false);
    });
  });

  describe("mergePreferences", () => {
    it("keeps provided booleans and defaults the rest", () => {
      expect(mergePreferences({ sanityMeterVisible: true })).toEqual({
        sanityMeterVisible: true,
        digestionMeterVisible: false,
        highContrast: false,
        sceneArtEnabled: false,
      });
      expect(
        mergePreferences({
          highContrast: true,
          sceneArtEnabled: true,
          digestionMeterVisible: true,
        }),
      ).toEqual({
        sanityMeterVisible: false,
        digestionMeterVisible: true,
        highContrast: true,
        sceneArtEnabled: true,
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
      const prefs = {
        sanityMeterVisible: true,
        digestionMeterVisible: true,
        highContrast: true,
        sceneArtEnabled: true,
      };
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
