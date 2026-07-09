import type { LoreEntry } from "./types";

export const WHEEL_OF_FORTUNE_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "wheel-of-fortune-pathway-overview",
    title: "Wheel of Fortune Pathway — Overview",
    category: "pathway",
    content: `The Wheel of Fortune pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Key of Light group of pathways. Its Beyonders walk the road of fortune, luck, calamity, and the turning of fate. From the lowest rung its sequences progress Monster (Sequence 9), Robot (8), Lucky One (7), Calamity Priest (6), and Winner (Sequence 5); its Saint and demigod rungs continue Misfortune Mage (Sequence 4), Chaoswalker (3), Soothsayer (2), and Snake of Mercury (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Wheel of Fortune (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "wheel of fortune",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["wheel-of-fortune-pathway", "wheel-of-fortune-group", "overview"],
    tokenCount: 214,
  },
  {
    slug: "wheel-of-fortune-seq4-misfortune-mage",
    title: "Wheel of Fortune Pathway — Sequence 4: Misfortune Mage",
    category: "pathway",
    content: `The Misfortune Mage is the Saint threshold of the Wheel of Fortune pathway, where luck becomes a scalpel that cuts both ways. A Misfortune Mage can weave the Pall of Misfortune over a target or area, causing accidents, failures, and unlikely disasters to cluster around those caught within it. They can redirect Fortune, stealing luck from enemies to bolster allies — or themselves — for a critical moment. Their Fate Loop traps a small event in a repeating cycle, forcing a target to relive a single mishap until the mage releases the working or the victim breaks free. The mage also gains the Ouroboros Sense, feeling the turning of fate strongly enough to know when a moment is propitious or disastrous. The potion requires two main ingredients — a scale from the Snake of Mercury and the blood of a Chaoswalker — and three supplementary ingredients: a coin that has ruined its owner, a mirror cracked by a Winner's celebration, and ash from a prophecy that came true against the prophet's will. The advancement ritual demands surviving a day in which every action the mage takes is deliberately unlucky, yet still achieving a chosen goal without directly forcing the outcome. The acting method requires the Misfortune Mage to accept that they are a gear in fate's wheel, never to curse out of petty spite, and to remember that every fortune given is borrowed from somewhere. At Sequence 4 the Wheel of Fortune pathway practitioner becomes a weaver of probability, and the Life School of Thought notes their rise with interest.`,
    pathway: "wheel of fortune",
    epoch: 5,
    npcs: ["Will Auceptin"],
    sequences: [4],
    tags: [
      "wheel-of-fortune-pathway",
      "misfortune-mage",
      "saint-threshold",
      "luck",
      "fate",
    ],
    tokenCount: 295,
    narratorOnly: true,
  },
];
