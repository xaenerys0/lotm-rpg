import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { chunkDocuments } from "./chunk";
import { parseJsonl } from "./jsonl";
import {
  normalizeNovelChapters,
  parseEpub,
  parseNovelFiles,
  parseNovelText,
  stripHtml,
} from "./novel";
import { LOTM_NOVEL_ARC_MAP, resolveArc, type NovelArcEntry } from "./novel-arcs";
import { type SourceDocument } from "./types";

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), "utf8");

// A simple word-based counter keeps the unit tests deterministic and readable
// without depending on the exact BPE of the real tokenizer.
const wordCount = (text: string): number =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

describe("parseNovelText", () => {
  it("splits chapters on heading variants and drops front matter (golden fixture)", () => {
    const chapters = parseNovelText(fixture("novel-chapters.txt"));
    expect(chapters.map((c) => [c.chapter, c.title])).toEqual([
      [1, "The Crimson Moon"],
      [2, "Luck Enhancement"],
      [3, "The Gathering of Three"],
    ]);
    expect(chapters[0].content).toMatch(/^Zhou's first thought/);
    expect(chapters[0].content).not.toMatch(/front matter/i);
  });

  it("accepts a bare numbered heading with no title", () => {
    const chapters = parseNovelText("Chapter 12\nFog on the canal.");
    expect(chapters).toEqual([{ chapter: 12, title: "", content: "Fog on the canal." }]);
  });

  it("throws when no chapter heading exists (no chronology anchor)", () => {
    expect(() => parseNovelText("Just prose with no headings.")).toThrow(
      /No "Chapter N" headings/,
    );
  });
});

describe("parseNovelFiles", () => {
  it("reads one chapter per file, preferring the in-file heading", () => {
    const chapters = parseNovelFiles([
      { name: "b.txt", content: "Chapter 2: Second\nMore fog." },
      { name: "a.txt", content: "Chapter 1: First\nFog." },
    ]);
    expect(chapters.map((c) => c.chapter)).toEqual([1, 2]);
    expect(chapters[1].content).toBe("More fog.");
  });

  it("falls back to the filename number and prettified stem as title", () => {
    const [chapter] = parseNovelFiles([
      { name: "0007-the-red-chapel.md", content: "A bell rang twice." },
    ]);
    expect(chapter).toEqual({
      chapter: 7,
      title: "the red chapel",
      content: "A bell rang twice.",
    });
  });

  it("strips HTML files before parsing", () => {
    const [chapter] = parseNovelFiles([
      {
        name: "ch-9.html",
        content: "<html><body><h1>Chapter 9: Ash</h1><p>It snowed ash.</p></body></html>",
      },
    ]);
    expect(chapter).toEqual({ chapter: 9, title: "Ash", content: "It snowed ash." });
  });

  it("throws when neither heading nor filename yields a chapter number", () => {
    expect(() => parseNovelFiles([{ name: "notes.txt", content: "prose" }])).toThrow(
      /cannot derive the chapter number/,
    );
  });

  it("throws when a single file contains multiple chapter headings", () => {
    expect(() =>
      parseNovelFiles([{ name: "two.txt", content: "Chapter 1\nA.\nChapter 2\nB." }]),
    ).toThrow(/expected one per file/);
  });
});

describe("stripHtml", () => {
  it("drops scripts, styles, head, and comments", () => {
    const html =
      "<head><title>X</title></head><style>p{}</style><script>var a;</script>" +
      "<!-- secret --><p>Kept.</p>";
    expect(stripHtml(html)).toBe("Kept.");
  });

  it("turns block boundaries and breaks into newlines", () => {
    expect(stripHtml("<h1>Title</h1><p>One.</p><p>Two.<br/>Three.</p>")).toBe(
      "Title\nOne.\nTwo.\nThree.",
    );
  });

  it("decodes named, decimal, and hex entities and keeps unknown ones", () => {
    expect(stripHtml("Fish &amp; chips&hellip; &#65;&#x42; &bogus;")).toBe(
      "Fish & chips… AB &bogus;",
    );
  });

  it("collapses intra-line whitespace including non-breaking spaces", () => {
    expect(stripHtml("a&nbsp;&nbsp;b   c")).toBe("a b c");
  });
});

describe("parseEpub", () => {
  const makeEpub = (files: Record<string, string>): Uint8Array =>
    zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));

  const container =
    '<?xml version="1.0"?><container><rootfiles>' +
    '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
    "</rootfiles></container>";

  const opf = (manifest: string, spine: string): string =>
    `<package><manifest>${manifest}</manifest><spine>${spine}</spine></package>`;

  it("extracts heading-driven chapters in spine order from a nested OPF", () => {
    const epub = makeEpub({
      "META-INF/container.xml": container,
      "OEBPS/content.opf": opf(
        '<item id="c1" href="text/one.xhtml" media-type="application/xhtml+xml"/>' +
          '<item id="c2" href="text/two.xhtml" media-type="application/xhtml+xml"/>',
        '<itemref idref="c1"/><itemref idref="c2"/><itemref idref="ghost"/>',
      ),
      "OEBPS/text/one.xhtml":
        "<body><h1>Chapter 1: Fog</h1><p>The fog came in.</p></body>",
      "OEBPS/text/two.xhtml":
        "<body><h1>Chapter 2: Bell</h1><p>The bell rang.</p></body>",
    });
    expect(parseEpub(epub)).toEqual([
      { chapter: 1, title: "Fog", content: "The fog came in." },
      { chapter: 2, title: "Bell", content: "The bell rang." },
    ]);
  });

  it("numbers substantial unheaded documents sequentially, skipping front matter", () => {
    const longA = "The canal kept its own counsel. ".repeat(10).trim();
    const longB = "Rain wrote on the windows all night. ".repeat(10).trim();
    const epub = makeEpub({
      "META-INF/container.xml": container,
      "OEBPS/content.opf": opf(
        '<item id="cover" href="cover.xhtml"/>' +
          '<item id="a" href="a.xhtml"/><item id="b" href="b.xhtml"/>',
        '<itemref idref="cover"/><itemref idref="a"/><itemref idref="b"/>',
      ),
      "OEBPS/cover.xhtml": "<body><p>Cover</p></body>",
      "OEBPS/a.xhtml": `<head><title>The Canal</title></head><body><p>${longA}</p></body>`,
      "OEBPS/b.xhtml": `<body><p>${longB}</p></body>`,
    });
    const chapters = parseEpub(epub);
    expect(chapters.map((c) => [c.chapter, c.title])).toEqual([
      [1, "The Canal"],
      [2, longB.split("\n")[0].slice(0, 80)],
    ]);
  });

  it("honors a custom minimum chapter size", () => {
    const epub = makeEpub({
      "META-INF/container.xml": container,
      "OEBPS/content.opf": opf('<item id="a" href="a.xhtml"/>', '<itemref idref="a"/>'),
      "OEBPS/a.xhtml": "<body><p>Tiny but a chapter.</p></body>",
    });
    expect(parseEpub(epub, { minChapterChars: 5 })).toHaveLength(1);
    expect(() => parseEpub(epub)).toThrow(/no chapter-sized documents/);
  });

  it("throws on a zip without container.xml", () => {
    expect(() => parseEpub(makeEpub({ mimetype: "application/epub+zip" }))).toThrow(
      /missing META-INF/,
    );
  });

  it("throws when container.xml does not point at a readable OPF", () => {
    expect(() =>
      parseEpub(makeEpub({ "META-INF/container.xml": "<container/>" })),
    ).toThrow(/does not point at a readable OPF/);
    expect(() => parseEpub(makeEpub({ "META-INF/container.xml": container }))).toThrow(
      /does not point at a readable OPF/,
    );
  });
});

