// Combat bestiary (corpus-verified) — issue #187, combat overhaul Phase 1.
//
// A curated catalogue of region- and Sequence-appropriate foes a Beyonder might
// fight, so the combat engine never has to fall back on a bare "a lurking
// Beyonder" string (the old `deriveEncounterEnemy` complaint). Each entry frames
// WHO you face and WHY (`framing`), and is grounded in `corpus/` — verified
// against the LOTM wiki dump, NOT memory (see the repo-root CLAUDE.md "Canon &
// Source Material" section). A handful of entries are deliberately GENERIC
// (desperate thugs, a rogue Beyonder who lost control) where the corpus offers a
// region no named low-Sequence antagonist — these are clearly flagged as
// generic rather than invented as false canon.
//
// Following the `sealed-artifacts.ts` data-module pattern: the rich reference
// metadata lives here (out of the serialized save); the engine derives a
// lightweight `Enemy` from it via `bestiaryFoeToEnemy`.
//
import type { EncounterFraming } from "@/lib/types/combat";

export interface BestiaryFoe {
  /** Stable id (referenced from a derived `Enemy.bestiaryId`). */
  id: string;
  /** Canon name, or a clearly-generic label. */
  name: string;
  framing: EncounterFraming;
  /** True if a Beyonder — drops a characteristic when slain. */
  isBeyonder: boolean;
  /** Pathway id (1-22) when a Beyonder and canon is clear. */
  pathwayId?: number;
  /**
   * Canon Sequence band `[strongest, weakest]` (lower number = stronger), so a
   * derived enemy stays within the foe's real power range while scaling toward
   * the player. A generic foe uses a wide low band.
   */
  sequenceBand: [number, number];
  /**
   * City ids this foe fits (matching `travel.ts` city ids: tingen/backlund/
   * trier/bayam). Omitted = a generic foe that can appear anywhere.
   */
  regions?: string[];
  /** Canon-grounded, player-safe description. */
  description: string;
  /** Signature abilities/tells (corpus-grounded, condensed). */
  signatureAbilities: string[];
  /** One-line in-world motive. */
  motive?: string;
  /** Corpus citation (wiki page title) or a "generic" marker. */
  sourceRef: string;
}

