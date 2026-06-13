import type { SessionFact } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";

// ---------------------------------------------------------------------------
// Secret society / Tarot Club system (issue #32)
// ---------------------------------------------------------------------------
//
// The social hub: qualifying players FOUND a society (the Fool pathway gets
// the Tarot Club proper; other pathways get an affiliation-appropriate
// equivalent) and convene gatherings "above the gray fog" with AI-controlled
// NPC members. Gatherings have MECHANICAL consequences: members share intel
// (memory facts the narrator and the investigation pillar can use), trade
// small resources, and drift in disposition; each member carries their own
// slow-burning arc. Pure + deterministic under injected randomness; storage
// in the React layer like every other session subsystem.

export type SocietyKind =
  | "tarot-club"
  | "nighthawk-squad"
  | "church-division"
  | "pirate-crew"
  | "scholars-circle";

/** Pathway-appropriate society. The Fool founds the Tarot Club itself. */
export function societyKindForPathway(pathwayId: number): SocietyKind {
  switch (pathwayId) {
    case 1:
      return "tarot-club";
    case 4:
    case 5:
      return "nighthawk-squad";
    case 3:
      return "church-division";
    case 6:
      return "pirate-crew";
    default:
      return "scholars-circle";
  }
}

export const SOCIETY_KIND_LABELS: Record<SocietyKind, string> = {
  "tarot-club": "The Tarot Club",
  "nighthawk-squad": "A Nighthawks Squad",
  "church-division": "A Church Division",
  "pirate-crew": "A Pirate Crew",
  "scholars-circle": "A Circle of Scholars",
};

/** Founding requires some standing — Sequence 7 or better. */
export const SOCIETY_FOUNDING_SEQUENCE = 7;

export function canFoundSociety(sequenceLevel: number): boolean {
  return sequenceLevel <= SOCIETY_FOUNDING_SEQUENCE;
}

export interface SocietyMember {
  id: string;
  /** Members are known by code names — faces stay hidden in the fog. */
  codeName: string;
  /** What the player can guess of their nature. */
  pathwayHint: string;
  /** -100..100 — drifts with gathering outcomes. */
  disposition: number;
  /** The member's own slow arc; advances every few gatherings. */
  arc: string;
  arcStage: number;
}

export interface SocietyState {
  kind: SocietyKind;
  name: string;
  members: SocietyMember[];
  gatheringCount: number;
  lastGatheringTurn: number;
}

const CODE_NAMES = [
  "Justice",
  "The Hanged Man",
  "The Star",
  "The Moon",
  "The Hermit",
  "The Sun",
  "The Magician",
  "The Tower",
  "Temperance",
  "The World",
] as const;

const PATHWAY_HINTS = [
  "reads people a little too easily",
  "always knows the weather at sea",
  "hums hymns under their breath",
  "never quite casts the right shadow",
  "asks careful questions about the dead",
  "carries the smell of old paper and ozone",
] as const;

const MEMBER_ARCS = [
  "is hunting the counterfeiter who ruined their family",
  "is quietly buying up a dead colleague's debts",
  "suspects their superior serves something else entirely",
  "is searching for a sibling who walked into the fog",
  "wants a formula they cannot ask for openly",
  "is being followed, and knows it",
] as const;

// Intel templates per arc stage — the leads members bring to a gathering.
const INTEL_LEADS = [
  "mentions a warehouse on the docks that no gang will touch",
  "passes along a name overheard in a confession",
  "reports strange lights over the cathedral two nights running",
  "shares a customs ledger page with one impossible entry",
  "warns that the constables are asking after a man with your description",
  "describes a pawnshop that buys things with no questions and no receipts",
] as const;

const TRADE_GOODS: readonly Item[] = [
  {
    name: "Vial of moonflower dew",
    description: "Traded across the long table for a favor.",
    category: "supplementary-ingredient",
  },
  {
    name: "Page of a ruined grimoire",
    description: "One legible diagram; the rest is scorch.",
    category: "supplementary-ingredient",
  },
  {
    name: "Sealed letter of introduction",
    description: "A name that opens one particular door.",
    category: "supplementary-ingredient",
  },
];

export function foundSociety(
  pathwayId: number,
  sequenceLevel: number,
  name: string | undefined,
  now: number = Date.now(),
): SocietyState {
  if (!canFoundSociety(sequenceLevel)) {
    throw new Error("You lack the standing to gather others — reach Sequence 7 first.");
  }
  void now;
  const kind = societyKindForPathway(pathwayId);
  return {
    kind,
    name: name?.trim() || SOCIETY_KIND_LABELS[kind],
    members: [],
    gatheringCount: 0,
    lastGatheringTurn: -GATHERING_COOLDOWN_TURNS,
  };
}

