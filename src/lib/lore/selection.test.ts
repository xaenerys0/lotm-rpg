import { describe, expect, it } from "vitest";

import { selectCuratedLore, passesSequenceGate } from "./selection";
import { ALL_PATHWAYS } from "@/lib/rules";

describe("selectCuratedLore", () => {
  it("selects pathway lore, the epoch setting, then city lore, deduped by slug", () => {
    const ctx = selectCuratedLore("fool", "Tingen City", 100000);
    expect(ctx.entries.length).toBeGreaterThan(0);
    const slugs = ctx.entries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(ctx.entries.some((e) => e.pathway === "fool")).toBe(true);
    expect(ctx.entries.some((e) => e.city === "tingen")).toBe(true);
    // The Fifth-Epoch world overview (metaphysics) is injected as setting context.
    expect(ctx.entries.some((e) => e.slug === "fifth-epoch-overview")).toBe(true);
    expect(ctx.totalTokens).toBe(ctx.entries.reduce((sum, e) => sum + e.tokenCount, 0));
  });

  it("stops at the first entry that would overflow the budget", () => {
    const unbounded = selectCuratedLore("fool", "Tingen City", 100000);
    const first = unbounded.entries[0];
    const ctx = selectCuratedLore("fool", "Tingen City", first.tokenCount);
    expect(ctx.entries).toEqual([first]);
    expect(ctx.totalTokens).toBe(first.tokenCount);
  });

  it("returns only the epoch setting for an unknown pathway and location", () => {
    const ctx = selectCuratedLore("nonexistent", "Nowhere", 100000);
    // No pathway/city match, but the character's epoch (default Fifth) still
    // carries its world-setting overview entries.
    expect(ctx.entries.length).toBeGreaterThan(0);
    expect(ctx.entries.every((e) => e.epoch === 5 && e.category === "metaphysics")).toBe(
      true,
    );
  });

  it("matches city lore on the first word of the location", () => {
    const byFullName = selectCuratedLore("nonexistent", "Tingen City", 100000);
    const byFirstWord = selectCuratedLore("nonexistent", "Tingen", 100000);
    expect(byFullName.entries).toEqual(byFirstWord.entries);
  });

  it("isolates epochs: a non-Fifth character gets its own setting, never Tingen", () => {
    // Even asked for "fool" + "Tingen City", a First-Epoch character receives
    // neither the Fifth-flavored fool pathway prose nor the Fifth-Epoch city —
    // only First-Epoch lore. (Pathway mechanics reach them via the rules engine.)
    const first = selectCuratedLore("fool", "Tingen City", 100000, 1);
    const slugs = first.entries.map((e) => e.slug);
    expect(slugs).toContain("first-epoch-overview");
    expect(slugs.some((s) => s.startsWith("tingen"))).toBe(false);
    expect(slugs).not.toContain("fifth-epoch-overview");
    expect(slugs.some((s) => s.endsWith("pathway-overview"))).toBe(false);
    // Every selected entry belongs to the First Epoch — no crossover.
    expect(first.entries.every((e) => e.epoch === 1)).toBe(true);
  });

  it("gives each non-Fifth epoch its own setting overview", () => {
    for (const [epoch, slug] of [
      [1, "first-epoch-overview"],
      [2, "second-epoch-overview"],
      [3, "third-epoch-overview"],
      [4, "fourth-epoch-overview"],
    ] as const) {
      const ctx = selectCuratedLore("nonexistent", "Nowhere", 100000, epoch);
      expect(ctx.entries.map((e) => e.slug)).toContain(slug);
    }
  });

  it("sequence-gates pathway lore: a fresh Seq 9 character sees the overview and Seq 9 entry but not deeper rungs", () => {
    const atNine = selectCuratedLore("fool", "Tingen City", 100000, 5, 9);
    const slugs = atNine.entries.map((e) => e.slug);
    // Overview (sequences [9,8,7,6,5], earliest rung is 9) and the Seq 9 entry pass.
    expect(slugs).toContain("fool-pathway-overview");
    expect(slugs).toContain("fool-seq9-seer");
    // The Seq 8 write-up describes a rung not yet reached — gated out.
    expect(slugs).not.toContain("fool-seq8-clown");
  });

  it("reveals a deeper rung once the character has reached it", () => {
    const atEight = selectCuratedLore("fool", "Tingen City", 100000, 5, 8);
    const slugs = atEight.entries.map((e) => e.slug);
    expect(slugs).toContain("fool-seq8-clown");
  });

  it("omitting sequenceLevel preserves prior behaviour (no rung gating)", () => {
    const ungated = selectCuratedLore("fool", "Tingen City", 100000, 5);
    const slugs = ungated.entries.map((e) => e.slug);
    expect(slugs).toContain("fool-seq8-clown");
  });

  it("excludeNpc drops the takeover player's own dossier and any entry naming them (issue #92)", () => {
    // A Fool player IS Klein: the Klein NPC entry and every Fool/Tingen entry
    // tagged with him must be withheld from the narrator.
    const withKlein = selectCuratedLore("fool", "Tingen City", 100000, 5, 9);
    expect(withKlein.entries.some((e) => e.npcs.includes("Klein Moretti"))).toBe(true);

    const excluded = selectCuratedLore(
      "fool",
      "Tingen City",
      100000,
      5,
      9,
      "Klein Moretti",
    );
    expect(excluded.entries.some((e) => e.npcs.includes("Klein Moretti"))).toBe(false);
    expect(excluded.entries.some((e) => e.slug === "npc-klein-moretti")).toBe(false);
    // Unrelated entries that don't name the player (era setting, city geography
    // not tagged with Klein) still pass — only Klein-tagged prose is withheld.
    expect(excluded.entries.length).toBeGreaterThan(0);
    expect(excluded.entries.some((e) => e.slug === "fifth-epoch-overview")).toBe(true);
  });

  it("excludeNpc is case/space-insensitive and a no-op when omitted", () => {
    const a = selectCuratedLore(
      "fool",
      "Tingen City",
      100000,
      5,
      9,
      "  klein   moretti ",
    );
    expect(a.entries.some((e) => e.npcs.includes("Klein Moretti"))).toBe(false);
    const b = selectCuratedLore("fool", "Tingen City", 100000, 5, 9);
    expect(b.entries.some((e) => e.npcs.includes("Klein Moretti"))).toBe(true);
  });
});

