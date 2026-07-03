import type { SessionFact } from "@/lib/ai";
import { pickRandom, randomIndex } from "@/lib/lore/random";
import type { Item } from "@/lib/types/rules";
import { applyCodexUpdate, resolveCodexState } from "./codex";
import type { GameSession } from "./types";

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

/** Gatherings cannot be spammed — the fog opens only so often. */
export const GATHERING_COOLDOWN_TURNS = 5;

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
   * every existing save instead of being frozen in at recruit time. Legacy /
   * deterministic-fallback members use this; AI-authored members persist
   * `pathwayHintProse` instead (there is no catalog entry to derive from).
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
  // --- AI-authored / canon members (issue: AI society overhaul) ---
  // These are OPTIONAL and additive: a legacy/deterministic member has none of
  // them and still renders via the catalog indices above. An AI-authored member
  // has no catalog entry, so it PERSISTS its prose (`memberPathwayHint`/
  // `memberArc` prefer the prose when present, falling back to the index).
  /** The member's real name — a canon figure ("Audrey Hall") or an invented one. */
  realName?: string;
  /** Persisted pathway-hint prose; overrides `pathwayHintId` when present. */
  pathwayHintProse?: string;
  /** Persisted arc prose; overrides `arcId` when present. */
  arcProse?: string;
  /**
   * Links a CANON member to its engine seed id (a `canonCandidateSeeds` id, e.g.
   * `"audrey-hall"`). Present ONLY for a member the engine whitelisted as canon;
   * used to dedupe invitations and to keep the AI from minting false canon.
   */
  canonId?: string;
  /** Provenance. Absent → `"catalog"` (a legacy/deterministic member). */
  origin?: SocietyMemberOrigin;
}

export type SocietyMemberOrigin = "canon" | "original" | "catalog";

