import {
  createEmbeddingProvider,
  type ProviderConfig,
  type RetrievedLoreChunk,
} from "@/lib/ai";
import {
  createSupabaseChunkMatcher,
  concealmentTierForSequence,
  retrieveChunks,
  DEFAULT_EPOCH_ID,
  type SupabaseRpcClient,
} from "@/lib/lore";
import { buildRetrievalQuery, toRetrievedLoreChunks, type GameSession } from "@/lib/game";
import { createBrowserClientSafe } from "@/lib/supabase/client";

// Network glue that wires the gated RAG retrieval path into the game loop
// (issues #63/#64). Pure decisions (query text, chunk shaping, the per-sequence
// concealment ceiling) live under the coverage mandate in `@/lib/game` and
// `@/lib/lore`; this thin shell resolves the embedder + Supabase RPC and is
// BEST-EFFORT — any failure (no embedding endpoint, signed out, offline, an
// empty corpus) resolves to `[]` so a turn is never blocked or broken. The
// curated guardrail lore is always injected regardless; retrieved chunks only
// extend it.

/**
 * Resolve an embedding transport for the query vector, or `null` when none is
 * available. Preference: the operator's hosted Cloudflare Workers AI endpoint
 * (reached through the same-origin proxy, which injects the operator token) when
 * enabled; then a self-hosted operator box; otherwise the player's own Ollama if
 * that is their chat provider. The first two give EVERY signed-in player
 * retrieval; the last only players already running Ollama. The embedding model is
 * the save's LOCKED model, never a free pick.
 */
function resolveEmbedder(session: GameSession, config: ProviderConfig | null) {
  const modelId = session.embeddingModelId;
  // A boolean flag, not a URL — so an explicit "0"/"false" must turn it OFF, not
  // count as truthy and silently keep spending the operator's quota.
  if (isFlagEnabled(process.env.NEXT_PUBLIC_CLOUDFLARE_EMBEDDING)) {
    // Browser hits the same-origin proxy; the operator token stays server-side,
    // so no key is passed here. (Throws for a save locked to a non-Cloudflare
    // model — caught by retrieveLoreForTurn, degrading to curated lore only.)
    return createEmbeddingProvider({ id: "cloudflare", modelId });
  }
  if (process.env.NEXT_PUBLIC_OPERATOR_EMBEDDING_URL) {
    return createEmbeddingProvider({ id: "operator", modelId });
  }
  if (config?.providerId === "ollama") {
    return createEmbeddingProvider({ id: "ollama", modelId, baseUrl: config.baseUrl });
  }
  return null;
}

/** Treat an env flag as on only for a real truthy value — `undefined`, empty,
 * `"0"`, and `"false"` all mean off (env vars are always strings). */
function isFlagEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

/**
 * Retrieve the gated corpus chunks for the upcoming turn. Returns `[]` on any
 * failure or when retrieval cannot run — the caller passes the result straight
 * to `generate({ retrievedChunks })`, and an empty list simply means the
 * narrator runs on curated lore alone.
 */
export async function retrieveLoreForTurn(
  session: GameSession,
  config: ProviderConfig | null,
): Promise<RetrievedLoreChunk[]> {
  try {
    const embedder = resolveEmbedder(session, config);
    if (!embedder) return [];

    const client = createBrowserClientSafe<SupabaseRpcClient>();
    if (!client) return [];

    const chunks = await retrieveChunks(buildRetrievalQuery(session), {
      embedder,
      rpc: createSupabaseChunkMatcher(client),
      lockedModelId: session.embeddingModelId,
      canonPosition: session.canonPosition,
      // A real character always rides a concrete epoch (default Fifth) so the
      // epoch gate is enforced — never the operator/eval "no limit" (null) path.
      epoch: session.gameState.epoch ?? DEFAULT_EPOCH_ID,
      // Progressive spoiler disclosure tied to the character's sequence.
      maxConcealmentTier: concealmentTierForSequence(session.gameState.sequenceLevel),
    });
    return toRetrievedLoreChunks(chunks);
  } catch {
    // Best-effort: retrieval is an enhancement, never a hard dependency.
    return [];
  }
}
