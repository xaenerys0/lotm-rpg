import type { LoreEntry } from "./types";

export const CHAINED_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "chained-pathway-overview",
    title: "Chained Pathway — Overview",
    category: "pathway",
    content: `The Chained pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of imprisonment, lunacy, monstrous transformation, and the restless dead. From the lowest rung its sequences progress Prisoner (Sequence 9), Lunatic (8), Werewolf (7), Zombie (6), and Wraith (Sequence 5); its Saint and demigod rungs continue Puppet (Sequence 4), Disciple of Silence (3), Ancient Bane (2), and Abomination (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Chained (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "chained",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["chained-pathway", "abyss-group", "overview"],
    tokenCount: 212,
  },
  {
    slug: "chained-seq4-puppet",
    title: "Chained Pathway — Sequence 4: Puppet",
    category: "pathway",
    content: `The Puppet is the Saint threshold of the Chained pathway, where the practitioner's body becomes a cursed vessel that can be worn, discarded, and reanimated by the will that binds it. A Puppet can survive the destruction of their original body by transferring their consciousness into a prepared replacement — a corpse, a doll, or even a willing victim — though each transfer deepens their monstrous nature. They command Puppet Strings, thin spiritual threads that control the bodies of others from a distance, and can weave the Curse of Binding, sealing a target's movement, voice, or power until the curse is broken. Their flesh gains the Resilient Marionette quality, allowing them to ignore pain and continue fighting despite grievous wounds. The potion requires two main ingredients — the heart of an Ancient Bane and a Disciple of Silence's severed tongue — and three supplementary ingredients: wax from a candle that burned during an exorcism, a nail pulled from a Wraith's coffin, and blood from a Werewolf who accepted the moon's curse willingly. The advancement ritual demands allowing one's own body to be destroyed and walking away in a borrowed form, proving that the self is no longer chained to a single shape. The acting method requires the Puppet to treat the body as a tool rather than an identity, to bind only those who threaten freedom, and to remember that the Mother Goddess of Depravity waits at the end of every chain. At Sequence 4 the Chained pathway practitioner becomes a thing that wears people, and the Rose School of Thought watches such Saints with hungry caution.`,
    pathway: "chained",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["chained-pathway", "puppet", "saint-threshold", "body-transfer", "binding"],
    tokenCount: 295,
    narratorOnly: true,
  },
];
