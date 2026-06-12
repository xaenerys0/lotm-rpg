import { strFromU8, unzipSync } from "fflate";

import { decodeEntities, stripHtml } from "./html";
import { LOTM_NOVEL_ARC_MAP, resolveArc, type NovelArcEntry } from "./novel-arcs";
import { DEFAULT_CONCEALMENT_TIER, type SourceDocument } from "./types";

// ---------------------------------------------------------------------------
// Novel ingestion: parse + normalize stages (issue #62)
// ---------------------------------------------------------------------------
//
//   [parse -> normalize] -> chunk -> embed -> load
//
// Turns chapter-delimited novel sources into normalized SourceDocument JSONL
// for the shared chunker. Supported inputs, in the issue's priority order:
//   - EPUB (best: the spine gives chapter boundaries for free) — parseEpub
//   - md/.txt, one file per chapter or one file with chapter headings —
//     parseNovelFiles / parseNovelText
//   - HTML (tags stripped, then the same heading detection) — stripHtml
// Chapter boundaries are the chronology source: `canon_order` falls out of the
// chapter index, and the hand-authored arc map (novel-arcs.ts) supplies
// `arc_bucket` / `concealment_tier` / `in_world_date`. Correctness of those
// four signals is a hard requirement — the retrieval timeline gate depends on
// them — so this module stays under golden-fixture tests.

/** One parsed chapter — the unit the normalize stage turns into a document. */
export interface NovelChapter {
  chapter: number;
  /** Chapter title without the "Chapter N" prefix; may be empty. */
  title: string;
  content: string;
}

/** A named input file for the one-file-per-chapter layout. */
export interface NovelFile {
  name: string;
  content: string;
}

// Matches "Chapter 12", "CHAPTER 12: Title", "## Chapter 12 — Title", etc. on
// its own line. The number is the chronology anchor; the title is optional.
const CHAPTER_HEADING =
  /^\s*(?:#{1,6}\s*)?chapter\s+(\d+)\s*(?:[:.\-–—]\s*(\S.*?))?\s*$/i;

/**
 * Parse a single chapter-delimited text/markdown document into chapters by
 * "Chapter N" headings. Text before the first heading (front matter) is
 * dropped. Throws when no heading is found — without one there is no chapter
 * number, and chronology metadata cannot be derived.
 */
export function parseNovelText(text: string): NovelChapter[] {
  const chapters: NovelChapter[] = [];
  let current: NovelChapter | null = null;
  let body: string[] = [];

  const flush = (): void => {
    if (current !== null) {
      chapters.push({ ...current, content: body.join("\n").trim() });
    }
    body = [];
  };

  for (const line of text.split(/\r?\n/)) {
    const heading = CHAPTER_HEADING.exec(line);
    if (heading) {
      flush();
      current = { chapter: Number(heading[1]), title: heading[2] ?? "", content: "" };
    } else if (current !== null) {
      body.push(line);
    }
  }
  flush();

  if (chapters.length === 0) {
    throw new Error(
      'No "Chapter N" headings found — cannot derive chapter numbers (chronology) from this file.',
    );
  }
  return chapters;
}

/**
 * Parse a one-file-per-chapter layout (md/txt/HTML). Files are processed in
 * name order. The chapter number comes from a leading "Chapter N" heading when
 * present, else from the first integer in the filename; the title falls back
 * to the prettified filename stem.
 */
export function parseNovelFiles(files: readonly NovelFile[]): NovelChapter[] {
  return [...files]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => parseChapterFile(file));
}

/**
 * Parse an EPUB (a zip of XHTML documents ordered by the OPF spine) into
 * chapters. Spine documents containing "Chapter N" headings drive the
 * numbering; when none of them do, every substantial document becomes one
 * sequentially numbered chapter (titled from its `<title>` or first line).
 */
export function parseEpub(
  data: Uint8Array,
  options: { minChapterChars?: number } = {},
): NovelChapter[] {
  const minChars = options.minChapterChars ?? 200;
  const zip = unzipSync(data);
  const read = (path: string): string | null =>
    zip[path] !== undefined ? strFromU8(zip[path]) : null;

  const container = read("META-INF/container.xml");
  if (container === null) {
    throw new Error("Not an EPUB: missing META-INF/container.xml.");
  }
  const opfPath = /full-path="([^"]+)"/.exec(container)?.[1];
  const opf = opfPath !== undefined ? read(opfPath) : null;
  if (opfPath === undefined || opf === null) {
    throw new Error("Not an EPUB: container.xml does not point at a readable OPF.");
  }

  const docs = spineDocuments(opf, opfPath, read);

  // First pass: heading-driven chapters (the reliable chronology source).
  const headed: NovelChapter[] = [];
  for (const doc of docs) {
    const text = stripHtml(doc.html);
    if (hasChapterHeading(text)) headed.push(...parseNovelText(text));
  }
  if (headed.length > 0) return headed;

  // Fallback: no headings anywhere — number substantial documents in spine
  // order, skipping short front matter (cover, copyright, TOC).
  const chapters: NovelChapter[] = [];
  for (const doc of docs) {
    const text = stripHtml(doc.html);
    if (text.length < minChars) continue;
    chapters.push({
      chapter: chapters.length + 1,
      title: documentTitle(doc.html, text),
      content: text,
    });
  }
  if (chapters.length === 0) {
    throw new Error("EPUB contained no chapter-sized documents.");
  }
  return chapters;
}

