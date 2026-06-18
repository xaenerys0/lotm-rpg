import type { Database, Json } from "@/lib/types/database";

import { mergePreferences, type GamePreferences } from "./preferences";

// ---------------------------------------------------------------------------
// Preference + hint-dismissal persistence to Supabase (cross-device sync)
// ---------------------------------------------------------------------------
//
// Display preferences (PREFERENCES_KEY) and one-shot hint dismissals
// (lotm-rpg-hint-*) were browser-only, so settings did not follow a player
// across devices. One row per user holds the GamePreferences object plus the
// set of dismissed hint ids. Best-effort, structural-client style.

type PreferencesRow = Database["public"]["Tables"]["user_preferences"]["Insert"];

/** A player's synced preferences and the hint ids they have dismissed. */
export interface SyncedPreferences {
  preferences: GamePreferences;
  dismissedHints: string[];
}

/** Minimal structural slice of a Supabase client used by the preferences sync. */
export interface PreferencesSyncClient {
  from(table: "user_preferences"): {
    upsert(
      rows: PreferencesRow[],
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string } | null }>;
    select(columns: "preferences,dismissed_hints"): PromiseLike<{
      data: { preferences: Json; dismissed_hints: string[] }[] | null;
      error: { message: string } | null;
    }>;
  };
}

/** Best-effort upsert of the player's preferences row. */
export async function pushPreferences(
  client: PreferencesSyncClient,
  userId: string,
  synced: SyncedPreferences,
): Promise<void> {
  const { error } = await client.from("user_preferences").upsert(
    [
      {
        user_id: userId,
        preferences: synced.preferences as unknown as Json,
        dismissed_hints: synced.dismissedHints,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Preferences sync failed: ${error.message}`);
}

/** Fetch the player's preferences, falling back to defaults when absent. */
export async function fetchPreferences(
  client: PreferencesSyncClient,
): Promise<SyncedPreferences> {
  const { data, error } = await client
    .from("user_preferences")
    .select("preferences,dismissed_hints");
  if (error) throw new Error(`Preferences fetch failed: ${error.message}`);
  const row = data?.[0];
  if (!row) return { preferences: mergePreferences({}), dismissedHints: [] };
  return {
    // mergePreferences hardens a partial/untrusted payload against the defaults.
    preferences: mergePreferences((row.preferences ?? {}) as Partial<GamePreferences>),
    dismissedHints: Array.isArray(row.dismissed_hints) ? row.dismissed_hints : [],
  };
}

/**
 * Pure merge of local and cloud preferences. Preferences resolve to the cloud
 * copy hardened over the local one (the latest Settings edit anywhere wins via
 * the push); dismissed hints are a union (a hint dismissed on any device stays
 * dismissed everywhere — one-shot pointers never un-dismiss).
 */
export function reconcilePreferences(
  local: SyncedPreferences,
  remote: SyncedPreferences,
): SyncedPreferences {
  return {
    preferences: mergePreferences({ ...local.preferences, ...remote.preferences }),
    dismissedHints: [...new Set([...local.dismissedHints, ...remote.dismissedHints])],
  };
}
