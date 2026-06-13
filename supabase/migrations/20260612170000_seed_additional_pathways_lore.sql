-- Seed lore entries for the five additional pathways (issue #21)
-- Darkness, Tyrant, Door, Error, Hanged Man (Seq 9-5)
-- Generated from src/lib/lore/pathway-{darkness,tyrant,door,error,hanged-man}.ts

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-pathway-overview',
  'Darkness Pathway — Overview',
  'pathway',
  'The Darkness pathway belongs to the Eternal Darkness group, anchored to the River of Eternal Darkness, the same Above-the-Sequence group as the Death pathway. Its powers turn on night, sleep, and concealment: Beyonders grow stronger as the night deepens, can pacify and host souls, walk into the dreams of others, blanket areas in sleep, see in the dark, and suppress the moods and desires of their enemies. Its authority embodies Silence and Darkness. At high sequences a Darkness Beyonder can raise domains of darkness, weave realistic dreams, shroud regions in secrecy, erase or hide things, bestow misfortune, and become an immortal within the dark. The mythical-creature form of the pathway is a demonic wolf, its limbs covered in short black fur. Its corresponding tarot card is The Star, and its symbolic colour is purpureus. Night vanilla, moon flowers, and slumber flowers are ingredients of the Darkness domain, while white chestnut flowers and wild rose stand for Concealment. The Church of the Evernight Goddess holds and protects much of the Darkness pathway''s knowledge, which is why it neighbours the Fool pathway''s resources only at a remove.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['darkness-pathway', 'eternal-darkness-group', 'river-of-eternal-darkness', 'overview'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-seq9-sleepless',
  'Darkness Pathway — Sequence 9: Sleepless',
  'pathway',
  'The Sleepless is the entry point of the Darkness pathway. Its defining trait is Nocturnality: the deeper into the night, the stronger a Sleepless becomes — physical strength, intuition, and mental clarity all sharpen after dark, and they need only three or four hours of sleep. They possess Night Vision, seeing clearly through total darkness and sensing dangers hidden within it, and carry the High Spirituality common to the pathway, granting a serviceable Spirit Vision for perceiving spiritual things. The potion''s main ingredients are a Midnight Beauty Flower (which opens only in the dead of night) and a pair of Six-Footed Owl eyes, supplemented by strong liquor, Night Vanilla essential oil, Midnight Beauty leaves, and a symbolic measure of coffee beans or tea leaves. The acting method demands keeping to the night — working, watching, and acting under cover of darkness, cultivating stillness and concealment, and standing vigil while others rest. As a Sequence 9 sequence it has no advancement ritual; digesting the potion through acting is enough to progress to Midnight Poet.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['darkness-pathway', 'sleepless', 'night', 'concealment', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-seq8-midnight-poet',
  'Darkness Pathway — Sequence 8: Midnight Poet',
  'pathway',
  'The Midnight Poet wields verse as a vehicle for supernatural power. A Midnight Poem can be recited to produce a range of distinct effects in the dark; among them are the Lullaby, which sings listeners into drowsiness and unnatural sleep, and Pacify, which quiets emotions and suppresses the desires and moods of those nearby. The potion''s main ingredients are the vocal cords of a Red-Moon Roarer and a Soul-Snatching Wind Chime Flower, with red wine, Red-Moon Roarer hair, deep crimson sandalwood, and the soil the chime-flower grew in as supplementaries. The advancement ritual calls for composing and performing a Midnight Poem at the dead of night that bends a gathered audience to sleep, holding the working until every listener has succumbed. The acting method asks the Midnight Poet to compose and recite by night, to soothe and lull rather than confront, and to keep their true intent veiled behind verse and quiet — the pathway''s themes of darkness, sleep, and concealment beginning to deepen.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['darkness-pathway', 'midnight-poet', 'sleep', 'poetry', 'acting-method'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-seq7-nightmare',
  'Darkness Pathway — Sequence 7: Nightmare',
  'pathway',
  'The Nightmare carries the Darkness pathway into the mid sequences and into the dream world itself. A Nightmare can perform Dream Invasion — entering a sleeping target''s dream and moving through its landscape — and Dream Shaping, reshaping the dream''s contents into a nightmare of their own design. They can manifest Nightmare Limbs of shadowy dream-stuff to seize and strike, and project a Nightmare State, a dreadful, oppressive aura that erodes the resolve of those around them. The potion''s main ingredients are the heart of a Dream-Eating Black Crow and a captured Shadow of Nightmares, supplemented by spirit-world moon water drawn from the crimson moon, a Dream-Eating Crow phantom feather, and pages recording one of the Beyonder''s own recent nightmares. The advancement ritual requires invading and mastering the nightmare of a sleeping Beyonder, twisting it to one''s own shaping and withdrawing before the dreamer wakes. The acting method has the Nightmare walk the dreams of others, conceal every trace of their passage, and master their own nightmares before wielding those of others.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['darkness-pathway', 'nightmare', 'dreams', 'mid-sequence', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-seq6-soul-assurer',
  'Darkness Pathway — Sequence 6: Soul Assurer',
  'pathway',
  'The Soul Assurer turns the Darkness pathway toward the souls of the dead and the restless. Its signature is the Requiem, a song that soothes troubled spirits and lays them to rest; the Soul Assurer can pacify, calm, and provide refuge to wandering or agitated spirits, and inversely can perform Agitating, stirring a spirit into frenzy or torment when needed. Their spirituality is greatly heightened, sharpening their ritual sensitivity and perception. The potion''s main ingredients are the spirit-body crystal of a Rotting Shepherd and the skull of an Otherworldly Deep Sleeper, supplemented by blessed holy water, Rotting Shepherd pus, soil mingled with the Deep Sleeper''s shadow, and Deep Sleep Flower powder. The advancement ritual requires laying to rest a powerful, anguished spirit that resists all comfort, offering it refuge within the dark without being dragged into its anguish. The acting method asks the Soul Assurer to tend the dead and the dreaming, to work unseen in silence and concealment, and to hold to serenity so the torment of spirits never becomes their own.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['darkness-pathway', 'soul-assurer', 'spirits', 'requiem', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'darkness-seq5-spirit-warlock',
  'Darkness Pathway — Sequence 5: Spirit Warlock',
  'pathway',
  'The Spirit Warlock is the apex of mid-sequence power in the Darkness pathway, a commander of spirits and the night. Spirit Commanding lets them summon, bind, and command a host of spirits and spirit-world creatures to fight and serve; they wield Dream Invasion with far greater reach than a Nightmare, can project their own spirit body to act apart from their flesh, and command near-total dominion over darkness and the spirit world after nightfall. The potion''s main ingredients are a portion of the Source of Mad Dreams and a Spirit Nest, supplemented by Source-of-Mad-Dreams blood, gas vented from the Spirit Nest, a soul on the verge of dispersing, and a milk tooth that fell out under a full moon. The advancement ritual is among the strangest of the pathway: the Spirit Warlock must find a way to enter the spirit world in the flesh rather than as a spirit, locate and merge with their own key information mirrored there, and consume the potion at the moment of reunion. The acting method has them marshal and command spirits as a warlock of the dark, operate from concealment rather than acting openly, and guard their own soul against the spirits they bind.',
  'darkness',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['darkness-pathway', 'spirit-warlock', 'spirits', 'mid-sequence-apex', 'acting-method'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-pathway-overview',
  'Tyrant Pathway — Overview',
  'pathway',
  'The Tyrant pathway belongs to the God Almighty group, anchored to the Chaos Sea — the same Above-the-Sequence group as the Visionary, Sun, and Hanged Man pathways. It specialises in water and weather: a Tyrant Beyonder can cast powerful water, wind, and electricity spells, gains strength in water, can sing to disable opponents, glide on the air, act underwater for long periods, and grows enraged to amplify their power. They are famously bad-tempered and quick to bristle at high-handed authority. At high sequences they command sea creatures, walk the ocean freely, raise earthquakes, travel at tremendous speed, and produce electrical power to rival a star — the pathway is described as omnipotent across sea, land, and air. Its mythical-creature form is a gigantic octopus-like being wreathed in silver-white lightning, and its symbol is the Windstorm; the pathway''s colour is dark blue. Tyrant Beyonders often manifest blue hair, a trait that can pass to their descendants. In the orthodoxy of the Fifth Epoch the Church of the Lord of Storms — whose Mandated Punishers operate in Tingen City — holds and guards the Tyrant pathway.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['tyrant-pathway', 'god-almighty-group', 'chaos-sea', 'storm', 'overview'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-seq9-sailor',
  'Tyrant Pathway — Sequence 9: Sailor',
  'pathway',
  'The Sailor is the entry point of the Tyrant pathway, a creature of the water before it is a creature of the storm. A Sailor possesses Aquatic Affinity — submerging and moving underwater with the ease of a sea creature, holding their breath for many minutes and diving deep without equipment — and Phantom Scales, illusory scales hidden beneath the skin that make them slippery and hard to grasp. Their Balance is exceptional, keeping perfect footing on a deck in a rainstorm as though on solid ground, and their bodily strength is markedly enhanced. The potion''s main ingredients are the heart of a storm petrel and the blood of a Deep-Sea Lvoque Fish, supplemented by sea-salt crystals, brineweed extract, and strong liquor. The acting method asks the Sailor to live by sea and storm — to sail, swim, and brave rough water, to give vent to their temper rather than swallow their anger, and to test themselves against wind and wave at every chance. As a Sequence 9 sequence it has no advancement ritual; acting digests the potion before advancing to Folk of Rage.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['tyrant-pathway', 'sailor', 'sea', 'wrath', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-seq8-folk-of-rage',
  'Tyrant Pathway — Sequence 8: Folk of Rage',
  'pathway',
  'The Folk of Rage — also styled Guardian of the Storm — channels anger itself into power. Its defining ability is Wrath: the angrier a Folk of Rage grows, the stronger they become, and they can unleash a Raging Blow of overwhelming, wrath-fuelled force. Their toughness and endurance are greatly enhanced, especially amid wind and rain. The potion''s main ingredients are the blood of a Furious Sea-Ape and a fragment of thunder-charged coral, supplemented by foam skimmed from a storm tide, Sea-Ape hair, and strong liquor. The advancement ritual demands mastering one''s wrath in a true storm — standing alone against raging wind or sea, letting fury rise to its peak and channelling it into a single working without breaking or losing control. The acting method has the Folk of Rage let their anger run free, meet provocation with the storm''s fury, stand against the powerful and bow to no high-handed authority, and throw themselves into the heart of wind, rain, and rough sea. The Tyrant pathway''s bad temper is not merely flavour here — it is the engine of the sequence''s strength.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['tyrant-pathway', 'folk-of-rage', 'wrath', 'storm', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-seq7-seafarer',
  'Tyrant Pathway — Sequence 7: Seafarer',
  'pathway',
  'The Seafarer — also called the Storm Priest — carries the Tyrant pathway into the mid sequences with mastery of the open sea. A Seafarer can perform unerring Navigation, finding their bearings and reading wind, current, and weather, and possesses a Weather Sense that warns of oncoming storms and squalls before they arrive. Their memory and mental acuity are sharply heightened, and they draw strength and recovery from contact with the open sea. The potion''s main ingredients are the pituitary gland of a Storm-Whale and the spinal fluid of a Tempest Sea-Serpent, supplemented by Compass-Rose Coral powder, deep-sea pearl dust, and aged rum. The advancement ritual requires crossing a deadly stretch of storm-wracked sea — waters known to wreck ships, in the teeth of a storm — relying solely on one''s own senses and command of the sea. The acting method asks the Seafarer to sail the open sea and command the respect of those who travel it, to pit themselves against storm and tide as a master of the waters, and to carry the bearing of one born to wind and weather.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['tyrant-pathway', 'seafarer', 'sea', 'navigation', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-seq6-wind-blessed',
  'Tyrant Pathway — Sequence 6: Wind-blessed',
  'pathway',
  'The Wind-blessed takes the Tyrant pathway into the sky. A Wind-blessed can perform Wind Manipulation — summoning and commanding gusts, gales, and cutting wind-blades — and achieves Flight, riding the wind to glide and soar. Their Wind-blades loose compressed air sharp enough to cut through armour and stone, and they begin to exert real Water Control alongside their command of the wind. The potion''s main ingredients are the wing bone of a Gale-Roc and the crystallised heart of a living cyclone-spirit, supplemented by vapour drawn from a thunderhead, Gale-Roc feathers, and salt powder gathered from high mountain storms. The advancement ritual requires riding a great storm to its heart and bending its winds to one''s will, descending in command of the gale rather than scattered by it. The acting method has the Wind-blessed take to the skies and storm winds as their true element, wield wind and water with a free and untrammelled temper, and answer slights with the swift fury of a gale.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['tyrant-pathway', 'wind-blessed', 'wind', 'flight', 'acting-method'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tyrant-seq5-ocean-songster',
  'Tyrant Pathway — Sequence 5: Ocean Songster',
  'pathway',
  'The Ocean Songster is the apex of mid-sequence power in the Tyrant pathway, master of wind, water, and the storm''s lightning. The sequence''s signature is Lightning Manipulation — calling down and hurling bolts, lightning arrows, and shattering strikes — and the Lightning Strike, concentrating the storm''s charge into a single devastating discharge. They can sing songs of the sea that disable, command, or bewitch those who hear, and command wind, water, and lightning together as a near-absolute sovereign of weather. The potion''s main ingredients are the vocal cords of a Thunder-Leviathan and the storm-charged core of a slain Sea-Tyrant, supplemented by Thunder-Leviathan blood, fulgurite sand fused by a sea-storm''s lightning, and a siren-song pearl. The advancement ritual requires raising and commanding a storm at sea by song alone, binding its wind, wave, and lightning to one''s voice, then dispersing it at a word. The acting method has the Ocean Songster reign over sea, sky, and storm as their singer and sovereign, sing the songs of the deep, and brook no defiance — answering challenge with thunder.',
  'tyrant',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['tyrant-pathway', 'ocean-songster', 'lightning', 'mid-sequence-apex', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-pathway-overview',
  'Door Pathway — Overview',
  'pathway',
  'The Door pathway belongs to the Lord of the Mysteries group, anchored to the Sefirah Castle — the same Above-the-Sequence group as the Fool and Error pathways, and a neighbour of both. Its powers grant an unrestrained freedom of movement: a Door Beyonder can phase through objects, teleport, divine the future through astrology, and fight with tricky spells or the recorded powers of other Beyonders. At high sequences they gain deep mastery of space — teleportation no longer confined to the spirit world, the concealment of whole spaces to avoid Beyonder detection, the direct replication of others'' powers without first recording them, the sealing of things within space-time, the manipulation of gravity through the power of stars, and the creation of entire alternate spaces. Their authority represents the concept of Door, Alternate Worlds, and Space. The mythical-creature form is a huge humanoid figure built from layers of doors and balls of light formed by Worms of Stars. Its corresponding tarot card is The Magician, and its colour is turquoise. Like the Error pathway, Door Beyonders can safely switch pathways only from Sequence 3 upward.',
  'door',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['door-pathway', 'mysteries-group', 'sefirah-castle', 'space', 'overview'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-seq9-apprentice',
  'Door Pathway — Sequence 9: Apprentice',
  'pathway',
  'The Apprentice is the entry point of the Door pathway, and its abilities are, as the wiki puts it, rather strange — Apprentices pursue the footprints of freedom and are very difficult to trap or stop. Their signature is Door Opening: using the unique traits of the spirit world, an Apprentice can phase through walls and other barriers by opening a symbolic, incorporeal door, provided no Beyonder power reinforces the barrier and it is not, in mystical terms, too thick to still be called a wall. They slip free of restraints and barriers, are rarely cornered, and possess a keen Spatial Intuition for the layout of a space and the routes that lead out of it. The potion''s main ingredients are a Gem-Eating Worm and a Phantom Crystal, supplemented by goat''s-beard grass hydrosol, ancient well water, any flower grown from a corpse, and soil contaminated by spirit-world creatures. The acting method asks the Apprentice to travel and roam freely, to probe doors, thresholds, and passages with restless curiosity, and to find the way out of any space they enter. As a Sequence 9 sequence it has no advancement ritual; acting alone digests the potion before advancing to Trickmaster.',
  'door',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['door-pathway', 'apprentice', 'travel', 'space', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-seq8-trickmaster',
  'Door Pathway — Sequence 8: Trickmaster',
  'pathway',
  'The Trickmaster turns the Door pathway''s spatial freedom into a repertoire of tricks. A Trickmaster can Flash — blinking a short distance through space, vanishing and reappearing nearby — and perform Escape Tricks to slip out of bindings, traps, and tight corners. They can manipulate objects at a distance through small spatial tricks and loose minor elemental tricks of electric shock, freezing, or sudden gas. The potion''s main ingredients are the stomach sac of a Spirit-Eater and the blood of a Deep-Sea Garfish, supplemented by hornbeam essential oil, thread-ball grass powder, a fully open red chestnut flower, and pure water. The advancement ritual requires escaping an inescapable confinement — a bound and warded space with no ordinary exit — using only Flash, Escape Trick, and spatial sleight, and leaving behind no sign of how it was done. The acting method has the Trickmaster delight in movement and misdirection, make a performance of slipping away, keep wandering rather than settling, and treat every obstacle as a puzzle of space to be tricked open.',
  'door',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['door-pathway', 'trickmaster', 'travel', 'trickery', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-seq7-astrologer',
  'Door Pathway — Sequence 7: Astrologer',
  'pathway',
  'The Astrologer carries the Door pathway into the mid sequences and into the reading of the stars. An Astrologer practises Divination Arts, reading the stars and the spirit world to divine the future and the hidden, and gains Spirit Vision to perceive the spirit world and the traces upon it. They can cloak themselves and their doings with Anti-Divination, frustrating the divination of others, and carry a Spiritual Intuition that warns of danger and anomalies. The potion''s main ingredients are a Meteor Crystal and a crystallised lump of Lavos Squid blood, supplemented by clematis powder, a length of withered grapevine, a pair of octopus eyes, and strong liquor. The advancement ritual requires charting a true and hidden course of the stars — mapping them as they truly stand, beyond ordinary astronomy — to divine a secret guarded against divination, recording the working without alerting what has been spied upon. The acting method asks the Astrologer to chart the stars and the spirit world with driving curiosity, to wander far in pursuit of secret knowledge, and to keep their own path veiled even as they read the paths of others.',
  'door',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['door-pathway', 'astrologer', 'divination', 'mid-sequence', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-seq6-scribe',
  'Door Pathway — Sequence 6: Scribe',
  'pathway',
  'The Scribe — also rendered Recorder — gives the Door pathway its signature ability to capture and replay the powers of others. A Scribe can Record the Beyonder power of another into themselves, storing it to be replayed at need, and loose a recorded ability as if it were their own. They can fold objects and writings away into a small pocket of space, and carry a flawless, perfect recall of everything they have recorded and read. The potion''s main ingredients are one complete brain of an Asman and a cursed object left by an ancient wraith, supplemented by three pages of a diary more than twenty-two years old, quicksilver, honeysuckle essential oil, and equal measures of seawater, lake water, and glacier water. The advancement ritual requires recording and faithfully replaying the power of a hostile Beyonder, witnessing the ability in the midst of a true conflict and reproducing it exactly. The acting method has the Scribe record, catalogue, and preserve knowledge and power alike, roam widely to gather what is worth recording, and guard both their records and the spaces they fold them into.',
  'door',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['door-pathway', 'scribe', 'recording', 'mid-sequence', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'door-seq5-traveler',
  'Door Pathway — Sequence 5: Traveler',
  'pathway',
  'The Traveler is the apex of mid-sequence power in the Door pathway, a master of distance and the doors between places. A Traveler can perform Traveling — opening doors across great distances and journeying through the spirit world — and Blink, teleporting themselves and what they carry across their line of sight. Through Positioning they fix and recall spatial coordinates, returning to them at will, and with the Invisible Hand they reach through folded space to act on things far from their body. The potion''s main ingredients are the Wandering Hide (the cast-off skin of a spirit-world rover) and the heart of a Shadowless Demon Wolf, supplemented by powder left by a trapped ghost, lemon balm powder, a star map drawn in spiritually-charged blood, and Shadowless Demon Wolf blood. The advancement ritual requires establishing four distinct, far-flung coordinates deep within the spirit world, binding them into a single network the Traveler can traverse at will, and travelling the full circuit safely. The acting method has the Traveler journey without limit, let no distance or border hold them, map the spirit world''s far places, and carry their curiosity to every threshold they can reach.',
  'door',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['door-pathway', 'traveler', 'teleportation', 'mid-sequence-apex', 'acting-method'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-pathway-overview',
  'Error Pathway — Overview',
  'pathway',
  'The Error pathway belongs to the Lord of the Mysteries group, anchored to the Sefirah Castle — the same Above-the-Sequence group as the Fool and Door pathways, and a neighbour of both. Its powers deceive and steal: an Error Beyonder can trick others with eloquence and sleight of hand, steal Beyonder or mundane abilities, decrypt secrets, and steal thoughts and intentions. Theft is the pathway''s core skill, and it deepens as one advances. At low sequences theft targets physical items; it grows to encompass Beyonder abilities, then thoughts and ideas, then life itself through parasitism, then fate, identity, and self-awareness, and finally — at the highest sequences — time, anchors, and authorities. At high sequences an Error Beyonder can become a parasite within a host, deceive the world''s rules, create avatars, tamper with fate, manipulate time, and exploit loopholes like a "BUG" in reality itself. Its mythical-creature form is the Worms of Time, and its tarot card is The Lovers; its colour is snow-white platinum. Like the Door pathway, Error Beyonders can safely switch pathways only from Sequence 3 upward.',
  'error',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['error-pathway', 'mysteries-group', 'sefirah-castle', 'theft', 'overview'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq9-marauder',
  'Error Pathway — Sequence 9: Marauder',
  'pathway',
  'The Marauder is the entry point of the Error pathway and is, the wiki notes, hard to tell apart from an ordinary bandit or thief — though for a Marauder the theft of riches is less about enjoyment or survival than answering a calling. Their defining ability is Theft: Marauders steal physical items with supernatural deftness. They possess Agile Hands — wrist and finger flexibility heightened far beyond the general bodily enhancement — making them experts at sleight of hand, and Superior Observation, an intuition that lets them sense at a glance where valuable items are hidden within reach. The potion''s main ingredients are a Blood-Spotted Black Mosquito and the core of a Candle-Eating Spirit, supplemented by a hundred millilitres of others'' blood, nine nail fragments each from a different person, a sapphire, and vervain powder. The acting method asks the Marauder to steal and pilfer as a calling, to trick and deceive their marks rather than take by force what guile can lift, and to slip away unseen with what they have taken. As a Sequence 9 sequence it has no advancement ritual; acting digests the potion before advancing to Swindler.',
  'error',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['error-pathway', 'marauder', 'theft', 'trickery', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq8-swindler',
  'Error Pathway — Sequence 8: Swindler',
  'pathway',
  'The Swindler turns the Error pathway from the lifting of objects to the lifting of trust. A Swindler''s Eloquence spins words that beguile, persuade, and disarm those who listen; their Charm projects a charisma that lowers a mark''s guard and wins their confidence; and Thought Misdirection steers a target''s attention and assumptions where the Swindler wishes them to go. Their theft now extends to small advantages and openings, not only objects. The potion''s main ingredients are a Human-Faced Pitcher Plant and a larva from a Charm-Swarm, supplemented by pure water, twenty millilitres of others'' tears, a lapis lazuli, and white chestnut balm. The advancement ritual requires carrying off a grand confidence scheme by guile alone — constructing an elaborate deception against a wary mark, seeing it through to a profitable end with words and misdirection, and withdrawing before the swindle is ever unmasked. The acting method has the Swindler con and beguile, let their tongue do the stealing, build and burn false trust as the scheme demands, and vanish before the deception is discovered.',
  'error',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['error-pathway', 'swindler', 'deception', 'theft', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq7-cryptologist',
  'Error Pathway — Sequence 7: Cryptologist',
  'pathway',
  'The Cryptologist carries the Error pathway into the mid sequences and into the stealing of secrets. A Cryptologist''s Decryption unravels ciphers, codes, and hidden meanings with supernatural insight, and they can perform Thought Theft, stealing fragments of thought and intention from an unguarded mind. Their Superior Observation reads the smallest tells and the patterns others overlook, and their cipher-trained mind can hold and manipulate vast webs of code and secret knowledge. The potion''s main ingredients are the brain of a Sphinx and an adult from a Charm-Swarm, supplemented by Sphinx blood, Charm-Swarm mucus, a moonstone, a wild rose, and a set of codes the Beyonder has devised themselves. The advancement ritual requires cracking an unbreakable cipher and stealing the secret it guards, lifting the protected knowledge without the owner''s awareness and leaving the cipher seemingly untouched. The acting method has the Cryptologist break codes and steal secrets so that no cipher stands against them, trick understanding from the guarded and unwilling, and keep their own methods encrypted and unknowable.',
  'error',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['error-pathway', 'cryptologist', 'decryption', 'mid-sequence', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq6-prometheus',
  'Error Pathway — Sequence 6: Prometheus',
  'pathway',
  'The Prometheus — whose name, drawn from the original "Fire Stealer," points straight at the myth of the one who stole fire from the gods — gives the Error pathway its signature theft of Beyonder power itself. A Prometheus can steal the Beyonder ability of another, taking their power as their own, and can bestow or kindle that stolen power and knowledge in others, like passing on stolen fire. They carry a strong Mental Resistance against intrusion and the lingering imprints of stolen powers, and a Superior Observation that perceives the abilities and weaknesses worth stealing in a foe. The potion''s main ingredients are a Crystal Threadworm and an attachment-object left by a Robed Phantom, supplemented by a hundred millilitres of freshly stolen fine wine, Robed Phantom residual powder, a citrine, larch essential oil, and a kindling source of fire. The advancement ritual requires stealing a Beyonder''s signature power in the heat of conflict and binding it into oneself, withstanding the imprint of its former owner. The acting method has the Prometheus steal power itself as a thief takes fire, deceive and outwit those stronger than them, and share or hoard their stolen fire as cunning dictates.',
  'error',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['error-pathway', 'prometheus', 'ability-theft', 'mid-sequence', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq5-dream-stealer',
  'Error Pathway — Sequence 5: Dream Stealer',
  'pathway',
  'The Dream Stealer — also rendered Dreams Thief — is the apex of mid-sequence power in the Error pathway, where theft turns from the material toward the abstract. A Dream Stealer can Disguise themselves at the level of heavenly mysteries, stealing an identity so completely they become another in the eyes of fate; they can usurp the thoughts and intentions of a target, slip into the dreams of others to steal what they hold dear, and steal increasingly abstract things — ideas, roles, and concealed truths. The potion''s main ingredients are the heart of a Dream-Eating Rat and the spirit of a Fallen Aura, supplemented by Dream-Eating Rat blood, despiritualised Fallen Aura, a celestite, lavender hydrosol, and fifty millilitres of another''s tears shed over a shattered ideal. The advancement ritual requires becoming a recurring figure — an important supporting role or the chief villain — in the unconscious dreams of at least thirty people, ensuring those dreams are unfolding at the moment the potion is consumed, and stealing from within them without waking the dreamers. The acting method has the Dream Stealer steal identities, dreams, and ideas, deceive even fate, and wear stolen selves without losing the thread of their own.',
  'error',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['error-pathway', 'dream-stealer', 'theft', 'mid-sequence-apex', 'acting-method'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-pathway-overview',
  'Hanged Man Pathway — Overview',
  'pathway',
  'The Hanged Man pathway belongs to the God Almighty group, anchored to the Chaos Sea — the same Above-the-Sequence group as the Visionary, Sun, and Tyrant pathways. It represents Degeneration, but also sacrifice and responsibility in a positive sense, holding the symbolisms of Sin and Sacrifice and partial authority over Shadow, Darkness, Degeneration, Corruption, and Mutation. Its Beyonders carry innate knowledge of ritualistic magic and secret entities, high spiritual intuition, shadow spells, and flesh-and-blood magic, and can graze upon souls to use their powers. At high sequences they can peel evil thoughts and fuse them with a shadow to form a second self, manipulate flesh and blood into a trinity, twist the ambiguity of others'' words, bring degeneration to all things, spread betrayal, and become the embodiment of Sacrifice and Sin. Its mythical-creature form is a black shadow and writhing flesh, its tarot card is The Hanged Man — the card of surrender, martyrdom, and sacrifice to the greater good — and its colour is blood red. According to Klein Moretti this pathway is the easiest of all to lose control on and fall to madness.',
  'hanged-man',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['hanged-man-pathway', 'god-almighty-group', 'chaos-sea', 'sacrifice', 'overview'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-seq9-secrets-suppliant',
  'Hanged Man Pathway — Sequence 9: Secrets Suppliant',
  'pathway',
  'The Secrets Suppliant is the entry point of the Hanged Man pathway, and its gifts are knowledge bought with sacrifice. A Secrets Suppliant is bestowed, through the potion itself, with Mysticism Knowledge — a decent grounding in sacrifices and some ritualistic magic, including a handful of honorific names of secret, sinister entities tied to depravity, true kin, and the gaze of fate. They can perform Ritualistic Magic and divination drawn from those entities, and carry the High Spirituality common to the pathway. The knowledge attached to the potion more or less distorts a Secrets Suppliant''s perception — the first taste of why this pathway corrupts so readily. The potion''s main ingredients are the heart of a Shadow-Touched Toad and ash gathered from a sacrificial altar, supplemented by black goat''s blood, mandrake root powder, and oil pressed from graveyard wormwood. The acting method asks the Secrets Suppliant to seek forbidden secrets and offer the sacrifices the rites demand, to embrace self-denial and burden, and to bear the distortions of dark knowledge without surrendering their humanity. As a Sequence 9 sequence it has no advancement ritual; acting digests the potion before advancing to Listener.',
  'hanged-man',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['hanged-man-pathway', 'secrets-suppliant', 'sacrifice', 'ritual', 'acting-method'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-seq8-listener',
  'Hanged Man Pathway — Sequence 8: Listener',
  'pathway',
  'The Listener — also styled the Whispered — turns the Hanged Man pathway toward the gathering of secrets. A Listener can Listen, hearing whispers carried on shadow and wind: secrets, intentions, and distant words otherwise hidden. They can also Whisper, sending words that worm into a target''s mind to unsettle or mislead, and their spiritual sensitivity to the unseen is greatly heightened. The potion''s main ingredients are the ears of a Whispering Shadow-Bat and a fragment of wood from a confessional steeped in secrets, supplemented by nightshade hydrosol, a strip of Shadow-Bat wing membrane, and wax from a black ritual candle. The advancement ritual requires keeping a vigil of silence and listening — denying oneself speech and comfort — until the shadows yield a secret hidden from all others, and setting it down faithfully without acting on it for gain. The acting method has the Listener listen for the secrets others bury, give up their own voice in the world''s affairs to observe and abstain, and carry the weight of what they hear without letting it corrupt them — the pathway''s themes of self-denial and dangerous knowledge tightening.',
  'hanged-man',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['hanged-man-pathway', 'listener', 'secrets', 'self-denial', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-seq7-shadow-ascetic',
  'Hanged Man Pathway — Sequence 7: Shadow Ascetic',
  'pathway',
  'The Shadow Ascetic carries the Hanged Man pathway into the mid sequences and into mastery of shadow through self-denial. A Shadow Ascetic can perform Shadow Summon, calling shadows into form to serve, scout, and strike; Shadow Manipulation, shaping, extending, and commanding the shadows around them; Shadow Lurking, sinking into shadow to move unseen and lie in wait; and Shadow Curse, laying curses carried through a target''s own shadow. The potion''s main ingredients are the heart of a Shadow-Crawler and a scrap of a penitent''s hair shirt, supplemented by Shadow-Crawler blood, powdered black tourmaline, and salt blessed through ritual fasting. The advancement ritual requires enduring a trial of self-denial in darkness — withdrawing into the dark and denying oneself food, light, and ease — while mastering one''s summoned shadows through the privation rather than despite it. The acting method has the Shadow Ascetic live as an ascetic of shadow, master the shadows through discipline and sacrifice rather than indulgence, and take on burdens others refuse while asking nothing in return.',
  'hanged-man',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['hanged-man-pathway', 'shadow-ascetic', 'shadow', 'self-denial', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-seq6-rose-bishop',
  'Hanged Man Pathway — Sequence 6: Rose Bishop',
  'pathway',
  'The Rose Bishop — also rendered Rose Priest — gives the Hanged Man pathway its signature flesh-and-blood magic. A Rose Bishop works magic through flesh and blood, their own or another''s; they can shape Flesh and Blood Servants and constructs to do their bidding, soften and reshape flesh to slip through gaps or absorb blows, and lay a Blood Curse through a victim''s flesh and blood. The potion''s main ingredients are the heart of a Blood-Rose and the spinal fluid of a Flesh-Weaver, supplemented by ninety millilitres of sacrificial blood, seven crimson Blood-Rose petals, and carmine sandalwood oil. The advancement ritual requires completing a great flesh-and-blood rite that cannot be done without genuine sacrifice, offering up the required cost from one''s own flesh and blood — not only another''s — without letting the working corrupt one''s purpose. The acting method has the Rose Bishop offer flesh and blood in sacrifice, their own offerings first of all, take up the responsibility of the rite and bear its cost willingly, and hold to their vows even as the flesh-magic tempts them toward depravity.',
  'hanged-man',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['hanged-man-pathway', 'rose-bishop', 'flesh-and-blood', 'sacrifice', 'acting-method'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hanged-man-seq5-shepherd',
  'Hanged Man Pathway — Sequence 5: Shepherd',
  'pathway',
  'The Shepherd is the apex of mid-sequence power in the Hanged Man pathway, where flesh, shadow, and the grazing of souls converge. A Shepherd can Graze upon souls and spirits, devouring a portion of their power to fuel their own; they command greatly amplified flesh-and-blood and shadow magic, can devour spirits and flesh to grow their dominion and replenish themselves, and marshal a Shepherd''s Flock of shadow- and flesh-servants bound to their will. The potion''s main ingredients are the stomach of a Soul-Grazing Beast and the spirit-crystal of a Degenerate Shepherd, supplemented by a soul freely surrendered in sacrifice, Soul-Grazing Beast blood, soil steeped in a Degenerate Shepherd''s shadow, and sap from a crimson flesh-tree. The advancement ritual requires gathering a flock of bound souls and spirits and sustaining them through one''s own sacrifice — by grazing and offering rather than mere devouring — while holding one''s purpose against the depravity the power presses upon one. The acting method has the Shepherd tend the souls and shadows in their keeping, sacrifice and deny themselves for the flock''s sake, and resist the constant pull toward sin and degeneration that defines the pathway.',
  'hanged-man',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['hanged-man-pathway', 'shepherd', 'souls', 'mid-sequence-apex', 'acting-method'],
  270
);