export interface SocietyState {
  kind: SocietyKind;
  name: string;
  members: SocietyMember[];
  gatheringCount: number;
  lastGatheringTurn: number;
  // --- AI-authored society fiction (issue: AI society overhaul) ---
  // Optional + additive: absent on a deterministically-founded society, which
  // reads only from `name` + `SOCIETY_KIND_LABELS`. An AI-founded (or canon
  // pre-seeded) society carries this immersive fiction, rendered by the panel.
  /** What this society is — a sentence or two of description. */
  description?: string;
  /** Its guiding creed or purpose. */
  ethos?: string;
  /** The fiction of where it convenes ("above the gray fog", a ship's hold). */
  meetingPlace?: string;
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

/**
 * A member's hint prose. An AI-authored member persists its own
 * `pathwayHintProse` (no catalog entry exists to derive from); a legacy /
 * deterministic member derives it from the stable id (unknown ids clamp to 0),
 * preserving the copy-edit-propagation property for catalog members.
 */
export function memberPathwayHint(member: SocietyMember): string {
  if (typeof member.pathwayHintProse === "string" && member.pathwayHintProse.trim()) {
    return member.pathwayHintProse;
  }
  return PATHWAY_HINTS[member.pathwayHintId] ?? PATHWAY_HINTS[0];
}

/**
 * A member's arc prose. A settled arc always reads as `RESOLVED_ARC`; otherwise
 * an AI-authored member's persisted `arcProse` wins, and a catalog member
 * derives from the stable id (unknown ids clamp to 0).
 */
export function memberArc(member: SocietyMember): string {
  if (member.arcId === RESOLVED_ARC_ID) return RESOLVED_ARC;
  if (typeof member.arcProse === "string" && member.arcProse.trim()) {
    return member.arcProse;
  }
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

// ---------------------------------------------------------------------------
// Canon grounding (AI society overhaul)
// ---------------------------------------------------------------------------
//
// Corpus-verified seed data for the AI-driven invitation + pre-seeding features.
// CANON_SOCIETY_MEMBERS is the ANTI-HALLUCINATION WHITELIST: the engine hands
// these seeds to the AI as candidates, and `commitInvitedMember` keeps a member's
// `canonId` ONLY when it matches a seed the engine provided — so the AI can enrich
// a canon figure but can never mint a false one. Grounded in `secret-societies.ts`
// (`tarot-club-roster`) + `canon-characters.ts` (the TAROT code names are the
// figures' canon card-aliases; the Nighthawks are not a masked society, so their
// `codeName` is the member's real name). CANON CAUTION (corpus outranks memory): "The World" is the
// Fool's own second seat and "Death"/Azik is a planted false rumour — NEITHER is
// a member, so neither appears here.

/** A corpus-verified society-member seed the AI may enrich into a candidate. */
export interface CanonCandidateSeed {
  /** Stable engine seed id (matches a `canon-characters.ts` slug where one exists). */
  canonId: string;
  /** The card / code name the figure holds ("Justice", "The Captain"). */
  codeName: string;
  /** The figure's real name ("Audrey Hall"). */
  realName: string;
  /** A one-line, corpus-grounded "who they are" for the AI to build a dossier on. */
  roleHint: string;
}

// canonId → the kinds of society each canon figure belongs in, with their seed.
// Keyed by SocietyKind so `canonCandidateSeeds(kind)` only offers figures who fit
// that kind of circle. Only the kinds with a strong canon roster are seeded; the
// others (church-division / pirate-crew / scholars-circle) draw wholly invented
// candidates (free divergence — the corpus gives no clean small roster there).
const CANON_SOCIETY_MEMBERS: Record<SocietyKind, CanonCandidateSeed[]> = {
  "tarot-club": [
    {
      canonId: "audrey-hall",
      codeName: "Justice",
      realName: "Audrey Hall",
      roleHint:
        "a Visionary noblewoman of Backlund who reads and gently sways the hearts of others",
    },
    {
      canonId: "alger-wilson",
      codeName: "The Hanged Man",
      realName: "Alger Wilson",
      roleHint: "a sea-faring Beyonder of the storm-faith who began on the Tyrant's road",
    },
    {
      canonId: "derrick-berg",
      codeName: "The Sun",
      realName: "Derrick Berg",
      roleHint:
        "an earnest youth of the sealed City of Silver, newly walking the Sun's path",
    },
    {
      canonId: "fors-wall",
      codeName: "The Magician",
      realName: "Fors Wall",
      roleHint: "an authoress of the old Abraham line who walks the Door",
    },
    {
      canonId: "emlyn-white",
      codeName: "The Moon",
      realName: "Emlyn White",
      roleHint: "a proud, softhearted Sanguine of the scarlet moon",
    },
    {
      canonId: "cattleya",
      codeName: "The Hermit",
      realName: "Cattleya",
      roleHint: "a pirate-queen of the far seas who walks the Hermit's road",
    },
    {
      canonId: "leonard-mitchell",
      codeName: "The Star",
      realName: "Leonard Mitchell",
      roleHint: "a Darkness Beyonder and poet of the Evernight Church",
    },
    {
      canonId: "xio-derecha",
      codeName: "Judgment",
      realName: "Xio Derecha",
      roleHint: "a small, upright Justiciar devoted to the scales of order",
    },
  ],
  // Unlike the Tarot Club, the Nighthawks are NOT a masked code-name society in
  // canon — its members are known by their real names — so the `codeName` here is
  // the figure's real name (corpus-verified), never an invented moniker. The
  // colour comes from `roleHint`, not a fabricated card.
  "nighthawk-squad": [
    {
      canonId: "dunn-smith",
      codeName: "Dunn Smith",
      realName: "Dunn Smith",
      roleHint:
        "the drowsy but formidable captain of the Tingen Nighthawks, a Darkness Nightmare",
    },
    {
      canonId: "daly-simone",
      codeName: "Daly Simone",
      realName: "Daly Simone",
      roleHint:
        "a composed Spirit Medium of the Death pathway who commands the unquiet dead",
    },
    {
      canonId: "old-neil",
      codeName: "Old Neil",
      realName: "Old Neil",
      roleHint: "the grandfatherly Hermit-pathway lore-keeper and artificer",
    },
    {
      canonId: "leonard-mitchell",
      codeName: "Leonard Mitchell",
      realName: "Leonard Mitchell",
      roleHint: "a Darkness Midnight Poet, easygoing and sharp at deduction",
    },
  ],
  "church-division": [],
  "pirate-crew": [],
  "scholars-circle": [],
};

// canonId → the pre-founded society a CANON CONVENER begins the game already
// holding (bypassing the Sequence-gated `foundSociety`, exactly as
// `seedSocietyMembership` does for archetypes). Only true founders/conveners are
// listed: Klein IS the Fool who convenes the Tarot Club. Other canon figures
// (Audrey, etc.) start with NO society and use the invitation mechanic — so they
// are absent here and `seedCanonSociety` returns null for them.
const CANON_SOCIETY_FOUNDERS: Record<string, SocietyState> = {
  "klein-moretti": {
    kind: "tarot-club",
    name: "The Tarot Club",
    members: [],
    gatheringCount: 0,
    lastGatheringTurn: -GATHERING_COOLDOWN_TURNS,
    description:
      "A secret gathering of Beyonders who convene above the gray fog, known to one another only by the tarot cards they hold — their true faces hidden unless freely shown.",
    ethos:
      "Mutual benefit and deepening trust: intelligence, ingredients, and formulas none could gather alone, traded across a long bronze table.",
    meetingPlace:
      "Above the gray fog, at the long bronze table summoned through the Fool's ritual from Sefirah Castle.",
  },
};

/**
 * The pre-founded society a taken-over CANON CONVENER begins with (Klein → the
 * Tarot Club, no members yet), or `null` for a canon figure who is not a founder
 * (they start with no society and pull members in via the invitation mechanic).
 * Bypasses the Seq-gated `foundSociety` — a canon convener holds their circle
 * from the start regardless of their starting rung. Pure.
 */
export function seedCanonSociety(canonCharacterId: string): SocietyState | null {
  const founder = CANON_SOCIETY_FOUNDERS[canonCharacterId];
  // Return a fresh copy so a caller can never mutate the shared template.
  return founder ? { ...founder, members: [...founder.members] } : null;
}

/** The canon seed ids already seated at the table — to dedupe a new slate. */
export function invitedCanonIds(society: SocietyState): string[] {
  return society.members
    .map((member) => member.canonId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

/**
 * The corpus-verified canon candidate seeds for a society kind, minus anyone
 * already seated and the player's own canon identity (you cannot invite
 * yourself). The AI enriches these into candidate dossiers alongside invented
 * NPCs; `commitInvitedMember` re-checks the id against this set so a false canon
 * figure can never be committed. Free divergence: NOT gated on the story's
 * timeline — any corpus-appropriate figure is invitable whenever. Pure.
 */
export function canonCandidateSeeds(
  kind: SocietyKind,
  opts: { excludeCanonIds?: string[]; excludeSelfId?: string } = {},
): CanonCandidateSeed[] {
  const excluded = new Set(opts.excludeCanonIds ?? []);
  if (opts.excludeSelfId) excluded.add(opts.excludeSelfId);
  return (CANON_SOCIETY_MEMBERS[kind] ?? []).filter(
    (seed) => !excluded.has(seed.canonId),
  );
}

/** The validated shape the caller commits a chosen candidate as (plain fields). */
export interface SocietyMemberCommit {
  codeName: string;
  realName?: string;
  pathwayHintProse: string;
  arcProse: string;
  origin: "canon" | "original";
  /** Only honoured when it matches an engine seed for this society's kind. */
  canonId?: string;
  /** Starting trust; defaults to 10 (matches `recruitMember`). */
  disposition?: number;
}

const MEMBER_FIELD_MAX = 400;

/**
 * The most seats a society's long table holds. Caps the AI-invitation path (which
 * has no natural code-name catalog to exhaust the way `recruitMember` does),
 * bounding save size and the members fed into the Codex / journal. Matches the
 * scale of the other per-save subsystem caps (e.g. `MAX_ACQUIRED_POWERS`).
 */
export const MAX_SOCIETY_MEMBERS = 24;

function clampField(value: string): string {
  const trimmed = value.trim();
  return trimmed.length <= MEMBER_FIELD_MAX
    ? trimmed
    : trimmed.slice(0, MEMBER_FIELD_MAX).trimEnd();
}

/**
 * Commit a chosen (accepted) invitation candidate as a validated member — the
 * SINGLE strict commit point for AI-authored members. Rejects a full table and a
 * duplicate canon figure (by `canonId`). Anti-hallucination: a `canonId` is kept
 * ONLY when it matches an engine-provided seed for this society's kind; otherwise
 * the member is committed as an `"original"` with no `canonId` (so the AI can
 * never smuggle in a false canon figure). Pure + deterministic (injected id).
 */
export function commitInvitedMember(
  society: SocietyState,
  input: SocietyMemberCommit,
  id: string = crypto.randomUUID(),
): SocietyState {
  const codeName = clampField(input.codeName);
  if (codeName === "") {
    throw new Error("A member needs a code name.");
  }
  if (society.members.length >= MAX_SOCIETY_MEMBERS) {
    throw new Error("Every seat at the long table is filled.");
  }
  // Whitelist the canon link against the engine's own seeds for this kind.
  const seedIds = new Set(
    (CANON_SOCIETY_MEMBERS[society.kind] ?? []).map((seed) => seed.canonId),
  );
  const canonId = input.canonId && seedIds.has(input.canonId) ? input.canonId : undefined;
  const origin: SocietyMemberOrigin = canonId ? "canon" : "original";

  if (canonId && invitedCanonIds(society).includes(canonId)) {
    throw new Error("They already hold a seat at the table.");
  }

  const member: SocietyMember = {
    id,
    codeName,
    // AI members carry no catalog index; the prose fields are the source of
    // truth and the ids are inert fallbacks (clamp-to-0 if ever read).
    pathwayHintId: 0,
    arcId: 0,
    arcStage: 0,
    disposition: Number.isFinite(input.disposition) ? (input.disposition as number) : 10,
    pathwayHintProse: clampField(input.pathwayHintProse),
    arcProse: clampField(input.arcProse),
    origin,
    ...(input.realName ? { realName: clampField(input.realName) } : {}),
    ...(canonId ? { canonId } : {}),
  };
  return { ...society, members: [...society.members, member] };
}

/** A committed member plus the fields its story-world integration needs. */
export interface IntegratedMemberInput extends SocietyMemberCommit {
  /** A short note for the Codex person entry (the dossier); defaults to the hint. */
  note?: string;
}

/**
 * Commit an accepted invitation candidate AND register them in the story world so
 * the narrator knows them: seat them via `commitInvitedMember` and file them as a
 * Codex `person` in `## Established Facts` (`applyCodexUpdate` — the code name
 * becomes an alias, the dossier/hint the note). A society member is a CONTACT met
 * above the gray fog, NOT a travelling companion, so they are deliberately NOT
 * added to the tracked-NPC follower roster (the player adds companions themselves
 * from the character sheet). Returns a NEW `GameSession` (a no-op when there is no
 * society). Propagates `commitInvitedMember`'s throws (full table / duplicate canon
 * / missing code name) so the caller can surface them. Pure + deterministic.
 */
export function commitAndIntegrateMember(
  session: GameSession,
  input: IntegratedMemberInput,
  idFactory: () => string = () => crypto.randomUUID(),
): GameSession {
  const society = session.societyState;
  if (!society) return session;
  const nextSociety = commitInvitedMember(society, input, idFactory());
  const displayName = input.realName?.trim() || input.codeName.trim();

  const aliases = displayName !== input.codeName.trim() ? [input.codeName.trim()] : [];
  const note = (input.note ?? input.pathwayHintProse)?.trim() || undefined;
  const codexState = applyCodexUpdate(
    resolveCodexState(session.codexState),
    {
      kind: "person",
      name: displayName,
      importance: "standard",
      ...(aliases.length ? { aliases } : {}),
      ...(note ? { note } : {}),
    },
    session.turnCount,
  );
  return { ...session, societyState: nextSociety, codexState };
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
  /**
   * The code names of members who shared intel this gathering (one per fact, in
   * order) — the engine's decision, fed to the AI-narration overlay so it can
   * voice the right members. Deterministic under the injected randomness.
   */
  sharers: string[];
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
  const sharers: string[] = [];
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
      sharers.push(member.codeName);
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
    sharers,
    narrativeSeed: `Above the gray fog, ${society.name} convenes: ${members.length} ${
      members.length === 1 ? "figure" : "figures"
    } at the long table, faces hidden, ${facts.length} ${
      facts.length === 1 ? "lead" : "leads"
    } shared.`,
  };
}

/**
 * Overlay AI-authored narration onto a deterministic `holdGathering` outcome —
 * the engine owns ALL mechanics (who shared, whether an item traded, disposition
 * drift); the AI only supplies prose. The `narrative` becomes the scene seed;
 * each `intel` line replaces a shared fact's description positionally (so the
 * count still matches who the engine decided shared); `tradedItemName` renames
 * the item the engine already granted (it can never MINT one the engine withheld
 * — anti-exploit). Absent/blank fields leave the deterministic values in place,
 * so a no-provider gathering is unchanged. Pure.
 */
export function applyGatheringNarration(
  outcome: GatheringOutcome,
  narration: { narrative?: string; intel?: string[]; tradedItemName?: string },
): GatheringOutcome {
  const narrative =
    typeof narration.narrative === "string" && narration.narrative.trim()
      ? narration.narrative.trim()
      : outcome.narrativeSeed;

  const facts = outcome.facts.map((fact, i) => {
    const line = narration.intel?.[i];
    return typeof line === "string" && line.trim()
      ? { ...fact, description: line.trim() }
      : fact;
  });

  const tradedName =
    typeof narration.tradedItemName === "string" && narration.tradedItemName.trim()
      ? narration.tradedItemName.trim()
      : null;
  const items =
    tradedName && outcome.items.length > 0
      ? [{ ...outcome.items[0], name: tradedName }, ...outcome.items.slice(1)]
      : outcome.items;

  return { ...outcome, narrativeSeed: narrative, facts, items };
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

/** An optional field, when present, must be a string. */
function optionalStringOk(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

const MEMBER_ORIGINS: ReadonlySet<string> = new Set(["canon", "original", "catalog"]);

/** Strict-ish shape validation for the persisted society state. */
export function isValidSocietyShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (typeof s.kind !== "string" || typeof s.name !== "string") return false;
  if (!Number.isFinite(s.gatheringCount) || !Number.isFinite(s.lastGatheringTurn)) {
    return false;
  }
  // AI-authored society fiction — optional, string when present.
  if (
    !optionalStringOk(s.description) ||
    !optionalStringOk(s.ethos) ||
    !optionalStringOk(s.meetingPlace)
  ) {
    return false;
  }
  if (!Array.isArray(s.members)) return false;
  return s.members.every((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) return false;
    const m = entry as Record<string, unknown>;
    // AI-authored member fields — optional, string/valid-literal when present.
    if (
      !optionalStringOk(m.realName) ||
      !optionalStringOk(m.pathwayHintProse) ||
      !optionalStringOk(m.arcProse) ||
      !optionalStringOk(m.canonId) ||
      (m.origin !== undefined &&
        (typeof m.origin !== "string" || !MEMBER_ORIGINS.has(m.origin)))
    ) {
      return false;
    }
    return (
      typeof m.id === "string" &&
      typeof m.codeName === "string" &&
      Number.isFinite(m.disposition) &&
      // A member is valid with EITHER a catalog index (legacy prose `arc` string
      // or a finite `arcId`) OR persisted `arcProse` (a pure-AI member that has
      // no catalog entry). Legacy prose is converted to ids by `migrateSocietyState`.
      (typeof m.arc === "string" ||
        Number.isFinite(m.arcId) ||
        typeof m.arcProse === "string")
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
