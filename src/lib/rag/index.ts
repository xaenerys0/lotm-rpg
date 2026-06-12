// Public surface of the RAG ingestion core (issue #59): the canonical JSONL
// chunk artifact, the stage contract, the JSONL I/O seam, and the shared
// chunker. Consumed by the pipeline stage drivers in `scripts/rag/*` and by
// later RAG issues (#4 wiki).

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
export {
  embedChunks,
  DEFAULT_EMBED_BATCH_SIZE,
  type ChunkEmbedder,
  type EmbedChunksOptions,
} from "./embed";
export { countTokens } from "./tokenizer";
export { iterateJsonl, parseJsonl, toJsonl } from "./jsonl";

export { decodeEntities, stripHtml } from "./html";
export {
  normalizeNovelChapters,
  parseEpub,
  parseNovelFiles,
  parseNovelText,
  type NovelChapter,
  type NovelFile,
} from "./novel";
export { LOTM_NOVEL_ARC_MAP, resolveArc, type NovelArcEntry } from "./novel-arcs";
export {
  cleanWikitext,
  createWikiXmlParser,
  DEFAULT_WIKI_BASE_URL,
  extractCategories,
  normalizeWikiPage,
  normalizeWikiPages,
  parseWikiXml,
  type NormalizeWikiOptions,
  type WikiPage,
  type WikiXmlParser,
} from "./wiki";
