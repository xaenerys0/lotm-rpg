import { getPathway } from "./pathways";

// ---------------------------------------------------------------------------
// The Pillars — "Above the Sequence" (issue #99 Part B)
// ---------------------------------------------------------------------------
//
// Above Sequence 0 (the True Gods) sit the four Pillars / Great Old Ones — the
// cosmic apex of the Beyonder world (docs/lotm-lore-summary.md). A Pillar is a
// specific, singular cosmic ROLE, not a rung every pathway can reach: only the
// pathways of a Pillar's own family can ascend into it. The mechanical apex
// above Seq 0 lives in `@/lib/game/pillars` (mirroring the apotheosis pattern);
// this file is the pure canon data.
//
// The four families map exactly onto the canon god-family `group`/`sefirah`
// data already on each `Pathway` (Mysteries / God Almighty / Eternal Darkness /
// Life), so the Pillar a pathway can reach is its family's apex. The other nine
// pathways (Order, Combat, Knowledge, Wheel of Fortune, Abyss) cap at Seq 0 —
// `pillarForPathway` returns `undefined` for them and no ascension is offered.
//
// Eternal Darkness is a real FOURTH Pillar: the Evernight Goddess ascends into
// it in the sequel (Circle of Inevitability). Book-1 lore lists only three; the
// fourth is sourced from the committed wiki content.

export interface Pillar {
  /** Stable id (1–4). */
  id: number;
  /** The Pillar's name — its Above-the-Sequence title. */
  name: string;
  /** A one-line canon descriptor of the cosmic role. */
  title: string;
  /** The Sefirah / seat of authority the family shares. */
  sefirah: string;
  /** The pathway ids whose family ascends into this Pillar. */
  pathwayIds: number[];
}

export const PILLARS: readonly Pillar[] = [
  {
    id: 1,
    name: "Lord of Mysteries",
    title:
      "Sovereign of the Sefirah Castle and the gray fog above the sequences, the unknowable behind every mystery",
    sefirah: "Sefirah Castle",
    pathwayIds: [1, 7, 8], // Fool, Door, Error
  },
  {
    id: 2,
    name: "God Almighty",
    title:
      "The Eternal Blazing Sun enthroned upon the Chaos Sea, light and order over the world",
    sefirah: "Chaos Sea",
    pathwayIds: [2, 3, 6, 9, 10], // Visionary, Sun, Tyrant, Hanged Man, White Tower
  },
  {
    id: 3,
    name: "Eternal Darkness",
    title:
      "The River of Eternal Darkness given will — the Pillar the Evernight Goddess ascends into in the sequel",
    sefirah: "River of Eternal Darkness",
    pathwayIds: [4, 5, 11], // Death, Darkness, Twilight Giant
  },
  {
    id: 4,
    name: "Mother Goddess of Depravity",
    title:
      "The matron of the Tree of Life turned to depravity, mother of life and its corruption above the sequences",
    sefirah: "Tree of Life",
    pathwayIds: [16, 17], // Mother, Moon
  },
] as const;

const PILLAR_BY_PATHWAY = new Map<number, Pillar>();
for (const pillar of PILLARS) {
  for (const pathwayId of pillar.pathwayIds) {
    PILLAR_BY_PATHWAY.set(pathwayId, pillar);
  }
}

/**
 * The Pillar a pathway's family can ascend into, or `undefined` when the
 * pathway has no Pillar above its Sequence 0 (it caps at True God). Canon:
 * Pillars are specific cosmic roles, so only the four god-families reach one.
 */
export function pillarForPathway(pathwayId: number): Pillar | undefined {
  return PILLAR_BY_PATHWAY.get(pathwayId);
}

/** A Pillar by its id. */
export function getPillar(id: number): Pillar | undefined {
  return PILLARS.find((p) => p.id === id);
}

/**
 * The sibling pathways in a Pillar's family — every pathway that shares the
 * Pillar EXCEPT the given one. These are the pathways a True God must integrate
 * (their Uniquenesses) to ascend above the sequences. Empty when the pathway
 * has no Pillar; the family's other members otherwise (their names resolved for
 * display via the rules pathway data).
 */
export function siblingPathwayIds(pathwayId: number): number[] {
  const pillar = pillarForPathway(pathwayId);
  if (!pillar) return [];
  return pillar.pathwayIds.filter((id) => id !== pathwayId);
}

/** Convenience: the sibling pathway names, for narration/UI. */
export function siblingPathwayNames(pathwayId: number): string[] {
  return siblingPathwayIds(pathwayId).map(
    (id) => getPathway(id)?.name ?? `Pathway ${id}`,
  );
}
