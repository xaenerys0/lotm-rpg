import type { Ability } from "@/lib/types/rules";

// ─────────────────────────────────────────────────────────────────────────────
// Corpus-derived demigod-rung abilities for pathways 10–22 (issue #120, Tier 2).
//
// The Seq 9–5 abilities of every pathway are already authored in `pathways.ts`.
// For the thirteen later pathways the demigod rungs (Seq 4–1) previously carried
// "themed but invented" placeholder abilities, because the team building the
// engine sourced names from `Module:Sequence/standard` (a name/link index only)
// and concluded the corpus gave no ability text for those rungs.
//
// It does: each pathway's `<Pathway>/Abilities` wiki page documents per-sequence
// "New Abilities" all the way to Seq 1. This map is condensed, corpus-faithful
// data extracted from those pages (one tight clause per ability), overlaid onto
// `ALL_PATHWAYS` at module load by `applyCanonDemigodAbilities` — exactly the way
// `applyCanonAdvancement` overlays the canon Advancement Rituals. The single rung
// the wiki leaves blank (Mother Seq 1 "Naturewalker") is a corpus-consistent
// extrapolation from the pathway's Seq-2 scaling and its True-God apex, flagged
// inline (`// derived`).
//
// Keyed `DEMIGOD_ABILITIES[pathwayId][level]`, levels 4→1 only. Pathways 1–9 are
// untouched (their demigod rungs were authored from the novel directly).
// ─────────────────────────────────────────────────────────────────────────────

type LevelAbilities = Readonly<Record<number, readonly Ability[]>>;

const a = (name: string, description: string, type: Ability["type"]): Ability => ({
  name,
  description,
  type,
});

