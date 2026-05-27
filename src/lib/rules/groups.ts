import type { PathwayGroup, PathwayGroupId } from "@/lib/types/rules";

export const PATHWAY_GROUPS: Record<PathwayGroupId, PathwayGroup> = {
  mysteries: {
    id: "mysteries",
    name: "Mysteries",
    sefirah: "Sefirah Castle",
    pathwayIds: [1],
  },
  "god-almighty": {
    id: "god-almighty",
    name: "God Almighty",
    sefirah: "Chaos Sea",
    pathwayIds: [2, 3],
  },
  "eternal-darkness": {
    id: "eternal-darkness",
    name: "Eternal Darkness",
    sefirah: "River of Eternal Darkness",
    pathwayIds: [4],
  },
};

export function getGroupForPathway(
  pathwayId: number,
): PathwayGroup | undefined {
  return Object.values(PATHWAY_GROUPS).find((g) =>
    g.pathwayIds.includes(pathwayId),
  );
}

export function areInSameGroup(pathwayA: number, pathwayB: number): boolean {
  const groupA = getGroupForPathway(pathwayA);
  const groupB = getGroupForPathway(pathwayB);
  if (!groupA || !groupB) return false;
  return groupA.id === groupB.id;
}
