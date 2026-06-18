import type { Database, Json } from "@/lib/types/database";

import { deserializeSession, serializeSession } from "./session";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Character-save persistence to Supabase (cross-device sync)
// ---------------------------------------------------------------------------
//
// Until now the whole GameSession lived ONLY in localStorage, so a wiped
// browser or a second device lost every character. Supabase is now the durable,
// authoritative copy: the full serialized session as a jsonb `data` column,
// owner-scoped by RLS. localStorage stays as the fast offline cache; on entry
// the two are reconciled (last-write-wins by `updatedAt`), exactly mirroring the
// best-effort, structural-client style of `journal-sync.ts`.
//
// The local session index and active pointer collapse into this table: the
// index is the rows ordered by `updated_at`, the active pointer is the single
// `is_active` row (flipped atomically by the `set_active_session` RPC).

type SessionRow = Database["public"]["Tables"]["game_sessions"]["Insert"];

/** Minimal structural slice of a Supabase client used by the session sync. */
export interface SessionSyncClient {
  from(table: "game_sessions"): {
    upsert(
      rows: SessionRow[],
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string } | null }>;
    delete(): {
      eq(column: "id", value: string): PromiseLike<{ error: { message: string } | null }>;
    };
    select(columns: "data,is_active"): PromiseLike<{
      data: { data: Json; is_active: boolean }[] | null;
      error: { message: string } | null;
    }>;
  };
  rpc(
    fn: "set_active_session",
    args: { p_id: string },
  ): PromiseLike<{ error: { message: string } | null }>;
}

/** Map a session onto its table row (the full save lives in the jsonb `data`). */
export function toSessionRow(
  session: GameSession,
  userId: string,
  isActive: boolean,
): SessionRow {
  return {
    id: session.id,
    user_id: userId,
    // The save is plain JSON; round-trip through the serializer so the stored
    // shape is exactly what `deserializeSession` validates on the way back.
    data: JSON.parse(serializeSession(session)) as Json,
    is_active: isActive,
    updated_at: new Date(session.updatedAt).toISOString(),
  };
}

/** Best-effort upsert of one or more saves (idempotent by id). */
export async function pushSessions(
  client: SessionSyncClient,
  userId: string,
  sessions: readonly GameSession[],
  activeId: string | null = null,
): Promise<void> {
  if (sessions.length === 0) return;
  const { error } = await client.from("game_sessions").upsert(
    sessions.map((s) => toSessionRow(s, userId, s.id === activeId)),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Session sync failed: ${error.message}`);
}

/** Delete one save remotely (character removal). RLS scopes it to the caller. */
export async function deleteSessionRemote(
  client: SessionSyncClient,
  sessionId: string,
): Promise<void> {
  const { error } = await client.from("game_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(`Session delete failed: ${error.message}`);
}

/** Make one save the caller's active character (atomic, single-active RPC). */
export async function setActiveRemote(
  client: SessionSyncClient,
  sessionId: string,
): Promise<void> {
  const { error } = await client.rpc("set_active_session", { p_id: sessionId });
  if (error) throw new Error(`Active session sync failed: ${error.message}`);
}

/** The caller's cloud saves plus which one the cloud marks active. */
export interface FetchedSessions {
  sessions: GameSession[];
  /** The id of the single `is_active` row, or null when none is flagged. */
  activeId: string | null;
}

/** Fetch every cloud save for the caller (RLS already scopes to their rows). */
export async function fetchSessions(client: SessionSyncClient): Promise<FetchedSessions> {
  const { data, error } = await client.from("game_sessions").select("data,is_active");
  if (error) throw new Error(`Session fetch failed: ${error.message}`);
  if (!data) return { sessions: [], activeId: null };
  const sessions: GameSession[] = [];
  let activeId: string | null = null;
  for (const row of data) {
    // Drop any row whose payload no longer deserializes (validation is strict)
    // rather than throwing the whole hydrate away for one bad save.
    const session = deserializeSession(JSON.stringify(row.data));
    if (!session) continue;
    sessions.push(session);
    if (row.is_active) activeId = session.id;
  }
  return { sessions, activeId };
}

/** The outcome of merging local and cloud saves. */
export interface SessionReconciliation {
  /** Saves to (over)write into localStorage — cloud was newer or local-absent. */
  toWriteLocal: GameSession[];
  /** Saves to push to the cloud — local was newer or cloud-absent and new. */
  toPushRemote: GameSession[];
  /** Save ids to remove locally — they were deleted in the cloud (tombstone). */
  toDeleteLocal: string[];
  /** Whole merged set (every surviving id, winning copy) — the rebuilt index. */
  merged: GameSession[];
  /** The active character id the cloud asserts, or null to keep the local one. */
  activeId: string | null;
}

/**
 * Pure last-write-wins merge of local and cloud saves, keyed on `updatedAt`.
 * A save on both sides resolves to the newer copy (ties keep the cloud copy);
 * a cloud-only save is written locally. A LOCAL-ONLY save is ambiguous: it is
 * either a brand-new save not yet pushed, or one that was deleted on another
 * device. `syncedIds` (the ids this device has previously seen in the cloud)
 * disambiguates — a local-only id that was synced before is a remote DELETE
 * (drop it locally, never resurrect it); one never synced is genuinely new
 * (push it). The cloud's active-character pointer wins when it names a survivor.
 */
export function reconcile(
  local: readonly GameSession[],
  remote: readonly GameSession[],
  remoteActiveId: string | null,
  syncedIds: ReadonlySet<string> = new Set(),
): SessionReconciliation {
  const localById = new Map(local.map((s) => [s.id, s]));
  const remoteById = new Map(remote.map((s) => [s.id, s]));
  const ids = new Set<string>([...localById.keys(), ...remoteById.keys()]);

  const toWriteLocal: GameSession[] = [];
  const toPushRemote: GameSession[] = [];
  const toDeleteLocal: string[] = [];
  const merged: GameSession[] = [];

  for (const id of ids) {
    const l = localById.get(id);
    const r = remoteById.get(id);
    if (l && !r) {
      if (syncedIds.has(id)) {
        // Previously synced, now gone from the cloud → deleted elsewhere.
        toDeleteLocal.push(id);
      } else {
        toPushRemote.push(l);
        merged.push(l);
      }
    } else if (r && !l) {
      toWriteLocal.push(r);
      merged.push(r);
    } else if (l && r) {
      if (l.updatedAt > r.updatedAt) {
        toPushRemote.push(l);
        merged.push(l);
      } else if (r.updatedAt > l.updatedAt) {
        toWriteLocal.push(r);
        merged.push(r);
      } else {
        merged.push(r);
      }
    }
  }

  // Newest first, so the merged set doubles as the rebuilt session index.
  merged.sort((a, b) => b.updatedAt - a.updatedAt);

  const mergedIds = new Set(merged.map((s) => s.id));
  const activeId =
    remoteActiveId && mergedIds.has(remoteActiveId) ? remoteActiveId : null;

  return { toWriteLocal, toPushRemote, toDeleteLocal, merged, activeId };
}