export const DEMIGOD_ABILITIES: Readonly<Record<number, LevelAbilities>> = {
  // 10 White Tower
  10: {
    4: [
      a(
        "Prophecy",
        "Master high occult knowledge of the Fate domain to prophesy coming events.",
        "active",
      ),
      a(
        "Enhanced Analysis & Imitation",
        "Rapidly Analyze a restraint or power and improvise a mystical technique to counter it.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "A Sequence 4 Demigod's partial Godhood; an incomplete form of illusory bookshelves.",
        "passive",
      ),
    ],
    3: [
      a(
        "Cognize",
        "Gain insight into the world's rules and laws, laying bare a target's secrets, strengths, and weaknesses.",
        "active",
      ),
      a(
        "Fulcrum",
        "Find the fulcrum on which to place that knowledge and move the world or a target.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Wisdom",
        "Always make the wisest choice, accurately foreseeing how a situation will shift.",
        "passive",
      ),
      a(
        "Mythical Creature Form",
        "The complete form: countless illusory bookshelves holding pools of black shadow-liquid.",
        "passive",
      ),
    ],
    1: [
      a(
        "Omniscience",
        "See any target's past, present, and future and instantly perceive its state and exploitable weaknesses, though heavy Concealment yields only vague revelation.",
        "active",
      ),
    ],
  },
  // 11 Twilight Giant
  11: {
    4: [
      a(
        "Eye of Demon Hunting",
        "Dark-green eye-symbols read a target's traits, weaknesses, and status and sense Evil, Degeneration, and Corruption.",
        "active",
      ),
      a(
        "Alchemy",
        "Expertly brew supernatural medicines, ointments, and coatings tailored to an enemy's weakness.",
        "active",
      ),
      a(
        "Mind Concealment",
        "Conceal your desires and intentions, becoming the nemesis of devils and confounding divination.",
        "passive",
      ),
      a(
        "Mythical Creature Form",
        "Partial Godhood; an incomplete roughly four-metre one-eyed Giant.",
        "passive",
      ),
    ],
    3: [
      a(
        "Mercury Liquefaction",
        "Melt into malleable silver liquid to bind enemies, dodge fatal blows, or armour an ally.",
        "active",
      ),
      a(
        "Silver Rapier",
        "Condense hard-to-detect light blades that teleport, bypass barriers, and erupt from within a target.",
        "active",
      ),
      a(
        "Light Concealment",
        "Ride any light source to move, evade, and — with Mind Concealment — fully conceal yourself and others.",
        "active",
      ),
    ],
    2: [
      a(
        "Passage of Time",
        "Wield authority over time, rapidly ageing yourself to rotten liquid to escape into the Spirit World.",
        "active",
      ),
      a(
        "Twilight Sword",
        "Instantly condense an orange-red Twilight broadsword that tears the void and devastates the region.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "The complete form: a Giant dozens of metres tall with a single vertical forehead eye.",
        "passive",
      ),
    ],
    1: [
      a(
        "Divine Right Hand",
        "The right hand takes on the properties of Twilight, glowing as orange dusk-light.",
        "passive",
      ),
      a(
        "Protection",
        "Summon dense orange radiance even an Observer or Dimensional Shadow cannot cross.",
        "active",
      ),
    ],
  },
  // 12 Justiciar
  12: {
    4: [
      a(
        "Deprivation",
        "Strip certain Beyonder powers from a target, rendering them unusable for a time.",
        "active",
      ),
      a(
        "Power of Laws",
        "Erase distance to teleport, slow projectiles, and bind targets with Law-fused contracts.",
        "active",
      ),
      a(
        "Strengthened Verdict",
        "Any sentence in mystical language becomes a Rule — Execution, void Exile, Restriction.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "Partial Godhood; an incomplete giant Brass Pillar.",
        "passive",
      ),
    ],
    3: [
      a(
        "Strengthened Deprivation",
        "Greatly increase the number of Beyonder powers you can Deprive at once.",
        "active",
      ),
      a(
        "Coalesced Verdict",
        "Weaken Truth and strengthen Illusion, or coalesce Exile into a materialising hurricane at the target.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Balance",
        "Instantly end Chaos and restore Order, partition a battlefield into perfectly balanced zones, and find foes through the disorder they cause.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "The complete form: a giant Brass Pillar bearing further features.",
        "passive",
      ),
    ],
    1: [
      a(
        "Order",
        "Observe the tug-of-war of Disorder and Balance on a battlefield and calculate the Order that should be established.",
        "active",
      ),
    ],
  },
  // 13 Black Emperor
  13: {
    4: [
      a(
        "Exploit",
        "Directly exploit the effects of Laws — prolonging or ending a state, such as floating on the airborne state after a jump.",
        "active",
      ),
      a(
        "Bestowment",
        "Bestow negative traits — greed, rashness, sluggishness, lost will to fight — on those in range.",
        "active",
      ),
      a(
        "Magnify",
        "Amplify the interactions of surrounding Order to disaster: weather, Sealed Artifacts, an injury into an execution.",
        "active",
      ),
      a(
        "Strengthened Distortion",
        "Distort the rules of Beyonder powers themselves and forge invisible Seals from a closing door.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Gigantification",
        "Gigantize the body, greatly increasing height and strength.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Angelic Distortion",
        "Distort even the rules created by authorities, twisting them to your will.",
        "active",
      ),
      a(
        "Strengthened Exploit",
        "Exploit the airborne state enough to travel from the earth to the moon in a single jump.",
        "active",
      ),
    ],
    1: [
      a(
        "Reality Isolation",
        "Using only part of your strength, distort and isolate a mausoleum-sized area from the real world.",
        "active",
      ),
    ],
  },
  // 14 Red Priest
  14: {
    4: [
      a(
        "Courage",
        "Steel-like courage grants high resistance to fear and mental attack without tipping into recklessness.",
        "passive",
      ),
      a(
        "Weapon Augmentation",
        "Turn any ordinary object into a durable deadly weapon and a carrier for self-accelerating Fireballs.",
        "active",
      ),
      a(
        "Chain of Command",
        "Bind subordinates for shared senses, concentrated strength, and spread damage.",
        "active",
      ),
      a(
        "Galvanization",
        "Transform body and flame into steel for far greater defence.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "War Song & War Cry",
        "Sing or shout to lift allies' morale and strength while suppressing nearby enemies.",
        "active",
      ),
      a(
        "Fog of War",
        "Raise a fog that disrupts senses, severs connections, and blocks escape and divination.",
        "active",
      ),
      a(
        "Sacrifice",
        "After enough offerings, petition the essence of war once per battle for aid.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers, stronger the more anchors (even your soldiers) are present.",
        "passive",
      ),
    ],
    2: [
      a(
        "Weather Manipulation",
        "Partial authority over Weather — thunderstorms, hurricanes, blizzards, lightning across tens of kilometres.",
        "active",
      ),
      a(
        "Charm",
        "A passive charm that makes people want to follow and stay loyal to you.",
        "passive",
      ),
      a(
        "Strengthened Cull",
        "Harvest life so potently that even a Demoness-Pathway Beyonder cannot take many such blows.",
        "active",
      ),
    ],
    1: [
      a(
        "Conquest",
        "Make a target's body, mind, and spirit submit and turn eternally loyal, with no limit on number.",
        "active",
      ),
      a(
        "Puppets into Soldiers",
        "Conquer inanimate objects into soldiers that wield your own powers.",
        "active",
      ),
      a(
        "Spear of Destruction",
        "An ascended Cull that annihilates an area or transmits destruction through clones and substitutes to the true body.",
        "active",
      ),
    ],
  },
  // 15 Demoness
  15: {
    4: [
      a(
        "Plague",
        "Spread custom pathogens up to three kilometres that afflict only beings with Spirituality.",
        "active",
      ),
      a(
        "Petrifying Threads",
        "Hair-threads that bind, transmit Black Flame and curses, and petrify what they touch.",
        "active",
      ),
      a(
        "Strengthened Charm",
        "Beauty that makes Mid-Sequence Beyonders fall in love at a glance, with opioid-like addiction.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "Partial Godhood; an incomplete Gorgon, a snake-haired woman whose sight gives pleasure and pain.",
        "passive",
      ),
    ],
    3: [
      a(
        "Mirror Self",
        "Fuse with your Mirror Person to live inside and outside mirrors, fix your age, and revive through hidden mirrors.",
        "active",
      ),
      a(
        "Petrification",
        "Slowly petrify the surroundings into a plague-like zone, using spider-silk as a medium.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "A more complete Gorgon with serpent hair whose gaze instantly petrifies; answers prayers.",
        "passive",
      ),
    ],
    2: [
      a(
        "Catastrophe",
        "Treat a being or place as a system and detonate its hidden flaws — disasters, temperature shifts, Curses of Destiny.",
        "active",
      ),
      a(
        "Multiplied Mirror Self",
        "Initially separate up to five Mirror Persons.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "A complete Gorgon that summons a sky-darkening forest of poison black snakes.",
        "passive",
      ),
    ],
    1: [
      a(
        "Apocalypse",
        "A lesser manifestation of Chaos that brings a complete end within an area, concluding all things — even Fate.",
        "active",
      ),
      a(
        "Pleasure",
        "The ultimate irresistible pleasure that drives indulgence, then empties into pain.",
        "active",
      ),
      a(
        "Disease",
        "Control all causes of Disease, no longer only mystical pathogens.",
        "active",
      ),
    ],
  },
  // 16 Mother
  16: {
    4: [
      a(
        "Mutation",
        "Each attack risks inducing madness and bodily mutation — extra organs, limbs replaced with plants.",
        "active",
      ),
      a(
        "Artificial Life Creation",
        "Use broken souls and materials to craft constructs, golems, and long-lived artificial humans.",
        "active",
      ),
      a(
        "Life Aura",
        "Flood the surroundings with life force so plants, animals, even people grow and breed rapidly.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Life Draining",
        "Drain the life force of surrounding living things and return it to the Earth.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Desolation",
        "Render land desolate so crops fail and plants wither, and turn the recent dead within range into Evil Spirits.",
        "active",
      ),
      a(
        "Vast Life Aura",
        "Make soil fertile and water abundant, boosting life's reproduction across hundreds of kilometres.",
        "active",
      ),
      a(
        "Gender Transition",
        "A male who drinks the potion has their gender changed to female.",
        "passive",
      ),
      a("Mythical Creature Form", "She has become a full Mythical Creature.", "passive"),
    ],
    1: [
      // derived: the wiki leaves Mother Seq 1 ("Naturewalker") blank; this is a
      // corpus-consistent extrapolation from the Seq-2 Desolate Matriarch's
      // continental life/death authority and the True-God "Mother" apex above it.
      a(
        "Dominion of Life",
        "Near-total authority over life, growth, and decay across the land — the threshold of the Mother's godhood.",
        "active",
      ),
      a(
        "One with Nature",
        "Become one with soil, forest, water, and mountain, sustaining or withering whole regions at will.",
        "active",
      ),
    ],
  },
  // 17 Moon
  17: {
    4: [
      a(
        "Spirituality Manipulation",
        "Perform ritual magic instantly, without preparation or materials, by interacting with nature.",
        "active",
      ),
      a(
        "Substitution Spells",
        "Master Substitution — Moon paper-figurines for yourself and a Gaze of Darkness that links a target's eye to yours.",
        "active",
      ),
      a(
        "Bat Swarm Transformation",
        "Split into a swarm of half-real vampire bats and reform unless every bat is slain.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Door of Summoning",
        "Open an illusory Door to summon strong Spirit-World creatures, up to those you hold contracts with.",
        "active",
      ),
      a(
        "Bat Wing Isolation",
        "Enclose an area in Darkness with giant bat wings, seeming to cut it from the real world.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Creation",
        "Hold authority over Creation, making living creatures that defy the normal.",
        "active",
      ),
      a(
        "Near-Instant Regeneration",
        "Regrow the entire body from a single drop of blood, with a lifespan of thousands of years.",
        "passive",
      ),
      a(
        "Mythical Creature Form",
        "A full Mythical Creature: a humanoid with a phantom Moon, red eyes, and bat wings, embodying Beauty.",
        "passive",
      ),
    ],
    1: [
      a(
        "Beauty",
        "Divine Beauty (the Spirituality of gravitation) compels admiration and protection while forbidding approach or desecration.",
        "active",
      ),
      a("Moon", "Change the colour of the Moon.", "active"),
      a(
        "Gender Transition",
        "A male who drinks the potion has their gender changed to female.",
        "passive",
      ),
    ],
  },
  // 18 Hermit
  18: {
    4: [
      a(
        "Mystical Re-enactment",
        "Draw on grasped occult knowledge to enact magic and witchcraft, stronger the less widely that knowledge is known.",
        "active",
      ),
      a(
        "Piercing Eyes of Mystery Prying",
        "Eyes that gain on/off control and pierce into the Cosmos and the world barrier, and can be planted on others to spy.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "Partial Godhood; an incomplete eye-covered black blob that storms a target's mind with knowledge.",
        "passive",
      ),
    ],
    3: [
      a(
        "Clairvoyance",
        "Pry the River of Fate for past, present, and future scenes and the best choice — at risk of backlash.",
        "active",
      ),
      a(
        "Strengthened Re-enactment",
        "More uses, accuracy, and power for the spells drawn from mystical knowledge.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Information",
        "Become a hard-to-kill torrent of Information — see through illusions and seals, forge false information, stun with useless knowledge.",
        "active",
      ),
      a("Engraving", "Engrave certain things permanently into a region.", "active"),
      a(
        "Mythical Creature Form",
        "A full Mythical Creature: an abstract black blob covered in countless cold, lashless eyes.",
        "passive",
      ),
    ],
    1: [
      a(
        "Knowledge",
        "Bestow real power onto abstract Knowledge through a medium — turning a written formula into a Card of Blasphemy — and fold understood powers into your Information.",
        "active",
      ),
    ],
  },
  // 19 Paragon
  19: {
    4: [
      a(
        "Artificial Life Creation",
        "Inject souls and life into crafted items, drawing life force from the living and soul fragments from the Spirit World.",
        "active",
      ),
      a(
        "Beam of Disintegration",
        "Emit a beam that destroys an object's structure, thoroughly disintegrating it.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Backwards Recall",
        "Recall enhanced to extract environmental information and deduce what has happened.",
        "active",
      ),
      a(
        "Master Craftsmanship",
        "Create mystical items, complex machines, or fusions of the two.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Physics",
        "As an Angel of the Paragon Pathway, see the essence of things and alter the laws of physics within an area.",
        "active",
      ),
      a("Fog Transformation", "Take the form of a pale white fog.", "active"),
      a("Mythical Creature Form", "A full Mythical Creature.", "passive"),
    ],
    1: [
      a(
        "Technology",
        "Lead the development of civilization through mastery of the Technology authority.",
        "active",
      ),
      a(
        "Revolutionary Innovation",
        "With a gesture, create wonders beyond the era — fusion power, giant mechanical robots.",
        "active",
      ),
      a(
        "Fragment of Civilization",
        "Project humanity's recorded history as a shield, especially against Knowledge Injection.",
        "active",
      ),
    ],
  },
  // 20 Wheel of Fortune
  20: {
    4: [
      a(
        "Misfortune Field",
        "Curse all who enter a 100–300 metre range with bad luck.",
        "active",
      ),
      a(
        "Blessing",
        "Spend your own luck, or pull a target's future luck into the present, to bless and lift misfortune.",
        "active",
      ),
      a(
        "Absolute Foresight",
        "Absolute foresight over shifts in destiny, the presence of Fate Anchors, and higher mystical beings.",
        "passive",
      ),
      a(
        "Mercury Body",
        "A body with passive Anti-Divination and Anti-Prophecy and greatly improved physique.",
        "passive",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Chaos",
        "Partial authority over Chaos — make predestined fate chaotic and push a target's spirit toward madness.",
        "active",
      ),
      a(
        "Spiritual Baptism",
        "Wash a target's spirit clean, stable, and no longer chaotic.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Fate",
        "Partial control of the Fate authority, encompassing Good Luck, Bad Luck, and Foresight.",
        "active",
      ),
      a(
        "Words of Fortune & Misfortune",
        "Bring good or bad luck on any living being within thirty kilometres — misfortune able to kill a sub-Demigod.",
        "active",
      ),
      a(
        "Revelation of Fate",
        "Gaze upon the River of Fate for revelations that, read rightly, guide to the best outcome.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "A Snake of Mercury covered in wheel-symbols of possible futures, briefly invulnerable after a hit.",
        "passive",
      ),
    ],
    1: [
      a(
        "Cycle",
        "Partial authority over Cycle (Save and Select) — trap a target in a looping span of time unnoticed by those within.",
        "active",
      ),
      a(
        "Reboot of Destiny",
        "Reset the state of an area by overwriting it with an older saved state, invalidating all prior events.",
        "active",
      ),
      a(
        "Self Restart",
        "Facing inescapable death, restart your own cycle to an embryo, keeping your accumulated luck.",
        "active",
      ),
    ],
  },
  // 21 Abyss
  21: {
    4: [
      a(
        "Mind Fog",
        "Quietly dull the clear thinking of all in a radius, making them careless and fallible without their knowing.",
        "active",
      ),
      a(
        "Desire Mastery",
        "Trap a target in unavoidable illusions whose swelling desires shatter cognition or cause loss of control.",
        "active",
      ),
      a(
        "Partial Demonization",
        "Demonize a body part for unique effects while avoiding loss of control.",
        "active",
      ),
      a("Mythical Creature Form", "A Sequence 4 Demigod's partial Godhood.", "passive"),
    ],
    3: [
      a(
        "Blathering",
        "Every word influences nearby minds to lose control, suffer injury, fall into confusion, or be hexed — even through a distant connection.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Blood & Body Fluids",
        "Authority over blood and bodily fluids — become a charging Blood form that corrodes a foe until they bleed out.",
        "active",
      ),
      a("Fear", "Hold authority over the domain of Fear.", "active"),
      a(
        "Seed of Malice",
        "Plant an evolved seed in a target that erodes the psyche and can revive you to kill them.",
        "active",
      ),
    ],
    1: [a("Filth", "Hold authority over Filth, Corrosion, and Pollution.", "active")],
  },
  // 22 Chained
  22: {
    4: [
      a(
        "Source of Curses",
        "Become a mystical puppet or paper figurine of a target through a connection and curse it.",
        "active",
      ),
      a(
        "Poltergeist",
        "Awaken and control every lifeless object in range — turning the surroundings, even ownerless artifacts, into weapons.",
        "active",
      ),
      a(
        "Evil Spirit Transformation",
        "Your Wraith form becomes an Evil Spirit able to possess objects and survive briefly in the Underworld.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "Partial Godhood; an intangible collection of curses shaped by your self-awareness.",
        "passive",
      ),
    ],
    3: [
      a(
        "Transfiguration Curse",
        "A silent scream that transforms a target into a harmless creature, stripping its traits and powers for a time.",
        "active",
      ),
      a(
        "Effortless Curses",
        "No longer need to harm yourself to lay a curse, though self-harm can still strengthen it.",
        "active",
      ),
      a(
        "Prayer Response",
        "As a Sequence 3 Beyonder, answer prayers within a certain range.",
        "passive",
      ),
    ],
    2: [
      a(
        "Spirit Inhaling",
        "Inhale a cold breeze that drags out an enemy's spirit so they cannot stay hidden.",
        "active",
      ),
      a(
        "Resurrection",
        "With prior preparation, resurrect in the Spirit World in an incomplete body.",
        "active",
      ),
      a(
        "Gaze Transfiguration",
        "Curse and transform any target reflected in your eyes, many at once, for near-unlimited duration.",
        "active",
      ),
      a(
        "Mythical Creature Form",
        "A complete Mythical Creature: an intangible collection of curses borne by an ancient evil core.",
        "passive",
      ),
    ],
    1: [
      a(
        "Binding",
        "Reduce enemies' body–soul compatibility so the body cages the soul and the world cages the body, eroding even bystanders.",
        "active",
      ),
      a(
        "Abomination Transformation",
        "Become an Abomination radiating Madness, Evil, Distortion, Chaos, Hatred, and Curse, sealing the surroundings.",
        "active",
      ),
      a(
        "Undetectable Curses",
        "Lay curses unseen even by Saints that strike the true body through any connection, causing sudden death.",
        "active",
      ),
    ],
  },
};

/**
 * Overlay the corpus-derived demigod abilities onto a pathway list IN PLACE,
 * replacing the placeholder Seq 4–1 `abilities` of pathways 10–22. Mirrors
 * `applyCanonAdvancement`: called once at module load in `pathways.ts` after the
 * ritual overlay. Pathways/levels absent from {@link DEMIGOD_ABILITIES} are left
 * untouched (the original nine, and all rungs Seq 9–5). Returns the same array.
 */
export function applyCanonDemigodAbilities<
  T extends { id: number; sequences: { level: number; abilities: Ability[] }[] },
>(pathways: T[]): T[] {
  for (const pathway of pathways) {
    const byLevel = DEMIGOD_ABILITIES[pathway.id];
    if (!byLevel) continue;
    for (const sequence of pathway.sequences) {
      const overlay = byLevel[sequence.level];
      if (overlay) sequence.abilities = [...overlay];
    }
  }
  return pathways;
}
