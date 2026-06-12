/**
 * Player display preferences (issues #9, #13).
 *
 * The sanity-meter visibility toggle (hidden by default — the player reads
 * their state from CSS effects and unreliable narration) and the
 * high-contrast display mode (brightens text/borders, mutes the decorative
 * atmosphere).
 *
 * Pure functions only — localStorage access lives in the React layer.
 */

export interface GamePreferences {
  /** When true, the numeric sanity meter is shown; otherwise it is hidden. */
  sanityMeterVisible: boolean;
  /** High-contrast display mode (issue #13): applied as `data-contrast="high"`. */
  highContrast: boolean;
}

export const DEFAULT_PREFERENCES: GamePreferences = {
  sanityMeterVisible: false,
  highContrast: false,
};

export function isValidPreferencesShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const p = obj as Record<string, unknown>;
  if (typeof p.sanityMeterVisible !== "boolean") return false;
  // highContrast was added later (issue #13) — older payloads omit it.
  return p.highContrast === undefined || typeof p.highContrast === "boolean";
}

/** Merge a (possibly partial / untrusted) preferences object over the defaults. */
export function mergePreferences(partial: Partial<GamePreferences>): GamePreferences {
  return {
    sanityMeterVisible:
      typeof partial.sanityMeterVisible === "boolean"
        ? partial.sanityMeterVisible
        : DEFAULT_PREFERENCES.sanityMeterVisible,
    highContrast:
      typeof partial.highContrast === "boolean"
        ? partial.highContrast
        : DEFAULT_PREFERENCES.highContrast,
  };
}

export function serializePreferences(prefs: GamePreferences): string {
  return JSON.stringify(prefs);
}

/** Parse stored preferences, falling back to defaults for missing/invalid data. */
export function deserializePreferences(json: string): GamePreferences {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULT_PREFERENCES };
  }
  return mergePreferences(parsed as Partial<GamePreferences>);
}
