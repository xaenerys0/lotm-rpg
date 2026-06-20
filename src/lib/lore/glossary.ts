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

import type { AccessFlag } from "@/lib/ai";
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
  /**
   * Capability gate (world build-out, issue #132). A term tagged with a flag is
   * shown ONLY to a character who holds it (e.g. the access-gated Forsaken Land's
   * terms require `dream-world-passage`) — so a mainland character never sees the
   * sealed continent's vocabulary, and the sealed-term count never leaks its
   * existence. Absent = no capability required.
   */
  requiresFlag?: AccessFlag;
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
    slug: "constant-city",
    term: "Constant City",
    category: "Geography",
    definition:
      "The Wind City — Loen's second city and the capital of Midseashire, built on coal and steel. Blast furnaces and a hard sea wind, the Church of Steam's great seat outside the capital, and deep industrial money.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "midseashire",
    term: "Midseashire",
    category: "Geography",
    definition:
      "The crowded north-eastern coast of the Northern Continent, shared by Loen, Intis, and Feysac and ringed with mill-towns — the busiest industrial seaboard of the age. Loen's stretch is crowned by Constant City.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "loen-relic-foundation",
    term: "Loen Relic Search & Preservation Foundation",
    category: "Organizations",
    definition:
      "A non-profit foundation in East Chester County that funds digs and buys up antiquities, founded by the noblewoman Audrey Hall. A respectable patron of learning — whose strict Compliance Department keeps quieter business than dusty notebooks.",
    revealAtSequence: 8,
    epoch: 5,
  },
  {
    slug: "intis-republic",
    term: "The Intis Republic",
    category: "Geography",
    definition:
      "The second-strongest nation of the Northern Continent, west of Loen beyond the Hornacis range. A parliamentary republic of sun-worship, steam, and revolutionary politics, founded by the Sauron Family and reshaped by the transmigrator-emperor Roselle. Its sunlit capital is Trier.",
    revealAtSequence: 9,
    epoch: 5,
  },
  {
    slug: "eternal-blazing-sun",
    term: "Church of the Eternal Blazing Sun",
    category: "Organizations",
    definition:
      "The great orthodox faith of the Intis Republic, controlling the Sun pathway and worshipping the Eternal Blazing Sun as the Father of All Life. Golden-domed cathedrals, white-and-gold clergy, and a stern Inquisition that hunts what offends the light.",
    revealAtSequence: 8,
    epoch: 5,
  },
  {
    slug: "aurora-order",
    term: "The Aurora Order",
    category: "Organizations",
    definition:
      "A secret cult known to the public as a lunatic terrorist organisation, active in both Loen and Intis. To the Beyonder world it is the worshippers of the True Creator — a heresy the orthodox Churches hunt without mercy.",
    revealAtSequence: 7,
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
  // ── Forsaken Land of the Gods (world build-out 3, issue #132) ──
  // The PLAYABLE PRESENT, tagged epoch 5 AND gated behind the dream-world
  // passage: only a character who holds that capability (a Forsaken origin, or
  // one who earned it) ever sees these — a mainland Fifth-Epoch character does
  // not, and the sealed-term count never reveals they exist. (The Third-Epoch
  // fall remains the separate epoch:3 `forsaken-land` history term above.)
  {
    slug: "city-of-silver",
    term: "The City of Silver",
    category: "Geography",
    definition:
      "A surviving city of the Forsaken Land, the former seat of the Kingdom of Silver — grey-white stone under a sky of perpetual lightning, home to a giant-descended people (the strongest walking the Twilight Giant path) who endure their isolation alone.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "silver-city-passage",
  },
  {
    slug: "giant-kings-court-term",
    term: "Giant King's Court",
    category: "Geography",
    definition:
      "The titan-scaled ruin east of the City of Silver, holiest and most feared site of the Forsaken Land — for its shadow in the Dream World is the only doorway in or out of the sealed continent.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "dream-world-passage",
  },
  {
    slug: "sea-of-ruins",
    term: "The Sea of Ruins",
    category: "Geography",
    definition:
      "The drowned, wreck-choked ocean that seals the Forsaken Land from the world. It cannot be sailed and turns back even the strong; only the Dream-World passage crosses it.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "dream-world-passage",
  },
  {
    slug: "silver-knights",
    term: "The Silver Knights",
    category: "Organizations",
    definition:
      "The honoured elite of the City of Silver's giant-blooded warriors — Beyonders of the Twilight Giant path, the title marking a high rung of that pathway — who hold the walls against the dead country and keep the watch over Giant King's Court.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "silver-city-passage",
  },
  {
    slug: "moon-city",
    term: "Moon City",
    category: "Geography",
    definition:
      "An isolated city of the Forsaken Land's eastern reaches, descended from an older people, whose inhabitants have kept an ancient watch on the world-ending gray fog for thousands of years under their three High Priests — unaware, until late, that any other city of the sealed continent survived.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "moon-city-passage",
  },
  {
    slug: "the-gray-fog",
    term: "The Gray Fog",
    category: "Geography",
    definition:
      "The unmoving wall of gray fog at the eastern edge of the Forsaken Land that no living thing may pass — the seam toward the sealed Western Continent. Moon City was set to watch it long ago and watches it still.",
    revealAtSequence: 5,
    epoch: 5,
    requiresFlag: "moon-city-passage",
  },
  {
    slug: "dream-world-passage",
    term: "The Dream-World Passage",
    category: "Mechanics",
    definition:
      "The rare capability to cross between the world and the sealed Forsaken Land through the shadow of Giant King's Court in the Dream World — the gate that reopened in 1351. No ship can make the crossing; this can.",
    revealAtSequence: 9,
    epoch: 5,
    requiresFlag: "dream-world-passage",
  },
];

/**
 * Whether a term's capability gate is satisfied (issue #132). A term with no
 * `requiresFlag` is ungated; one with a flag shows only when the character holds
 * it. Mirrors `passesEpochGate`'s shape so the two gates compose.
 */
function passesFlagGate(
  required: AccessFlag | undefined,
  held: readonly string[] | undefined,
): boolean {
  if (required === undefined) return true;
  return held?.includes(required) ?? false;
}

/**
 * Terms visible to a character at `sequenceLevel` (progressive disclosure):
 * a term unlocks once the player's sequence is at or below its threshold. Terms
 * are also epoch-gated (issue: character epoch isolation) — a character only
 * ever sees universal mechanics plus terms tagged for its own epoch — AND
 * capability-gated (issue #132): a flag-gated term (the Forsaken Land's) shows
 * only to a character holding that `accessFlag`. An absent `epoch` defaults to
 * the Fifth; absent `accessFlags` means none held.
 */
export function glossaryForSequence(
  sequenceLevel: number,
  epoch?: number,
  accessFlags?: readonly string[],
): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter(
    (term) =>
      term.revealAtSequence >= sequenceLevel &&
      passesEpochGate(term.epoch, epoch) &&
      passesFlagGate(term.requiresFlag, accessFlags),
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
export function sealedTermCount(
  sequenceLevel: number,
  epoch?: number,
  accessFlags?: readonly string[],
): number {
  // A single pass over the epoch- AND capability-applicable universe: a term is
  // sealed when its reveal threshold is still below the player's sequence.
  // Counting only terms the character could ever reach keeps other-epoch and
  // flag-gated (Forsaken) entries' existence hidden (issue #132).
  return GLOSSARY_TERMS.filter(
    (term) =>
      passesEpochGate(term.epoch, epoch) &&
      passesFlagGate(term.requiresFlag, accessFlags) &&
      term.revealAtSequence < sequenceLevel,
  ).length;
}
