"use client";

import { useRef, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES, type GamePreferences } from "@/lib/game";
import { noopSubscribe } from "@/lib/react";
import { loadPreferences } from "./preferences-store";

/**
 * SSR-safe one-time snapshot of the persisted player preferences.
 *
 * Reads `loadPreferences()` once (cached in a ref) through `useSyncExternalStore`
 * with the `DEFAULT_PREFERENCES` server fallback. This is the single shared
 * replacement for the per-component `useRef` + `useSyncExternalStore` boilerplate
 * that previously lived inline in the game loop, the character sheet, the
 * settings panel, and character creation. Using `useSyncExternalStore` (not
 * `useState(loadPreferences())`) is deliberate — it avoids the "frozen snapshot"
 * hydration bug (issues #84/#86) where a client snapshot captured at the
 * hydration render never reflects the real localStorage value.
 *
 * Components that also WRITE preferences (e.g. the settings panel) layer their
 * own override state on top of this read-only snapshot.
 */
export function useStoredPreferences(): GamePreferences {
  const cacheRef = useRef<GamePreferences | null>(null);
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) {
        cacheRef.current = loadPreferences();
      }
      return cacheRef.current;
    },
    () => DEFAULT_PREFERENCES,
  );
}
