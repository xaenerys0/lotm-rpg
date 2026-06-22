// Sealed Artifacts catalogue (corpus-verified).
//
// Sealed Artifacts (a.k.a. Mystical Items dangerous enough to be sealed) are
// extraordinary items — often, but not always, fused with a Beyonder
// Characteristic — that grant powerful effects at the cost of a significant
// drawback, because they are in a state of "having lost control." The churches
// catalogue them by a two-part code: the leading digit is the GRADE (0-3, by
// danger), the rest a sequential number within that grade (e.g. "0-08",
// "2-049", "3-0782").
//
// Grade ladder (canon):
//   0 — ≈ Angel (Sequence 1-2). Stored only in a Holy Cathedral basement.
//   1 — ≈ Saint (Sequence 3-4). One or two per central cathedral.
//   2 — ≈ Mid-Sequence Beyonder (Sequence 5-7). A few per cathedral.
//   3 — ≈ Low-Sequence Beyonder (Sequence 8-9). The most numerous, Nighthawk-usable.
//
// CANON: every field below — code, grade, ability, DOWNSIDE, possessor — is
// verified against `corpus/` (the LOTM wiki dump + novel), NOT memory. The
// downside is the defining trait of a Sealed Artifact; it is never omitted. See
// the repo-root CLAUDE.md "Canon & Source Material" section. This is curated
// reference data: the rich metadata lives here (out of the serialized save),
// while `mintArtifactItem` produces the lightweight inventory `Item` a character
// actually carries.
//
import type { Item } from "@/lib/types/rules";

/** Danger grade: 0 (≈ Angel) … 3 (≈ low-Sequence Beyonder). */
export type ArtifactGrade = 0 | 1 | 2 | 3;

export interface SealedArtifact {
  /** Church catalogue code, e.g. "0-08", "2-049", "3-0782". Unique. */
  number: string;
  /** Canonical name, e.g. "Quill of Alzuhod". */
  name: string;
  /** Danger grade (the leading digit of `number`). */
  grade: ArtifactGrade;
  /** Player-safe description of what it is and does. */
  description: string;
  /** The "loss of control" cost — the defining trait. Always present. */
  drawback: string;
  /** Power equivalence (e.g. "≈ Sequence 5 Fool"). */
  powerEquivalence: string;
  /** Canon possessor / custodian church, when stated. */
  holder?: string;
  /** Canon storage site / where it surfaces, when stated. */
  location?: string;
  /** Pathway id (1-22) it resonates with, when canon is clear — for gating. */
  pathwayHint?: number;
  /** Corpus citation. */
  sourceRef: string;
}

/** Human-readable power band per grade (the canon ladder). */
export const GRADE_POWER_BAND: Record<ArtifactGrade, string> = {
  0: "≈ an Angel (Sequence 1-2)",
  1: "≈ a Saint (Sequence 3-4)",
  2: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
  3: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
};

