import type { LoreEntry } from "./types";

export const ABYSS_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "abyss-pathway-overview",
    title: "Abyss Pathway — Overview",
    category: "pathway",
    content: `The Abyss pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of crime, slaughter, devilry, and the apostasy of desire. From the lowest rung its sequences progress Criminal (Sequence 9), Unwinged Angel (8), Serial Killer (7), Devil (6), and Desire Apostle (Sequence 5); its Saint and demigod rungs continue Demon (Sequence 4), Blatherer (3), Bloody Archduke (2), and Filthy Monarch (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Abyss (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "abyss",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["abyss-pathway", "abyss-group", "overview"],
    tokenCount: 212,
  },
  {
    slug: "abyss-seq4-demon",
    title: "Abyss Pathway — Sequence 4: Demon",
    category: "pathway",
    content: `The Demon is the Saint threshold of the Abyss pathway, where human restraint frays into fiendish appetite and power. A Demon can manifest the Demonic Form, a partial transformation that grants horns, wings, or claws of shadowed flame and greatly enhances strength, speed, and resilience. They wield the Whip of Desire, a lash that stirs corruption in those it strikes — amplifying greed, rage, or lust until the victim acts on impulse. Their Aura of Depravity erodes the morality of weaker beings within a wide radius, making sins feel reasonable and virtue feel hollow. Demons also gain Hellfire, a flame that feeds on spiritual corruption and burns all the hotter in the presence of the guilty. The potion requires two main ingredients — the heart of a Bloody Archduke and a seed of the Mother Tree of Desire — and three supplementary ingredients: blood from a Desire Apostle who died unsated, a nail from a sinner's coffin, and ash from a temple burned by its own worshippers. The advancement ritual demands committing an act of profound depravity and then resisting the temptation to repeat it for a full lunar cycle, proving control over the demon within. The acting method requires the Demon to feed their desires without being consumed, to offer temptation as an art, and to remember that every Abyss Saint is one misstep from becoming the Mother Tree of Desire's fruit. At Sequence 4 the Abyss pathway practitioner becomes a living sin made flesh, and the Church of the Mother Tree of Desire either elevates or devours them.`,
    pathway: "abyss",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["abyss-pathway", "demon", "saint-threshold", "desire", "hellfire"],
    tokenCount: 295,
    narratorOnly: true,
  },
];
