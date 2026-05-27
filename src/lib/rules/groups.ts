import type { PathwayGroup, PathwayGroupId } from "@/lib/types/rules";

export const PATHWAY_GROUPS: Record<PathwayGroupId, PathwayGroup> = {
  "sefirah-castle": {
    id: "sefirah-castle",
    name: "Sefirah Castle",
    sefirah: "Sefirah Castle",
    pathwayIds: [1, 2],
  },
  "pillar-of-light": {
    id: "pillar-of-light",
    name: "Pillar of Light",
    sefirah: "Pillar of Light",
    pathwayIds: [3],
  },
  underworld: {
    id: "underworld",
    name: "Underworld",
    sefirah: "Underworld",
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