/**
 * Normalize parsed chapters into {@link SourceDocument}s: `canon_order` from
 * the chapter index, the remaining chronology signals from the arc map.
 * Chapters are emitted in canon order; duplicate chapter numbers are an input
 * corruption and throw.
 */
export function normalizeNovelChapters(
  chapters: readonly NovelChapter[],
  options: { arcMap?: readonly NovelArcEntry[] } = {},
): SourceDocument[] {
  const arcMap = options.arcMap ?? LOTM_NOVEL_ARC_MAP;
  const sorted = [...chapters].sort((a, b) => a.chapter - b.chapter);

  return sorted.map((chapter, index) => {
    if (index > 0 && sorted[index - 1].chapter === chapter.chapter) {
      throw new Error(`Duplicate chapter number ${chapter.chapter} in novel input.`);
    }
    const arc = resolveArc(chapter.chapter, arcMap);
    return {
      source: "novel",
      title:
        chapter.title === ""
          ? `Chapter ${chapter.chapter}`
          : `Chapter ${chapter.chapter}: ${chapter.title}`,
      ref: { chapter: chapter.chapter },
      content: chapter.content,
      tags: arc === null ? ["novel"] : ["novel", arc.arc_bucket],
      canon_order: chapter.chapter,
      arc_bucket: arc?.arc_bucket ?? null,
      concealment_tier: arc?.concealment_tier ?? DEFAULT_CONCEALMENT_TIER,
      in_world_date: arc?.in_world_date ?? null,
    };
  });
}

// --- internals ---------------------------------------------------------------

const HTML_EXTENSION = /\.(?:x?html?|xhtml)$/i;

function parseChapterFile(file: NovelFile): NovelChapter {
  const raw = HTML_EXTENSION.test(file.name) ? stripHtml(file.content) : file.content;

  if (hasChapterHeading(raw)) {
    const chapters = parseNovelText(raw);
    if (chapters.length > 1) {
      throw new Error(
        `File "${file.name}" contains ${chapters.length} chapter headings — expected one per file.`,
      );
    }
    return chapters[0];
  }

  const fromName = /\d+/.exec(file.name)?.[0];
  if (fromName === undefined) {
    throw new Error(
      `File "${file.name}" has no "Chapter N" heading and no number in its filename — cannot derive the chapter number.`,
    );
  }
  return {
    chapter: Number(fromName),
    title: filenameTitle(file.name),
    content: raw.trim(),
  };
}

function hasChapterHeading(text: string): boolean {
  return text.split(/\r?\n/).some((line) => CHAPTER_HEADING.test(line));
}

/** Prettify a filename stem into a title: "0001-the-fog.txt" -> "the fog". */
function filenameTitle(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/\d+/g, " ")
    .replace(/[-_.]+/g, " ")
    .trim();
}

interface SpineDocument {
  href: string;
  html: string;
}

/** Resolve the OPF manifest + spine into ordered, readable XHTML documents. */
function spineDocuments(
  opf: string,
  opfPath: string,
  read: (path: string) => string | null,
): SpineDocument[] {
  const manifest = new Map<string, string>();
  for (const item of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(item[0])?.[1];
    const href = /\bhref="([^"]+)"/.exec(item[0])?.[1];
    if (id !== undefined && href !== undefined) manifest.set(id, href);
  }

  const baseDir = opfPath.includes("/")
    ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1)
    : "";
  const docs: SpineDocument[] = [];
  for (const itemref of opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"[^>]*>/g)) {
    const href = manifest.get(itemref[1]);
    if (href === undefined) continue;
    const html = read(baseDir + href);
    if (html !== null) docs.push({ href, html });
  }
  return docs;
}

/** Title for an unheaded EPUB document: its <title>, else its first line. */
function documentTitle(html: string, text: string): string {
  const fromTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  if (fromTag !== undefined && fromTag.trim() !== "") {
    return decodeEntities(fromTag).trim();
  }
  return text.split("\n")[0].slice(0, 80);
}
