import type { LoreEntry } from "./types";

export const PARAGON_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "paragon-pathway-overview",
    title: "Paragon Pathway — Overview",
    category: "pathway",
    content: `The Paragon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of scholarship, archaeology, appraisal, craft, and the heavens. From the lowest rung its sequences progress Savant (Sequence 9), Archaeologist (8), Appraiser (7), Artisan (6), and Astronomer (Sequence 5); its Saint and demigod rungs continue Alchemist (Sequence 4), Arcane Scholar (3), Knowledge Magister (2), and Illuminator (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Paragon (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "paragon",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["paragon-pathway", "knowledge-group", "overview"],
    tokenCount: 213,
  },
  {
    slug: "paragon-seq4-alchemist",
    title: "Paragon Pathway — Sequence 4: Alchemist",
    category: "pathway",
    content: `The Alchemist is the Saint threshold of the Paragon pathway, where craft, scholarship, and machinery converge into the perfection of matter and device. An Alchemist can transmute base metals into precious materials, refine imperfect Beyonder ingredients to reduce their corruption, and forge Enchanted Constructs — clockwork or mechanical servants animated by spiritual science. They gain the Engineer's Intuition, instantly understanding the function and weakness of any machine or artifact they study, and can perform the Grand Synthesis, combining two lesser substances into a single more potent whole. Their own body may incorporate limited mechanical augmentations that enhance durability and precision. The potion requires two main ingredients — the crystallized core of an Arcane Scholar and a flawless gear forged without magic — and three supplementary ingredients: mercury distilled from a dozen broken clocks, the lens of an Astronomer who mapped an unknown star, and oil pressed from the fruit of the Tree of Knowledge. The advancement ritual demands creating an original artifact or elixir that functions without relying on the practitioner's own spiritual power, then proving it in practical use. The acting method requires the Alchemist to pursue perfection without demanding that the imperfect world keep pace, to share discoveries cautiously, and to remember that the God of Steam and Machinery's path is craft raised to divinity. At Sequence 4 the Paragon pathway practitioner becomes an architect of miracles in brass and glass, and the Church of the God of Steam and Machinery courts them with both patronage and surveillance.`,
    pathway: "paragon",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["paragon-pathway", "alchemist", "saint-threshold", "craft", "machinery"],
    tokenCount: 295,
    narratorOnly: true,
  },
];
