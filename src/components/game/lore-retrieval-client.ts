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
 * available. Preference: a player who runs **their own Ollama** (their chat
 * provider) embeds locally on their machine — free, private, and it keeps off the
 * operator's quota; then a self-hosted operator box; then the operator's hosted
 * **Cloudflare Workers AI** endpoint as the general fallback for everyone else
 * (reached through the same-origin proxy, which injects the operator token). The
 * embedding model is the save's LOCKED model — both approved models are served by
 * each transport, so any save resolves on any transport.
 */
function resolveEmbedder(session: GameSession, config: ProviderConfig | null) {
  const modelId = session.embeddingModelId;
  // The player's own Ollama wins when it's their chat provider — localhost embeds
  // its own copy of the locked model browser-direct (the BYOK pattern).
  if (config?.providerId === "ollama") {
    return createEmbeddingProvider({ id: "ollama", modelId, baseUrl: config.baseUrl });
  }
  if (process.env.NEXT_PUBLIC_OPERATOR_EMBEDDING_URL) {
    return createEmbeddingProvider({ id: "operator", modelId });
  }
  // General fallback. A boolean flag, not a URL — so an explicit "0"/"false" must
  // turn it OFF, not count as truthy and silently keep spending the operator's
  // quota. Browser hits the same-origin proxy; the operator token stays
  // server-side, so no key is passed here.
  if (isFlagEnabled(process.env.NEXT_PUBLIC_CLOUDFLARE_EMBEDDING)) {
    return createEmbeddingProvider({ id: "cloudflare", modelId });
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