// The catalogue. Grouped by region; every named entry corpus-verified, every
// generic entry flagged in `sourceRef`.
export const BESTIARY: readonly BestiaryFoe[] = [
  // ── Tingen City (Awana, Loen) ──
  {
    id: "tingen-sirius-arapis",
    name: "Sirius Arapis, Aurora Order cultist",
    framing: "hostile-beyonder",
    isBeyonder: true,
    pathwayId: 9, // Hanged Man (Secrets Suppliant)
    sequenceBand: [9, 9],
    regions: ["tingen"],
    description:
      "A Tingen cloth merchant and Aurora Order fanatic who trafficked the Antigonus Family's cursed notebook and plotted to sacrifice the city's people.",
    signatureAbilities: [
      "Secrets Suppliant rites",
      "Shadow summoning",
      "Fanatic resilience",
    ],
    motive: "Offer Tingen's 'lambs' as sacrifice when the end of days arrives.",
    sourceRef: "wiki: Sirius Arapis (sequence_rank 9, Hanged Man, Aurora Order)",
  },
  {
    id: "tingen-antigonus-puppet",
    name: "the Antigonus Family Puppet",
    framing: "beast",
    isBeyonder: false,
    pathwayId: 1, // Fool — abilities resemble the Seq 5 Marionettist
    sequenceBand: [5, 6],
    regions: ["tingen"],
    description:
      "A clown-painted Grade 2 Sealed Artifact whose presence slows everyone near it, friend or foe, in body and mind — a relic of the Antigonus cult.",
    signatureAbilities: ["Aura of slowing", "Marionette strings", "Berserk seizure"],
    motive: "An uncontrolled relic that lashes out at the living around it.",
    sourceRef:
      "wiki: Antigonus Family Puppet (Grade 2, resembles Fool Seq 5 Marionettist)",
  },
  {
    id: "tingen-lost-control-rampager",
    name: "a Beyonder who lost control",
    framing: "lost-control",
    isBeyonder: true,
    sequenceBand: [7, 9],
    regions: ["tingen"],
    description:
      "An underworld Beyonder whose digestion failed and whose mind broke — now rampaging, more monster than person, until put down.",
    signatureAbilities: [
      "Frenzied strength",
      "Warped pathway powers",
      "No self-preservation",
    ],
    motive: "Driven by a snapped mind; beyond reason, lashing at all who approach.",
    sourceRef:
      "wiki: Klein Moretti/Fights (Mandated Punisher 'that lost control', ch.129) — lost-control archetype is canon",
  },
  {
    id: "tingen-evil-spirit",
    name: "a haunting evil spirit",
    framing: "beast",
    isBeyonder: false,
    sequenceBand: [8, 9],
    regions: ["tingen"],
    description:
      "A wraith-like evil spirit that clings to the living and seeks a body to possess — the kind of low haunt a Nighthawk clears with purifying light.",
    signatureAbilities: ["Possession", "Chilling aura", "Vulnerable to purification"],
    motive: "A restless spirit hungering for a living vessel.",
    sourceRef:
      "wiki: Klein Moretti/Fights (Wraith purified, ch.134); Death Pathway (evil spirits)",
  },

  // ── Backlund (capital of Loen) ──
  {
    id: "backlund-devil-dog",
    name: "the Devil Dog",
    framing: "beast",
    isBeyonder: true,
    pathwayId: 21, // Abyss (Sequence 6 Devil)
    sequenceBand: [6, 7],
    regions: ["backlund"],
    description:
      "A monstrous black hound — a Sequence 6 Devil of the Abyss Pathway — kept by a Beyonder, the predator behind a string of Backlund killings.",
    signatureAbilities: [
      "Superhuman scent-tracking",
      "Savage predation",
      "Abyssal corruption",
    ],
    motive: "A killer's beast, loosed on the streets to hunt and gut.",
    sourceRef: "wiki: Devil Dog (sequence_rank 6, Abyss Pathway, Backlund)",
  },
  {
    id: "backlund-meursault",
    name: "Meursault, the gang executioner",
    framing: "hostile-beyonder",
    isBeyonder: true,
    pathwayId: 14, // Red Priest (Sequence 9 Hunter)
    sequenceBand: [9, 9],
    regions: ["backlund"],
    description:
      "A sun-darkened highlander 'executioner' of the Zmanger gang, nearly the boss's equal — a Sequence 9 Hunter of the Red Priest Pathway.",
    signatureAbilities: ["Hunter's tracking", "Brutal close combat", "Beast-keen senses"],
    motive: "Enforce the gang's will and silence its enemies.",
    sourceRef: "wiki: Meursault (sequence_rank 9, Red Priest, Zmanger gang, Backlund)",
  },
  {
    id: "backlund-hood-eugen",
    name: "Hood Eugen of the Psychology Alchemists",
    framing: "hostile-beyonder",
    isBeyonder: true,
    pathwayId: 2, // Visionary (Sequence 7 Psychiatrist)
    sequenceBand: [7, 7],
    regions: ["backlund", "tingen"],
    description:
      "A Sequence 7 Psychiatrist of the Visionary Pathway tied to the Psychology Alchemists — a manipulator of minds and perception.",
    signatureAbilities: [
      "Mind reading",
      "Illusion and suggestion",
      "Emotional manipulation",
    ],
    motive: "Advance the Psychology Alchemists' designs by bending minds.",
    sourceRef: "wiki: Hood Eugen (sequence_rank 7, Visionary, Psychology Alchemists)",
  },
  {
    id: "backlund-rosago",
    name: "Rosago, the Marionettist assassin",
    framing: "hostile-beyonder",
    isBeyonder: true,
    pathwayId: 1, // Fool (Sequence 5 Marionettist)
    sequenceBand: [5, 5],
    regions: ["backlund"],
    description:
      "A Sequence 5 Marionettist of the Fool Pathway and a foreign intelligence operative — he hunts by divination and fights through puppets.",
    signatureAbilities: ["Marionette control", "Pre-emptive divination", "Misdirection"],
    motive: "Carry out an assassination contract for a foreign order.",
    sourceRef: "wiki: Rosago (sequence_rank 5, Fool, Secret Order / Intis intelligence)",
  },

  // ── Bayam (Rorsted Archipelago) ──
  {
    id: "bayam-headless-creature",
    name: "a headless sea-cult creature",
    framing: "beast",
    isBeyonder: false,
    sequenceBand: [8, 9],
    regions: ["bayam"],
    description:
      "A servitor monster of the Rorsted sea-god cult — a headless thing loosed in the harbor to drag the faithless under.",
    signatureAbilities: [
      "Relentless grappling",
      "No vital head to strike",
      "Brine-soaked resilience",
    ],
    motive: "Serve the sea-god's cult and seize sacrifices for it.",
    sourceRef:
      "wiki: Klein Moretti/Fights (headless creatures, Bansy Harbor, ch.508-511)",
  },
  {
    id: "bayam-sea-cultist",
    name: "a sea-god cult zealot",
    framing: "mundane-threat",
    isBeyonder: false,
    sequenceBand: [8, 9],
    regions: ["bayam"],
    description:
      "A fanatic of the outlawed Rorsted sea-god faith — knife, net, and zealotry in the salt-stained alleys of the harbor.",
    signatureAbilities: [
      "Ambush in numbers",
      "Improvised harbor weapons",
      "Fearless fanaticism",
    ],
    motive: "Defend the sea-god's secret rites from outsiders.",
    sourceRef:
      "wiki: Klein Moretti/History (Bayam sea-god cult) — generic cultist filler",
  },

  // ── Trier (Feysac Empire) — corpus offers no named low-Seq antagonist; ──
  // ── these are clearly-generic mundane/lost-control foes, NOT invented canon. ──
  {
    id: "trier-feysac-brigand",
    name: "a Feysac brigand",
    framing: "mundane-threat",
    isBeyonder: false,
    sequenceBand: [8, 9],
    regions: ["trier"],
    description:
      "A hard-bitten raider of the militarist Feysac north, where strength is law and the weak are prey.",
    signatureAbilities: ["Soldier's discipline", "Heavy blade", "Pack tactics"],
    motive: "Take by force what the strong are owed.",
    sourceRef: "generic: Feysac has no named low-Seq wiki antagonist (flagged)",
  },

  // ── Generic / cross-region rogues and threats ──
  {
    id: "generic-desperate-thugs",
    name: "desperate thugs",
    framing: "mundane-threat",
    isBeyonder: false,
    sequenceBand: [9, 9],
    description:
      "Cornered street toughs with cudgels and knives — no powers, only numbers and desperation.",
    signatureAbilities: ["Numbers", "Cheap shots", "Flee when outmatched"],
    motive: "Rob, silence a witness, or settle a score.",
    sourceRef: "generic: ordinary mundane filler (flagged)",
  },
  {
    id: "generic-rogue-monster",
    name: "a rogue Beyonder turned monster",
    framing: "lost-control",
    isBeyonder: true,
    sequenceBand: [6, 9],
    description:
      "A Beyonder who pushed past their limit and lost control — flesh warped, mind gone, a danger to everyone near.",
    signatureAbilities: [
      "Monstrous transformation",
      "Erratic pathway powers",
      "Berserk frenzy",
    ],
    motive: "A broken mind beyond bargaining — only stopped by force or pity.",
    sourceRef:
      "wiki: Ray Bieber (lost-control transformation, Tingen) — lost-control monster archetype is canon",
  },
];