// The catalogue. Grouped by grade; every entry corpus-verified.
export const SEALED_ARTIFACTS: readonly SealedArtifact[] = [
  // ── Grade 0 — Angel-level. Cathedral-basement-only. ──
  {
    number: "0-01",
    name: "Salinger's Blood Banner",
    grade: 0,
    description:
      "A charred banner on an iron-black flagpole, spotted with old blood. A relic of the Death-pathway god-emperor Salinger that is said to have witnessed the death of more than one True God.",
    drawback:
      "Its power is bound to slaughter and the dead; rousing it courts the attention of what answers to spilled blood.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the God of Knowledge and Wisdom",
    location: "Sealed beneath the city of Morora",
    pathwayHint: 4,
    sourceRef: "LOTM wiki: Salinger's Blood Banner (0-01)",
  },
  {
    number: "0-02",
    name: "Trunsoest Brass Book",
    grade: 0,
    description:
      "A heavy book bound in thin brass sheets. It writes laws into the world; once a law is set, violating it becomes impossible and offenders are punished automatically.",
    drawback:
      "It keeps writing laws until the holder themselves is punished no matter how carefully they act; immunity must be negotiated with the book itself.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the God of Combat",
    pathwayHint: 12,
    sourceRef: "LOTM wiki: Trunsoest Brass Book (0-02)",
  },
  {
    number: "0-05",
    name: "Magic Wishing Lamp",
    grade: 0,
    description:
      "A golden lamp etched with mysterious symbols. It grants the holder up to ten wishes.",
    drawback:
      "The wishes manifest in distorted, horrible ways with terrible consequences; only careful wording blunts the early ones.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Held by Bernadette Gustav",
    sourceRef: "LOTM wiki: Magic Wishing Lamp (0-05)",
  },
  {
    number: "0-08",
    name: "Quill of Alzuhod",
    grade: 0,
    description:
      "A plain quill that needs no ink. What it writes comes to pass if it is possible and the participants do not notice the coincidences; the more its holder learns of it, the more it learns of them and everyone nearby.",
    drawback:
      "It is a living artifact that constantly tries to kill its user and lashes back whenever it is used.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Wielded by Ince Zangwill",
    location: "Loose in Tingen City, hunted by the Nighthawks",
    pathwayHint: 2,
    sourceRef: "LOTM wiki: Quill of Alzuhod (0-08)",
  },
  {
    number: "0-13",
    name: "The Last Banquet",
    grade: 0,
    description:
      "A Grade 0 artifact of the Ancient Sun God's legacy, its power resembling that of a Sequence 2 Miracle Invoker.",
    drawback:
      "Its miracles are borrowed from a dead god and exact a price the borrower seldom sees in full.",
    powerEquivalence: "≈ a Sequence 2 Miracle Invoker",
    holder: "Church of the Eternal Blazing Sun",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: The Last Banquet (0-13)",
  },
  {
    number: "0-15",
    name: "The Fourth Sun",
    grade: 0,
    description:
      "A Grade 0 Sun-pathway artifact held among the Eternal Blazing Sun's deepest relics.",
    drawback:
      "A sealed fragment of solar divinity; its light does not distinguish between what it warms and what it burns.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the Eternal Blazing Sun",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: The Fourth Sun (0-15)",
  },
  {
    number: "0-17",
    name: "Angel of Concealment",
    grade: 0,
    description:
      "Shaped as an expressionless, black-eyed woman in a hooded robe. It erases people from existence, casting them into a foggy pocket-dimension from which they cannot be found, and can serve as a descent-vessel for the Evernight Goddess.",
    drawback:
      "It cannot be controlled; its range fluctuates at random, erasing bystanders by accident. It must itself be kept sealed by other artifacts.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 5,
    sourceRef: "LOTM wiki: Angel of Concealment (0-17)",
  },
  {
    number: "0-32",
    name: "Theater With Curtains That Never Draw",
    grade: 0,
    description:
      "A product of the Fourth Epoch whose effects resemble a Sequence 2 Miracle Invoker.",
    drawback:
      "The performance it stages does not end on command; what it sets in motion plays out to its own conclusion.",
    powerEquivalence: "≈ a Sequence 2 Miracle Invoker",
    holder: "Church of the Lord of Storms",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: Theater With Curtains That Never Draw (0-32)",
  },
  {
    number: "0-36",
    name: "Thorned Crown",
    grade: 0,
    description:
      "A crown of thorns whose power resembles a Sequence 2 Lightseeker; it was used in an apotheosis ritual by King George III of Loen.",
    drawback: "It demands a supply of blood to act, draining whoever wears it.",
    powerEquivalence: "≈ a Sequence 2 Lightseeker",
    holder: "The Augustus royal line",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: Thorned Crown (0-36)",
  },
  {
    number: "0-59",
    name: "The Divine Kingdom Without People",
    grade: 0,
    description:
      "A Grade 0 artifact of the God of Steam and Machinery's legacy that turns the living into the undead.",
    drawback:
      "It empties whatever it touches of life; its 'kingdom' is kept peopleless by design.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the God of Steam and Machinery",
    pathwayHint: 19,
    sourceRef: "LOTM wiki: The Divine Kingdom Without People (0-59)",
  },
  {
    number: "0-61",
    name: "Box of the Great Old Ones",
    grade: 0,
    description:
      "A three-layered antique jewellery box of the Fool's legacy. Its first layer turns a place into a toy and swaps it with an internal space; its second teleports between recorded locations; its third remains a mystery.",
    drawback:
      "Its holder is liable to vanish, die, or be passed to a new owner without warning.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the Fool (Abraham Family)",
    pathwayHint: 1,
    sourceRef: "LOTM wiki: Box of the Great Old Ones (0-61)",
  },
  {
    number: "0-62",
    name: "Staff of the Stars",
    grade: 0,
    description:
      "A black cane set with gems that lets its holder descend directly to any destination they can picture in perfect detail.",
    drawback:
      "Left unsealed without a holder, it warps the space around it into unpredictable anomalies.",
    powerEquivalence: "≈ an Angel (Sequence 1-2)",
    holder: "Church of the Fool",
    pathwayHint: 2,
    sourceRef: "LOTM wiki: Staff of the Stars (0-62)",
  },

  // ── Grade 1 — Saint-level. One or two per central cathedral. ──
  {
    number: "1-29",
    name: "The Memory Censor",
    grade: 1,
    description:
      "A Grade 1 Darkness-pathway artifact that erases selected memories from a target. It is one of the two artifacts used together to keep the Angel of Concealment (0-17) sealed.",
    drawback:
      "Its erasure is uncontrollable enough to leave both target and user amnesiac.",
    powerEquivalence: "≈ a Saint (Sequence 3-4)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 5,
    sourceRef: "LOTM wiki: Sealed Artifact 1-29",
  },
  {
    number: "1-42",
    name: "Berserker's Armor",
    grade: 1,
    description:
      "Also called the Bloodthirster's Armor: a silver full-body suit stained dark red, granting great strength, defence, and tracking — the powers of a Sequence 3 Silver Knight of the Twilight Giant path.",
    drawback:
      "It cannot be worn for long without infecting the wearer with a creeping 'icy silver'.",
    powerEquivalence: "≈ a Sequence 3 Silver Knight (Twilight Giant)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 11,
    sourceRef: "LOTM wiki: Berserker's Armor (1-42)",
  },
  {
    number: "1-63",
    name: "The Mirror of Worlds",
    grade: 1,
    description:
      "An ancient silver-coated mirror; whatever it reflects becomes a mirror-world accessible only to Beyonders.",
    drawback:
      "The reflected world is a sealed trap as much as a passage, and what enters does not always return.",
    powerEquivalence: "≈ a Saint (Sequence 3-4)",
    holder: "Church of the Evernight Goddess",
    sourceRef: "LOTM wiki: Sealed Artifact 1-63",
  },
  {
    number: "1-80",
    name: "The Dream Threshold",
    grade: 1,
    description:
      "A Grade 1 artifact that shifts a target — body or mind — into a dream between reality and illusion. The second of the pair that keeps the Angel of Concealment (0-17) sealed.",
    drawback:
      "The boundary it opens between waking and dream does not reliably close on the user's terms.",
    powerEquivalence: "≈ a Saint (Sequence 3-4)",
    holder: "Church of the Evernight Goddess",
    sourceRef: "LOTM wiki: Sealed Artifact 1-80",
  },
  {
    number: "1-82",
    name: "Ullamos Statue",
    grade: 1,
    description:
      "A milky-white stone statue of a half-naked woman, half a person's height, that draws nearby creatures into obsession with it and spreads both common and mystical illness.",
    drawback:
      "It twists its surroundings into a nightmare landscape of beings wailing and dying in horrifying ways.",
    powerEquivalence: "≈ a Saint (Sequence 3-4)",
    holder: "Church of the Eternal Blazing Sun",
    sourceRef: "LOTM wiki: Ullamos Statue (1-82)",
  },
  {
    number: "2-111",
    name: "Arrodes",
    grade: 1,
    description:
      "A silver 'magic mirror' a hand's-span tall, patterned with eyes; a powerful diviner that answers questions about the world, the gods, and the spirit realm and can extend its power into other mirrors and into lightning. Graded 1 despite its old '2-' code.",
    drawback:
      "After each answer it forces an embarrassing counter-question that must be answered truthfully before a witness, punishing refusal with lightning; it rejects unsolved problems and paradoxes.",
    powerEquivalence: "≈ a Saint (Sequence 3-4)",
    holder: "Carried by the Fool, Klein Moretti",
    sourceRef: "LOTM wiki: Arrodes (2-111)",
  },

  // ── Grade 2 — Mid-Sequence. A few per cathedral. ──
  {
    number: "2-030",
    name: "Inexhaustible Poison",
    grade: 2,
    description:
      "A silver cup of crystal-clear liquid that tempts those near it to drink; the poison is strong enough to kill a Sequence 5 Beyonder.",
    drawback: "Its lure and lethality fall on everyone in range, the wielder included.",
    powerEquivalence: "≈ enough to kill a Sequence 5 Beyonder",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 8,
    sourceRef: "LOTM wiki: Inexhaustible Poison (2-030)",
  },
  {
    number: "2-037",
    name: "Dream of Eternity",
    grade: 2,
    description:
      "A dark, heart-shaped object that draws several people at once into a shared dream.",
    drawback: "Pushed to its full range it inflicts severe mental trauma on the user.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Church of the Lord of Storms",
    sourceRef: "LOTM wiki: Dream of Eternity (2-037)",
  },
  {
    number: "2-049",
    name: "Antigonus Family Puppet",
    grade: 2,
    description:
      "A jointed puppet wrapped in oil-stained brown cloth, its clown's face painted red and yellow in a fixed grin. It slows everyone nearby, in body and in mind, with effects resembling a Sequence 5 of the Fool pathway.",
    drawback:
      "The slowing falls on everybody in range with no exemption — the wielder included.",
    powerEquivalence: "≈ a Sequence 5 Fool",
    holder: "Sealed by the Church of the Evernight Goddess",
    location: "Surfaced in Tingen City",
    pathwayHint: 1,
    sourceRef: "LOTM wiki: Antigonus Family Puppet (2-049)",
  },
  {
    number: "2-078",
    name: "Door of Death",
    grade: 2,
    description:
      "An ordinary-looking wooden door that can disguise itself as any existing door; whoever walks through it dies.",
    drawback:
      "It constantly tries to escape and pass itself off as a normal door, and must be watched without pause.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Church of the Evernight Goddess",
    sourceRef: "LOTM wiki: Door of Death (2-078)",
  },
  {
    number: "2-081",
    name: "Ring of Mimicry",
    grade: 2,
    description:
      "A ring set with many tiny diamonds that lets the wearer imitate Beyonder abilities they have witnessed and identify abilities and items.",
    drawback:
      "It overworks the wearer's mind; prolonged use brings on cognitive decline.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Held by Isengard Stanton",
    pathwayHint: 10,
    sourceRef: "LOTM wiki: Sealed Artifact 2-081",
  },
  {
    number: "2-105",
    name: "Blood Vessel Thief",
    grade: 2,
    description:
      "A stiffened blood vessel that steals an ability from a target — even, with lower odds, a high-Sequence Beyonder — leaving it usable for about ten minutes while the victim needs days to recover.",
    drawback: "Each theft draws on and shortens the user's own lifespan.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 8,
    sourceRef: "LOTM wiki: Blood Vessel Thief (2-105)",
  },
  {
    number: "2-166",
    name: "The Tempering Vault",
    grade: 2,
    description:
      "A golden box marked with symbols that holds its internal temperature indefinitely and brings a fall of Sun Holy Water to the area around it.",
    drawback:
      "Long contact converts a person into a believer of the Eternal Blazing Sun, and objects left inside it begin to develop a will of their own.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Church of the Lord of Storms",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: Sealed Artifact 2-166",
  },
  {
    number: "2-217",
    name: "Tanago Scarecrow",
    grade: 2,
    description:
      "A scarecrow of brownish-green straw with real human skin on its arms, chest, and thighs; it erases people within a thirty-metre radius.",
    drawback: "Its erasure makes no exception for the one who wields it.",
    powerEquivalence: "≈ a Mid-Sequence Beyonder (Sequence 5-7)",
    holder: "Church of the Eternal Blazing Sun",
    pathwayHint: 5,
    sourceRef: "LOTM wiki: Tanago Scarecrow (2-217)",
  },
  {
    number: "2-247",
    name: "Pride Armor",
    grade: 2,
    description:
      "A silver-white full-body armor that grants its wearer the powers of a Sequence 7 Dawn Paladin.",
    drawback:
      "It fills the wearer with disdain for any who hide or stay out of sight and drives them to strike down the weak humans around them.",
    powerEquivalence: "≈ a Sequence 7 Dawn Paladin",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: Pride Armor (2-247)",
  },

  // ── Grade 3 — Low-Sequence. The most numerous, Nighthawk-usable. ──
  {
    number: "3-0217",
    name: "Spirit Medium's Mirror",
    grade: 3,
    description:
      "A mirror backed in mercury with three small front cracks; whoever looks into it is drawn toward danger.",
    drawback:
      "The danger it conjures falls on the one looking as readily as on anyone else.",
    powerEquivalence: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 2,
    sourceRef: "LOTM wiki: Spirit Medium's Mirror (3-0217)",
  },
  {
    number: "3-0611",
    name: "Peaceful Hair Strands",
    grade: 3,
    description:
      "An ornament of many black hair strands; any living thing it touches becomes serene and loses all drive.",
    drawback: "The pacifying calm makes no exception for the wielder.",
    powerEquivalence: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
    holder: "Church of the Evernight Goddess",
    sourceRef: "LOTM wiki: Sealed Artifact 3-0611",
  },
  {
    number: "3-0625",
    name: "Misfortune Cloth Puppet",
    grade: 3,
    description:
      "A cloth puppet in a regal gown that brings misfortune to those who linger near it.",
    drawback: "The ill luck it gathers settles on the wielder too.",
    powerEquivalence: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
    holder: "Church of the Evernight Goddess",
    pathwayHint: 20,
    sourceRef: "LOTM wiki: Sealed Artifact 3-0625",
  },
  {
    number: "3-0782",
    name: "Mutated Sun Sacred Emblem",
    grade: 3,
    description:
      "A badge of dark-gold lustre engraved with the signs of the Sun, stained with a drop of the Eternal Blazing Sun's divine blood. It purifies sentient beings within a fifteen-metre radius and is potent against evil spirits.",
    drawback:
      "Used too long, it purifies the wielder's own mind into a Sun-worshipping idiot.",
    powerEquivalence: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
    holder: "Church of the Evernight Goddess",
    location: "Originally of the Intis Republic",
    pathwayHint: 3,
    sourceRef: "LOTM wiki: Mutated Sun Sacred Emblem (3-0782)",
  },
  {
    number: "3-1328",
    name: "Eye of Crystal",
    grade: 3,
    description:
      "A monocle that lets the wearer see spiritual bodies directly — ghosts, shadows, and the like.",
    drawback:
      "It draws wraiths and shadow-things toward the wearer, and long use damages the eye for good.",
    powerEquivalence: "≈ a Low-Sequence Beyonder (Sequence 8-9)",
    holder: "Church of the God of Steam and Machinery",
    sourceRef: "LOTM wiki: Sealed Artifact 3-1328",
  },
];

