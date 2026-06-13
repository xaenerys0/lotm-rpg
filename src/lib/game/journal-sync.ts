import type { Database } from "@/lib/types/database";

import type { Journal, JournalAnnotation, JournalEntry } from "./journal";

// ---------------------------------------------------------------------------
// Journal persistence to Supabase (issue #11)
// ---------------------------------------------------------------------------
//
// localStorage is the always-on store (mirrors session persistence); Supabase
// is the durable copy. Per the issue: the narrative log syncs in BATCHES
// (after a turn completes), annotations sync IMMEDIATELY on every edit. All
// functions take a minimal structural client so the module stays pure and
// testable; failures are surfaced to the caller, who treats sync as
// best-effort (the local journal is never blocked on the network).

type EntryRow = Database["public"]["Tables"]["journal_entries"]["Insert"];
type AnnotationRow = Database["public"]["Tables"]["journal_annotations"]["Insert"];

/** Minimal structural slice of a Supabase client used by the journal sync. */
export interface JournalSyncClient {
  from(table: "journal_entries"): {
    upsert(
      rows: EntryRow[],
      options: { onConflict: string },
    ): PromiseLike<{
      error: { message: string } | null;
    }>;
    delete(): {
      eq(
        column: "session_id",
        value: string,
      ): PromiseLike<{
        error: { message: string } | null;
      }>;
    };
  };
  from(table: "journal_annotations"): {
    upsert(
      rows: AnnotationRow[],
      options: { onConflict: string },
    ): PromiseLike<{
      error: { message: string } | null;
    }>;
    delete(): {
      eq(
        column: "id",
        value: string,
      ): PromiseLike<{
        error: { message: string } | null;
      }>;
    };
  };
}

/** Map a journal entry onto its table row. */
export function toEntryRow(
  entry: JournalEntry,
  userId: string,
  sessionId: string,
): EntryRow {
  return {
    id: entry.id,
    user_id: userId,
    session_id: sessionId,
    character_id: entry.characterId,
    character_name: entry.characterName ?? null,
    turn_number: entry.turnNumber,
    event_type: entry.eventType,
    summary: entry.summary,
    narrative: entry.narrative,
    location: entry.location,
    involved_npcs: entry.involvedNpcs,
    arc: entry.arc,
    created_at: new Date(entry.createdAt).toISOString(),
  };
}

/** Map an annotation onto its table row. */
export function toAnnotationRow(
  annotation: JournalAnnotation,
  userId: string,
): AnnotationRow {
  return {
    id: annotation.id,
    user_id: userId,
    entry_id: annotation.entryId,
    text: annotation.text,
    created_at: new Date(annotation.createdAt).toISOString(),
    updated_at: new Date(annotation.updatedAt).toISOString(),
  };
}

/** Batched narrative-log sync: upsert the given entries (idempotent by id). */
export async function syncEntries(
  client: JournalSyncClient,
  userId: string,
  sessionId: string,
  entries: readonly JournalEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await client.from("journal_entries").upsert(
    entries.map((entry) => toEntryRow(entry, userId, sessionId)),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Journal entry sync failed: ${error.message}`);
}

/** Immediate annotation sync: upsert one annotation on every edit. */
export async function syncAnnotation(
  client: JournalSyncClient,
  userId: string,
  annotation: JournalAnnotation,
): Promise<void> {
  const { error } = await client
    .from("journal_annotations")
    .upsert([toAnnotationRow(annotation, userId)], { onConflict: "id" });
  if (error) throw new Error(`Annotation sync failed: ${error.message}`);
}

/** Immediate annotation deletion. */
export async function deleteAnnotationRemote(
  client: JournalSyncClient,
  annotationId: string,
): Promise<void> {
  const { error } = await client
    .from("journal_annotations")
    .delete()
    .eq("id", annotationId);
  if (error) throw new Error(`Annotation delete failed: ${error.message}`);
}

/**
 * Delete every durable journal row for one character (session). Used when a
 * player removes a character (issue: character management) — the local save is
 * wiped separately. RLS scopes the delete to the caller's own rows; the
 * `session_id` filter narrows it to this one character. `journal_annotations`
 * rows cascade via their `entry_id` foreign key. Best-effort from the UI.
 */
export async function deleteSessionEntriesRemote(
  client: JournalSyncClient,
  sessionId: string,
): Promise<void> {
  const { error } = await client
    .from("journal_entries")
    .delete()
    .eq("session_id", sessionId);
  if (error) throw new Error(`Journal session delete failed: ${error.message}`);
}

/** Sync a whole journal (e.g. first login after offline play). */
export async function syncJournal(
  client: JournalSyncClient,
  userId: string,
  sessionId: string,
  journal: Journal,
): Promise<void> {
  await syncEntries(client, userId, sessionId, journal.entries);
  for (const annotation of journal.annotations) {
    await syncAnnotation(client, userId, annotation);
  }
}
