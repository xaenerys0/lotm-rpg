import { getPathway, getSequence } from "@/lib/rules";
import {
  type ArtifactEffect,
  type ArtifactGrade,
  type EffectHook,
  effectsForArtifactNumber,
  sealedArtifactNumberFromItemName,
} from "@/lib/lore";
import type { Item } from "@/lib/types/rules";

import { customArtifactForItem } from "./custom-artifacts";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Artifact effects — making an artifact's powers REAL.
// ---------------------------------------------------------------------------
//
// An artifact's effects (its powers) come from the source Beyonder
// Characteristic's pathway + sequence — authored for catalogue artifacts
// (`@/lib/lore` `ARTIFACT_EFFECTS`), derived here for crafted ones. Each effect
// carries an `EffectHook` naming the engine system that ENFORCES it
// (identity / sanity / combat / acquired-power / funds / access), or `narrator`
// — passed to the AI narrator as a BINDING rule it must honour (the game is
// AI-narrated, so that is a real, enforced effect, not flavour). This module
// derives the effects and surfaces them per hook so each subsystem can make
// them function, plus the binding narrator block that catches every effect.

/** How many of a rung's abilities a crafted artifact distils into effects. */
export const MAX_DERIVED_EFFECTS = 3;

/**
 * Keyword → hook table. The single place that maps an ability's words onto the
 * engine system that makes it real, scanned in priority order. Broad and
 * data-driven by intent: extend a list to wire more pathway powers into a
 * subsystem. An ability matching none of these falls back to its combat role
 * (offensive/defensive/control/evasive → combat) and finally to `narrator`.
 */
const EFFECT_HOOK_KEYWORDS: { hook: EffectHook; keywords: string[] }[] = [
  {
    hook: "identity",
    keywords: [
      "disguise",
      "face",
      "faceless",
      "persona",
      "identity",
      "impersonat",
      "appearance",
      "mask",
      "conceal yourself",
      "another person",
    ],
  },
  {
    hook: "acquired-power",
    keywords: [
      "steal",
      "copy",
      "imitate",
      "mimic",
      "record",
      "graze",
      "borrow",
      "replicate",
      "another's power",
      "beyonder ability",
      "beyonder power",
    ],
  },
  {
    hook: "sanity",
    keywords: [
      "heal",
      "cure",
      "calm",
      "soothe",
      "purif",
      "serene",
      "tranquil",
      "mend",
      "restore",
      "comfort",
      "psycholog",
      "sanity",
      "spirit",
    ],
  },
  {
    hook: "access",
    keywords: [
      "teleport",
      "passage",
      "doorway",
      "door to",
      "travel",
      "transport",
      "descend",
      "portal",
      "gateway",
      "mirror-world",
    ],
  },
  {
    hook: "funds",
    keywords: ["wealth", "fortune", "riches", "gold", "treasure", "money", "luck"],
  },
];

/** Combat roles classified by keyword — the fallback when no hook keyword hits. */
const COMBAT_KEYWORDS = [
  "attack",
  "strike",
  "blast",
  "fire",
  "flame",
  "lightning",
  "blade",
  "weapon",
  "destroy",
  "slay",
  "kill",
  "wound",
  "defen",
  "shield",
  "armor",
  "armour",
  "ward",
  "control",
  "command",
  "bind",
  "paralyze",
  "slow",
  "poison",
  "erase",
  "evade",
  "dodge",
  "force",
];

/** Map one ability to the engine hook that should enforce it. Pure. */
export function effectHookForAbility(name: string, description: string): EffectHook {
  const haystack = `${name} ${description}`.toLowerCase();
  for (const rule of EFFECT_HOOK_KEYWORDS) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.hook;
  }
  if (COMBAT_KEYWORDS.some((kw) => haystack.includes(kw))) return "combat";
  return "narrator";
}

