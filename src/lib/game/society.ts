import type { SessionFact } from "@/lib/ai";
import { pickRandom, randomIndex } from "@/lib/lore/random";
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
  /**
   * Index into PATHWAY_HINTS. The PROSE is derived at render time
   * (`memberPathwayHint`) and never persisted, so copy/grammar edits reach
   * every existing save instead of being frozen in at recruit time.
   */
  pathwayHintId: number;
  /** -100..100 — drifts with gathering outcomes. */
  disposition: number;
  /**
   * Index into MEMBER_ARCS, or RESOLVED_ARC_ID once their matter is settled.
   * Prose is derived via `memberArc` — see `pathwayHintId`.
   */
  arcId: number;
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

// Stable, APPEND-ONLY prose catalogs. Members persist an index into these (not
// the rendered text), so prose is owned by code and any edit applies to every
// save. Never reorder or delete entries — that would re-point existing ids.
//
// Rendered as "This one {hint}." — the subject is singular third person, so
// each hint must read with a third-person-SINGULAR verb (reads / knows / hums).
const PATHWAY_HINTS = [
  "reads people a little too easily",
  "always knows the weather at sea",
  "hums hymns under their breath",
  "never quite casts the right shadow",
  "asks careful questions about the dead",
  "carries the smell of old paper and ozone",
] as const;

// Rendered as "They {arc}" / "they {arc}" — members keep their faces hidden, so
// the narrator refers to each with the singular "they", which takes PLURAL verb
// agreement (they are / they owe / they suspect). Keep new arcs in that form.
const MEMBER_ARCS = [
  "are hunting the counterfeiter who ruined their family",
  "are quietly buying up a dead colleague's debts",
  "suspect their superior serves something else entirely",
  "are searching for a sibling who walked into the fog",
  "want a formula they cannot ask for openly",
  "are being followed, and know it",
] as const;

/**
 * The arc a member carries once the player helps settle their matter. Assigned
 * only by `resolveMemberArc` (never recruited randomly), so it lives outside
 * the MEMBER_ARCS index under a reserved id.
 */
const RESOLVED_ARC = "owe you a debt they intend to honor";
export const RESOLVED_ARC_ID = -1;

/** Derive a member's hint prose from its stable id (unknown ids clamp to 0). */
export function memberPathwayHint(member: SocietyMember): string {
  return PATHWAY_HINTS[member.pathwayHintId] ?? PATHWAY_HINTS[0];
}

/** Derive a member's arc prose from its stable id (unknown ids clamp to 0). */
export function memberArc(member: SocietyMember): string {
  if (member.arcId === RESOLVED_ARC_ID) return RESOLVED_ARC;
  return MEMBER_ARCS[member.arcId] ?? MEMBER_ARCS[0];
}

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

// Organization → society shape, for the start-archetype pre-membership seam
// (issue #131). An archetype embeds the character in an existing org's circle at
// creation; this maps the org slug to the society KIND and display NAME the
// pre-membership should carry. Append-only as later regions add affiliations; an
// unknown slug falls back to a neutral scholars' circle rather than throwing.
const ORG_MEMBERSHIPS: Record<string, { kind: SocietyKind; name: string }> = {
  "nighthawks-tingen-team": { kind: "nighthawk-squad", name: "The Tingen Nighthawks" },
};

/**
 * Seed a pre-existing society membership for a start archetype (issue #131) — the
 * character begins ALREADY embedded in an org's circle, so this bypasses the
 * Sequence-gated `foundSociety` (a fresh Beyonder is Sequence 9 and could never
 * found one, yet a junior Nighthawk plainly belongs to a squad). Returns a valid
 * `SocietyState` with no members yet (the player still recruits/convenes through
 * the society panel). The `role` is flavour recorded by the caller in the
 * relationship grounding, not stored on the state. Pure.
 */