/** O(1) lookup by id. */
const BY_ID = new Map(BESTIARY.map((foe) => [foe.id, foe]));

export function getBestiaryFoe(id: string): BestiaryFoe | undefined {
  return BY_ID.get(id);
}

/**
 * Whether a foe's canon Sequence band is appropriate for a player at the given
 * Sequence: the band must overlap a window of ±2 rungs around the player (up to
 * two rungs stronger or weaker), so a fight is near-level or a slight stretch,
 * never hopelessly mismatched. Sequences count DOWN as power rises.
 */
function bandFitsSequence(band: [number, number], playerSequence: number): boolean {
  const [strong, weak] = band;
  const windowStrong = playerSequence - 2; // up to two rungs stronger (lower number)
  const windowWeak = playerSequence + 2; // up to two rungs weaker (higher number)
  return strong <= windowWeak && weak >= windowStrong;
}

/**
 * Whether a foe can appear in the given region: a foe with no `regions` is
 * generic (appears anywhere); otherwise the region id must be listed.
 */
function fitsRegion(foe: BestiaryFoe, regionId?: string): boolean {
  if (!foe.regions) return true;
  if (!regionId) return false;
  return foe.regions.includes(regionId);
}

/**
 * The bestiary foes appropriate for a region + player Sequence, in catalogue
 * order (named, region-specific foes first by virtue of authoring order, then
 * generics). Pure and deterministic.
 */
