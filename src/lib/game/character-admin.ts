import {
  COMBAT_KEY_PREFIX,
  JOURNAL_KEY_PREFIX,
  SESSION_KEY_PREFIX,
  USAGE_KEY_PREFIX,
} from "./constants";

// ---------------------------------------------------------------------------
// Character management (deletion)
// ---------------------------------------------------------------------------
//
// A "character" is a localStorage `GameSession` plus the per-session data that
// hangs off its id (journal, in-progress combat, token-usage estimate) and the
// durable journal rows mirrored to Supabase. Removing a character must clean up
// all of it. The deletion PLAN is computed here as a pure function so it is
// fully testable; the React layer executes the plan against localStorage and
// the Supabase client (see `deleteSessionEntriesRemote` in journal-sync.ts).
//
// Intentionally NOT removed: cross-timeline world memory — legacies
// (`LEGACIES_KEY`) and echoes (`ECHOES_KEY`) are global, not session-scoped, so
// deleting one character never erases the world's memory of the fallen. A full
// timeline restart is the separate, explicit path that wipes those.

/** The full set of changes needed to delete one character's local data. */
export interface CharacterDeletionPlan {
  /** localStorage keys to remove for this character. */
  removeKeys: string[];
  /** The session index with this character's id removed. */
  nextIndex: string[];
}

/**
 * Compute the localStorage cleanup for deleting one character. Pure: the caller
 * performs the actual `removeItem`/`setItem` and the best-effort remote delete.
 */
export function characterDeletionPlan(
  sessionId: string,
  sessionIndex: readonly string[],
): CharacterDeletionPlan {
  return {
    removeKeys: [
      SESSION_KEY_PREFIX + sessionId,
      JOURNAL_KEY_PREFIX + sessionId,
      COMBAT_KEY_PREFIX + sessionId,
      USAGE_KEY_PREFIX + sessionId,
    ],
    nextIndex: sessionIndex.filter((id) => id !== sessionId),
  };
}