export function seedSocietyMembership(orgSlug: string): SocietyState {
  const org = ORG_MEMBERSHIPS[orgSlug];
  const kind = org?.kind ?? "scholars-circle";
  return {
    kind,
    // Reuse the canonical kind label as the fallback name so an unmapped org
    // never drifts from the founding-path display name (SOCIETY_KIND_LABELS is
    // the single source of truth).
    name: org?.name ?? SOCIETY_KIND_LABELS[kind],
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
    codeName: pickRandom(available, random),
    pathwayHintId: randomIndex(PATHWAY_HINTS.length, random),
    disposition: 10,
    arcId: randomIndex(MEMBER_ARCS.length, random),
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
      const lead = pickRandom(INTEL_LEADS, random);
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
    items.push(pickRandom(TRADE_GOODS, random));
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
            arcId: RESOLVED_ARC_ID,
            disposition: Math.min(100, candidate.disposition + 20),
          }
        : candidate,
    ),
  };
  return {
    society: next,
    fact: {
      type: "event",
      description: `${member.codeName}'s private matter — they ${memberArc(member)} — has come to a head, with your society's help.`,
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
  return s.members.every((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) return false;
    const m = entry as Record<string, unknown>;
    return (
      typeof m.id === "string" &&
      typeof m.codeName === "string" &&
      Number.isFinite(m.disposition) &&
      // The arc is a legacy prose string OR the current numeric id; legacy
      // saves are converted to ids on load by `migrateSocietyState`.
      (typeof m.arc === "string" || Number.isFinite(m.arcId))
    );
  });
}

// --- Legacy migration --------------------------------------------------------
// Saves written before arcs/hints became ids stored the rendered PROSE,
// including the pre-grammar-fix singular-verb arcs ("is hunting", "owes …").
// Map every historical string back to its stable id ONCE, on load; afterwards
// the save holds the id and any future copy edit applies automatically.
const LEGACY_MEMBER_ARCS = [
  "is hunting the counterfeiter who ruined their family",
  "is quietly buying up a dead colleague's debts",
  "suspects their superior serves something else entirely",
  "is searching for a sibling who walked into the fog",
  "wants a formula they cannot ask for openly",
  "is being followed, and knows it",
] as const;

const ARC_PROSE_TO_ID: Record<string, number> = {};
MEMBER_ARCS.forEach((arc, i) => (ARC_PROSE_TO_ID[arc] = i));
LEGACY_MEMBER_ARCS.forEach((arc, i) => (ARC_PROSE_TO_ID[arc] = i));
ARC_PROSE_TO_ID[RESOLVED_ARC] = RESOLVED_ARC_ID;
ARC_PROSE_TO_ID["owes you a debt they intend to honor"] = RESOLVED_ARC_ID;

const HINT_PROSE_TO_ID: Record<string, number> = {};
PATHWAY_HINTS.forEach((hint, i) => (HINT_PROSE_TO_ID[hint] = i));

/**
 * Bring a persisted society up to the id-based member shape. Legacy saves
 * stored arc/hint PROSE; map it back to stable ids so prose is re-derived in
 * code (and any copy fix reaches the save). Idempotent — id-shaped members pass
 * through untouched, and unknown prose clamps to id 0 rather than crashing.
 */
export function migrateSocietyState(state: SocietyState): SocietyState {
  let changed = false;
  const members = state.members.map((member) => {
    if (typeof member.arcId === "number" && typeof member.pathwayHintId === "number") {
      return member;
    }
    changed = true;
    const loose = member as SocietyMember & { arc?: unknown; pathwayHint?: unknown };
    const arcId =
      typeof member.arcId === "number"
        ? member.arcId
        : typeof loose.arc === "string"
          ? (ARC_PROSE_TO_ID[loose.arc] ?? 0)
          : 0;
    const pathwayHintId =
      typeof member.pathwayHintId === "number"
        ? member.pathwayHintId
        : typeof loose.pathwayHint === "string"
          ? (HINT_PROSE_TO_ID[loose.pathwayHint] ?? 0)
          : 0;
    return {
      id: member.id,
      codeName: member.codeName,
      pathwayHintId,
      disposition: member.disposition,
      arcId,
      arcStage: typeof member.arcStage === "number" ? member.arcStage : 0,
    };
  });
  return changed ? { ...state, members } : state;
}