describe("passesSequenceGate", () => {
  it("passes everything when the character sequence is unknown", () => {
    expect(passesSequenceGate([8], undefined)).toBe(true);
  });

  it("passes entries with no sequence tag (geography, era, organizations)", () => {
    expect(passesSequenceGate([], 9)).toBe(true);
  });

  it("reveals a rung only once the character has reached its earliest sequence", () => {
    // entry covers Seq 8; you start at 9 and descend.
    expect(passesSequenceGate([8], 9)).toBe(false);
    expect(passesSequenceGate([8], 8)).toBe(true);
    expect(passesSequenceGate([8], 7)).toBe(true);
  });

  it("uses the highest-numbered (earliest) sequence of a multi-rung entry", () => {
    expect(passesSequenceGate([9, 8, 7, 6, 5], 9)).toBe(true);
  });
});

describe("Forsaken Land leak control (issue #132)", () => {
  it("never injects Forsaken-tagged lore for a mainland character of ANY pathway", () => {
    // The DoD invariant: a non-qualifying (central-continent) character sees NO
    // Forsaken content. selectCuratedLore pulls pathway lore location-INDEPENDENTLY,
    // so a Forsaken entry carrying a `pathway` would leak into a same-pathway
    // mainland prompt even though the character is in Tingen. Guard every pathway.
    for (const pathway of ALL_PATHWAYS) {
      const ctx = selectCuratedLore(pathway.name, "Tingen City", 100000, 5, 9);
      for (const entry of ctx.entries) {
        expect(entry.tags).not.toContain("forsaken-land");
        expect(entry.city === "silver" || entry.city === "giant").toBe(false);
      }
    }
  });

  it("DOES surface Forsaken city lore for a character actually in the City of Silver", () => {
    // Location-gating is the mechanism: being there requires the dream-world
    // passage (#130), so this path is only reachable by a qualifying character.
    const ctx = selectCuratedLore("sun", "Silver City", 100000, 5, 9);
    expect(ctx.entries.some((e) => e.tags.includes("forsaken-land"))).toBe(true);
    expect(ctx.entries.some((e) => e.city === "silver")).toBe(true);
  });
});
