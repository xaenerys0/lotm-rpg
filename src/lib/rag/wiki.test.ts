import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chunkDocuments } from "./chunk";
import { parseJsonl } from "./jsonl";
import {
  cleanWikitext,
  createWikiXmlParser,
  DEFAULT_WIKI_BASE_URL,
  extractCategories,
  normalizeWikiPage,
  normalizeWikiPages,
  parseWikiXml,
  type WikiPage,
} from "./wiki";
import { type SourceDocument } from "./types";

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), "utf8");

const wordCount = (text: string): number =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

const page = (overrides: Partial<WikiPage>): WikiPage => ({
  title: "Test Page",
  ns: 0,
  id: 1,
  redirect: null,
  text:
    "A fixture article about the fog over Tingen, long enough to clear the " +
    "stub threshold comfortably.",
  ...overrides,
});

describe("parseWikiXml / createWikiXmlParser", () => {
  const xml = fixture("wiki-pages.xml");

  it("parses every page with title, namespace, page-level id, and text", () => {
    const pages = parseWikiXml(xml);
    expect(pages).toHaveLength(7);
    expect(pages[0].title).toBe("Seer (fixture)");
    expect(pages[0].ns).toBe(0);
    // The page id, not the revision (9001) or contributor (7) id.
    expect(pages[0].id).toBe(101);
    expect(pages[0].text).toContain("rudimentary [[divination]] abilities");
    expect(pages[3]).toMatchObject({ title: "Talk:Seer (fixture)", ns: 1 });
    expect(pages[4]).toMatchObject({ title: "Template:Seq", ns: 10 });
  });

  it("captures <redirect> targets", () => {
    const pages = parseWikiXml(xml);
    expect(pages[1].redirect).toBe("Seer (fixture)");
    expect(pages[2].redirect).toBeNull(); // #redirect in text only
  });

  it("streams: feeding tiny chunks yields identical pages to one-shot parsing", () => {
    const streamed: WikiPage[] = [];
    const parser = createWikiXmlParser((p) => streamed.push(p));
    for (let i = 0; i < xml.length; i += 17) {
      parser.write(xml.slice(i, i + 17));
    }
    parser.close();
    expect(streamed).toEqual(parseWikiXml(xml));
  });

  it("throws on malformed XML", () => {
    expect(() => parseWikiXml("<mediawiki><page></mediawiki>")).toThrow();
  });
});

describe("extractCategories", () => {
  it("collects unique category names, ignoring sort keys", () => {
    expect(
      extractCategories(
        "[[Category:Fool Pathway]] text [[Category:Sequence 9|Seer]] [[Category:Fool Pathway]]",
      ),
    ).toEqual(["Fool Pathway", "Sequence 9"]);
  });

  it("returns nothing when no categories exist", () => {
    expect(extractCategories("plain prose")).toEqual([]);
  });
});

describe("cleanWikitext", () => {
  it("removes nested templates and keeps surrounding prose", () => {
    expect(cleanWikitext("Before {{infobox|a={{nested|x}}|b=y}} after.")).toBe(
      "Before after.",
    );
  });

  it("removes tables", () => {
    expect(cleanWikitext("Intro.\n{| class=x\n! H\n|-\n| cell\n|}\nOutro.")).toBe(
      "Intro.\nOutro.",
    );
  });

  it("removes file/image links including nested links in captions", () => {
    expect(cleanWikitext("[[File:A.png|thumb|The [[canal]] at dusk]]Prose.")).toBe(
      "Prose.",
    );
    expect(cleanWikitext("[[Image:B.jpg|x]]More.")).toBe("More.");
  });

  it("flattens wiki links to their labels or targets", () => {
    expect(cleanWikitext("The [[Fool Pathway|Fool pathway]] and [[Tingen]].")).toBe(
      "The Fool pathway and Tingen.",
    );
  });

  it("drops category and interlanguage links entirely", () => {
    expect(cleanWikitext("Prose. [[Category:Cities]] [[de:Seher]] [[zh-tw:X]]")).toBe(
      "Prose.",
    );
  });

  it("keeps external link labels and drops bare external links", () => {
    expect(
      cleanWikitext("See [https://example.test/decks a tarot deck] [https://x.test]."),
    ).toBe("See a tarot deck .");
  });

  it("removes refs (paired and self-closing), verbatim blocks, and magic words", () => {
    expect(
      cleanWikitext(
        'A.<ref name="s"/> B.<ref>cite</ref> <nowiki>{{raw}}</nowiki> <gallery>F.png</gallery> __NOTOC__ C.',
      ),
    ).toBe("A. B. C.");
  });

  it("turns headings into standalone sentences and strips list markers", () => {
    expect(cleanWikitext("== History ==\n* First item\n# Second item\n;Term")).toBe(
      "History.\nFirst item\nSecond item\nTerm",
    );
    expect(cleanWikitext("=== ===\nBody text here.")).toBe("Body text here.");
  });

  it("strips bold/italic markers and decodes entities via the shared HTML pass", () => {
    expect(cleanWikitext("'''Tingen''' is ''foggy''&hellip; <br/> &amp; damp.")).toBe(
      "Tingen is foggy…\n& damp.",
    );
  });
});

