import { SaxesParser } from "saxes";

import { stripHtml } from "./html";
import { DEFAULT_CONCEALMENT_TIER, type SourceDocument } from "./types";

// ---------------------------------------------------------------------------
// Wiki ingestion: parse + normalize stages (issue #61)
// ---------------------------------------------------------------------------
//
//   [parse -> normalize] -> chunk -> embed -> load
//
// Turns the Fandom MediaWiki XML export (`pages_current.xml`) into normalized
// SourceDocument JSONL for the shared chunker:
//   - createWikiXmlParser: a push-based STREAMING parser (the dump is large —
//     it is never held in memory whole); the driver feeds file chunks.
//   - cleanWikitext: wikitext -> plain prose. Treated as a real project, not a
//     one-arrow stage: nested templates/tables, file/category links, refs,
//     headings, lists, and HTML all handled, then the shared stripHtml pass.
//   - normalizeWikiPage: namespace-0 filter, redirect/stub skip, provenance
//     (page URL + CC-BY-SA attribution in `ref`), category-derived tags.
// Wiki chunks carry no canon position (`canon_order: null` — they describe the
// world, not a moment in the story), so the timeline gate does not constrain
// them; spoiler control rides on `concealment_tier` (operator-settable here)
// and the curated-first prompt budget (#64).

/** One raw page from the dump, before any cleaning. */
export interface WikiPage {
  title: string;
  ns: number;
  /** Page id from the dump (not the revision id). */
  id: number | null;
  /** Redirect target when the page is a redirect. */
  redirect: string | null;
  /** Raw wikitext of the current revision. */
  text: string;
}

/** Push-based streaming parser for a MediaWiki XML export. */
export interface WikiXmlParser {
  /** Feed the next chunk of XML text. Emits pages as they complete. */
  write(chunk: string): void;
  /** Signal end of input; flushes and validates the tail. */
  close(): void;
}

const PAGE_FIELDS = new Set(["title", "ns", "id", "text"]);

/**
 * Create a streaming MediaWiki XML parser. `onPage` fires once per completed
 * `<page>` element, in document order, so the caller can normalize and write
 * each page without ever buffering the whole dump.
 */
export function createWikiXmlParser(onPage: (page: WikiPage) => void): WikiXmlParser {
  const sax = new SaxesParser();
  const path: string[] = [];
  let page: { title: string; ns: number; id: number | null; redirect: string | null } = {
    title: "",
    ns: -1,
    id: null,
    redirect: null,
  };
  let text = "";
  let capture: string | null = null;
  let buffer = "";

  sax.on("opentag", (tag) => {
    path.push(tag.name);
    const inPage = path[path.length - 2] === "page";
    if (tag.name === "page") {
      page = { title: "", ns: -1, id: null, redirect: null };
      text = "";
    } else if (inPage && tag.name === "redirect") {
      page.redirect = String(tag.attributes.title ?? "");
    } else if (PAGE_FIELDS.has(tag.name)) {
      capture = tag.name;
      buffer = "";
    }
  });

  sax.on("text", (value) => {
    if (capture !== null) buffer += value;
  });
  sax.on("cdata", (value) => {
    if (capture !== null) buffer += value;
  });

  sax.on("closetag", (tag) => {
    const parent = path[path.length - 2];
    if (tag.name === capture) {
      // <id> appears under <page>, <revision>, and <contributor>; only the
      // page-level one is the page id. <text> only matters under <revision>.
      if (tag.name === "title" && parent === "page") page.title = buffer;
      else if (tag.name === "ns" && parent === "page") page.ns = Number(buffer);
      else if (tag.name === "id" && parent === "page") page.id = Number(buffer);
      else if (tag.name === "text" && parent === "revision") text = buffer;
      capture = null;
    }
    if (tag.name === "page") onPage({ ...page, text });
    path.pop();
  });

  return {
    write: (chunk) => void sax.write(chunk),
    close: () => void sax.close(),
  };
}

/** Convenience for small inputs/tests: parse a whole export held in memory. */
export function parseWikiXml(xml: string): WikiPage[] {
  const pages: WikiPage[] = [];
  const parser = createWikiXmlParser((page) => pages.push(page));
  parser.write(xml);
  parser.close();
  return pages;
}

/** Extract `[[Category:...]]` names from raw wikitext. */
export function extractCategories(wikitext: string): string[] {
  const categories: string[] = [];
  for (const match of wikitext.matchAll(
    /\[\[\s*Category\s*:([^\]|]+)(?:\|[^\]]*)?\]\]/gi,
  )) {
    const name = match[1].trim();
    if (name !== "" && !categories.includes(name)) categories.push(name);
  }
  return categories;
}

/**
 * Clean wikitext to plain prose. Order matters: comments and verbatim blocks
 * first, then nested templates/tables, then link syntax, then markup, and the
 * shared HTML strip last so wiki and novel text normalize identically.
 */
