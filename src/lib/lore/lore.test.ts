import { describe, expect, it } from "vitest";
import {
  ALL_LORE_ENTRIES,
  BACKLUND_LORE,
  BAYAM_LORE,
  cityNarrationDirective,
  DARKNESS_PATHWAY_LORE,
  DEATH_PATHWAY_LORE,
  DOOR_PATHWAY_LORE,
  ERROR_PATHWAY_LORE,
  FIRST_EPOCH_LORE,
  SECOND_EPOCH_LORE,
  THIRD_EPOCH_LORE,
  FOURTH_EPOCH_LORE,
  FIFTH_EPOCH_LORE,
  FORSAKEN_LAND_LORE,
  FOOL_PATHWAY_LORE,
  selectCuratedLore,
  getLoreByCategory,
  getLoreByCity,
  getLoreByEpoch,
  getLoreByNpc,
  getLoreByPathway,
  getLoreBySequence,
  getLoreBySlug,
  getLoreByTag,
  HANGED_MAN_PATHWAY_LORE,
  WHITE_TOWER_PATHWAY_LORE,
  TWILIGHT_GIANT_PATHWAY_LORE,
  JUSTICIAR_PATHWAY_LORE,
  BLACK_EMPEROR_PATHWAY_LORE,
  RED_PRIEST_PATHWAY_LORE,
  DEMONESS_PATHWAY_LORE,
  MOTHER_PATHWAY_LORE,
  MOON_PATHWAY_LORE,
  HERMIT_PATHWAY_LORE,
  PARAGON_PATHWAY_LORE,
  WHEEL_OF_FORTUNE_PATHWAY_LORE,
  ABYSS_PATHWAY_LORE,
  CHAINED_PATHWAY_LORE,
  LOEN_LORE,
  NPC_LORE,
  ORGANIZATION_LORE,
  REGIONS_LORE,
  SUN_PATHWAY_LORE,
  TINGEN_LORE,
  TRIER_LORE,
  TYRANT_PATHWAY_LORE,
  VISIONARY_PATHWAY_LORE,
} from "./index";
import type { LoreCategory } from "./types";

describe("Lore data integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = ALL_LORE_ENTRIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all entries have non-empty required fields", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.slug).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.content.trim().length).toBeGreaterThan(0);
      expect(entry.tokenCount).toBeGreaterThan(0);
    }
  });

  it("all entries have valid categories", () => {
    const valid: LoreCategory[] = [
      "pathway",
      "npc",
      "location",
      "event",
      "organization",
      "metaphysics",
    ];
    for (const entry of ALL_LORE_ENTRIES) {
      expect(valid).toContain(entry.category);
    }
  });

  it("token counts are within RAG chunk range (100-800)", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.tokenCount).toBeGreaterThanOrEqual(100);
      expect(entry.tokenCount).toBeLessThanOrEqual(800);
    }
  });

  it("slugs are URL-safe", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("arrays default to empty, not undefined", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(Array.isArray(entry.npcs)).toBe(true);
      expect(Array.isArray(entry.sequences)).toBe(true);
      expect(Array.isArray(entry.tags)).toBe(true);
    }
  });

  it("pathway entries have pathway metadata set", () => {
    const pathwayEntries = ALL_LORE_ENTRIES.filter((e) => e.category === "pathway");
    for (const entry of pathwayEntries) {
      expect(entry.pathway).toBeTruthy();
    }
  });
});

