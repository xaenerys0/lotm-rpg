import { countTokens as defaultCountTokens } from "./tokenizer";
import {
  DEFAULT_CONCEALMENT_TIER,
  RAG_CHUNK_MAX_TOKENS,
  RAG_CHUNK_MIN_TOKENS,
  RAG_CHUNK_OVERLAP_RATIO,
  type ChunkOptions,
  type ChunkRecord,
  type ChunkRef,
  type SourceDocument,
  type TokenCounter,
} from "./types";

// ---------------------------------------------------------------------------
// The shared chunker (issue #59)
// ---------------------------------------------------------------------------
//
// Source-agnostic so the novel (#5) and wiki (#4) pipelines cut chunks
// identically. Properties it guarantees:
//   - target window 300–800 tokens, packed greedily;
//   - ~10–15% overlap carried as whole trailing sentences (never a torn fact);
//   - sentences are atomic — a fact is never split across a chunk boundary
//     (a pathological over-long sentence is word-windowed only as a last resort);
//   - the four chronology/concealment signals are carried onto every chunk;
//   - deterministic, position-derived ids so output is diffable + re-embeddable.

// Common abbreviations whose trailing period must NOT end a sentence.
const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "st",
  "prof",
  "sr",
  "jr",
  "vs",
  "etc",
  "no",
  "vol",
  "fig",
  "gen",
  "col",
  "capt",
  "sgt",
  "lt",
  "rev",
  "hon",
  "messrs",
  "mt",
]);

/**
 * Split text into sentences. Sentences are the atomic unit of chunking, so the
 * splitter errs toward NOT breaking (abbreviations, single-letter initials, and
 * decimals are guarded) — a fact never gets torn across a chunk boundary.
 */
export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) return [];

  const sentences: string[] = [];
  let start = 0;
  // A boundary is sentence-ending punctuation, optional closing quotes/brackets,
  // then whitespace.
  const boundary = /([.!?]+)(["'”’)\]]*)(\s+)/g;
  let match: RegExpExecArray | null;

  while ((match = boundary.exec(normalized)) !== null) {
    const punctEnd = match.index + match[1].length + match[2].length;
    const before = normalized.slice(start, match.index);
    const lastWord = (before.match(/(\S+)$/)?.[1] ?? "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const nextChar = normalized[boundary.lastIndex] ?? "";

    const isAbbreviation = ABBREVIATIONS.has(lastWord);
    // Single capital letter immediately before a period, e.g. the "K." in
    // "Klein K. Moretti" — an initial, not a sentence end.
    const isInitial = match[1] === "." && /(?:^|\s)[A-Z]$/.test(before);
    // The next chunk of text must look like a sentence opening.
    const startsNewSentence = nextChar === "" || /[A-Z0-9"'“‘(\[—]/.test(nextChar);

    if (!isAbbreviation && !isInitial && startsNewSentence) {
      sentences.push(normalized.slice(start, punctEnd).trim());
      start = boundary.lastIndex;
    }
  }

  const tail = normalized.slice(start).trim();
  if (tail.length > 0) sentences.push(tail);
  return sentences;
}

/**
 * Chunk a normalized {@link SourceDocument} into {@link ChunkRecord}s, carrying
 * its chronology metadata onto each. Deterministic for a given input + options.
 */
export function chunkDocument(
  doc: SourceDocument,
  options: ChunkOptions = {},
): ChunkRecord[] {
  const minTokens = options.minTokens ?? RAG_CHUNK_MIN_TOKENS;
  const maxTokens = options.maxTokens ?? RAG_CHUNK_MAX_TOKENS;
  const overlapRatio = options.overlapRatio ?? RAG_CHUNK_OVERLAP_RATIO;
  const countTokens = options.countTokens ?? defaultCountTokens;
  const overlapTarget = Math.round(maxTokens * overlapRatio);

  // Atomic units: sentences, with any over-max sentence word-windowed so no
  // unit can blow past the ceiling on its own.
  const units = splitSentences(doc.content).flatMap((sentence) =>
    splitOversizeSentence(sentence, maxTokens, countTokens),
  );

  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const unit of units) {
    const unitTokens = countTokens(unit);
    const wouldOverflow = currentTokens + unitTokens > maxTokens;
    // Flush only once the floor is met, so chunks land in the [min, max] window.
    if (current.length > 0 && wouldOverflow && currentTokens >= minTokens) {
      chunks.push(current.join(" "));
      current = takeOverlap(current, overlapTarget, countTokens);
      currentTokens = current.reduce((sum, s) => sum + countTokens(s), 0);
    }
    current.push(unit);
    currentTokens += unitTokens;
  }
  if (current.length > 0) chunks.push(current.join(" "));

  return chunks.map((content, index) => buildRecord(doc, content, index, countTokens));
}

/**
 * Chunk many documents in canon order, preserving per-document chronology.
 * A thin convenience over {@link chunkDocument} for the chunk stage driver.
 */
export function chunkDocuments(
  docs: readonly SourceDocument[],
  options: ChunkOptions = {},
): ChunkRecord[] {
  return docs.flatMap((doc) => chunkDocument(doc, options));
}

// --- internals -------------------------------------------------------------

/** Word-window a sentence that exceeds `maxTokens` — the only place a fact is
 * split, and only when a single sentence is itself larger than the window. */
function splitOversizeSentence(
  sentence: string,
  maxTokens: number,
  countTokens: TokenCounter,
): string[] {
  if (countTokens(sentence) <= maxTokens) return [sentence];

  const words = sentence.split(" ");
  const parts: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    current.push(word);
    if (countTokens(current.join(" ")) >= maxTokens) {
      parts.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) parts.push(current.join(" "));
  return parts;
}

/** Take whole trailing sentences from a chunk until ~`overlapTarget` tokens, so
 * the next chunk re-includes the tail without ever tearing a sentence. */
function takeOverlap(
  sentences: readonly string[],
  overlapTarget: number,
  countTokens: TokenCounter,
): string[] {
  if (overlapTarget <= 0) return [];
  const overlap: string[] = [];
  let tokens = 0;
  // Never overlap the entire chunk — leave at least the first sentence behind.
  for (let i = sentences.length - 1; i > 0 && tokens < overlapTarget; i--) {
    overlap.unshift(sentences[i]);
    tokens += countTokens(sentences[i]);
  }
  return overlap;
}

function buildRecord(
  doc: SourceDocument,
  content: string,
  index: number,
  countTokens: TokenCounter,
): ChunkRecord {
  return {
    id: makeChunkId(doc, index),
    source: doc.source,
    title: doc.title,
    ref: doc.ref,
    content,
    tags: doc.tags ?? [],
    tokenCount: countTokens(content),
    canon_order: doc.canon_order ?? null,
    arc_bucket: doc.arc_bucket ?? null,
    concealment_tier: doc.concealment_tier ?? DEFAULT_CONCEALMENT_TIER,
    in_world_date: doc.in_world_date ?? null,
    embedding: null,
  };
}

/** Deterministic, position-derived id: `<source>-<refKey>-<index>`. Stable
 * across re-chunks so the embed/load stages can match rows without re-parsing. */
function makeChunkId(doc: SourceDocument, index: number): string {
  return `${doc.source}-${refKey(doc.ref, doc.title)}-${String(index).padStart(4, "0")}`;
}

function refKey(ref: ChunkRef, fallbackTitle: string): string {
  if (ref.chapter !== undefined) return `ch${ref.chapter}`;
  if (ref.page !== undefined) return slugify(String(ref.page));
  if (ref.url !== undefined) return slugify(String(ref.url));
  return slugify(fallbackTitle) || "doc";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
