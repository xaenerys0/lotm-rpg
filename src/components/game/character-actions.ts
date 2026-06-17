import {
  loadActiveSessionId,
  loadSessionIndex,
  saveActiveSessionId,
  saveSessionIndex,
} from "@/lib/react/session-store";
import {
  characterDeletionPlan,
  deleteSessionEntriesRemote,
  type JournalSyncClient,
} from "@/lib/game";
import { createClient } from "@/lib/supabase/client";

// Shared deletion side-effects for a character, used by both the Character
// sheet's danger zone and the Play dashboard's Manage view. Wipes every local
// trace (save, journal, in-progress combat, usage estimate) via
// `characterDeletionPlan`, then best-effort wipes the durable Supabase journal
// rows. Cross-timeline legacies/echoes are world memory and left intact.
//
// Callers own their own list/selection state update; this only performs the
// storage + network cleanup and returns the trimmed session index.
export function purgeCharacter(sessionId: string): string[] {
  const plan = characterDeletionPlan(sessionId, loadSessionIndex());
  try {
    for (const key of plan.removeKeys) localStorage.removeItem(key);
    saveSessionIndex(plan.nextIndex);
    // Reconcile the shared active-character pointer: re-resolve it against the
    // trimmed index (self-heals to the newest remaining save, or null) and write
    // it back, so a deleted character is never left as a dangling pointer.
    saveActiveSessionId(loadActiveSessionId());
  } catch {
    // Storage unavailable — callers still update their in-memory list.
  }
  // Best-effort durable cleanup; offline/signed-out players just keep the rows,
  // which RLS already scopes to them.
  void (async () => {
    try {
      const client = createClient() as unknown as JournalSyncClient;
      await deleteSessionEntriesRemote(client, sessionId);
    } catch {
      // Network/permission failure — non-fatal, the local save is gone.
    }
  })();
  return plan.nextIndex;
}
