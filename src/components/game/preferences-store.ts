import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  deserializePreferences,
  serializePreferences,
  type GamePreferences,
} from "@/lib/game";

/**
 * localStorage glue for player preferences. Kept in the component layer (the
 * `@/lib/game` preferences module stays pure) and shared by every consumer so
 * the read/write of `PREFERENCES_KEY` lives in exactly one place.
 */

export function loadPreferences(): GamePreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return deserializePreferences(raw);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: GamePreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, serializePreferences(prefs));
  } catch {
    // Storage unavailable — preference simply won't persist.
  }
}

/** Reflect the high-contrast preference onto <html> (issue #13). */
export function applyContrastPreference(prefs: GamePreferences): void {
  try {
    if (prefs.highContrast) {
      document.documentElement.dataset.contrast = "high";
    } else {
      delete document.documentElement.dataset.contrast;
    }
  } catch {
    // No DOM (SSR) — the PreferenceEffects mount applies it client-side.
  }
}
