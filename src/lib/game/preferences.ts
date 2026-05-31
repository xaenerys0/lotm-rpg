/**
 * Player display preferences (issue #9).
 *
 * Currently just the sanity-meter visibility toggle: by default the sanity
 * meter is hidden and the player reads their state from the UI's CSS effects
 * and unreliable narration. Players who prefer strategic management can reveal
 * the numeric meter.
 *
 * Pure functions only — localStorage access lives in the React layer.
 */

export interface GamePreferences {
  /** When true, the numeric sanity meter is shown; otherwise it is hidden. */
  sanityMeterVisible: boolean;
}

export const DEFAULT_PREFERENCES: GamePreferences = {
  sanityMeterVisible: false,
};

export function isValidPreferencesShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const p = obj as Record<string, unknown>;
  return typeof p.sanityMeterVisible === "boolean";
}

/** Merge a (possibly partial / untrusted) preferences object over the defaults. */
export function mergePreferences(partial: Partial<GamePreferences>): GamePreferences {
  return {
    sanityMeterVisible:
      typeof partial.sanityMeterVisible === "boolean"
        ? partial.sanityMeterVisible
        : DEFAULT_PREFERENCES.sanityMeterVisible,
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
