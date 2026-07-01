// ---------------------------------------------------------------------------
// Combat ability kits (issue #187, combat overhaul Phase 2) — pathway fantasy.
// ---------------------------------------------------------------------------
//
// The canon ability data already exists: `getCumulativeAbilities(pathwayId,
// level)` (`@/lib/rules`) returns every ability from the rungs a Beyonder has
// climbed, each a corpus-grounded `{name, description, type}`. Today combat only
// used the NAMES as flavour labels on generic "ability" options. This module
// promotes them to a real toolkit: it CLASSIFIES each canon ability into a
// combat role (offensive / defensive / control / evasive / utility) by a curated
// keyword table over the ability's name and description, and attaches a cost,
// cooldown, control-strain, and potency so a Spectator's perception/control kit
// plays differently from a Marauder's force kit.
//
// The classification table is grounded in the corpus ability text (the names and
// descriptions in `pathways.ts` / `demigod-abilities.ts`, themselves derived from
// each pathway's wiki `<Pathway>/Abilities` page). Where an ability's wording
// matches no role keyword it falls through to `utility` — the explicit,
// flagged "gap" default, mirroring the `demigod-abilities.ts` precedent of
// flagging where canon is thin rather than inventing a role.
//
// Pure + deterministic: the same pathway + Sequence always yields the same kit,
// so a serialized fight regenerates identical options.

import type { AbilityKind, CombatAbility, EncounterFraming } from "@/lib/types/combat";
import { getCumulativeAbilities } from "@/lib/rules";
import { clamp, round4 } from "./math";

/** A keyword rule: any of these substrings in the name/description ⇒ this kind. */
interface ClassificationRule {
  kind: AbilityKind;
  keywords: string[];
}

// Checked IN ORDER; the first rule whose keyword appears wins. Order resolves
// overlaps deliberately: a mind/foresight ability is control/evasive before its
// "strike" verb makes it offensive, and a ward is defensive before its element
// reads as offensive. Anything unmatched falls through to `utility`.
const CLASSIFICATION_RULES: readonly ClassificationRule[] = [
  {
    kind: "control",
    keywords: [
      "mind",
      "pacif",
      "command",
      "charm",
      "suggest",
      "illusion",
      "dread",
      "fear",
      "curse",
      "bind",
      "marionette",
      "puppet",
      "dominat",
      "compel",
      "telepath",
      "emotion",
      "hypno",
      "soul",
      "intent",
      "enslave",
      "provoke",
      "subdu",
    ],
  },
  {
    kind: "evasive",
    keywords: [
      "evade",
      "evasi",
      "dodge",
      "vanish",
      "conceal",
      "hide",
      "blink",
      "teleport",
      "step",
      "phase",
      "flee",
      "escape",
      "agilit",
      "swift",
      "slip",
      "foresee",
      "foresight",
      "divin",
      "premonit",
      "intuition",
      "vision",
      "perceiv",
      "perception",
      "sense",
      "danger",
      "substitut",
      "shadow",
    ],
  },
  {
    kind: "defensive",
    keywords: [
      "shield",
      "ward",
      "barrier",
      "protect",
      "armor",
      "armour",
      "defend",
      "defens",
      "resist",
      "endur",
      "brace",
      "veil",
      "deaden",
      "harden",
      "sacrifice",
      "guard",
      "shelter",
      "immun",
    ],
  },
  {
    kind: "offensive",
    keywords: [
      "strike",
      "attack",
      "fire",
      "flame",
      "burn",
      "blast",
      "storm",
      "tempest",
      "lightning",
      "force",
      "blade",
      "claw",
      "bullet",
      "spear",
      "destroy",
      "slash",
      "bombard",
      "explos",
      "lethal",
      "hunt",
      "charge",
      "fury",
      "wrath",
      "light",
      "beam",
      "smite",
      "crush",
      "rend",
      "spirit body",
      "combat",
      "weapon",
    ],
  },
];

/**
 * Classify a canon ability into a combat role by its name + description. Pure.
 * Falls through to `utility` when no role keyword matches (the flagged "gap"
 * default — see the module header).
 */
export function classifyAbility(name: string, description: string): AbilityKind {
  const haystack = `${name} ${description}`.toLowerCase();
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.kind;
  }
  return "utility";
}

// Per-role tuning. Potency stays MODERATE and capped so a kit gives tactical
// depth without deciding a fight (the engine's "preparation/abilities help but
// never decide" rule). Sanity cost / control-strain make the strongest plays
// the riskiest. Cooldown keeps the heavy hits from being spammed.
const ROLE_BASE: Record<
  AbilityKind,
  { potency: number; sanityCost: number; controlStrain: number; cooldown: number }