export function bestiaryFor(
  regionId: string | undefined,
  playerSequence: number,
): BestiaryFoe[] {
  return BESTIARY.filter(
    (foe) =>
      fitsRegion(foe, regionId) && bandFitsSequence(foe.sequenceBand, playerSequence),
  );
}

/**
 * The concrete Sequence a derived enemy fights at: the value in the foe's canon
 * band closest to one rung stronger than the player, so difficulty scales
 * without breaking canon (the Devil Dog stays a Seq 6-7 Devil, never a Seq 9).
 */
export function bestiaryFoeSequence(foe: BestiaryFoe, playerSequence: number): number {
  const [strong, weak] = foe.sequenceBand;
  const target = playerSequence - 1;
  return Math.min(weak, Math.max(strong, target));
}

/**
 * Whether a foe's canon Sequence band CONTAINS a specific Sequence (lower number
 * = stronger): the band `[strong, weak]` covers `seq` when `strong <= seq <=
 * weak`. Used to align an ingredient-hunt quarry to the exact Sequence of the
 * Beyonder Characteristic being hunted (not the ±2 fight-difficulty window).
 */
function bandCoversSequence(band: [number, number], seq: number): boolean {
  const [strong, weak] = band;
  return strong <= seq && seq <= weak;
}

/**
 * The curated foes that BEAR a given pathway's Characteristic at a target
 * Sequence — a catalogued Beyonder of that exact pathway whose canon band covers
 * the rung whose Characteristic a hunter needs (issue #187 follow-up). This is
 * the "hunt a related monster that is part of the pathway and sequence you need"
 * case: an Abyss hunter after a Sequence 6-7 Characteristic finds the Devil Dog,
 * while a hunter on any OTHER pathway never does. Region-preferred (region-fitting
 * foes first) but not region-bound — the pathway/Sequence match matters more than
 * locale for a hunt, and the catalogue is sparse. Pure and deterministic, in
 * catalogue order within each group.
 */
export function bestiaryForPathwaySequence(
  pathwayId: number,
  targetSeq: number,
  regionId?: string,
): BestiaryFoe[] {
  const matches = BESTIARY.filter(
    (foe) =>
      foe.isBeyonder &&
      foe.pathwayId === pathwayId &&
      bandCoversSequence(foe.sequenceBand, targetSeq),
  );
  return [
    ...matches.filter((foe) => fitsRegion(foe, regionId)),
    ...matches.filter((foe) => !fitsRegion(foe, regionId)),
  ];
}
