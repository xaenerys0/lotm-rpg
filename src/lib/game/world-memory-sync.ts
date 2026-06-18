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
export function legacyKey(l: CharacterLegacy): string {
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

/** The keys this device has previously seen in the cloud (for delete detection). */
export interface WorldMemorySynced {
  legacyKeys: ReadonlySet<string>;
  echoIds: ReadonlySet<string>;
}

/**
 * Pure merge of local and cloud world memory. Legacies and echoes are
 * append-mostly world records, so shared entries are a de-duplicated union
 * (legacies keyed by character+timestamp, echoes by id) — neither side's
 * additions are lost. But a local-only entry is ambiguous: a fresh addition not
 * yet pushed, or one REMOVED elsewhere (a full-timeline restart wipes both). The
 * `synced` keys (what this device last saw in the cloud) disambiguate — a
 * local-only entry that was synced before is a remote removal (drop it, so a
 * restart on one device propagates instead of being resurrected by union); one
 * never synced is a genuine local addition (keep + push it).
 */
export function reconcileWorldMemory(
  local: WorldMemory,
  remote: WorldMemory,
  synced: WorldMemorySynced = { legacyKeys: new Set(), echoIds: new Set() },
): WorldMemory {
  const legacies = new Map<string, CharacterLegacy>();
  for (const l of remote.legacies) legacies.set(legacyKey(l), l);
  for (const l of local.legacies) {
    const key = legacyKey(l);
    // Keep a local legacy unless it was synced before yet is now gone from the
    // cloud (removed elsewhere). Already-present remote keys stay either way.
    if (legacies.has(key) || !synced.legacyKeys.has(key)) legacies.set(key, l);
  }

  const echoes = new Map<string, TimelineArtifact>();
  for (const e of remote.echoes) echoes.set(e.id, e);
  for (const e of local.echoes) {
    if (echoes.has(e.id) || !synced.echoIds.has(e.id)) echoes.set(e.id, e);
  }

  return {
    legacies: [...legacies.values()],
    echoes: [...echoes.values()],
  };
}