/** Recruit one new member, deterministically under the injected randomness. */
export function recruitMember(
  society: SocietyState,
  random: () => number = Math.random,
  id: string = crypto.randomUUID(),
): SocietyState {
  const taken = new Set(society.members.map((member) => member.codeName));
  const available = CODE_NAMES.filter((name) => !taken.has(name));
  if (available.length === 0) {
    throw new Error("Every seat at the long table is filled.");
  }
  const member: SocietyMember = {
    id,
    codeName: available[Math.floor(random() * available.length)],
    pathwayHint: PATHWAY_HINTS[Math.floor(random() * PATHWAY_HINTS.length)],
    disposition: 10,
    arc: MEMBER_ARCS[Math.floor(random() * MEMBER_ARCS.length)],
    arcStage: 0,
  };
  return { ...society, members: [...society.members, member] };
}

/** Gatherings cannot be spammed — the fog opens only so often. */
export const GATHERING_COOLDOWN_TURNS = 5;

export function canConvene(society: SocietyState, turnNumber: number): boolean {
  return (
    society.members.length > 0 &&
    turnNumber - society.lastGatheringTurn >= GATHERING_COOLDOWN_TURNS
  );
}

export interface GatheringOutcome {
  society: SocietyState;
  /** Intel leads — memory facts the narrator/investigation pillar consume. */
  facts: SessionFact[];
  /** Occasionally a member trades something across the table. */
  items: Item[];
  /** A scene seed for the narrator. */
  narrativeSeed: string;
}

/**
 * Convene "above the gray fog". Each member, weighted by disposition, may
 * share an intel lead; roughly one gathering in three someone trades a small
 * resource; member arcs slowly advance, and dispositions drift toward the
 * one who keeps convening them. Deterministic under the injected randomness.
 */
export function holdGathering(
  society: SocietyState,
  turnNumber: number,
  random: () => number = Math.random,
): GatheringOutcome {
  if (!canConvene(society, turnNumber)) {
    throw new Error("The fog will not open again so soon — or the table is empty.");
  }

  const facts: SessionFact[] = [];
  const items: Item[] = [];
  const members = society.members.map((member) => {
    const shareChance = 0.4 + member.disposition / 200;
    let next = member;
    if (random() < shareChance) {
      const lead = INTEL_LEADS[Math.floor(random() * INTEL_LEADS.length)];
      facts.push({
        type: "npc-encounter",
        description: `At the gathering, ${member.codeName} ${lead}.`,
        turnNumber,
      });
    }
    // Arcs creep forward every other gathering on average.
    if (random() < 0.5) {
      next = { ...next, arcStage: Math.min(3, next.arcStage + 1) };
    }
    // Convening regularly earns trust.
    next = { ...next, disposition: Math.min(100, next.disposition + 3) };
    return next;
  });

  if (members.length > 0 && random() < 0.34) {
    items.push(TRADE_GOODS[Math.floor(random() * TRADE_GOODS.length)]);
  }

  const updated: SocietyState = {
    ...society,
    members,
    gatheringCount: society.gatheringCount + 1,
    lastGatheringTurn: turnNumber,
  };

  return {
    society: updated,
    facts,
    items,
    narrativeSeed: `Above the gray fog, ${society.name} convenes: ${members.length} ${
      members.length === 1 ? "figure" : "figures"
    } at the long table, faces hidden, ${facts.length} ${
      facts.length === 1 ? "lead" : "leads"
    } shared.`,
  };
}

/** A member whose arc reaches its final stage resolves it — flavor + trust. */
export function resolveMemberArc(
  society: SocietyState,
  memberId: string,
): { society: SocietyState; fact: SessionFact | null } {
  const member = society.members.find((candidate) => candidate.id === memberId);
  if (!member || member.arcStage < 3) return { society, fact: null };
  const next = {
    ...society,
    members: society.members.map((candidate) =>
      candidate.id === memberId
        ? {
            ...candidate,
            arcStage: 0,
            arc: "owes you a debt they intend to honor",
            disposition: Math.min(100, candidate.disposition + 20),
          }
        : candidate,
    ),
  };
  return {
    society: next,
    fact: {
      type: "event",
      description: `${member.codeName}'s private matter — they ${member.arc} — has come to a head, with your society's help.`,
      turnNumber: 0,
    },
  };
}

/** Strict-ish shape validation for the persisted society state. */
export function isValidSocietyShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (typeof s.kind !== "string" || typeof s.name !== "string") return false;
  if (!Number.isFinite(s.gatheringCount) || !Number.isFinite(s.lastGatheringTurn)) {
    return false;
  }
  if (!Array.isArray(s.members)) return false;
  return s.members.every(
    (entry: unknown) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as SocietyMember).id === "string" &&
      typeof (entry as SocietyMember).codeName === "string" &&
      Number.isFinite((entry as SocietyMember).disposition) &&
      typeof (entry as SocietyMember).arc === "string",
  );
}
