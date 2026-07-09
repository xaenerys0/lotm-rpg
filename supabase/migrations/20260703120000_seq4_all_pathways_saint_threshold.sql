-- Sequence 4 Saint-threshold bridge for all 22 pathways (issue #99 follow-up)
-- Generated from canonical TS source via scripts/generate-seq4-migration.ts
-- narratorOnly is a TS-only prompt flag and is intentionally not persisted.

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'white-tower-pathway-overview',
    'White Tower Pathway — Overview',
    'pathway',
    'The White Tower pathway is one of the twenty-two pathways of the Beyonder world, belonging to the God Almighty family of pathways. Its Beyonders walk the road of reason, deduction, and the unveiling of secrets through scholarship and mysticism. From the lowest rung its sequences progress Reader (Sequence 9), Student of Ratiocination (8), Detective (7), Polymath (6), and Mysticism Magister (Sequence 5); its Saint and demigod rungs continue Prophet (Sequence 4), Cognizer (3), Wisdom Angel (2), and Omniscient Eye (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title White Tower (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'white tower',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"white-tower-pathway","god-almighty-group","overview"}',
    225
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'twilight-giant-pathway-overview',
    'Twilight Giant Pathway — Overview',
    'pathway',
    'The Twilight Giant pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Eternal Darkness family of pathways. Its Beyonders walk the road of martial prowess, weapons mastery, and the towering strength of giants. From the lowest rung its sequences progress Warrior (Sequence 9), Pugilist (8), Weapon Master (7), Dawn Paladin (6), and Guardian (Sequence 5); its Saint and demigod rungs continue Demon Hunter (Sequence 4), Silver Knight (3), Glory (2), and Hand of God (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Twilight Giant (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'twilight giant',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"twilight-giant-pathway","eternal-darkness-group","overview"}',
    220
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'justiciar-pathway-overview',
    'Justiciar Pathway — Overview',
    'pathway',
    'The Justiciar pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Trickster Apostle group of pathways. Its Beyonders walk the road of law, interrogation, judgment, and the enforcement of order. From the lowest rung its sequences progress Arbiter (Sequence 9), Sheriff (8), Interrogator (7), Judge (6), and Disciplinary Paladin (Sequence 5); its Saint and demigod rungs continue Imperative Mage (Sequence 4), Chaos Hunter (3), Balancer (2), and Hand of Order (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Justiciar (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'justiciar',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"justiciar-pathway","order-group","overview"}',
    214
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'black-emperor-pathway-overview',
    'Black Emperor Pathway — Overview',
    'pathway',
    'The Black Emperor pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Trickster Apostle group of pathways. Its Beyonders walk the road of subversion, bribery, and the corruption of order from within. From the lowest rung its sequences progress Lawyer (Sequence 9), Barbarian (8), Briber (7), Baron of Corruption (6), and Mentor of Disorder (Sequence 5); its Saint and demigod rungs continue Earl of the Fallen (Sequence 4), Frenzied Mage (3), Duke of Entropy (2), and Prince of Abolition (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Black Emperor (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'black emperor',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"black-emperor-pathway","order-group","overview"}',
    217
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'red-priest-pathway-overview',
    'Red Priest Pathway — Overview',
    'pathway',
    'The Red Priest pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of battle, fire, provocation, and the reaping of war. From the lowest rung its sequences progress Hunter (Sequence 9), Provoker (8), Pyromaniac (7), Conspirer (6), and Reaper (Sequence 5); its Saint and demigod rungs continue Iron-blooded Knight (Sequence 4), War Bishop (3), Weather Warlock (2), and Conqueror (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Red Priest (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'red priest',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"red-priest-pathway","combat-group","overview"}',
    209
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'demoness-pathway-overview',
    'Demoness Pathway — Overview',
    'pathway',
    'The Demoness pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of assassination, temptation, witchcraft, and affliction. From the lowest rung its sequences progress Assassin (Sequence 9), Instigator (8), Witch (7), Pleasure (6), and Affliction (Sequence 5); its Saint and demigod rungs continue Despair (Sequence 4), Unaging (3), Catastrophe (2), and Apocalypse (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Demoness (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'demoness',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"demoness-pathway","combat-group","overview"}',
    216
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'mother-pathway-overview',
    'Mother Pathway — Overview',
    'pathway',
    'The Mother pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Goddess of Origin group of pathways. Its Beyonders walk the road of cultivation, healing, harvest, and the flourishing of life. From the lowest rung its sequences progress Planter (Sequence 9), Doctor (8), Harvest Priest (7), Biologist (6), and Druid (Sequence 5); its Saint and demigod rungs continue Classical Alchemist (Sequence 4), Pallbearer (3), Desolate Matriarch (2), and Naturewalker (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Mother (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'mother',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"mother-pathway","life-group","overview"}',
    210
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'moon-pathway-overview',
    'Moon Pathway — Overview',
    'pathway',
    'The Moon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Goddess of Origin group of pathways. Its Beyonders walk the road of potions, beast-taming, vampirism, and the blood of the scarlet moon. From the lowest rung its sequences progress Apothecary (Sequence 9), Beast Tamer (8), Vampire (7), Potions Professor (6), and Scarlet Scholar (Sequence 5); its Saint and demigod rungs continue Shaman King (Sequence 4), High Summoner (3), Life-Giver (2), and Beauty Goddess (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Moon (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'moon',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"moon-pathway","life-group","overview"}',
    217
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'hermit-pathway-overview',
    'Hermit Pathway — Overview',
    'pathway',
    'The Hermit pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of occult lore, warlockry, scrolls, and the reading of the constellations. From the lowest rung its sequences progress Mystery Pryer (Sequence 9), Melee Scholar (8), Warlock (7), Scrolls Professor (6), and Constellations Master (Sequence 5); its Saint and demigod rungs continue Mysticologist (Sequence 4), Clairvoyant (3), Sage (2), and Knowledge Emperor (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Hermit (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'hermit',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"hermit-pathway","knowledge-group","overview"}',
    222
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'paragon-pathway-overview',
    'Paragon Pathway — Overview',
    'pathway',
    'The Paragon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of scholarship, archaeology, appraisal, craft, and the heavens. From the lowest rung its sequences progress Savant (Sequence 9), Archaeologist (8), Appraiser (7), Artisan (6), and Astronomer (Sequence 5); its Saint and demigod rungs continue Alchemist (Sequence 4), Arcane Scholar (3), Knowledge Magister (2), and Illuminator (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Paragon (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'paragon',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"paragon-pathway","knowledge-group","overview"}',
    213
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'wheel-of-fortune-pathway-overview',
    'Wheel of Fortune Pathway — Overview',
    'pathway',
    'The Wheel of Fortune pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Key of Light group of pathways. Its Beyonders walk the road of fortune, luck, calamity, and the turning of fate. From the lowest rung its sequences progress Monster (Sequence 9), Robot (8), Lucky One (7), Calamity Priest (6), and Winner (Sequence 5); its Saint and demigod rungs continue Misfortune Mage (Sequence 4), Chaoswalker (3), Soothsayer (2), and Snake of Mercury (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Wheel of Fortune (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'wheel of fortune',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"wheel-of-fortune-pathway","wheel-of-fortune-group","overview"}',
    214
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'abyss-pathway-overview',
    'Abyss Pathway — Overview',
    'pathway',
    'The Abyss pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of crime, slaughter, devilry, and the apostasy of desire. From the lowest rung its sequences progress Criminal (Sequence 9), Unwinged Angel (8), Serial Killer (7), Devil (6), and Desire Apostle (Sequence 5); its Saint and demigod rungs continue Demon (Sequence 4), Blatherer (3), Bloody Archduke (2), and Filthy Monarch (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Abyss (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'abyss',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"abyss-pathway","abyss-group","overview"}',
    212
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'chained-pathway-overview',
    'Chained Pathway — Overview',
    'pathway',
    'The Chained pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of imprisonment, lunacy, monstrous transformation, and the restless dead. From the lowest rung its sequences progress Prisoner (Sequence 9), Lunatic (8), Werewolf (7), Zombie (6), and Wraith (Sequence 5); its Saint and demigod rungs continue Puppet (Sequence 4), Disciple of Silence (3), Ancient Bane (2), and Abomination (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Chained (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
    'chained',
    5,
    null,
    null,
    '{9,8,7,6,5,4,3,2,1}',
    '{"chained-pathway","abyss-group","overview"}',
    212
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'fool-seq4-bizarro-sorcerer',
    'Fool Pathway — Sequence 4: Bizarro Sorcerer',
    'pathway',
    'The Bizarro Sorcerer is the Saint threshold of the Fool pathway, where the performer becomes the stage itself. At this rung the Beyonder gains Wishing — the power to grant or twist spoken wishes within the bounds of spiritual cost, a dangerous echo of the miracles wielded by higher sequences. Bizarro Bulette allows the sorcerer to turn paper figurines into living, functional duplicates or creatures that obey simple commands. Advanced Marionette Control extends the strings from Sequence 5, permitting control of multiple high-quality marionettes with finer precision and at greater range. The Bizarro Sorcerer also begins to blur the line between illusion and substance, making staged wonders briefly real. The potion requires two main ingredients — the tongue of a Bizarro Bulette and the crystallized teardrop of a Scholar of Yore — and three supplementary ingredients: mercury from a broken mirror, thread spun by a Thousand-Faced Hunter, and ash of a burned marionette. The advancement ritual demands performing a miracle that is witnessed and believed by at least a hundred people, then revealing it as a deception while still leaving one element of it permanently real. The acting method requires the Bizarro Sorcerer to stage increasingly impossible performances, treat reality as a prop, and never explain how the trick is done — even to themselves. At Sequence 4 the Fool pathway practitioner crosses from puppeteer to illusionist-architect, and the hidden churches of the world begin to take notice.',
    'fool',
    5,
    null,
    '{"Klein Moretti"}',
    '{4}',
    '{"fool-pathway","bizarro-sorcerer","saint-threshold","wishing","marionette"}',
    275
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'visionary-seq4-manipulator',
    'Visionary Pathway — Sequence 4: Manipulator',
    'pathway',
    'The Manipulator is the Saint threshold of the Visionary pathway, where individual mind-reading blooms into mass psychological control. A Manipulator can weave Collective Emotional Resonance, nudging the mood of a crowd or an institution in a chosen direction without any single victim realizing they are being influenced. Virtual Persona allows them to project a convincing secondary self into the minds of others — a false friend, enemy, or witness indistinguishable from reality until dispelled. Deep Memory Implantation surpasses the Hypnotist''s rewriting by planting entirely fabricated life experiences that the target accepts as their own history. The Manipulator also gains Authority of the Mind, making their spoken assertions feel intuitively true to weaker-willed listeners. The potion requires two main ingredients — the brain of a Mind Dragon and a vial of distilled crowd emotion — and three supplementary ingredients: Dreamweaver Spider silk, pollen of the Slumber Flower, and a mirror that has reflected a lie told by a Sequence 5 Beyonder. The advancement ritual demands altering the collective memory of a community regarding a significant event, then living within the rewritten history for a full lunar cycle without being exposed. The acting method requires the Manipulator to study groups as living minds, accept that truth is negotiated rather than fixed, and never enjoy the control so much that they forget their own identity. At Sequence 4 the Visionary pathway practitioner becomes a sculptor of consensus, and such power draws the Twilight Hermit Order''s quiet attention.',
    'visionary',
    5,
    null,
    '{"Audrey Hall"}',
    '{4}',
    '{"visionary-pathway","manipulator","saint-threshold","memory","consensus"}',
    285
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'sun-seq4-unshadowed',
    'Sun Pathway — Sequence 4: Unshadowed',
    'pathway',
    'The Unshadowed is the Saint threshold of the Sun pathway, where the practitioner''s inner light becomes so intense that it leaves no room for shadow — literal or metaphorical. An Unshadowed casts no shadow and cannot be hidden by darkness, concealment, or ordinary illusion; their presence is a living candle that weak shadows flee. Solar Purification reaches a scale that can cleanse entire buildings or small neighborhoods of corruption and undeath, burning spiritual taint like parchment. They gain the Body of Light, a partial transformation that makes them highly resistant to physical harm, poison, and disease while rendering them painful to touch for creatures of darkness. Truth-Sight strips away lies within their radiance, making deception difficult to maintain in their presence. The potion requires two main ingredients — the heart of a Radiant Giant and a vial of sunlight collected at true noon from a place that has not seen shadow for a full day — and three supplementary ingredients: Phoenix feather ash, consecrated gold dust, and a drop of blood from a Priest of Light who died in service. The advancement ritual requires walking into a place of profound supernatural darkness and maintaining a self-sustained radiance from dusk until dawn without the light faltering. The acting method demands that the Unshadowed live without hidden deeds, illuminate corruption wherever it hides, and accept that their own shadowlessness makes them impossible to miss — both as savior and as target. At Sequence 4 the Sun pathway practitioner becomes a living hymn of judgment, and the Inquisition watches such growth with equal hope and fear.',
    'sun',
    5,
    null,
    '{"Derrick Berg"}',
    '{4}',
    '{"sun-pathway","unshadowed","saint-threshold","purification","light"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'death-seq4-undying',
    'Death Pathway — Sequence 4: Undying',
    'pathway',
    'The Undying is the Saint threshold of the Death pathway, the rung where the practitioner stops fearing death by becoming death''s refusal. An Undying possesses Resurrection: unless the body and spirit are completely annihilated, they can gradually revive from lethal injuries, their existence anchored to the River of Eternal Darkness. Their flesh and spirit adopt the Deathless Body, no longer aging, no longer needing food or sleep in any ordinary sense, and highly resistant to diseases, poisons, and mind-affecting powers that target the living. Death Authority deepens their command over undead and spirits, allowing them to bind and command a legion of the dead rather than mere handfuls. The Undying can also mark a target with the Seal of Mortality, hastening decay and making resurrection magic unreliable for the victim. The potion requires two main ingredients — a drop of water from the River of Eternal Darkness and the heart of an Undying King — and three supplementary ingredients: Graveyard Soil from a thousand-year tomb, a wraith''s final breath, and the skull of a Gatekeeper who willingly surrendered their post. The advancement ritual demands dying and returning to life under one''s own power, crossing the threshold of the Underworld and walking back without outside aid. The acting method requires the Undying to treat death as a river to be crossed rather than an enemy to be fought, to shepherd the dead with patience, and to remember that immortality is a responsibility rather than a prize. At Sequence 4 the Death pathway practitioner becomes a fixed point in the cycle of life and death, and the great powers of the Southern Continent take careful note.',
    'death',
    5,
    null,
    '{"Azik Eggers"}',
    '{4}',
    '{"death-pathway","undying","saint-threshold","resurrection","death-authority"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'darkness-seq4-nightwatcher',
    'Darkness Pathway — Sequence 4: Nightwatcher',
    'pathway',
    'The Nightwatcher is the Saint threshold of the Darkness pathway, the point at which the practitioner becomes a moving institution of the night. A Nightwatcher can raise a Domain of Nightmares over a district, causing sleepers to share a single controlled dreamscape and turning the sleeping population into an unwitting surveillance network. They gain the Night Patrol, the ability to step between any two places touched by darkness as if they were adjacent, making them nearly impossible to corner. Concealment of Fate allows them to hide a person, object, or even a small event from divination and casual perception for a sustained period. Their Lullaby of the Long Night can force entire groups into slumber or, for the resistant, drain their will to fight. The potion requires two main ingredients — the eye of a Nightwatcher Beast and a shadow taken from the deepest hour of midwinter — and three supplementary ingredients: Dream-Eating Crow feathers, oil of the Midnight Beauty Flower, and a silver coin that has crossed the palm of an executed murderer. The advancement ritual requires standing watch over a city from sunset to sunrise without being seen, while preventing a designated supernatural intrusion from reaching its target. The acting method demands that the Nightwatcher embrace silence and concealment as virtues, guard the sleeping world without seeking recognition, and resist the temptation to become the nightmare they patrol against. At Sequence 4 the Darkness pathway practitioner becomes a sentinel of the hidden hours, and the Church of the Evernight Goddess measures such Saints against the safety of the night itself.',
    'darkness',
    5,
    null,
    null,
    '{4}',
    '{"darkness-pathway","nightwatcher","saint-threshold","nightmares","concealment"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'tyrant-seq4-cataclysmic-interrer',
    'Tyrant Pathway — Sequence 4: Cataclysmic Interrer',
    'pathway',
    'The Cataclysmic Interrer is the Saint threshold of the Tyrant pathway, where weather-mastery escalates into geological and oceanic catastrophe. A Cataclysmic Interrer can call Earthquake, splitting streets and collapsing structures across a wide area, and raise Tsunami or rogue tidal waves when near the sea. Their Storm Domain can pin an entire battlefield under hurricane winds, driving rain, and relentless lightning for an extended period. They also gain Tyrant''s Wrath, an aura that magnifies the obedience of allies and the terror of enemies within the storm''s reach. The potion requires two main ingredients — the heart of a Sea-Tyrant and a lodestone struck by divine lightning — and three supplementary ingredients: fulgurite sand from a coastal strike, the blood of a Folk of Rage who died in battle, and a fragment of coral petrified by volcanic fury. The advancement ritual demands triggering a true natural disaster and then binding it back to dormancy before it reaches an inhabited area, proving mastery over the same forces one has unleashed. The acting method requires the Cataclysmic Interrer to meet every challenge with the storm''s temper, to claim sovereignty over sea, sky, and shaking earth, and to remember that a tyrant who cannot control their own rage is merely a disaster with a name. At Sequence 4 the Tyrant pathway practitioner becomes a walking cataclysm, and the Church of the Lord of Storms either claims or destroys such a Saint.',
    'tyrant',
    5,
    null,
    null,
    '{4}',
    '{"tyrant-pathway","cataclysmic-interrer","saint-threshold","earthquake","storm-domain"}',
    285
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'door-seq4-secrets-sorcerer',
    'Door Pathway — Sequence 4: Secrets Sorcerer',
    'pathway',
    'The Secrets Sorcerer is the Saint threshold of the Door pathway, where the freedom of the Traveler hardens into the architecture of hidden space. A Secrets Sorcerer can raise Concealed Spaces — rooms, vaults, or even small buildings removed from ordinary perception and divination, accessible only through the Sorcerer''s chosen doors. They gain Dimensional Lock, the ability to seal a region against teleportation, Blink, and other spatial movement for the duration of a confrontation. Secret Replication allows them to reproduce a witnessed Beyonder power without first Recording it, provided they understand its underlying principle, though the copy is weaker and temporary. The Sorcerer can also weave Door Traps, turning any threshold into a spatial snare that sends trespassers to a prepared pocket space. The potion requires two main ingredients — the eye of a Planeswalker and a key forged from a fallen star — and three supplementary ingredients: the cast-off skin of a Wandering Hide, quicksilver touched by spirit-world moonlight, and a map drawn in blood by a Traveler who never reached their destination. The advancement ritual requires concealing a significant location so completely that even a Sequence 5 diviner fails to find it, then revealing it only after a full week has passed. The acting method demands that the Secrets Sorcerer treat every door as a secret to be kept, wander through spaces others cannot see, and never leave a threshold unguarded. At Sequence 4 the Door pathway practitioner becomes a keeper of forbidden geometries, and the Abraham family counts such Saints among its most guarded treasures.',
    'door',
    5,
    null,
    '{"Bethel Abraham"}',
    '{4}',
    '{"door-pathway","secrets-sorcerer","saint-threshold","concealed-space","spatial-lock"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'hanged-man-seq4-black-knight',
    'Hanged Man Pathway — Sequence 4: Black Knight',
    'pathway',
    'The Black Knight is the Saint threshold of the Hanged Man pathway, where flesh, shadow, and sacrificial obligation fuse into heavy armor of corruption. A Black Knight can manifest the Armor of Degeneration, a second skin of blackened flesh and writhing shadow that absorbs tremendous damage and lashes back with corrupting tendrils. They wield the Blade of Sacrifice, a weapon that grows deadlier the more the wielder bleeds for it — every wound taken becomes power to deliver. Their Curse of Sin brands a target with one of the Seven Deadly Sins, amplifying that vice until the victim''s judgment collapses. Black Knights also gain the Rite of Burden, allowing them to voluntarily accept a curse or injury intended for another, turning the pathway''s theme of sacrifice into a combat technique. The potion requires two main ingredients — the heart of a Degenerate Shepherd and the blood of a fallen paladin who died willingly — and three supplementary ingredients: shadow-stained steel from a cursed blade, seven crimson petals from a Blood-Rose, and a noose cut from the rope of an executed traitor. The advancement ritual demands defeating a stronger foe while bearing a self-inflicted wound that would kill an ordinary Beyonder, surviving through sacrifice rather than avoidance. The acting method requires the Black Knight to accept burdens gladly, to let degeneration strengthen rather than consume them, and to never sacrifice another for convenience. At Sequence 4 the Hanged Man pathway practitioner becomes a walking rite of sin and martyrdom, and the Rose School of Thought both reveres and fears such a Saint.',
    'hanged-man',
    5,
    null,
    null,
    '{4}',
    '{"hanged-man-pathway","black-knight","saint-threshold","degeneration","sacrifice"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'white-tower-seq4-prophet',
    'White Tower Pathway — Sequence 4: Prophet',
    'pathway',
    'The Prophet is the Saint threshold of the White Tower pathway, where accumulated knowledge crystallizes into foresight. A Prophet can read the Threads of Possibility, discerning the most likely futures of a person, place, or decision and speaking them as prophetic declarations that carry supernatural weight. Prophetic Edict allows the Prophet to make a formal prediction that subtly shapes events toward its fulfillment, provided the words are ambiguous enough to allow reality to bend. They also gain Omniscient Gaze, a focused perception that pierces concealment and illusion within their line of sight, and Mnemonic Library, near-perfect recall of everything they have ever read or witnessed. The potion requires two main ingredients — the third eye of a Clairvoyant and a feather from a Wisdom Angel — and three supplementary ingredients: ink made from prophetic dream water, a page torn from a forbidden grimoire, and the crystallized question of a dying scholar. The advancement ritual demands answering a question that no living person knows the answer to, using only inference from gathered knowledge, and having the answer verified by an unbiased witness. The acting method requires the Prophet to speak predictions only when the cost of silence exceeds the cost of speech, to hoard knowledge without becoming its prisoner, and to accept that foresight is not control. At Sequence 4 the White Tower pathway practitioner becomes a living oracle, and the Church of the God of Knowledge and Wisdom quietly marks them for recruitment or restraint.',
    'white tower',
    5,
    null,
    null,
    '{4}',
    '{"white-tower-pathway","prophet","saint-threshold","foresight","oracle"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'twilight-giant-seq4-demon-hunter',
    'Twilight Giant Pathway — Sequence 4: Demon Hunter',
    'pathway',
    'The Demon Hunter is the Saint threshold of the Twilight Giant pathway, where giant-blooded might is refined into sacred slaughter. A Demon Hunter can ignite the Twilight Aura, a dim halo of dying light that weakens undead, demons, and creatures of corruption within its reach while strengthening the hunter''s own blows. They wield Giant''s Reach, extending their attacks farther than physical arms should allow through compressed force, and gain the Hunter''s Mark, a curse that binds them to a supernatural prey across great distances until one of them falls. Their flesh adopts the Adamant Hide, turning aside blades and bullets that would kill lesser warriors. The potion requires two main ingredients — the heart of a slain Demon and the blood of a giant''s descendant — and three supplementary ingredients: silver from a melted holy symbol, ash of a Guardian who died shielding another, and a tooth taken from a creature of the night. The advancement ritual requires hunting and destroying a Sequence 5 or higher corrupt entity alone, using no aid beyond what the hunter can personally carry. The acting method demands that the Demon Hunter accept only prey worthy of their strength, show mercy to the weak, and never let the thrill of the hunt outshine the duty behind it. At Sequence 4 the Twilight Giant pathway practitioner becomes a sentinel against the dark, and the Church of the God of Combat watches them as both champion and potential threat.',
    'twilight giant',
    5,
    null,
    null,
    '{4}',
    '{"twilight-giant-pathway","demon-hunter","saint-threshold","twilight-aura","hunt"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'justiciar-seq4-imperative-mage',
    'Justiciar Pathway — Sequence 4: Imperative Mage',
    'pathway',
    'The Imperative Mage is the Saint threshold of the Justiciar pathway, where law ceases to be spoken and begins to be enforced. An Imperative Mage can issue Absolute Commands that reality itself strains to obey — ordering doors to lock, flames to die, or enemies to kneel, provided the command falls within a formalized rule the mage has declared. They can establish a Court of Order, a bounded space in which their authority magnifies and violations of their declared laws trigger immediate supernatural backlash. The mage also gains Verdict Sight, perceiving lies, broken oaths, and active crimes within their domain as visible stains. The potion requires two main ingredients — the gavel-bone of a Chaos Hunter and a scale from the Hand of Order — and three supplementary ingredients: wax from a sealed contract, the tongue of a perjurer who died unrepentant, and iron filings from a guillotine blade. The advancement ritual requires presiding over a genuine trial between two Beyonders, rendering a binding verdict, and enforcing it without outside interference. The acting method demands that the Imperative Mage speak only commands they are willing to enforce, uphold their own laws before judging others, and never legislate cruelty into righteousness. At Sequence 4 the Justiciar pathway practitioner becomes a walking court, and those who serve order from the shadows decide whether to recruit or remove them.',
    'justiciar',
    5,
    null,
    null,
    '{4}',
    '{"justiciar-pathway","imperative-mage","saint-threshold","law","authority"}',
    285
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'black-emperor-seq4-earl-of-the-fallen',
    'Black Emperor Pathway — Sequence 4: Earl of the Fallen',
    'pathway',
    'The Earl of the Fallen is the Saint threshold of the Black Emperor pathway, where corruption wears a crown. An Earl of the Fallen can issue Edicts of Disorder, pronouncements that twist the natural order within a region — making fire chill, gravity falter, or oaths unravel — as long as the edict is proclaimed with sufficient pomp. They possess the Mantle of the Fallen, a shadowy nobility that compels lesser beings to obey as though the Earl were rightful sovereign even in lands that reject them. Their touch carries the Bribe of Flesh, offering targets a whispered temptation that, if accepted, binds the victim to the Earl''s will. The potion requires two main ingredients — a diadem worn by a ruined king and the heart of a Prince of Abolition — and three supplementary ingredients: gold from a bribe that caused a war, blood wine from a betrayed feast, and a writ signed by a dead emperor. The advancement ritual demands corrupting a legitimate institution from within, causing it to fall while keeping one''s own hands formally clean, then claiming its resources openly. The acting method requires the Earl to treat order as a costume, to reward loyalty and punish honesty with equal grace, and to remember that every throne they topple leaves a seat for someone worse. At Sequence 4 the Black Emperor pathway practitioner becomes a rogue noble of entropy, and the surviving descendants of the Solomon Empire mark them as kin or threat.',
    'black emperor',
    5,
    null,
    null,
    '{4}',
    '{"black-emperor-pathway","earl-of-the-fallen","saint-threshold","corruption","disorder"}',
    290
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'red-priest-seq4-iron-blooded-knight',
    'Red Priest Pathway — Sequence 4: Iron-blooded Knight',
    'pathway',
    'The Iron-blooded Knight is the Saint threshold of the Red Priest pathway, where the warrior''s gender is locked female from this rung upward and the fire of war becomes an inferno. An Iron-blooded Knight can ignite Bloody Battlefield, an aura that drives allies into a disciplined frenzy and fills enemies with supernatural dread, tilting the tide of any melee. They wield Iron-Blood Flame, a fire that burns hotter in the presence of spilled blood and cannot be extinguished by ordinary water. Their body gains the Knight''s Constitution, allowing them to fight through wounds that would incapacitate most Beyonders and recover rapidly between battles. They also gain the Conqueror''s Mark, branding a defeated foe so the Knight can always find them and weaken their will to resist commands. The potion requires two main ingredients — the heart of an Iron-Blooded Lion and a banner soaked in the blood of a hundred battles — and three supplementary ingredients: coals from a battlefield pyre, a scale from a Fire Dragon, and the weapon of a Reaper who died standing. The advancement ritual demands leading a force to victory in a battle where the knight is outnumbered at least ten to one and surviving the bloodshed personally. The acting method requires the Iron-blooded Knight to embrace war as craft, protect comrades with the same fervor directed at enemies, and accept that from Sequence 4 onward the pathway reshapes the body into its image. At Sequence 4 the Red Priest pathway practitioner becomes an engine of slaughter, and the Church of the God of War keeps close watch on who might rise further.',
    'red priest',
    5,
    null,
    null,
    '{4}',
    '{"red-priest-pathway","iron-blooded-knight","saint-threshold","war","flame"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'demoness-seq4-despair',
    'Demoness Pathway — Sequence 4: Despair',
    'pathway',
    'The Despair is the Saint threshold of the Demoness pathway, the rung where the pathway''s gender lock fixes the practitioner as female and suffering becomes both weapon and art. A Despair can radiate the Aura of Despair, a cold, clinging hopelessness that slows enemies, weakens their will to fight, and can drive ordinary mortals to surrender or self-harm. They weave the Threads of Misfortune, cursing a target so that small accidents compound into lethal disaster over hours or days. Their touch carries the Kiss of Frost, freezing blood and desire alike, and they gain the Mask of Beauty, a supernatural allure that conceals their true nature and makes commands feel like invitations. The potion requires two main ingredients — the frozen heart of a Catastrophe and a tear shed by someone who died of grief — and three supplementary ingredients: black ice from a mountain cursed by witches, a lock of hair from a woman who died betrayed, and the ashes of an Affliction''s last victim. The advancement ritual demands spreading despair so thoroughly through a community that hope itself becomes suspect, then ending the working before the practitioner loses the ability to feel anything else. The acting method requires the Despair to feed on the pain of others without drowning in it, to remain beautiful while being monstrous, and to remember that the Primordial Demoness reached Sequence 0 through exactly this door. At Sequence 4 the Demoness pathway practitioner becomes a Duchess of sorrow, and the Demoness Sect claims or kills any Saint who will not kneel.',
    'demoness',
    5,
    null,
    '{"Judith"}',
    '{4}',
    '{"demoness-pathway","despair","saint-threshold","misfortune","gender-lock"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'mother-seq4-classical-alchemist',
    'Mother Pathway — Sequence 4: Classical Alchemist',
    'pathway',
    'The Classical Alchemist is the Saint threshold of the Mother pathway, where cultivation and healing merge into the transformation of life itself. A Classical Alchemist can perform the Great Work of Life, brewing elixirs that regenerate lost limbs, reverse aging, and purge even deep corruption — though never without a corresponding price in rare materials. They command Flesh and Root Weaving, grafting plant, animal, and human tissues into stable hybrid organisms that obey simple commands. Their Harvest Domain accelerates growth in a region, causing crops to mature in hours and wounds to close faster within its bounds. The alchemist''s own body adopts the Verdant Physiology, healing from injury at a visible rate and gaining resilience to poison and disease. The potion requires two main ingredients — the core of a Desolate Matriarch and a seed that has germinated in a human grave — and three supplementary ingredients: sap from the World Tree''s kin, blood of a Druid who sacrificed themselves for the land, and ash of a thousand healing herbs. The advancement ritual demands creating an elixir that saves a life otherwise beyond salvation, using only ingredients gathered by the alchemist''s own hand. The acting method requires the Classical Alchemist to value life as both medium and masterpiece, to heal without demanding worship, and to resist the seductive thought that every person is merely material. At Sequence 4 the Mother pathway practitioner becomes a gardener of souls, and the Church of the Earth Mother greets such Saints as family.',
    'mother',
    5,
    null,
    null,
    '{4}',
    '{"mother-pathway","classical-alchemist","saint-threshold","alchemy","life"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'moon-seq4-shaman-king',
    'Moon Pathway — Sequence 4: Shaman King',
    'pathway',
    'The Shaman King is the Saint threshold of the Moon pathway, where the scarlet moon''s blood magic matures into command over beasts, spirits, and life force. A Shaman King can perform the Blood Rite, sacrificing vitality to heal others, curse enemies, or empower allies through mystical ties. They gain Beast Sovereignty, calling and commanding a host of animals and low spirits to fight, scout, or serve as the moonlight allows. Their Lunar Veil wraps them in shimmering red light that speeds regeneration and turns aside minor attacks. The Shaman King also practices Life Drain, pulling vitality from the land or a victim to sustain themselves — a power that blurs the line between healer and predator. The potion requires two main ingredients — the heart of a High Summoner and a chalice of Sanguine blood from an Earl''s lineage — and three supplementary ingredients: a beast fang bathed in scarlet moonlight, a root from a grave that bloomed at night, and the shed skin of a Life-Giver. The advancement ritual demands binding a spirit-beast of at least Sequence 5 to service through a blood contract sworn under the full scarlet moon. The acting method requires the Shaman King to honor the balance between giving life and taking it, to treat the Sanguine traditions with respect even when rejecting them, and to remember that the Moon pathway''s healing is never truly free. At Sequence 4 the Moon pathway practitioner becomes a sovereign of blood and beast, and the Sanguine Ancestor''s descendants take careful notice.',
    'moon',
    5,
    null,
    null,
    '{4}',
    '{"moon-pathway","shaman-king","saint-threshold","blood-magic","beasts"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'hermit-seq4-mysticologist',
    'Hermit Pathway — Sequence 4: Mysticologist',
    'pathway',
    'The Mysticologist is the Saint threshold of the Hermit pathway, where occult scholarship becomes a direct conduit for hidden knowledge. A Mysticologist can perform Mystery Prying at scale, tearing secrets from the fabric of reality — learning a target''s true name, hidden vulnerabilities, or forgotten history by asking the right questions of the world itself. They gain Constellation Invocation, calling down stellar influence to empower rituals, curses, or divinations according to the positions of the stars. Their Grimoire of Secrets is a living record that absorbs rare mystical formulae and can automatically suggest countermeasures to witnessed Beyonder powers. The Mysticologist also begins to hear the Hidden Sage''s whispers, a dangerous source of insight that offers true knowledge in exchange for ever-deeper devotion. The potion requires two main ingredients — the brain of a Sage and a page written in the Hidden Sage''s own cipher — and three supplementary ingredients: star-metal from a fallen meteor, ash of a Scrolls Professor''s most treasured book, and a question answered correctly by a dying Oracle. The advancement ritual demands uncovering a secret guarded by an Angel-tier power and surviving the consequences of knowing it. The acting method requires the Mysticologist to prize truth over comfort, to never use knowledge without understanding its price, and to resist the seduction of treating the Hidden Sage as a benevolent teacher. At Sequence 4 the Hermit pathway practitioner becomes a keeper of dangerous questions, and the Moses Ascetic Order regards them as either prophet or heretic.',
    'hermit',
    5,
    null,
    null,
    '{4}',
    '{"hermit-pathway","mysticologist","saint-threshold","hidden-sage","secrets"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'paragon-seq4-alchemist',
    'Paragon Pathway — Sequence 4: Alchemist',
    'pathway',
    'The Alchemist is the Saint threshold of the Paragon pathway, where craft, scholarship, and machinery converge into the perfection of matter and device. An Alchemist can transmute base metals into precious materials, refine imperfect Beyonder ingredients to reduce their corruption, and forge Enchanted Constructs — clockwork or mechanical servants animated by spiritual science. They gain the Engineer''s Intuition, instantly understanding the function and weakness of any machine or artifact they study, and can perform the Grand Synthesis, combining two lesser substances into a single more potent whole. Their own body may incorporate limited mechanical augmentations that enhance durability and precision. The potion requires two main ingredients — the crystallized core of an Arcane Scholar and a flawless gear forged without magic — and three supplementary ingredients: mercury distilled from a dozen broken clocks, the lens of an Astronomer who mapped an unknown star, and oil pressed from the fruit of the Tree of Knowledge. The advancement ritual demands creating an original artifact or elixir that functions without relying on the practitioner''s own spiritual power, then proving it in practical use. The acting method requires the Alchemist to pursue perfection without demanding that the imperfect world keep pace, to share discoveries cautiously, and to remember that the God of Steam and Machinery''s path is craft raised to divinity. At Sequence 4 the Paragon pathway practitioner becomes an architect of miracles in brass and glass, and the Church of the God of Steam and Machinery courts them with both patronage and surveillance.',
    'paragon',
    5,
    null,
    null,
    '{4}',
    '{"paragon-pathway","alchemist","saint-threshold","craft","machinery"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'wheel-of-fortune-seq4-misfortune-mage',
    'Wheel of Fortune Pathway — Sequence 4: Misfortune Mage',
    'pathway',
    'The Misfortune Mage is the Saint threshold of the Wheel of Fortune pathway, where luck becomes a scalpel that cuts both ways. A Misfortune Mage can weave the Pall of Misfortune over a target or area, causing accidents, failures, and unlikely disasters to cluster around those caught within it. They can redirect Fortune, stealing luck from enemies to bolster allies — or themselves — for a critical moment. Their Fate Loop traps a small event in a repeating cycle, forcing a target to relive a single mishap until the mage releases the working or the victim breaks free. The mage also gains the Ouroboros Sense, feeling the turning of fate strongly enough to know when a moment is propitious or disastrous. The potion requires two main ingredients — a scale from the Snake of Mercury and the blood of a Chaoswalker — and three supplementary ingredients: a coin that has ruined its owner, a mirror cracked by a Winner''s celebration, and ash from a prophecy that came true against the prophet''s will. The advancement ritual demands surviving a day in which every action the mage takes is deliberately unlucky, yet still achieving a chosen goal without directly forcing the outcome. The acting method requires the Misfortune Mage to accept that they are a gear in fate''s wheel, never to curse out of petty spite, and to remember that every fortune given is borrowed from somewhere. At Sequence 4 the Wheel of Fortune pathway practitioner becomes a weaver of probability, and the Life School of Thought notes their rise with interest.',
    'wheel of fortune',
    5,
    null,
    '{"Will Auceptin"}',
    '{4}',
    '{"wheel-of-fortune-pathway","misfortune-mage","saint-threshold","luck","fate"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'abyss-seq4-demon',
    'Abyss Pathway — Sequence 4: Demon',
    'pathway',
    'The Demon is the Saint threshold of the Abyss pathway, where human restraint frays into fiendish appetite and power. A Demon can manifest the Demonic Form, a partial transformation that grants horns, wings, or claws of shadowed flame and greatly enhances strength, speed, and resilience. They wield the Whip of Desire, a lash that stirs corruption in those it strikes — amplifying greed, rage, or lust until the victim acts on impulse. Their Aura of Depravity erodes the morality of weaker beings within a wide radius, making sins feel reasonable and virtue feel hollow. Demons also gain Hellfire, a flame that feeds on spiritual corruption and burns all the hotter in the presence of the guilty. The potion requires two main ingredients — the heart of a Bloody Archduke and a seed of the Mother Tree of Desire — and three supplementary ingredients: blood from a Desire Apostle who died unsated, a nail from a sinner''s coffin, and ash from a temple burned by its own worshippers. The advancement ritual demands committing an act of profound depravity and then resisting the temptation to repeat it for a full lunar cycle, proving control over the demon within. The acting method requires the Demon to feed their desires without being consumed, to offer temptation as an art, and to remember that every Abyss Saint is one misstep from becoming the Mother Tree of Desire''s fruit. At Sequence 4 the Abyss pathway practitioner becomes a living sin made flesh, and the Church of the Mother Tree of Desire either elevates or devours them.',
    'abyss',
    5,
    null,
    null,
    '{4}',
    '{"abyss-pathway","demon","saint-threshold","desire","hellfire"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'chained-seq4-puppet',
    'Chained Pathway — Sequence 4: Puppet',
    'pathway',
    'The Puppet is the Saint threshold of the Chained pathway, where the practitioner''s body becomes a cursed vessel that can be worn, discarded, and reanimated by the will that binds it. A Puppet can survive the destruction of their original body by transferring their consciousness into a prepared replacement — a corpse, a doll, or even a willing victim — though each transfer deepens their monstrous nature. They command Puppet Strings, thin spiritual threads that control the bodies of others from a distance, and can weave the Curse of Binding, sealing a target''s movement, voice, or power until the curse is broken. Their flesh gains the Resilient Marionette quality, allowing them to ignore pain and continue fighting despite grievous wounds. The potion requires two main ingredients — the heart of an Ancient Bane and a Disciple of Silence''s severed tongue — and three supplementary ingredients: wax from a candle that burned during an exorcism, a nail pulled from a Wraith''s coffin, and blood from a Werewolf who accepted the moon''s curse willingly. The advancement ritual demands allowing one''s own body to be destroyed and walking away in a borrowed form, proving that the self is no longer chained to a single shape. The acting method requires the Puppet to treat the body as a tool rather than an identity, to bind only those who threaten freedom, and to remember that the Mother Goddess of Depravity waits at the end of every chain. At Sequence 4 the Chained pathway practitioner becomes a thing that wears people, and the Rose School of Thought watches such Saints with hungry caution.',
    'chained',
    5,
    null,
    null,
    '{4}',
    '{"chained-pathway","puppet","saint-threshold","body-transfer","binding"}',
    295
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    'error-seq4-parasite',
    'Error Pathway — Sequence 4: Parasite',
    'pathway',
    'The Parasite is the Saint threshold of the Error pathway and the first demigod rung. Where lower sequences steal objects, abilities, or thoughts, the Parasite steals life itself: a Beyonder at this rung can burrow into a host and live as a parasite, siphoning vitality, identity, and fate from within. The body begins to take on the pathway''s true mythical form — the Worms of Time — and the theft of time, anchors, and authorities ceases to be a distant myth and becomes the next horizon. This is the rung where an Error Beyonder steps into the orbit of the Amon Family, whose every member is in some sense a parasite, fragment, or child of Amon, the Angel of Time and Worm of Time who sits near the apex of the pathway. The family does not merely worship the higher sequences; they are an extension of Amon''s theft of identity and time. The advancement to Parasite demands a parasitic theft of life — to enter a host, consume enough selfhood to fuse the potion, and emerge a demigod without being cast out — and the acting method never stops: live inside another, take what is theirs, and make their story your own while the true Worm of Time watches from higher up the sequence ladder.',
    'error',
    5,
    null,
    '{"Amon"}',
    '{4}',
    '{"error-pathway","parasite","saint-threshold","amon","worm-of-time"}',
    270
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;

