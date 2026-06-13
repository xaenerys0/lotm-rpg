"use client";

import { useEffect } from "react";

import { applyContrastPreference, loadPreferences } from "./preferences-store";

/**
 * Applies persisted display preferences that live outside React's tree —
 * currently the high-contrast attribute on <html> (issue #13). Mounted once
 * in the game layout; renders nothing.
 */
export function PreferenceEffects() {
  useEffect(() => {
    applyContrastPreference(loadPreferences());
  }, []);
  return null;
}
