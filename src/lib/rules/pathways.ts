import type { Pathway, Sequence } from "@/lib/types/rules";

const foolSequences: Sequence[] = [
  {
    level: 9,
    name: "Seer",
    classification: "Low",
    abilities: [
      {
        name: "Spirit Vision",
        description:
          "Perceive the spirit world and see lingering spiritual traces",
        type: "active",
      },
      {
        name: "Divination",
        description:
          "Use mediums such as tarot cards or pendulums to divine limited information",
        type: "active",
      },
      {
        name: "Spiritual Intuition",
        description:
          "Sense danger and anomalies through subtle spiritual perception",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Avoid proactive divination without proper ritual preparation",
      "Speak and act with an air of mystery and reserve",
      "Observe more than you reveal",
    ],
    prerequisiteItems: [
      {
        name: "Seer Potion Formula",
        description: "The recipe for the Sequence 9 Seer potion",
        category: "potion-formula",
      },
      {
        name: "Dragon Blood Grass",
        description:
          "A crimson herb that grows near ancient dragon remains",
        category: "main-ingredient",
      },
      {
        name: "Night Vale Flower",
        description: "A pale flower that blooms only on full-moon nights",
        category: "supplementary-ingredient",
      },
      {
        name: "Stellar Aqua Crystal",
        description: "A translucent crystal that stores starlight",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Clown",
    classification: "Low",
    abilities: [
      {
        name: "Distraction",
        description:
          "Misdirect attention using performance and sleight of hand",
        type: "active",
      },
      {
        name: "Flame Manipulation",
        description: "Control small flames for performance and combat",
        type: "active",
      },
      {
        name: "Paper Figurine Substitution",
        description:
          "Substitute a paper figurine for yourself to escape danger",
        type: "active",
      },
      {
        name: "Enhanced Agility",
        description:
          "Supernatural nimbleness and acrobatic ability",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Perform in front of audiences regularly",
      "Make others laugh or feel joy through your antics",
      "Never reveal your true emotions openly",
    ],
    prerequisiteItems: [
      {
        name: "Clown Potion Formula",
        description: "The recipe for the Sequence 8 Clown potion",
        category: "potion-formula",
      },
      {
        name: "Manhal Fish Eyeball",
        description: "The eye of a Manhal Fish, imbued with spiritual energy",
        category: "main-ingredient",
      },
      {
        name: "Dream Honeydew",
        description: "Sweet secretion from a dream-realm bee colony",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Perform before an audience while channeling spiritual power",
      requirements: [
        "Gather an audience of at least ten people",
        "Perform a complete act from start to finish",
        "Channel spiritual energy during the climax of the performance",
      ],
    },
  },
  {
    level: 7,
    name: "Magician",
    classification: "Mid",
    abilities: [
      {
        name: "Damage Transfer",
        description:
          "Transfer damage from yourself to a connected object or person",
        type: "active",
      },
      {
        name: "Seal",
        description:
          "Create mystical seals to bind or contain supernatural entities",
        type: "active",
      },
      {
        name: "Item Affinity",
        description:
          "Sense and interact with enchanted or mystical items more effectively",
        type: "passive",
      },
      {
        name: "Conjuring",
        description: "Summon small objects from hidden spaces",
        type: "active",
      },
    ],
    actingRequirements: [
      "Practice magic tricks and illusions daily",
      "Always carry props and mystical tools",
      "Maintain an air of showmanship in all interactions",
    ],
    prerequisiteItems: [
      {
        name: "Magician Potion Formula",
        description: "The recipe for the Sequence 7 Magician potion",
        category: "potion-formula",
      },
      {
        name: "Thousand-faced Hunter Eye Crystal",
        description:
          "A crystallized eye from a Thousand-faced Hunter beast",
        category: "main-ingredient",
      },
      {
        name: "Rosemary Essential Oil",
        description:
          "Distilled oil from spiritually-charged rosemary plants",
        category: "supplementary-ingredient",
      },
      {
        name: "Ghost Shark Blood",
        description: "Blood drawn from a spectral shark entity",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Complete a binding ritual to absorb the Magician characteristic",
      requirements: [
        "Draw a ritual circle using spiritually-charged materials",
        "Recite the Magician invocation at midnight",
        "Successfully seal a minor supernatural entity during the ritual",
      ],
    },
  },
  {
    level: 6,
    name: "Faceless",
    classification: "Mid",
    abilities: [
      {
        name: "Shapeshifting",
        description:
          "Completely transform your appearance, voice, and physique to imitate another person",
        type: "active",
      },
      {
        name: "Identity Theft",
        description:
          "Temporarily absorb the surface memories and mannerisms of a touched target",
        type: "active",
      },
      {
        name: "Body Malleability",
        description:
          "Reshape your body to squeeze through gaps or resist blunt impacts",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Adopt a new identity for at least one full day each week",
      "Live convincingly as someone else without being discovered",
      "Never grow too attached to a single identity",
    ],
    prerequisiteItems: [
      {
        name: "Faceless Potion Formula",
        description: "The recipe for the Sequence 6 Faceless potion",
        category: "potion-formula",
      },
      {
        name: "Thousand-faced Hunter Mutant Pituitary Gland",
        description:
          "The shape-governing gland of a mutant Thousand-faced Hunter",
        category: "main-ingredient",
      },
      {
        name: "Hound of Fulgrim Saliva",
        description: "Saliva from a Hound of Fulgrim, a tracking beast",
        category: "supplementary-ingredient",
      },
      {
        name: "Three Petals of Spirit World Celandine",
        description: "Rare petals that exist partly in the spirit world",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Assume a false identity and maintain it through a crisis without breaking character",
      requirements: [
        "Prepare a complete false identity with documentation",
        "Live as the assumed identity for no less than three days",
        "Successfully navigate a threatening situation while in disguise",
      ],
    },
  },
  {
    level: 5,
    name: "Marionettist",
    classification: "Mid",
    abilities: [
      {
        name: "Marionette Control",
        description:
          "Take direct control of a living person's body, turning them into your puppet",
        type: "active",
      },
      {
        name: "Thread Manipulation",
        description:
          "Create invisible spiritual threads to manipulate objects and people at range",
        type: "active",
      },
      {
        name: "Grafting",
        description:
          "Graft abilities from defeated Beyonders onto yourself or your marionettes",
        type: "active",
      },
      {
        name: "Enhanced Spiritual Perception",
        description:
          "Greatly enhanced ability to detect and read spiritual fluctuations",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Control at least one marionette at all times",
      "Direct events from behind the scenes rather than acting openly",
      "Treat every interaction as a stage where you pull the strings",
    ],
    prerequisiteItems: [
      {
        name: "Marionettist Potion Formula",
        description: "The recipe for the Sequence 5 Marionettist potion",
        category: "potion-formula",
      },
      {
        name: "Beyonder Characteristic of a Faceless",
        description:
          "The crystallized Beyonder characteristic from a Seq 6 Faceless",
        category: "main-ingredient",
      },
      {
        name: "Mind Dragon Tendon",
        description: "A tendon from a Mind Dragon, attuned to mental control",
        category: "main-ingredient",
      },
      {
        name: "Psychic Puppet Core",
        description:
          "An ancient core used in the creation of autonomous puppets",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Successfully convert a living Beyonder into a marionette through spiritual domination",
      requirements: [
        "Overpower the will of a Beyonder target using spiritual threads",
        "Complete the marionette conversion ritual in an isolated location",
        "Maintain control of the new marionette for at least one hour",
      ],
    },
  },
];

const visionarySequences: Sequence[] = [
  {
    level: 9,
    name: "Spectator",
    classification: "Low",
    abilities: [
      {
        name: "Emotion Reading",
        description:
          "Read micro-expressions and body language to detect lies and emotions",
        type: "passive",
      },
      {
        name: "Psychological Analysis",
        description:
          "Quickly analyze a person's psychological state and motivations",
        type: "active",
      },
      {
        name: "Enhanced Perception",
        description:
          "Heightened awareness of subtle social and environmental cues",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Observe people and social dynamics without interfering",
      "Record your observations in a journal regularly",
      "Analyze motivations before taking action",
    ],
    prerequisiteItems: [
      {
        name: "Spectator Potion Formula",
        description: "The recipe for the Sequence 9 Spectator potion",
        category: "potion-formula",
      },
      {
        name: "Placenta of a Beyond-level Demon Cat",
        description:
          "The preserved placenta from a spiritually-attuned feline",
        category: "main-ingredient",
      },
      {
        name: "Tears of a Willow Sprite",
        description: "Collected tears from a minor nature spirit",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Telepathist",
    classification: "Low",
    abilities: [
      {
        name: "Telepathy",
        description:
          "Read surface thoughts and send mental messages to others",
        type: "active",
      },
      {
        name: "Mental Shield",
        description:
          "Construct a psychic barrier to protect against mental intrusion",
        type: "active",
      },
      {
        name: "Empathic Influence",
        description: "Subtly influence the emotions of a nearby target",
        type: "active",
      },
    ],
    actingRequirements: [
      "Practice telepathic communication daily",
      "Respect mental boundaries — never probe deeply without cause",
      "Meditate to strengthen your psychic fortitude",
    ],
    prerequisiteItems: [
      {
        name: "Telepathist Potion Formula",
        description: "The recipe for the Sequence 8 Telepathist potion",
        category: "potion-formula",
      },
      {
        name: "Mirror Hedgehog Spinal Fluid",
        description: "Spinal fluid from a Mirror Hedgehog, a psychic beast",
        category: "main-ingredient",
      },
      {
        name: "Piper Fruit",
        description: "A fruit that enhances psychic conductivity when consumed",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Establish a sustained telepathic link with another Beyonder",
      requirements: [
        "Find a willing Beyonder partner",
        "Maintain a two-way telepathic connection for one full hour",
        "Successfully transmit a complex memory through the link",
      ],
    },
  },
  {
    level: 7,
    name: "Psychiatrist",
    classification: "Mid",
    abilities: [
      {
        name: "Deep Mental Probe",
        description:
          "Dive into a subject's subconscious to uncover hidden memories",
        type: "active",
      },
      {
        name: "Psychological Healing",
        description:
          "Repair psychological trauma and mental afflictions through psychic therapy",
        type: "active",
      },
      {
        name: "Mental Suggestion",
        description:
          "Implant subtle suggestions that the target perceives as their own thoughts",
        type: "active",
      },
      {
        name: "Psychic Resilience",
        description: "Greatly enhanced resistance to mental corruption",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Help others resolve psychological issues on a regular basis",
      "Study the nature of the subconscious mind",
      "Maintain your own mental health through disciplined practice",
    ],
    prerequisiteItems: [
      {
        name: "Psychiatrist Potion Formula",
        description: "The recipe for the Sequence 7 Psychiatrist potion",
        category: "potion-formula",
      },
      {
        name: "Wraith Dust",
        description:
          "Powdered essence of a deceased wraith, attuned to the psyche",
        category: "main-ingredient",
      },
      {
        name: "Moonstone Shard",
        description: "A fragment of moonstone charged with lunar energy",
        category: "supplementary-ingredient",
      },
      {
        name: "Calming Lily Extract",
        description: "An extract that soothes spiritual turbulence",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Heal a patient with severe psychological damage caused by Beyonder influence",
      requirements: [
        "Identify a patient whose mind has been damaged by supernatural forces",
        "Perform psychic therapy over multiple sessions",
        "Fully restore the patient's mental stability",
      ],
    },
  },
  {
    level: 6,
    name: "Hypnotist",
    classification: "Mid",
    abilities: [
      {
        name: "Mass Hypnosis",
        description:
          "Place multiple targets into a hypnotic trance simultaneously",
        type: "active",
      },
      {
        name: "Memory Manipulation",
        description:
          "Alter, erase, or implant specific memories in a target's mind",
        type: "active",
      },
      {
        name: "Dream Invasion",
        description:
          "Enter a sleeping target's dreams and manipulate the dream environment",
        type: "active",
      },
      {
        name: "Psychic Dominance",
        description:
          "Passive aura that makes weaker-willed individuals more suggestible",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Practice hypnotic techniques on willing subjects weekly",
      "Study dreams and their connection to the subconscious",
      "Never lose control of your own psychic state",
    ],
    prerequisiteItems: [
      {
        name: "Hypnotist Potion Formula",
        description: "The recipe for the Sequence 6 Hypnotist potion",
        category: "potion-formula",
      },
      {
        name: "Eye of a Dreamweaver Spider",
        description:
          "The central eye of a spider that hunts within dreams",
        category: "main-ingredient",
      },
      {
        name: "Slumber Flower Pollen",
        description: "Pollen that induces deep sleep and vivid dreams",
        category: "supplementary-ingredient",
      },
      {
        name: "Liquid Silver Mercury",
        description: "Alchemically purified mercury that resonates with the psyche",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Enter and fully control the dream of a Beyonder-level target",
      requirements: [
        "Identify a Beyonder target of at least Sequence 8",
        "Enter their dream without being detected",
        "Reshape the dream environment three times without losing coherence",
      ],
    },
  },
  {
    level: 5,
    name: "Dreamwalker",
    classification: "Mid",
    abilities: [
      {
        name: "Dream World Access",
        description:
          "Open a gateway to the dream world and traverse it physically",
        type: "active",
      },
      {
        name: "Dream Materialization",
        description:
          "Pull objects and entities from the dream world into reality",
        type: "active",
      },
      {
        name: "Collective Dream",
        description:
          "Create a shared dream space that multiple people inhabit simultaneously",
        type: "active",
      },
      {
        name: "Subconscious Fortress",
        description:
          "Your mind is a fortified dream realm — nearly impervious to mental attack",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Spend time in the dream world regularly to maintain your connection",
      "Bridge the gap between dreams and reality for others",
      "Guard the boundary between the dream world and the waking world",
    ],
    prerequisiteItems: [
      {
        name: "Dreamwalker Potion Formula",
        description: "The recipe for the Sequence 5 Dreamwalker potion",
        category: "potion-formula",
      },
      {
        name: "Beyonder Characteristic of a Hypnotist",
        description:
          "The crystallized Beyonder characteristic from a Seq 6 Hypnotist",
        category: "main-ingredient",
      },
      {
        name: "Dream Realm Anchor Shard",
        description:
          "A fragment of crystallized dream energy that stabilizes passage",
        category: "main-ingredient",
      },
      {
        name: "Essence of Deep Sleep",
        description: "A distilled liquid from the deepest layer of dreams",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Open a stable gateway to the dream world and return safely with a materialized object",
      requirements: [
        "Brew the potion within the dream world itself",
        "Open a gateway between dream and reality that persists for one hour",
        "Bring a dream-materialized object into the waking world",
      ],
    },
  },
];

const sunSequences: Sequence[] = [
  {
    level: 9,
    name: "Bard",
    classification: "Low",
    abilities: [
      {
        name: "Holy Hymn",
        description:
          "Sing hymns that purify minor corruption and bolster morale",
        type: "active",
      },
      {
        name: "Minor Healing",
        description: "Channel warmth to mend small wounds and ease pain",
        type: "active",
      },
      {
        name: "Light Sensitivity",
        description: "Enhanced perception in well-lit environments",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sing or perform music daily to honor the light",
      "Spread warmth and hope to those in despair",
      "Rise with the sun and greet the dawn",
    ],
    prerequisiteItems: [
      {
        name: "Bard Potion Formula",
        description: "The recipe for the Sequence 9 Bard potion",
        category: "potion-formula",
      },
      {
        name: "Sunflower Essence",
        description: "Concentrated extract from spiritually-charged sunflowers",
        category: "main-ingredient",
      },
      {
        name: "Golden Honey",
        description: "Honey produced by bees that nest near sacred sites",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Light Suppliant",
    classification: "Low",
    abilities: [
      {
        name: "Light Beam",
        description: "Project a focused beam of purifying light",
        type: "active",
      },
      {
        name: "Healing Touch",
        description:
          "Heal moderate wounds and cure minor diseases through touch",
        type: "active",
      },
      {
        name: "Radiant Aura",
        description:
          "Emit a soft glow that repels weaker undead and evil spirits",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Pray at dawn and dusk without fail",
      "Aid the sick and wounded whenever possible",
      "Never shy away from darkness — carry light into it",
    ],
    prerequisiteItems: [
      {
        name: "Light Suppliant Potion Formula",
        description: "The recipe for the Sequence 8 Light Suppliant potion",
        category: "potion-formula",
      },
      {
        name: "Solar Amber Crystal",
        description: "A crystal formed from concentrated sunlight",
        category: "main-ingredient",
      },
      {
        name: "White Dew Grass Juice",
        description: "Juice from a grass that absorbs moonlight and starlight",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Conduct a healing ceremony under direct sunlight",
      requirements: [
        "Gather those in need of healing in an open, sunlit area",
        "Channel the power of sunlight through sustained prayer",
        "Heal at least three people during the ceremony",
      ],
    },
  },
  {
    level: 7,
    name: "Solar High Priest",
    classification: "Mid",
    abilities: [
      {
        name: "Blazing Radiance",
        description:
          "Release an intense burst of holy light that damages evil entities",
        type: "active",
      },
      {
        name: "Purification Ritual",
        description:
          "Cleanse an area of spiritual corruption through extended prayer",
        type: "active",
      },
      {
        name: "Endurance of the Sun",
        description: "Enhanced physical stamina and resistance to cold and darkness",
        type: "passive",
      },
      {
        name: "Consecration",
        description: "Bless an object or location to repel evil for a duration",
        type: "active",
      },
    ],
    actingRequirements: [
      "Lead religious ceremonies and services regularly",
      "Protect the faithful and defend sacred sites",
      "Study the scriptures of the sun and embody their teachings",
    ],
    prerequisiteItems: [
      {
        name: "Solar High Priest Potion Formula",
        description: "The recipe for the Sequence 7 Solar High Priest potion",
        category: "potion-formula",
      },
      {
        name: "Phoenix Feather Fragment",
        description:
          "A shard of a phoenix feather, imbued with regenerative flame",
        category: "main-ingredient",
      },
      {
        name: "Sacred Incense Resin",
        description: "Resin from a tree growing in a consecrated grove",
        category: "supplementary-ingredient",
      },
      {
        name: "Dawn Dew",
        description: "Dew collected at the exact moment of sunrise from a holy site",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Purify a location corrupted by darkness or evil",
      requirements: [
        "Identify a location tainted by supernatural darkness",
        "Perform a purification ritual lasting from dawn to noon",
        "Successfully cleanse the corruption completely",
      ],
    },
  },
  {
    level: 6,
    name: "Notary",
    classification: "Mid",
    abilities: [
      {
        name: "Sacred Contract",
        description:
          "Create binding contracts enforced by supernatural power — breakers suffer divine retribution",
        type: "active",
      },
      {
        name: "Truth Detection",
        description:
          "Compel truth from a target during formal questioning",
        type: "active",
      },
      {
        name: "Aura of Authority",
        description:
          "Project an aura that compels respect and obedience from weaker-willed beings",
        type: "passive",
      },
      {
        name: "Holy Fire",
        description: "Summon flames of purification that burn evil but spare the innocent",
        type: "active",
      },
    ],
    actingRequirements: [
      "Uphold justice and enforce agreements",
      "Serve as arbiter in disputes when called upon",
      "Never break your own word or contract",
    ],
    prerequisiteItems: [
      {
        name: "Notary Potion Formula",
        description: "The recipe for the Sequence 6 Notary potion",
        category: "potion-formula",
      },
      {
        name: "Scale of a Golden Serpent",
        description: "A scale from a serpent that guards sacred contracts",
        category: "main-ingredient",
      },
      {
        name: "Ink of Binding",
        description: "Mystical ink that makes written words supernaturally binding",
        category: "supplementary-ingredient",
      },
      {
        name: "Judgment Stone Dust",
        description: "Powdered stone from the ruins of an ancient court of law",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Adjudicate a dispute between two Beyonders and enforce the outcome",
      requirements: [
        "Receive both parties' consent to your arbitration",
        "Issue a judgment backed by your Sacred Contract ability",
        "Ensure compliance from both parties",
      ],
    },
  },
  {
    level: 5,
    name: "Priest of Light",
    classification: "Mid",
    abilities: [
      {
        name: "Divine Healing",
        description:
          "Heal severe wounds and cure serious diseases through channeled light",
        type: "active",
      },
      {
        name: "Solar Judgment",
        description:
          "Call down a pillar of concentrated sunlight to smite a target area",
        type: "active",
      },
      {
        name: "Sanctuary",
        description:
          "Create a zone of holy light that protects all within from evil influence",
        type: "active",
      },
      {
        name: "Radiant Constitution",
        description:
          "Body is suffused with light — highly resistant to corruption, poison, and disease",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Lead a congregation or community of faith",
      "Perform major healing works at least once a week",
      "Stand as a beacon of light in times of darkness",
    ],
    prerequisiteItems: [
      {
        name: "Priest of Light Potion Formula",
        description: "The recipe for the Sequence 5 Priest of Light potion",
        category: "potion-formula",
      },
      {
        name: "Beyonder Characteristic of a Notary",
        description:
          "The crystallized Beyonder characteristic from a Seq 6 Notary",
        category: "main-ingredient",
      },
      {
        name: "Heart of a Sun Elemental",
        description: "The core of a minor sun elemental creature",
        category: "main-ingredient",
      },
      {
        name: "Holy Water of the Dawn Cathedral",
        description:
          "Water blessed at the Dawn Cathedral during the summer solstice",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Establish a new consecrated sanctuary and defend it from darkness",
      requirements: [
        "Choose a location in need of spiritual protection",
        "Consecrate the location through a day-long ritual",
        "Defend the sanctuary against a supernatural assault",
      ],
    },
  },
];

const deathSequences: Sequence[] = [
  {
    level: 9,
    name: "Corpse Collector",
    classification: "Low",
    abilities: [
      {
        name: "Corpse Communication",
        description:
          "Speak with recently deceased to learn their final moments",
        type: "active",
      },
      {
        name: "Death Sense",
        description:
          "Detect the presence of death, undead, and lingering spirits nearby",
        type: "passive",
      },
      {
        name: "Preserve Remains",
        description:
          "Slow or halt decomposition of a corpse through spiritual means",
        type: "active",
      },
    ],
    actingRequirements: [
      "Treat the dead with respect and perform proper burial rites",
      "Spend time among graves and places of death without fear",
      "Collect and catalog remains you encounter",
    ],
    prerequisiteItems: [
      {
        name: "Corpse Collector Potion Formula",
        description: "The recipe for the Sequence 9 Corpse Collector potion",
        category: "potion-formula",
      },
      {
        name: "Corpse Grass",
        description:
          "A grey grass that grows exclusively on the graves of Beyonders",
        category: "main-ingredient",
      },
      {
        name: "Black-faced Vulture Oil",
        description: "Rendered fat from a spiritually-attuned vulture",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Gravedigger",
    classification: "Low",
    abilities: [
      {
        name: "Undead Command",
        description:
          "Raise and command a small number of basic undead (skeletons, zombies)",
        type: "active",
      },
      {
        name: "Bone Weapon",
        description: "Shape bones into supernatural weapons",
        type: "active",
      },
      {
        name: "Death's Endurance",
        description:
          "Reduced need for sleep and food; resistance to cold and disease",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Dig graves and bury the dead as a service to communities",
      "Study the nature of death and undeath",
      "Protect graveyards and burial sites from desecration",
    ],
    prerequisiteItems: [
      {
        name: "Gravedigger Potion Formula",
        description: "The recipe for the Sequence 8 Gravedigger potion",
        category: "potion-formula",
      },
      {
        name: "Zombie Heart",
        description: "The still-beating heart of a naturally-risen zombie",
        category: "main-ingredient",
      },
      {
        name: "Graveyard Soil",
        description:
          "Soil from a graveyard that has held the dead for over a century",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Successfully put a restless undead to permanent rest",
      requirements: [
        "Locate an undead that refuses to stay buried",
        "Perform the rite of final rest at the undead's original grave",
        "Ensure the spirit passes on peacefully",
      ],
    },
  },
  {
    level: 7,
    name: "Spirit Medium",
    classification: "Mid",
    abilities: [
      {
        name: "Spirit Channeling",
        description:
          "Allow a spirit to temporarily inhabit your body to communicate",
        type: "active",
      },
      {
        name: "Ghost Walk",
        description:
          "Become partially incorporeal for a short time, passing through solid objects",
        type: "active",
      },
      {
        name: "Death Domain Awareness",
        description:
          "Sense disturbances in the boundary between life and death within a wide area",
        type: "passive",
      },
      {
        name: "Spirit Binding",
        description: "Bind a willing or weakened spirit to an object or location",
        type: "active",
      },
    ],
    actingRequirements: [
      "Commune with spirits regularly to maintain your connection to the death domain",
      "Mediate between the living and the dead",
      "Never abuse the trust of spirits who seek your aid",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Medium Potion Formula",
        description: "The recipe for the Sequence 7 Spirit Medium potion",
        category: "potion-formula",
      },
      {
        name: "Wraith Crystal",
        description: "A crystal formed from the condensed essence of a wraith",
        category: "main-ingredient",
      },
      {
        name: "Spirit World Incense",
        description: "Incense that thins the boundary between life and death",
        category: "supplementary-ingredient",
      },
      {
        name: "Tears of the Bereaved",
        description:
          "Tears shed in genuine grief, collected under moonlight",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Channel a powerful spirit and deliver its final message",
      requirements: [
        "Contact a spirit of at least Sequence 8 power",
        "Allow the spirit to channel through you without losing yourself",
        "Successfully deliver the spirit's message to the intended recipient",
      ],
    },
  },
  {
    level: 6,
    name: "Spirit Guide",
    classification: "Mid",
    abilities: [
      {
        name: "Death Gate",
        description:
          "Open a temporary passage to the realm of the dead",
        type: "active",
      },
      {
        name: "Soul Harvest",
        description:
          "Extract the soul of a recently deceased being before it dissipates",
        type: "active",
      },
      {
        name: "Deathly Resilience",
        description:
          "Survive injuries that would kill ordinary beings; greatly slowed aging",
        type: "passive",
      },
      {
        name: "Spirit Army",
        description:
          "Command a small host of bound spirits to fight on your behalf",
        type: "active",
      },
    ],
    actingRequirements: [
      "Guide lost souls to their final rest",
      "Walk the boundary between life and death regularly",
      "Never fear death — treat it as a domain you steward",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Guide Potion Formula",
        description: "The recipe for the Sequence 6 Spirit Guide potion",
        category: "potion-formula",
      },
      {
        name: "Heart of a Death Elemental",
        description: "The core of a minor death elemental creature",
        category: "main-ingredient",
      },
      {
        name: "Veil Fragment",
        description:
          "A piece of the metaphysical veil between life and death",
        category: "supplementary-ingredient",
      },
      {
        name: "Ancient Funeral Ash",
        description:
          "Ash from a funeral pyre that burned over five hundred years ago",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Enter the realm of the dead, guide a lost soul, and return alive",
      requirements: [
        "Open a Death Gate to the realm of the dead",
        "Locate a specific lost soul within the death realm",
        "Guide the soul out and ensure it reaches its final rest",
      ],
    },
  },
  {
    level: 5,
    name: "Undying",
    classification: "Mid",
    abilities: [
      {
        name: "Resurrection",
        description:
          "Revive yourself from death once, reforming your body over time",
        type: "passive",
      },
      {
        name: "Death's Embrace",
        description:
          "Touch a living target to inflict severe necrotic damage that resists healing",
        type: "active",
      },
      {
        name: "Undead Legion",
        description:
          "Raise and command a large force of powerful undead",
        type: "active",
      },
      {
        name: "Deathless Form",
        description:
          "Body exists partially in the death realm — immune to most physical damage",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Embrace the duality of life and death in all things",
      "Maintain dominion over a territory where the dead outnumber the living",
      "Never cling to life — accept death and transcend it",
    ],
    prerequisiteItems: [
      {
        name: "Undying Potion Formula",
        description: "The recipe for the Sequence 5 Undying potion",
        category: "potion-formula",
      },
      {
        name: "Beyonder Characteristic of a Spirit Guide",
        description:
          "The crystallized Beyonder characteristic from a Seq 6 Spirit Guide",
        category: "main-ingredient",
      },
      {
        name: "Lich Bone Fragment",
        description: "A bone fragment from a lich that achieved partial immortality",
        category: "main-ingredient",
      },
      {
        name: "Essence of the Death Realm",
        description:
          "Condensed energy harvested from the depths of the death realm",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Die and resurrect yourself through sheer force of will and accumulated death energy",
      requirements: [
        "Prepare a death chamber infused with death realm energy",
        "Allow yourself to truly die — no half measures",
        "Reconstitute your body and soul through the ritual's power",
      ],
    },
  },
];

export const FOOL_PATHWAY: Pathway = {
  id: 1,
  name: "Fool",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [],
  sequences: foolSequences,
};

export const VISIONARY_PATHWAY: Pathway = {
  id: 2,
  name: "Visionary",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [3],
  sequences: visionarySequences,
};

export const SUN_PATHWAY: Pathway = {
  id: 3,
  name: "Sun",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2],
  sequences: sunSequences,
};

export const DEATH_PATHWAY: Pathway = {
  id: 4,
  name: "Death",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [],
  sequences: deathSequences,
};

export const ALL_PATHWAYS: Pathway[] = [
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
];

export function getPathway(id: number): Pathway | undefined {
  return ALL_PATHWAYS.find((p) => p.id === id);
}

export function getSequence(
  pathwayId: number,
  level: number,
): Sequence | undefined {
  return getPathway(pathwayId)?.sequences.find((s) => s.level === level);
}

export function areNeighboringPathways(a: number, b: number): boolean {
  const pathway = getPathway(a);
  if (!pathway) return false;
  return pathway.neighboringPathways.includes(b);
}
