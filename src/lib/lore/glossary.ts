// ---------------------------------------------------------------------------
// In-game glossary (issue #14)
// ---------------------------------------------------------------------------
//
// Player-facing reference with PROGRESSIVE DISCLOSURE: every term unlocks at
// a sequence threshold so deep-game concepts stay sealed until the player
// approaches them (Seq 9-8 basics at the start; rituals/organisations around
// 7-5; Sefirah-tier mysteries only at 4+). Entries are written as
// world-building, not a manual, and contain ONLY knowledge a Beyonder of that
// standing could plausibly hold — nothing here is narrator-only lore.

import { passesEpochGate } from "./epochs";

export const GLOSSARY_CATEGORIES = [
  "Mechanics",
  "Pathways",
  "Organizations",
  "History",
  "Geography",
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryTerm {
  slug: string;
  term: string;
  category: GlossaryCategory;
  /** World-building voice — a knowledgeable acquaintance, not a rulebook. */
  definition: string;
  /**
   * Progressive disclosure: the term unlocks once the player's sequence
   * level is at or below this number (lower sequence = greater power).
   * 9 = visible from the start.
   */
  revealAtSequence: number;
  /**
   * Epoch gate (issue: character epoch isolation). Untagged terms are universal
   * Beyonder knowledge that holds in every era. A tagged term is shown only to a
   * character of that exact epoch — so a First-Epoch character never sees the
   * Fifth-Epoch nations and churches, and their existence isn't even hinted at
   * by the sealed-term count.
   */
  epoch?: number;
}

export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  // ── From the first night (Seq 9) ──
  {
    slug: "beyonder",
    term: "Beyonder",
    category: "Mechanics",
    definition:
      "One who has drunk a potion and stepped off the ordinary world's map. Beyonders keep their existence quiet; the churches make sure of it.",
    revealAtSequence: 9,
  },
  {
    slug: "sequence",
    term: "Sequence",
    category: "Mechanics",
    definition:
      "The nine rungs of a pathway's ladder, counted downward: Sequence 9 is the first sip of power, Sequence 1 stands at the threshold of godhood. Each rung demands its predecessor be fully digested.",
    revealAtSequence: 9,
  },
  {
    slug: "pathway",
    term: "Pathway",
    category: "Pathways",
    definition:
      "A family of potions sharing one nature — divination, radiance, death, and stranger things. A Beyonder climbs one pathway; switching is, with rare exceptions, a way to die untidily.",
    revealAtSequence: 9,
  },
  {
    slug: "potion",
    term: "Potion",
    category: "Mechanics",
    definition:
      "The vehicle of advancement: a formula, a main ingredient from some Beyonder creature, and supplementary materials. Drinking it grants the Sequence — and quarters a stranger in your head until digested.",
    revealAtSequence: 9,
  },
  {
    slug: "acting-method",
    term: "The Acting Method",
    category: "Mechanics",
    definition:
      "The craft of digesting a potion by living its role: a Seer divines, a Bard performs, a Gravedigger tends the dead. Play the part honestly and the potion forgets it was ever separate from you.",
    revealAtSequence: 9,
  },
  {
    slug: "loss-of-control",
    term: "Loss of Control",
    category: "Mechanics",
    definition:
      "What waits at the bottom of a spent mind: the potion takes the wheel. The lucky wake up somewhere strange, missing things. The unlucky are what the Nighthawks' sealed reports are about.",
    revealAtSequence: 9,
  },
  {
    slug: "nighthawks",
    term: "The Nighthawks",
    category: "Organizations",
    definition:
      "The Church of the Evernight Goddess's quiet professionals: they investigate the uncanny, confiscate the dangerous, and bury the inexplicable. Officially, they do not exist.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "church-of-the-evernight-goddess",
    term: "Church of the Evernight Goddess",
    category: "Organizations",
    definition:
      "Keeper of night, secrets, and the doctrine that some knowledge should stay unread. Strong in the Loen Kingdom; its cathedrals hold evening services and other, unlisted appointments.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "loen-kingdom",
    term: "Loen Kingdom",
    category: "Geography",
    definition:
      "A constitutional monarchy of steam, coal, and empire — the setting's heart. Its cities run on ledgers by day and on quieter arrangements by night.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "tingen",
    term: "Tingen City",
    category: "Geography",
    definition:
      "A provincial city in the Awwa region: university, docks, foundries, fog. A surprising amount of the second city's business passes through it.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "pritz-harbor",
    term: "Pritz Harbor",
    category: "Geography",
    definition:
      "Loen's chief naval port beneath the Hornacis range — dry-docks, warships, and fog. A heavy garrison watches the mountain passes, and a great deal moves through a port that busy unseen.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "enmat-harbor",
    term: "Enmat Harbor",
    category: "Geography",
    definition:
      "A small Loen fishing town the sea-fog swallows most nights. Old charms over the doorways, strangers counted, and the nearest real authority a long road away.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "feysac-empire",
    term: "Feysac Empire",
    category: "Geography",
    definition:
      "The cold militarist empire to the north, beyond the Hornacis range, devoted to the God of Combat. Discipline, martial honour, and a dangerous frontier where monsters press at the walls.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "fifth-epoch",
    term: "The Fifth Epoch",
    category: "History",
    definition:
      "The current age, reckoned from the fall of the Fourth. An era of steam engines and gaslight — young enough that its foundations still creak.",
    revealAtSequence: 9,
    epoch: 5,
  },
  // ── With a little standing (Seq 8) ──
  {
    slug: "spirituality",
    term: "Spirituality",
    category: "Mechanics",
    definition:
      "The inner reserve a Beyonder spends to work abilities — felt as focus, intuition, and the pressure behind the eyes. It recovers with rest; running it dry invites mistakes.",
    revealAtSequence: 8,
  },
  {
    slug: "spirit-world",
    term: "The Spirit World",
    category: "History",
    definition:
      "The tide pressing against the world's thin places. Mediums, dreams, and bad rituals all open onto it; most of what lives there is best left unintroduced.",
    revealAtSequence: 8,
  },
  {
    slug: "ritual",
    term: "Ritualistic Magic",
    category: "Mechanics",
    definition:
      "Asking a power for something, in the proper form: purified ground, the correct honorific, an offering matched to the request. The form matters because the wrong audience may answer.",
    revealAtSequence: 8,
  },
  {
    slug: "church-of-the-lord-of-storms",
    term: "Church of the Lord of Storms",
    category: "Organizations",
    definition:
      "Faith of sailors, soldiers, and judges of the sea. Its Mandated Punishers handle the uncanny with rather less paperwork than the Nighthawks.",
    revealAtSequence: 8,
    epoch: 5,
  },
  {
    slug: "church-of-the-god-of-steam",
    term: "Church of the God of Steam and Machinery",
    category: "Organizations",
    definition:
      "Patron of engineers, factories, and progress. Its Machinery Hivemind keeps the industrial age's secrets running on schedule.",
    revealAtSequence: 8,
    epoch: 5,
  },
  // ── A practitioner's knowledge (Seq 7) ──
  {
    slug: "mystical-item",
    term: "Mystical Items",
    category: "Mechanics",
    definition:
      "Objects that remember being Beyonders, or were made by them. The useful ones exact a price; the priced ones are still safer than the sealed ones.",
    revealAtSequence: 7,
  },
  {
    slug: "sealed-artifact",
    term: "Sealed Artifacts",
    category: "Mechanics",
    definition:
      "Items the churches catalogue, grade, and lock away — powers too dangerous or too opinionated to circulate. Using one is borrowing from a lender with unusual collection practices.",
    revealAtSequence: 7,
  },
  {
    slug: "cataclysm",
    term: "The Cataclysm",
    category: "History",
    definition:
      "The catastrophe that ended the Fourth Epoch. Histories disagree on details and agree on scale; the prudent treat the disagreement itself as a warning.",
    revealAtSequence: 7,
  },
  // ── The mid-Sequences (Seq 5) ──
  {
    slug: "demigod",
    term: "Demigod",
    category: "Mechanics",
    definition:
      "Sequence 4 and above: Beyonders whose existence starts bending the room. Conflict between demigods is less a duel than a localized natural disaster.",
    revealAtSequence: 5,
  },
  {
    slug: "saint",
    term: "Saint",
    category: "Mechanics",
    definition:
      "The honorific the churches give their Sequence 4s. The word is doing a great deal of diplomatic work.",
    revealAtSequence: 5,
    epoch: 5,
  },
  // ── At the threshold (Seq 4) ──
  {
    slug: "sefirah",
    term: "Sefirah",
    category: "History",
    definition:
      "One of the great vessels said to underlie reality itself. Those who speak of them firsthand are either lying, or have stopped being the sort of thing that lies.",
    revealAtSequence: 4,
  },
  {
    slug: "above-the-sequence",
    term: "Above the Sequence",
    category: "History",
    definition:
      "Whatever stands past Sequence 0. The libraries that addressed the question directly are the reason several catalogues now have gaps.",
    revealAtSequence: 4,
  },
  // ── Epoch-specific terms (issue: character epoch isolation) ──
  // Each is tagged to a single non-Fifth epoch, so it appears only for a
  // character of that era — and its existence is hidden from everyone else.
  {
    slug: "original-creator",
    term: "The Original Creator",
    category: "History",
    definition:
      "The primordial, maddened will whose awakening and self-destruction scattered the first powers across the world — the catastrophe that opened the Age of Chaos.",
    revealAtSequence: 9,
    epoch: 1,
  },
  {
    slug: "age-of-chaos",
    term: "The Age of Chaos",
    category: "History",
    definition:
      "The First Epoch: a lawless dawn of monstrous mutation and bare survival, before nations, churches, or any codified path to power.",
    revealAtSequence: 9,
    epoch: 1,
  },
  {
    slug: "ancient-gods",
    term: "The Ancient Gods",
    category: "History",
    definition:
      "The eight monstrous-but-rational deities who divided rule over the Dark Epoch — among them the Giant King, the Elf King, and the Sanguine Ancestor — beneath whom humanity lived as the slave race.",
    revealAtSequence: 9,
    epoch: 2,
  },
  {
    slug: "the-dark-epoch",
    term: "The Dark Epoch",
    category: "History",
    definition:
      "The Second Epoch: the long night when inhuman gods ruled openly and humans survived as the property or prey of Giants, Elves, and Sanguines.",
    revealAtSequence: 9,
    epoch: 2,
  },
  {
    slug: "ancient-sun-god",
    term: "The Ancient Sun God",
    category: "History",
    definition:
      "The human survivor who slew the Ancient Gods and reigned over the Third Epoch as the sole Orthodox God — until his own lieutenants conspired to kill him.",
    revealAtSequence: 9,
    epoch: 3,
  },
  {
    slug: "forsaken-land",
    term: "The Forsaken Land of the Gods",
    category: "Geography",
    definition:
      "The cursed, sunless continent left when the Ancient Sun God fell — wracked by eternal lightning, where the abandoned faithful still keep their penance.",
    revealAtSequence: 9,
    epoch: 3,
  },
  {
    slug: "epoch-of-the-gods",
    term: "The Epoch of the Gods",
    category: "History",
    definition:
      "The Fourth Epoch: the age when gods walked the world in person and raised rival god-empires whose wars remade the continents.",
    revealAtSequence: 9,
    epoch: 4,
  },
  {
    slug: "solomon-empire",
    term: "The Solomon Empire",
    category: "Organizations",
    definition:
      "The god-empire of the Sequence-0 Black Emperor Solomon, which dominated the Northern Continent of the Fourth Epoch and warred for a thousand years against the orthodox Seven Gods.",
    revealAtSequence: 9,
    epoch: 4,
  },
];

