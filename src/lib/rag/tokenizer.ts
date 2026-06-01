import { encode } from "gpt-tokenizer";

import type { TokenCounter } from "./types";

// The tokenizer is a DEV-ONLY dependency (`gpt-tokenizer`, in devDependencies)
// used by the ingestion pipeline and its tests to size chunks. It must never be
// pulled into the app bundle — nothing under `src/app` or the runtime retrieval
// path imports this module; only `scripts/rag/*` and `*.test.ts` do.
//
// The exact BPE need not match the embedding model (qwen3 / bge-m3); this is a
// stable, deterministic sizing heuristic for the 300–800-token window, not an
// embedding input.

/** Token count for `text` (0 for empty/whitespace). */
export const countTokens: TokenCounter = (text) => {
  if (!text) return 0;
  return encode(text).length;
};
