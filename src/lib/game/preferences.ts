/**
 * Player display preferences (issues #9, #13).
 *
 * The sanity-meter visibility toggle (hidden by default — the player reads
 * their state from CSS effects and unreliable narration) and the
 * high-contrast display mode (brightens text/borders, mutes the decorative
 * atmosphere). Plus `narrativeVerbosity` — the player's chosen narration
 * length, the one preference that reaches the AI prompt (as a directive).
 *
 * Pure functions only — localStorage access lives in the React layer.
 */

import { isNarrativeVerbosity, type NarrativeVerbosity } from "@/lib/ai";

export interface GamePreferences {
  /** When true, the numeric sanity meter is shown; otherwise it is hidden. */
  sanityMeterVisible: boolean;
  /**
   * When true (and the Acting Method has been discovered), the numeric
   * digestion meter + alignment readouts are shown (issue #95). Mirrors
   * `sanityMeterVisible`: off by default, and inert until discovery — pre-
   * discovery the digestion mechanic stays hidden regardless.
   */
  digestionMeterVisible: boolean;
  /** High-contrast display mode (issue #13): applied as `data-contrast="high"`. */
  highContrast: boolean;
  /** AI scene art for key moments (issue #20). Opt-in — images cost real money. */
  sceneArtEnabled: boolean;
  /**
   * Movement realism (issue #101). When true (default), the narrator is blocked
   * from teleporting the character across the map — cross-city moves are the
   * player's deliberate travel-map choice. Turn it off to let the AI relocate
   * you anywhere (the override the gate honours).
   */
  movementGateEnabled: boolean;
  /**
   * Player-chosen narration length. "standard" (default) is the baseline — it
   * emits no prompt directive; "concise" tightens the narrative and "rich"
   * makes it fuller. The one preference threaded into the AI `generate()` call.
   */
  narrativeVerbosity: NarrativeVerbosity;
}

export const DEFAULT_PREFERENCES: GamePreferences = {
  sanityMeterVisible: false,
  digestionMeterVisible: false,
  highContrast: false,
  sceneArtEnabled: false,
  movementGateEnabled: true,
  narrativeVerbosity: "standard",
};

export function isValidPreferencesShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const p = obj as Record<string, unknown>;
  if (typeof p.sanityMeterVisible !== "boolean") return false;
  // highContrast (#13), sceneArtEnabled (#20) and digestionMeterVisible (#95)
  // were added later — older payloads omit them.
  if (p.highContrast !== undefined && typeof p.highContrast !== "boolean") return false;
  if (
    p.digestionMeterVisible !== undefined &&
    typeof p.digestionMeterVisible !== "boolean"
  ) {
    return false;
  }
  // movementGateEnabled (#101) was added later — older payloads omit it.
  if (p.movementGateEnabled !== undefined && typeof p.movementGateEnabled !== "boolean") {
    return false;
  }
  // narrativeVerbosity (verbosity preset) was added later — older payloads omit
  // it; when present it must be one of the known enum values.
  if (p.narrativeVerbosity !== undefined && !isNarrativeVerbosity(p.narrativeVerbosity)) {
    return false;
  }
  return p.sceneArtEnabled === undefined || typeof p.sceneArtEnabled === "boolean";
}

/** Merge a (possibly partial / untrusted) preferences object over the defaults. */
export function mergePreferences(partial: Partial<GamePreferences>): GamePreferences {
  return {
    sanityMeterVisible:
      typeof partial.sanityMeterVisible === "boolean"
        ? partial.sanityMeterVisible
        : DEFAULT_PREFERENCES.sanityMeterVisible,
    digestionMeterVisible:
      typeof partial.digestionMeterVisible === "boolean"
        ? partial.digestionMeterVisible
        : DEFAULT_PREFERENCES.digestionMeterVisible,
    highContrast:
      typeof partial.highContrast === "boolean"
        ? partial.highContrast
        : DEFAULT_PREFERENCES.highContrast,
    sceneArtEnabled:
      typeof partial.sceneArtEnabled === "boolean"
        ? partial.sceneArtEnabled
        : DEFAULT_PREFERENCES.sceneArtEnabled,
    movementGateEnabled:
      typeof partial.movementGateEnabled === "boolean"
        ? partial.movementGateEnabled
        : DEFAULT_PREFERENCES.movementGateEnabled,
    narrativeVerbosity: isNarrativeVerbosity(partial.narrativeVerbosity)
      ? partial.narrativeVerbosity
      : DEFAULT_PREFERENCES.narrativeVerbosity,
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
