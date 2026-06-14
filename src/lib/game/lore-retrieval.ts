import type { RetrievedLoreChunk } from "@/lib/ai";
import type { RetrievedChunk } from "@/lib/lore";
import type { GameSession } from "./types";

// Per-turn RAG query construction + chunk shaping (the pure half of wiring
// retrieval into the game loop — the network glue lives in the component layer,
// `components/game/lore-retrieval-client.ts`, which is outside the coverage
// mandate). Kept pure and deterministic so the query the narrator's grounding
// depends on is testable.

/** Cap on the assembled query text so the embedding call stays focused/cheap. */
export const RETRIEVAL_QUERY_CHAR_CAP = 800;

/**
 * Build the retrieval query for the upcoming turn from what the scene is
 * actually about: the current location, the most recent narrative beat, the
 * active quests, and who is present — plus the opening beat on the very first
 * turn (when there is no history yet). This is what gets embedded and matched
 * against the corpus, so it should describe the present scene, not the whole
 * chronicle. Capped to {@link RETRIEVAL_QUERY_CHAR_CAP} characters.
 */
export function buildRetrievalQuery(session: GameSession): string {
  const gs = session.gameState;
  const parts: string[] = [gs.location];

  const lastTurn = session.memory.immediateTurns.at(-1);
  if (lastTurn?.aiResponse?.narrative) {
    parts.push(lastTurn.aiResponse.narrative);
  } else if (gs.openingBeat) {
    // First turn: no history yet — seed the query from the opening beat.
    parts.push(gs.openingBeat);
  }

  if (gs.activeQuests.length > 0) parts.push(gs.activeQuests.join(". "));
  if (gs.npcsPresent.length > 0) parts.push(gs.npcsPresent.join(", "));

  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join("\n")
    .slice(0, RETRIEVAL_QUERY_CHAR_CAP);
}

/**
 * Narrow retrieved corpus rows to the structural slice the prompt assembler
 * consumes (`RetrievedLoreChunk`), dropping the retrieval-only ranking/metadata
 * fields so the AI layer stays decoupled from the retrieval module.
 */
export function toRetrievedLoreChunks(
  chunks: readonly RetrievedChunk[],
): RetrievedLoreChunk[] {
  return chunks.map((c) => ({
    id: c.id,
    title: c.title,
    content: c.content,
    source: c.source,
    token_count: c.token_count,
  }));
}