describe("resolveArc / LOTM_NOVEL_ARC_MAP", () => {
  it("maps chapters to their volume and returns null outside the map", () => {
    expect(resolveArc(1)?.arc_bucket).toBe("clown");
    expect(resolveArc(222)?.arc_bucket).toBe("clown");
    expect(resolveArc(223)?.arc_bucket).toBe("faceless");
    expect(resolveArc(1394)?.arc_bucket).toBe("fool");
    expect(resolveArc(0)).toBeNull();
    expect(resolveArc(1395)).toBeNull();
  });

  it("is contiguous, ordered, and monotonically non-decreasing in concealment", () => {
    for (let i = 1; i < LOTM_NOVEL_ARC_MAP.length; i++) {
      const prev = LOTM_NOVEL_ARC_MAP[i - 1];
      const next = LOTM_NOVEL_ARC_MAP[i];
      expect(next.fromChapter).toBe(prev.toChapter + 1);
      expect(next.concealment_tier).toBeGreaterThanOrEqual(prev.concealment_tier);
    }
  });
});

describe("normalizeNovelChapters", () => {
  it("produces the golden SourceDocument JSONL for the fixture novel", () => {
    const docs = normalizeNovelChapters(parseNovelText(fixture("novel-chapters.txt")));
    const expected = parseJsonl<SourceDocument>(fixture("novel-docs.expected.jsonl"));
    expect(docs).toEqual(expected);
  });

  it("sorts chapters into canon order and carries the four chronology signals", () => {
    const [first, second] = normalizeNovelChapters([
      { chapter: 230, title: "Masks", content: "B." },
      { chapter: 2, title: "", content: "A." },
    ]);
    expect(first).toEqual({
      source: "novel",
      title: "Chapter 2",
      ref: { chapter: 2 },
      content: "A.",
      tags: ["novel", "clown"],
      canon_order: 2,
      arc_bucket: "clown",
      concealment_tier: 0,
      in_world_date: "1349",
    });
    expect(second.arc_bucket).toBe("faceless");
    expect(second.title).toBe("Chapter 230: Masks");
    expect(second.in_world_date).toBeNull();
  });

  it("defaults unmapped chapters to no arc and the default concealment tier", () => {
    const arcMap: NovelArcEntry[] = [];
    const [doc] = normalizeNovelChapters([{ chapter: 5, title: "", content: "X." }], {
      arcMap,
    });
    expect(doc.tags).toEqual(["novel"]);
    expect(doc.arc_bucket).toBeNull();
    expect(doc.concealment_tier).toBe(0);
    expect(doc.in_world_date).toBeNull();
  });

  it("throws on duplicate chapter numbers", () => {
    expect(() =>
      normalizeNovelChapters([
        { chapter: 4, title: "A", content: "a" },
        { chapter: 4, title: "B", content: "b" },
      ]),
    ).toThrow(/Duplicate chapter number 4/);
  });
});

describe("novel pipeline end-to-end (fixture -> normalize -> chunk)", () => {
  it("carries chronology metadata from chapters onto every chunk", () => {
    const docs = normalizeNovelChapters(parseNovelText(fixture("novel-chapters.txt")));
    const chunks = chunkDocuments(docs, {
      minTokens: 40,
      maxTokens: 120,
      countTokens: wordCount,
    });
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    for (const chunk of chunks) {
      expect(chunk.source).toBe("novel");
      expect(chunk.canon_order).toBe((chunk.ref as { chapter: number }).chapter);
      expect(chunk.arc_bucket).toBe("clown");
      expect(chunk.concealment_tier).toBe(0);
      expect(chunk.in_world_date).toBe("1349");
      expect(chunk.id).toMatch(/^novel-ch\d+-\d{4}$/);
    }
  });
});