/**
 * Terms visible to a character at `sequenceLevel` (progressive disclosure):
 * a term unlocks once the player's sequence is at or below its threshold. Terms
 * are also epoch-gated (issue: character epoch isolation) — a character only
 * ever sees universal mechanics plus terms tagged for its own epoch. An absent
 * `epoch` defaults to the Fifth.
 */
export function glossaryForSequence(
  sequenceLevel: number,
  epoch?: number,
): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter(
    (term) =>
      term.revealAtSequence >= sequenceLevel && passesEpochGate(term.epoch, epoch),
  );
}

/** Look up one term by slug (locked or not — caller decides visibility). */
export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((term) => term.slug === slug);
}

/**
 * Count of still-sealed terms — surfaced as flavor, never as a spoiler list.
 * Counted against the epoch-applicable universe only, so an other-epoch term's
 * very existence is never leaked to a character who can never reach it.
 */
export function sealedTermCount(sequenceLevel: number, epoch?: number): number {
  // A single pass over the epoch-applicable universe: a term is sealed when its
  // reveal threshold is still below the player's sequence. Counting only
  // epoch-applicable terms keeps other-epoch entries' existence hidden.
  return GLOSSARY_TERMS.filter(
    (term) => passesEpochGate(term.epoch, epoch) && term.revealAtSequence < sequenceLevel,
  ).length;
}
