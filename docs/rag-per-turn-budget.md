# RAG Per-Turn Budget (issue #64, §6)

What turning on retrieval costs per turn, and what it costs the operator per
month. Numbers are honest estimates to be re-measured once the full corpus is
loaded; the lore budget itself (4,000 tokens) is a tunable starting point, not
a final answer.

## Added latency per turn

| Step                        | Estimate           | Notes                                                                                                                                         |
| --------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Query embedding (local CPU) | 50–300 ms          | One short text through `qwen3-embedding-0.6b`/`bge-m3` on the player's Ollama or the operator box; dominated by model load-state and box CPU. |
| Embed round-trip (network)  | 20–150 ms          | Browser → Ollama is localhost (~0); browser → operator box is one HTTPS round-trip.                                                           |
| `match_source_chunks` RPC   | 20–100 ms          | Hybrid FTS + pgvector over ~30k chunks (full novel + wiki) with metadata pre-filter; one Supabase round-trip.                                 |
| Larger prompt prefill       | provider-dependent | Up to ~1,500 extra input tokens; for hosted APIs prefill is fast (≪1 s); for local LLMs prefill time scales with context.                     |

**Total added wall-clock: roughly 0.1–0.5 s per turn** before the (much
larger) narrative-generation time itself.

## Added prompt tokens — the player's BYOK key pays

- Lore budget raised **2,500 → 4,000** (`TOKEN_BUDGET.total` 7,300 → 8,800):
  up to **+1,500 input tokens per turn**.
- Curated guardrails are injected first and in full; retrieved chunks only
  fill the remainder, so a turn with rich curated lore adds fewer retrieved
  tokens than the cap.
- Order-of-magnitude cost at common BYOK prices (input side only): at
  $3/M tokens, +1,500 tokens ≈ **$0.0045/turn** (~$0.45 per 100 turns); at
  $0.25/M ≈ $0.0004/turn. Local Ollama narrators pay in prefill time instead.

## Monthly operator floor

| Item                    | Estimate       | Notes                                                                                                                                |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Always-on CPU embed box | ~$8–20/mo      | A 4-vCPU VPS comfortably serves both approved 0.6B-class embed models; **not** a Vercel serverless function (no resident model).     |
| Supabase Pro            | $25/mo         | pgvector store sized for the full corpus (two 1024-dim maps over ~30k chunks ≈ ~250 MB of vectors + indexes) outgrows the free tier. |
| **Floor**               | **~$33–45/mo** | Independent of player count until embed-box CPU saturates.                                                                           |

## Honest risk framing (browser-reachable chunks)

Narrative generation is **browser-direct BYOK**: the assembled prompt —
including retrieved `source_chunks` content — leaves the browser for the
player's chosen LLM provider. Retrieved chunks therefore **do reach the
client**. There is **no** "no client-reachable path" claim here:

- The `source_chunks` table itself stays private (RLS denies all direct
  reads; `match_source_chunks` is the sole, gated read path).
- But any player can observe the chunks their own retrievals return. This is
  **risk-accepted** by the owner (consistent with the accepted copyright risk
  of ingesting the novel), bounded by the timeline/concealment gates: a player
  only ever sees gate-passing chunks for their own position.

## Safety net

The evaluation harness (`pnpm rag:eval`, `src/lib/rag/eval.ts`) tracks
**recall@k** and a **leakage test** (no future-canon, no concealed chunk in
player-visible results) as **advisory** metrics — visibility without blocking
velocity. Watch the leakage metric especially: it is the timeline gate's
safety net, and any violation is a bug, not a tuning concern.
