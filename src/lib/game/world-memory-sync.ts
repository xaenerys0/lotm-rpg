import type { Database, Json } from "@/lib/types/database";

import { deserializeLegacies, type CharacterLegacy } from "./death";
import { deserializeArtifacts, type TimelineArtifact } from "./echoes";

// ---------------------------------------------------------------------------
// Cross-timeline world-memory persistence to Supabase (cross-device sync)
// ---------------------------------------------------------------------------
//
// Legacies (fallen-character records, LEGACIES_KEY) and echoes (timeline
// artifacts, ECHOES_KEY) deliberately outlive any single character, but were
// browser-only. One row per user holds both as jsonb arrays, read/written
// wholesale. Best-effort and structural-client style, like `journal-sync.ts`.

type MemoryRow = Database["public"]["Tables"]["world_memory"]["Insert"];

/** Both halves of a player's cross-timeline world memory. */
export interface WorldMemory {
  legacies: CharacterLegacy[];
  echoes: TimelineArtifact[];
}

/** Minimal structural slice of a Supabase client used by the world-memory sync. */
export interface WorldMemorySyncClient {
  from(table: "world_memory"): {
    upsert(
      rows: MemoryRow[],
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string } | null }>;
    select(columns: "legacies,echoes"): PromiseLike<{
      data: { legacies: Json; echoes: Json }[] | null;
      error: { message: string } | null;
    }>;
  };
}

/** Stable identity of a legacy (it carries no id): its character + when it fell. */
function legacyKey(l: CharacterLegacy): string {
  return `${l.characterId}:${l.timestamp}`;
}

/** Best-effort upsert of the player's whole world memory (one row). */
export async function pushWorldMemory(
  client: WorldMemorySyncClient,
  userId: string,
  memory: WorldMemory,
): Promise<void> {
  const { error } = await client.from("world_memory").upsert(
    [
      {
        user_id: userId,
        legacies: memory.legacies as unknown as Json,
        echoes: memory.echoes as unknown as Json,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`World-memory sync failed: ${error.message}`);
}

/** Fetch the player's world memory, defaulting either half to empty. */
export async function fetchWorldMemory(
  client: WorldMemorySyncClient,
): Promise<WorldMemory> {
  const { data, error } = await client.from("world_memory").select("legacies,echoes");
  if (error) throw new Error(`World-memory fetch failed: ${error.message}`);
  const row = data?.[0];
  if (!row) return { legacies: [], echoes: [] };
  return {
    legacies: deserializeLegacies(JSON.stringify(row.legacies)) ?? [],
    echoes: deserializeArtifacts(JSON.stringify(row.echoes)) ?? [],
  };
}

/**
 * Pure union merge of local and cloud world memory. Legacies and echoes are
 * append-mostly world records, so the merge is a de-duplicated union (legacies
 * keyed by character+timestamp, echoes by id) — neither side's history is lost,
 * and a full-timeline restart (which clears both locally) re-propagates only
 * after the cleared state is itself pushed.
 */
export function reconcileWorldMemory(
  local: WorldMemory,
  remote: WorldMemory,
): WorldMemory {
  const legacies = new Map<string, CharacterLegacy>();
  for (const l of remote.legacies) legacies.set(legacyKey(l), l);
  for (const l of local.legacies) legacies.set(legacyKey(l), l);

  const echoes = new Map<string, TimelineArtifact>();
  for (const e of remote.echoes) echoes.set(e.id, e);
  for (const e of local.echoes) echoes.set(e.id, e);

  return {
    legacies: [...legacies.values()],
    echoes: [...echoes.values()],
  };
}
