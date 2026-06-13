// Shared HTML/entity helpers for the parse stages: the novel pipeline strips
// EPUB/HTML chapters with these, and the wiki pipeline finishes wikitext
// cleaning with the same pass so both sources normalize identically.

/**
 * Strip HTML/XHTML to plain text with sentence and paragraph boundaries
 * intact: scripts/styles/comments dropped, block boundaries become newlines,
 * entities decoded, whitespace normalized.
 */
export function stripHtml(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|head)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(?:br|hr)\b[^>]*\/?>/gi, "\n")
    .replace(
      /<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote|section|article|tr)\b[^>]*>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

/** Decode named, decimal, and hex HTML entities; unknown ones pass through. */
export function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi,
    (
      match,
      hex: string | undefined,
      dec: string | undefined,
      named: string | undefined,
    ) => {
      if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16));
      if (dec !== undefined) return String.fromCodePoint(parseInt(dec, 10));
      return NAMED_ENTITIES[(named as string).toLowerCase()] ?? match;
    },
  );
}
