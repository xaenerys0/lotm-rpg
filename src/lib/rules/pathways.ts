import type { Ability, Pathway, Sequence } from "@/lib/types/rules";

import { ADVANCEMENT_RITUALS, RITUAL_FROM_SEQUENCE } from "./advancement-canon";
import { applyCanonDemigodAbilities } from "./demigod-abilities";

const whiteTowerSequences: Sequence[] = [
  {
    level: 9,
    name: "Reader",
    classification: "Low",
    abilities: [
      {
        name: "Enhanced Mental Attributes",
        description:
          "Upon drinking the potion, Readers will possess great improvements to their reasoning and learning capabilities along with their memory",
        type: "passive",
      },
      {
        name: "Spirituality",
        description: "They gain an enhanced Spirituality upon drinking this potion",
        type: "passive",
      },
      {
        name: "Divination Arts & Ritualistic Magic",
        description:
          "As a result of their enhanced Spirituality, Readers will be capable of using various Ritualistic Magic and Divination Arts",
        type: "active",
      },
    ],
    actingRequirements: [
      "Read, study, and divine in the manner of a Reader",
      "Pursue knowledge through ritual and divination, never idle guesswork",
      "Set down what you learn and keep your knowledge ordered",
    ],
    prerequisiteItems: [
      {
        name: "Reader Potion Formula",
        description:
          "The recipe for the Sequence 9 Reader potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 White Tower Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Reader potion, carrying the White Tower pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Reader formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Student of Ratiocination",
    classification: "Low",
    abilities: [
      {
        name: "Enhanced Mental Attributes",
        description:
          "They gain an increase in observational and logical reasoning skills",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "A further enhancement to their Spirituality has been gained at this level",
        type: "passive",
      },
      {
        name: "Divination Arts & Ritualistic Magic",
        description:
          "As a result of this, a Student of Ratiocination will become an expert at Ritualistic Magic and Divination Arts",
        type: "active",
      },
    ],
    actingRequirements: [
      "Reason every problem through to its conclusion as a Student of Ratiocination",
      "Deduce from evidence; trust logic over impulse",
      "Sharpen memory and mind in keeping with your sequence",
    ],
    prerequisiteItems: [
      {
        name: "Student of Ratiocination Potion Formula",
        description:
          "The recipe for the Sequence 8 Student of Ratiocination potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 White Tower Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Student of Ratiocination potion, carrying the White Tower pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Student of Ratiocination formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Student of Ratiocination: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Student of Ratiocination potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Detective",
    classification: "Mid",
    abilities: [
      {
        name: "Physical Enhancements",
        description: "A Detective possesses an enhanced mobility and speed",
        type: "active",
      },
      {
        name: "Combat Proficiency",
        description: "They possess strong equipment and fighting capabilities",
        type: "passive",
      },
      {
        name: "Enhanced Mental Attributes",
        description:
          "They are good at using pre-established knowledge, deducing clues, observation details, and reasoning out various conclusions",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "With a further strengthening to their Spirituality comes along other changes, such as becoming more efficient at using Ritualistic Magic",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Investigate mysteries and chase the truth like a Detective",
      "Pair sharpened wits with the readiness to act on what you uncover",
      "Leave no question unanswered, yet reveal less than you learn",
    ],
    prerequisiteItems: [
      {
        name: "Detective Potion Formula",
        description:
          "The recipe for the Sequence 7 Detective potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 White Tower Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Detective potion, carrying the White Tower pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Detective formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Detective: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Detective potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Polymath",
    classification: "Mid",
    abilities: [
      {
        name: "Analysis",
        description:
          "Polymaths can Analyze the different characteristics of a Beyonder power used by the target",
        type: "active",
      },
      {
        name: "Imitation",
        description:
          "Once sufficiently Analyzed, they can try to Imitate the corresponding Beyonder power",
        type: "active",
      },
      {
        name: "Enhanced Mental Attributes",
        description: "They can understand and comprehend many things",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Range across every field of learning as a Polymath",
      "Analyse and imitate what you study until you have mastered it",
      "Let breadth of knowledge, not pride, be your measure",
    ],
    prerequisiteItems: [
      {
        name: "Polymath Potion Formula",
        description:
          "The recipe for the Sequence 6 Polymath potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 White Tower Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Polymath potion, carrying the White Tower pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Polymath formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Polymath: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Polymath potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Mysticism Magister",
    classification: "Mid",
    abilities: [
      {
        name: "Spellcasting",
        description:
          "A Mysticism Magister's mastery over rare and unique arcana not only enables them to cast Spells but also invent and create their own Spells that belong only to themselves",
        type: "active",
      },
      {
        name: "Analyze",
        description:
          "Mysticism Magisters are now able to Analyze the characteristics of a Demigod-level Beyonder power and attempt to copy it with Imitation",
        type: "active",
      },
      {
        name: "Imitation",
        description:
          "Their Imitated abilities have been enhanced with an Imitated Demigod-level power being only a bit weaker than a Recording",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Command spells and mystic arts as a Mysticism Magister",
      "Analyse a mystery, then imitate and wield its principle",
      "Discipline your spellcraft; never cast what you do not understand",
    ],
    prerequisiteItems: [
      {
        name: "Mysticism Magister Potion Formula",
        description:
          "The recipe for the Sequence 5 Mysticism Magister potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 White Tower Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Mysticism Magister potion, carrying the White Tower pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Mysticism Magister formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Mysticism Magister: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Mysticism Magister potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Prophet",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Prophecy",
        description:
          "Speak prophecies that lend the foretold future a weight of inevitability, bending events toward their predicted shape",
        type: "active",
      },
      {
        name: "Sealed Analysis",
        description:
          "Analyse a Beyonder power up to the Saint tier and reproduce it through Imitation, copying what you fully comprehend",
        type: "active",
      },
      {
        name: "Mystical Erudition",
        description:
          "A Saint's spirituality sharpens reason toward near-omniscient deduction within all you can observe",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Foretell and seal what is to come as a Prophet",
      "Practise prophecy and sealed analysis with grave care",
      "Master the swelling spirituality of a Saint without letting foreknowledge harden into fatalism",
    ],
    prerequisiteItems: [
      {
        name: "Prophet Potion Formula",
        description:
          "The recipe for the Sequence 4 Prophet potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Mysticism Magister Characteristic",
        description:
          "The Beyonder characteristic of a Mysticism Magister, the core ingredient distilled for the Prophet advancement of the White Tower pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Prophet formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Prophet: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Prophet potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Cognizer",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Cognition of Truth",
        description:
          "Perceive the underlying principle and hidden flaw of a thing simply by reasoning upon it",
        type: "active",
      },
      {
        name: "Thought Acceleration",
        description:
          "Run countless lines of deduction at once, resolving in moments what others could not in years",
        type: "passive",
      },
      {
        name: "Conferral of Knowledge",
        description:
          "Grant sudden understanding to a willing mind or seal a truth away from an unwilling one",
        type: "active",
      },
    ],
    actingRequirements: [
      "Apprehend the truth directly as a Cognizer",
      "Confer and accelerate knowledge, thinking faster than the world",
      "Hold the human thread that keeps your near-omniscience kind rather than cold",
    ],
    prerequisiteItems: [
      {
        name: "Cognizer Potion Formula",
        description:
          "The recipe for the Sequence 3 Cognizer potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Prophet Characteristic",
        description:
          "The Beyonder characteristic of a Prophet, the core ingredient distilled for the Cognizer advancement of the White Tower pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Knowledge and Wisdom, measured to the Cognizer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Cognizer: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Cognizer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Wisdom Angel",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Angelic Omniscience",
        description:
          "Within your domain of knowledge the world lies open — few questions can be put to you that you cannot answer",
        type: "active",
      },
      {
        name: "Authority of Wisdom",
        description:
          "Command the principles of reason and revelation as an Angel of the White Tower",
        type: "active",
      },
      {
        name: "Overflowing Spirituality",
        description:
          "An Angel's spirituality renders ordinary harm meaningless, yet without anchors it strains toward the mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bear near-omniscience as a Wisdom Angel",
      "Wield the authority of wisdom over all that may be known",
      "Anchor your overflowing spirituality before the mythical character of the Wisdom Angel overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Wisdom Angel Potion Formula",
        description:
          "The recipe for the Sequence 2 Wisdom Angel potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Cognizer Characteristic",
        description:
          "The Beyonder characteristic of a Cognizer, the core ingredient distilled for the Wisdom Angel advancement of the White Tower pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Wisdom Angel: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Wisdom Angel potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Omniscient Eye",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "All-Seeing Gaze",
        description:
          "Open the Omniscient Eye to read truths across distance, concealment, and the veils of time",
        type: "active",
      },
      {
        name: "Foreknowledge",
        description:
          "Read the threads of what is to come and act upon them before they come to pass",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "The boundless spirituality of a King of Angels verges on godhood and will overwrite you without unfailing anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "See all as the Omniscient Eye, withholding judgement",
      "Read foreknowledge as a King of Angels, never as a tyrant of fate",
      "Reign over knowledge as its god, yet remember the blind, living world you came from",
    ],
    prerequisiteItems: [
      {
        name: "Omniscient Eye Potion Formula",
        description:
          "The recipe for the Sequence 1 Omniscient Eye potion of the White Tower pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Wisdom Angel Characteristic",
        description:
          "The Beyonder characteristic of a Wisdom Angel, the core ingredient distilled for the Omniscient Eye advancement of the White Tower pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Omniscient Eye: digest the potion through faithful acting, then perform the White Tower pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Omniscient Eye potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Knowledge and Wisdom at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const twilightGiantSequences: Sequence[] = [
  {
    level: 9,
    name: "Warrior",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement (Divine Blood)",
        description:
          "Upon drinking the Warrior potion, they will possess supernatural strength and agility that greatly transcends those who are not Beyonders",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "Their Spirituality is slightly enhanced as a Beyonder, but weaker than most Sequence 9s if they did not already possess heightened levels of Spirituality before becoming a Warrior",
        type: "passive",
      },
      {
        name: "Ritualistic Magic",
        description: "They can learn and cast only the most basic of Ritualistic Magics",
        type: "active",
      },
    ],
    actingRequirements: [
      "Fight and train as a Warrior born of divine blood",
      "Test your strength in battle and ritual alike",
      "Let raw might serve discipline, not temper",
    ],
    prerequisiteItems: [
      {
        name: "Warrior Potion Formula",
        description:
          "The recipe for the Sequence 9 Warrior potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Twilight Giant Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Warrior potion, carrying the Twilight Giant pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Warrior formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Pugilist",
    classification: "Low",
    abilities: [
      {
        name: "Supernatural Resistance",
        description:
          "Their body's superb physique and defensive capabilities can reduce the negative effects of certain supernatural powers",
        type: "passive",
      },
      {
        name: "Combat Proficiency (Gladiatorial)",
        description:
          "They are gifted with the ability and talent to become experts of combat that specialize in close quarters battles",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Settle matters with your fists as a Pugilist",
      "Harden body and resistance through constant combat",
      "Meet every challenge head-on, never from behind",
    ],
    prerequisiteItems: [
      {
        name: "Pugilist Potion Formula",
        description:
          "The recipe for the Sequence 8 Pugilist potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Twilight Giant Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Pugilist potion, carrying the Twilight Giant pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Pugilist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Pugilist: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Pugilist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Weapon Master",
    classification: "Mid",
    abilities: [
      {
        name: "Weapon Mastery",
        description:
          'As long as it can be used as a "weapon" in the Weapon Master\'s hands, it can be used in tandem with their Physical Enhancement to instantly grant them a grandmaster\'s level of familiarity and effectiveness when using that "weapon" in combat',
        type: "active",
      },
      {
        name: "Physical Enhancement (Divine Blood)",
        description:
          "They possess extremely powerful strength, constitution, and agility that is much greater than any Sequence 7 Beyonder from any other Pathway",
        type: "passive",
      },
      {
        name: "Supernatural Resistance",
        description:
          "They can greatly reduce the negative effects and damage caused by using weapon-shaped Sealed Artifacts/Mystical Items via their enhanced physique",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "Their Spirituality as a Weapon Master has enhanced to a high enough degree that allows them to gain the ability to conduct more advanced Ritualistic Magic",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Master every weapon as a Weapon Master",
      "Drill divine strength and skill until the blade is part of you",
      "Wield overwhelming force with a craftsman's control",
    ],
    prerequisiteItems: [
      {
        name: "Weapon Master Potion Formula",
        description:
          "The recipe for the Sequence 7 Weapon Master potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Twilight Giant Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Weapon Master potion, carrying the Twilight Giant pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Weapon Master formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Weapon Master: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Weapon Master potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Dawn Paladin",
    classification: "Mid",
    abilities: [
      {
        name: "Giant's Physique (Strength of Giants)",
        description:
          "Upon drinking this Sequence 6 potion, a Dawn Paladin will possess the body and strength akin to that of common Giants",
        type: "active",
      },
      {
        name: "Light of Dawn/Sunrise Gleam",
        description:
          "Centered on oneself, they can bask a radius of up to 40 to 50 meters in the bright Dawn rays that dispel Illusions, Exorcise and even weaken Evil Spirits",
        type: "active",
      },
      {
        name: "Dawn Weaponry",
        description:
          "They can use the Dawn to materialize different kinds of weapons, such as a massive two-handed axe, a disposable arm-thick spear, or their strongest weapon - Sword of Dawn",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Stand as a Dawn Paladin against the dark",
      "Wield the light of dawn and dawn-forged arms",
      "Carry your strength as a shield for others, not a cudgel",
    ],
    prerequisiteItems: [
      {
        name: "Dawn Paladin Potion Formula",
        description:
          "The recipe for the Sequence 6 Dawn Paladin potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Twilight Giant Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Dawn Paladin potion, carrying the Twilight Giant pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Dawn Paladin formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Dawn Paladin: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Dawn Paladin potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Guardian",
    classification: "Mid",
    abilities: [
      {
        name: "Damage Transference",
        description: "Within a certain range, they can bear the damage of their allies",
        type: "active",
      },
      {
        name: "Giant's Physique (Strength of Giants)",
        description:
          "The strength of their physique has been enhanced, and as such they seldom suffer damage as a result of their heightened defenses",
        type: "active",
      },
      {
        name: "Supernatural Resistance",
        description: "They are unable to be confused or misdirected by Illusions",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "Their Spirituality enhances to a degree to fortify their Cogitation",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Guard and endure as a Guardian",
      "Take others' wounds upon yourself and bear them",
      "Hold the line; let no one fall behind you",
    ],
    prerequisiteItems: [
      {
        name: "Guardian Potion Formula",
        description:
          "The recipe for the Sequence 5 Guardian potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Twilight Giant Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Guardian potion, carrying the Twilight Giant pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Guardian formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Guardian: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Guardian potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Demon Hunter",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Demon-Hunting Might",
        description:
          "Channel a Saint's strength into blows that shatter monsters and Beyonders far above mortal scale",
        type: "active",
      },
      {
        name: "Banishing Light",
        description:
          "Loose searing twilight radiance that burns corruption and the undying back into the dark",
        type: "active",
      },
      {
        name: "Indomitable Frame",
        description:
          "A Saint of Twilight endures wounds that would fell an army, flesh hardened against decay",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Hunt the monstrous as a Demon Hunter",
      "Loose banishing light with an indomitable frame",
      "Master the swelling might of a Saint without letting the hunt make a monster of you",
    ],
    prerequisiteItems: [
      {
        name: "Demon Hunter Potion Formula",
        description:
          "The recipe for the Sequence 4 Demon Hunter potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Guardian Characteristic",
        description:
          "The Beyonder characteristic of a Guardian, the core ingredient distilled for the Demon Hunter advancement of the Twilight Giant pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Demon Hunter formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Demon Hunter: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Demon Hunter potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Silver Knight",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Silver Aegis",
        description:
          "Clad yourself in silver glory that turns aside blades, spells, and curses alike",
        type: "active",
      },
      {
        name: "Glorious Charge",
        description:
          "Cross any distance in a single devastating advance, crushing what stands in your path",
        type: "active",
      },
      {
        name: "Twilight Vigil",
        description:
          "Stand sleepless watch over the failing day, sensing decay and threat across a battlefield",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Charge gloriously and keep the vigil as a Silver Knight",
      "Raise the silver aegis for the defenceless",
      "Hold the human thread that keeps your glory a duty, not a hunger",
    ],
    prerequisiteItems: [
      {
        name: "Silver Knight Potion Formula",
        description:
          "The recipe for the Sequence 3 Silver Knight potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Demon Hunter Characteristic",
        description:
          "The Beyonder characteristic of a Demon Hunter, the core ingredient distilled for the Silver Knight advancement of the Twilight Giant pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Twilight, Decay and Glory, measured to the Silver Knight formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Silver Knight: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Silver Knight potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Glory",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Embodied Glory",
        description:
          "Become a beacon of glory that emboldens allies and unmakes the resolve of foes",
        type: "active",
      },
      {
        name: "Cataclysmic Strength",
        description:
          "Strike with the gathered force of the dying epoch, levelling fortresses with a blow",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but bleeds toward the Twilight Giant's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Embody Glory, cataclysmic yet upright",
      "Loose cataclysmic strength only where it is earned",
      "Anchor your overflowing spirituality before the mythical character of Glory overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Glory Potion Formula",
        description:
          "The recipe for the Sequence 2 Glory potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Silver Knight Characteristic",
        description:
          "The Beyonder characteristic of a Silver Knight, the core ingredient distilled for the Glory advancement of the Twilight Giant pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Glory: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Glory potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Hand of God",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Hand of God",
        description:
          "Bring down judgement as the very hand of a god, an irresistible blow against any single foe",
        type: "active",
      },
      {
        name: "Glory Incarnate",
        description:
          "Radiate a glory so total that lesser Beyonders cannot raise their will against you",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and demands unbroken anchors to keep you yourself",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Strike as the Hand of God, glory incarnate",
      "Wield a King of Angels' strength as judgement, not slaughter",
      "Reign over might as its god, yet remember the frail world a single blow can shatter",
    ],
    prerequisiteItems: [
      {
        name: "Hand of God Potion Formula",
        description:
          "The recipe for the Sequence 1 Hand of God potion of the Twilight Giant pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Glory Characteristic",
        description:
          "The Beyonder characteristic of a Glory, the core ingredient distilled for the Hand of God advancement of the Twilight Giant pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Hand of God: digest the potion through faithful acting, then perform the Twilight Giant pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Hand of God potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Twilight, Decay and Glory at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const justiciarSequences: Sequence[] = [
  {
    level: 9,
    name: "Arbiter",
    classification: "Low",
    abilities: [
      {
        name: "Authority",
        description:
          "Arbiters possess a convincing charm and have a considerable Authority, causing people to be more likely to believe and obey their commands and words",
        type: "passive",
      },
      {
        name: "Physical Enhancement",
        description:
          "Upon advancement, an Arbiter will possess an outstanding physique, with massively increased reflexes, senses, strength and speed",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Settle disputes and uphold order as an Arbiter",
      "Exercise your authority plainly and fairly",
      "Judge by the rule, never by your mood",
    ],
    prerequisiteItems: [
      {
        name: "Arbiter Potion Formula",
        description:
          "The recipe for the Sequence 9 Arbiter potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Justiciar Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Arbiter potion, carrying the Justiciar pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Arbiter formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Sheriff",
    classification: "Low",
    abilities: [
      {
        name: "Area of Jurisdiction (Territory)",
        description:
          "Sheriffs are always connected to their own Area of Jurisdiction, granting them certain bonuses depending on their familiarity with their area",
        type: "active",
      },
      {
        name: "Recognition",
        description:
          "As long as they saw the person in the flesh, in a photo, or a sketch, then they'll be able to firmly remember the target’s appearance and obtain an additional sense on an extraordinary level",
        type: "active",
      },
      {
        name: "Supernatural Intuition",
        description:
          "Sheriffs possess the capability to detect all sorts of strange abnormalities, even if they are Concealed or just a remnant of a larger irregularity",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Keep the peace of your jurisdiction as a Sheriff",
      "Recognise wrongdoing and act on your intuition",
      "Patrol your territory; let no disorder fester in it",
    ],
    prerequisiteItems: [
      {
        name: "Sheriff Potion Formula",
        description:
          "The recipe for the Sequence 8 Sheriff potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Justiciar Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Sheriff potion, carrying the Justiciar pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Sheriff formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Sheriff: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Sheriff potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Interrogator",
    classification: "Mid",
    abilities: [
      {
        name: "Whip of Pain",
        description:
          "When an Interrogator uses this ability, the target will feel like electric currents are running through their spirit, connecting to form a whip of thorns that constantly beats their Soul",
        type: "active",
      },
      {
        name: "Psychic Piercing",
        description:
          "An Interrogator can directly invade into a target's mental defenses within an effective range of 5 meters, leaving them subject to counterattack and arrest",
        type: "active",
      },
      {
        name: "Brand of Restraint",
        description:
          "They can manifest an illusory brand that can Restrain and suppress others",
        type: "active",
      },
      {
        name: "Psychic Lashing",
        description:
          "An Interrogator is able to attack by utilizing bolts of illusory lightning",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Draw out the truth as an Interrogator",
      "Bind and press the guilty with restraint, never cruelty",
      "Wield pain only in the service of the law",
    ],
    prerequisiteItems: [
      {
        name: "Interrogator Potion Formula",
        description:
          "The recipe for the Sequence 7 Interrogator potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Justiciar Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Interrogator potion, carrying the Justiciar pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Interrogator formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Interrogator: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Interrogator potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Judge",
    classification: "Mid",
    abilities: [
      {
        name: "Verdict",
        description:
          "Judges can directly issue commands, rules, and Verdicts through their words, which has varied effects on the target(s) depending on the words used",
        type: "active",
      },
      {
        name: "Exile",
        description:
          'By saying the word "Exile", they can send an overwhelming and invisible force that forces targets out at high speeds',
        type: "active",
      },
      {
        name: "Confinement",
        description:
          'While in a room, they can say this word to make it Sealed, preventing entry or exit in a way akin to a s Distortion of "closing a door and Sealing the room"',
        type: "active",
      },
      {
        name: "Imprison",
        description:
          'Saying the word "Imprison", they can surround a target with a transparent wall, making the target trapped in a sticky liquid that is hard for even Spirit Bodies to go through',
        type: "passive",
      },
    ],
    actingRequirements: [
      "Pronounce fair verdicts as a Judge",
      "Weigh every case fully before you render judgement",
      "Let your sentence fit the deed, no more and no less",
    ],
    prerequisiteItems: [
      {
        name: "Judge Potion Formula",
        description:
          "The recipe for the Sequence 6 Judge potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Justiciar Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Judge potion, carrying the Justiciar pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Judge formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Judge: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Judge potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Disciplinary Paladin",
    classification: "Mid",
    abilities: [
      {
        name: "Punishment",
        description:
          "If someone were to break the rules previously set by a Disciplinary Paladin's Prohibition, the Disciplinary Paladin will be able to Punish the offender",
        type: "active",
      },
      {
        name: "Physical Enhancements",
        description: "They gain significant improvements on both their physical body",
        type: "passive",
      },
      {
        name: "Enhanced Mental Attributes",
        description: "They gain significant improvements to their Spirit Body",
        type: "passive",
      },
      {
        name: "Authority",
        description:
          "Their aura of Authori ty has been greatly strengthened and improved",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Enforce discipline as a Disciplinary Paladin",
      "Mete out punishment by authority, not by anger",
      "Embody in your own conduct the law you uphold",
    ],
    prerequisiteItems: [
      {
        name: "Disciplinary Paladin Potion Formula",
        description:
          "The recipe for the Sequence 5 Disciplinary Paladin potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Justiciar Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Disciplinary Paladin potion, carrying the Justiciar pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Disciplinary Paladin formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Disciplinary Paladin: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Disciplinary Paladin potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Imperative Mage",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Imperative Decree",
        description:
          "Speak a binding command that the lawful and the bound cannot disobey",
        type: "active",
      },
      {
        name: "Law Weaving",
        description:
          "Lay down localised rules of conduct that reality enforces within a consecrated bound",
        type: "active",
      },
      {
        name: "Judge's Discernment",
        description:
          "A Saint of Order weighs guilt and truth at a glance, unmoved by deceit",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Decree and weave law as an Imperative Mage",
      "Speak imperatives that bind, with a judge's discernment",
      "Master the swelling authority of a Saint without letting the law become your private will",
    ],
    prerequisiteItems: [
      {
        name: "Imperative Mage Potion Formula",
        description:
          "The recipe for the Sequence 4 Imperative Mage potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Disciplinary Paladin Characteristic",
        description:
          "The Beyonder characteristic of a Disciplinary Paladin, the core ingredient distilled for the Imperative Mage advancement of the Justiciar pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Imperative Mage formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Imperative Mage: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Imperative Mage potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Chaos Hunter",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Chaos Hunt",
        description:
          "Track and suppress agents of disorder, your authority smothering their stolen powers",
        type: "active",
      },
      {
        name: "Binding Sentence",
        description:
          "Pass a sentence that fetters a target's body, fortune, or will to the letter of your law",
        type: "active",
      },
      {
        name: "Aura of Order",
        description:
          "Disorderly powers falter and misfire in your presence, the world bending toward your rule",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Hunt down chaos and bind it as a Chaos Hunter",
      "Pass binding sentence under an aura of order",
      "Hold the human thread that keeps order a shelter rather than a cage",
    ],
    prerequisiteItems: [
      {
        name: "Chaos Hunter Potion Formula",
        description:
          "The recipe for the Sequence 3 Chaos Hunter potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Imperative Mage Characteristic",
        description:
          "The Beyonder characteristic of an Imperative Mage, the core ingredient distilled for the Chaos Hunter advancement of the Justiciar pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Order, measured to the Chaos Hunter formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Chaos Hunter: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Chaos Hunter potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Balancer",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "The Balance",
        description:
          "Hold the scales of order and chaos, restoring or withdrawing equilibrium across a region",
        type: "active",
      },
      {
        name: "Authority of Law",
        description:
          "Command the principle of Order as an Angel, your decrees carrying near-absolute weight",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but pulls toward the mythical Justiciar without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Hold all things in equilibrium as the Balancer",
      "Wield the authority of law over the scales",
      "Anchor your overflowing spirituality before the mythical character of the Balancer overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Balancer Potion Formula",
        description:
          "The recipe for the Sequence 2 Balancer potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Chaos Hunter Characteristic",
        description:
          "The Beyonder characteristic of a Chaos Hunter, the core ingredient distilled for the Balancer advancement of the Justiciar pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Balancer: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Balancer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Hand of Order",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Hand of Order",
        description:
          "Enact Order itself, your judgements rewriting the rules a place lives by",
        type: "active",
      },
      {
        name: "Absolute Edict",
        description:
          "Issue an edict so authoritative that even powerful Beyonders are compelled to obey",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and unravels you without unfailing anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Hand down absolute edict as the Hand of Order",
      "Speak a King of Angels' law as justice, never as tyranny",
      "Reign over order as its god, yet remember the living chaos worth sparing",
    ],
    prerequisiteItems: [
      {
        name: "Hand of Order Potion Formula",
        description:
          "The recipe for the Sequence 1 Hand of Order potion of the Justiciar pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Balancer Characteristic",
        description:
          "The Beyonder characteristic of a Balancer, the core ingredient distilled for the Hand of Order advancement of the Justiciar pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Hand of Order: digest the potion through faithful acting, then perform the Justiciar pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Hand of Order potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const blackEmperorSequences: Sequence[] = [
  {
    level: 9,
    name: "Lawyer",
    classification: "Low",
    abilities: [
      {
        name: "Eloquence",
        description:
          "Lawyers are the masters of speech and reasoning, being able to influence the judgement, thoughts, and conclusions that others are brought to via words, actions, and established processes",
        type: "passive",
      },
      {
        name: "Law Proficiency",
        description:
          "They are very good at taking advantage of the loopholes within various social rules and laws, as well as the legal weaknesses an enemy possesses",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Argue and bend the rules as a Lawyer",
      "Wield eloquence and the letter of the law",
      "Find the loophole others miss, and keep your own counsel",
    ],
    prerequisiteItems: [
      {
        name: "Lawyer Potion Formula",
        description:
          "The recipe for the Sequence 9 Lawyer potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Black Emperor Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Lawyer potion, carrying the Black Emperor pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder, the hidden faults of Order, measured to the Lawyer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Barbarian",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description:
          "Upon advancement, a Barbarian will gain various physical improvements such as a physical strength and constitution that breaks the 'rules' of a normal human body",
        type: "passive",
      },
      {
        name: "Mental Resistance",
        description:
          "In addition to their Physical Enhancement, upon advancement, a Barbarian will also possess a high resistance to psychological influences",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Break what binds you as a Barbarian",
      "Harden body and mind against coercion",
      "Answer every constraint with defiance",
    ],
    prerequisiteItems: [
      {
        name: "Barbarian Potion Formula",
        description:
          "The recipe for the Sequence 8 Barbarian potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Black Emperor Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Barbarian potion, carrying the Black Emperor pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder, the hidden faults of Order, measured to the Barbarian formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Barbarian: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Barbarian potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder, the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Briber",
    classification: "Mid",
    abilities: [
      {
        name: "Bribery",
        description: "The core ability of a Briber",
        type: "active",
      },
      {
        name: "Bribe-Weaken",
        description:
          "Within a certain period of time, the target will become weakened, significantly lowering their ranged and melee attacks, defense, and control over the Briber",
        type: "active",
      },
      {
        name: "Bribe-Arrogance",
        description:
          "The target would become proud and Arrogant, lowering their intelligence, and causing them to make mistakes or wrong judgements on their situation",
        type: "active",
      },
      {
        name: "Bribe-Charm",
        description:
          "The target will feel an intense feeling of good or would have a good perception of the Briber, making it hard to have negative intentions towards them",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Buy loyalty and weaken resolve as a Briber",
      "Tempt the proud, the weak, and the charmed alike",
      "Corrupt by offer, never by open force",
    ],
    prerequisiteItems: [
      {
        name: "Briber Potion Formula",
        description:
          "The recipe for the Sequence 7 Briber potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Black Emperor Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Briber potion, carrying the Black Emperor pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder, the hidden faults of Order, measured to the Briber formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Briber: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Briber potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder, the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Baron of Corruption",
    classification: "Mid",
    abilities: [
      {
        name: "Distortion",
        description:
          "Barons of Corruption possess the Beyonder ability that allows them to warp the loopholes found within Order so as to Distort a target's words, actions, and intent",
        type: "active",
      },
      {
        name: "Corrosion",
        description:
          "They can Corrode anyone within a 10 meter range, causing them to become increasingly more 'dark' and greedy as they become more prone to do irrational actions",
        type: "active",
      },
      {
        name: "Weakness Detection",
        description:
          "In addition, with Corrosion and Distortion, Barons of Corruption are acutely able to sense a target's weaknesses and flaws",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Spread distortion and decay as a Baron of Corruption",
      "Detect weakness and corrode it from within",
      "Let rot do your work quietly, unseen",
    ],
    prerequisiteItems: [
      {
        name: "Baron of Corruption Potion Formula",
        description:
          "The recipe for the Sequence 6 Baron of Corruption potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Black Emperor Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Baron of Corruption potion, carrying the Black Emperor pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder, the hidden faults of Order, measured to the Baron of Corruption formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Baron of Corruption: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Baron of Corruption potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder, the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Mentor of Disorder",
    classification: "Mid",
    abilities: [
      {
        name: "Disorder",
        description:
          "Mentors of Disorder are able to bring chaos within the Order of the surrounding environment, creating Disorder that grants them several advantages in a situation",
        type: "active",
      },
      {
        name: "Majesty",
        description:
          "A Mentor of Disorder is able to display a sense of great royalty, a Majesty that causes others to want to lower their bodies and obey their every command",
        type: "active",
      },
      {
        name: "Distortion",
        description:
          "Their ability to Distort has been slightly strengthened, allowing a Mentor of Disorder to be able to Distort their surroundings or nearby objects that are not tied to an 'entity'",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sow disorder with majesty as a Mentor of Disorder",
      "Distort order until it unravels of itself",
      "Command ruin without becoming its first victim",
    ],
    prerequisiteItems: [
      {
        name: "Mentor of Disorder Potion Formula",
        description:
          "The recipe for the Sequence 5 Mentor of Disorder potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Black Emperor Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Mentor of Disorder potion, carrying the Black Emperor pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder, the hidden faults of Order, measured to the Mentor of Disorder formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Mentor of Disorder: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Mentor of Disorder potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder, the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Earl of the Fallen",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Corruption's Gift",
        description:
          "Tempt and corrupt others into your service, bending the fallen to your design",
        type: "active",
      },
      {
        name: "Entropy Touch",
        description:
          "Sow decay and disorder into structures, oaths, and Beyonder powers, hastening their collapse",
        type: "active",
      },
      {
        name: "Fallen Resilience",
        description:
          "A Saint of Disorder thrives amid ruin, strengthened by the chaos it spreads",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bestow corruption's gift as an Earl of the Fallen",
      "Touch with entropy, endure with fallen resilience",
      "Master the swelling corruption of a Saint without letting the ruin rule your purpose",
    ],
    prerequisiteItems: [
      {
        name: "Earl of the Fallen Potion Formula",
        description:
          "The recipe for the Sequence 4 Earl of the Fallen potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Mentor of Disorder Characteristic",
        description:
          "The Beyonder characteristic of a Mentor of Disorder, the core ingredient distilled for the Earl of the Fallen advancement of the Black Emperor pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder and the hidden faults of Order, measured to the Earl of the Fallen formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Earl of the Fallen: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Earl of the Fallen potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder and the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Frenzied Mage",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Frenzied Casting",
        description:
          "Unleash disorderly magic that defies its own rules, unpredictable and hard to counter",
        type: "active",
      },
      {
        name: "Loophole Mastery",
        description:
          "Find and exploit the hidden fault in any law, contract, or ritual to undo it",
        type: "active",
      },
      {
        name: "Aura of Ruin",
        description:
          "Order and structure fray around you, allies of the law weakening in your shadow",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Cast in a frenzy of ruin as a Frenzied Mage",
      "Exploit every loophole under an aura of ruin",
      "Hold the human thread that keeps your defiance a cause, not mere wreckage",
    ],
    prerequisiteItems: [
      {
        name: "Frenzied Mage Potion Formula",
        description:
          "The recipe for the Sequence 3 Frenzied Mage potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Earl of the Fallen Characteristic",
        description:
          "The Beyonder characteristic of an Earl of the Fallen, the core ingredient distilled for the Frenzied Mage advancement of the Black Emperor pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Disorder and the hidden faults of Order, measured to the Frenzied Mage formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Frenzied Mage: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Frenzied Mage potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder and the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Duke of Entropy",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Duke of Entropy",
        description:
          "Accelerate the heat-death of a place — machines fail, oaths break, fortunes scatter",
        type: "active",
      },
      {
        name: "Authority of Disorder",
        description:
          "Command the principle of Disorder as an Angel, unmaking the rules others rely upon",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but slides toward the Black Emperor's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Preside over decay as the Duke of Entropy",
      "Wield the authority of disorder over all that holds together",
      "Anchor your overflowing spirituality before the mythical character of the Duke of Entropy overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Duke of Entropy Potion Formula",
        description:
          "The recipe for the Sequence 2 Duke of Entropy potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Frenzied Mage Characteristic",
        description:
          "The Beyonder characteristic of a Frenzied Mage, the core ingredient distilled for the Duke of Entropy advancement of the Black Emperor pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Duke of Entropy: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Duke of Entropy potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder and the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Prince of Abolition",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Abolition",
        description:
          "Abolish a law, institution, or binding power outright, dissolving what once held",
        type: "active",
      },
      {
        name: "Throne of the Fallen",
        description:
          "Rally the corrupt and the disordered to your banner as their unquestioned prince",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and overwrites you without constant anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Abolish what others build as the Prince of Abolition",
      "Loose a King of Angels' entropy with deliberate aim",
      "Reign over ruin as its god, yet remember the order whose fall would leave you nothing to break",
    ],
    prerequisiteItems: [
      {
        name: "Prince of Abolition Potion Formula",
        description:
          "The recipe for the Sequence 1 Prince of Abolition potion of the Black Emperor pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Duke of Entropy Characteristic",
        description:
          "The Beyonder characteristic of a Duke of Entropy, the core ingredient distilled for the Prince of Abolition advancement of the Black Emperor pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Prince of Abolition: digest the potion through faithful acting, then perform the Black Emperor pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Prince of Abolition potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Disorder and the hidden faults of Order at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const redPriestSequences: Sequence[] = [
  {
    level: 9,
    name: "Hunter",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description:
          "They possess inhuman physical qualities, giving them increased strength, speed, reaction, body control, and natural healing ability",
        type: "active",
      },
      {
        name: "Heightened Senses",
        description:
          "a Hunter's overall auditory, olfactory, and visual senses are enhanced exponentially, this gives them strong tracking skills",
        type: "passive",
      },
      {
        name: "Spirituality",
        description:
          "Their Spirituality is slightly enhanced as a Beyonder, but they are among the weakest in this field, far inferior to other Sequence 9s who excel at it",
        type: "passive",
      },
      {
        name: "Danger Intuition",
        description: "They can passively sense ill intentions and danger",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Stalk and strike as a Hunter",
      "Sharpen your senses and heed danger's warning",
      "Trust instinct, and never blunt your edge",
    ],
    prerequisiteItems: [
      {
        name: "Hunter Potion Formula",
        description:
          "The recipe for the Sequence 9 Hunter potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Red Priest Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Hunter potion, carrying the Red Priest pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Hunter formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Provoker",
    classification: "Low",
    abilities: [
      {
        name: "Provocation",
        description:
          "Provokers possess the ability of Provocation which induces a permanent state change on themselves but also requires activation in order to achieve its desired effect",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description:
          "A Provoker's physique becomes slightly stronger, granting them an overall increase in their strength, reflexes, speed, and agility",
        type: "passive",
      },
      {
        name: "Spirituality",
        description: "Their Spirituality is slightly enhanced once again",
        type: "passive",
      },
      {
        name: "Spirit Vision",
        description: "They can activate Spirit Vision smoothly using a simple gesture",
        type: "active",
      },
    ],
    actingRequirements: [
      "Goad your enemies to rash action as a Provoker",
      "Provoke, then read the spirits stirred to anger",
      "Turn another's temper into your own weapon",
    ],
    prerequisiteItems: [
      {
        name: "Provoker Potion Formula",
        description:
          "The recipe for the Sequence 8 Provoker potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Red Priest Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Provoker potion, carrying the Red Priest pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Provoker formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Provoker: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Provoker potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Pyromaniac",
    classification: "Mid",
    abilities: [
      {
        name: "Pyrokinesis",
        description:
          "They possess the ability to freely control and conjure flames within their vicinity",
        type: "active",
      },
      {
        name: "Compression",
        description: "A Pyromaniac can Compress flames before releasing them",
        type: "active",
      },
      {
        name: "Fire Armor",
        description:
          "They can ignite a layer of Flame Armor over their body, affording them a measure against various forms of assault while still allowing them to breathe in air",
        type: "active",
      },
      {
        name: "Conjure Flames",
        description:
          "They are able to Conjure temporary weapons using flames, capable of inflicting scorching, cutting, and piercing damage",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Conjure and revel in flame as a Pyromaniac",
      "Compress and loose fire, armoured in it",
      "Let fire answer to you, never you to it",
    ],
    prerequisiteItems: [
      {
        name: "Pyromaniac Potion Formula",
        description:
          "The recipe for the Sequence 7 Pyromaniac potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Red Priest Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Pyromaniac potion, carrying the Red Priest pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Pyromaniac formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Pyromaniac: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Pyromaniac potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Conspirer",
    classification: "Mid",
    abilities: [
      {
        name: "Enhanced Mental Attributes",
        description:
          "Upon drinking this Sequence 6 potion, Conspirers will gain an enhanced insight, and a sharper and much more clearer thinking",
        type: "passive",
      },
      {
        name: "Incitement (Instigation)",
        description:
          "Conspirers can Incite certain thoughts or desires in someone’s mind through conversing with them, such as by consciously igniting the flames in their heart",
        type: "active",
      },
      {
        name: "Flame Transformation",
        description:
          "Conspirers are able to merge with their fire weapons conjured from Pyrokinesis and travel to the destination that their fire weapon lands",
        type: "active",
      },
      {
        name: "Pyrokinesis",
        description: "Their precise control over flames has improved",
        type: "active",
      },
    ],
    actingRequirements: [
      "Incite strife and conflict as a Conspirer",
      "Stoke flame and turn crowds with instigation",
      "Set the blaze, then master where it spreads",
    ],
    prerequisiteItems: [
      {
        name: "Conspirer Potion Formula",
        description:
          "The recipe for the Sequence 6 Conspirer potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Red Priest Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Conspirer potion, carrying the Red Priest pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Conspirer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Conspirer: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Conspirer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Reaper",
    classification: "Mid",
    abilities: [
      {
        name: "Weakness Investigation",
        description:
          "Through supernatural means, a Reaper is able to discern a target’s vulnerabilities and weak points in their defenses",
        type: "active",
      },
      {
        name: "Cull",
        description:
          "They can infuse any of their attacks with this Beyonder power to harvest their target's life, making each attack akin to striking an enemy's vital points and weaknesses",
        type: "active",
      },
      {
        name: "Precision",
        description:
          "A Reaper is able to precisely target a predetermined location and carefully manipulate Fireballs, Fire Ravens, and all sorts of Fire Spells",
        type: "active",
      },
      {
        name: "Pyrokinesis",
        description: "Their ability to manipulate and control flames has been enhanced",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Cull the weak with precision as a Reaper",
      "Investigate weakness, then end it cleanly with fire",
      "Strike to finish; waste no flame on display",
    ],
    prerequisiteItems: [
      {
        name: "Reaper Potion Formula",
        description:
          "The recipe for the Sequence 5 Reaper potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Red Priest Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Reaper potion, carrying the Red Priest pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Reaper formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Reaper: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Reaper potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Iron-blooded Knight",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Iron Blood",
        description:
          "Forge your blood into weapons and armour, fighting on through wounds that would end others",
        type: "active",
      },
      {
        name: "War Fire",
        description:
          "Call down disciplined flame that scours the field and rallies your war-host",
        type: "active",
      },
      {
        name: "Battle Saint's Vigor",
        description:
          "A Saint of War grows stronger the longer the battle rages, fed by destruction",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Wage war with iron blood as an Iron-blooded Knight",
      "Kindle war-fire with a battle-saint's vigour",
      "Master the swelling fury of a Saint without letting war become your only answer",
    ],
    prerequisiteItems: [
      {
        name: "Iron-blooded Knight Potion Formula",
        description:
          "The recipe for the Sequence 4 Iron-blooded Knight potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Reaper Characteristic",
        description:
          "The Beyonder characteristic of a Reaper, the core ingredient distilled for the Iron-blooded Knight advancement of the Red Priest pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the Iron-blooded Knight formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Iron-blooded Knight: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Iron-blooded Knight potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "War Bishop",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Rite of War",
        description:
          "Bless a host so that their courage, aim, and ferocity rise beyond mortal limit",
        type: "active",
      },
      {
        name: "Pyre Judgement",
        description: "Render foes and their works to ash in a consecrated conflagration",
        type: "active",
      },
      {
        name: "Aura of Destruction",
        description:
          "Fragile things crack and burn near you, the world tilting toward ruin in your wake",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Consecrate the rite of war as a War Bishop",
      "Pass pyre-judgement under an aura of destruction",
      "Hold the human thread that keeps your fire a purge of the deserving, not the helpless",
    ],
    prerequisiteItems: [
      {
        name: "War Bishop Potion Formula",
        description:
          "The recipe for the Sequence 3 War Bishop potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Iron-blooded Knight Characteristic",
        description:
          "The Beyonder characteristic of an Iron-blooded Knight, the core ingredient distilled for the War Bishop advancement of the Red Priest pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to War and Destruction, measured to the War Bishop formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond War Bishop: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the War Bishop potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Weather Warlock",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Weather of War",
        description:
          "Command storm, drought, and tempest to break armies and bend a campaign",
        type: "active",
      },
      {
        name: "Authority of War",
        description:
          "Wield the principle of War and Destruction as an Angel, an avatar of conflict",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but burns toward the Red Priest's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Command the weather of war as a Weather Warlock",
      "Wield the authority of war over storm and flame",
      "Anchor your overflowing spirituality before the mythical character of the Weather Warlock overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Weather Warlock Potion Formula",
        description:
          "The recipe for the Sequence 2 Weather Warlock potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 War Bishop Characteristic",
        description:
          "The Beyonder characteristic of a War Bishop, the core ingredient distilled for the Weather Warlock advancement of the Red Priest pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Weather Warlock: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Weather Warlock potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Conqueror",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Conquest",
        description:
          "Subdue whole hosts and regions, your will to conquer made manifest and irresistible",
        type: "active",
      },
      {
        name: "All-Consuming Pyre",
        description:
          "Raise a fire of destruction vast enough to unmake a city, sparing only what you choose",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and consumes you without unbroken anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Conquer all before you as the Conqueror",
      "Loose an all-consuming pyre with a King of Angels' will",
      "Reign over war as its god, yet remember the lands your fire would leave as ash",
    ],
    prerequisiteItems: [
      {
        name: "Conqueror Potion Formula",
        description:
          "The recipe for the Sequence 1 Conqueror potion of the Red Priest pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Weather Warlock Characteristic",
        description:
          "The Beyonder characteristic of a Weather Warlock, the core ingredient distilled for the Conqueror advancement of the Red Priest pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Conqueror: digest the potion through faithful acting, then perform the Red Priest pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Conqueror potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to War and Destruction at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const demonessSequences: Sequence[] = [
  {
    level: 9,
    name: "Assassin",
    classification: "Low",
    abilities: [
      {
        name: "Shadow Concealment",
        description:
          "Assassins possess the ability to Conceal themselves within darkness and Shadows, allowing them to hide from their targets",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description:
          "Assassins will experience various improvements to their body, making them excel in combat, evasion, and Concealment",
        type: "passive",
      },
      {
        name: "Feather Fall",
        description:
          "They can be as light as a feather, descending gracefully or gliding through the air",
        type: "active",
      },
      {
        name: "Mighty Blow",
        description:
          "An Assassin can release all their physical strength in a single blow",
        type: "active",
      },
    ],
    actingRequirements: [
      "Kill from the shadows as an Assassin",
      "Move concealed and strike with a single mighty blow",
      "Leave no trace, and never strike from the front",
    ],
    prerequisiteItems: [
      {
        name: "Assassin Potion Formula",
        description:
          "The recipe for the Sequence 9 Assassin potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Demoness Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Assassin potion, carrying the Demoness pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Return of All Things to Chaos, Femininity and Charm, measured to the Assassin formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Instigator",
    classification: "Low",
    abilities: [
      {
        name: "Instigation",
        description:
          "Instigators are adept at triggering the evil desires deep in people's hearts, causing them to commit violent crimes",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description:
          "Building on the foundation of an Assassin, their bodies become stronger, but their combat abilities, other than speed, aren't significantly improved",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Turn others against each other as an Instigator",
      "Instigate discord and let it do your work",
      "Pull strings from outside the quarrel you start",
    ],
    prerequisiteItems: [
      {
        name: "Instigator Potion Formula",
        description:
          "The recipe for the Sequence 8 Instigator potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Demoness Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Instigator potion, carrying the Demoness pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Return of All Things to Chaos, Femininity and Charm, measured to the Instigator formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Instigator: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Instigator potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Return of All Things to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Witch",
    classification: "Mid",
    abilities: [
      {
        name: "Charm",
        description: "A Witch's appearance and charm will be enhanced significantly",
        type: "active",
      },
      {
        name: "Dark Magic",
        description:
          "A Witch will gain various forms of Dark Magic bestowed by the potion; however, they cannot delve into spell study and master new incantations like",
        type: "active",
      },
      {
        name: "Mirror Substitution",
        description:
          "They have the ability to utilize Mirrors as a medium to create Substitutes that can take damage in their place",
        type: "active",
      },
      {
        name: "Staff Substitution",
        description:
          "Similar to Mirror Substitution, Witches are able to use staves as a medium for substitutes in order to counteract fatal harm",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Charm and curse as a Witch",
      "Weave dark magic and slip a substitution in your place",
      "Bind hearts with allure; never be bound by them",
    ],
    prerequisiteItems: [
      {
        name: "Witch Potion Formula",
        description: "The recipe for the Sequence 7 Witch potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Demoness Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Witch potion, carrying the Demoness pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Return of All Things to Chaos, Femininity and Charm, measured to the Witch formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Witch: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Witch potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Return of All Things to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Pleasure",
    classification: "Mid",
    abilities: [
      {
        name: "Threads",
        description:
          "Demonesses of Pleasure can make thin, almost invisible Threads like spider silk, and use them to control and restrict the enemy's movements",
        type: "active",
      },
      {
        name: "Charm",
        description:
          "They will become more beautiful, making them better at seduction and providing unforgettable pleasure to the same or opposite gender during sex",
        type: "active",
      },
      {
        name: "Dark Magic",
        description:
          "Their Dark Magic capabilities as a Witch have been greatly improved",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description: "They have strong throat control",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Ensnare with delight as Pleasure",
      "Cast threads of charm and dark magic over your prey",
      "Offer indulgence as a hook, not as a habit of your own",
    ],
    prerequisiteItems: [
      {
        name: "Pleasure Potion Formula",
        description:
          "The recipe for the Sequence 6 Pleasure potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Demoness Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Pleasure potion, carrying the Demoness pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Return of All Things to Chaos, Femininity and Charm, measured to the Pleasure formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Pleasure: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Pleasure potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Return of All Things to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Affliction",
    classification: "Mid",
    abilities: [
      {
        name: "Disease",
        description:
          "An Affliction can create multiple airborne pathogens that have their infection speed and the onset of diseases supernaturally accelerated",
        type: "active",
      },
      {
        name: "Threads",
        description: "An Affliction's Threads have been significantly enhanced",
        type: "active",
      },
      {
        name: "Charm",
        description: "An Affliction can now use their Charm as an active ability",
        type: "active",
      },
      {
        name: "Dark Magic",
        description: "An Affliction's Dark Magic capabilities have also been enhanced",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Spread sickness and ruin as Affliction",
      "Loose disease, threads, and charm together",
      "Let suffering serve your aim, not mere cruelty",
    ],
    prerequisiteItems: [
      {
        name: "Affliction Potion Formula",
        description:
          "The recipe for the Sequence 5 Affliction potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Demoness Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Affliction potion, carrying the Demoness pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Return of All Things to Chaos, Femininity and Charm, measured to the Affliction formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Affliction: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Affliction potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Return of All Things to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Despair",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Wave of Despair",
        description:
          "Flood the hearts of all who behold you with hopelessness that saps their will to resist",
        type: "active",
      },
      {
        name: "Charm's Ruin",
        description:
          "Bind admirers and foes alike with irresistible allure, then turn their devotion to calamity",
        type: "active",
      },
      {
        name: "Saint's Allure",
        description:
          "A Saint of the Demoness compels fascination, harm sliding off her like water",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Drown your foes in despair as Despair",
      "Loose a wave of despair and a saint's ruinous allure",
      "Master the swelling temptation of a Saint without letting calamity become your only joy",
    ],
    prerequisiteItems: [
      {
        name: "Despair Potion Formula",
        description:
          "The recipe for the Sequence 4 Despair potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Affliction Characteristic",
        description:
          "The Beyonder characteristic of an Affliction, the core ingredient distilled for the Despair advancement of the Demoness pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Chaos, Femininity and Charm, measured to the Despair formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Despair: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Despair potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Unaging",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Unaging Flesh",
        description:
          "Halt your own decay and mend grievous wounds, your beauty and youth unbroken by time",
        type: "active",
      },
      {
        name: "Chaos Caress",
        description: "Sow chaos and undoing through a touch or a whispered promise",
        type: "active",
      },
      {
        name: "Aura of Temptation",
        description:
          "Order and restraint fray around you as desire and ruin take root in every heart",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Defy time in unaging flesh as the Unaging",
      "Caress chaos under an aura of temptation",
      "Hold the human thread that keeps your endless youth from emptying your heart",
    ],
    prerequisiteItems: [
      {
        name: "Unaging Potion Formula",
        description:
          "The recipe for the Sequence 3 Unaging potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Despair Characteristic",
        description:
          "The Beyonder characteristic of a Despair, the core ingredient distilled for the Unaging advancement of the Demoness pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Chaos, Femininity and Charm, measured to the Unaging formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Unaging: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Unaging potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Catastrophe",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Catastrophe",
        description:
          "Call down disaster upon a place — its order, fortune, and safety collapsing together",
        type: "active",
      },
      {
        name: "Authority of Chaos",
        description:
          "Wield the Return of All Things to Chaos as an Angel, undoing what was made",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but draws toward the Demoness's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Become living Catastrophe",
      "Wield the authority of chaos over all that stands whole",
      "Anchor your overflowing spirituality before the mythical character of Catastrophe overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Catastrophe Potion Formula",
        description:
          "The recipe for the Sequence 2 Catastrophe potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Unaging Characteristic",
        description:
          "The Beyonder characteristic of an Unaging, the core ingredient distilled for the Catastrophe advancement of the Demoness pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Catastrophe: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Catastrophe potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Apocalypse",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Apocalypse",
        description:
          "Unleash ruin on the scale of an ending, charm and chaos fused into a tide nothing withstands",
        type: "active",
      },
      {
        name: "Empress of Calamity",
        description:
          "Rule the desperate and the smitten as their apocalypse-bringing queen",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and dissolves you without ceaseless anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Herald the Apocalypse as the Empress of Calamity",
      "Loose a King of Angels' ruin with deliberate aim",
      "Reign over calamity as its goddess, yet remember the world whose ending leaves you alone",
    ],
    prerequisiteItems: [
      {
        name: "Apocalypse Potion Formula",
        description:
          "The recipe for the Sequence 1 Apocalypse potion of the Demoness pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Catastrophe Characteristic",
        description:
          "The Beyonder characteristic of a Catastrophe, the core ingredient distilled for the Apocalypse advancement of the Demoness pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Apocalypse: digest the potion through faithful acting, then perform the Demoness pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Apocalypse potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Chaos, Femininity and Charm at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const motherSequences: Sequence[] = [
  {
    level: 9,
    name: "Planter",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description:
          "Planters possess several physical enhancements upon drinking the potion, showcased by their high physical strength",
        type: "passive",
      },
      {
        name: "Farming Proficiency",
        description:
          "Planters possess a high proficiency with farming tools, distinguishing among different seeds, and nurturing them",
        type: "passive",
      },
      {
        name: "Weather Forecasting",
        description:
          "They can predict the weather to a certain extent by observing clouds, wind, and other natural phenomenon",
        type: "active",
      },
    ],
    actingRequirements: [
      "Tend the soil and the seasons as a Planter",
      "Coax growth and read the coming weather",
      "Nurture what you plant; take only what has ripened",
    ],
    prerequisiteItems: [
      {
        name: "Planter Potion Formula",
        description: "The recipe for the Sequence 9 Planter potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Mother Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Planter potion, carrying the Mother pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Planter formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Doctor",
    classification: "Low",
    abilities: [
      {
        name: "Surgical Mastery",
        description:
          "They are experts at surgery, possessing the corresponding skills in suturing severed limbs and transplanting internal organs, and having a fine control over medical tools",
        type: "passive",
      },
      {
        name: "Treatments",
        description:
          "Doctors possess a variety of Treatments and thus are rather good at healing a variety of different injuries/illnesses such Treatments as the baseline method",
        type: "active",
      },
      {
        name: "Evil Ailment Treatment",
        description:
          "They are able to relieve certain aliments and diseases associated with the domains of Evil and Depravity",
        type: "active",
      },
      {
        name: "Disease Treatments",
        description:
          "Even if the disease is not associated with the domains of Evil and Depravity, they can still heal it",
        type: "active",
      },
    ],
    actingRequirements: [
      "Heal the sick and the injured as a Doctor",
      "Practise surgery and treat even evil ailments",
      "Preserve life wherever you can reach it",
    ],
    prerequisiteItems: [
      {
        name: "Doctor Potion Formula",
        description: "The recipe for the Sequence 8 Doctor potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Mother Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Doctor potion, carrying the Mother pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Doctor formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Doctor: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Doctor potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Harvest Priest",
    classification: "Mid",
    abilities: [
      {
        name: "Seed Catalyzation",
        description:
          "Through this Beyonder power, a Harvest Priest will be able to directly Catalyze the life hidden within a seed or an already existing plant, causing it to grow faster",
        type: "active",
      },
      {
        name: "Plant & Insect Commanding",
        description:
          "Harvest Priests are able to directly Command plants and insects within a 30 meter radius to provide them with a certain level of support",
        type: "active",
      },
      {
        name: "Knowledge (Ritualistic Spells)",
        description:
          "Upon drinking the potion, a Harvest Priest will obtain several Ritualistic Spells focused on manipulating the weather",
        type: "passive",
      },
      {
        name: "Physical Enhancement",
        description: "Their body will receive a variety of different enhancements",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bless growth and harvest as a Harvest Priest",
      "Catalyse seeds and command plant and insect",
      "Hold the cycle of growth in trust, never in waste",
    ],
    prerequisiteItems: [
      {
        name: "Harvest Priest Potion Formula",
        description:
          "The recipe for the Sequence 7 Harvest Priest potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Mother Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Harvest Priest potion, carrying the Mother pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Harvest Priest formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Harvest Priest: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Harvest Priest potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Biologist",
    classification: "Mid",
    abilities: [
      {
        name: "Crossbreeding",
        description:
          "Biologists possess the ability to make a chimera or Crossbreed between various animals, plants, and even an object, directly leading to them creating a new species",
        type: "active",
      },
      {
        name: "Beyonder Constitution",
        description: "A Biologist's body and spirit are strengthened beyond the mundane",
        type: "active",
      },
    ],
    actingRequirements: [
      "Study and shape living things as a Biologist",
      "Crossbreed and refine life with patient care",
      "Improve life without violating what makes it whole",
    ],
    prerequisiteItems: [
      {
        name: "Biologist Potion Formula",
        description:
          "The recipe for the Sequence 6 Biologist potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Mother Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Biologist potion, carrying the Mother pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Biologist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Biologist: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Biologist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Druid",
    classification: "Mid",
    abilities: [
      {
        name: "Bear Transformation",
        description:
          "Druids are able to transform themselves into a giant bear that was twice the height of a person and that possesses great strength and endurance",
        type: "active",
      },
      {
        name: "Underground Slink",
        description:
          "They can transform the ground below into a swamp and submerge themselves completely into it to avoid attacks or hide from enemies",
        type: "active",
      },
      {
        name: "Poison Hair Incineration",
        description:
          "Druids can incinerate their hair in a battle to produce a very toxic black gas with a variety of unknown poisonous effects",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description:
          "A Druid's body has undergone some inhuman changes upon advancing to this Sequence, allowing them to breathe in and take nutrients from the soil",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk with the wild as a Druid",
      "Take beast-shape and move through the deep earth",
      "Keep the balance of the wild you draw upon",
    ],
    prerequisiteItems: [
      {
        name: "Druid Potion Formula",
        description: "The recipe for the Sequence 5 Druid potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Mother Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Druid potion, carrying the Mother pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Druid formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Druid: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Druid potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Classical Alchemist",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Classical Transmutation",
        description:
          "Transmute matter and living tissue through the old alchemy, mending or remaking the body",
        type: "active",
      },
      {
        name: "Bloom of Life",
        description:
          "Quicken growth and healing across a region, raising verdant life from barren ground",
        type: "active",
      },
      {
        name: "Saint's Vitality",
        description:
          "A Saint of Life overflows with vigour, wounds closing as fast as they are dealt",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Transmute and quicken life as a Classical Alchemist",
      "Work the bloom of life with a saint's vitality",
      "Master the swelling vitality of a Saint without letting creation run past your control",
    ],
    prerequisiteItems: [
      {
        name: "Classical Alchemist Potion Formula",
        description:
          "The recipe for the Sequence 4 Classical Alchemist potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Druid Characteristic",
        description:
          "The Beyonder characteristic of a Druid, the core ingredient distilled for the Classical Alchemist advancement of the Mother pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Classical Alchemist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Classical Alchemist: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Classical Alchemist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Pallbearer",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Pallbearer's Passage",
        description:
          "Usher life and death across their threshold, returning the newly fallen or laying the restless to rest",
        type: "active",
      },
      {
        name: "Cycle Mastery",
        description:
          "Bend the cycle of growth, decay, and rebirth to your design within a consecrated land",
        type: "active",
      },
      {
        name: "Aura of Growth",
        description:
          "Life flourishes wildly in your presence, the very soil answering your mood",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Carry the cycle of life and death as a Pallbearer",
      "Open passage through the cycle under an aura of growth",
      "Hold the human thread that keeps your dominion a tending, not a harvest of souls",
    ],
    prerequisiteItems: [
      {
        name: "Pallbearer Potion Formula",
        description:
          "The recipe for the Sequence 3 Pallbearer potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Classical Alchemist Characteristic",
        description:
          "The Beyonder characteristic of a Classical Alchemist, the core ingredient distilled for the Pallbearer advancement of the Mother pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Life, Growth and Creation, measured to the Pallbearer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Pallbearer: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Pallbearer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Desolate Matriarch",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Desolate Matriarch",
        description:
          "Command the cycle of life over a desolation, raising abundance or withering it at will",
        type: "active",
      },
      {
        name: "Authority of Life",
        description:
          "Wield the principle of Life and Growth as an Angel, mother to a region's living things",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but pulls toward the Mother's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Mother both bloom and barren as the Desolate Matriarch",
      "Wield the authority of life over all that grows and fades",
      "Anchor your overflowing spirituality before the mythical character of the Desolate Matriarch overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Desolate Matriarch Potion Formula",
        description:
          "The recipe for the Sequence 2 Desolate Matriarch potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Pallbearer Characteristic",
        description:
          "The Beyonder characteristic of a Pallbearer, the core ingredient distilled for the Desolate Matriarch advancement of the Mother pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Desolate Matriarch: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Desolate Matriarch potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Naturewalker",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Naturewalker",
        description:
          "Walk as the will of nature itself, forests and beasts moving to your unspoken command",
        type: "active",
      },
      {
        name: "Genesis",
        description:
          "Call new life into being and remake a ruined land into a living world",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and overgrows your self without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk as life itself, the Naturewalker",
      "Work genesis with a King of Angels' hand",
      "Reign over life as its goddess, yet remember the small, mortal things you once tended",
    ],
    prerequisiteItems: [
      {
        name: "Naturewalker Potion Formula",
        description:
          "The recipe for the Sequence 1 Naturewalker potion of the Mother pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Desolate Matriarch Characteristic",
        description:
          "The Beyonder characteristic of a Desolate Matriarch, the core ingredient distilled for the Naturewalker advancement of the Mother pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Naturewalker: digest the potion through faithful acting, then perform the Mother pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Naturewalker potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Life, Growth and Creation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const moonSequences: Sequence[] = [
  {
    level: 9,
    name: "Apothecary",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description:
          "While Apothecaries don't gain massive physical improvements as some of the other Pathways at this Sequence, they do gain a few upon becoming a Sequence 9 Beyonder",
        type: "passive",
      },
      {
        name: "Medicinal Concoction",
        description:
          "They excel at creating and mixing various herbs as well as using animal parts to create various Medicinal Concoctions, letting them easily treat most illnesses/injuries",
        type: "active",
      },
      {
        name: "Taming",
        description: "Apothecaries are good at Taming and domesticating plants",
        type: "active",
      },
      {
        name: "Spirituality",
        description: "Their Spirituality gets enhanced as a Beyonder",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Brew remedies and tame creatures as an Apothecary",
      "Concoct medicines and tend what you have tamed",
      "Measure every draught with care",
    ],
    prerequisiteItems: [
      {
        name: "Apothecary Potion Formula",
        description:
          "The recipe for the Sequence 9 Apothecary potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Moon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Apothecary potion, carrying the Moon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Apothecary formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Beast Tamer",
    classification: "Low",
    abilities: [
      {
        name: "Intimidation",
        description:
          "Beast Tamers are instinctively the natural enemies of animals, being able to Intimidate them into complete submission with just their gaze",
        type: "active",
      },
      {
        name: "Animal Senses",
        description:
          "Beast Tamers are able to communicate with animals, utilize those animals' senses, and read their emotions and intentions",
        type: "passive",
      },
      {
        name: "Taming",
        description:
          "They can Tame, domesticate, and use various unique animals rather effectively",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description: "Their physical attributes have been greatly improved",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Master beasts as a Beast Tamer",
      "Intimidate, sense, and tame the wild",
      "Rule your beasts by understanding, not by force alone",
    ],
    prerequisiteItems: [
      {
        name: "Beast Tamer Potion Formula",
        description:
          "The recipe for the Sequence 8 Beast Tamer potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Moon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Beast Tamer potion, carrying the Moon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Beast Tamer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Beast Tamer: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Beast Tamer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Vampire",
    classification: "Mid",
    abilities: [
      {
        name: "Wings of Darkness",
        description:
          "Vampires are able to utilize the Darkness around them to form illusory bat wings that grant them an enhanced speed boost along with some limited flight capabilities",
        type: "active",
      },
      {
        name: "Claw of Corrosion",
        description:
          "Their nails can grow an extra section with mysterious symbols and patterns on it that make their nails able to cut through steel and give strong corrosion properties",
        type: "active",
      },
      {
        name: "Abyss Shackles",
        description:
          "If their target is within a certain range from them, a Vampire will be able to use the Darkness or Shadows around them to form shackles to bind an enemy",
        type: "active",
      },
      {
        name: "The Embrace",
        description:
          "If a Vampire possesses excess Beyonder Characteristics, they are able to bestow it onto a human, turning that human into one of them",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Stalk the night as a Vampire",
      "Embrace with wings of darkness and corroding claw",
      "Take what you must to endure, and no more",
    ],
    prerequisiteItems: [
      {
        name: "Vampire Potion Formula",
        description: "The recipe for the Sequence 7 Vampire potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Moon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Vampire potion, carrying the Moon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Vampire formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Vampire: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Vampire potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Potions Professor",
    classification: "Mid",
    abilities: [
      {
        name: "Discerning Spiritual Materials",
        description:
          "Upon advancement, an influx of knowledge regarding how to discern spiritual materials needed in various concoctions will be bestowed into their mind",
        type: "active",
      },
      {
        name: "Potion & Perfume Crafting",
        description:
          "With the aid of their newfound knowledge, Potions Professors can mix and create Potions and Perfumes with extraordinary effects",
        type: "active",
      },
      {
        name: "Fire Breath Potion",
        description:
          "By pouring into one's mouth, it allows one to spit out a Fire Breath",
        type: "active",
      },
      {
        name: "Sun Water Potion",
        description: "A Potion that is powerful against undead or vampire-type enemies",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Craft potions and perfumes as a Potions Professor",
      "Discern materials and distil their virtues",
      "Perfect your formulae; never brew what you cannot control",
    ],
    prerequisiteItems: [
      {
        name: "Potions Professor Potion Formula",
        description:
          "The recipe for the Sequence 6 Potions Professor potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Moon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Potions Professor potion, carrying the Moon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Potions Professor formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Potions Professor: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Potions Professor potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Scarlet Scholar",
    classification: "Mid",
    abilities: [
      {
        name: "Lunar Battlefield",
        description:
          "This Beyonder ability creates an environment that's more advantageous for themselves than for the enemy",
        type: "active",
      },
      {
        name: "Moonlight Transformation",
        description:
          "This Beyonder power allows a Scarlet Scholar to transform into a condensed form of Moonlight that can move around near the Moonlit area",
        type: "active",
      },
      {
        name: "Flash Teleportation",
        description:
          "They are able to Teleport to another location within a certain radius so long as it has the Moonlight shining on that area",
        type: "active",
      },
      {
        name: "Potion & Perfume Crafting",
        description: "The effectiveness of Potions and Perfumes has been enhanced",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Command the lunar battlefield as a Scarlet Scholar",
      "Transform in moonlight and flash across the field",
      "Bend the moon's tides without losing your own shape",
    ],
    prerequisiteItems: [
      {
        name: "Scarlet Scholar Potion Formula",
        description:
          "The recipe for the Sequence 5 Scarlet Scholar potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Moon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Scarlet Scholar potion, carrying the Moon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Scarlet Scholar formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Scarlet Scholar: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Scarlet Scholar potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Shaman King",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Shaman's Summons",
        description:
          "Summon and bind spirits and beasts to fight and serve as a king of the old rites",
        type: "active",
      },
      {
        name: "Blood Rite",
        description:
          "Spend blood to fuel potent transformations, curses, and restorations",
        type: "active",
      },
      {
        name: "Saint's Regeneration",
        description:
          "A Saint of the Moon mends wounds with eerie speed, blood answering blood",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Summon and rule spirits as a Shaman King",
      "Work blood rites with a saint's regeneration",
      "Master the swelling life of a Saint without letting the blood-rite hollow your mercy",
    ],
    prerequisiteItems: [
      {
        name: "Shaman King Potion Formula",
        description:
          "The recipe for the Sequence 4 Shaman King potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Scarlet Scholar Characteristic",
        description:
          "The Beyonder characteristic of a Scarlet Scholar, the core ingredient distilled for the Shaman King advancement of the Moon pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the Shaman King formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Shaman King: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Shaman King potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "High Summoner",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "High Summoning",
        description:
          "Call forth greater spirits, vampiric thralls, and night-creatures under your dominion",
        type: "active",
      },
      {
        name: "Lunar Transformation",
        description:
          "Reshape flesh — your own or another's — under the moon's fertile, mutable power",
        type: "active",
      },
      {
        name: "Aura of Night",
        description:
          "Night and moonlight bend to you, the creatures of the dark sensing their sovereign",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Call great powers as a High Summoner",
      "Transform under the moon within an aura of night",
      "Hold the human thread that keeps what you summon answerable to you",
    ],
    prerequisiteItems: [
      {
        name: "High Summoner Potion Formula",
        description:
          "The recipe for the Sequence 3 High Summoner potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Shaman King Characteristic",
        description:
          "The Beyonder characteristic of a Shaman King, the core ingredient distilled for the High Summoner advancement of the Moon pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Fertility and Proliferation, measured to the High Summoner formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond High Summoner: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the High Summoner potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Life-Giver",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Life-Giver",
        description:
          "Grant life and Beyonder gifts to the willing, siring spirits, thralls, and kindred",
        type: "active",
      },
      {
        name: "Authority of Fertility",
        description:
          "Wield the principle of Fertility and Proliferation as an Angel of the Moon",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but bleeds toward the Moon's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bestow life and fertility as the Life-Giver",
      "Wield the authority of fertility over the barren",
      "Anchor your overflowing spirituality before the mythical character of the Life-Giver overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Life-Giver Potion Formula",
        description:
          "The recipe for the Sequence 2 Life-Giver potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 High Summoner Characteristic",
        description:
          "The Beyonder characteristic of a High Summoner, the core ingredient distilled for the Life-Giver advancement of the Moon pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Life-Giver: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Life-Giver potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Beauty Goddess",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Beauty Goddess",
        description:
          "Reign as the night's sovereign beauty, your charm and blood-rule near absolute",
        type: "active",
      },
      {
        name: "Proliferation",
        description:
          "Multiply life, thralls, and kindred across a domain until it answers only to you",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and consumes you without unfailing anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bring forth proliferating life as the Beauty Goddess",
      "Work proliferation with a King of Angels' grace",
      "Reign over life and beauty as its goddess, yet remember the plain, mortal world that adored you",
    ],
    prerequisiteItems: [
      {
        name: "Beauty Goddess Potion Formula",
        description:
          "The recipe for the Sequence 1 Beauty Goddess potion of the Moon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Life-Giver Characteristic",
        description:
          "The Beyonder characteristic of a Life-Giver, the core ingredient distilled for the Beauty Goddess advancement of the Moon pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Beauty Goddess: digest the potion through faithful acting, then perform the Moon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Beauty Goddess potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Fertility and Proliferation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const hermitSequences: Sequence[] = [
  {
    level: 9,
    name: "Mystery Pryer",
    classification: "Low",
    abilities: [
      {
        name: "Eyes of Mystery Prying",
        description:
          "Their eyes are special and allow them to see things that normally aren't visible",
        type: "active",
      },
      {
        name: "Knowledge (Knowledge Pursuit)",
        description:
          "Mystery Pryers will occasionally be chased by knowledge brought to life, imbuing them with knowledge in random intervals",
        type: "passive",
      },
      {
        name: "Spirituality",
        description: "Their Spirituality will get enhanced upon drinking this potion",
        type: "passive",
      },
      {
        name: "Magic & Divination Arts",
        description:
          "They have a comprehensive but rudimentary understanding and grasp of magic, witchcraft Divination Arts, Ritualistic Magic, and other mystical knowledge",
        type: "active",
      },
    ],
    actingRequirements: [
      "Pry into hidden mysteries as a Mystery Pryer",
      "Pursue forbidden knowledge through magic and divination",
      "Seek the secret, but guard what you find",
    ],
    prerequisiteItems: [
      {
        name: "Mystery Pryer Potion Formula",
        description:
          "The recipe for the Sequence 9 Mystery Pryer potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Hermit Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Mystery Pryer potion, carrying the Hermit pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Mystery Pryer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Melee Scholar",
    classification: "Low",
    abilities: [
      {
        name: "Combat Mastery",
        description:
          "Prying into the mystery behind melee combat makes them good at that field",
        type: "passive",
      },
      {
        name: "Beyonder Constitution",
        description:
          "A Melee Scholar's body and spirit are strengthened beyond the mundane",
        type: "active",
      },
    ],
    actingRequirements: [
      "Join learning to combat as a Melee Scholar",
      "Drill combat mastery upon a Beyonder's frame",
      "Let neither the book nor the blade outpace the other",
    ],
    prerequisiteItems: [
      {
        name: "Melee Scholar Potion Formula",
        description:
          "The recipe for the Sequence 8 Melee Scholar potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Hermit Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Melee Scholar potion, carrying the Hermit pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Melee Scholar formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Melee Scholar: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Melee Scholar potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Warlock",
    classification: "Mid",
    abilities: [
      {
        name: "Spellcasting",
        description:
          "Warlocks are able to cast Spells, using various materials to produce a variety of effects, and thus making them be extremely versatile in the process",
        type: "active",
      },
      {
        name: "Some of the Spells they can cast include",
        description:
          "Scene Depiction: Using some powder to display the scenes they see from their Eyes of Mystery Prying onto mirrors or directly tossing powder to form a realistic picture",
        type: "active",
      },
      {
        name: "Soul Summoning",
        description:
          "A supplementary Spell designed to aid spirits in separating from the flesh or to help Astral Projections find their spirits when adrift in the spirit realm",
        type: "active",
      },
      {
        name: "Invisible Hand",
        description:
          "Using an iron-black powder to create a strong Invisible Hand which can be used as a way to exert force on their targets from afar",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bind spirits and cast spells as a Warlock",
      "Summon souls and work the invisible hand",
      "Command what you call up; never serve it",
    ],
    prerequisiteItems: [
      {
        name: "Warlock Potion Formula",
        description: "The recipe for the Sequence 7 Warlock potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Hermit Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Warlock potion, carrying the Hermit pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Warlock formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Warlock: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Warlock potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Scrolls Professor",
    classification: "Mid",
    abilities: [
      {
        name: "Scroll Making",
        description: "They can make scrolls from various materials to cast Spells",
        type: "active",
      },
      {
        name: "Secret Voice",
        description:
          "This Scroll Spell forms a channel linking 3 to 5 people within 50 meters, allowing for communication without distance obstruction",
        type: "active",
      },
      {
        name: "Freezing",
        description:
          "When released, this Scroll Spell creates a stream of crystal clear light that can travel mid-air and fall onto a target, freezing the target",
        type: "active",
      },
      {
        name: "Storm",
        description:
          "When released, this Scroll Spell creates a wide thunderstorm, that has both abundant wind and lightning and deals great damage",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Inscribe power into scrolls as a Scrolls Professor",
      "Bind freezing, storm, and secret voice into your work",
      "Guard your scrolls and the spaces you keep them",
    ],
    prerequisiteItems: [
      {
        name: "Scrolls Professor Potion Formula",
        description:
          "The recipe for the Sequence 6 Scrolls Professor potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Hermit Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Scrolls Professor potion, carrying the Hermit pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Scrolls Professor formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Scrolls Professor: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Scrolls Professor potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Constellations Master",
    classification: "Mid",
    abilities: [
      {
        name: "Starry Spellcasting",
        description:
          "The core Beyonder ability of a Constellation Master is to conjure a Star of rapidly rotating stardust in their palm and use it to achieve a variety of effects",
        type: "active",
      },
      {
        name: "Star Pillar",
        description:
          "A Constellation Master can scatter the Stars they create one after another and merge them into a magnificent pillar of starlight, covering a certain area of space",
        type: "active",
      },
      {
        name: "Starry Amber",
        description:
          "After chanting the corresponding magical incantation, the dazzling Stars around a Constellation Master will fly away one by one landing on the targets",
        type: "active",
      },
      {
        name: "Star Transformation",
        description:
          "Constellation Masters can conjure and transform themselves into a myriad of Stars in order to infiltrate an area and travel to a destination",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Draw on the stars as a Constellations Master",
      "Cast by starlight, raising star-pillar and starry amber",
      "Read the constellations without letting their cold draw you away",
    ],
    prerequisiteItems: [
      {
        name: "Constellations Master Potion Formula",
        description:
          "The recipe for the Sequence 5 Constellations Master potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Hermit Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Constellations Master potion, carrying the Hermit pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Constellations Master formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Constellations Master: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Constellations Master potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Mysticologist",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Mysticological Lore",
        description:
          "Wield rare and forgotten rituals others cannot, bending mystical knowledge into power",
        type: "active",
      },
      {
        name: "Spell Invention",
        description:
          "Devise wholly new spells from first principles of the mystical arts",
        type: "active",
      },
      {
        name: "Saint's Insight",
        description:
          "A Saint of Hermit reads the mystical structure of the world at a glance",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Codify the mystic arts as a Mysticologist",
      "Invent spells with a saint's insight into lore",
      "Master the swelling knowledge of a Saint without letting the lore unmoor you",
    ],
    prerequisiteItems: [
      {
        name: "Mysticologist Potion Formula",
        description:
          "The recipe for the Sequence 4 Mysticologist potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Constellations Master Characteristic",
        description:
          "The Beyonder characteristic of a Constellations Master, the core ingredient distilled for the Mysticologist advancement of the Hermit pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Mysticologist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Mysticologist: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Mysticologist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Clairvoyant",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Clairvoyance",
        description:
          "See across distance and veil, perceiving the hidden and the far away with mystical sight",
        type: "active",
      },
      {
        name: "Ritual Mastery",
        description:
          "Perform grand rituals swiftly and flawlessly, their costs and risks bowing to your skill",
        type: "active",
      },
      {
        name: "Aura of Mysteries",
        description:
          "The mystical world clarifies around you while it clouds for everyone else",
        type: "passive",
      },
    ],
    actingRequirements: [
      "See the hidden as a Clairvoyant",
      "Master ritual under an aura of mysteries",
      "Hold the human thread that keeps your sight a guide rather than a haunting",
    ],
    prerequisiteItems: [
      {
        name: "Clairvoyant Potion Formula",
        description:
          "The recipe for the Sequence 3 Clairvoyant potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Mysticologist Characteristic",
        description:
          "The Beyonder characteristic of a Mysticologist, the core ingredient distilled for the Clairvoyant advancement of the Hermit pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Mystical Knowledge, measured to the Clairvoyant formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Clairvoyant: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Clairvoyant potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Sage",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Sage's Knowing",
        description:
          "Hold the accumulated mystical wisdom of ages, answering riddles that defeat lesser mages",
        type: "active",
      },
      {
        name: "Authority of Mystical Knowledge",
        description:
          "Wield the principle of Mystical Knowledge as an Angel of the Hermit",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but draws toward the Hermit's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Know the mystic order of things as a Sage",
      "Wield the authority of mystical knowledge",
      "Anchor your overflowing spirituality before the mythical character of the Sage overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Sage Potion Formula",
        description: "The recipe for the Sequence 2 Sage potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Clairvoyant Characteristic",
        description:
          "The Beyonder characteristic of a Clairvoyant, the core ingredient distilled for the Sage advancement of the Hermit pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Sage: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Sage potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Knowledge Emperor",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Knowledge Emperor",
        description:
          "Command mystical truth itself, sealing or unsealing the deep secrets of the world",
        type: "active",
      },
      {
        name: "Grand Ritual",
        description:
          "Enact rituals on a scale that reshapes regions and rewrites local mystical law",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and unmakes you without ceaseless anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Command grand ritual as the Knowledge Emperor",
      "Work a King of Angels' rites with restraint",
      "Reign over hidden knowledge as its god, yet remember the wonder of not-knowing you began with",
    ],
    prerequisiteItems: [
      {
        name: "Knowledge Emperor Potion Formula",
        description:
          "The recipe for the Sequence 1 Knowledge Emperor potion of the Hermit pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Sage Characteristic",
        description:
          "The Beyonder characteristic of a Sage, the core ingredient distilled for the Knowledge Emperor advancement of the Hermit pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Knowledge Emperor: digest the potion through faithful acting, then perform the Hermit pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Knowledge Emperor potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Mystical Knowledge at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const paragonSequences: Sequence[] = [
  {
    level: 9,
    name: "Savant",
    classification: "Low",
    abilities: [
      {
        name: "Knowledge (Mysticism and Mechanics)",
        description:
          "Savants believe that knowledge is power and through drinking the potion, they gain new information about mysticism and mechanics",
        type: "passive",
      },
      {
        name: "Recall (Memory)",
        description: "This is the core ability of a Savant",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Master many disciplines as a Savant",
      "Pair mysticism with mechanics, recalling all you learn",
      "Build your learning brick by brick, forgetting nothing",
    ],
    prerequisiteItems: [
      {
        name: "Savant Potion Formula",
        description: "The recipe for the Sequence 9 Savant potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Paragon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Savant potion, carrying the Paragon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Savant formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Archaeologist",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancements",
        description:
          "Archaeologists possess a strong enough body and adaptable ability to face everything they may come across in their explorations",
        type: "passive",
      },
      {
        name: "Ritualistic Magic",
        description:
          "Besides that, Archaeologists will also gain knowledge that allows them to learn and cast some basic Ritualistic Magic",
        type: "active",
      },
    ],
    actingRequirements: [
      "Unearth the past as an Archaeologist",
      "Join ritual magic to patient excavation",
      "Preserve what you recover; never plunder it",
    ],
    prerequisiteItems: [
      {
        name: "Archaeologist Potion Formula",
        description:
          "The recipe for the Sequence 8 Archaeologist potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Paragon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Archaeologist potion, carrying the Paragon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Archaeologist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Archaeologist: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Archaeologist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Appraiser",
    classification: "Mid",
    abilities: [
      {
        name: "Appraisal",
        description:
          "Appraisers can intuitively understand the powers and problems of most extraordinary items and can use them while keeping the danger to the minimum",
        type: "active",
      },
      {
        name: "Beyonder Constitution",
        description: "An Appraiser's body and spirit are strengthened beyond the mundane",
        type: "active",
      },
    ],
    actingRequirements: [
      "Judge the worth of things as an Appraiser",
      "Appraise true value upon a Beyonder's frame",
      "Value by truth, not by what others will pay",
    ],
    prerequisiteItems: [
      {
        name: "Appraiser Potion Formula",
        description:
          "The recipe for the Sequence 7 Appraiser potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Paragon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Appraiser potion, carrying the Paragon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Appraiser formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Appraiser: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Appraiser potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Artisan",
    classification: "Mid",
    abilities: [
      {
        name: "Craftsmanship",
        description:
          "Artisans are the true masters of Craftsmanship both in the ordinary and mystical world, the extraordinary items that they create and accumulate, along with their capabilities as an Appraiser, allows them to reach the strength of a Sequence 5",
        type: "active",
      },
      {
        name: "Knowledge (Mysticism)",
        description: "Their abilities with Ritualistic Magic are enhanced",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Make and mend with mastery as an Artisan",
      "Join craftsmanship to mystic knowledge",
      "Let nothing leave your hands unfinished",
    ],
    prerequisiteItems: [
      {
        name: "Artisan Potion Formula",
        description:
          "The recipe for the Sequence 6 Artisan potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Paragon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Artisan potion, carrying the Paragon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Artisan formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Artisan: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Artisan potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Astronomer",
    classification: "Mid",
    abilities: [
      {
        name: "Beyonder Constitution",
        description:
          "An Astronomer's body and spirit are strengthened beyond the mundane",
        type: "passive",
      },
      {
        name: "Celestial Reckoning",
        description:
          "Read the movements of stars and heavens to chart fates, omens, and the turning of cycles",
        type: "active",
      },
    ],
    actingRequirements: [
      "Chart the heavens as an Astronomer",
      "Reckon the celestial order upon a Beyonder's frame",
      "Measure the sky precisely; never guess where you can compute",
    ],
    prerequisiteItems: [
      {
        name: "Astronomer Potion Formula",
        description:
          "The recipe for the Sequence 5 Astronomer potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Paragon Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Astronomer potion, carrying the Paragon pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Astronomer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Astronomer: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Astronomer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Alchemist",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Grand Alchemy",
        description:
          "Transmute matter and craft wondrous devices through perfected, science-grounded alchemy",
        type: "active",
      },
      {
        name: "Inventive Genius",
        description:
          "Design and build machines and constructs no mundane craftsman could conceive",
        type: "active",
      },
      {
        name: "Saint's Acumen",
        description:
          "A Saint of Paragon grasps the workings of any mechanism or system on sight",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Work grand alchemy as an Alchemist",
      "Invent and transmute with a saint's acumen",
      "Master the swelling craft of a Saint without letting invention outrun your wisdom",
    ],
    prerequisiteItems: [
      {
        name: "Alchemist Potion Formula",
        description:
          "The recipe for the Sequence 4 Alchemist potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Astronomer Characteristic",
        description:
          "The Beyonder characteristic of an Astronomer, the core ingredient distilled for the Alchemist advancement of the Paragon pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Alchemist formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Alchemist: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Alchemist potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Arcane Scholar",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Arcane Engineering",
        description:
          "Fuse arcana and craft into self-sustaining works of mystical machinery",
        type: "active",
      },
      {
        name: "Principle Analysis",
        description:
          "Lay bare the founding principles of a power or device and rebuild them to your design",
        type: "active",
      },
      {
        name: "Aura of Civilisation",
        description:
          "Tools, machines, and structures answer you readily, civilisation's craft at your fingertips",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Engineer the arcane as an Arcane Scholar",
      "Analyse first principles under an aura of civilisation",
      "Hold the human thread that keeps your works a gift to the living, not monuments to yourself",
    ],
    prerequisiteItems: [
      {
        name: "Arcane Scholar Potion Formula",
        description:
          "The recipe for the Sequence 3 Arcane Scholar potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Alchemist Characteristic",
        description:
          "The Beyonder characteristic of an Alchemist, the core ingredient distilled for the Arcane Scholar advancement of the Paragon pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Civilisation and Craft, measured to the Arcane Scholar formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Arcane Scholar: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Arcane Scholar potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Knowledge Magister",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Knowledge Magister",
        description:
          "Marshal the sum of civilisation's craft and learning to solve or build almost anything",
        type: "active",
      },
      {
        name: "Authority of Craft",
        description:
          "Wield the principle of Civilisation and Craft as an Angel of the Paragon",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but pulls toward the Paragon's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Govern craft and knowing as the Knowledge Magister",
      "Wield the authority of craft over all that is made",
      "Anchor your overflowing spirituality before the mythical character of the Knowledge Magister overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Knowledge Magister Potion Formula",
        description:
          "The recipe for the Sequence 2 Knowledge Magister potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Arcane Scholar Characteristic",
        description:
          "The Beyonder characteristic of an Arcane Scholar, the core ingredient distilled for the Knowledge Magister advancement of the Paragon pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Knowledge Magister: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Knowledge Magister potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Illuminator",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Illuminator",
        description:
          "Shed the light of knowledge that advances and orders a civilisation to your design",
        type: "active",
      },
      {
        name: "Architect of Ages",
        description: "Raise works of craft vast enough to remake a nation's foundations",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and overwrites you without unbroken anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Build the architecture of ages as the Illuminator",
      "Raise a King of Angels' works with deliberate care",
      "Reign over craft and knowledge as its god, yet remember the small hands that first taught you to make",
    ],
    prerequisiteItems: [
      {
        name: "Illuminator Potion Formula",
        description:
          "The recipe for the Sequence 1 Illuminator potion of the Paragon pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Knowledge Magister Characteristic",
        description:
          "The Beyonder characteristic of a Knowledge Magister, the core ingredient distilled for the Illuminator advancement of the Paragon pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Illuminator: digest the potion through faithful acting, then perform the Paragon pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Illuminator potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Civilisation and Craft at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const wheelOfFortuneSequences: Sequence[] = [
  {
    level: 9,
    name: "Monster",
    classification: "Low",
    abilities: [
      {
        name: "High Spirituality",
        description:
          "This Pathway has a higher Spirituality than most, and at Sequence 9, Monsters possess a high Spiritual Perception and Spiritual Intuition",
        type: "passive",
      },
      {
        name: "Foresight",
        description: "A Monster is often able to hear or see things that others cannot",
        type: "active",
      },
      {
        name: "Danger Premonition",
        description: "They have a keen intuitive premonition of danger",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Heed your premonitions as a Monster",
      "Foresee danger and let foresight guide your step",
      "Trust the omen; do not court the danger it names",
    ],
    prerequisiteItems: [
      {
        name: "Monster Potion Formula",
        description:
          "The recipe for the Sequence 9 Monster potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Wheel of Fortune Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Monster potion, carrying the Wheel of Fortune pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Monster formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Robot",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description:
          "All aspects of their physical abilities have been significantly improved",
        type: "active",
      },
      {
        name: "Mental Enhancement",
        description: "They have powerful calculation skills and very precise control",
        type: "passive",
      },
      {
        name: "High Spirituality",
        description: "They gain proficiency in Divination and Anti-Divination skills",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Move with relentless precision as a Robot",
      "Strengthen body and mind under high spirituality",
      "Hold to your purpose without wavering",
    ],
    prerequisiteItems: [
      {
        name: "Robot Potion Formula",
        description:
          "The recipe for the Sequence 8 Robot potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Wheel of Fortune Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Robot potion, carrying the Wheel of Fortune pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Robot formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Robot: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Robot potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Lucky One",
    classification: "Mid",
    abilities: [
      {
        name: "Passive Luck",
        description:
          "Lucky Ones will often encounter Lucky events in their life, such as finding money on the street, having enemies miss attacks that were aimed at them, getting desired dice rolls, and having women they happen to like coincidentally also like them back",
        type: "passive",
      },
      {
        name: "Their Luck isn't fixed and fluctuates",
        description:
          "at times, they are especially Lucky, while at other times, they are no different from an ordinary person",
        type: "active",
      },
    ],
    actingRequirements: [
      "Trust to your fortune as a Lucky One",
      "Lean on luck that shifts and never sits still",
      "Ride your luck, but never stake all upon it",
    ],
    prerequisiteItems: [
      {
        name: "Lucky One Potion Formula",
        description:
          "The recipe for the Sequence 7 Lucky One potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Wheel of Fortune Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Lucky One potion, carrying the Wheel of Fortune pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Lucky One formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Lucky One: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Lucky One potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Calamity Priest",
    classification: "Mid",
    abilities: [
      {
        name: "Calamity Attraction",
        description: "Their body will now attract Calamities, mainly in two ways",
        type: "active",
      },
      {
        name: "Psyche Storm",
        description:
          "Using their Spirituality that surpassed that of other Pathways, they can directly affect their opponent’s Spirit Body, causing them to feel dizzy and lost",
        type: "active",
      },
    ],
    actingRequirements: [
      "Draw and direct calamity as a Calamity Priest",
      "Attract misfortune and loose the psyche storm",
      "Aim the disaster you summon; never let it run wild",
    ],
    prerequisiteItems: [
      {
        name: "Calamity Priest Potion Formula",
        description:
          "The recipe for the Sequence 6 Calamity Priest potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Wheel of Fortune Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Calamity Priest potion, carrying the Wheel of Fortune pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Calamity Priest formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Calamity Priest: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Calamity Priest potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Winner",
    classification: "Mid",
    abilities: [
      {
        name: "Curse of Misfortune",
        description:
          "They can Curse their enemies with limited Misfortune, making them more Unlucky",
        type: "active",
      },
      {
        name: "Passive Luck",
        description: "To an extent, they can now begin to control their own Luck",
        type: "passive",
      },
      {
        name: "High Spirituality",
        description:
          "Their Spirituality has been greatly enhanced, causing the improvement to their Spiritual Perception and Foresight abilities",
        type: "passive",
      },
      {
        name: "Foresight",
        description:
          "A Winner possesses an inexplicable strange premonition, allowing them to make the right decisions during a situation and better maximize their chance of success",
        type: "active",
      },
    ],
    actingRequirements: [
      "Turn fortune against your foes as a Winner",
      "Lay curses of misfortune while your own luck holds",
      "Spend your fortune wisely; it is never owed to you",
    ],
    prerequisiteItems: [
      {
        name: "Winner Potion Formula",
        description:
          "The recipe for the Sequence 5 Winner potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Wheel of Fortune Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Winner potion, carrying the Wheel of Fortune pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Winner formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Winner: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Winner potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Misfortune Mage",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Misfortune Curse",
        description:
          "Lay ruinous bad luck on a target, accidents and failures gathering around them",
        type: "active",
      },
      {
        name: "Fortune Reading",
        description:
          "Read the branching possibilities of fate and nudge events toward the outcome you want",
        type: "active",
      },
      {
        name: "Saint's Providence",
        description:
          "A Saint of the Wheel turns chance in their favour, narrow escapes becoming routine",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Curse and read fate as a Misfortune Mage",
      "Lay misfortune and read fortune with a saint's providence",
      "Master the swelling fate of a Saint without coming to believe yourself its master",
    ],
    prerequisiteItems: [
      {
        name: "Misfortune Mage Potion Formula",
        description:
          "The recipe for the Sequence 4 Misfortune Mage potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Winner Characteristic",
        description:
          "The Beyonder characteristic of a Winner, the core ingredient distilled for the Misfortune Mage advancement of the Wheel of Fortune pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Misfortune Mage formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Misfortune Mage: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Misfortune Mage potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Chaoswalker",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Chaoswalking",
        description:
          "Step through improbable paths, slipping between possibilities to be where fate did not expect",
        type: "active",
      },
      {
        name: "Probability Shift",
        description: "Tilt the odds of an event sharply toward success or catastrophe",
        type: "active",
      },
      {
        name: "Aura of Fortune",
        description: "Luck warps around you — allies find chances, foes meet mishap",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk unscathed through chaos as a Chaoswalker",
      "Shift probability under an aura of fortune",
      "Hold the human thread that keeps fate a current you ride, not a throne you claim",
    ],
    prerequisiteItems: [
      {
        name: "Chaoswalker Potion Formula",
        description:
          "The recipe for the Sequence 3 Chaoswalker potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Misfortune Mage Characteristic",
        description:
          "The Beyonder characteristic of a Misfortune Mage, the core ingredient distilled for the Chaoswalker advancement of the Wheel of Fortune pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to the Possibility of Fate, measured to the Chaoswalker formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Chaoswalker: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Chaoswalker potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Soothsayer",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Soothsaying",
        description:
          "Foretell the shape of fate with uncanny accuracy and steer events along its threads",
        type: "active",
      },
      {
        name: "Authority of Fate",
        description:
          "Wield the Possibility of Fate as an Angel, bending probability across a region",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but draws toward the Wheel's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Speak the turns of fate as a Soothsayer",
      "Wield the authority of fate over all that may befall",
      "Anchor your overflowing spirituality before the mythical character of the Soothsayer overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Soothsayer Potion Formula",
        description:
          "The recipe for the Sequence 2 Soothsayer potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Chaoswalker Characteristic",
        description:
          "The Beyonder characteristic of a Chaoswalker, the core ingredient distilled for the Soothsayer advancement of the Wheel of Fortune pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Soothsayer: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Soothsayer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Snake of Mercury",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Snake of Mercury",
        description:
          "Coil through the possibilities of fate, rewriting which future comes to pass",
        type: "active",
      },
      {
        name: "Decree of Fortune",
        description:
          "Pronounce a fortune or doom that the threads of fate hasten to fulfil",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and dissolves you without unfailing anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Decree fortune as the Snake of Mercury",
      "Hand down a King of Angels' fate with care",
      "Reign over fortune as its god, yet remember the gamble that once made you mortal",
    ],
    prerequisiteItems: [
      {
        name: "Snake of Mercury Potion Formula",
        description:
          "The recipe for the Sequence 1 Snake of Mercury potion of the Wheel of Fortune pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Soothsayer Characteristic",
        description:
          "The Beyonder characteristic of a Soothsayer, the core ingredient distilled for the Snake of Mercury advancement of the Wheel of Fortune pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Snake of Mercury: digest the potion through faithful acting, then perform the Wheel of Fortune pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Snake of Mercury potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to the Possibility of Fate at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const abyssSequences: Sequence[] = [
  {
    level: 9,
    name: "Criminal",
    classification: "Low",
    abilities: [
      {
        name: "Physical Enhancement",
        description: "They possess a strong body with keen instincts",
        type: "passive",
      },
      {
        name: "Beyonder Constitution",
        description: "A Criminal's body and spirit are strengthened beyond the mundane",
        type: "active",
      },
    ],
    actingRequirements: [
      "Take what you want as a Criminal",
      "Strengthen body and frame for the deed",
      "Answer to your own desire, but leave yourself a way back",
    ],
    prerequisiteItems: [
      {
        name: "Criminal Potion Formula",
        description: "The recipe for the Sequence 9 Criminal potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Abyss Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Criminal potion, carrying the Abyss pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Criminal formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Unwinged Angel",
    classification: "Low",
    abilities: [
      {
        name: "Demonic Attribute",
        description:
          "Upon entering this Sequence, they will undergo inhuman changes, acquiring two or three Devil Spell-like abilities in the process that vary from person to person",
        type: "active",
      },
      {
        name: "Physical Enhancements",
        description: "Their bodies are further strengthened",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bear the fallen mark as an Unwinged Angel",
      "Wield your demonic attribute with raw strength",
      "Fall toward power without falling out of yourself",
    ],
    prerequisiteItems: [
      {
        name: "Unwinged Angel Potion Formula",
        description:
          "The recipe for the Sequence 8 Unwinged Angel potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Abyss Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Unwinged Angel potion, carrying the Abyss pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Unwinged Angel formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Unwinged Angel: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Unwinged Angel potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Serial Killer",
    classification: "Mid",
    abilities: [
      {
        name: "Knowledge (Devil Worship)",
        description:
          "Upon advancement, a Serial Killer will gain a wealth of and master all kinds of knowledge related to Devil worship and it's Ritualistic Magic",
        type: "passive",
      },
      {
        name: "Enhanced Mental Attributes",
        description:
          "Upon drinking this Sequence 7 potion, a Serial Killer's intelligence and mental capabilities will be enhanced to a certain degree",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Hunt and indulge the forbidden as a Serial Killer",
      "Wield devil-worship's knowledge with a cold mind",
      "Feed the abyss only what you choose, and keep the rest",
    ],
    prerequisiteItems: [
      {
        name: "Serial Killer Potion Formula",
        description:
          "The recipe for the Sequence 7 Serial Killer potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Abyss Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Serial Killer potion, carrying the Abyss pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Serial Killer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Serial Killer: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Serial Killer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Devil",
    classification: "Mid",
    abilities: [
      {
        name: "Devil Bloodline",
        description:
          "Different Devils morphed from being a Serial Killer will have individual differences",
        type: "passive",
      },
      {
        name: "Shadow-Shifter",
        description:
          "When forced into a life-threatening situation, this type of Devil can escape with their bodies and leave only a shadow behind",
        type: "active",
      },
      {
        name: "Danger Premonition",
        description:
          "They can sense and grasp the place of origin of danger, as well as who this danger is from",
        type: "passive",
      },
      {
        name: "Slow",
        description:
          "This causes all targets within a 7-8 meter radius to instantly turn numb and slow or even come to a halt, however, it can only be maintained for 2 seconds",
        type: "active",
      },
    ],
    actingRequirements: [
      "Stir desire and dread as a Devil",
      "Shift through shadow on a devil's bloodline",
      "Tempt and unmake, but do not believe your own lies",
    ],
    prerequisiteItems: [
      {
        name: "Devil Potion Formula",
        description: "The recipe for the Sequence 6 Devil potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Abyss Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Devil potion, carrying the Abyss pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Devil formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Devil: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Devil potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Desire Apostle",
    classification: "Mid",
    abilities: [
      {
        name: "Desire Mastery",
        description:
          "Desire Apostles can utilize and control every existence's emotions and Desires",
        type: "passive",
      },
      {
        name: "Avatar of Desire",
        description:
          "Desire Apostles can transform their body into being an illusionary, thick, black liquid form that is a collection of condensed emotions and Desires given a semi-visible form",
        type: "active",
      },
    ],
    actingRequirements: [
      "Preach and master desire as a Desire Apostle",
      "Become the avatar of the desires you command",
      "Rule desire, lest it come to rule you",
    ],
    prerequisiteItems: [
      {
        name: "Desire Apostle Potion Formula",
        description:
          "The recipe for the Sequence 5 Desire Apostle potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Abyss Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Desire Apostle potion, carrying the Abyss pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Desire Apostle formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Desire Apostle: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Desire Apostle potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Demon",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Demonic Might",
        description:
          "Wield the raw strength and corruption of a demon, twisting flesh and will alike",
        type: "active",
      },
      {
        name: "Desire's Hook",
        description:
          "Read and inflame the desires of others, drawing them into corruption and ruin",
        type: "active",
      },
      {
        name: "Saint's Corruption",
        description:
          "A Saint of the Abyss festers and endures, wounds and poisons turned to fuel",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Loose demonic might as a Demon",
      "Hook the hearts of others with a saint's corruption",
      "Master the swelling corruption of a Saint without letting desire devour your purpose",
    ],
    prerequisiteItems: [
      {
        name: "Demon Potion Formula",
        description: "The recipe for the Sequence 4 Demon potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Desire Apostle Characteristic",
        description:
          "The Beyonder characteristic of a Desire Apostle, the core ingredient distilled for the Demon advancement of the Abyss pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Demon formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Demon: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Demon potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Blatherer",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Maddening Word",
        description:
          "Speak corrupting truths that erode sanity and fracture the resolve of all who hear",
        type: "active",
      },
      {
        name: "Abyssal Reach",
        description:
          "Extend tendrils of desire and decay across a place, snaring it in corruption",
        type: "active",
      },
      {
        name: "Aura of the Abyss",
        description:
          "Order and virtue rot in your presence as the world tilts toward desire",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Madden with a word as a Blatherer",
      "Reach across the abyss under its own aura",
      "Hold the human thread that keeps your voice a temptation borne, not a poison loosed",
    ],
    prerequisiteItems: [
      {
        name: "Blatherer Potion Formula",
        description:
          "The recipe for the Sequence 3 Blatherer potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Demon Characteristic",
        description:
          "The Beyonder characteristic of a Demon, the core ingredient distilled for the Blatherer advancement of the Abyss pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Desire and Corruption, measured to the Blatherer formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Blatherer: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Blatherer potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Bloody Archduke",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Bloody Archduke",
        description:
          "Rule the corrupt as a lord of the Abyss, your decrees binding the fallen to you",
        type: "active",
      },
      {
        name: "Authority of Desire",
        description:
          "Wield the principle of Desire and Corruption as an Angel of the Abyss",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but slides toward the Abyss's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Preside over corruption as the Bloody Archduke",
      "Wield the authority of desire over all who want",
      "Anchor your overflowing spirituality before the mythical character of the Bloody Archduke overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Bloody Archduke Potion Formula",
        description:
          "The recipe for the Sequence 2 Bloody Archduke potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Blatherer Characteristic",
        description:
          "The Beyonder characteristic of a Blatherer, the core ingredient distilled for the Bloody Archduke advancement of the Abyss pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Bloody Archduke: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Bloody Archduke potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Filthy Monarch",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Filthy Monarch",
        description:
          "Reign over corruption itself, remaking a domain into a court of indulgence and decay",
        type: "active",
      },
      {
        name: "Tide of Corruption",
        description:
          "Loose a flood of desire and rot that drowns the will of a city in the Abyss",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality borders on godhood and consumes you without ceaseless anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Loose the tide of corruption as the Filthy Monarch",
      "Command a King of Angels' desire with deliberate aim",
      "Reign over desire as its god, yet remember the clean, wanting world you rose from",
    ],
    prerequisiteItems: [
      {
        name: "Filthy Monarch Potion Formula",
        description:
          "The recipe for the Sequence 1 Filthy Monarch potion of the Abyss pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Bloody Archduke Characteristic",
        description:
          "The Beyonder characteristic of a Bloody Archduke, the core ingredient distilled for the Filthy Monarch advancement of the Abyss pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Filthy Monarch: digest the potion through faithful acting, then perform the Abyss pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Filthy Monarch potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Desire and Corruption at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const chainedSequences: Sequence[] = [
  {
    level: 9,
    name: "Prisoner",
    classification: "Low",
    abilities: [
      {
        name: "Knowledge (Criminal)",
        description:
          "Upon advancement, Prisoners will gain knowledge of a variety of abilities that designate one as not only an expert convict but also a master of breaking free from prisons",
        type: "passive",
      },
      {
        name: "Physical Enhancement",
        description:
          "The Beyonders of this Sequence possess strong bodies and keen senses, often possessing not only a staid appearance but also a crazy heart within them",
        type: "passive",
      },
      {
        name: "Binding",
        description:
          "Upon advancement by drinking the Prisoner potion, they will find that their Spirituality and Desires are being constrained by reason, body, and the world",
        type: "active",
      },
    ],
    actingRequirements: [
      "Endure and break bonds as a Prisoner",
      "Strengthen the body and master what binds",
      "Bear your chains without letting them break your mind",
    ],
    prerequisiteItems: [
      {
        name: "Prisoner Potion Formula",
        description:
          "The recipe for the Sequence 9 Prisoner potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 9 Chained Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Prisoner potion, carrying the Chained pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Prisoner formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Lunatic",
    classification: "Low",
    abilities: [
      {
        name: "Berserk",
        description:
          "A Lunatic 's greatest characteristic is to be able to autonomously sacrifice their rationality and let their Desires run amok in exchange for strength and enhancements in every aspect of themselves",
        type: "active",
      },
      {
        name: "Binding",
        description:
          "Lunatics are Bound and restrained in both body and Soul, which makes it difficult to obtain useful information on them by just relying on Spirit Channeling and Divination",
        type: "active",
      },
      {
        name: "Lunatic's Curse",
        description:
          "Starting and from this Sequence onwards, they will begin to be affected by Curses",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Loose your fury as a Lunatic",
      "Go berserk and bind under the lunatic's curse",
      "Court madness without surrendering to it",
    ],
    prerequisiteItems: [
      {
        name: "Lunatic Potion Formula",
        description:
          "The recipe for the Sequence 8 Lunatic potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 8 Chained Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Lunatic potion, carrying the Chained pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Lunatic formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Lunatic: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Lunatic potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 7,
    name: "Werewolf",
    classification: "Mid",
    abilities: [
      {
        name: "Werewolf Transformation",
        description:
          "They can turn into a Werewolf, growing short, erect hair as fur, turning their nails sharp, long, and firm, like claws, while possessing some Spell-like abilities",
        type: "active",
      },
      {
        name: "Werewolf Infection",
        description:
          "When their venom infiltrates a target's body over a period of time, they can gradually turn the target into a monster similar to that of a Werewolf",
        type: "active",
      },
      {
        name: "Darkness Encroachment",
        description:
          "They can make the Darkness grow heavier and condense like frost, slowly but firmly seeping into their target's skin, flesh, and bones",
        type: "active",
      },
      {
        name: "Physical Enhancement",
        description:
          "Even without transforming, a Werewolf's extreme speed will form afterimages",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Take the beast's shape as a Werewolf",
      "Spread the infection as darkness encroaches",
      "Master the change; never let the beast keep the reins",
    ],
    prerequisiteItems: [
      {
        name: "Werewolf Potion Formula",
        description:
          "The recipe for the Sequence 7 Werewolf potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 7 Chained Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Werewolf potion, carrying the Chained pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Werewolf formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Werewolf: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Werewolf potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 6,
    name: "Zombie",
    classification: "Mid",
    abilities: [
      {
        name: "Zombie Transformation",
        description:
          "They are able to turn into a special type of Zombie, one that possesses powerful defense, strength, and Spell-like capabilities",
        type: "active",
      },
      {
        name: "Zombie Strength",
        description:
          "Their strength has been raised significantly from their Werewolf state",
        type: "active",
      },
      {
        name: "Ice Control",
        description: "They have some Ice and Frost mastery, which is different from a",
        type: "active",
      },
      {
        name: "Contact-Freeze",
        description:
          "Any physical attack from a Zombie that makes contact with a target's skin can Freeze their body, stiffening their flesh and blood",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Endure past death as a Zombie",
      "Wield undying strength and the freezing cold",
      "Hold your mind together though the body rots",
    ],
    prerequisiteItems: [
      {
        name: "Zombie Potion Formula",
        description: "The recipe for the Sequence 6 Zombie potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 6 Chained Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Zombie potion, carrying the Chained pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Zombie formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Zombie: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Zombie potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 5,
    name: "Wraith",
    classification: "Mid",
    abilities: [
      {
        name: "Wraith Transformation",
        description:
          "They are able to turn themselves into a Spirit Body, a Wraith, thus obtaining all the general corresponding powers and special traits",
        type: "active",
      },
      {
        name: "Invisibility",
        description:
          "Wraiths are able to turn Invisible; however, unlike other ordinary non Chained Pathway Beyonder Wraiths and spirits, this is more effective",
        type: "active",
      },
      {
        name: "Wraith Shriek",
        description:
          "Wraiths are able to let out a sharp shriek that can directly attack the opponents' Spirit Body and induce spiritual damage across a huge area",
        type: "active",
      },
      {
        name: "Possession",
        description:
          "Wraiths have gained the supernatural ability to forcefully invade and Possess their target's body by overlapping with the opponent's eyes",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Haunt unseen as a Wraith",
      "Turn invisible, shriek, and possess the living",
      "Drift and possess without forgetting which body is your own",
    ],
    prerequisiteItems: [
      {
        name: "Wraith Potion Formula",
        description: "The recipe for the Sequence 5 Wraith potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Chained Beyonder Characteristic",
        description:
          "The core supernatural ingredient of the Wraith potion, carrying the Chained pathway's imprint",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Wraith formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Wraith: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Wraith potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 4,
    name: "Puppet",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Puppet Strings",
        description:
          "Seize the dead and the broken-willed as puppets, fielding a host of the controlled",
        type: "active",
      },
      {
        name: "Madness Contagion",
        description:
          "Spread mutation and madness through touch and proximity, unmaking minds and bodies",
        type: "active",
      },
      {
        name: "Saint's Undeath",
        description:
          "A Saint of the Chained shrugs off death, mending from wounds that should be fatal",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Pull the strings of the dead as a Puppet",
      "Spread madness through a saint's undeath",
      "Master the swelling madness of a Saint without losing which hand pulls your own strings",
    ],
    prerequisiteItems: [
      {
        name: "Puppet Potion Formula",
        description: "The recipe for the Sequence 4 Puppet potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Wraith Characteristic",
        description:
          "The Beyonder characteristic of a Wraith, the core ingredient distilled for the Puppet advancement of the Chained pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Puppet formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Puppet: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Puppet potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 3,
    name: "Disciple of Silence",
    classification: "High",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Silent Discipline",
        description:
          "Bind the dead and the mad to absolute silence and obedience under your will",
        type: "active",
      },
      {
        name: "Mutating Touch",
        description:
          "Reshape flesh into monstrous new forms, your own or another's, at a touch",
        type: "active",
      },
      {
        name: "Aura of Madness",
        description:
          "Sanity frays and the dead stir around you as the chains of reason loosen",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Keep the silent discipline as a Disciple of Silence",
      "Mutate with a touch under an aura of madness",
      "Hold the human thread that keeps your silence a vigil rather than a void",
    ],
    prerequisiteItems: [
      {
        name: "Disciple of Silence Potion Formula",
        description:
          "The recipe for the Sequence 3 Disciple of Silence potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Puppet Characteristic",
        description:
          "The Beyonder characteristic of a Puppet, the core ingredient distilled for the Disciple of Silence advancement of the Chained pathway",
        category: "main-ingredient",
      },
      {
        name: "Symbolic Supplementary Ingredients",
        description:
          "Rare materials attuned to Madness and Mutation, measured to the Disciple of Silence formula's exacting proportions",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Disciple of Silence: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Disciple of Silence potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 2,
    name: "Ancient Bane",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Ancient Bane",
        description:
          "Loose an ancient plague of madness and mutation upon a region's living and dead",
        type: "active",
      },
      {
        name: "Authority of Madness",
        description:
          "Wield the principle of Madness and Mutation as an Angel of the Chained",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's spirituality nears immortality but drags toward the Chained's myth without anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Become the Ancient Bane the world dreads",
      "Wield the authority of madness over sound minds",
      "Anchor your overflowing spirituality before the mythical character of the Ancient Bane overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Ancient Bane Potion Formula",
        description:
          "The recipe for the Sequence 2 Ancient Bane potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Disciple of Silence Characteristic",
        description:
          "The Beyonder characteristic of a Disciple of Silence, the core ingredient distilled for the Ancient Bane advancement of the Chained pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Ancient Bane: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Ancient Bane potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
  {
    level: 1,
    name: "Abomination",
    classification: "Demigod",
    // Corpus-grounded (issue #120): the sequence NAME is canon (wiki
    // Module:Sequence/standard) and the Seq 4-1 `abilities` below are OVERLAID at
    // module load from the corpus-derived DEMIGOD_ABILITIES (demigod-abilities.ts,
    // sourced from the wiki `<Pathway>/Abilities` pages). The hand-authored
    // arrays here are the pre-overlay fallback; acting requirements stay a
    // generic per-rung template where the corpus gives no acting text.
    abilities: [
      {
        name: "Abomination",
        description:
          "Become a horror of fused flesh and undeath, near-impossible to slay or restrain",
        type: "active",
      },
      {
        name: "Legion of the Dead",
        description:
          "Raise and command a legion of the dead and the mutated as their abominable sovereign",
        type: "active",
      },
      {
        name: "King of Angels' Spirituality",
        description:
          "A King of Angels' spirituality verges on godhood and unmakes you without unbroken anchors",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Raise the legion of the dead as an Abomination",
      "Command a King of Angels' madness with deliberate aim",
      "Reign over madness and death as its god, yet remember the sane, living self you began as",
    ],
    prerequisiteItems: [
      {
        name: "Abomination Potion Formula",
        description:
          "The recipe for the Sequence 1 Abomination potion of the Chained pathway",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Ancient Bane Characteristic",
        description:
          "The Beyonder characteristic of an Ancient Bane, the core ingredient distilled for the Abomination advancement of the Chained pathway",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Advance beyond Abomination: digest the potion through faithful acting, then perform the Chained pathway's ascent rite without losing yourself",
      requirements: [
        "Fully digest the Abomination potion by acting in accordance with the sequence",
        "Carry out the ritual aligned to Madness and Mutation at the proper place and hour",
        "Anchor your self-consciousness against the surge of new characteristic and emerge unchanged",
      ],
    },
  },
];

const foolSequences: Sequence[] = [
  {
    level: 9,
    name: "Seer",
    classification: "Low",
    abilities: [
      {
        name: "Spirit Vision",
        description: "Perceive the spirit world and see lingering spiritual traces",
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
        description: "Sense danger and anomalies through subtle spiritual perception",
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
        name: "Lavos Squid Blood",
        description:
          "10 milliliters of blood from a Lavos Squid, a deep-sea supernatural creature",
        category: "main-ingredient",
      },
      {
        name: "Star Crystal",
        description: "50 grams of crystallised starlight energy",
        category: "main-ingredient",
      },
      {
        name: "Night Vanilla",
        description:
          "13 drops of liquid from Night Vanilla, which blooms only in darkness",
        category: "supplementary-ingredient",
      },
      {
        name: "Gold Mint Leaves",
        description: "7 leaves of Gold Mint, a rare herb associated with clarity of mind",
        category: "supplementary-ingredient",
      },
      {
        name: "Poison Hemlock",
        description: "3 drops of Poison Hemlock juice, carefully measured",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Blood Grass",
        description:
          "9 grams of powdered Dragon Blood Grass, a crimson herb found near ancient remains",
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
        description: "Misdirect attention using performance and sleight of hand",
        type: "active",
      },
      {
        name: "Flame Manipulation",
        description: "Control small flames for performance and combat",
        type: "active",
      },
      {
        name: "Paper Figurine Substitution",
        description: "Substitute a paper figurine for yourself to escape danger",
        type: "active",
      },
      {
        name: "Enhanced Agility",
        description: "Supernatural nimbleness and acrobatic ability",
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
        name: "Hornacis Mountain Goat Horn Crystal",
        description:
          "A crystal formed from the horn of a matured Hornacis Gray Mountain Goat",
        category: "main-ingredient",
      },
      {
        name: "Human-Faced Rose",
        description:
          "A complete stalk of a Human-Faced Rose, a supernatural flower with a human visage at its centre",
        category: "main-ingredient",
      },
      {
        name: "Tornapple Juice",
        description: "5 drops of juice from a Tornapple (jimsonweed), carefully measured",
        category: "supplementary-ingredient",
      },
      {
        name: "Black-Rimmed Sunflower",
        description: "Powdered petals of a Black-Rimmed Sunflower",
        category: "supplementary-ingredient",
      },
      {
        name: "Golden Cloak Grass",
        description: "Powdered Golden Cloak Grass",
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
        description: "Transfer damage from yourself to a connected object or person",
        type: "active",
      },
      {
        name: "Seal",
        description: "Create mystical seals to bind or contain supernatural entities",
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
        name: "Fog Tree Person Root",
        description:
          "The true root of a Fog Tree Person (Mist Treant), a humanoid tree creature native to fog-shrouded regions",
        category: "main-ingredient",
      },
      {
        name: "Evil-Patterned Black Panther Spinal Fluid",
        description:
          "Spinal fluid from an Evil-Patterned Black Panther, a Beyonder beast with dark-marked hide",
        category: "main-ingredient",
      },
      {
        name: "Fog Tree Sap",
        description: "30 ml of sap from a Fog Tree Person",
        category: "supplementary-ingredient",
      },
      {
        name: "Aqueous Gemstone Powder",
        description: "3 grams of finely ground aqueous gemstone",
        category: "supplementary-ingredient",
      },
      {
        name: "Hallucinogenic Grass Oil",
        description: "4 drops of essential oil from hallucinogenic grass",
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
        description: "Reshape your body to squeeze through gaps or resist blunt impacts",
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
        name: "Thousand-Faced Hunter Mutant Pituitary Gland",
        description:
          "The mutated pituitary gland from a Thousand-Faced Hunter, a shapeshifting Beyonder beast",
        category: "main-ingredient",
      },
      {
        name: "Characteristic of a Human-Skinned Shadow",
        description:
          "The supernatural characteristic of a Human-Skinned Shadow, a creature that wears human skin",
        category: "main-ingredient",
      },
      {
        name: "Thousand-Faced Hunter Blood",
        description: "80 ml of blood from a Thousand-Faced Hunter",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Tornapple Juice",
        description: "5 drops of juice from Black Tornapple (black jimsonweed)",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Tooth Grass Powder",
        description: "10 grams of powdered Dragon Tooth Grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep-Sea Naga Hair",
        description: "Three strands of hair from a Deep-Sea Naga",
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
        description: "Greatly enhanced ability to detect and read spiritual fluctuations",
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
        name: "Dust of Ancient Wraiths",
        description:
          "Powdered dust from Ancient Wraiths — spirits of exceptional age and power",
        category: "main-ingredient",
      },
      {
        name: "Core Crystal of a Six-Winged Gargoyle",
        description: "The crystal core left when a Six-Winged Gargoyle is destroyed",
        category: "main-ingredient",
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
  {
    level: 4,
    name: "Bizarro Sorcerer",
    classification: "High",
    abilities: [
      {
        name: "Spirit Worm Gifting",
        description:
          "Implant Spirit Worms into marionettes so your puppets wield Beyonder powers of their own, fielding an army of sorcerous thralls",
        type: "active",
      },
      {
        name: "Extended Marionette Control",
        description:
          "Seize and puppet bodies at vastly greater range, threading control across a city without a visible line",
        type: "active",
      },
      {
        name: "Sorcerer's Concealment",
        description:
          "Veil yourself and your strings from divination and ordinary sight, working unseen behind every scene",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Direct every conflict from the shadows through gifted thralls — never expose your own hand",
      "Treat the powers you bestow as extensions of your will, not gifts freely given",
      "Master the swelling spirituality of a Saint without letting the Sorcerer's grandeur consume you",
    ],
    prerequisiteItems: [
      {
        name: "Bizarro Sorcerer Potion Formula",
        description: "The recipe for the Sequence 4 Bizarro Sorcerer potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Marionettist Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Marionettist of the Fool pathway",
        category: "main-ingredient",
      },
      {
        name: "Crystallised Spirit Worm Brood",
        description:
          "A living brood of Spirit Worms preserved in spirit-crystal, the seed of every gifted thrall",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of the Fool: gather your marionettes and gifted thralls into a single congregation and consume the potion as their unquestioned master",
      requirements: [
        "Assemble a flock of marionettes and Spirit-Worm-gifted thralls bound wholly to your will",
        "Consume the Saint's potion at the heart of that gathered congregation",
        "Hold your own self intact as the Sorcerer's spirituality floods in, refusing to be drowned by the role",
      ],
    },
  },
  {
    level: 3,
    name: "Scholar of Yore",
    classification: "High",
    abilities: [
      {
        name: "Historical Void Borrowing",
        description:
          "Reach into history and borrow the strength, knowledge, and deeds of who you once were, projecting past selves into the present",
        type: "active",
      },
      {
        name: "History Concealment",
        description:
          "Hide a person, place, or event within history itself, erasing it from the present until you choose to restore it",
        type: "active",
      },
      {
        name: "Mastery of the Past",
        description:
          "Perceive the true history layered beneath the present and resist all attempts to rewrite your own",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Treat history as a library to be read, borrowed from, and guarded — never carelessly altered",
      "Hold your identity across every past self you call upon, lest you lose which one is truly you",
      "Carry the weight of accumulated yore without letting the Scholar's detachment hollow you out",
    ],
    prerequisiteItems: [
      {
        name: "Scholar of Yore Potion Formula",
        description: "The recipe for the Sequence 3 Scholar of Yore potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Bizarro Sorcerer Characteristic",
        description:
          "The Beyonder characteristic of a Bizarro Sorcerer, the only true ingredient a Saint's advancement demands",
        category: "main-ingredient",
      },
      {
        name: "Page Torn From Lost History",
        description:
          "A fragment of record so old its events have fallen out of the present world's memory",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Project a true self out of your own history and merge its accumulated yore back into the present as you digest the potion",
      requirements: [
        "Borrow a past self across the void of history and make it manifest in the present",
        "Reconcile its memories and strength with your own without fracturing into many selves",
        "Consume the potion at the moment of reunion, anchoring the borrowed history to your one identity",
      ],
    },
  },
  {
    level: 2,
    name: "Miracle Invoker",
    classification: "Demigod",
    abilities: [
      {
        name: "Invocation of Miracles",
        description:
          "Speak miracles into being — alter fortune, bend probability, and accomplish the impossible by the authority of the Fool",
        type: "active",
      },
      {
        name: "Mysteries Mastery",
        description:
          "Command secrets, fog, and concealment on a near-absolute scale, hiding entire truths from the world",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality so exceeds your flesh that ordinary harm cannot touch you — but it strains constantly to overflow into the mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Wield miracles with the restraint of one who knows each invocation tempts the Sequence's mythical character closer",
      "Anchor your overflowing spirituality before it dissolves you into the symbol of the Fool",
      "Bear the loneliness of a near-Angel without surrendering the human thread that keeps you yourself",
    ],
    prerequisiteItems: [
      {
        name: "Miracle Invoker Potion Formula",
        description: "The recipe for the Sequence 2 Miracle Invoker potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Scholar of Yore Characteristic",
        description:
          "The Beyonder characteristic of a Scholar of Yore — of the nine Fool characteristics that may ever exist, one must be free for this advancement",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Invoke a true miracle as the centrepiece of your advancement, proving you can wield the Fool's authority without dissolving into it",
      requirements: [
        "Prepare anchors enough to bind the surge of spirituality the potion will unleash",
        "Invoke a genuine miracle at the climax of the rite, channelling the Fool's authority through yourself",
        "Withstand the pull of the mythical character as the potion digests, holding to your own name",
      ],
    },
  },
  {
    level: 1,
    name: "Attendant of Mysteries",
    classification: "Demigod",
    abilities: [
      {
        name: "Sea of Fog",
        description:
          "Generate a vast grey fog that lowers temperature, swallows light, and hides whole districts within its mysteries",
        type: "active",
      },
      {
        name: "Greater Substitution",
        description:
          "Qualitatively upgraded Paper Figurine Substitution — slip death, fate, and catastrophe onto a prepared substitute",
        type: "active",
      },
      {
        name: "Authority of Secrets and Change",
        description:
          "Command secrets, disguise, and transformation at the Angel tier, rewriting how the world perceives a thing",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds inexorably toward the mythical form of the Fool",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Sequence's mythical character",
      "Serve the mysteries as their attendant, neither hoarding nor squandering the Fool's secrets",
      "Hold the line between attending the Fool and becoming the Fool, every single day",
    ],
    prerequisiteItems: [
      {
        name: "Attendant of Mysteries Potion Formula",
        description: "The recipe for the Sequence 1 Attendant of Mysteries potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Miracle Invoker Characteristic",
        description:
          "The Beyonder characteristic of a Miracle Invoker, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Fool: consecrate your anchors, spread the Sea of Fog over a consecrated place, and digest the potion within it without being unmade",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Raise the Sea of Fog over a place sworn to you and consume the potion at its heart",
        "Endure the mythical character of the Fool pressing to overwrite you, and emerge still yourself",
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
        description: "Quickly analyze a person's psychological state and motivations",
        type: "active",
      },
      {
        name: "Enhanced Perception",
        description: "Heightened awareness of subtle social and environmental cues",
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
        name: "Phantom Lizard Pituitary Gland",
        description:
          "The complete pituitary gland of a Phantom Lizard, a supernatural reptile with perception-warping properties",
        category: "main-ingredient",
      },
      {
        name: "Half-Ghost Rabbit Spinal Fluid",
        description:
          "10 ml of spinal fluid from a Half-Ghost Rabbit, which exists partially in the spirit world",
        category: "main-ingredient",
      },
      {
        name: "Chestnut Spores",
        description: "5 grams of Chestnut Spores",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Apricot Powder",
        description: "8 grams of powdered Dragon Apricot",
        category: "supplementary-ingredient",
      },
      {
        name: "Fairy Flower Petals",
        description: "Three pure white petals from a Fairy Flower",
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
        description: "Read surface thoughts and send mental messages to others",
        type: "active",
      },
      {
        name: "Mental Shield",
        description: "Construct a psychic barrier to protect against mental intrusion",
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
        name: "Fruit of the Tree of Elders",
        description:
          "A fruit from the Tree of Elders, an ancient tree associated with accumulated wisdom and perception",
        category: "main-ingredient",
      },
      {
        name: "Mirror Dragon Eyes",
        description:
          "A pair of eyes from a Mirror Dragon — a creature whose gaze reflects the minds of others",
        category: "main-ingredient",
      },
      {
        name: "Chestnut Spores",
        description: "5 grams of Chestnut Spores",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Tooth Grass Powder",
        description: "8 grams of powdered Dragon Tooth Grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Pure White Elf Flowers",
        description: "Three petals from Pure White Elf Flowers",
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
        description: "Dive into a subject's subconscious to uncover hidden memories",
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
        name: "Psychic Dragon Pituitary Gland",
        description: "The complete pituitary gland of an adolescent Psychic Dragon",
        category: "main-ingredient",
      },
      {
        name: "Black Monitor Lizard Spinal Fluid",
        description: "60 ml of spinal fluid from a Black Monitor Lizard",
        category: "main-ingredient",
      },
      {
        name: "Hallucinogenic Landscape Tree Fruit",
        description:
          "One fruit from a hallucinogenic landscape tree, which distorts perception in its vicinity",
        category: "main-ingredient",
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
        description: "Place multiple targets into a hypnotic trance simultaneously",
        type: "active",
      },
      {
        name: "Memory Manipulation",
        description: "Alter, erase, or implant specific memories in a target's mind",
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
        description: "Passive aura that makes weaker-willed individuals more suggestible",
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
        description: "The central eye of a spider that hunts within dreams",
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
      description: "Enter and fully control the dream of a Beyonder-level target",
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
        description: "Open a gateway to the dream world and traverse it physically",
        type: "active",
      },
      {
        name: "Dream Materialization",
        description: "Pull objects and entities from the dream world into reality",
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
        name: "Adult Mind Dragon Blood",
        description: "100 ml of blood from an adult Mind Dragon",
        category: "main-ingredient",
      },
      {
        name: "Adult Mind Dragon Scales",
        description: "Three scales from an adult Mind Dragon",
        category: "main-ingredient",
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
  {
    level: 4,
    name: "Manipulator",
    classification: "High",
    abilities: [
      {
        name: "Mind Island Invasion",
        description:
          "Enter the Sea of Collective Subconscious and seize the Mind Islands of others for mass mind control",
        type: "active",
      },
      {
        name: "Virtual Personas",
        description:
          "Spin off up to thirteen autonomous virtual personalities to think, scheme, and act in parallel",
        type: "active",
      },
      {
        name: "Mental Plague",
        description:
          "Loose a contagious psychic affliction that spreads madness or compulsion from mind to mind",
        type: "active",
      },
      {
        name: "Mind Storm",
        description:
          "Wrack an enemy's psyche with a tempest of intrusive thought and dread",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steer minds and crowds from behind the veil of the subconscious, never showing your true hand",
      "Keep your virtual personas accountable to one will — yours — lest a fragment usurp you",
      "Carry a Saint's swelling spirituality without letting the Manipulator's contempt for free will become your own",
    ],
    prerequisiteItems: [
      {
        name: "Manipulator Potion Formula",
        description: "The recipe for the Sequence 4 Manipulator potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Dreamwalker Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Dreamwalker of the Visionary pathway",
        category: "main-ingredient",
      },
      {
        name: "Fragment of the Collective Subconscious",
        description:
          "A captured sliver of the Sea of Collective Subconscious, holding the dreams of a multitude",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Descend bodily into the Sea of Collective Subconscious and master a hostile Mind Island as you digest the Saint's potion",
      requirements: [
        "Enter the Sea of Collective Subconscious and find the Mind Island of a worthy mind",
        "Subdue and govern it without your own self being lost among the personas you spawn",
        "Consume the potion at the heart of the conquered island and surface still singular",
      ],
    },
  },
  {
    level: 3,
    name: "Dream Weaver",
    classification: "High",
    abilities: [
      {
        name: "Dream Weaving",
        description:
          "Weave dream-objects and dream-people so real that what the target believes becomes true for them",
        type: "active",
      },
      {
        name: "Reality Blurring",
        description:
          "Erode the line between dream and waking until a victim cannot tell which world they inhabit",
        type: "active",
      },
      {
        name: "Belief Made Manifest",
        description:
          "Whatever a swayed mind holds as certain takes on weight and consequence in the dream you spin",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Author dreams responsibly — every woven belief you plant becomes a real thing in another's world",
      "Never lose track of which dreams are your weaving and which is the waking world you stand in",
      "Hold to your own certainties as a Saint, so no rival weaver can author you",
    ],
    prerequisiteItems: [
      {
        name: "Dream Weaver Potion Formula",
        description: "The recipe for the Sequence 3 Dream Weaver potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Manipulator Characteristic",
        description:
          "The Beyonder characteristic of a Manipulator, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Loom of Sleeping Thought",
        description:
          "A mystical loom that spins the raw stuff of dreams into threads a Weaver can work",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Weave a dream indistinguishable from reality around a gathered audience and digest the potion within it",
      requirements: [
        "Spin a dream so complete that those caught in it cannot find its edges",
        "Make a planted belief manifest as a real consequence inside the weave",
        "Drink the potion within your own dream and wake without leaving part of yourself behind",
      ],
    },
  },
  {
    level: 2,
    name: "Discerner",
    classification: "Demigod",
    abilities: [
      {
        name: "Discernment",
        description:
          "Perceive the truth, intent, and hidden nature of anything you turn your attention upon, piercing every veil",
        type: "active",
      },
      {
        name: "Dream Maze",
        description:
          "Fuse many Mind Islands into a vast dream-maze that swallows trespassers' minds whole",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to ordinary harm while straining toward the Visionary's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Discern truth with restraint — to see all is to risk the Visionary's cold detachment swallowing your heart",
      "Anchor your overflowing spirituality before the mythical character of the Visionary overtakes you",
      "Hold the human thread that keeps your discernment kind rather than merely all-seeing",
    ],
    prerequisiteItems: [
      {
        name: "Discerner Potion Formula",
        description: "The recipe for the Sequence 2 Discerner potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Dream Weaver Characteristic",
        description:
          "The Beyonder characteristic of a Dream Weaver, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Raise a Dream Maze from many bound minds and discern your own true self within it as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Fuse a host of Mind Islands into a single dream-maze and stand at its centre",
        "Discern and hold to your own true self as the Visionary's mythical character presses to overwrite you",
      ],
    },
  },
  {
    level: 1,
    name: "Author",
    classification: "Demigod",
    abilities: [
      {
        name: "Authorship of Fate",
        description:
          "Read the deepest fears, past destinies, and causal threads of others, and write new turns into them",
        type: "active",
      },
      {
        name: "Authority of Imagination",
        description:
          "Command imagination and spirit at the Angel tier, making the conceived real within your reach",
        type: "active",
      },
      {
        name: "Causal Sight",
        description:
          "Perceive the chains of cause and consequence binding a person to their destiny",
        type: "passive",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of the Visionary",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Visionary's mythical character",
      "Author the fates of others gravely, knowing each rewrite reshapes a real soul",
      "Hold the line between authoring the world and being authored by the Visionary within you",
    ],
    prerequisiteItems: [
      {
        name: "Author Potion Formula",
        description: "The recipe for the Sequence 1 Author potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Discerner Characteristic",
        description:
          "The Beyonder characteristic of a Discerner, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Visionary: consecrate your anchors and rewrite a strand of true fate as you digest the potion without being unmade",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Read and rewrite a genuine thread of destiny as proof of your authorship",
        "Endure the mythical character of the Visionary pressing to overwrite you, and emerge still yourself",
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
        description: "Sing hymns that purify minor corruption and bolster morale",
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
        name: "Crystal Sunflower",
        description:
          "A crystallised sunflower whose petals have turned to translucent glass through sun exposure over centuries",
        category: "main-ingredient",
      },
      {
        name: "Siren Rock",
        description:
          "A resonant stone that hums with solar energy — associated with the Sun pathway's music-based power",
        category: "main-ingredient",
      },
      {
        name: "Midsummer Grass",
        description: "One blade of Midsummer Grass, harvested at the summer solstice",
        category: "supplementary-ingredient",
      },
      {
        name: "July Wine Juice",
        description: "5 drops of July Wine juice, a ferment made from sun-ripened grapes",
        category: "supplementary-ingredient",
      },
      {
        name: "Elf Dark Leaf",
        description:
          "One leaf from an Elf Dark tree, which stores sunlight in its darkened surface",
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
        description: "Heal moderate wounds and cure minor diseases through touch",
        type: "active",
      },
      {
        name: "Radiant Aura",
        description: "Emit a soft glow that repels weaker undead and evil spirits",
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
        name: "Brilliance Rock",
        description:
          "A rock that stores and emits light — it glows with a pale radiance even in total darkness",
        category: "main-ingredient",
      },
      {
        name: "Golden-Edged Sunflower",
        description:
          "A sunflower with gold-edged petals, found near sites of Sun pathway activity",
        category: "supplementary-ingredient",
      },
      {
        name: "Aconite Juice",
        description: "3 drops of aconite juice, carefully measured",
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
        description: "Release an intense burst of holy light that damages evil entities",
        type: "active",
      },
      {
        name: "Purification Ritual",
        description: "Cleanse an area of spiritual corruption through extended prayer",
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
        description: "A shard of a phoenix feather, imbued with regenerative flame",
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
        description: "Compel truth from a target during formal questioning",
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
        description:
          "Summon flames of purification that burn evil but spare the innocent",
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
      description: "Adjudicate a dispute between two Beyonders and enforce the outcome",
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
        description: "Call down a pillar of concentrated sunlight to smite a target area",
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
        name: "Eyes of a Radiant Giant",
        description:
          "A pair of eyes from a Radiant Giant — luminous colossus creatures of the Sun pathway",
        category: "main-ingredient",
      },
      {
        name: "Blood of a Radiant Giant",
        description: "300 ml of blood from a Radiant Giant",
        category: "main-ingredient",
      },
      {
        name: "Self-Transcribed Holy Book",
        description:
          "A holy book praising the Sun, written in the practitioner's own hand — both ingredient and ritual object",
        category: "main-ingredient",
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
  {
    level: 4,
    name: "Unshadowed",
    classification: "High",
    abilities: [
      {
        name: "Purification",
        description:
          "Strip corruption, darkness, and even Beyonder characteristics from a target — enough to drag a Beyonder down a Sequence",
        type: "active",
      },
      {
        name: "Unshadowed Domain",
        description:
          "Fill an area with light so total that no shadow, lie, or concealment can hold within it",
        type: "active",
      },
      {
        name: "Flaring Sun",
        description: "Release a blinding solar flare that scours undead and evil to ash",
        type: "active",
      },
    ],
    actingRequirements: [
      "Burn away corruption and darkness wherever you find it, sparing neither the powerful nor the hidden",
      "Wield purification as a Saint's duty, not a weapon of pride or vengeance",
      "Carry the Sun's swelling radiance without letting its zeal harden into cruelty",
    ],
    prerequisiteItems: [
      {
        name: "Unshadowed Potion Formula",
        description: "The recipe for the Sequence 4 Unshadowed potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Priest of Light Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Priest of Light of the Sun pathway",
        category: "main-ingredient",
      },
      {
        name: "Vial of Undimmed Noon Light",
        description:
          "Captured light of high noon that never dims, the purest reagent of the Sun's purification",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of the Sun: raise an Unshadowed Domain over a corrupted place and purify it utterly as you digest the potion",
      requirements: [
        "Choose a place steeped in darkness or corruption and flood it with your Unshadowed Domain",
        "Purify the corruption completely, sparing nothing that hides from the light",
        "Hold yourself intact as the Sun's spirituality floods in, refusing the role's all-consuming zeal",
      ],
    },
  },
  {
    level: 3,
    name: "Justice Mentor",
    classification: "High",
    abilities: [
      {
        name: "Principle of Order",
        description:
          "Forge a personal principle of justice and order aligned with the Sun, made real by your authority",
        type: "active",
      },
      {
        name: "Judgment of Light",
        description:
          "Pass binding judgment on the guilty, the light of the Sun enforcing the sentence",
        type: "active",
      },
      {
        name: "Mantle of Order",
        description:
          "Project an aura of lawful authority that steadies allies and unnerves the wicked",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Define and uphold a just order, then bind yourself to it before binding others",
      "Mentor and judge with the Sun's clarity, never with the tyrant's caprice",
      "Hold your principles as a Saint without letting the role's certainty blind you to mercy",
    ],
    prerequisiteItems: [
      {
        name: "Justice Mentor Potion Formula",
        description: "The recipe for the Sequence 3 Justice Mentor potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Unshadowed Characteristic",
        description:
          "The Beyonder characteristic of an Unshadowed, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Tablet of First Law",
        description:
          "A stone tablet inscribed with an ancient, still-binding principle of order",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Declare a principle of justice and enforce it upon a true wrong as you digest the potion",
      requirements: [
        "Forge and proclaim a personal principle of order aligned with the Sun",
        "Pass and enforce a judgment that the world itself upholds",
        "Drink the potion as the principle takes root, binding it to yourself without it binding you",
      ],
    },
  },
  {
    level: 2,
    name: "Lightseeker",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Light",
        description:
          "Wield partial authority over the Sun and Light themselves, summoning, bending, and withholding radiance",
        type: "active",
      },
      {
        name: "Spear of Light",
        description:
          "Condense pure light into a hurled spear that pierces darkness and flesh alike",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Sun's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Seek and serve the light with restraint, knowing its authority tempts the Sun's mythical character closer",
      "Anchor your overflowing spirituality before the radiance dissolves your humanity",
      "Hold the human warmth that keeps your light a comfort rather than a judgment",
    ],
    prerequisiteItems: [
      {
        name: "Lightseeker Potion Formula",
        description: "The recipe for the Sequence 2 Lightseeker potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Justice Mentor Characteristic",
        description:
          "The Beyonder characteristic of a Justice Mentor, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Seize partial authority over light at high noon and forge a Spear of Light as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Claim authority over the light of the Sun at the height of day",
        "Condense and hurl a Spear of Light as the mythical character of the Sun presses to overwrite you",
      ],
    },
  },
  {
    level: 1,
    name: "White Angel",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Holiness",
        description:
          "Wield partial authority over Holiness, Order, and Faith at the Angel tier, sanctifying and commanding",
        type: "active",
      },
      {
        name: "Incarnation of Order",
        description:
          "Draw power from the order and commerce of a city to heal, restore, and mend on a vast scale",
        type: "active",
      },
      {
        name: "Radiant Judgment",
        description:
          "Call down overwhelming holy light to smite the corrupt across a wide field",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of the Sun",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Sun's mythical character",
      "Embody holiness and order as their living incarnation, yet remain answerable to mercy",
      "Hold the line between serving the Sun and becoming the Sun's pitiless radiance",
    ],
    prerequisiteItems: [
      {
        name: "White Angel Potion Formula",
        description: "The recipe for the Sequence 1 White Angel potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Lightseeker Characteristic",
        description:
          "The Beyonder characteristic of a Lightseeker, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Sun: consecrate your anchors and become the Incarnation of Order over a faithful city as you digest the potion",
      requirements: [
        "Consecrate the anchors — a congregation of the faithful — that will bind your Angelic spirituality",
        "Draw upon the order of a city to perform a great work of healing as the rite peaks",
        "Endure the mythical character of the Sun pressing to overwrite you, and emerge still yourself",
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
        description: "Speak with recently deceased to learn their final moments",
        type: "active",
      },
      {
        name: "Death Sense",
        description: "Detect the presence of death, undead, and lingering spirits nearby",
        type: "passive",
      },
      {
        name: "Preserve Remains",
        description: "Slow or halt decomposition of a corpse through spiritual means",
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
        description: "A grey grass that grows exclusively on the graves of Beyonders",
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
        description: "Reduced need for sleep and food; resistance to cold and disease",
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
        name: "Eye of a Death-Telling Crow",
        description:
          "The eye of a Death-Telling Crow, a corvid that can sense imminent death",
        category: "main-ingredient",
      },
      {
        name: "Blood Rose",
        description:
          "A Blood Rose harvested from a graveyard — a flower that feeds on corpse essence",
        category: "main-ingredient",
      },
      {
        name: "Death-Telling Crow Feathers",
        description: "Three feathers from a Death-Telling Crow",
        category: "supplementary-ingredient",
      },
      {
        name: "Blood Rose Leaves",
        description: "Five leaves from a graveyard Blood Rose",
        category: "supplementary-ingredient",
      },
      {
        name: "Corpse-Scented Oil",
        description: "9 drops of essential oil distilled from corpse remains",
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
        description: "Allow a spirit to temporarily inhabit your body to communicate",
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
        name: "Forepaw of a Ghost Phantom Cat",
        description:
          "The forepaw of a Ghost Phantom Cat, a supernatural feline that phases between the living and spirit worlds",
        category: "main-ingredient",
      },
      {
        name: "Spirit World Crystal",
        description: "A crystal formed by the condensation of spirit world energy",
        category: "main-ingredient",
      },
      {
        name: "Ghost Phantom Cat Blood",
        description: "80 ml of blood from a Ghost Phantom Cat",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit Crystal-Tainted Soil",
        description: "10 grams of soil contaminated by spirit world crystal dissolution",
        category: "supplementary-ingredient",
      },
      {
        name: "Brain Matter of the Spirit-Possessed",
        description:
          "5 ml of brain matter from a person who died from evil spirit possession",
        category: "supplementary-ingredient",
      },
      {
        name: "Natural Spirit-Blessed Leaf",
        description: "A leaf that has been blessed by a natural spirit",
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
        name: "Gaze of Death",
        description:
          "Any living being who makes direct eye contact risks instant death; even entities of godlike power suffer devastating damage from the exchange",
        type: "active",
      },
      {
        name: "Withering Gaze",
        description:
          "Targets within your line of sight wither slowly even without direct eye contact, as if crossing the River of Death inch by inch",
        type: "passive",
      },
      {
        name: "Death's Immunity",
        description:
          "Most physical and supernatural attacks are ineffective — only purification effects remain genuinely dangerous; the body no longer dies of natural causes and gradually transforms",
        type: "passive",
      },
      {
        name: "Touch of Death and Life",
        description:
          "Touch with the left hand inflicts near-irreversible death; a subsequent touch with the right hand reverses the condition and restores life",
        type: "active",
      },
    ],
    actingRequirements: [
      "Walk among the living with your eyes lowered or averted — master the death energy in your gaze so it does not kill indiscriminately",
      "Guide every soul that approaches you seeking passage; the Spirit Guide does not refuse those who come",
      "Maintain the detachment of one who has crossed the threshold — neither fear death nor cling to the living world",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Guide Potion Formula",
        description: "The recipe for the Sequence 6 Spirit Guide potion",
        category: "potion-formula",
      },
      {
        name: "Shadow of Death",
        description:
          "The shadow cast by death itself — an incorporeal entity that inhabits objects",
        category: "main-ingredient",
      },
      {
        name: "Soul Essence of a Pale Lich",
        description:
          "The condensed soul-essence of a Pale Lich, a high-order undead sorcerer",
        category: "main-ingredient",
      },
      {
        name: "Bone Fragments of a Pale Lich",
        description:
          "Ground bones from the same Pale Lich, retaining residual death energy",
        category: "supplementary-ingredient",
      },
      {
        name: "Putrid Essence of the Deceased",
        description:
          "100 ml of putrid liquid from a long-deceased body, distilled and concentrated",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Confront the full weight of your transformation: spend three days and nights among the dead without averting your gaze, and survive the withering effect of your own reflection",
      requirements: [
        "Remain in a place of the dead for three consecutive days without shielding your eyes",
        "Witness your own reflection in still water without allowing the sight to kill you",
        "Demonstrate control of the Touch of Death by reviving with the right hand what the left hand has withered",
      ],
    },
  },
  {
    level: 5,
    name: "Gatekeeper",
    classification: "Mid",
    abilities: [
      {
        name: "Door to the Underworld",
        description:
          "Sense and control the entrance to the Underworld; solidify it as a brand on your palm and summon it at critical moments to drag targets behind the door",
        type: "active",
      },
      {
        name: "Internal Underworld",
        description:
          "Use your body as a cage to house souls, spirits, and undead — an entrance to an inner death realm opens at the centre of your brow",
        type: "active",
      },
      {
        name: "Undead Dominion",
        description:
          "Command the undead housed within your Internal Underworld, deploying them through the gate wherever you travel without drawing outward attention",
        type: "active",
      },
      {
        name: "Underworld Sense",
        description:
          "Perceive all disturbances across a vast area of the death domain; nothing that crosses the boundary between life and death escapes your awareness",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Guard the boundary between the living and the dead as a sacred responsibility",
      "Maintain and expand your Internal Underworld — ensure those housed within are ordered and at peace",
      "Never allow unauthorized passage through the gate you embody",
    ],
    prerequisiteItems: [
      {
        name: "Gatekeeper Potion Formula",
        description: "The recipe for the Sequence 5 Gatekeeper potion",
        category: "potion-formula",
      },
      {
        name: "Skull of an Underworld Wanderer",
        description:
          "The skull of an Underworld Wanderer, a creature native to the death realm",
        category: "main-ingredient",
      },
      {
        name: "Crystal Core of a Myriad-Armed Wraith",
        description:
          "The crystal core left behind when a Myriad-Armed Wraith is destroyed",
        category: "main-ingredient",
      },
      {
        name: "Death-Tainted Water",
        description: "80 ml of water permeated by the aura of the death realm",
        category: "supplementary-ingredient",
      },
      {
        name: "Underworld Wanderer Flesh",
        description: "A piece of rotten flesh from an Underworld Wanderer",
        category: "supplementary-ingredient",
      },
      {
        name: "Myriad-Armed Wraith Residue",
        description:
          "10 grams of residual powder left after destroying a Myriad-Armed Wraith",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Red Amaryllis Oil",
        description: "10 drops of essential oil from the Deep Red Amaryllis flower",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Open the gate within your own body for the first time and house your first souls, proving you can sustain the Internal Underworld",
      requirements: [
        "Prepare through extended communion with the death realm",
        "Open the Internal Underworld gate at your brow",
        "Successfully house at least three bound souls within your Internal Underworld without losing control",
      ],
    },
  },
  {
    level: 4,
    name: "Undying",
    classification: "High",
    abilities: [
      {
        name: "Death and Resurrection",
        description:
          "Die and rise again on a cycle of roughly sixty years; each return resets the flesh, though memory is paid as the price",
        type: "active",
      },
      {
        name: "Underworld Authority",
        description:
          "Command the death realm at will, opening the Door to the Underworld and traversing the spirit world freely",
        type: "active",
      },
      {
        name: "Death Sealing",
        description:
          "Seal a soul, a power, or a calamity away behind the boundary of death",
        type: "active",
      },
      {
        name: "Deathless Body",
        description:
          "Natural death has no hold on you, and most harm only delays the next resurrection",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Treat death as a doorway you keep, passing through it and back without fear or hunger",
      "Bear the loss of memory each resurrection costs without losing the thread of who you are",
      "Carry the Death pathway's swelling spirituality as a Saint without growing indifferent to the living",
    ],
    prerequisiteItems: [
      {
        name: "Undying Potion Formula",
        description: "The recipe for the Sequence 4 Undying potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Gatekeeper Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Gatekeeper of the Death pathway",
        category: "main-ingredient",
      },
      {
        name: "Ash of a Self Already Died",
        description:
          "The funerary ash of one who has passed and returned, carrying the imprint of a survived death",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of Death: pass willingly through your own death and rise again as you digest the potion",
      requirements: [
        "Open the Door to the Underworld and step through your own death by choice",
        "Seal what must be sealed on the far side and turn back toward life",
        "Rise again with the potion digesting, holding to your self through the memory the death takes",
      ],
    },
  },
  {
    level: 3,
    name: "Ferryman",
    classification: "High",
    abilities: [
      {
        name: "Hands of Life and Death",
        description:
          "The left hand deals near-irreversible death; the right hand restores life — the two authorities held in one body",
        type: "active",
      },
      {
        name: "Ferrying of Souls",
        description:
          "Carry souls across the boundary between life and death, delivering or withholding passage",
        type: "active",
      },
      {
        name: "Manifest Authority of Death",
        description:
          "Make the authority of Death visible and physical, a tide that the living cannot cross uninvited",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Ferry every soul that seeks passage fairly, neither hastening nor refusing the crossing for gain",
      "Hold life and death in balance in your two hands, mastering both without favouring either",
      "Carry a Saint's spirituality as the ferry's keeper without becoming as cold as the river you tend",
    ],
    prerequisiteItems: [
      {
        name: "Ferryman Potion Formula",
        description: "The recipe for the Sequence 3 Ferryman potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Undying Characteristic",
        description:
          "The Beyonder characteristic of an Undying, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Oar of the Final Crossing",
        description:
          "The oar of a vessel that has carried the dead, steeped in the authority of passage",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Take up the Hands of Life and Death and ferry a soul across the boundary as you digest the potion",
      requirements: [
        "Master the left hand of death and the right hand of life as a single authority",
        "Ferry a true soul across the boundary and return without it clinging to you",
        "Drink the potion at the far bank, holding your humanity against the river's cold pull",
      ],
    },
  },
  {
    level: 2,
    name: "Death Consul",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Death",
        description:
          "Wield partial authority over Death itself, dealing and staying it across a wide domain",
        type: "active",
      },
      {
        name: "Nation of the Dead",
        description:
          "Raise a city-sized domain that slays the living, raises the dead, and harms even godhood within its bounds",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Death pathway's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Rule the dead with restraint, knowing each exercise of Death's authority tempts the mythical character closer",
      "Anchor your overflowing spirituality before the Nation of the Dead swallows your living heart",
      "Hold the human warmth that keeps your dominion a keeping rather than a slaughter",
    ],
    prerequisiteItems: [
      {
        name: "Death Consul Potion Formula",
        description: "The recipe for the Sequence 2 Death Consul potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Ferryman Characteristic",
        description:
          "The Beyonder characteristic of a Ferryman, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Raise a Nation of the Dead and rule it without being claimed by it as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Raise a city-sized Nation of the Dead and take its throne",
        "Hold to your own life as the mythical character of Death presses to overwrite you",
      ],
    },
  },
  {
    level: 1,
    name: "Pale Emperor",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Pallor",
        description:
          "Wield partial authority over Pallor at the Angel tier, draining colour, warmth, and vitality from the world",
        type: "active",
      },
      {
        name: "Pale World",
        description:
          "Unfurl a colourless realm where Beyonder powers wither and die and the living slowly fade",
        type: "active",
      },
      {
        name: "Empire of the Dead",
        description:
          "Command the undead and the spirits of a vast domain as a single, ordered host",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of Death",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by Death's mythical character",
      "Reign over pallor and the dead as their emperor, yet remember the colour of the living world you came from",
      "Hold the line between ruling Death and becoming Death's silence",
    ],
    prerequisiteItems: [
      {
        name: "Pale Emperor Potion Formula",
        description: "The recipe for the Sequence 1 Pale Emperor potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Death Consul Characteristic",
        description:
          "The Beyonder characteristic of a Death Consul, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of Death: consecrate your anchors and unfurl the Pale World as you digest the potion without being unmade",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Unfurl a colourless Pale World and hold dominion over its silence",
        "Endure the mythical character of Death pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

const darknessSequences: Sequence[] = [
  {
    level: 9,
    name: "Sleepless",
    classification: "Low",
    abilities: [
      {
        name: "Nocturnality",
        description:
          "Grow stronger as night deepens — physical strength, intuition, and mind are all heightened after dark, and only a few hours of sleep are needed",
        type: "passive",
      },
      {
        name: "Night Vision",
        description: "See clearly through total darkness and sense dangers hidden in it",
        type: "passive",
      },
      {
        name: "Spirit Vision",
        description: "Perceive spiritual things, though without precise discernment",
        type: "active",
      },
    ],
    actingRequirements: [
      "Keep to the night — work, watch, and act under cover of darkness",
      "Cultivate stillness and concealment; move unseen and unheard",
      "Resist sleep and stand vigil while others rest",
    ],
    prerequisiteItems: [
      {
        name: "Sleepless Potion Formula",
        description: "The recipe for the Sequence 9 Sleepless potion",
        category: "potion-formula",
      },
      {
        name: "Midnight Beauty Flower",
        description:
          "One blossom of the Midnight Beauty Flower, which opens only in the dead of night",
        category: "main-ingredient",
      },
      {
        name: "Six-Footed Owl Eyes",
        description:
          "A pair of eyes from a Six-Footed Owl, a nocturnal supernatural bird",
        category: "main-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "80 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
      {
        name: "Night Vanilla Essential Oil",
        description: "10 drops of essential oil pressed from Night Vanilla",
        category: "supplementary-ingredient",
      },
      {
        name: "Midnight Beauty Leaves",
        description: "3 leaves of the Midnight Beauty Flower",
        category: "supplementary-ingredient",
      },
      {
        name: "Coffee Beans or Tea Leaves",
        description:
          "A portion of coffee beans or tea leaves, taken for symbolic meaning",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Midnight Poet",
    classification: "Low",
    abilities: [
      {
        name: "Midnight Poem",
        description:
          "Recite verses that carry supernatural force — each poem shapes a distinct effect in the dark",
        type: "active",
      },
      {
        name: "Lullaby",
        description: "Sing or speak others into drowsiness and unnatural sleep",
        type: "active",
      },
      {
        name: "Pacify",
        description: "Quiet emotions and suppress the desires and moods of those nearby",
        type: "active",
      },
    ],
    actingRequirements: [
      "Compose and recite poems by night, drawing power from the dark hours",
      "Soothe and lull the troubled rather than confront them openly",
      "Keep your true intent veiled behind verse and quiet",
    ],
    prerequisiteItems: [
      {
        name: "Midnight Poet Potion Formula",
        description: "The recipe for the Sequence 8 Midnight Poet potion",
        category: "potion-formula",
      },
      {
        name: "Red-Moon Roarer Vocal Cords",
        description:
          "The vocal cords of a Red-Moon Roarer, a creature that howls at the crimson moon",
        category: "main-ingredient",
      },
      {
        name: "Soul-Snatching Wind Chime Flower",
        description:
          "One Soul-Snatching Wind Chime Flower, whose tones unsettle the spirit",
        category: "main-ingredient",
      },
      {
        name: "Red Wine",
        description: "100 milliliters of red wine",
        category: "supplementary-ingredient",
      },
      {
        name: "Red-Moon Roarer Hair",
        description: "7 strands of hair from a Red-Moon Roarer",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Crimson Sandalwood",
        description: "10 grams of deep crimson sandalwood",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Compose and perform a Midnight Poem that bends a gathered audience to sleep",
      requirements: [
        "Gather listeners and recite an original Midnight Poem at the dead of night",
        "Channel spiritual power so the verse lulls them into slumber",
        "Hold the working until every listener has succumbed",
      ],
    },
  },
  {
    level: 7,
    name: "Nightmare",
    classification: "Mid",
    abilities: [
      {
        name: "Dream Invasion",
        description: "Enter a sleeping target's dream and move through its landscape",
        type: "active",
      },
      {
        name: "Dream Shaping",
        description: "Reshape the contents of a dream into a nightmare of your design",
        type: "active",
      },
      {
        name: "Nightmare Limbs",
        description: "Manifest shadowy limbs of nightmare-stuff to seize and strike",
        type: "active",
      },
      {
        name: "Nightmare State",
        description:
          "Cloak yourself in a dreadful, oppressive aura that weakens the resolve of others",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk the dreams of others and study the shape of their fears",
      "Conceal your comings and goings; let no one trace the source of the dread",
      "Master your own nightmares before you wield those of others",
    ],
    prerequisiteItems: [
      {
        name: "Nightmare Potion Formula",
        description: "The recipe for the Sequence 7 Nightmare potion",
        category: "potion-formula",
      },
      {
        name: "Dream-Eating Black Crow Heart",
        description:
          "The heart of a Dream-Eating Black Crow, a corvid that feeds on dreams",
        category: "main-ingredient",
      },
      {
        name: "Shadow of Nightmares",
        description:
          "A captured Shadow of Nightmares, the residue of a powerful bad dream",
        category: "main-ingredient",
      },
      {
        name: "Spirit-World Moon Water",
        description:
          "100 milliliters of moon water drawn from the crimson moon of the spirit world",
        category: "supplementary-ingredient",
      },
      {
        name: "Dream-Eating Crow Phantom Feather",
        description: "One phantom feather from a Dream-Eating Black Crow",
        category: "supplementary-ingredient",
      },
      {
        name: "Recorded Nightmare Pages",
        description: "Paper recording one of your own nightmares from the past fortnight",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Invade and master the nightmare of a Beyonder without being cast out",
      requirements: [
        "Enter the dream of a sleeping Beyonder undetected",
        "Twist the dream into a nightmare of your own shaping",
        "Withdraw before the dreamer wakes, leaving no trace",
      ],
    },
  },
  {
    level: 6,
    name: "Soul Assurer",
    classification: "Mid",
    abilities: [
      {
        name: "Requiem",
        description:
          "Sing a requiem that soothes restless souls and lays troubled spirits to rest",
        type: "active",
      },
      {
        name: "Soul Pacification",
        description: "Calm, pacify, and provide refuge to wandering or agitated spirits",
        type: "active",
      },
      {
        name: "Agitating",
        description: "Inversely, stir a spirit into frenzy or torment when needed",
        type: "active",
      },
      {
        name: "Heightened Spirituality",
        description: "Greatly heightened spiritual perception and ritual sensitivity",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Tend to the dead and the dreaming — bring rest to souls that cannot find it",
      "Move in silence and concealment; the Soul Assurer works unseen",
      "Hold to serenity; never let the torment of spirits become your own",
    ],
    prerequisiteItems: [
      {
        name: "Soul Assurer Potion Formula",
        description: "The recipe for the Sequence 6 Soul Assurer potion",
        category: "potion-formula",
      },
      {
        name: "Rotting Shepherd Spirit Crystal",
        description:
          "The spirit-body crystal of a Rotting Shepherd, a decayed spirit-world entity",
        category: "main-ingredient",
      },
      {
        name: "Otherworldly Deep Sleeper Skull",
        description:
          "The skull of an Otherworldly Deep Sleeper, a creature of endless slumber",
        category: "main-ingredient",
      },
      {
        name: "Blessed Holy Water",
        description: "80 milliliters of blessed holy water",
        category: "supplementary-ingredient",
      },
      {
        name: "Rotting Shepherd Pus",
        description: "7 drops of pus from a Rotting Shepherd",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Sleeper Shadow Soil",
        description:
          "17 grams of soil mingled with the shadow of an Otherworldly Deep Sleeper",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Sleep Flower Powder",
        description: "10 grams of powdered Deep Sleep Flower",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Lay to rest a powerful, anguished spirit that resists all comfort",
      requirements: [
        "Find a tormented spirit that refuses peace",
        "Sing the Requiem and offer it refuge within the dark",
        "Settle the spirit into rest without being dragged into its anguish",
      ],
    },
  },
  {
    level: 5,
    name: "Spirit Warlock",
    classification: "Mid",
    abilities: [
      {
        name: "Spirit Commanding",
        description:
          "Summon, bind, and command a host of spirits and spirit-world creatures to fight and serve",
        type: "active",
      },
      {
        name: "Dream Invasion",
        description:
          "Enter and command the dreams of others with far greater reach than a Nightmare",
        type: "active",
      },
      {
        name: "Spirit Body Projection",
        description: "Project your own spirit body to act apart from your flesh",
        type: "active",
      },
      {
        name: "Master of the Dark",
        description:
          "Command near-total dominion over darkness and the spirit world at night",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Marshal and command spirits as a warlock of the dark night",
      "Operate from concealment, directing your spirits rather than acting openly",
      "Guard your own soul against the spirits you bind",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Warlock Potion Formula",
        description: "The recipe for the Sequence 5 Spirit Warlock potion",
        category: "potion-formula",
      },
      {
        name: "Source of Mad Dreams",
        description: "A portion of the Source of Mad Dreams, wellspring of delirium",
        category: "main-ingredient",
      },
      {
        name: "Spirit Nest",
        description: "One Spirit Nest, a hive that breeds and houses spirits",
        category: "main-ingredient",
      },
      {
        name: "Source of Mad Dreams Blood",
        description: "100 milliliters of blood drawn from the Source of Mad Dreams",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit Nest Vapor",
        description: "30 milliliters of gas vented from a Spirit Nest",
        category: "supplementary-ingredient",
      },
      {
        name: "A Soul About to Disperse",
        description: "A soul body on the verge of dissipating",
        category: "supplementary-ingredient",
      },
      {
        name: "Full-Moon Milk Tooth",
        description: "A milk tooth that fell out under a full moon",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Enter the spirit world in the flesh and rejoin your own key spirit-world reflection",
      requirements: [
        "Find a way to enter the spirit world bodily rather than as a spirit",
        "Locate and merge with your own key information mirrored there",
        "Consume the potion at the moment of reunion without losing yourself",
      ],
    },
  },
  {
    level: 4,
    name: "Nightwatcher",
    classification: "High",
    abilities: [
      {
        name: "Night Domain",
        description:
          "Unfurl a domain of living night within which darkness, sleep, and concealment answer your will",
        type: "active",
      },
      {
        name: "Hair Entanglement",
        description:
          "Loose binding strands of darkness that ensnare foes and sink them into peaceful, helpless slumber",
        type: "active",
      },
      {
        name: "Concealment of Night",
        description:
          "Hide yourself, others, and whole places within the dark, beyond ordinary sight or divination",
        type: "active",
      },
      {
        name: "Inherited Bloodline",
        description:
          "Carry residual abilities drawn from the true-deity descendant blood used in your advancement",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Keep the watch of the night, guarding rest and concealment rather than wielding the dark for cruelty",
      "Master the swelling night within you as a Saint without letting it smother your warmth",
      "Use entanglement and concealment to protect and to bind, never merely to dominate",
    ],
    prerequisiteItems: [
      {
        name: "Nightwatcher Potion Formula",
        description: "The recipe for the Sequence 4 Nightwatcher potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Spirit Warlock Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Spirit Warlock of the Darkness pathway",
        category: "main-ingredient",
      },
      {
        name: "Blood of a True-Deity Descendant",
        description:
          "Blood carrying the diluted lineage of a true deity, the bloodline reagent of the Nightwatcher",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of Darkness: raise the Night Domain over a sleeping place and keep its watch as you digest the potion",
      requirements: [
        "Unfurl the Night Domain over a place given to rest and darkness",
        "Bind any who would break the night's peace with Hair Entanglement",
        "Hold yourself intact as the Darkness pathway's spirituality floods in, keeping the watch rather than becoming the night",
      ],
    },
  },
  {
    level: 3,
    name: "Horror Bishop",
    classification: "High",
    abilities: [
      {
        name: "Sword of Darkness",
        description:
          "Forge a bone sword that fuses Repose and Horror, cleaving body and spirit in a single stroke",
        type: "active",
      },
      {
        name: "Surging Dark Tide",
        description:
          "Call up tides of living darkness that drown a battlefield in dread and shadow",
        type: "active",
      },
      {
        name: "Aura of Horror",
        description:
          "Radiate an oppressive terror that unmakes the courage of all who stand against you",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Wield horror and repose together with a bishop's discipline, never indulging cruelty for its own sake",
      "Hold your purpose as a Saint against the dread your own power radiates",
      "Bear the surging darkness within without letting it surge past your control",
    ],
    prerequisiteItems: [
      {
        name: "Horror Bishop Potion Formula",
        description: "The recipe for the Sequence 3 Horror Bishop potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Nightwatcher Characteristic",
        description:
          "The Beyonder characteristic of a Nightwatcher, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Bone of a Thing That Knew Repose",
        description:
          "A bone steeped in both peace and terror, the raw material of the Sword of Darkness",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Forge the Sword of Darkness from Repose and Horror and master it as you digest the potion",
      requirements: [
        "Fuse the authorities of Repose and Horror into a single bone blade",
        "Loose a surging dark tide and call it back to your hand without it sweeping you away",
        "Drink the potion as the sword is bound to you, holding to your purpose through the dread",
      ],
    },
  },
  {
    level: 2,
    name: "Servant of Concealment",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Concealment",
        description:
          "Wield partial authority over Concealment, erasing a target from outside perception entirely",
        type: "active",
      },
      {
        name: "Vanished World",
        description:
          "Sink a place or a person wholly out of the world's awareness, hidden until you will otherwise",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Darkness pathway's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Conceal with restraint, knowing each erasure tempts the Darkness pathway's mythical character closer",
      "Anchor your overflowing spirituality before the dark swallows your own visibility to yourself",
      "Hold the human thread that keeps you findable, lest you vanish even from your own heart",
    ],
    prerequisiteItems: [
      {
        name: "Servant of Concealment Potion Formula",
        description: "The recipe for the Sequence 2 Servant of Concealment potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Horror Bishop Characteristic",
        description:
          "The Beyonder characteristic of a Horror Bishop, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Erase a true thing from the world's perception and call it back as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Conceal a real person or place wholly from the world's awareness",
        "Restore it, and yourself, before the mythical character of Darkness overwrites you",
      ],
    },
  },
  {
    level: 1,
    name: "Knight of Misfortune",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Misfortune",
        description:
          "Wield partial authority over Misfortune at the Angel tier, laying ruinous curses upon your enemies",
        type: "active",
      },
      {
        name: "Archangel's Body",
        description:
          "A peerless physical form of darkness and night, fighting at the fore as an Archangel-tier knight",
        type: "active",
      },
      {
        name: "Cloak of Endless Night",
        description:
          "Wrap yourself in concealing night that turns aside sight, divination, and many a blow",
        type: "passive",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of Darkness",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by Darkness's mythical character",
      "Carry misfortune as a knight carries a blade, turning it on the deserving rather than the helpless",
      "Hold the line between guarding the night and becoming its curse",
    ],
    prerequisiteItems: [
      {
        name: "Knight of Misfortune Potion Formula",
        description: "The recipe for the Sequence 1 Knight of Misfortune potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Servant of Concealment Characteristic",
        description:
          "The Beyonder characteristic of a Servant of Concealment, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of Darkness: consecrate your anchors and take up the authority of Misfortune as a knight of night while you digest the potion",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Lay a curse of true misfortune upon a worthy foe as the rite peaks",
        "Endure the mythical character of Darkness pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

const tyrantSequences: Sequence[] = [
  {
    level: 9,
    name: "Sailor",
    classification: "Low",
    abilities: [
      {
        name: "Aquatic Affinity",
        description:
          "Submerge and move underwater with ease, swimming and diving like a sea creature",
        type: "passive",
      },
      {
        name: "Phantom Scales",
        description:
          "Illusory scales hidden under the skin make you slippery and hard to grasp",
        type: "passive",
      },
      {
        name: "Balance",
        description: "Keep perfect footing on a heaving deck as if on solid ground",
        type: "passive",
      },
      {
        name: "Physical Enhancement",
        description: "Outstanding bodily strength beyond an ordinary person",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Live by the sea and the storm — sail, swim, and brave rough water",
      "Give vent to your temper; do not swallow your anger meekly",
      "Test yourself against wind and wave at every chance",
    ],
    prerequisiteItems: [
      {
        name: "Sailor Potion Formula",
        description: "The recipe for the Sequence 9 Sailor potion",
        category: "potion-formula",
      },
      {
        name: "Storm-Petrel Heart",
        description: "The heart of a storm petrel, a seabird that thrives in gales",
        category: "main-ingredient",
      },
      {
        name: "Deep-Sea Lvoque Fish Blood",
        description: "30 milliliters of blood from a Deep-Sea Lvoque Fish",
        category: "main-ingredient",
      },
      {
        name: "Sea Salt Crystals",
        description: "5 grams of crystals evaporated from storm-tossed seawater",
        category: "supplementary-ingredient",
      },
      {
        name: "Brineweed Extract",
        description: "8 drops of extract from brineweed, a hardy coastal plant",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "60 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Folk of Rage",
    classification: "Low",
    abilities: [
      {
        name: "Wrath",
        description:
          "Channel mounting fury into raw strength — the angrier you grow, the more powerful you become",
        type: "active",
      },
      {
        name: "Raging Blow",
        description: "Unleash a wrath-fueled strike of overwhelming force",
        type: "active",
      },
      {
        name: "Storm Resilience",
        description:
          "Greatly enhanced toughness and endurance, especially amid wind and rain",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Let your anger run free — meet provocation with the fury of the storm",
      "Stand against the powerful; bow your head to no high-handed authority",
      "Throw yourself into the heart of wind, rain, and rough sea",
    ],
    prerequisiteItems: [
      {
        name: "Folk of Rage Potion Formula",
        description: "The recipe for the Sequence 8 Folk of Rage potion",
        category: "potion-formula",
      },
      {
        name: "Furious Sea-Ape Blood",
        description:
          "The blood of a Furious Sea-Ape, a brawny Beyonder beast of the coasts",
        category: "main-ingredient",
      },
      {
        name: "Thunder-Charged Coral",
        description: "A fragment of coral that crackles with stored lightning",
        category: "main-ingredient",
      },
      {
        name: "Raging Tide Foam",
        description: "30 milliliters of foam skimmed from a storm tide",
        category: "supplementary-ingredient",
      },
      {
        name: "Sea-Ape Hair",
        description: "7 strands of coarse hair from a Furious Sea-Ape",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "60 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Master your wrath in a true storm, turning rage into controlled power",
      requirements: [
        "Stand alone against a raging storm or violent sea",
        "Let your fury rise to its peak and channel it into a single working",
        "Hold your mind together as the rage crests, neither breaking nor losing control",
      ],
    },
  },
  {
    level: 7,
    name: "Seafarer",
    classification: "Mid",
    abilities: [
      {
        name: "Navigation",
        description:
          "Unerringly find your bearings at sea and read wind, current, and weather",
        type: "active",
      },
      {
        name: "Weather Sense",
        description:
          "Sense oncoming storms, squalls, and changes in the sea before they arrive",
        type: "passive",
      },
      {
        name: "Enhanced Memory",
        description: "Sharply heightened memory and mental acuity",
        type: "passive",
      },
      {
        name: "Water Resonance",
        description: "Draw strength and recovery from contact with the open sea",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sail the open sea and command the respect of those who travel it",
      "Pit yourself against storm and tide as a master of the waters",
      "Carry the bearing of one born to wind and weather",
    ],
    prerequisiteItems: [
      {
        name: "Seafarer Potion Formula",
        description: "The recipe for the Sequence 7 Seafarer potion",
        category: "potion-formula",
      },
      {
        name: "Storm-Whale Pituitary Gland",
        description:
          "The pituitary gland of a Storm-Whale, a titanic Beyonder of the deep",
        category: "main-ingredient",
      },
      {
        name: "Tempest Sea-Serpent Spinal Fluid",
        description: "50 milliliters of spinal fluid from a Tempest Sea-Serpent",
        category: "main-ingredient",
      },
      {
        name: "Compass-Rose Coral Powder",
        description: "8 grams of powdered Compass-Rose Coral",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep-Sea Pearl Dust",
        description: "5 grams of dust ground from deep-sea pearls",
        category: "supplementary-ingredient",
      },
      {
        name: "Aged Rum",
        description: "60 milliliters of aged rum",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Cross a deadly stretch of storm-wracked sea by your own power alone",
      requirements: [
        "Set out across waters known to wreck ships, in the teeth of a storm",
        "Navigate the passage relying solely on your own senses and command of the sea",
        "Reach the far shore having mastered both the storm and your own dread",
      ],
    },
  },
  {
    level: 6,
    name: "Wind-blessed",
    classification: "Mid",
    abilities: [
      {
        name: "Wind Manipulation",
        description:
          "Summon and command the wind — gusts, gales, and cutting wind-blades",
        type: "active",
      },
      {
        name: "Flight",
        description: "Ride the wind to glide and fly through the open air",
        type: "active",
      },
      {
        name: "Wind-blades",
        description: "Loose blades of compressed air that slice through armor and stone",
        type: "active",
      },
      {
        name: "Water Control",
        description: "Exert growing command over water alongside the wind",
        type: "active",
      },
    ],
    actingRequirements: [
      "Take to the skies and the storm winds as your true element",
      "Wield wind and water with a free and untrammeled temper",
      "Answer slights with the swift fury of a gale",
    ],
    prerequisiteItems: [
      {
        name: "Wind-blessed Potion Formula",
        description: "The recipe for the Sequence 6 Wind-blessed potion",
        category: "potion-formula",
      },
      {
        name: "Gale-Roc Wing Bone",
        description:
          "A wing bone from a Gale-Roc, a great bird that nests in the high winds",
        category: "main-ingredient",
      },
      {
        name: "Cyclone Heart Crystal",
        description: "The crystallised heart of a living cyclone-spirit",
        category: "main-ingredient",
      },
      {
        name: "Storm-Cloud Vapor",
        description: "30 milliliters of vapor drawn from a thunderhead",
        category: "supplementary-ingredient",
      },
      {
        name: "Gale-Roc Feather",
        description: "3 feathers from a Gale-Roc",
        category: "supplementary-ingredient",
      },
      {
        name: "Sky-Salt Powder",
        description: "10 grams of salt powder gathered from high mountain storms",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Ride a great storm to its heart and bend its winds to your will",
      requirements: [
        "Take flight into the body of a powerful storm",
        "Seize command of its winds and turn them where you choose",
        "Descend in command of the gale rather than scattered by it",
      ],
    },
  },
  {
    level: 5,
    name: "Ocean Songster",
    classification: "Mid",
    abilities: [
      {
        name: "Lightning Manipulation",
        description:
          "Call down and hurl lightning — bolts, arrows, and shattering strikes",
        type: "active",
      },
      {
        name: "Lightning Strike",
        description: "Concentrate the storm's charge into a single devastating discharge",
        type: "active",
      },
      {
        name: "Singing",
        description:
          "Sing songs of the sea that disable, command, or bewitch those who hear",
        type: "active",
      },
      {
        name: "Sovereign of Storms",
        description:
          "Command wind, water, and lightning together as near-absolute master of weather",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Reign over sea, sky, and storm as their singer and sovereign",
      "Sing the songs of the deep and let your wrath shake the heavens",
      "Brook no defiance; answer challenge with thunder",
    ],
    prerequisiteItems: [
      {
        name: "Ocean Songster Potion Formula",
        description: "The recipe for the Sequence 5 Ocean Songster potion",
        category: "potion-formula",
      },
      {
        name: "Thunder-Leviathan Vocal Cords",
        description:
          "The vocal cords of a Thunder-Leviathan, a sea-beast wreathed in lightning",
        category: "main-ingredient",
      },
      {
        name: "Storm Core of a Sea-Tyrant",
        description: "The storm-charged core left when a Sea-Tyrant is slain",
        category: "main-ingredient",
      },
      {
        name: "Thunder-Leviathan Blood",
        description: "100 milliliters of blood from a Thunder-Leviathan",
        category: "supplementary-ingredient",
      },
      {
        name: "Lightning-Fused Sand",
        description: "10 grams of fulgurite sand fused by a sea-storm's lightning",
        category: "supplementary-ingredient",
      },
      {
        name: "Siren-Song Pearl",
        description: "A pearl that hums with the song of the deep",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Raise and command a storm at sea by your song alone",
      requirements: [
        "Stand upon the open water and sing the storm into being",
        "Bind its wind, wave, and lightning to your voice",
        "Disperse the storm at your word, proving your mastery over it",
      ],
    },
  },
  {
    level: 4,
    name: "Cataclysmic Interrer",
    classification: "High",
    abilities: [
      {
        name: "Tornado Calling",
        description:
          "Summon and steer tornadoes that tear apart whatever stands in their winding path",
        type: "active",
      },
      {
        name: "Tsunami Raising",
        description: "Raise tsunamis of roughly ten metres to drown coasts and fleets",
        type: "active",
      },
      {
        name: "Earthquake",
        description:
          "Split the land and erupt magma, burying the works of others beneath the earth's own fury",
        type: "active",
      },
    ],
    actingRequirements: [
      "Loose disasters with a tyrant's authority, yet aim your fury at the deserving and not the helpless",
      "Master the swelling violence of a Saint without letting calamity become your only answer",
      "Bury what must be buried, then still the disaster — never leave a cataclysm running wild",
    ],
    prerequisiteItems: [
      {
        name: "Cataclysmic Interrer Potion Formula",
        description: "The recipe for the Sequence 4 Cataclysmic Interrer potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Ocean Songster Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Ocean Songster of the Tyrant pathway",
        category: "main-ingredient",
      },
      {
        name: "Heart of a Buried Storm",
        description:
          "The crystallised core of a disaster spent and interred, still humming with cataclysm",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of the Tyrant: raise a true disaster, then bury it at your command as you digest the potion",
      requirements: [
        "Call up a tornado, tsunami, or earthquake of genuine destructive force",
        "Direct it where you will, then inter it — quelling the calamity by your own authority",
        "Hold yourself intact as the Tyrant's spirituality floods in, ruling the disaster rather than becoming it",
      ],
    },
  },
  {
    level: 3,
    name: "Sea King",
    classification: "High",
    abilities: [
      {
        name: "Dominion of the Deep",
        description:
          "Rule a controlled expanse of sea — walk the seabed, raise the waters, and bend the currents to your reign",
        type: "active",
      },
      {
        name: "Marine Command",
        description:
          "Command the creatures of the sea, from schooling fish to leviathans, as your subjects",
        type: "active",
      },
      {
        name: "Tsunami Sovereignty",
        description:
          "Dominate tsunamis and storm-surges, raising or stilling them across your waters",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Reign over your waters as a king, answerable to the sea's own order rather than mere whim",
      "Hold your throne as a Saint without letting the deep's cold pride drown your humanity",
      "Command the tides and their creatures justly, sparing those who do not defy you",
    ],
    prerequisiteItems: [
      {
        name: "Sea King Potion Formula",
        description: "The recipe for the Sequence 3 Sea King potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Cataclysmic Interrer Characteristic",
        description:
          "The Beyonder characteristic of a Cataclysmic Interrer, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Crown-Coral of a Drowned Throne",
        description:
          "Coral grown over a sunken seat of power, carrying the authority of a ruler of the deep",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Claim a stretch of sea as your kingdom and rule its waters and creatures as you digest the potion",
      requirements: [
        "Descend to the seabed and lay claim to a domain of the deep",
        "Bend its tides, currents, and creatures to your reign",
        "Drink the potion upon your drowned throne, holding your humanity against the sea's cold pride",
      ],
    },
  },
  {
    level: 2,
    name: "Calamity",
    classification: "Demigod",
    abilities: [
      {
        name: "Greater Tsunami",
        description:
          "Raise tsunamis of forty to fifty metres and lift sea levels across a whole region",
        type: "active",
      },
      {
        name: "Lightning Disaster",
        description:
          "Call down lightning as a natural disaster, scourging a region with the storm's full wrath",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Tyrant's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Unleash calamity with restraint, knowing each disaster tempts the Tyrant's mythical character closer",
      "Anchor your overflowing spirituality before you become nothing but the storm itself",
      "Hold the human heart that remembers the coasts your calamities would drown",
    ],
    prerequisiteItems: [
      {
        name: "Calamity Potion Formula",
        description: "The recipe for the Sequence 2 Calamity potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Sea King Characteristic",
        description:
          "The Beyonder characteristic of a Sea King, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Raise a region-spanning calamity and rein it back as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Raise a great tsunami or lightning disaster across a region",
        "Rein it back before the mythical character of the Tyrant overwrites you",
      ],
    },
  },
  {
    level: 1,
    name: "Thunder God",
    classification: "Demigod",
    abilities: [
      {
        name: "Authority of Thunder",
        description:
          "Wield partial authority over Thunder, Wind, and Calamities at the Angel tier, ruling the storm itself",
        type: "active",
      },
      {
        name: "Incarnation of Light",
        description:
          "Become a body of near-lightspeed energy, striking and moving as living lightning",
        type: "active",
      },
      {
        name: "Heavenly Punishment",
        description:
          "Call down annihilating bolts of judgment upon any who draw your wrath across a vast field",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of the Tyrant",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Tyrant's mythical character",
      "Wield thunder and calamity as a god of the storm, aiming heavenly punishment at the truly defiant",
      "Hold the line between commanding the storm and becoming the storm's blind wrath",
    ],
    prerequisiteItems: [
      {
        name: "Thunder God Potion Formula",
        description: "The recipe for the Sequence 1 Thunder God potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Calamity Characteristic",
        description:
          "The Beyonder characteristic of a Calamity, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Tyrant: consecrate your anchors and become the Incarnation of Light amid a true storm as you digest the potion",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Become a body of living lightning at the heart of a storm and loose a heavenly punishment",
        "Endure the mythical character of the Tyrant pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

const doorSequences: Sequence[] = [
  {
    level: 9,
    name: "Apprentice",
    classification: "Low",
    abilities: [
      {
        name: "Door Opening",
        description:
          "Open a symbolic, incorporeal door to phase yourself through walls and obstacles",
        type: "active",
      },
      {
        name: "Unrestrained Movement",
        description:
          "Slip free of restraints and barriers; you are rarely cornered or held",
        type: "passive",
      },
      {
        name: "Spatial Intuition",
        description:
          "An instinct for the layout of space and the routes that lead out of it",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Travel and roam freely — never let yourself be tied to one place",
      "Probe doors, thresholds, and passages with restless curiosity",
      "Find the way out of any space you enter",
    ],
    prerequisiteItems: [
      {
        name: "Apprentice Potion Formula",
        description: "The recipe for the Sequence 9 Apprentice potion",
        category: "potion-formula",
      },
      {
        name: "Gem-Eating Worm",
        description: "One Gem-Eating Worm, a creature that devours precious stones",
        category: "main-ingredient",
      },
      {
        name: "Phantom Crystal",
        description: "One Phantom Crystal, a stone shot through with illusory light",
        category: "main-ingredient",
      },
      {
        name: "Goat's-Beard Grass Hydrosol",
        description: "10 drops of hydrosol distilled from goat's-beard grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Ancient Well Water",
        description: "90 milliliters of water drawn from an ancient well",
        category: "supplementary-ingredient",
      },
      {
        name: "Grave-Grown Flower",
        description: "Any single flower grown from a corpse",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit-Tainted Soil",
        description: "5 grams of soil contaminated by spirit-world creatures",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Trickmaster",
    classification: "Low",
    abilities: [
      {
        name: "Flash",
        description:
          "Blink a short distance through space, vanishing and reappearing nearby",
        type: "active",
      },
      {
        name: "Escape Trick",
        description:
          "Slip out of bindings, traps, and tight corners with spatial sleight",
        type: "active",
      },
      {
        name: "Object Manipulation",
        description:
          "Shift and manipulate objects at a distance through small spatial tricks",
        type: "active",
      },
      {
        name: "Elemental Trick",
        description: "Loose minor tricks of electric shock, freezing, or sudden gas",
        type: "active",
      },
    ],
    actingRequirements: [
      "Delight in movement and misdirection — make a performance of slipping away",
      "Keep wandering; a Trickmaster belongs to the road, not a room",
      "Treat every obstacle as a puzzle of space to be tricked open",
    ],
    prerequisiteItems: [
      {
        name: "Trickmaster Potion Formula",
        description: "The recipe for the Sequence 8 Trickmaster potion",
        category: "potion-formula",
      },
      {
        name: "Spirit-Eater Stomach Sac",
        description:
          "The stomach sac of a Spirit-Eater, a creature that consumes spirits",
        category: "main-ingredient",
      },
      {
        name: "Deep-Sea Garfish Blood",
        description: "20 milliliters of blood from a Deep-Sea Garfish",
        category: "main-ingredient",
      },
      {
        name: "Hornbeam Essential Oil",
        description: "5 milliliters of essential oil pressed from hornbeam",
        category: "supplementary-ingredient",
      },
      {
        name: "Thread-Ball Grass Powder",
        description: "10 grams of powdered thread-ball grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Red Chestnut Bloom",
        description: "One fully open red chestnut flower",
        category: "supplementary-ingredient",
      },
      {
        name: "Pure Water",
        description: "80 milliliters of pure water",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Escape an inescapable confinement using only spatial tricks",
      requirements: [
        "Have yourself sealed in a bound and warded space with no ordinary exit",
        "Work free using Flash, Escape Trick, and spatial sleight alone",
        "Leave behind no sign of how the escape was made",
      ],
    },
  },
  {
    level: 7,
    name: "Astrologer",
    classification: "Mid",
    abilities: [
      {
        name: "Divination Arts",
        description:
          "Read the stars and the spirit world to divine the future and the hidden",
        type: "active",
      },
      {
        name: "Spirit Vision",
        description: "Perceive the spirit world and the traces left upon it",
        type: "active",
      },
      {
        name: "Anti-Divination",
        description: "Cloak yourself and your doings against the divination of others",
        type: "passive",
      },
      {
        name: "Spiritual Intuition",
        description: "A passive sense for danger and anomalies drawn from the stars",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Chart the stars and the spirit world; let curiosity drive your study",
      "Wander far in pursuit of secret knowledge and distant skies",
      "Keep your own path veiled even as you read the paths of others",
    ],
    prerequisiteItems: [
      {
        name: "Astrologer Potion Formula",
        description: "The recipe for the Sequence 7 Astrologer potion",
        category: "potion-formula",
      },
      {
        name: "Meteor Crystal",
        description: "A crystal condensed from fallen meteoric matter",
        category: "main-ingredient",
      },
      {
        name: "Lavos Squid Blood Crystal",
        description: "A crystallised lump of blood from a Lavos Squid",
        category: "main-ingredient",
      },
      {
        name: "Clematis Powder",
        description: "10 grams of powdered clematis",
        category: "supplementary-ingredient",
      },
      {
        name: "Withered Grapevine",
        description: "One length of withered grapevine",
        category: "supplementary-ingredient",
      },
      {
        name: "Octopus Eyes",
        description: "A pair of eyes from any kind of octopus",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "80 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Chart a true and hidden course of the stars to divine a sealed secret",
      requirements: [
        "Map the stars as they truly stand, beyond ordinary astronomy",
        "Use the chart to divine a secret guarded against divination",
        "Record the working without alerting what you have spied upon",
      ],
    },
  },
  {
    level: 6,
    name: "Scribe",
    classification: "Mid",
    abilities: [
      {
        name: "Record",
        description:
          "Record the Beyonder power of another into yourself, to be replayed at need",
        type: "active",
      },
      {
        name: "Recorded Replay",
        description: "Loose a recorded ability as if it were your own, once stored",
        type: "active",
      },
      {
        name: "Spatial Storage",
        description: "Tuck objects and writings away into a small folded pocket of space",
        type: "active",
      },
      {
        name: "Perfect Recall",
        description: "Flawless memory of everything you have recorded and read",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Record, catalogue, and preserve — knowledge and power alike",
      "Roam widely to gather what is worth recording",
      "Guard your records and the spaces you fold them into",
    ],
    prerequisiteItems: [
      {
        name: "Scribe Potion Formula",
        description: "The recipe for the Sequence 6 Scribe potion",
        category: "potion-formula",
      },
      {
        name: "Complete Asman Brain",
        description:
          "One complete brain of an Asman, a knowledge-hoarding spirit-world being",
        category: "main-ingredient",
      },
      {
        name: "Cursed Object of an Ancient Wraith",
        description: "A cursed object left behind by an ancient wraith",
        category: "main-ingredient",
      },
      {
        name: "Diary Older Than Twenty-Two Years",
        description: "Three pages of a diary more than twenty-two years old",
        category: "supplementary-ingredient",
      },
      {
        name: "Quicksilver",
        description: "10 milliliters of quicksilver",
        category: "supplementary-ingredient",
      },
      {
        name: "Honeysuckle Essential Oil",
        description: "10 drops of honeysuckle essential oil",
        category: "supplementary-ingredient",
      },
      {
        name: "Three Waters",
        description: "30 milliliters each of seawater, lake water, and glacier water",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Record and faithfully replay the power of a hostile Beyonder",
      requirements: [
        "Witness and record a Beyonder ability in the midst of a true conflict",
        "Replay the recorded power exactly as its owner wielded it",
        "Keep your store of records intact through the ordeal",
      ],
    },
  },
  {
    level: 5,
    name: "Traveler",
    classification: "Mid",
    abilities: [
      {
        name: "Traveling",
        description:
          "Open doors across great distances and travel through the spirit world",
        type: "active",
      },
      {
        name: "Blink",
        description: "Teleport yourself, and what you carry, across line of sight",
        type: "active",
      },
      {
        name: "Positioning",
        description: "Fix and recall spatial coordinates, returning to them at will",
        type: "active",
      },
      {
        name: "Invisible Hand",
        description: "Reach through folded space to act on things far from your body",
        type: "active",
      },
    ],
    actingRequirements: [
      "Travel without limit — let no distance or border hold you",
      "Map the spirit world's far places and the doors between them",
      "Carry your curiosity to every threshold you can reach",
    ],
    prerequisiteItems: [
      {
        name: "Traveler Potion Formula",
        description: "The recipe for the Sequence 5 Traveler potion",
        category: "potion-formula",
      },
      {
        name: "Wandering Hide",
        description: "The Wandering Hide, the cast-off skin of a spirit-world rover",
        category: "main-ingredient",
      },
      {
        name: "Shadowless Demon Wolf Heart",
        description: "The heart of a Shadowless Demon Wolf, a beast that casts no shadow",
        category: "main-ingredient",
      },
      {
        name: "Trapped-Ghost Residual Powder",
        description: "10 grams of powder left by a trapped, dispersed ghost",
        category: "supplementary-ingredient",
      },
      {
        name: "Lemon Balm Powder",
        description: "10 grams of powdered lemon balm",
        category: "supplementary-ingredient",
      },
      {
        name: "Star Map in Spiritual Blood",
        description: "A star map drawn in spiritually-charged blood",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadowless Demon Wolf Blood",
        description: "80 milliliters of blood from a Shadowless Demon Wolf",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Anchor a network of waypoints across the spirit world to travel freely between them",
      requirements: [
        "Establish four distinct, far-flung coordinates deep within the spirit world",
        "Bind them into a single network you can traverse at will",
        "Travel the full circuit and return to your starting point unharmed",
      ],
    },
  },
  {
    level: 4,
    name: "Secrets Sorcerer",
    classification: "High",
    abilities: [
      {
        name: "Space Concealment",
        description:
          "Split a region into a hidden pocket of space reachable only through a door of your making",
        type: "active",
      },
      {
        name: "Pocket-Dimension Forging",
        description:
          "Fold whole rooms and vaults into mystical items, carrying spaces in your pocket",
        type: "active",
      },
      {
        name: "Door Transfiguration",
        description:
          "Transform yourself into a host of doors, scattering through space and reforming at will",
        type: "active",
      },
    ],
    actingRequirements: [
      "Guard the secret spaces you fold away as a sorcerer guards their library, never spilling them carelessly",
      "Master the swelling spatial authority of a Saint without losing track of where your own self resides",
      "Wander and probe space with curiosity, yet always keep a door open back to who you are",
    ],
    prerequisiteItems: [
      {
        name: "Secrets Sorcerer Potion Formula",
        description: "The recipe for the Sequence 4 Secrets Sorcerer potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Traveler Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Traveler of the Door pathway",
        category: "main-ingredient",
      },
      {
        name: "Keystone of a Folded Room",
        description:
          "The keystone of a space already folded out of the world, the seed of a new pocket dimension",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of the Door: fold a true space into concealment and step through your own door as you digest the potion",
      requirements: [
        "Split a region into a hidden pocket of space sealed behind a door of your making",
        "Fold that space into a mystical item and carry it through the rite",
        "Hold yourself intact as the Door's spatial spirituality floods in, keeping one door always open to your self",
      ],
    },
  },
  {
    level: 3,
    name: "Wanderer",
    classification: "High",
    abilities: [
      {
        name: "Astral Wandering",
        description:
          "Walk the Astral World and the cosmos, stepping to distant planets across the void",
        type: "active",
      },
      {
        name: "Space Tearing",
        description:
          "Rend space open to strike, sever, or pass through whatever it encloses",
        type: "active",
      },
      {
        name: "Boundless Stride",
        description:
          "No distance, wall, or border can truly contain you; the cosmos itself is your road",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Wander the cosmos with a Saint's curiosity, yet keep a thread that leads home to yourself",
      "Tear space with care, never carelessly unmaking what holds the world together",
      "Hold your identity across the far places you walk, lest the void wander off with it",
    ],
    prerequisiteItems: [
      {
        name: "Wanderer Potion Formula",
        description: "The recipe for the Sequence 3 Wanderer potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Secrets Sorcerer Characteristic",
        description:
          "The Beyonder characteristic of a Secrets Sorcerer, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Dust of a Distant World",
        description:
          "Soil gathered from a planet across the Astral World, proof of a true crossing",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Cross the Astral World to a distant world and return as you digest the potion",
      requirements: [
        "Tear space and step into the Astral World under your own power",
        "Reach a distant world across the cosmos and set foot upon it",
        "Drink the potion at the far place and find your way home without leaving your self behind",
      ],
    },
  },
  {
    level: 2,
    name: "Planeswalker",
    classification: "Demigod",
    abilities: [
      {
        name: "Symbolization",
        description:
          "Reduce space, distance, and barriers to symbols you can rearrange, walking between planes at will",
        type: "active",
      },
      {
        name: "Plane Folding",
        description:
          "Fold whole planes against one another so that far places touch and doors open between worlds",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Door's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk the planes with restraint, knowing each symbolization tempts the Door's mythical character closer",
      "Anchor your overflowing spirituality before space itself loses track of where you belong",
      "Hold the human thread that fixes you to one home among infinite doors",
    ],
    prerequisiteItems: [
      {
        name: "Planeswalker Potion Formula",
        description: "The recipe for the Sequence 2 Planeswalker potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Wanderer Characteristic",
        description:
          "The Beyonder characteristic of a Wanderer — of the nine Door characteristics that may ever exist, one must be free for this advancement",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Reduce a true span of space to a symbol and walk between planes as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Symbolize a genuine expanse of space and fold two planes into contact",
        "Walk between them and back before the mythical character of the Door overwrites you",
      ],
    },
  },
  {
    level: 1,
    name: "Key of Stars",
    classification: "Demigod",
    abilities: [
      {
        name: "Space Fragmentation",
        description:
          "Shatter space itself across a battlefield, scattering matter, light, and motion into fragments",
        type: "active",
      },
      {
        name: "Stellar Gravity Manipulation",
        description:
          "Wield the gravity of stars to bend space, time, and light and to crush what they touch",
        type: "active",
      },
      {
        name: "Door of the Heavens",
        description:
          "Open doors between the stars at the Angel tier, traversing the cosmos in a single step",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of the Door",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Door's mythical character",
      "Wield the gravity of stars gravely, knowing a careless fracture can unmake what cannot be remade",
      "Hold the line between unlocking the cosmos and scattering yourself among its fragments",
    ],
    prerequisiteItems: [
      {
        name: "Key of Stars Potion Formula",
        description: "The recipe for the Sequence 1 Key of Stars potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Planeswalker Characteristic",
        description:
          "The Beyonder characteristic of a Planeswalker, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Door: consecrate your anchors and draw on stellar gravity to fracture and remake space as you digest the potion",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Draw upon the gravity of a star to shatter and then restore a span of space",
        "Endure the mythical character of the Door pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

const errorSequences: Sequence[] = [
  {
    level: 9,
    name: "Marauder",
    classification: "Low",
    abilities: [
      {
        name: "Theft",
        description:
          "Steal physical items with supernatural deftness — your hands take what they reach for",
        type: "active",
      },
      {
        name: "Agile Hands",
        description: "Extraordinary finger dexterity for sleight of hand and fine work",
        type: "passive",
      },
      {
        name: "Superior Observation",
        description: "Sense at a glance where valuables are hidden within reach",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steal and pilfer as a calling — let theft become second nature",
      "Trick and deceive your marks; never take by force what guile can lift",
      "Slip away unseen with what you have taken",
    ],
    prerequisiteItems: [
      {
        name: "Marauder Potion Formula",
        description: "The recipe for the Sequence 9 Marauder potion",
        category: "potion-formula",
      },
      {
        name: "Blood-Spotted Black Mosquito",
        description:
          "One Blood-Spotted Black Mosquito, a supernatural blood-feeding insect",
        category: "main-ingredient",
      },
      {
        name: "Candle-Eating Spirit Core",
        description: "The core of a Candle-Eating Spirit, a creature that devours flame",
        category: "main-ingredient",
      },
      {
        name: "Others' Blood",
        description: "100 milliliters of blood taken from other people",
        category: "supplementary-ingredient",
      },
      {
        name: "Nail Fragments",
        description: "Nine nail fragments, each from a different person",
        category: "supplementary-ingredient",
      },
      {
        name: "Sapphire",
        description: "One sapphire",
        category: "supplementary-ingredient",
      },
      {
        name: "Vervain Powder",
        description: "10 grams of powdered vervain",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Swindler",
    classification: "Low",
    abilities: [
      {
        name: "Eloquence",
        description: "Spin words that beguile, persuade, and disarm those who listen",
        type: "active",
      },
      {
        name: "Charm",
        description:
          "Project a charisma that lowers the guard and wins the trust of marks",
        type: "active",
      },
      {
        name: "Thought Misdirection",
        description:
          "Steer a target's attention and assumptions where you wish them to go",
        type: "active",
      },
      {
        name: "Theft",
        description: "Steal not only objects but small advantages and openings",
        type: "active",
      },
    ],
    actingRequirements: [
      "Con and beguile — let your tongue do the stealing",
      "Live by trickery; build and burn false trust as the scheme demands",
      "Vanish before the deception is discovered",
    ],
    prerequisiteItems: [
      {
        name: "Swindler Potion Formula",
        description: "The recipe for the Sequence 8 Swindler potion",
        category: "potion-formula",
      },
      {
        name: "Human-Faced Pitcher Plant",
        description:
          "One Human-Faced Pitcher Plant, a carnivorous flower bearing a human visage",
        category: "main-ingredient",
      },
      {
        name: "Charm-Swarm Larva",
        description: "One larva from a Charm-Swarm, insects that bewitch the mind",
        category: "main-ingredient",
      },
      {
        name: "Pure Water",
        description: "100 milliliters of pure water",
        category: "supplementary-ingredient",
      },
      {
        name: "Others' Tears",
        description: "20 milliliters of tears taken from other people",
        category: "supplementary-ingredient",
      },
      {
        name: "Lapis Lazuli",
        description: "One lapis lazuli",
        category: "supplementary-ingredient",
      },
      {
        name: "White Chestnut Balm",
        description: "10 grams of white chestnut balm",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Carry off a grand confidence scheme by guile without ever being unmasked",
      requirements: [
        "Construct an elaborate deception against a wary mark",
        "See the scheme through to its profitable end using words and misdirection alone",
        "Withdraw before the swindle is ever uncovered",
      ],
    },
  },
  {
    level: 7,
    name: "Cryptologist",
    classification: "Mid",
    abilities: [
      {
        name: "Decryption",
        description:
          "Unravel ciphers, codes, and hidden meanings with supernatural insight",
        type: "active",
      },
      {
        name: "Thought Theft",
        description: "Steal fragments of thought and intention from an unguarded mind",
        type: "active",
      },
      {
        name: "Superior Observation",
        description: "Read the smallest tells and the patterns others overlook",
        type: "passive",
      },
      {
        name: "Cipher Mind",
        description:
          "Hold and manipulate vast webs of code and secret knowledge in memory",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Break codes and steal secrets; let no cipher stand against you",
      "Trick understanding from the guarded and the unwilling",
      "Keep your own methods encrypted and unknowable",
    ],
    prerequisiteItems: [
      {
        name: "Cryptologist Potion Formula",
        description: "The recipe for the Sequence 7 Cryptologist potion",
        category: "potion-formula",
      },
      {
        name: "Sphinx Brain",
        description: "The brain of a Sphinx, a riddling Beyonder beast",
        category: "main-ingredient",
      },
      {
        name: "Charm-Swarm Adult",
        description: "One adult from a Charm-Swarm",
        category: "main-ingredient",
      },
      {
        name: "Sphinx Blood",
        description: "80 milliliters of blood from a Sphinx",
        category: "supplementary-ingredient",
      },
      {
        name: "Charm-Swarm Mucus",
        description: "10 drops of mucus left by a Charm-Swarm",
        category: "supplementary-ingredient",
      },
      {
        name: "Moonstone",
        description: "One moonstone",
        category: "supplementary-ingredient",
      },
      {
        name: "Wild Rose",
        description: "One wild rose",
        category: "supplementary-ingredient",
      },
      {
        name: "A Cipher of Your Own Design",
        description: "A set of codes you have devised yourself, written on paper",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Crack an unbreakable cipher and steal the secret it guards",
      requirements: [
        "Obtain a code believed to be beyond breaking",
        "Decrypt it and lift the protected secret without the owner's knowledge",
        "Leave the cipher seemingly untouched",
      ],
    },
  },
  {
    level: 6,
    name: "Prometheus",
    classification: "Mid",
    abilities: [
      {
        name: "Ability Theft",
        description:
          "Steal the Beyonder ability of another, taking their power as your own",
        type: "active",
      },
      {
        name: "Fire of Knowledge",
        description:
          "Bestow or kindle stolen power and knowledge in others, like stolen fire",
        type: "active",
      },
      {
        name: "Mental Resistance",
        description:
          "Strong resistance to mental intrusion and the imprints of stolen powers",
        type: "passive",
      },
      {
        name: "Superior Observation",
        description: "Perceive the abilities and weaknesses worth stealing in a foe",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steal power itself — take the abilities of Beyonders as a thief takes fire",
      "Deceive and outwit those stronger than you to rob them of their strength",
      "Share or hoard your stolen fire as cunning dictates",
    ],
    prerequisiteItems: [
      {
        name: "Prometheus Potion Formula",
        description: "The recipe for the Sequence 6 Prometheus potion",
        category: "potion-formula",
      },
      {
        name: "Crystal Threadworm",
        description:
          "One Crystal Threadworm, a worm grown from crystallised spirit-matter",
        category: "main-ingredient",
      },
      {
        name: "Robed Phantom Attachment",
        description:
          "An attachment-object left by a Robed Phantom, a cloaked wandering spirit",
        category: "main-ingredient",
      },
      {
        name: "Freshly Stolen Fine Wine",
        description: "100 milliliters of fine wine that has just been stolen",
        category: "supplementary-ingredient",
      },
      {
        name: "Robed Phantom Residual Powder",
        description: "10 grams of powder left by a Robed Phantom",
        category: "supplementary-ingredient",
      },
      {
        name: "Citrine",
        description: "One citrine",
        category: "supplementary-ingredient",
      },
      {
        name: "Larch Essential Oil",
        description: "10 drops of larch essential oil",
        category: "supplementary-ingredient",
      },
      {
        name: "A Source of Fire",
        description: "One kindling source of fire",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Steal a Beyonder's signature power in the heat of conflict and wield it",
      requirements: [
        "Confront a Beyonder and pry loose their signature ability",
        "Bind the stolen power into yourself as if it had always been yours",
        "Withstand the imprint of its former owner without losing your self",
      ],
    },
  },
  {
    level: 5,
    name: "Dream Stealer",
    classification: "Mid",
    abilities: [
      {
        name: "Disguise",
        description:
          "Steal an identity at the level of heavenly mysteries, becoming another in the eyes of fate",
        type: "active",
      },
      {
        name: "Thought Usurpation",
        description: "Seize and supplant the thoughts and intentions of a target",
        type: "active",
      },
      {
        name: "Dream Intrusion",
        description: "Slip into the dreams of others to steal what they hold dear within",
        type: "active",
      },
      {
        name: "Theft of Mysteries",
        description:
          "Steal increasingly abstract things — ideas, roles, and concealed truths",
        type: "active",
      },
    ],
    actingRequirements: [
      "Steal identities, dreams, and ideas — theft now reaches beyond the material",
      "Deceive even fate; play the villain or hidden hand in others' dreams",
      "Wear stolen selves without losing the thread of your own",
    ],
    prerequisiteItems: [
      {
        name: "Dream Stealer Potion Formula",
        description: "The recipe for the Sequence 5 Dream Stealer potion",
        category: "potion-formula",
      },
      {
        name: "Dream-Eating Rat Heart",
        description: "The heart of a Dream-Eating Rat, a vermin that gnaws on dreams",
        category: "main-ingredient",
      },
      {
        name: "Spirit of Fallen Aura",
        description: "The spirit of a Fallen Aura, the lingering essence of depravity",
        category: "main-ingredient",
      },
      {
        name: "Dream-Eating Rat Blood",
        description: "30 milliliters of blood from a Dream-Eating Rat",
        category: "supplementary-ingredient",
      },
      {
        name: "Despiritualized Fallen Aura",
        description: "30 milliliters of Fallen Aura drained of its spirituality",
        category: "supplementary-ingredient",
      },
      {
        name: "Celestite",
        description: "One celestite",
        category: "supplementary-ingredient",
      },
      {
        name: "Lavender Hydrosol",
        description: "10 drops of lavender hydrosol",
        category: "supplementary-ingredient",
      },
      {
        name: "Tears of Broken Dreams",
        description: "50 milliliters of another's tears shed over a shattered ideal",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a recurring figure in the dreams of many, then steal away with what they hold dear",
      requirements: [
        "Take a leading role in the unconscious dreams of at least thirty people",
        "Ensure those dreams are unfolding at the moment you consume the potion",
        "Steal from within the dreams without waking the dreamers to your theft",
      ],
    },
  },
  {
    level: 4,
    name: "Parasite",
    classification: "High",
    abilities: [
      {
        name: "Spirit Parasitism",
        description:
          "Latch onto a target's Spirit Body, lurking concealed or seizing control as you choose",
        type: "active",
      },
      {
        name: "Theft of Life",
        description:
          "Siphon vitality, memory, and power from your host, stealing more the longer you cling",
        type: "active",
      },
      {
        name: "Emergent Plunder",
        description:
          "On leaving a host, carry off a portion of what was theirs as your own",
        type: "active",
      },
    ],
    actingRequirements: [
      "Take by parasitism and theft rather than by force, leaving your hand unseen until you strike",
      "Master the swelling spirituality of a Saint without letting your borrowed lives blur whose self is yours",
      "Steal what you need and move on, never clinging so long that the host's nature overtakes you",
    ],
    prerequisiteItems: [
      {
        name: "Parasite Potion Formula",
        description: "The recipe for the Sequence 4 Parasite potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Dream Stealer Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Dream Stealer of the Error pathway",
        category: "main-ingredient",
      },
      {
        name: "Larva of a Spirit-Latching Worm",
        description:
          "The larval form of a worm that fastens to spirit bodies, the living seed of parasitism",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of Error: fasten upon a worthy host's spirit, plunder it, and emerge enriched as you digest the potion",
      requirements: [
        "Latch onto the Spirit Body of a powerful host without being noticed",
        "Steal life, memory, and power, then time your emergence to carry off the most",
        "Hold yourself intact as Error's spirituality floods in, keeping your own self separate from every host you wore",
      ],
    },
  },
  {
    level: 3,
    name: "Mentor of Deceit",
    classification: "High",
    abilities: [
      {
        name: "Deceit of Concepts",
        description:
          "Extend deception to abstract things — rules, categories, and the reality a mind takes for granted",
        type: "active",
      },
      {
        name: "Lesser Authority of Deceit",
        description:
          "Make a lie momentarily true within its bounds, the world briefly mistaking false for fact",
        type: "active",
      },
      {
        name: "Unreadable Self",
        description:
          "Your own nature and intent are wrapped in deceit, beyond the reading of others",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Deceive at the level of concepts and rules, never letting your own lies convince yourself",
      "Mentor deception with a Saint's discipline, holding to the one truth of who you are",
      "Bear the swelling authority of Deceit without forgetting which of your faces is real",
    ],
    prerequisiteItems: [
      {
        name: "Mentor of Deceit Potion Formula",
        description: "The recipe for the Sequence 3 Mentor of Deceit potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Parasite Characteristic",
        description:
          "The Beyonder characteristic of a Parasite, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Contract Written in a True Lie",
        description:
          "A document whose central falsehood the world briefly upheld, steeped in the authority of Deceit",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Make a lie about a rule of reality briefly true and unmake it again as you digest the potion",
      requirements: [
        "Craft a deception that targets a concept or rule rather than a mere fact",
        "Make it momentarily true within its bounds by your lesser authority of Deceit",
        "Drink the potion as the lie collapses, holding to your own truth through the deceit",
      ],
    },
  },
  {
    level: 2,
    name: "Trojan Horse of Destiny",
    classification: "Demigod",
    abilities: [
      {
        name: "Theft of Fate",
        description:
          "Steal the fate and destiny of a target, taking their luck, doom, or appointed end as your own",
        type: "active",
      },
      {
        name: "Hidden Within Destiny",
        description:
          "Conceal yourself inside another's fate, carried past every guard until you choose to emerge",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward Error's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steal fate with restraint, knowing each theft tempts Error's mythical character closer",
      "Anchor your overflowing spirituality before the stolen destinies crowd out your own",
      "Hold the human thread that keeps one fate — yours — unmistakably your own",
    ],
    prerequisiteItems: [
      {
        name: "Trojan Horse of Destiny Potion Formula",
        description: "The recipe for the Sequence 2 Trojan Horse of Destiny potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Mentor of Deceit Characteristic",
        description:
          "The Beyonder characteristic of a Mentor of Deceit — of the nine Error characteristics that may ever exist, one must be free for this advancement",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Hide within a target's destiny, steal their fate, and emerge as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Conceal yourself within a true fate and ride it past its guardians",
        "Steal the destiny and emerge before Error's mythical character overwrites you",
      ],
    },
  },
  {
    level: 1,
    name: "Worm of Time",
    classification: "Demigod",
    abilities: [
      {
        name: "Theft of Time",
        description:
          "Steal time itself — aging, duration, even moments — from those you target, as the loophole in Time",
        type: "active",
      },
      {
        name: "Anchor Theft",
        description:
          "Reach through loopholes to steal a rival Beyonder's anchors, tipping them toward loss of control",
        type: "active",
      },
      {
        name: "Authority of Theft",
        description:
          "Wield partial authority over Theft at the Angel tier, taking the abstract and the impossible alike",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of Error",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by Error's mythical character",
      "Steal time and authority as the loophole in Time, yet never come to believe you are owed all you take",
      "Hold the line between exploiting every loophole and becoming one yourself",
    ],
    prerequisiteItems: [
      {
        name: "Worm of Time Potion Formula",
        description: "The recipe for the Sequence 1 Worm of Time potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Trojan Horse of Destiny Characteristic",
        description:
          "The Beyonder characteristic of a Trojan Horse of Destiny, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of Error: consecrate your anchors and steal time itself through a loophole as you digest the potion",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality — and guard them, for a rival may try to steal them mid-rite",
        "Slip into the loophole in Time and steal a true span of it from a worthy target",
        "Endure the mythical character of Error pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

const hangedManSequences: Sequence[] = [
  {
    level: 9,
    name: "Secrets Suppliant",
    classification: "Low",
    abilities: [
      {
        name: "Mysticism Knowledge",
        description:
          "Innate knowledge of sacrifices and ritualistic magic, woven into the potion itself",
        type: "passive",
      },
      {
        name: "Ritualistic Magic",
        description: "Perform binding rituals and divination drawn from secret entities",
        type: "active",
      },
      {
        name: "High Spirituality",
        description: "Heightened spiritual perception and intuition for the hidden",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Seek out forbidden secrets and offer the sacrifices the rites demand",
      "Embrace self-denial and burden; give up comfort in pursuit of knowledge",
      "Bear the distortions of dark knowledge without surrendering your humanity",
    ],
    prerequisiteItems: [
      {
        name: "Secrets Suppliant Potion Formula",
        description: "The recipe for the Sequence 9 Secrets Suppliant potion",
        category: "potion-formula",
      },
      {
        name: "Shadow-Touched Toad Heart",
        description:
          "The heart of a Shadow-Touched Toad, a creature steeped in dark ritual",
        category: "main-ingredient",
      },
      {
        name: "Sacrificial Altar Ash",
        description: "Ash gathered from a stone used in blood sacrifice",
        category: "main-ingredient",
      },
      {
        name: "Black Goat's Blood",
        description: "30 milliliters of blood from a sacrificed black goat",
        category: "supplementary-ingredient",
      },
      {
        name: "Mandrake Root Powder",
        description: "9 grams of powdered mandrake root",
        category: "supplementary-ingredient",
      },
      {
        name: "Graveyard Wormwood Oil",
        description: "7 drops of oil pressed from wormwood grown in a graveyard",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Listener",
    classification: "Low",
    abilities: [
      {
        name: "Listen",
        description:
          "Hear whispers carried on shadow and wind — secrets, intentions, and distant words",
        type: "active",
      },
      {
        name: "Whisper",
        description: "Send words that worm into a target's mind to unsettle or mislead",
        type: "active",
      },
      {
        name: "High Spirituality",
        description: "Greatly heightened spiritual sensitivity to the unseen",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Listen for the secrets others bury; gather whispered truths",
      "Give up your own voice in the world's affairs — observe and abstain",
      "Carry the weight of what you hear without letting it corrupt you",
    ],
    prerequisiteItems: [
      {
        name: "Listener Potion Formula",
        description: "The recipe for the Sequence 8 Listener potion",
        category: "potion-formula",
      },
      {
        name: "Whispering Shadow-Bat Ears",
        description:
          "The ears of a Whispering Shadow-Bat, a creature that hears all secrets",
        category: "main-ingredient",
      },
      {
        name: "Cursed Confessional Wood",
        description: "A fragment of wood from a confessional steeped in secrets",
        category: "main-ingredient",
      },
      {
        name: "Nightshade Hydrosol",
        description: "10 drops of nightshade hydrosol",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadow-Bat Membrane",
        description: "A strip of wing membrane from a Whispering Shadow-Bat",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Candle Wax",
        description: "13 grams of wax from a black ritual candle",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Keep a vigil of silence and listening until a guarded secret reveals itself",
      requirements: [
        "Hold a long vigil in silence, denying yourself speech and comfort",
        "Listen until the shadows yield a secret hidden from all others",
        "Set down the secret faithfully without acting on it for gain",
      ],
    },
  },
  {
    level: 7,
    name: "Shadow Ascetic",
    classification: "Mid",
    abilities: [
      {
        name: "Shadow Summon",
        description: "Call shadows into form to serve, scout, and strike",
        type: "active",
      },
      {
        name: "Shadow Manipulation",
        description: "Shape, extend, and command shadows around you",
        type: "active",
      },
      {
        name: "Shadow Lurking",
        description: "Sink into shadow to move unseen and lie in wait",
        type: "active",
      },
      {
        name: "Shadow Curse",
        description: "Lay curses carried through a target's own shadow",
        type: "active",
      },
    ],
    actingRequirements: [
      "Live as an ascetic of shadow — deny the flesh and dwell in self-imposed hardship",
      "Master the shadows through discipline and sacrifice, never indulgence",
      "Take on burdens others refuse, and ask nothing in return",
    ],
    prerequisiteItems: [
      {
        name: "Shadow Ascetic Potion Formula",
        description: "The recipe for the Sequence 7 Shadow Ascetic potion",
        category: "potion-formula",
      },
      {
        name: "Shadow-Crawler Heart",
        description: "The heart of a Shadow-Crawler, a beast that lives within shadows",
        category: "main-ingredient",
      },
      {
        name: "Penitent's Hair Shirt",
        description: "A scrap of a hair shirt worn by a true penitent ascetic",
        category: "main-ingredient",
      },
      {
        name: "Shadow-Crawler Blood",
        description: "70 milliliters of blood from a Shadow-Crawler",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Tourmaline Powder",
        description: "10 grams of powdered black tourmaline",
        category: "supplementary-ingredient",
      },
      {
        name: "Fasting Salt",
        description: "A pinch of salt blessed through ritual fasting",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Endure a trial of self-denial in darkness while commanding the shadows",
      requirements: [
        "Withdraw into darkness and deny yourself food, light, and ease",
        "Master your summoned shadows through the privation rather than despite it",
        "Emerge having sacrificed comfort without sacrificing your reason",
      ],
    },
  },
  {
    level: 6,
    name: "Rose Bishop",
    classification: "Mid",
    abilities: [
      {
        name: "Flesh and Blood Magic",
        description: "Work magic through flesh and blood — your own or another's",
        type: "active",
      },
      {
        name: "Flesh and Blood Servants",
        description: "Shape servants and constructs from flesh to do your bidding",
        type: "active",
      },
      {
        name: "Flesh Softening",
        description: "Soften and reshape flesh to slip through gaps or absorb blows",
        type: "passive",
      },
      {
        name: "Blood Curse",
        description: "Lay curses through a victim's flesh and blood",
        type: "active",
      },
    ],
    actingRequirements: [
      "Offer flesh and blood in sacrifice — your own offerings first of all",
      "Take up the responsibility of the rite, bearing its cost willingly",
      "Hold to your vows even as the flesh-magic tempts you toward depravity",
    ],
    prerequisiteItems: [
      {
        name: "Rose Bishop Potion Formula",
        description: "The recipe for the Sequence 6 Rose Bishop potion",
        category: "potion-formula",
      },
      {
        name: "Blood-Rose Heart",
        description: "The heart of a Blood-Rose, a flower that feeds on living blood",
        category: "main-ingredient",
      },
      {
        name: "Flesh-Weaver Spinal Fluid",
        description:
          "The spinal fluid of a Flesh-Weaver, a creature that knits living flesh",
        category: "main-ingredient",
      },
      {
        name: "Sacrificial Blood",
        description: "90 milliliters of blood freely given in sacrifice",
        category: "supplementary-ingredient",
      },
      {
        name: "Blood-Rose Petals",
        description: "7 crimson petals from a Blood-Rose",
        category: "supplementary-ingredient",
      },
      {
        name: "Carmine Sandalwood Oil",
        description: "10 drops of carmine sandalwood oil",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Complete a great flesh-and-blood rite demanding genuine sacrifice",
      requirements: [
        "Prepare a flesh-and-blood working that cannot be done without true sacrifice",
        "Offer up the required cost from your own flesh and blood, not only another's",
        "Complete the rite without letting it corrupt your purpose",
      ],
    },
  },
  {
    level: 5,
    name: "Shepherd",
    classification: "Mid",
    abilities: [
      {
        name: "Grazing",
        description:
          "Graze upon souls and spirits, devouring a portion of their power to fuel your own",
        type: "active",
      },
      {
        name: "Flesh and Blood Magic",
        description: "Command greatly amplified flesh-and-blood and shadow magic",
        type: "active",
      },
      {
        name: "Devouring",
        description:
          "Consume spirits and flesh to grow your dominion and replenish yourself",
        type: "active",
      },
      {
        name: "Shepherd's Flock",
        description: "Marshal a flock of shadow- and flesh-servants bound to your will",
        type: "active",
      },
    ],
    actingRequirements: [
      "Shepherd the souls and shadows in your keeping, bearing responsibility for them",
      "Sacrifice and deny yourself for the sake of the flock you have gathered",
      "Resist the pull toward sin and degeneration that the power invites",
    ],
    prerequisiteItems: [
      {
        name: "Shepherd Potion Formula",
        description: "The recipe for the Sequence 5 Shepherd potion",
        category: "potion-formula",
      },
      {
        name: "Soul-Grazing Beast Stomach",
        description: "The stomach of a Soul-Grazing Beast, which feeds upon souls",
        category: "main-ingredient",
      },
      {
        name: "Degenerate Shepherd Crystal",
        description:
          "The spirit-crystal of a Degenerate Shepherd, a fallen flesh-magic spirit",
        category: "main-ingredient",
      },
      {
        name: "Sacrificed Soul",
        description: "A soul freely surrendered in sacrifice",
        category: "supplementary-ingredient",
      },
      {
        name: "Soul-Grazing Beast Blood",
        description: "100 milliliters of blood from a Soul-Grazing Beast",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadow-Steeped Soil",
        description: "17 grams of soil steeped in a Degenerate Shepherd's shadow",
        category: "supplementary-ingredient",
      },
      {
        name: "Crimson Tree Sap",
        description: "10 drops of sap from a crimson flesh-tree",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Gather a flock of souls and sustain them through your own sacrifice without falling to depravity",
      requirements: [
        "Draw a number of bound souls and spirits into your keeping",
        "Sustain and shepherd them by grazing and sacrifice rather than mere devouring",
        "Hold your purpose against the depravity the power presses upon you",
      ],
    },
  },
  {
    level: 4,
    name: "Black Knight",
    classification: "High",
    abilities: [
      {
        name: "Cull of Spiritual Flesh",
        description:
          "Forge a Black Greatsword from Degeneration that corrodes flesh and obliterates the souls it cuts",
        type: "active",
      },
      {
        name: "Black Armor",
        description:
          "Clad yourself in armor of solidified depravity that turns aside blows and curses alike",
        type: "active",
      },
      {
        name: "Shadow of Depravation",
        description:
          "Cast a corrupting shadow that degrades and weakens whatever it falls across",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bear the burden of the cull as a knight bears a vow, sacrificing for the flock rather than for power",
      "Master the swelling depravity of a Saint without letting the corruption rule your purpose",
      "Take up suffering and responsibility others refuse, asking nothing in return",
    ],
    prerequisiteItems: [
      {
        name: "Black Knight Potion Formula",
        description: "The recipe for the Sequence 4 Black Knight potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 5 Shepherd Characteristic",
        description:
          "The Beyonder characteristic distilled from a fallen Shepherd of the Hanged Man pathway",
        category: "main-ingredient",
      },
      {
        name: "Iron Quenched in Degeneration",
        description:
          "Black iron tempered in the authority of Degeneration, the raw material of the Black Greatsword",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a Saint of the Hanged Man: forge the Black Greatsword through genuine sacrifice and master it as you digest the potion",
      requirements: [
        "Forge a Black Greatsword from Degeneration at the cost of your own flesh and blood",
        "Cull a corruption that cannot be ended without true sacrifice",
        "Hold yourself intact as the Hanged Man's depravity floods in, bearing the burden without becoming it",
      ],
    },
  },
  {
    level: 3,
    name: "Trinity Templar",
    classification: "High",
    abilities: [
      {
        name: "Trinity Body",
        description:
          "Sprout a youthful and an elderly head and split into three bodies that act as one will",
        type: "active",
      },
      {
        name: "Threefold Grazing",
        description:
          "Graze upon as many as three souls at once, devouring their power to fuel your own",
        type: "active",
      },
      {
        name: "Sacrificial Resilience",
        description:
          "What harms one of your three bodies is borne by the trinity together, none easily felled",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Bear the trinity's burdens across all three of your selves without any one of them straying from your vow",
      "Graze and sacrifice as a templar of the flock, never for mere appetite",
      "Hold one purpose across three bodies as a Saint, lest the trinity fracture your self",
    ],
    prerequisiteItems: [
      {
        name: "Trinity Templar Potion Formula",
        description: "The recipe for the Sequence 3 Trinity Templar potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 4 Black Knight Characteristic",
        description:
          "The Beyonder characteristic of a Black Knight, the one true ingredient this Saint's advancement requires",
        category: "main-ingredient",
      },
      {
        name: "Relic of a Threefold Saint",
        description:
          "A relic left by a templar who held one vow across three bodies, steeped in unity-through-sacrifice",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Split into the Trinity Body and hold one will across three selves as you digest the potion",
      requirements: [
        "Sprout the youthful and elderly heads and divide into three bodies",
        "Graze three souls at once without any one body straying from your shared purpose",
        "Drink the potion as the trinity acts as one, holding your single self against the split",
      ],
    },
  },
  {
    level: 2,
    name: "Profane Presbyter",
    classification: "Demigod",
    abilities: [
      {
        name: "Profane Language",
        description:
          "Speak words of Degeneration and Corruption that rot, debase, and unmake whatever they name",
        type: "active",
      },
      {
        name: "Turned Words",
        description:
          "Seize a target's own words and turn their meaning into a weapon against them",
        type: "active",
      },
      {
        name: "Spirituality Overflow",
        description:
          "Your spirituality overflows your flesh, granting near-immunity to harm while straining toward the Hanged Man's mythical form",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Speak the profane tongue with restraint, knowing each curse tempts the mythical character closer",
      "Anchor your overflowing spirituality before the authority of Corruption hollows you out",
      "Hold the human thread that keeps your words a burden borne rather than a poison spread",
    ],
    prerequisiteItems: [
      {
        name: "Profane Presbyter Potion Formula",
        description: "The recipe for the Sequence 2 Profane Presbyter potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 3 Trinity Templar Characteristic",
        description:
          "The Beyonder characteristic of a Trinity Templar, surrendered so a near-Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Speak a true word of Profane Language and bear its corruption without being consumed as you digest the potion",
      requirements: [
        "Prepare anchors enough to hold your overflowing spirituality through the rite",
        "Speak the Profane Language to degrade a worthy target and turn their own words against them",
        "Bear the corruption you wield as the mythical character of the Hanged Man presses to overwrite you",
      ],
    },
  },
  {
    level: 1,
    name: "Dark Angel",
    classification: "Demigod",
    abilities: [
      {
        name: "Shadow World Command",
        description:
          "Reach into and reshape the Shadow World at the Angel tier, drawing on it as your domain",
        type: "active",
      },
      {
        name: "Shadow Immunity",
        description:
          "Shadow-based abilities turn harmlessly aside; the dark cannot be used to harm one who rules it",
        type: "passive",
      },
      {
        name: "Authority of Corruption",
        description:
          "Wield partial authority over Corruption and Degeneration, debasing flesh, spirit, and matter alike",
        type: "active",
      },
      {
        name: "Angelic Spirituality",
        description:
          "An Angel's overflowing spirituality grants near-immortality, but without anchors it bleeds toward the mythical form of the Hanged Man",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sustain your anchors without fail — an unanchored Angel is assimilated by the Hanged Man's mythical character",
      "Rule the Shadow World as its angel, bearing its corruption as a duty rather than indulging it",
      "Hold the line between commanding depravity and becoming its willing servant",
    ],
    prerequisiteItems: [
      {
        name: "Dark Angel Potion Formula",
        description: "The recipe for the Sequence 1 Dark Angel potion",
        category: "potion-formula",
      },
      {
        name: "Sequence 2 Profane Presbyter Characteristic",
        description:
          "The Beyonder characteristic of a Profane Presbyter, surrendered so an Angel may rise",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Ascend to Angel of the Hanged Man: consecrate your anchors and lay claim to the Shadow World as you digest the potion without being unmade",
      requirements: [
        "Consecrate the anchors that will bind your Angelic spirituality before drinking",
        "Reach into the Shadow World and bend a portion of it to your command",
        "Endure the mythical character of the Hanged Man pressing to overwrite you, and emerge still yourself",
      ],
    },
  },
];

export const FOOL_PATHWAY: Pathway = {
  id: 1,
  name: "Fool",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [8, 7],
  sequences: foolSequences,
};

export const VISIONARY_PATHWAY: Pathway = {
  id: 2,
  name: "Visionary",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [3, 6, 9, 10],
  sequences: visionarySequences,
};

export const SUN_PATHWAY: Pathway = {
  id: 3,
  name: "Sun",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 6, 9, 10],
  sequences: sunSequences,
};

export const DEATH_PATHWAY: Pathway = {
  id: 4,
  name: "Death",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [5, 11],
  sequences: deathSequences,
};

// Darkness, Death, and Twilight Giant make up the Eternal Darkness group; all
// three neighbor one another within it.
export const DARKNESS_PATHWAY: Pathway = {
  id: 5,
  name: "Darkness",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [4, 11],
  sequences: darknessSequences,
};

// Visionary, Sun, Tyrant, White Tower, and Hanged Man make up the God Almighty
// group; each neighbors the others within it.
export const TYRANT_PATHWAY: Pathway = {
  id: 6,
  name: "Tyrant",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 3, 9, 10],
  sequences: tyrantSequences,
};

// Fool, Error, and Door make up the Lord of the Mysteries (Sefirah Castle)
// group — each neighbors the other two.
export const DOOR_PATHWAY: Pathway = {
  id: 7,
  name: "Door",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [1, 8],
  sequences: doorSequences,
};

export const ERROR_PATHWAY: Pathway = {
  id: 8,
  name: "Error",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [1, 7],
  sequences: errorSequences,
};

export const HANGED_MAN_PATHWAY: Pathway = {
  id: 9,
  name: "Hanged Man",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 3, 6, 10],
  sequences: hangedManSequences,
};

export const WHITE_TOWER_PATHWAY: Pathway = {
  id: 10,
  name: "White Tower",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 3, 6, 9],
  sequences: whiteTowerSequences,
};

export const TWILIGHT_GIANT_PATHWAY: Pathway = {
  id: 11,
  name: "Twilight Giant",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [4, 5],
  sequences: twilightGiantSequences,
};

export const JUSTICIAR_PATHWAY: Pathway = {
  id: 12,
  name: "Justiciar",
  group: "order",
  sefirah: "Hammer of the Hidden Sage",
  neighboringPathways: [13],
  sequences: justiciarSequences,
};

export const BLACK_EMPEROR_PATHWAY: Pathway = {
  id: 13,
  name: "Black Emperor",
  group: "order",
  sefirah: "Hammer of the Hidden Sage",
  neighboringPathways: [12],
  sequences: blackEmperorSequences,
};

export const RED_PRIEST_PATHWAY: Pathway = {
  id: 14,
  name: "Red Priest",
  group: "combat",
  sefirah: "Sefirah of the God of Combat",
  neighboringPathways: [15],
  sequences: redPriestSequences,
};

export const DEMONESS_PATHWAY: Pathway = {
  id: 15,
  name: "Demoness",
  group: "combat",
  sefirah: "Sefirah of the God of Combat",
  neighboringPathways: [14],
  sequences: demonessSequences,
};

export const MOTHER_PATHWAY: Pathway = {
  id: 16,
  name: "Mother",
  group: "life",
  sefirah: "Tree of Life",
  neighboringPathways: [17],
  sequences: motherSequences,
};

export const MOON_PATHWAY: Pathway = {
  id: 17,
  name: "Moon",
  group: "life",
  sefirah: "Tree of Life",
  neighboringPathways: [16],
  sequences: moonSequences,
};

export const HERMIT_PATHWAY: Pathway = {
  id: 18,
  name: "Hermit",
  group: "knowledge",
  sefirah: "Sefirah of the Hidden Sage",
  neighboringPathways: [19],
  sequences: hermitSequences,
};

export const PARAGON_PATHWAY: Pathway = {
  id: 19,
  name: "Paragon",
  group: "knowledge",
  sefirah: "Sefirah of the Hidden Sage",
  neighboringPathways: [18],
  sequences: paragonSequences,
};

export const WHEEL_OF_FORTUNE_PATHWAY: Pathway = {
  id: 20,
  name: "Wheel of Fortune",
  group: "wheel-of-fortune",
  sefirah: "Sefirah of Fate",
  neighboringPathways: [],
  sequences: wheelOfFortuneSequences,
};

export const ABYSS_PATHWAY: Pathway = {
  id: 21,
  name: "Abyss",
  group: "abyss",
  sefirah: "Tomb of the Father of Devils",
  neighboringPathways: [22],
  sequences: abyssSequences,
};

export const CHAINED_PATHWAY: Pathway = {
  id: 22,
  name: "Chained",
  group: "abyss",
  sefirah: "Tomb of the Father of Devils",
  neighboringPathways: [21],
  sequences: chainedSequences,
};

const RAW_PATHWAYS: Pathway[] = [
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
  DARKNESS_PATHWAY,
  TYRANT_PATHWAY,
  DOOR_PATHWAY,
  ERROR_PATHWAY,
  HANGED_MAN_PATHWAY,
  WHITE_TOWER_PATHWAY,
  TWILIGHT_GIANT_PATHWAY,
  JUSTICIAR_PATHWAY,
  BLACK_EMPEROR_PATHWAY,
  RED_PRIEST_PATHWAY,
  DEMONESS_PATHWAY,
  MOTHER_PATHWAY,
  MOON_PATHWAY,
  HERMIT_PATHWAY,
  PARAGON_PATHWAY,
  WHEEL_OF_FORTUNE_PATHWAY,
  ABYSS_PATHWAY,
  CHAINED_PATHWAY,
];

/**
 * Overlay the canon Advancement Rituals (extracted from the novel+wiki corpus,
 * `advancement-canon.ts`) onto the hand-authored sequence data. Canon: an
 * Advancement Ritual is mandatory only from Sequence 5 onward, so higher rungs
 * (Seq 9-6) carry NO ritual, while Seq 5-1 take the corpus ritual when one was
 * extracted and otherwise keep the existing hand-authored placeholder. This is
 * the single point where the engine's per-sequence advancement requirements are
 * reconciled with the source material.
 */
function applyCanonAdvancement(pathway: Pathway): Pathway {
  const canon = ADVANCEMENT_RITUALS[pathway.id] ?? {};
  return {
    ...pathway,
    sequences: pathway.sequences.map((seq) => {
      if (seq.level > RITUAL_FROM_SEQUENCE || seq.level < 1) {
        return { ...seq, advancementRitual: undefined };
      }
      return { ...seq, advancementRitual: canon[seq.level] ?? seq.advancementRitual };
    }),
  };
}

// Overlay the canon Advancement Rituals (Seq 5–1), then the corpus-derived
// demigod abilities (Seq 4–1 of pathways 10–22, issue #120) — both replace
// hand-authored placeholders with corpus-sourced data at module load.
export const ALL_PATHWAYS: Pathway[] = applyCanonDemigodAbilities(
  RAW_PATHWAYS.map(applyCanonAdvancement),
);

// Indexed by id at module load — getPathway/getSequence are called several
// times per render and per turn, so resolve in O(1) rather than scanning the
// 22-entry array each time.
const PATHWAY_BY_ID = new Map<number, Pathway>(ALL_PATHWAYS.map((p) => [p.id, p]));

export function getPathway(id: number): Pathway | undefined {
  return PATHWAY_BY_ID.get(id);
}

export function getSequence(pathwayId: number, level: number): Sequence | undefined {
  return getPathway(pathwayId)?.sequences.find((s) => s.level === level);
}

/** An ability, tagged with the rung it was first gained at. */
export interface CumulativeAbility extends Ability {
  /** The sequence level at which this ability was first gained. */
  sourceLevel: number;
  /**
   * True when the ability was first gained at an earlier, weaker rung (a
   * higher-numbered Sequence) and has since been enhanced by advancement.
   */
  enhanced: boolean;
}

/** A reached rung and the abilities it contributed, for grouped display. */
export interface SequenceAbilityGroup {
  level: number;
  name: string;
  /** True for an earlier rung whose powers are now enhanced by advancement. */
  enhanced: boolean;
  abilities: Ability[];
}

/**
 * The rungs a Beyonder at `level` has climbed, ordered from the current
 * Sequence first to the earliest (Sequence 9) last. Sequences are numbered
 * downward as power rises, so every rung with `level >= current` has been
 * reached.
 */
function reachedSequences(pathwayId: number, level: number): Sequence[] {
  const pathway = getPathway(pathwayId);
  if (!pathway) return [];
  return pathway.sequences
    .filter((s) => s.level >= level)
    .sort((a, b) => a.level - b.level);
}

/**
 * Abilities are cumulative: a Beyonder retains every ability from the rungs
 * they have climbed (the current Sequence up through Sequence 9), and powers
 * gained at earlier, weaker rungs are enhanced as they advance. Returns the
 * full set ordered from the current Sequence first to the earliest, tagging
 * each with where it was first gained and whether advancement has since
 * enhanced it. Abilities sharing a name across rungs collapse to the
 * current-rung definition so the list never duplicates.
 */
export function getCumulativeAbilities(
  pathwayId: number,
  level: number,
): CumulativeAbility[] {
  const seen = new Set<string>();
  const result: CumulativeAbility[] = [];
  for (const seq of reachedSequences(pathwayId, level)) {
    for (const ability of seq.abilities) {
      if (seen.has(ability.name)) continue;
      seen.add(ability.name);
      result.push({ ...ability, sourceLevel: seq.level, enhanced: seq.level > level });
    }
  }
  return result;
}

/**
 * The same cumulative abilities, grouped by the rung that introduced them —
 * the current Sequence first, then each earlier rung (flagged `enhanced`).
 * Rungs that introduced no abilities are omitted.
 */
export function getCumulativeAbilityGroups(
  pathwayId: number,
  level: number,
): SequenceAbilityGroup[] {
  return reachedSequences(pathwayId, level)
    .filter((seq) => seq.abilities.length > 0)
    .map((seq) => ({
      level: seq.level,
      name: seq.name,
      enhanced: seq.level > level,
      abilities: seq.abilities,
    }));
}

export function areNeighboringPathways(a: number, b: number): boolean {
  const pathway = getPathway(a);
  if (!pathway) return false;
  return pathway.neighboringPathways.includes(b);
}