export function cleanWikitext(wikitext: string): string {
  let text = wikitext
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(nowiki|gallery|ref|references|syntaxhighlight|pre|timeline)\b[^>]*\/>/gi,
      " ",
    )
    .replace(
      /<(nowiki|gallery|ref|references|syntaxhighlight|pre|timeline)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      " ",
    )
    .replace(/__[A-Z]+__/g, " ");

  text = stripDelimited(text, "{{", "}}");
  text = stripDelimited(text, "{|", "|}");
  text = stripPrefixedLinks(text);

  text = text
    // [[Category:...]] is metadata, not prose (collected separately), and
    // interlanguage links ([[de:Seher]]) are navigation, not content.
    .replace(/\[\[\s*Category\s*:[^\]]*\]\]/gi, " ")
    .replace(/\[\[[a-z]{2,3}(?:-[a-z]+)?:[^\]]*\]\]/g, " ")
    // [[target|label]] -> label, [[target]] -> target.
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    // [https://x label] -> label; bare [https://x] dropped.
    .replace(/\[https?:\/\/[^\s\]]+\s+([^\]]*)\]/gi, "$1")
    .replace(/\[https?:\/\/[^\]]*\]/gi, " ")
    // Bold/italic markers.
    .replace(/'{2,}/g, "");

  const lines = text.split(/\r?\n/).map((line) => {
    const heading = /^=+\s*(.*?)\s*=+\s*$/.exec(line);
    // A heading becomes a short standalone sentence so the chunker treats it
    // as an atomic boundary rather than gluing it into a neighbor.
    if (heading) return heading[1] === "" ? "" : `${heading[1]}.`;
    // List/indent markers carry no prose value.
    return line.replace(/^[*#:;]+\s*/, "");
  });

  // stripHtml also decodes HTML entities, so wiki and novel text normalize
  // through the exact same final pass.
  return stripHtml(lines.join("\n"));
}

/** Options for {@link normalizeWikiPage} / {@link normalizeWikiPages}. */
export interface NormalizeWikiOptions {
  /** Base wiki URL for provenance links. */
  baseUrl?: string;
  /** Concealment tier stamped on every page (operator-tunable). */
  concealmentTier?: number;
  /** Minimum cleaned-prose length; shorter pages are skipped as stubs. */
  minChars?: number;
}

export const DEFAULT_WIKI_BASE_URL = "https://lordofthemysteries.fandom.com/wiki/";
const DEFAULT_WIKI_MIN_CHARS = 40;

/**
 * Normalize one raw page into a {@link SourceDocument}, or `null` when the
 * page is not corpus material (non-article namespace, redirect, or stub).
 * Provenance — the page URL and CC-BY-SA attribution — rides in `ref`.
 */
export function normalizeWikiPage(
  page: WikiPage,
  options: NormalizeWikiOptions = {},
): SourceDocument | null {
  const baseUrl = options.baseUrl ?? DEFAULT_WIKI_BASE_URL;
  const minChars = options.minChars ?? DEFAULT_WIKI_MIN_CHARS;

  if (page.ns !== 0) return null;
  if (page.redirect !== null || /^\s*#redirect/i.test(page.text)) return null;

  const content = cleanWikitext(page.text);
  if (content.length < minChars) return null;

  const tags = ["wiki", ...extractCategories(page.text).map(slugifyTag)];
  return {
    source: "wiki",
    title: page.title,
    ref: {
      page: page.title,
      // The numeric page id keeps chunk ids unique even when long titles
      // collide after slug truncation.
      ...(page.id !== null ? { id: page.id } : {}),
      url: baseUrl + encodeURIComponent(page.title.replace(/ /g, "_")),
      license: "CC-BY-SA",
    },
    content,
    tags: [...new Set(tags)],
    canon_order: null,
    arc_bucket: null,
    concealment_tier: options.concealmentTier ?? DEFAULT_CONCEALMENT_TIER,
    in_world_date: null,
  };
}

/** Normalize many pages, dropping the non-corpus ones. */
export function normalizeWikiPages(
  pages: readonly WikiPage[],
  options: NormalizeWikiOptions = {},
): SourceDocument[] {
  return pages
    .map((page) => normalizeWikiPage(page, options))
    .filter((doc): doc is SourceDocument => doc !== null);
}

// --- internals ---------------------------------------------------------------

/** Remove nested `open...close` regions (templates `{{ }}`, tables `{| |}`). */
function stripDelimited(text: string, open: string, close: string): string {
  let out = "";
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    if (text.startsWith(open, i)) {
      depth++;
      i += open.length;
    } else if (depth > 0 && text.startsWith(close, i)) {
      depth--;
      i += close.length;
    } else {
      if (depth === 0) out += text[i];
      i++;
    }
  }
  return out;
}

// Link prefixes whose whole link (including nested [[...]] in captions) must
// be dropped rather than flattened to a label.
const DROP_LINK_PREFIX = /^\s*(?:file|image|media)\s*:/i;

/** Remove `[[File:...]]`-style links, tracking nested `[[ ]]` in captions. */
function stripPrefixedLinks(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("[[", i) && DROP_LINK_PREFIX.test(text.slice(i + 2, i + 16))) {
      let depth = 1;
      i += 2;
      while (i < text.length && depth > 0) {
        if (text.startsWith("[[", i)) {
          depth++;
          i += 2;
        } else if (text.startsWith("]]", i)) {
          depth--;
          i += 2;
        } else {
          i++;
        }
      }
    } else {
      out += text[i];
      i++;
    }
  }
  return out;
}

function slugifyTag(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