describe("Lore content coverage", () => {
  it("has Tingen City location entries", () => {
    expect(TINGEN_LORE.length).toBeGreaterThanOrEqual(5);
    expect(TINGEN_LORE.every((e) => e.category === "location")).toBe(true);
  });

  it("has Backlund, Trier, and Bayam city location sets", () => {
    for (const [lore, city] of [
      [BACKLUND_LORE, "backlund"],
      [TRIER_LORE, "trier"],
      [BAYAM_LORE, "bayam"],
    ] as const) {
      expect(lore.length).toBeGreaterThanOrEqual(5);
      // Every entry carries the city field that selection/narration match on.
      expect(lore.every((e) => e.city === city)).toBe(true);
      // Each set leads with an overview entry.
      expect(lore.some((e) => e.slug === `${city}-city-overview`)).toBe(true);
    }
  });

  it("has the farther Fifth-Epoch start regions with city-keyed overviews", () => {
    expect(REGIONS_LORE.length).toBeGreaterThanOrEqual(3);
    expect(REGIONS_LORE.every((e) => e.category === "location")).toBe(true);
    expect(REGIONS_LORE.every((e) => e.epoch === 5)).toBe(true);
    for (const city of ["pritz", "enmat", "feysac"]) {
      expect(REGIONS_LORE.some((e) => e.city === city)).toBe(true);
    }
  });

  it("has the wider Loen Kingdom locations: Awwa County, Constant, Pritz/Enmat depth (issue #134)", () => {
    expect(LOEN_LORE.length).toBeGreaterThanOrEqual(5);
    expect(LOEN_LORE.every((e) => e.category === "location")).toBe(true);
    expect(LOEN_LORE.every((e) => e.epoch === 5)).toBe(true);
    // Surface geography is ungated player-safe knowledge.
    expect(LOEN_LORE.every((e) => e.narratorOnly === false)).toBe(true);
    // Awwa County is keyed to Tingen (its county) so a Tingen character carries
    // it as regional context; Constant is its own first-class city key.
    expect(getLoreBySlug("awwa-county-overview")?.city).toBe("tingen");
    const constant = getLoreByCity("constant");
    expect(constant.length).toBeGreaterThanOrEqual(3);
    expect(getLoreBySlug("constant-city-overview")).toBeDefined();
    // Added depth for the existing Pritz/Enmat start regions.
    expect(getLoreBySlug("pritz-harbor-naval-yard")?.city).toBe("pritz");
    expect(getLoreBySlug("enmat-harbor-fogbound-trade")?.city).toBe("enmat");
  });

  it("has the Loen regional organizations, leak-safe (issue #134)", () => {
    // The Loen Relic Search & Preservation Foundation is cross-cutting (HQ in
    // Stoen City, not a curated travel city) so it carries NO city key — never
    // curated-injected, like the Numinous Episcopate. Surface ungated; the
    // Compliance Department (a secret Beyonder division) narrator-only + gated.
    const foundation = getLoreBySlug("loen-relic-foundation-overview");
    expect(foundation?.category).toBe("organization");
    expect(foundation?.city).toBeUndefined();
    expect(foundation?.narratorOnly).toBe(false);
    const compliance = getLoreBySlug("loen-relic-foundation-compliance");
    expect(compliance?.narratorOnly).toBe(true);
    expect(compliance!.sequences.length).toBeGreaterThan(0);
    expect(compliance?.city).toBeUndefined();
    // The Red Gloves are the kingdom-wide elite Nighthawk division — no city.
    expect(getLoreBySlug("red-gloves-division")?.city).toBeUndefined();
    // Regional church-Beyonder presences ARE city-keyed to reach a local char.
    expect(getLoreBySlug("mandated-punishers-pritz")?.city).toBe("pritz");
    expect(getLoreBySlug("machinery-hivemind-constant")?.city).toBe("constant");
  });

  it("has the wider Loen NPCs with relationship data, not pathway-keyed (issue #134)", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    for (const name of ["Gawain", "Welch McGovern", "Pacheco Dwayne", "Barton"]) {
      expect(names).toContain(name);
    }
    // City-keyed where the figure belongs to a curated city; the Foundation
    // figures (Stoen City) carry none. NONE is pathway-keyed (the leak rule).
    expect(getLoreBySlug("npc-gawain")?.city).toBe("tingen");
    expect(getLoreBySlug("npc-welch-mcgovern")?.city).toBe("constant");
    expect(getLoreBySlug("npc-pacheco-dwayne")?.city).toBeUndefined();
    expect(getLoreBySlug("npc-barton")?.city).toBeUndefined();
    for (const slug of [
      "npc-gawain",
      "npc-welch-mcgovern",
      "npc-pacheco-dwayne",
      "npc-barton",
    ]) {
      expect(getLoreBySlug(slug)?.pathway).toBeUndefined();
    }
    // Pacheco's Black-Emperor Beyonder nature is a gated spoiler.
    expect(getLoreBySlug("npc-pacheco-dwayne")?.narratorOnly).toBe(true);
  });

  it("has Fifth Epoch baseline entries", () => {
    expect(FIFTH_EPOCH_LORE.length).toBeGreaterThanOrEqual(3);
  });

  it("deepens Trier and the Intis Republic (issue #135)", () => {
    // The stub gains the nation overview, the City-of-Fashion politics, and the
    // wider Republic — all epoch 5, city trier, ungated surface geography.
    const trierLocations = TRIER_LORE.filter((e) => e.category === "location");
    expect(trierLocations.length).toBeGreaterThanOrEqual(7);
    for (const slug of [
      "intis-republic-overview",
      "trier-arts-and-revolution",
      "intis-wider-republic",
    ]) {
      const entry = getLoreBySlug(slug);
      expect(entry).toBeDefined();
      expect(entry!.epoch).toBe(5);
      expect(entry!.city).toBe("trier");
      expect(entry!.narratorOnly).toBe(false);
    }
  });

  it("has the Church of the Eternal Blazing Sun with members (issue #135)", () => {
    const members = getLoreBySlug("blazing-sun-church-members");
    expect(members?.category).toBe("organization");
    expect(members?.city).toBe("trier");
    expect(members?.narratorOnly).toBe(false);
    // Named, corpus-verified members of the Trier church.
    for (const name of ["Plessy Descartes", "Viève", "Angoulême de François"]) {
      expect(members!.npcs).toContain(name);
    }
  });

  it("has the Aurora Order true-nature depth, gated and leak-safe (issue #135)", () => {
    // The deep cult lore is a cross-cutting high-concealment secret: narrator-
    // only + sequence-gated, and carrying NO city/pathway key so selectCuratedLore
    // never injects it (the Numinous Episcopate pattern). The ungated public
    // `aurora-order-overview` stays as the surface entry.
    const deep = getLoreBySlug("aurora-order-true-nature");
    expect(deep?.narratorOnly).toBe(true);
    expect(deep!.sequences.length).toBeGreaterThan(0);
    expect(deep?.city).toBeUndefined();
    expect(deep?.pathway).toBeUndefined();
    // Corpus canon: the Aurora Order's pathway is the Hanged Man, not the Sun.
    expect(deep!.tags).toContain("hanged-man-pathway");
    expect(getLoreBySlug("aurora-order-overview")).toBeDefined();
    // End-to-end leak guard: even at the most permissive injection point — the
    // Order's own Hanged Man pathway, an Intis location, a deep sequence, a huge
    // budget — selectCuratedLore never injects the gated true-nature entry.
    const injected = selectCuratedLore("hanged man", "Trier", 100_000, 5, 1).entries.map(
      (e) => e.slug,
    );
    expect(injected).not.toContain("aurora-order-true-nature");
  });

  it("has the Intis NPCs with relationship data, not pathway-keyed (issue #135)", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    for (const name of ["Viève", "Plessy Descartes", "Angoulême de François"]) {
      expect(names).toContain(name);
    }
    for (const slug of [
      "npc-saint-vieve",
      "npc-plessy-descartes",
      "npc-angouleme-de-francois",
    ]) {
      const entry = getLoreBySlug(slug);
      expect(entry?.city).toBe("trier");
      // City-keyed but NOT pathway-keyed (the #132 leak rule); narrator-only for
      // the Angel/Saint/Beyonder truths beneath their public church roles.
      expect(entry?.pathway).toBeUndefined();
      expect(entry?.narratorOnly).toBe(true);
    }
    // Leak guard: because they are not pathway-keyed, none of the Trier NPCs is
    // reachable via the pathway index — a Sun character anywhere never has a
    // Trier NPC injected by the pathway selector (the #132 leak rule).
    const sunPathwaySlugs = getLoreByPathway("sun").map((e) => e.slug);
    for (const slug of [
      "npc-saint-vieve",
      "npc-plessy-descartes",
      "npc-angouleme-de-francois",
    ]) {
      expect(sunPathwaySlugs).not.toContain(slug);
    }
  });

  describe("Orthodox Churches sweep (issue #139)", () => {
    const CHURCH_OVERVIEWS = [
      "evernight-church-overview",
      "storms-church-overview",
      "steam-church-overview",
      "knowledge-church-overview",
      "earth-mother-church-overview",
      "combat-church-overview",
      "fool-church-overview",
      // The Church of the Eternal Blazing Sun's roster shipped in issue #135.
      "blazing-sun-church-members",
    ];
    const CHURCH_SECRETS = [
      "evernight-church-inner-secret",
      "storms-church-inner-secret",
      "steam-church-inner-secret",
      "knowledge-church-inner-secret",
      "earth-mother-church-inner-secret",
      "combat-church-inner-secret",
      "fool-church-inner-secret",
      "blazing-sun-church-inner-secret",
    ];

    it("authors all eight Churches with a public overview that carries members", () => {
      for (const slug of CHURCH_OVERVIEWS) {
        const e = getLoreBySlug(slug);
        expect(e, slug).toBeDefined();
        expect(e!.category).toBe("organization");
        expect(e!.epoch).toBe(5);
        // Public doctrine/structure is ungated.
        expect(e!.narratorOnly).toBe(false);
        expect(e!.sequences).toEqual([]);
        // The org lists its members.
        expect(e!.npcs.length).toBeGreaterThan(0);
      }
    });

    it("gates each Church's true-god nature: narrator-only, sequence-gated, leak-safe", () => {
      for (const slug of CHURCH_SECRETS) {
        const e = getLoreBySlug(slug);
        expect(e, slug).toBeDefined();
        expect(e!.category).toBe("organization");
        expect(e!.narratorOnly).toBe(true);
        expect(e!.sequences.length).toBeGreaterThan(0);
        // Cross-cutting high-concealment secret: NO city/pathway key, so
        // selectCuratedLore never injects it (the aurora-order-true-nature pattern).
        expect(e!.city).toBeUndefined();
        expect(e!.pathway).toBeUndefined();
      }
      // End-to-end leak guard at a permissive injection point (Darkness char in a
      // church seat city, deep sequence, huge budget): no inner secret leaks.
      const injected = selectCuratedLore("darkness", "Bayam", 100_000, 5, 1).entries.map(
        (x) => x.slug,
      );
      for (const slug of CHURCH_SECRETS) expect(injected).not.toContain(slug);
    });

    it("resolves each Church's headline member to an npc entry (members resolve)", () => {
      const memberNpcs: [string, string, string][] = [
        ["evernight-church-overview", "npc-arianna", "Arianna"],
        ["storms-church-overview", "npc-jahn-kottman", "Jahn Kottman"],
        ["steam-church-overview", "npc-bornova-gustav", "Bornova Gustav"],
        ["knowledge-church-overview", "npc-isengard-stanton", "Isengard Stanton"],
        ["earth-mother-harvest-church-backlund", "npc-utravsky", "Utravsky"],
        ["combat-church-overview", "npc-larrion", "Larrion"],
        // Derrick Berg, the Fool's Pope, was authored in issue #132.
        ["fool-church-overview", "npc-derrick-berg", "Derrick Berg"],
      ];
      for (const [orgSlug, npcSlug, name] of memberNpcs) {
        const org = getLoreBySlug(orgSlug);
        const npc = getLoreBySlug(npcSlug);
        expect(org, orgSlug).toBeDefined();
        expect(npc, npcSlug).toBeDefined();
        expect(npc!.category).toBe("npc");
        expect(org!.npcs).toContain(name);
        expect(npc!.npcs).toContain(name);
      }
    });

    it("Church members are city-keyed but never pathway-keyed (the #132 leak rule)", () => {
      const churchNpcSlugs = [
        "npc-arianna",
        "npc-gaard-ii",
        "npc-jahn-kottman",
        "npc-bornova-gustav",
        "npc-horamick-haydn",
        "npc-isengard-stanton",
        "npc-edwina-edwards",
        "npc-brignais",
        "npc-emlyn-white",
        "npc-utravsky",
        "npc-matriarch-roland",
        "npc-larrion",
        "npc-valentine-de-lacourt",
      ];
      for (const slug of churchNpcSlugs) {
        const e = getLoreBySlug(slug);
        expect(e, slug).toBeDefined();
        expect(e!.category).toBe("npc");
        expect(e!.pathway).toBeUndefined();
        // Narrator-only for the Angel/Saint/Beyonder truths beneath public roles.
        expect(e!.narratorOnly).toBe(true);
      }
      // A Sun character anywhere never has the Blazing Sun Purifier injected via
      // the pathway selector — he is city-keyed (trier), not pathway-keyed.
      expect(getLoreByPathway("sun").map((e) => e.slug)).not.toContain(
        "npc-valentine-de-lacourt",
      );
    });

    it("Harvest Church is the Earth Mother's Backlund branch, city-keyed", () => {
      const harvest = getLoreBySlug("earth-mother-harvest-church-backlund");
      expect(harvest?.category).toBe("organization");
      expect(harvest?.city).toBe("backlund");
      expect(harvest?.narratorOnly).toBe(false);
      expect(harvest!.npcs).toContain("Utravsky");
    });
  });

  it("has Forsaken Land content, epoch-split and city-keyed (issue #132)", () => {
    expect(FORSAKEN_LAND_LORE.length).toBeGreaterThanOrEqual(5);
    // Every entry is tagged for exactly one epoch — the playable present (5) or
    // the Third-Epoch fall (3) — never mixed (passesEpochGate is exact-match).
    expect(FORSAKEN_LAND_LORE.every((e) => e.epoch === 5 || e.epoch === 3)).toBe(true);
    // The present-day entries are city-keyed (silver / giant) so curated
    // selection only injects them for a character actually there — never the
    // mainland. None is `metaphysics` (which would inject into every Fifth prompt).
    for (const e of FORSAKEN_LAND_LORE.filter((x) => x.epoch === 5)) {
      expect(e.category).not.toBe("metaphysics");
      expect(e.city === "silver" || e.city === "giant" || e.city === "moon").toBe(true);
    }
    // The Third-Epoch fall is kept as separate history.
    expect(
      FORSAKEN_LAND_LORE.some(
        (e) => e.epoch === 3 && e.slug === "forsaken-land-sundering",
      ),
    ).toBe(true);
    // The City of Silver and Giant King's Court overviews exist.
    expect(getLoreBySlug("city-of-silver-overview")).toBeDefined();
    expect(getLoreBySlug("giant-kings-court-overview")).toBeDefined();
  });

  it("adds Moon City, gated apart from the City of Silver (issue #133)", () => {
    // Moon City is city-keyed "moon" — curated selection only injects it for a
    // character actually there, so a Silver native never receives Moon lore and
    // vice versa (the two were mutually unaware until late canon).
    const moon = getLoreByCity("moon");
    expect(moon.length).toBeGreaterThanOrEqual(3);
    expect(moon.every((e) => e.epoch === 5 && e.city === "moon")).toBe(true);
    expect(getLoreBySlug("moon-city-overview")).toBeDefined();
    // The gray-fog edge is Moon City's watch (re-keyed from silver), so a City-
    // of-Silver native no longer receives it.
    expect(getLoreBySlug("forsaken-land-eastern-grayfog")?.city).toBe("moon");
    const silver = getLoreByCity("silver").map((e) => e.slug);
    expect(silver).not.toContain("forsaken-land-eastern-grayfog");
    expect(silver).not.toContain("moon-city-overview");
    // Moon City's High Priest Nim: city-keyed, NOT pathway-keyed (leak rule).
    const nim = getLoreBySlug("npc-nim");
    expect(nim?.city).toBe("moon");
    expect(nim?.pathway).toBeUndefined();
  });

  it("never injects Forsaken present-day lore into a mainland character's curated lore", () => {
    // selectCuratedLore pulls city lore by the location's leading word and epoch
    // setting (metaphysics) — never an organization/npc, and never a city the
    // character isn't in. A central Fifth character is never at "silver"/"giant",
    // so getLoreByCity for those keys is the ONLY way the present lore surfaces.
    for (const city of ["silver", "giant"]) {
      const entries = getLoreByCity(city);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.epoch === 5)).toBe(true);
    }
    // No epoch-5 Forsaken metaphysics entry exists to leak via getLoreByEpochSetting.
    const fifthSetting = getLoreByEpoch(5).filter((e) => e.category === "metaphysics");
    expect(fifthSetting.every((e) => !e.tags.includes("forsaken-land"))).toBe(true);
  });

  it("has the Numinous Episcopate organization (issue #132)", () => {
    const episcopate = ORGANIZATION_LORE.filter((e) =>
      e.tags.includes("numinous-episcopate"),
    );
    expect(episcopate.length).toBeGreaterThanOrEqual(2);
    // Its true goal is a deep spoiler: narrator-only and sequence-gated.
    const deep = episcopate.find((e) => e.slug === "numinous-episcopate-true-goal");
    expect(deep?.narratorOnly).toBe(true);
    expect(deep!.sequences.length).toBeGreaterThan(0);
  });

  it("has the City-of-Silver NPCs with relationship data (issue #132)", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    expect(names).toContain("Derrick Berg");
    expect(names).toContain("Giant King Aurmir");
  });

  it("has deepened Backlund to capital depth (issue #133)", () => {
    // The stub gains notable boroughs/landmarks, bringing Backlund toward
    // Tingen-level depth. Every location entry stays epoch 5, city backlund.
    const locations = BACKLUND_LORE.filter((e) => e.category === "location");
    expect(locations.length).toBeGreaterThanOrEqual(8);
    for (const slug of [
      "backlund-boroughs-structure",
      "backlund-harbor-docklands",
      "backlund-underground-ruins",
      "backlund-financial-district",
    ]) {
      const entry = getLoreBySlug(slug);
      expect(entry).toBeDefined();
      expect(entry!.epoch).toBe(5);
      expect(entry!.city).toBe("backlund");
      // Surface, street-level geography is ungated player-safe knowledge.
      expect(entry!.narratorOnly).toBe(false);
    }
  });

  it("has the Backlund organizations, corpus-corrected and leak-safe (issue #133)", () => {
    // Rose School of Thought (canon: Mother Tree of Desire / Chained pathway, an
    // Indulgence-vs-Temperance schism — NOT the Evernight Goddess). It is a
    // cross-cutting secret society, not Backlund-local, so like the Numinous
    // Episcopate it carries NO city (never curated-injected): surface ungated,
    // the schism sequence-gated + narrator-only.
    const roseSurface = getLoreBySlug("rose-school-of-thought-overview");
    const roseDeep = getLoreBySlug("rose-school-of-thought-factions");
    expect(roseSurface?.city).toBeUndefined();
    expect(roseSurface?.narratorOnly).toBe(false);
    expect(roseSurface!.sequences).toEqual([]);
    expect(roseSurface!.tags).toContain("chained-pathway");
    // The corrected entry must not reattach the wrong Evernight-Goddess framing.
    expect(roseSurface!.tags).not.toContain("evernight-goddess");
    expect(roseDeep?.narratorOnly).toBe(true);
    expect(roseDeep!.sequences.length).toBeGreaterThan(0);
    // The capital's own Nighthawks division stays city-keyed (Backlund-local).
    expect(getLoreBySlug("backlund-nighthawks-team")?.city).toBe("backlund");
  });

  it("keeps the Rose School and Tarot Club leak-safe: no city and no pathway key (issue #133)", () => {
    // selectCuratedLore injects by city AND by pathway, so a city/pathway key on a
    // cross-cutting secret would leak it into every Backlund or every same-pathway
    // character's prompt. The Rose School and Tarot Club must carry neither.
    const crossCutting = ORGANIZATION_LORE.filter(
      (e) => e.tags.includes("tarot-club") || e.tags.includes("rose-school-of-thought"),
    );
    expect(crossCutting.length).toBeGreaterThanOrEqual(4);
    for (const e of crossCutting) {
      expect(e.city).toBeUndefined();
      expect(e.pathway).toBeUndefined();
    }
    // Both Tarot entries are narrator-only + sequence-gated secrets.
    for (const e of ORGANIZATION_LORE.filter((x) => x.tags.includes("tarot-club"))) {
      expect(e.narratorOnly).toBe(true);
      expect(e.sequences.length).toBeGreaterThan(0);
    }
  });

  it("has the corrected Backlund NPCs + the Great Smog event, not pathway-keyed (issue #133)", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    // Audrey's full family (corpus): father the Earl, mother Caitlyn, brothers
    // Hibbert and Alfred.
    for (const name of ["Audrey Hall", "Hibbert Hall", "Alfred Hall", "Caitlyn Hall"]) {
      expect(names).toContain(name);
    }
    // Klein's Backlund cover identities and the Bravehearts (Temperance) exiles.
    expect(names).toContain("Sherlock Moriarty");
    expect(names).toContain("Dwayne Dantès");
    expect(names).toContain("Sharron");
    expect(names).toContain("Maric");
    // Alger Wilson was REMOVED — he is a Sonia Sea figure, not Backlund, and the
    // earlier Rose-School attribution was a memory error caught against the corpus.
    expect(names).not.toContain("Alger Wilson");
    // City-keyed Backlund NPCs are NOT pathway-keyed (the issue #132 leak rule).
    const audrey = getLoreBySlug("npc-audrey-hall");
    expect(audrey?.city).toBe("backlund");
    expect(audrey?.pathway).toBeUndefined();
    // The Great Smog is a Backlund historical event (gated — its true cause is secret).
    const smog = getLoreBySlug("backlund-great-smog");
    expect(smog?.category).toBe("event");
    expect(smog?.city).toBe("backlund");
    expect(smog!.sequences.length).toBeGreaterThan(0);
  });

  it("has rich, correctly-tagged lore for each pre-Iron-Age epoch", () => {
    for (const [lore, epoch, overview] of [
      [FIRST_EPOCH_LORE, 1, "first-epoch-overview"],
      [SECOND_EPOCH_LORE, 2, "second-epoch-overview"],
      [THIRD_EPOCH_LORE, 3, "third-epoch-overview"],
      [FOURTH_EPOCH_LORE, 4, "fourth-epoch-overview"],
    ] as const) {
      expect(lore.length).toBeGreaterThanOrEqual(3);
      // Every entry is tagged for exactly its epoch — no crossover.
      expect(lore.every((e) => e.epoch === epoch)).toBe(true);
      // Each set leads with a metaphysics overview that curated selection injects.
      const lead = lore.find((e) => e.slug === overview);
      expect(lead).toBeDefined();
      expect(lead!.category).toBe("metaphysics");
    }
  });

  it("isolates epochs: getLoreByEpoch never mixes eras", () => {
    for (const epoch of [1, 2, 3, 4, 5]) {
      const entries = getLoreByEpoch(epoch);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.epoch === epoch)).toBe(true);
    }
  });

  it("treats the curated pathway lore prose as Fifth-Epoch-framed", () => {
    // Pathways exist in every era, but the curated lore PROSE is written with
    // Fifth-Epoch framing (churches, Nighthawks, gaslight), so it is tagged
    // epoch 5 and gated out of earlier epochs to avoid crossover. The pathway
    // MECHANICS reach every epoch through the rules engine, not this lore.
    const pathwayEntries = ALL_LORE_ENTRIES.filter((e) => e.category === "pathway");
    expect(pathwayEntries.length).toBeGreaterThan(0);
    expect(pathwayEntries.every((e) => e.epoch === 5)).toBe(true);
  });

  it("has Nighthawks organization entries", () => {
    const nighthawk = ORGANIZATION_LORE.filter((e) => e.tags.includes("nighthawks"));
    expect(nighthawk.length).toBeGreaterThanOrEqual(2);
  });

  it("has key Tingen NPC entries", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    expect(names).toContain("Dunn Smith");
    expect(names).toContain("Leonard Mitchell");
    expect(names).toContain("Klein Moretti");
    expect(names).toContain("Old Neil");
    expect(names).toContain("Daly Simone");
    expect(names).toContain("Azik Eggers");
  });

  it("covers all 9 pathways (Seq 9-5)", () => {
    for (const lore of [
      FOOL_PATHWAY_LORE,
      VISIONARY_PATHWAY_LORE,
      SUN_PATHWAY_LORE,
      DEATH_PATHWAY_LORE,
      DARKNESS_PATHWAY_LORE,
      TYRANT_PATHWAY_LORE,
      DOOR_PATHWAY_LORE,
      ERROR_PATHWAY_LORE,
      HANGED_MAN_PATHWAY_LORE,
    ]) {
      expect(lore.length).toBeGreaterThanOrEqual(6);
      const seqs = lore.flatMap((e) => e.sequences);
      expect(seqs).toContain(9);
      expect(seqs).toContain(8);
      expect(seqs).toContain(7);
      expect(seqs).toContain(6);
      expect(seqs).toContain(5);
    }
  });

  it("each pathway has an overview entry", () => {
    for (const pathway of [
      "fool",
      "visionary",
      "sun",
      "death",
      "darkness",
      "tyrant",
      "door",
      "error",
      "hanged-man",
    ]) {
      const overview = ALL_LORE_ENTRIES.find(
        (e) => e.slug === `${pathway}-pathway-overview`,
      );
      expect(overview).toBeDefined();
    }
  });
});

