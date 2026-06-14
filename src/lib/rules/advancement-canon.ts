// AUTO-GENERATED — do not edit by hand.
//
// Source: corpus/wiki Module:Sequence/standard (the committed Fandom dump).
// Regenerate with: pnpm rag:advancement-canon
//
// Canon: an Advancement Ritual is required from Sequence 5 onward, so only
// levels 5-1 carry an entry. Each holds the in-world ritual text and the
// material list drawn from the same source sequence.

import type { Ritual } from "@/lib/types/rules";

/** Lowest sequence whose advancement is mandatory-ritual (canon). */
export const RITUAL_FROM_SEQUENCE = 5;

/** pathwayId -> sequence level (5-1) -> the canon Advancement Ritual. */
export const ADVANCEMENT_RITUALS: Record<number, Record<number, Ritual>> = {
  1: {
    5: {
      description: "Consume potion amidst the singing of mermaids.",
      requirements: [
        "Dust of Ancient Wraiths",
        "Core crystal of a Six-Winged Gargoyle",
        "spring water from Sonia Island's Golden Spring",
        "Drago Bark",
        "Remnant Spirituality of Ancient Wraiths",
        "pair of eyes from a six-winged gargoyle",
      ],
    },
    4: {
      description:
        "Relying on one’s strength and strategy, orchestrate a grand performance before many spectators to kill a Beyonder creature at the level of a demigod. Then, at the end of the performance, consume the potion.",
      requirements: [
        "Bizarro Bane's Main Eye",
        "True Soul Body of a Spirit World Plunderer",
        "Bizarro Bane's Blood",
        "Spirit World Plunderer's Dust",
        "Golden Grapevines",
        "Fingernail-Sized Self-made Rubber Mask",
      ],
    },
    3: {
      description:
        "Be separated from reality for at least three hundred years and consume the potion after one becomes history and doesn’t belong to the present era.",
      requirements: [
        "Hound of Fulgrim (also known as Sefirah Castle Keeper) pair of eyes",
        "Demonic Wolf of Fog's Transformed Heart",
        "Hound of Fulgrim's Blood",
        "White Frost Crystal of Demonic Wolf of Fog",
        "Real Ancient Historical Records",
      ],
    },
    2: {
      description:
        "Return a piece of history that has been left behind to the present era.",
      requirements: [
        "Heart of a Dark Demonic Wolf",
        "blood of Dark Demonic Wolf",
        "Worm of Time",
        "Worm of Star",
      ],
    },
    1: {
      description:
        "Build a town consisting only of marionettes, and design a trajectory of fate for every marionette. By letting them interact with each other, they would act as a sufficiently real-life painting and create a corresponding area in the spirit world. The larger the town, the more the marionettes involved, the more detailed the daily lives are, and the more realistic and extensiveness the different fates are, the better the ritual's effects would be.",
      requirements: [],
    },
  },
  2: {
    5: {
      description:
        "Seek out a harpy in the Spirit World and sign a contract with it. Then, holding one tail feather, consume the potion amidst intense feelings of either joy or anger. A harpy is needed because it can snap people awake from their dreams, so the entire ritual’s essence is to be immersed in a dream and be unwilling to wake up from it.",
      requirements: [
        "Dream Catcher's Heart",
        "Mind Illusion Crystal",
        "adult mind dragon’s complete brain",
        "Blood of an Adult Mind Dragon",
      ],
    },
    4: {
      description:
        "In the middle of a grand event with at least 10,000 people, resonate with their emotions, then take the potion.",
      requirements: [
        "complete brain of an Elderly Mind Dragon",
        "Crystalline heart of a Tree Mentor",
        "Elderly Mind Dragon blood",
        "Tree Mentor's golden leaf",
        "drop of tears",
      ],
    },
    3: {
      description:
        "Cause at least 100,000 people to have the same dream on the same night.",
      requirements: ["The crystalline heart of the Treant King"],
    },
    2: {
      description:
        "Delve into the subconscious of at least ten thousand humans, uncover their deepest fears, most primal desires, and the root of all their psychological issues, then leave a mark of oneself.",
      requirements: [],
    },
    1: {
      description:
        "Using real people as characters, write a medium- to long-length novel, and let the actual fates of those real people follow the story’s plot to its conclusion, leaving corresponding imprints in both the Spirit World and the River of Fate..",
      requirements: [],
    },
  },
  3: {
    5: {
      description:
        "In pure darkness, bury your entire body in ice that usually doesn't melt, before consuming the potion.",
      requirements: [
        "red comb of a King of Dawn Roosters",
        "Pure White Brilliant Rock",
        "rosemary",
        "Rock water",
        "King of Dawn Roosters' blood",
      ],
    },
    4: {
      description:
        "Extract the strongest emotions that one is most unwilling to abandon before consuming the potion. Inject these emotions back again during this process.",
      requirements: [
        "Sun Divine Bird's tail feathers",
        "Holy Brilliance Rock",
        "golden blood from Sequence 0: Sun",
        "Sun Divine Bird's blood",
        "Holy Brilliance Rock liquid",
        "mutated Fingered Citron juice",
        "Magma Heart powder",
      ],
    },
    3: {
      description:
        "Clearly define what your justice is and uphold it for three years without the slightest violation or doing anything in conflict with that justice.",
      requirements: [],
    },
    2: {
      description:
        "Find an item with at least an Angel-rank authority and a deep connection to the Sun in mysticism. Bind your most important memory—closely tied to your core justice—to this item, and place it before yourself. This serves as a beacon for the Beyonder who consumes the '''Lightseeker''' potion, helping them avoid losing direction or falling into chaos during the '''Light Pursuit''' or '''Sun-Chasing''' process, provides a mystical connection that would be the last to melt, clarity of consciousness, and determination to persist through the transformation process.",
      requirements: [],
    },
    1: {
      description:
        "Receive sincere and exclusive praise and worship from 1,000,000 humans, including oneself — The higher the status, the fewer believers are needed, but oneself must be included and one must not lose their sense of self in the process.",
      requirements: [],
    },
  },
  4: {
    5: {
      description:
        "Find a place where the aura of the Underworld leaks through, make contact, and survive.",
      requirements: [],
    },
    4: {
      description:
        'Locate an underground river tainted by death. Hold a genuine funeral by its banks, then bury yourself and the potion there for sixty days. If you fail to survive or retain sufficient sanity after sixty days, the ritual fails.. The "Supreme Yin" essence represents the moon’s purity, the water’s brilliance, the far north’s intent, winter’s zenith, and the duality of yin and yang. The flaws and root causes of this method’s issues… well, I don’t need to elaborate further, do I?',
      requirements: [],
    },
    3: {
      description:
        "Step through a self-summoned Underworld Gate, ingest the potion, and die within. '''Note 1:''' From then on, the '''Ferryman''' becomes part of the Underworld and death itself. '''Note 2:''' Before the Phoenix Ancestor established the Underworld and before the First Blasphemy Slate appeared, this ritual didn’t exist. '''Note 3:''' In the Western Continent, whether in the Haoli Realm, the Yellow Springs, or the Netherworld, each serves as a counterpart to the Underworld.",
      requirements: [],
    },
    2: {
      description:
        "Become the ruler of one layer of the Underworld or transform an entire nation into a land of the dead, then anchor the Underworld Gate within it. and '''Five Ghost Emperors''' (五方鬼帝, ''Wǔ fāng guǐ dì'') share similar duties. '''Note 3:''' The Western Continent's Netherworld also holds authority over reincarnation.",
      requirements: [],
    },
    1: {
      description:
        "Ensure your name becomes synonymous with death and the afterlife, remembered and recited by most sentient beings in your domain. and the Buddhist '''Ksitigarbha''' possess comparable authority and status there. '''Note 5:''' Since the God of Death is still widely regarded as the embodiment of death in the Northern and Southern Continents, \"His\" descendants can borrow \"His\" name to shape themselves and complete the ritual. The drawback? They grow increasingly similar to the God of Death—until they become \"Him\".",
      requirements: [],
    },
  },
  5: {
    5: {
      description:
        "Enter the Spirit World with your physical body instead of your soul. Find and merge with the key information reflecting your true self within the Spirit World. Consume the potion.",
      requirements: [],
    },
    4: {
      description:
        "Collect bloodline traits of True Deities' descendants and use them to draw a soul-soothing magic circle. Note 1: Different Deity bloodlines will grant distinct Nightwatcher abilities. Note 2: Pathway-switchers must use bloodlines from one of the 3 corresponding Deities of the Eternal Darkness group.",
      requirements: [],
    },
    3: {
      description:
        "Face a situation that genuinely brings death, confronting the deepest biological fears. Survival isn't mandatory—what matters is overcoming or accepting the fear. Failure results in true death even after potion consumption.",
      requirements: [],
    },
    2: {
      description:
        "Sever all social ties and external influences. Avoid influencing others or being influenced by others. Live isolated in darkness and silence for 3 years without going mad. Note 1: {{Seq|Worm of Time|Worms of Time}} can normally use a Bug whenever there are time limits, however, the passage of time cannot be directly accelerated to reduce the real time required because this invalidates the second point of the ritual. Note 2: Ritual assistance would need to come from the Fool Pathway or the Wheel of Fortune Pathway.",
      requirements: [],
    },
    1: {
      description:
        'Bring Misfortune to either: An Archangel A civilization A continent A planet Note: In short, it is equivalent to "Your misfortune is me."',
      requirements: [],
    },
  },
  6: {
    5: {
      description: "Take the potion in the belly of an Obninsk.",
      requirements: [],
    },
    4: {
      description:
        "Cause an earthquake and tsunami, drink the potion amidst this environment until the ascension is over.",
      requirements: [],
    },
    3: {
      description:
        "Select a sea region, build with your own power a stone tower on the seafloor reaching the surface, then subdue all powerful creatures within a 300-nautical-mile radius.",
      requirements: [],
    },
    2: {
      description:
        "With only your own strength, trigger a natural disaster affecting at least one million people. At the peak of their fear and despair, reveal yourself and halt the disaster—this stage must also rely solely on your own power.",
      requirements: [],
    },
    1: {
      description:
        "Find and harness lightning to disrupt at least three Sequence 2 Angels’ advancement rituals to Sequence 1 (optimal if the angels belong to the {{Pathway|Hanged Man}},{{Pathway|White Tower}}, {{Pathway|Visionary}}, {{Pathway|Sun}}, or {{Pathway|Tyrant}} Pathways). Interrupting a ritual to Sequence 0 will count as completing it in one go.",
      requirements: [],
    },
  },
  7: {
    5: {
      description:
        "Set up special coordinates in four completely different spots deep in the Spirit World which are all set up extremely far away from each other.",
      requirements: [],
    },
    4: {
      description:
        "Seal a creature of demigod level, the creature must be hostile toward you, lesser outside help used, better will the ritual's result.<ref name=\\",
      requirements: [],
    },
    3: {
      description:
        "Find three piece of Astral World information projected into the Spirit World, enter the dangerous scenarios derived from them, and record everything down in full detail and do not forget them.",
      requirements: [],
    },
    2: {
      description:
        "Leave legends about yourself at 9 different locations outside of this planet.",
      requirements: ["Worm of Star", "Worm of Time", "Worm of Spirit"],
    },
    1: {
      description:
        "Find a continuously rotating, signal-emitting heavy star, approach it, land on it, and then find a way to establish sufficient mystical connections with it.",
      requirements: [],
    },
  },
  8: {
    5: {
      description:
        "Become a key antagonist or supporting figure in the unconscious dreams of at least 30 people. It doesn't matter how long these dreams last, what matters is that they are happening when the potion is consumed.<ref name=\\",
      requirements: [],
    },
    4: {
      description:
        "Convince nine targets to willingly offer all they possess to sustain you.<ref name=\\",
      requirements: [],
    },
    3: {
      description:
        "Without violence, find and exploit loopholes in rules to temporarily collapse order in a region. The area must be no smaller than a village, the smallest entity that can form a projection in the Spirit World.",
      requirements: [],
    },
    2: {
      description:
        "Assume another’s identity through disguise, deception, and other methods that don't involve Beyonder powers, then earn their social circle’s trust until the identity dies naturally. Exceptions: Replacing someone on the verge of death, or someone who will die within three years Higher‑tier targets shorten the ritual duration (With a minimum of six months; does not need to be maintained until the identity dies naturally).",
      requirements: [],
    },
    1: {
      description:
        "Plunge a city into temporal chaos for at least seven days.<ref name=\\",
      requirements: [],
    },
  },
  9: {
    5: {
      description:
        "Extract one’s soul from the body. Influence the soulless body to consume the potion. Reintegrate the soul to complete the ascension.",
      requirements: [],
    },
    4: {
      description:
        "Induce the complete degeneration of over 10,000 individuals without using violence. The higher the sequence of the degenerate individuals, the better the ritual effect. The more concentrated the transformation from normalcy to degeneracy in time, the more effective the ritual becomes.",
      requirements: [],
    },
    3: {
      description:
        "Use various methods to induce a controlled personality split without losing control. '''Note''': If the personality split already exists from previous Sequences, ascending will result in immediate loss of control.",
      requirements: [],
    },
    2: {
      description:
        'Separate, defeat, and fully control one’s own shadow. Enter the Shadow World, confront dangers, and establish a personal "domain" within it. The Shadow World is an alternate dimension intersecting with the Mirror World.',
      requirements: [],
    },
    1: {
      description:
        "Fly toward the mystically conceptualized Sun. Endure for 15 minutes to merge with the shadow of light.",
      requirements: [],
    },
  },
  11: {
    3: {
      description:
        "Arrange a complex altar and place the remains of six powerful creatures that were hunted by oneself in the correct order and receive the blessing of a God (Angel-level minimum).",
      requirements: [],
    },
  },
  14: {
    5: {
      description:
        "Plan and execute a successful capture of a target with a Sequence higher than your own. Flaunt the completed conspiracy before them, and consume the potion as they witness your victory, filled with fear and despair. '''Note:''' The increased number and higher Sequence of the captured targets and the greater their fear, regret, and anger, the more potent the ritual's effect.",
      requirements: [
        "Gray Demonic Wolf's front claws",
        "Forest Hunter's tongue",
        "Gray Demonic Wolf's blood",
        "fangs of the Forest Hunter",
        "Colorful Bearded Horned Lizard venom",
        "Hornbeam Essential Oils",
      ],
    },
    4: {
      description:
        "Form a team of at least thirty people, cultivate a deep friendship with them, make them strong one after another. The higher the strength and tacit understanding of the team, the better the effect of the ritual.",
      requirements: [
        "Magma Giant's core",
        "Stone of Catastrophe",
        "boiling magma",
        "Stone of Catastrophe",
        "acorn",
      ],
    },
    3: {
      description:
        "Lead your own team to defeat a powerful enemy force in a war. Note 1: The imminent atmosphere of war will attract comets symbolizing war through the spirit world. They will streak across the night sky bringing revelations, but among such comets, those with corporeal substance that can enter the real world are limited in number. Note 2: In the advancement ritual, the stronger the enemy force, the better the ritual's effect.",
      requirements: [
        "Heart of a Bipolar Centaur",
        "Core of a War Comet",
        "Bipolar Centaur Blood",
        "War Comet Fragments",
        "Blood Tudor Iris",
        "Flame Giant Tree bark",
      ],
    },
    2: {
      description:
        "Forcefully change the weather of a region without external aid in a very short time.",
      requirements: [
        "Skull of a Weather Giant",
        "Core of a Mist Jellyfish",
        "Mist Jellyfish Crystals",
      ],
    },
    1: {
      description:
        "Conquer a nation with a population of more than 30 million inhabitants, making all beings there fear, obey, and revere you.",
      requirements: [],
    },
  },
  15: {
    5: {
      description:
        "Without substitutes, be burned at the stake for fifteen minutes and survive without going mad.",
      requirements: [
        "head of a Flower-Faced Bat",
        "gallbladder of a Two-Tailed Black Snake",
        "Flower-Faced Bat blood",
        "seriously ill human’s blood",
        "tail tip of the Two-Tailed Black Snake",
        "Enfinitas Eucalyptus essential oil",
      ],
    },
    4: {
      description:
        "Involve over thirty thousand people in a severe plague. The more who die, the stronger the despair and suffering, the better the ritual effect.",
      requirements: [
        "Plague Mother Serpent's Venom Sac",
        "Silver Hunter's Crystal",
        "Plague Mother Serpent's Bile",
        "Fragments of the Silver Hunter",
        "fresh branch of mistletoe",
        "blood from seven victims",
      ],
    },
    3: {
      description:
        "Find your mirror self, enslave them solely with your own power, or make them truly infatuated with you, or reconcile with them.",
      requirements: [
        "Heart of a Mirror God",
        "Gorgon eyes",
        "Mirror God fragments",
        "Gorgon blood",
        "antique mirror over 500 years old",
      ],
    },
    2: {
      description:
        "As a participant, cause a disaster affecting the entire continent, and advance during the disaster.",
      requirements: [],
    },
    1: {
      description:
        "Any one of the three rituals is effective: Advance at the universally acknowledged end of an epoch or the beginning of the next. Advance during the signs and process of the apocalyspe's arrival. Advance when one's own involvement leads to the fall of a deity.",
      requirements: [],
    },
  },
  16: {
    5: {
      description:
        "Being aware of the behavior and physical structure of various ordinary animals and three kinds of extraordinary creatures. It may involve writing down this knowledge.",
      requirements: [],
    },
    4: {
      description: "Personally refine the Stone of Life.",
      requirements: [],
    },
  },
  17: {
    5: {
      description:
        "Gather different gems, metals and Beyonder Creature blood that represented different moon phases. Drink the potion under the illumination of full moon.",
      requirements: [],
    },
    4: {
      description:
        'Truly gain the recognition of the "Moon". Note: Some "Moons" are always dangerous, some "Moons" are dangerous at certain moments, and some "Moons" are in your own heart.',
      requirements: [],
    },
    3: {
      description:
        'Find a special piece of information in the depths of the Spirit World that is closely related to one\'s past, present, and future, which is deeply intertwined with the "Moon". Then hold a ceremony to define it as one\'s "True Name" for various mystical purposes. Note: if you choose the wrong one, or find an incorrect one, you will become a slave of the "Moon".',
      requirements: [],
    },
    2: {
      description:
        "Dividing oneself into five parts, destroy and seal themselves in different places, then before completely dying, have the part of the body containing the heart take the potion. Note: There are two main difficulties in this ritual. One is how to ensure that one does not die immediately in that state, and the other is how to take the potion in a sealed state.",
      requirements: [],
    },
    1: {
      description:
        'Use the "Moon Paper Substitute" to make a substitute, allowing it to act for a long time without being exposed, and be remembered by a large number of creatures, the more the better. The person themselves will lie in a coffin, buried deep underground for at least three hundred years, and finally the original body will take the potion. Note: The ritual is meant to resist Beauty and combat narcissism.',
      requirements: [],
    },
  },
  18: {
    4: {
      description:
        "Completely analyze a drop of blood from a Mythical Creature and obtain complicated and massive amounts of knowledge. Although the advancement ritual of a Mysticologist doesn’t have any requirements on the Mythical Creature’s pathway, the best choice is still the Wheel of Fortune Pathway.",
      requirements: [],
    },
    2: {
      description: 'Prevent a disaster that involves a higher level of power."',
      requirements: [],
    },
  },
  19: {
    4: {
      description:
        "The advancement ritual to Alchemist required drawing all life force from an area, turning soil barren and lakes dry.",
      requirements: [],
    },
  },
  20: {
    5: {
      description:
        "For a full month, remain in an unlucky state—absolutely no instances of good fortune.",
      requirements: [],
    },
    4: {
      description:
        "Without prior preparation, and without seeking a way to negate or alleviate the effects, directly face a major calamity while at the lowest ebb of your luck—and survive.",
      requirements: [],
    },
    3: {
      description:
        "Fix a node, or “beacon,” that your destiny must inevitably reach within the next ten years.",
      requirements: [],
    },
    2: {
      description:
        "Peer into the River of Fate, uncover an important revelation concerning at least one nation, and ensure that this revelation ultimately manifests exactly as you “saw” it.",
      requirements: [],
    },
    1: {
      description:
        "Find a way to extract all of your memories, then, after consuming the potion, infuse them back into yourself. Alternatively, with the aid of a '''{{Seq|Visionary}}''' during the ritual, regress to the state of a fetus, stripped of all memory, and awaken the full breadth of cognition buried deep within your soul and mind. '''Note 1:''' Specific term from the Western Continent: Unveiling the Enigma of the Womb.",
      requirements: [],
    },
  },
  21: {
    5: {
      description:
        "Every 3-9 days, kill a person and eat their organs. Do this 13-49 times. The more people killed, the more complete the ritual. Between two murders, there must be a minimum of three days. Otherwise, it would be easy to lose control. The interval must also not exceed nine days as that will cause the ritual to be reset.",
      requirements: [],
    },
  },
  22: {
    4: {
      description:
        '"Unknown, it requires an item of the same rank i.e. a high-level undead that can act as an anchor and base to bind and stabilize the various curses resulting from the disassembly process."',
      requirements: [],
    },
    2: {
      description:
        "Find an ancient, evil item capable of bearing angelic power. This item will become the core of the final Mythical Creature form. This will be an anchor and base, binding and stabilizing the various curses resulting from the disassembly process.",
      requirements: [],
    },
  },
};
