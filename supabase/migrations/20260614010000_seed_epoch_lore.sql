-- Seed the Epoch 1-4 curated lore (issue: character epoch isolation).
-- Generated from src/lib/lore/epoch-{first,second,third,fourth}.ts (the TS
-- source is canonical). Same lore_entries INSERT format as the prior seed
-- migrations. The Fifth-Epoch rows are already seeded (and epoch-tagged) by the
-- earlier migrations, so this only adds the four pre-Iron-Age epochs.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'first-epoch-overview',
  'First Epoch — The Age of Chaos',
  'metaphysics',
  'The First Epoch, the Age of Chaos, is the world''s lawless dawn. It began when the Original Creator — a primordial, maddened will asleep deep within the earth — awoke, convulsed under the warring concepts and authorities it contained, and tore itself apart. Its shattered Beyonder Characteristics scattered across the world and were absorbed by humans, beasts, and surviving things, igniting an age of monstrous mutation. There are no nations, no churches, no written law and no codified pathways — only raw, half-understood power and the long, dark struggle of the survivors to claw back some sliver of reason. Beyonders here are not secret operatives but walking calamities; a single mutated being can unmake a settlement. Knowledge is oral, superstition is survival, and to drink an unknown power is as likely to twist you into a beast as to save you. The epoch closes only when the first true wills claw their way toward godhood out of the madness.',
  null,
  1,
  null,
  '{}',
  '{}',
  ARRAY['epoch', 'age-of-chaos', 'world-setting', 'history'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'first-epoch-survival',
  'First Epoch — Survival and Society',
  'metaphysics',
  'There is no civilization in the Age of Chaos worthy of the name — only survival. Humanity, nearly annihilated by the cataclysm and the mutated giants and beasts that followed, clings on in scattered, isolated enclaves: caves, hide-tent camps, and crude stockades hidden in defensible wilderness. Status is decided by raw power and usefulness, not birth or wealth; there is no coin, only barter and the protection of whoever is strongest. Bands gather around a powerful Beyonder or a shaman who can read the omens, and such warbands rise and shatter as quickly as their leaders do. Tools are bronze, bone, flint, and hide; fire and a defensible cave are luxuries. Outsiders are met with spears first. The dominant moods are dread and exhaustion — the constant awareness that the dark beyond the firelight is full of things that were once human, and worse things that never were.',
  null,
  1,
  null,
  '{}',
  '{}',
  ARRAY['society', 'daily-life', 'survival', 'world-setting'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'first-epoch-mutated-races',
  'First Epoch — The Mutated Races and the First Gods',
  'metaphysics',
  'When the Original Creator self-destructed, its dismembered body and scattered Characteristics seeded the world''s monstrous races: giants, elves, treants, dragons, feathered serpents, phoenixes, demonic wolves, naga, sea monsters, and twisted mutants. In the beginning these were bloodthirsty and mad; only slowly did some claw back rationality and the first crude cultures. From this chaos the first true wills rose toward godhood — and the epoch ends with the death of Zedus, slain (with Aurmir''s aid) to forestall the Moon Pathway''s summoning authority dragging a still-greater horror onto the world, and with Aurmir''s ascension as the first Ancient God. Their rise begins the slow deterioration of the Astral Barrier that walls the world from outer terrors. Narrator: treat named figures and the divine machinery as deep background a First-Epoch survivor would know only as terrifying rumor, not history.',
  null,
  1,
  null,
  '{}',
  '{}',
  ARRAY['powers', 'beyonder-races', 'ancient-gods', 'history'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'first-epoch-wild-lands',
  'First Epoch — The Wild Lands',
  'location',
  'The wild lands are everywhere and nowhere — an unmapped, monster-haunted expanse of primeval forest, ash-plains, and broken country where the cataclysm''s scars still smoke. There are no roads, no borders, and no names that outlast the people who coin them; a "place" is a defensible cave, a river ford, a hunting ground, or the camp of a warband, and all of them are temporary. Travel is deadly: the open ground between enclaves belongs to mutated beasts and the things that were once people. Somewhere to the west lies a far greater wound — a stretch of the world the Celestial Worthy is said to have sealed away behind a wall of gray fog, locking part of all power inside it. The survivors who endure here learn to read the land like scripture: which water is safe, which silence means a predator, which ruins to never enter after dark.',
  null,
  1,
  'wild',
  '{}',
  '{}',
  ARRAY['geography', 'wild-lands', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'second-epoch-overview',
  'Second Epoch — The Dark Epoch',
  'metaphysics',
  'The Second Epoch, humanity''s Dark Epoch, is the age of the Ancient Gods. As the chaos of the first age settled, the surviving Beyonder races purified, gained reason, and built civilizations — and eight monstrous-but-rational Ancient Gods rose to divide rule over sky, ocean, land, the Spirit World, and the Astral World. Humanity is not the master of this world but its underclass: subordinate to, and often enslaved by, the dominant humanoid races — the Giants, the Elves, and the Sanguines. To be a human Beyonder in this age is doubly dangerous: power marks you, and a slave with power is a thing to be collared or destroyed. The mood is oppression and hidden defiance; hope itself is contraband. The epoch''s long night ends only when a human survivor begins, impossibly, to kill gods.',
  null,
  2,
  null,
  '{}',
  '{}',
  ARRAY['epoch', 'dark-epoch', 'world-setting', 'history', 'ancient-gods'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'second-epoch-society',
  'Second Epoch — Life Under the Gods',
  'metaphysics',
  'Human life in the Dark Epoch is lived in the shadow of inhuman masters. Most humans exist as property or prey of the Giants, Elves, and Sanguines — labor for their works, tribute for their courts, or cattle for the vampires'' thirst. Humans cluster in enclaves and slave-quarters at the margins of the great non-human realms, governed by overseers who answer to inhuman lords. Daily life is fear, obedience, and the small rebellions of those with nothing left to lose: a hidden shrine, a smuggled scrap of forbidden formula, a whispered story that humanity was not always meant to kneel. A Beyonder hiding among the enclaves keeps their eyes down and their power secret, for the overseers watch for exactly that spark. Survival means invisibility; defiance means a careful, patient conspiracy, never an open one.',
  null,
  2,
  null,
  '{}',
  '{}',
  ARRAY['society', 'daily-life', 'slavery', 'world-setting'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'second-epoch-ancient-gods',
  'Second Epoch — The Eight Ancient Gods',
  'metaphysics',
  'Eight Ancient Gods rule the Dark Epoch, split into rival blocs. The humanoid bloc is led by the Giant King Aurmir, the Elf King Soniathrym, and the Sanguine Ancestor Lilith — the powers whose races hold humanity in bondage. The non-human bloc gathers the Dragon of Imagination Ankewelt, the Phoenix Ancestor Gregrace, and the Mutated King Kvastir. Apart from both stand the chaos-aligned independents — the Devil Monarch Farbauti and the Annihilation Demonic Wolf Flegrea — who seek to subvert all order and corrupt all life. Their wars and bargains decide the fate of every lesser thing beneath them, humanity included. Near the epoch''s close a human survivor, Grisha Adam, will manipulate the First Blasphemy Slate to surface the divine pathway formulas — the seed of the codified potion-and-ritual system that defines every later age. Narrator: a human of this age knows these gods as feared names and overlords, not as a tidy pantheon.',
  null,
  2,
  null,
  '{}',
  '{}',
  ARRAY['powers', 'ancient-gods', 'factions', 'history'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'second-epoch-enclave',
  'Second Epoch — The Human Enclave',
  'location',
  'A human enclave in the Dark Epoch is a walled-off quarter, work-camp, or warren tolerated at the edge of an inhuman dominion — a giant''s holding, an elven forest-realm, or a sanguine city. Within its bounds humans live packed and watched: mud-and-timber dwellings, communal labor sheds, a market of scraps, and always the overseers'' hall from which the masters'' will is enforced. Beyond the enclave lies the dominion proper — architecture built for beings far larger or stranger than people, where a human walks only on an errand and never freely. The great courts of the gods, such as Aurmir''s Giant King''s Court, are spoken of in the enclaves the way mortals speak of weather and judgment: distant, absolute, and not to be appealed. An enclave''s unwritten law is simple — keep the masters satisfied, keep the dangerous ones hidden, and survive to the next dawn.',
  null,
  2,
  'human',
  '{}',
  '{}',
  ARRAY['geography', 'enclave', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'third-epoch-overview',
  'Third Epoch — The Cataclysm Epoch',
  'metaphysics',
  'The Third Epoch is humanity''s golden age and the catastrophe that ended it. Having slain the Ancient Gods, the human survivor Grisha Adam became the Ancient Sun God — the sole Orthodox God, "The Omniscient and Omnipotent" — and for the first time humanity stood as the world''s favored, dominant race. This is the Glorious Era (also called the Radiant Era), a theocratic golden age of faith and sun-worship that endured for over a thousand years under one god and his single church. It is also doomed. The epoch''s second half, the Cataclysm Era, is the god''s fall: a conspiracy of his own lieutenants and rival deities besieges and kills him, and his death scars the world. To play in this age is to live inside either the radiant certainty of the one faith or the lightless grief that follows its collapse.',
  null,
  3,
  null,
  '{}',
  '{}',
  ARRAY['epoch', 'cataclysm', 'world-setting', 'history', 'sun-god'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'third-epoch-glorious-era',
  'Third Epoch — The Glorious Era and the Cataclysm',
  'metaphysics',
  'In the Glorious Era, humanity prospers under the Ancient Sun God as the blessed people of the one god. Society is faith-centered and optimistic: sun-worship, church and crusade, civilization rebuilt across the continents under divine sponsorship. Power is mystical rather than mechanical — this is the age in which the codified pathway-and-potion system matures under the god''s favor, not an age of machines. Then comes the Cataclysm. A conspiracy, Rose Redemption — formed by the dark-angel Sasrir and the Evernight Goddess, joined by six of the god''s own Kings of Angels, five former subsidiary gods, and the God of Combat — besieges the Ancient Sun God while a Primordial will wars inside him, and kills him at the Battlefield of the Gods. His fall shatters the most prosperous continent into the cursed, sunless Forsaken Land, and from his remains the first modern deities — the Lord of Storms, the Eternal Blazing Sun, and others — are born.',
  null,
  3,
  null,
  '{}',
  '{}',
  ARRAY['powers', 'rose-redemption', 'kings-of-angels', 'history'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'third-epoch-war-camp',
  'Third Epoch — The War-Camp of the Faithful',
  'location',
  'Across the Third Epoch, the crusading host of the one faith moves as a city on the march. A war-camp of the faithful is a sprawl of canvas and banner ringed by pickets and prayer-fires: rows of tents, a smith''s line, a field-temple to the Ancient Sun God at its heart, and the perpetual noise of soldiers, pilgrims, healers, and zealots. By day the horns muster the columns; by night the camp glows with watch-fires and hymn. Beyonders serve as the host''s living artillery and its most dangerous secrets, their powers framed as miracles granted by the sun. Faith is law here, doubt is dangerous, and advancement — in rank or in Sequence — is bound up with devotion. In the Cataclysm Era these same camps become refuges and last stands as the golden age burns, their certainties curdling into desperation under a dimming sky.',
  null,
  3,
  'war-camp',
  '{}',
  '{}',
  ARRAY['geography', 'war-camp', 'setting', 'crusade'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'third-epoch-forsaken-land',
  'Third Epoch — The Forsaken Land and the City of Silver',
  'location',
  'When the Ancient Sun God fell, the continent at the heart of his glory was split from the world and cursed: the Forsaken Land of the Gods, wrapped in permanent storm-cloud and lightless dark, where day and night are told only by the frequency of the lightning. Within it endure broken societies that still worship the lost Creator — chief among them the Kingdom of Silver and its City of Silver, whose people, believing themselves abandoned, perform endless penance and sacrifice while awaiting the day the sun rises again. The Battlefield of the Gods, where the god was slain, becomes the Sea of Ruins. For a character of the late Third Epoch, this is the shape of the end times: pilgrimage through ash and lightning, faith soured into penitential dread, and the slow realization that the god who blessed the world is not coming back.',
  null,
  3,
  'forsaken',
  '{}',
  '{}',
  ARRAY['geography', 'forsaken-land', 'city-of-silver', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fourth-epoch-overview',
  'Fourth Epoch — The Epoch of the Gods',
  'metaphysics',
  'The Fourth Epoch is the age when gods walk the world in person and raise mortal-divine empires to wage war across the continents. With the Ancient Sun God gone, new deities descend frequently into reality, and god-emperors carve the Northern Continent into rival dominions. It is an imperial, theological, and dark age — not the steam-and-iron world of the Fifth Epoch, but a pre-industrial one of walled cities, candlelight, black stone, and divine politics. Mighty empires rise and fall in succession: the Solomon Empire of the Black Emperor, the Tudor-Trunsoest United Empire that overthrows it, and the War of the Four Emperors that follows. Divine intervention is administered like taxation, and a mortal Beyonder lives among miracles and atrocities alike, carrying a power they must not openly declare among gods who notice such things. The epoch ends in catastrophe and the gods'' retreat — the threshold of the modern world.',
  null,
  4,
  null,
  '{}',
  '{}',
  ARRAY['epoch', 'epoch-of-the-gods', 'world-setting', 'history', 'solomon-empire'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fourth-epoch-empires',
  'Fourth Epoch — The God-Empires and Their Fall',
  'metaphysics',
  'Three powers define the Fourth Epoch''s history. First, the Solomon Empire, ruled by the Sequence-0 Black Emperor Solomon and backed by the True Creator and Rose Redemption, which dominated the Northern Continent and warred on the orthodox Seven Gods for roughly a thousand years. Then Alista Tudor and Trunsoest, with six gods'' backing, rebelled, killed Solomon, and founded the Tudor-Trunsoest United Empire — until Solomon resurrected and rebuilt his empire, igniting the War of the Four Emperors, in which Tudor forcibly swapped to the Red Priest Pathway and became a half-mad Sequence-0 sovereign. Finally, after the emperors fell, came the Pale Disaster: the Primordial Demoness and Death ravaged the Northern Continent until the Seven Deities united, slew Death, and gravely wounded the Demoness — but were so injured that they withdrew their Divine Kingdoms into the Astral World, thereafter sending only avatars. That retreat hands the world to the Seven Orthodox Churches and the great nations of the Fifth Epoch.',
  null,
  4,
  null,
  '{}',
  '{}',
  ARRAY['powers', 'solomon-empire', 'tudor', 'pale-disaster', 'history'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fourth-epoch-society',
  'Fourth Epoch — Imperial Life Among the Gods',
  'metaphysics',
  'Fourth-Epoch civilization is recognizably imperial but gothic and god-haunted. Cities are walled and gated, watched by tax-collectors and police, lit by candle and torch rather than gas; the great imperial architecture favors black stone, asymmetrical and disorderly designs, and candlesticks hung from high ceilings. Society is layered beneath god-emperors and their divine patrons, with churches, courts, and cults threaded through every city. Power is divine and Beyonder rather than mechanical, and the supernatural is not hidden as it will be in the Fifth Epoch — gods and their works are a public, terrifying fact of life. Beneath the order runs a constant undercurrent of cults, demon-worship, and conspiracy, for the age''s emperors themselves dealt with demons and fallen angels. For a mortal, daily life means living small and careful in the gaps between empires and deities whose quarrels remake the map.',
  null,
  4,
  null,
  '{}',
  '{}',
  ARRAY['society', 'daily-life', 'imperial', 'world-setting'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fourth-epoch-trier',
  'Fourth Epoch — Imperial Trier',
  'location',
  'The Tudor Empire''s capital, the Trier of the Fourth Epoch, is the era''s signature city: a magnificent, ominous sprawl of pitch-black and blood-red buildings, asymmetrical black halls beside houses that look splashed with gore, intermittently veiled in thin gray fog. Its streets run so narrow in places that neighbors could shake hands across them. A three-meter wall pierced by fifty-four gates rings the city, each gate manned by tax-collectors and police who watch for the wanted, enclosing twenty quartiers of imperial life. After the War of the Four Emperors part of the city sank into the earth, becoming the Underground Trier — a buried refuge of rioters, murderers, smugglers, and cultists — over which a new city was raised as a seal against what festers below. Centuries later, the Fifth Epoch''s Intis capital will be built upon this same haunted ground; here, in the Fourth, it is a living imperial seat of black stone and divine dread.',
  null,
  4,
  'imperial',
  '{}',
  '{}',
  ARRAY['geography', 'trier', 'tudor-empire', 'setting'],
  235
);