describe("Lore query helpers", () => {
  it("getLoreByCategory filters correctly", () => {
    const locations = getLoreByCategory("location");
    expect(locations.length).toBeGreaterThan(0);
    expect(locations.every((e) => e.category === "location")).toBe(true);
  });

  it("getLoreByPathway filters correctly", () => {
    const fool = getLoreByPathway("fool");
    expect(fool.length).toBeGreaterThan(0);
    expect(fool.every((e) => e.pathway === "fool")).toBe(true);
  });

  it("getLoreByCity filters correctly", () => {
    const tingen = getLoreByCity("tingen");
    expect(tingen.length).toBeGreaterThan(0);
    expect(tingen.every((e) => e.city === "tingen")).toBe(true);
  });

  it("getLoreByEpoch filters correctly", () => {
    const epoch5 = getLoreByEpoch(5);
    expect(epoch5.length).toBeGreaterThan(0);
    expect(epoch5.every((e) => e.epoch === 5)).toBe(true);
  });

  it("getLoreBySlug returns unique entry", () => {
    const entry = getLoreBySlug("npc-dunn-smith");
    expect(entry).toBeDefined();
    expect(entry!.title).toContain("Dunn Smith");
  });

  it("getLoreBySlug returns undefined for missing slug", () => {
    expect(getLoreBySlug("nonexistent")).toBeUndefined();
  });

  it("getLoreByTag filters correctly", () => {
    const nighthawk = getLoreByTag("nighthawks");
    expect(nighthawk.length).toBeGreaterThan(0);
    expect(nighthawk.every((e) => e.tags.includes("nighthawks"))).toBe(true);
  });

  it("getLoreByNpc filters correctly", () => {
    const klein = getLoreByNpc("Klein Moretti");
    expect(klein.length).toBeGreaterThan(0);
    expect(klein.every((e) => e.npcs.includes("Klein Moretti"))).toBe(true);
  });

  it("getLoreBySequence filters correctly", () => {
    const seq9 = getLoreBySequence(9);
    expect(seq9.length).toBeGreaterThan(0);
    expect(seq9.every((e) => e.sequences.includes(9))).toBe(true);
  });
});

