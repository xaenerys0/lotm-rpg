// Public surface of the RAG ingestion core (issue #59): the canonical JSONL
// chunk artifact, the stage contract, the JSONL I/O seam, and the shared
// chunker. Consumed by the pipeline stage drivers in `scripts/rag/*` and by
// later RAG issues (#3 embed, #4 wiki, #5 novel).

export type {
  ChunkOptions,
  ChunkRecord,
  ChunkRef,
  RagStage,
  SourceDocument,
  TokenCounter,
} from "./types";
export {
  DEFAULT_CONCEALMENT_TIER,
  RAG_CHUNK_MAX_TOKENS,
  RAG_CHUNK_MIN_TOKENS,
  RAG_CHUNK_OVERLAP_RATIO,
  RAG_STAGES,
} from "./types";

export { chunkDocument, chunkDocuments, splitSentences } from "./chunk";
export { countTokens } from "./tokenizer";
export { iterateJsonl, parseJsonl, toJsonl } from "./jsonl";