describe("normalizeWikiPage", () => {
  it("keeps only namespace-0 articles", () => {
    expect(normalizeWikiPage(page({ ns: 1 }))).toBeNull();
    expect(normalizeWikiPage(page({ ns: 10 }))).toBeNull();
    expect(normalizeWikiPage(page({}))).not.toBeNull();
  });

  it("skips redirects, by element and by #REDIRECT text", () => {
    expect(normalizeWikiPage(page({ redirect: "Elsewhere" }))).toBeNull();
    expect(normalizeWikiPage(page({ text: "#REDIRECT [[Elsewhere]]" }))).toBeNull();
    expect(normalizeWikiPage(page({ text: "  #redirect [[Elsewhere]]" }))).toBeNull();
  });

  it("skips stubs below the cleaned-prose threshold and honors minChars", () => {
    expect(normalizeWikiPage(page({ text: "Too short." }))).toBeNull();
    expect(
      normalizeWikiPage(page({ text: "Too short." }), { minChars: 5 }),
    ).not.toBeNull();
  });

  it("carries provenance (URL + CC-BY-SA) in ref and categories as tags", () => {
    const doc = normalizeWikiPage(
      page({
        title: "Seer (fixture)",
        text: page({}).text + " [[Category:Fool Pathway]]",
      }),
    );
    expect(doc?.ref).toEqual({
      page: "Seer (fixture)",
      id: 1,
      url: `${DEFAULT_WIKI_BASE_URL}Seer_(fixture)`,
      license: "CC-BY-SA",
    });
    expect(doc?.tags).toEqual(["wiki", "fool-pathway"]);
  });

  it("stamps the operator-chosen concealment tier and null chronology", () => {
    const doc = normalizeWikiPage(page({}), { concealmentTier: 2 });
    expect(doc).toMatchObject({
      source: "wiki",
      canon_order: null,
      arc_bucket: null,
      concealment_tier: 2,
      in_world_date: null,
    });
    expect(normalizeWikiPage(page({}))?.concealment_tier).toBe(0);
  });
});

describe("normalizeWikiPage id disambiguation", () => {
  it("keeps chunk ids unique when long titles collide after slug truncation", () => {
    const longTitle = (suffix: string): string =>
      `Cuttlefish's WeChat Post: "Complete Potion Formulas of the ${suffix} Pathway"`;
    const text = "A long enough body of prose to clear the stub threshold for this page.";
    const docs = normalizeWikiPages([
      page({ title: longTitle("Demoness"), id: 201, text }),
      page({ title: longTitle("Marauder"), id: 202, text }),
    ]);
    const chunks = chunkDocuments(docs, { minTokens: 2, maxTokens: 50 });
    const ids = new Set(chunks.map((c) => c.id));
    expect(ids.size).toBe(chunks.length);
  });
});

describe("normalizeWikiPages (golden fixture)", () => {
  it("produces the expected SourceDocument JSONL from the fixture dump", () => {
    const docs = normalizeWikiPages(parseWikiXml(fixture("wiki-pages.xml")), {
      baseUrl: "https://example.test/wiki/",
    });
    const expected = parseJsonl<SourceDocument>(fixture("wiki-docs.expected.jsonl"));
    expect(docs).toEqual(expected);
  });
});

describe("wiki pipeline end-to-end (fixture -> normalize -> chunk)", () => {
  it("feeds the shared chunker with provenance and null canon position intact", () => {
    const docs = normalizeWikiPages(parseWikiXml(fixture("wiki-pages.xml")));
    const chunks = chunkDocuments(docs, {
      minTokens: 20,
      maxTokens: 80,
      countTokens: wordCount,
    });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.source).toBe("wiki");
      expect(chunk.canon_order).toBeNull();
      expect(chunk.ref.license).toBe("CC-BY-SA");
      expect(chunk.id).toMatch(/^wiki-[a-z0-9-]+-\d{4}$/);
      expect(chunk.tags[0]).toBe("wiki");
    }
  });
});