describe("cityNarrationDirective", () => {
  it("returns a tone sentence for each new city, matching the first word", () => {
    expect(cityNarrationDirective("Backlund")).toContain("capital");
    expect(cityNarrationDirective("Empress Borough, Backlund")).toBeNull();
    expect(cityNarrationDirective("Backlund — East Borough")).toContain("Dust");
    expect(cityNarrationDirective("Trier")).toContain("Intis");
    expect(cityNarrationDirective("Bayam Harbour")).toContain("Archipelago");
  });

  it("gives the farther start regions their own tone", () => {
    expect(cityNarrationDirective("Pritz Harbor")).toContain("naval");
    expect(cityNarrationDirective("Enmat Harbor")).toContain("coastal");
    expect(cityNarrationDirective("Feysac")).toContain("God of Combat");
  });

  it("gives Constant City its own tone (issue #134)", () => {
    expect(cityNarrationDirective("Constant City")).toContain("Wind City");
  });

  it("gives the Forsaken Land cities their own tone (issue #132)", () => {
    expect(cityNarrationDirective("Silver City")).toContain("Forsaken Land");
    expect(cityNarrationDirective("Giant King's Court")).toContain("Forsaken Land");
  });

  it("returns null for unknown or unmapped locations", () => {
    expect(cityNarrationDirective("Tingen City")).toBeNull();
    expect(cityNarrationDirective("Backwater Village")).toBeNull();
    expect(cityNarrationDirective("")).toBeNull();
    expect(cityNarrationDirective("   ")).toBeNull();
  });

  it("is case-insensitive on the leading word", () => {
    expect(cityNarrationDirective("BAYAM")).toBe(cityNarrationDirective("bayam"));
  });
});

