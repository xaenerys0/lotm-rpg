import type { LoreEntry } from "./types";

export const JUSTICIAR_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "justiciar-pathway-overview",
    title: "Justiciar Pathway — Overview",
    category: "pathway",
    content: `The Justiciar pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Trickster Apostle group of pathways. Its Beyonders walk the road of law, interrogation, judgment, and the enforcement of order. From the lowest rung its sequences progress Arbiter (Sequence 9), Sheriff (8), Interrogator (7), Judge (6), and Disciplinary Paladin (Sequence 5); its Saint and demigod rungs continue Imperative Mage (Sequence 4), Chaos Hunter (3), Balancer (2), and Hand of Order (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Justiciar (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "justiciar",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["justiciar-pathway", "order-group", "overview"],
    tokenCount: 214,
  },
  {
    slug: "justiciar-seq4-imperative-mage",
    title: "Justiciar Pathway — Sequence 4: Imperative Mage",
    category: "pathway",
    content: `The Imperative Mage is the Saint threshold of the Justiciar pathway, where law ceases to be spoken and begins to be enforced. An Imperative Mage can issue Absolute Commands that reality itself strains to obey — ordering doors to lock, flames to die, or enemies to kneel, provided the command falls within a formalized rule the mage has declared. They can establish a Court of Order, a bounded space in which their authority magnifies and violations of their declared laws trigger immediate supernatural backlash. The mage also gains Verdict Sight, perceiving lies, broken oaths, and active crimes within their domain as visible stains. The potion requires two main ingredients — the gavel-bone of a Chaos Hunter and a scale from the Hand of Order — and three supplementary ingredients: wax from a sealed contract, the tongue of a perjurer who died unrepentant, and iron filings from a guillotine blade. The advancement ritual requires presiding over a genuine trial between two Beyonders, rendering a binding verdict, and enforcing it without outside interference. The acting method demands that the Imperative Mage speak only commands they are willing to enforce, uphold their own laws before judging others, and never legislate cruelty into righteousness. At Sequence 4 the Justiciar pathway practitioner becomes a walking court, and those who serve order from the shadows decide whether to recruit or remove them.`,
    pathway: "justiciar",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["justiciar-pathway", "imperative-mage", "saint-threshold", "law", "authority"],
    tokenCount: 285,
    narratorOnly: true,
  },
];
