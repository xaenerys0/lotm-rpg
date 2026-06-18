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
    select(columns: "data"): PromiseLike<{
      data: { data: Json }[] | null;
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

/** Fetch every cloud save for the caller (RLS already scopes to their rows). */
export async function fetchSessions(client: SessionSyncClient): Promise<GameSession[]> {
  const { data, error } = await client.from("game_sessions").select("data");
  if (error) throw new Error(`Session fetch failed: ${error.message}`);
  if (!data) return [];
  // Drop any row whose payload no longer deserializes (validation is strict)
  // rather than throwing the whole hydrate away for one bad save.
  return data
    .map((row) => deserializeSession(JSON.stringify(row.data)))
    .filter((s): s is GameSession => s !== null);
}

/** The outcome of merging local and cloud saves. */
export interface SessionReconciliation {
  /** Saves to (over)write into localStorage — cloud was newer or local-absent. */
  toWriteLocal: GameSession[];
  /** Saves to push to the cloud — local was newer or cloud-absent. */
  toPushRemote: GameSession[];
  /** Whole merged set (every id, winning copy) — the index after reconcile. */
  merged: GameSession[];
  /** The active character id the cloud asserts, or null to keep the local one. */
  activeId: string | null;
}

/**
 * Pure last-write-wins merge of local and cloud saves, keyed on `updatedAt`.
 * A save present on only one side propagates to the other; a save on both sides
 * resolves to the newer copy (ties keep the cloud copy — the authoritative
 * store). The cloud's active-character pointer wins when it still names a save.
 */
export function reconcile(
  local: readonly GameSession[],
  remote: readonly GameSession[],
  remoteActiveId: string | null,
): SessionReconciliation {
  const localById = new Map(local.map((s) => [s.id, s]));
  const remoteById = new Map(remote.map((s) => [s.id, s]));
  const ids = new Set<string>([...localById.keys(), ...remoteById.keys()]);

  const toWriteLocal: GameSession[] = [];
  const toPushRemote: GameSession[] = [];
  const merged: GameSession[] = [];

  for (const id of ids) {
    const l = localById.get(id);
    const r = remoteById.get(id);
    if (l && !r) {
      toPushRemote.push(l);
      merged.push(l);
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

  const activeId =
    remoteActiveId && remoteById.has(remoteActiveId) ? remoteActiveId : null;

  return { toWriteLocal, toPushRemote, merged, activeId };
}