describe("Total lore corpus", () => {
  it("aggregates all sub-collections", () => {
    const expected =
      TINGEN_LORE.length +
      BACKLUND_LORE.length +
      TRIER_LORE.length +
      BAYAM_LORE.length +
      REGIONS_LORE.length +
      LOEN_LORE.length +
      FORSAKEN_LAND_LORE.length +
      FIRST_EPOCH_LORE.length +
      SECOND_EPOCH_LORE.length +
      THIRD_EPOCH_LORE.length +
      FOURTH_EPOCH_LORE.length +
      FIFTH_EPOCH_LORE.length +
      ORGANIZATION_LORE.length +
      NPC_LORE.length +
      FOOL_PATHWAY_LORE.length +
      VISIONARY_PATHWAY_LORE.length +
      SUN_PATHWAY_LORE.length +
      DEATH_PATHWAY_LORE.length +
      DARKNESS_PATHWAY_LORE.length +
      TYRANT_PATHWAY_LORE.length +
      DOOR_PATHWAY_LORE.length +
      ERROR_PATHWAY_LORE.length +
      HANGED_MAN_PATHWAY_LORE.length +
      WHITE_TOWER_PATHWAY_LORE.length +
      TWILIGHT_GIANT_PATHWAY_LORE.length +
      JUSTICIAR_PATHWAY_LORE.length +
      BLACK_EMPEROR_PATHWAY_LORE.length +
      RED_PRIEST_PATHWAY_LORE.length +
      DEMONESS_PATHWAY_LORE.length +
      MOTHER_PATHWAY_LORE.length +
      MOON_PATHWAY_LORE.length +
      HERMIT_PATHWAY_LORE.length +
      PARAGON_PATHWAY_LORE.length +
      WHEEL_OF_FORTUNE_PATHWAY_LORE.length +
      ABYSS_PATHWAY_LORE.length +
      CHAINED_PATHWAY_LORE.length;
    expect(ALL_LORE_ENTRIES.length).toBe(expected);
  });

  it("total token count is within expected MVP range", () => {
    const total = ALL_LORE_ENTRIES.reduce((sum, e) => sum + e.tokenCount, 0);
    expect(total).toBeGreaterThan(5000);
    expect(total).toBeLessThan(80000);
  });

  it("every one of the 22 pathways has retrievable overview lore (issue #28)", () => {
    // getLoreByPathway is separator/case-insensitive, so selectCuratedLore
    // resolves a pathway by its rules-engine name (e.g. "Hanged Man" → "hanged
    // man") even though the stored field is hyphenated. These keys mirror the
    // lowercased ALL_PATHWAYS names selectCuratedLore passes.
    const pathwayKeys = [
      "fool",
      "visionary",
      "sun",
      "death",
      "darkness",
      "tyrant",
      "door",
      "error",
      "hanged man",
      "white tower",
      "twilight giant",
      "justiciar",
      "black emperor",
      "red priest",
      "demoness",
      "mother",
      "moon",
      "hermit",
      "paragon",
      "wheel of fortune",
      "abyss",
      "chained",
    ];
    for (const key of pathwayKeys) {
      expect(getLoreByPathway(key).length).toBeGreaterThan(0);
    }
  });
});