> = {
  offensive: { potency: 0.16, sanityCost: -3, controlStrain: 0.08, cooldown: 1 },
  control: { potency: 0.14, sanityCost: -4, controlStrain: 0.1, cooldown: 1 },
  defensive: { potency: 0.1, sanityCost: -1, controlStrain: 0, cooldown: 0 },
  evasive: { potency: 0.08, sanityCost: -1, controlStrain: 0, cooldown: 0 },
  utility: { potency: 0.1, sanityCost: -2, controlStrain: 0.03, cooldown: 0 },
};

// Which framings each role is especially effective against (informs the UI and,
// later, a small situational bonus). Grounded in fiction: force fells beasts and
// thugs; control wrests a puppeteered/coerced ally free; defence weathers a
// genuine hostile; evasion slips a lost-control rampager.
const ROLE_COUNTERS: Record<AbilityKind, EncounterFraming[]> = {
  offensive: ["beast", "mundane-threat"],
  control: ["mind-controlled", "coerced"],
  defensive: ["hostile-beyonder"],
  evasive: ["lost-control"],
  utility: [],
};

const POTENCY_CAP = 0.3;
const SANITY_COST_CAP = -12;

/** A short id slug from an ability name (stable across saves). */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Scale a role's base stats for the rung an ability sits at. Deeper rungs (lower
 * sequence number) hit harder but cost more sanity and strain — a clear power
 * curve. `enhanced` abilities (retained from an earlier rung, now strengthened)
 * get a small potency bump. All values clamped so no single ability dominates.
 */
function scaleForLevel(
  base: (typeof ROLE_BASE)[AbilityKind],
  sourceLevel: number,
  enhanced: boolean,
): { potency: number; sanityCost: number; controlStrain: number } {
  // Depth 0 (Seq 9) … rising as the rung deepens.
  const depth = clamp(9 - sourceLevel, 0, 9);
  const potency = clamp(
    base.potency * (1 + depth * 0.05) + (enhanced ? 0.02 : 0),
    0,
    POTENCY_CAP,
  );
  const sanityCost = Math.max(
    SANITY_COST_CAP,
    Math.round(base.sanityCost * (1 + depth * 0.12)),
  );
  const controlStrain = clamp(base.controlStrain * (1 + depth * 0.08), 0, 0.3);
  return {
    potency: round4(potency),
    sanityCost,
    controlStrain: round4(controlStrain),
  };
}

/** Condense a canon description to a combat-length clause. */
function condense(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117).trimEnd()}…`;
}

/**
 * The source-ability shape `combatAbilityFrom` needs — satisfied by both a
 * rules-engine `CumulativeAbility` and a `RetainedAbility` frozen from a switched-
 * away pathway (issue #211). `enhanced` is optional (a retained ability has none).
 */
export interface KitSourceAbility {
  name: string;
  description: string;
  sourceLevel: number;
  enhanced?: boolean;
}

/**
 * Build one `CombatAbility` from a source ability, classified into a combat role
 * and scaled for its rung. The role classification always yields a value (falling
 * through to `utility`), so this never throws even for an unrecognised ability.
 * `pathwayId` namespaces the id. Pure.
 */
export function combatAbilityFrom(
  ability: KitSourceAbility,
  pathwayId: number,
): CombatAbility {
  const kind = classifyAbility(ability.name, ability.description);
  const base = ROLE_BASE[kind];
  const scaled = scaleForLevel(base, ability.sourceLevel, ability.enhanced ?? false);
  const counters = ROLE_COUNTERS[kind];
  return {
    id: `kit-${pathwayId}-${slug(ability.name)}`,
    name: ability.name,
    kind,
    description: condense(ability.description),
    sanityCost: scaled.sanityCost,
    controlStrain: scaled.controlStrain,
    cooldown: base.cooldown,
    potency: scaled.potency,
    ...(counters.length > 0 ? { counters } : {}),
  };
}

/**
 * The combat ability kit for a Beyonder at `(pathwayId, sequenceLevel)` — the
 * canon cumulative abilities of every rung climbed, classified into combat roles
 * with costs and potency. Cumulative like the underlying abilities, so climbing
 * a rung visibly grows the toolkit. Pure and deterministic.
 */
export function combatKitFor(pathwayId: number, sequenceLevel: number): CombatAbility[] {
  return getCumulativeAbilities(pathwayId, sequenceLevel).map((ability) =>
    combatAbilityFrom(ability, pathwayId),
  );
}

/** A plain-language role descriptor for the legible option/effect tag. */
const KIND_TAG: Record<AbilityKind, string> = {
  offensive: "Offensive — strong with an edge, risky without",
  defensive: "Defensive — steadies the fight",
  control: "Control — bends the foe; lands best when you know them",
  evasive: "Evasive — buys distance and safety",
  utility: "Utility — situational leverage",
};

export function abilityKindTag(kind: AbilityKind): string {
  return KIND_TAG[kind];
}