const BY_NUMBER: Map<string, SealedArtifact> = new Map(
  SEALED_ARTIFACTS.map((a) => [a.number, a]),
);

/** Look up a catalogue entry by its code (e.g. "0-08"). */
export function getSealedArtifact(number: string): SealedArtifact | undefined {
  return BY_NUMBER.get(number);
}

/** All artifacts of a given danger grade. */
export function sealedArtifactsForGrade(grade: ArtifactGrade): SealedArtifact[] {
  return SEALED_ARTIFACTS.filter((a) => a.grade === grade);
}

/** Artifacts that canon ties to a given pathway id (1-22). */
export function sealedArtifactsForPathway(pathwayId: number): SealedArtifact[] {
  return SEALED_ARTIFACTS.filter((a) => a.pathwayHint === pathwayId);
}

/**
 * Mint the lightweight inventory `Item` a character carries from a catalogue
 * entry. The display name embeds the code so the carried item is self-describing
 * (and so `gradeForArtifactItem` can recover the grade), and the description
 * carries the grade + drawback into the character sheet and the narrator prompt.
 */
export function mintArtifactItem(artifact: SealedArtifact): Item {
  return {
    name: `Sealed Artifact ${artifact.number} — ${artifact.name}`,
    description: `${artifact.description} (Grade ${artifact.grade}, ${artifact.powerEquivalence}. Drawback: ${artifact.drawback})`,
    category: "sealed-artifact",
  };
}

// The `mintArtifactItem` name format, used to recover the code from a carried item.
const ARTIFACT_ITEM_NAME_RE = /^Sealed Artifact (\S+) —/;

/** Recover an artifact code from a minted item name, or `undefined`. */
export function sealedArtifactNumberFromItemName(name: string): string | undefined {
  const match = ARTIFACT_ITEM_NAME_RE.exec(name);
  return match ? match[1] : undefined;
}

/**
 * The danger grade of a carried sealed-artifact `Item`, via its code, or
 * `undefined` for a non-artifact item or one not in the catalogue. The single
 * grade resolver the combat backlash uses, so the catalogue stays the one
 * source of truth for "how dangerous is this thing to use?".
 */
export function gradeForArtifactItem(item: Item): ArtifactGrade | undefined {
  if (item.category !== "sealed-artifact") return undefined;
  const number = sealedArtifactNumberFromItemName(item.name);
  if (number === undefined) return undefined;
  return getSealedArtifact(number)?.grade;
}
