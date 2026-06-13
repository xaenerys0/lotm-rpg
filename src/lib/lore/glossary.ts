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
  },
  {
    slug: "church-of-the-evernight-goddess",
    term: "Church of the Evernight Goddess",
    category: "Organizations",
    definition:
      "Keeper of night, secrets, and the doctrine that some knowledge should stay unread. Strong in the Loen Kingdom; its cathedrals hold evening services and other, unlisted appointments.",
    revealAtSequence: 9,
  },
  {
    slug: "loen-kingdom",
    term: "Loen Kingdom",
    category: "Geography",
    definition:
      "A constitutional monarchy of steam, coal, and empire — the setting's heart. Its cities run on ledgers by day and on quieter arrangements by night.",
    revealAtSequence: 9,
  },
  {
    slug: "tingen",
    term: "Tingen City",
    category: "Geography",
    definition:
      "A provincial city in the Awwa region: university, docks, foundries, fog. A surprising amount of the second city's business passes through it.",
    revealAtSequence: 9,
  },
  {
    slug: "fifth-epoch",
    term: "The Fifth Epoch",
    category: "History",
    definition:
      "The current age, reckoned from the fall of the Fourth. An era of steam engines and gaslight — young enough that its foundations still creak.",
    revealAtSequence: 9,
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
  },
  {
    slug: "church-of-the-god-of-steam",
    term: "Church of the God of Steam and Machinery",
    category: "Organizations",
    definition:
      "Patron of engineers, factories, and progress. Its Machinery Hivemind keeps the industrial age's secrets running on schedule.",
    revealAtSequence: 8,
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
];

/**
 * Terms visible to a character at `sequenceLevel` (progressive disclosure):
 * a term unlocks once the player's sequence is at or below its threshold.
 */
export function glossaryForSequence(sequenceLevel: number): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((term) => term.revealAtSequence >= sequenceLevel);
}

/** Look up one term by slug (locked or not — caller decides visibility). */
export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((term) => term.slug === slug);
}

/** Count of still-sealed terms — surfaced as flavor, never as a spoiler list. */
export function sealedTermCount(sequenceLevel: number): number {
  return GLOSSARY_TERMS.length - glossaryForSequence(sequenceLevel).length;
}
