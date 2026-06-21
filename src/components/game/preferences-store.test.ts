// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PREFERENCES, PREFERENCES_KEY } from "@/lib/game";

const pushPreferencesToCloud = vi.fn();
vi.mock("./cloud-sync", () => ({
  pushPreferencesToCloud: () => pushPreferencesToCloud(),
}));

import {
  applyContrastPreference,
  loadPreferences,
  savePreferences,
} from "./preferences-store";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.contrast;
  pushPreferencesToCloud.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe("preferences-store load/save", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips saved preferences and mirrors them to the cloud", () => {
    savePreferences({ ...DEFAULT_PREFERENCES, highContrast: true });
    expect(localStorage.getItem(PREFERENCES_KEY)).toBeTruthy();
    expect(pushPreferencesToCloud).toHaveBeenCalledTimes(1);
    expect(loadPreferences().highContrast).toBe(true);
  });

  it("falls back to defaults on a corrupt stored value", () => {
    localStorage.setItem(PREFERENCES_KEY, "{not json");
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("falls back to defaults when storage reads throw", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("still mirrors to the cloud even when the local write throws", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => savePreferences(DEFAULT_PREFERENCES)).not.toThrow();
    expect(pushPreferencesToCloud).toHaveBeenCalledTimes(1);
  });
});

describe("applyContrastPreference", () => {
  it("sets the high-contrast attribute when enabled", () => {
    applyContrastPreference({ ...DEFAULT_PREFERENCES, highContrast: true });
    expect(document.documentElement.dataset.contrast).toBe("high");
  });

  it("clears the attribute when disabled", () => {
    document.documentElement.dataset.contrast = "high";
    applyContrastPreference({ ...DEFAULT_PREFERENCES, highContrast: false });
    expect(document.documentElement.dataset.contrast).toBeUndefined();
  });
});
