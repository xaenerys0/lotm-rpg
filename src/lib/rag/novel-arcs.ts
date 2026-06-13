// ---------------------------------------------------------------------------
// Hand-authored novel arc map (issue #62)
// ---------------------------------------------------------------------------
//
// The "light hand-authored mapping" from chapter ranges to the chronology
// signals the timeline/concealment gate depends on. `canon_order` itself is
// free (the chapter index); this map supplies the other three signals —
// `arc_bucket`, `concealment_tier`, and the coarse `in_world_date` where canon
// provides one.
//
// The chapter boundaries below were VERIFIED against the real EPUB at ingest
// (the eight volume title pages give each volume's first chapter; ranges run to
// the chapter before the next volume, and the final volume to chapter 1430).
// The `pnpm rag:novel --arc-map <file>` flag still accepts an override JSON map
// without a code change. Spoiler-bearing volumes carry a higher concealment
// tier; in-world dates beyond Volume 1 are left null until they are confirmed
// from the text.

/** One contiguous chapter range mapped to its chronology signals. */
export interface NovelArcEntry {
  arc_bucket: string;
  /** First chapter of the range (inclusive). */
  fromChapter: number;
  /** Last chapter of the range (inclusive). */
  toChapter: number;
  concealment_tier: number;
  in_world_date: string | null;
}

/** Default arc map for the Lord of the Mysteries web novel (Book 1, 8 volumes). */
export const LOTM_NOVEL_ARC_MAP: readonly NovelArcEntry[] = [
  {
    arc_bucket: "clown",
    fromChapter: 1,
    toChapter: 213,
    concealment_tier: 0,
    in_world_date: "1349",
  },
  {
    arc_bucket: "faceless",
    fromChapter: 214,
    toChapter: 482,
    concealment_tier: 0,
    in_world_date: null,
  },
  {
    arc_bucket: "traveler",
    fromChapter: 483,
    toChapter: 732,
    concealment_tier: 1,
    in_world_date: null,
  },
  {
    arc_bucket: "undying",
    fromChapter: 733,
    toChapter: 946,
    concealment_tier: 1,
    in_world_date: null,
  },
  {
    arc_bucket: "red-priest",
    fromChapter: 947,
    toChapter: 1150,
    concealment_tier: 2,
    in_world_date: null,
  },
  {
    arc_bucket: "lightseeker",
    fromChapter: 1151,
    toChapter: 1266,
    concealment_tier: 3,
    in_world_date: null,
  },
  {
    arc_bucket: "hanged-man",
    fromChapter: 1267,
    toChapter: 1353,
    concealment_tier: 4,
    in_world_date: null,
  },
  {
    arc_bucket: "fool",
    fromChapter: 1354,
    toChapter: 1430,
    concealment_tier: 4,
    in_world_date: null,
  },
];

/** Look up the arc entry covering a chapter, or `null` when unmapped. */
export function resolveArc(
  chapter: number,
  arcMap: readonly NovelArcEntry[] = LOTM_NOVEL_ARC_MAP,
): NovelArcEntry | null {
  return (
    arcMap.find((arc) => chapter >= arc.fromChapter && chapter <= arc.toChapter) ?? null
  );
}
