import type { PathwayGroup, PathwayGroupId } from "@/lib/types/rules";

export const PATHWAY_GROUPS: Record<PathwayGroupId, PathwayGroup> = {
  // Lord of the Mysteries pillar (Sefirah Castle): Fool, Door, Error.
  mysteries: {
    id: "mysteries",
    name: "Mysteries",
    sefirah: "Sefirah Castle",
    pathwayIds: [1, 7, 8],
  },
  // God Almighty pillar (Chaos Sea): Visionary, Sun, Tyrant, Hanged Man, White Tower.
  "god-almighty": {
    id: "god-almighty",
    name: "God Almighty",
    sefirah: "Chaos Sea",
    pathwayIds: [2, 3, 6, 9, 10],
  },
  // Eternal Darkness (River of Eternal Darkness): Death, Darkness, Twilight Giant.
  "eternal-darkness": {
    id: "eternal-darkness",
    name: "Eternal Darkness",
    sefirah: "River of Eternal Darkness",
    pathwayIds: [4, 5, 11],
  },
  // Order group (Hammer of the Hidden Sage): Justiciar and Black Emperor —
  // canon opposites (Order vs Disorder) bound in the same Above-the-Sequence group.
  order: {
    id: "order",
    name: "Order",
    sefirah: "Hammer of the Hidden Sage",
    pathwayIds: [12, 13],
  },
  // Combat / War group (Sefirah of the God of Combat): Red Priest and Demoness —
  // the masculine and feminine sides of the Original Creator's combat aspect.
  combat: {
    id: "combat",
    name: "Combat",
    sefirah: "Sefirah of the God of Combat",
    pathwayIds: [14, 15],
  },
  // Life group (Tree of Life): Mother and Moon — both originating from the
  // Mother Goddess of Depravity / Mother Tree of Desire.
  life: {
    id: "life",
    name: "Life",
    sefirah: "Tree of Life",
    pathwayIds: [16, 17],
  },
  // Knowledge group (Sefirah of the Hidden Sage): Hermit and Paragon —
  // mystical and natural-world knowledge respectively.
  knowledge: {
    id: "knowledge",
    name: "Knowledge",
    sefirah: "Sefirah of the Hidden Sage",
    pathwayIds: [18, 19],
  },
  // Fate group (Sefirah of Fate): Wheel of Fortune — the only Standard Pathway
  // with no neighbouring pathway, a group of one.
  "wheel-of-fortune": {
    id: "wheel-of-fortune",
    name: "Wheel of Fortune",
    sefirah: "Sefirah of Fate",
    pathwayIds: [20],
  },
  // Abyss group (Tomb of the Father of Devils): Abyss and Chained — both born
  // of the Outer Deity, the Father of Devils.
  abyss: {
    id: "abyss",
    name: "Abyss",
    sefirah: "Tomb of the Father of Devils",
    pathwayIds: [21, 22],
  },
};

export function getGroupForPathway(pathwayId: number): PathwayGroup | undefined {
  return Object.values(PATHWAY_GROUPS).find((g) => g.pathwayIds.includes(pathwayId));
}

export function areInSameGroup(pathwayA: number, pathwayB: number): boolean {
  const groupA = getGroupForPathway(pathwayA);
  const groupB = getGroupForPathway(pathwayB);
  if (!groupA || !groupB) return false;
  return groupA.id === groupB.id;
}