/** Condense a canon ability description to an effect-length clause. */
function condense(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157).trimEnd()}…`;
}

/**
 * Derive a crafted artifact's effects (its powers) from the source Beyonder
 * Characteristic's pathway + sequence — the abilities at that rung, each routed
 * to the engine hook its words imply. Falls back to a single binding-narrator
 * effect naming the role when the rung has no listed abilities. Pure.
 */
export function deriveArtifactEffects(
  pathwayId: number,
  sequence: number,
  grade: ArtifactGrade,
): ArtifactEffect[] {
  const seq = getSequence(pathwayId, sequence);
  const abilities = seq?.abilities ?? [];
  const effects: ArtifactEffect[] = abilities.slice(0, MAX_DERIVED_EFFECTS).map((a) => ({
    label: a.name,
    description: condense(a.description),
    hook: effectHookForAbility(a.name, a.description),
    params: { sourcePathwayId: pathwayId, sourceSequence: sequence, grade },
  }));
  if (effects.length === 0) {
    const roleName = seq?.name ?? getPathway(pathwayId)?.name ?? "this pathway";
    effects.push({
      label: `${roleName} power`,
      description: `The bound characteristic of a ${roleName} expresses itself in kind.`,
      hook: "narrator",
      params: { sourcePathwayId: pathwayId, sourceSequence: sequence, grade },
    });
  }
  return effects;
}

/** Per-grade severity phrasing for a derived "loss of control" drawback. */
const GRADE_DRAWBACK_SEVERITY: Record<ArtifactGrade, string> = {
  0: "It is barely controllable; only a god might bear its pull for long, and even then not without cost.",
  1: "Its pull is fierce — prolonged use frays even a Saint's composure toward losing control.",
  2: "Used too long it turns on its wielder, the bound power straining against their will.",
  3: "It exacts a creeping toll on whoever leans on it, the loss-of-control cost ever-present.",
};

/**
 * Derive a crafted artifact's drawback — the pathway's "loss of control" theme,
 * scaled by grade (Grade 0 worst). The downside is the defining trait of a
 * Sealed Artifact, so it is never empty. Pure.
 */
export function deriveArtifactDrawback(pathwayId: number, grade: ArtifactGrade): string {
  const pathway = getPathway(pathwayId)?.name ?? "the pathway";
  return `Bound from a ${pathway} characteristic in a state of having lost control. ${GRADE_DRAWBACK_SEVERITY[grade]}`;
}

/** A carried artifact paired with its resolved effects (catalogue or crafted). */
export interface CarriedArtifactEffects {
  item: Item;
  /** The catalogue code or synthetic crafted code, when recoverable. */
  code?: string;
  effects: ArtifactEffect[];
}

/**
 * Resolve the effects of every sealed artifact the character carries — authored
 * for a catalogue relic, stored for a crafted one. The single read the per-hook
 * surfacing helpers and the narrator block build on. Pure.
 */
export function carriedArtifactEffects(session: GameSession): CarriedArtifactEffects[] {
  const state = session.customArtifactState;
  const result: CarriedArtifactEffects[] = [];
  for (const item of session.gameState.inventory) {
    if (item.category !== "sealed-artifact") continue;
    const code = sealedArtifactNumberFromItemName(item.name);
    const crafted = customArtifactForItem(item, state);
    if (crafted) {
      result.push({ item, code: crafted.code, effects: crafted.effects });
    } else if (code !== undefined) {
      result.push({ item, code, effects: effectsForArtifactNumber(code) });
    }
  }
  return result;
}

/** Every carried effect of a given hook, paired with the item that grants it. */
export function carriedEffectsByHook(
  session: GameSession,
  hook: EffectHook,
): { item: Item; effect: ArtifactEffect }[] {
  const out: { item: Item; effect: ArtifactEffect }[] = [];
  for (const carried of carriedArtifactEffects(session)) {
    for (const effect of carried.effects) {
      if (effect.hook === hook) out.push({ item: carried.item, effect });
    }
  }
  return out;
}

/** A persona/disguise affordance an owned artifact grants (consumed by identity). */
export interface ArtifactIdentityGrant {
  itemName: string;
  label: string;
  description: string;
}

/** Identity (disguise/face) affordances from carried artifacts. */
export function artifactIdentityCapabilities(
  session: GameSession,
): ArtifactIdentityGrant[] {
  return carriedEffectsByHook(session, "identity").map(({ item, effect }) => ({
    itemName: item.name,
    label: effect.label,
    description: effect.description,
  }));
}

/** A usable soothe/heal/purify action an owned artifact grants (consumed by sanity UI). */
export interface ArtifactSanityAction {
  itemName: string;
  label: string;
  description: string;
}

export function artifactSanityActions(session: GameSession): ArtifactSanityAction[] {
  return carriedEffectsByHook(session, "sanity").map(({ item, effect }) => ({
    itemName: item.name,
    label: effect.label,
    description: effect.description,
  }));
}

/** A combat option an owned artifact's effect contributes (informs the combat kit/UI). */
export interface ArtifactCombatEffect {
  itemName: string;
  label: string;
  description: string;
}

export function artifactCombatEffects(session: GameSession): ArtifactCombatEffect[] {
  return carriedEffectsByHook(session, "combat").map(({ item, effect }) => ({
    itemName: item.name,
    label: effect.label,
    description: effect.description,
  }));
}

/** A copy/steal capability an owned artifact's effect grants (extends acquired-powers). */
export interface ArtifactPowerGrant {
  itemName: string;
  label: string;
  description: string;
  /** The canon acquisition method, when the authored effect names one. */
  acquisition?: string;
}

export function artifactPowerAcquisitions(session: GameSession): ArtifactPowerGrant[] {
  return carriedEffectsByHook(session, "acquired-power").map(({ item, effect }) => ({
    itemName: item.name,
    label: effect.label,
    description: effect.description,
    acquisition:
      typeof effect.params?.acquisition === "string"
        ? effect.params.acquisition
        : undefined,
  }));
}

/**
 * The binding `## Artifact Effects` narrator context — EVERY carried effect, so
 * even a `narrator`-hooked effect ("writes laws into the world") is enforced in
 * the fiction and the mapped ones read coherently. The engine-applied effects
 * still go through their clamped functions; this is the narrative authority that
 * makes the whole set real. Empty string when the character carries no artifact.
 */
export function artifactNarratorContext(session: GameSession): string {
  const carried = carriedArtifactEffects(session);
  if (carried.length === 0) return "";
  const lines: string[] = [];
  for (const { item, effects } of carried) {
    if (effects.length === 0) continue;
    const powers = effects.map((e) => `${e.label} (${e.description})`).join("; ");
    lines.push(`- ${item.name}: ${powers}`);
  }
  if (lines.length === 0) return "";
  return [
    "The character holds these Sealed Artifacts; their effects are real and binding —",
    "honour them in the fiction (an effect with no game system is yours to enforce in narration):",
    ...lines,
  ].join("\n");
}
