-- Seed the Orthodox Churches sweep lore (world build-out 10, issue #139):
-- the eight Churches as organization entry sets — a public overview (ungated
-- doctrine/structure/roster) + a gated inner-secret (the god's true nature /
-- internal politics, narratorOnly + sequence-gated, no city/pathway key) for
-- Evernight, Storms, Steam & Machinery, Knowledge & Wisdom, Earth Mother (plus
-- its Backlund Harvest Church branch), Combat, and the Fool; the Church of the
-- Eternal Blazing Sun's overview/members shipped in #135, so only its inner
-- secret is added here. Plus the notable named members as npc entries with
-- relationship data (city-keyed where canon, never pathway-keyed). 29 entries.
-- Generated from the TS source (src/lib/lore/{organizations,npcs}.ts — the
-- canonical data); same lore_entries INSERT format as the earlier seed
-- migrations. narratorOnly is a TS-only prompt flag (no column), intentionally
-- not persisted. Parity (TS <-> rows) verified via the Supabase MCP after apply.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'evernight-church-overview',
  'Church of the Evernight Goddess — Overview',
  'organization',
  'The Church of the Evernight Goddess is one of the eight orthodox Churches and, with the Churches of Steam and of Storms, one of the three great faiths of the Loen Kingdom. Its goddess — the Mother of Concealment, the Empress of Misfortune and Horror, the Mistress of Repose and Silence — has no idol; the faithful pray by tapping the chest four times in a clockwise circle and keep her two great festivals, Winter Gifts Day on the longest night of the year and the Moon Mass that remembers the dead. The Church preaches the equality of women and men, honours marriage, and forbids its clergy strong drink. From its holy seat, the Cathedral of Serenity in the Amantha mountains of Winter County, a Pope and a Council of thirteen archbishops and nine high-ranking deacons govern its dioceses across the kingdom; the current Pope is Dabomachie, and Arianna — Head of the Thirteen Archbishops and matron of the Evernight Cloister — is widely thought to be the next. Its Beyonder arm is the Nighthawks, and their elite the Red Gloves, who keep the supernatural peace under cover of security companies and the police.',
  null,
  5,
  null,
  ARRAY['Dabomachie', 'Arianna', 'Anthony Stevenson'],
  '{}',
  ARRAY['evernight-goddess', 'church', 'orthodox-church', 'loen-kingdom', 'religion', 'nighthawks'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'evernight-church-inner-secret',
  'Church of the Evernight Goddess — The Goddess''s True Nature',
  'organization',
  'Behind the orthodox legend that the Evernight Goddess was formed from the Original Creator''s spirit lies a stranger truth, known only at the heights of the Church. The Goddess''s true name is Amanises, and she was once a transmigrator from another world — said to be the first soul to come out of the Sefirah Castle — who awoke in the body of a demonic wolf and rose through the Second Epoch as the Goddess of Misfortune, a subsidiary of the Annihilation Demonic Wolf Flegrea, before climbing to Sequence 0 of the Darkness Pathway. The Church she rules holds the Darkness, Death, and Twilight Giant pathways in full and reaches incompletely into the Hermit and Fool besides. Its inner politics turn on the Council of twenty-two equals — thirteen archbishops and nine deacons who answer only to the Goddess and her Pope — and on her quiet patronage of certain mortals she names her Blessed, among them the man who becomes the Fool. In the ages to come her Church is fated to swallow the Churches of Combat and of Death and become the Church of the Eternal Darkness.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['evernight-goddess', 'amanises', 'true-nature', 'secret', 'spoiler'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'storms-church-overview',
  'Church of the Lord of Storms — Overview',
  'organization',
  'The Church of the Lord of Storms — the Tyrant''s Church — is one of the eight orthodox faiths and a great power upon the seas, worshipped by the Loen royal house, by sailors, and even by pirates of other nations. Its god is the King of the Skies, Emperor of the Seas, Lord of Calamity and God of Storms, a Sequence 0 of the Tyrant Pathway; the faithful strike the left breast with the right fist and salute one another, "May the Storm be with you." Its doctrine neither seeks war nor shuns it, but bids the believer answer an enemy with a storm''s cruelty; it keeps the old order of men and women, admits no women to its high ranks, and does not stint its clergy their drink. From the Chasm of Storms Cathedral on Pasu Island the Pontiff Gaard II, Head of the Council of Cardinals, directs the Church and its Beyonder arm, the Mandated Punishers — irritable, headlong fighters of the Tyrant Pathway. In the Rorsted Archipelago the Church long ruled the Beyonder world from the Cathedral of Waves in Bayam, the seat of the Sea King, Cardinal Jahn Kottman.',
  null,
  5,
  'bayam',
  ARRAY['Gaard II', 'Jahn Kottman'],
  '{}',
  ARRAY['lord-of-storms', 'church', 'orthodox-church', 'bayam', 'rorsted', 'religion', 'mandated-punishers'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'storms-church-inner-secret',
  'Church of the Lord of Storms — The God''s True Nature',
  'organization',
  'The orthodox tale makes the Lord of Storms a fragment of the Original Creator''s spirit; the truth, kept to the Church''s heights, is that his name is Leodero and that he was once the Wind Angel, one of the eight Kings of Angels who served the Ancient Sun God in the Third Epoch. He joined the conspiracy of Rose Redemption that killed his master, and from that death rose to Sequence 0 of the Tyrant Pathway — which the Church governs in full, reaching incompletely into the White Tower besides. There is no "Sailor" pathway: the sea is his theme, the Tyrant his power. His Council of Cardinals commands the Mandated Punishers directly, and his name, spoken in the right tongue, calls down lightning. In the world''s last days he is fated to die rather than yield, hurling himself as ball lightning against the Crimson Moon so that his power may pass on. For all the orthodox legend of shared kinship, the Church''s truest enemies are its supposed siblings — the Churches of the Blazing Sun and of Knowledge and Wisdom — the three preaching mutual hatred down the ages.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['lord-of-storms', 'leodero', 'true-nature', 'secret', 'spoiler'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'steam-church-overview',
  'Church of the God of Steam and Machinery — Overview',
  'organization',
  'The Church of the God of Steam and Machinery — once the Church of Craftsmanship, renamed when the transmigrator-emperor Roselle Gustav lit the Industrial Revolution and styled himself the Son of Steam — is the orthodox faith of the machine age. Its god is a Sequence 0 of the Paragon Pathway, the Embodiment of Essence and Guardian of Craftsmen; believers draw a triangle of steam and gears upon the chest and close their prayers, "By Steam!" Alone among the great Churches its scriptures bear no hatred for the other orthodox gods; it prizes invention to the point of fanaticism, the most devout mechanising as much as a quarter of their own bodies, and it laboured beside the Church of the Evernight Goddess to bring women into the workshops. From the Patriarchal Cathedral in Trier the Church governs the Intis Republic and reaches into Loen — strongest there in the foundry-city of Constant — and its Beyonder arm is the Machinery Hivemind, technicians who share one mind across a mystical network. Its luminaries include Saint Bornova Gustav, a Guardian Angel of Trier, and Archbishop Horamick Haydn, who is also an emeritus professor at Backlund University.',
  null,
  5,
  'trier',
  ARRAY['Bornova Gustav', 'Horamick Haydn', 'Ikanser Bernard'],
  '{}',
  ARRAY['god-of-steam', 'church', 'orthodox-church', 'trier', 'intis-republic', 'machinery-hivemind', 'religion'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'steam-church-inner-secret',
  'Church of the God of Steam and Machinery — The God''s True Nature',
  'organization',
  'The Church teaches that its god is a True God who guided humanity through the Cataclysm; few know that he was once a man. His true name is Yuggs Stiano, a human born in the Third Epoch who glimpsed the Second Blasphemy Slate, helped found the Moses Ascetic Order, then vanished and ascended to Sequence 0 during the War of the Four Emperors. Because he digested his final potion poorly before apotheosis, he must labour constantly to keep his sanity, and is reckoned the weakest of the seven orthodox gods. His Church holds the Paragon and Hermit pathways in full and reaches incompletely into the Twilight Giant. Its founder-emperor Roselle Gustav — the Son of Steam, secretly a Sequence 0 of the Black Emperor Pathway — was steered, some whisper at the Church''s heights, through his own son, the Saint Bornova. Of the orthodox faiths it is the least armed with Sealed Artifacts, its history being so recent; yet it is the one Church fated to keep its full influence even after the world''s last catastrophe.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['god-of-steam', 'yuggs-stiano', 'true-nature', 'secret', 'spoiler'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'knowledge-church-overview',
  'Church of the God of Knowledge and Wisdom — Overview',
  'organization',
  'The Church of the God of Knowledge and Wisdom is among the oldest of the eight orthodox faiths, raised after the Third-Epoch Cataclysm and avowedly neutral in the quarrels of nations. Its god is a Sequence 0 of the White Tower Pathway, hailed as omniscient and omnipotent — "Omniscience means Omnipotence!" — his emblem an all-seeing eye upon an open book, his sacred metal brass, which the faithful carry as a pocket ornament. The Church values intellect and talent above birth, prizing the clever and the learned. From the Holy Temple of Knowledge in Azshara, the capital of Lenburg, it governs the splinter-states of Lenburg, Masin, and Segar, having once shared the Feynapotter Kingdom with the Church of the Earth Mother until the Battle of the Violated Oath drove it out. It keeps no famous militant order of its own; its strength lies in its scholars and prophets — Archbishop Edwina Edwards, the pirate-admiral called Iceberg; Bishop Lucca Brewster, who carries its prophecies across the seas; and quiet agents such as the Backlund detective Isengard Stanton, who styles himself Mr. Eye of Wisdom.',
  null,
  5,
  null,
  ARRAY['Edwina Edwards', 'Lucca Brewster', 'Isengard Stanton', 'Brignais'],
  '{}',
  ARRAY['god-of-knowledge', 'church', 'orthodox-church', 'lenburg', 'religion'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'knowledge-church-inner-secret',
  'Church of the God of Knowledge and Wisdom — The God''s True Nature',
  'organization',
  'The orthodox legend calls the God of Knowledge and Wisdom a spirit of the Original Creator; the gated truth is that he is a dragon. His true name is Herabergen, the Dragon of Wisdom, once a subsidiary god of the Dragon of Imagination Ankewelt in the Second Epoch; after his master''s death he turned to the Ancient Sun God and became the Wisdom Angel, one of the eight Kings of Angels, before joining Rose Redemption and, with the Lord of Storms and the Blazing Sun, devouring the Ancient Sun God''s body to ascend. His true form is a brass dragon the size of a city, a folding tower of illusory books each set with a brass eye. Amon names him the Dragon of Betrayal. His Church holds the White Tower Pathway in full and reaches incompletely into the Red Priest. His holy bible foretells an apocalypse and a saviour to come; and in the end he chooses self-destruction, fusing himself into Adam to help fight the will of the Primordial God Almighty.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['god-of-knowledge', 'herabergen', 'true-nature', 'secret', 'spoiler'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'earth-mother-church-overview',
  'Church of the Earth Mother — Overview',
  'organization',
  'The Church of the Earth Mother — the Church of Earth — is the orthodox faith of life, harvest, and fertility, raised after the Third-Epoch Cataclysm and the state religion of the Feynapotter Kingdom. Its goddess is the Mother, the Mother of All Things, a Sequence 0 who teaches from the Bible of Life that every soul is a plant that grows, withers, and returns to her embrace. The Church honours reproduction as the holiest of matters — its cloisters welcome many children — preaches the equality of women and men, wears the brown habit, and readily takes in Sanguines as priests. A Matriarch leads it, advised by her Cardinals and the archbishops and bishops below; its Beyonder enforcers are the Fertility Order. Based in Feynapotter, it reaches into the Loen Kingdom through branch chapters such as the Harvest Church of Backlund, and has lately spread toward West Balam. Its leaders in this age include the Matriarch Roland and Archbishop Agrippina of the Gaia diocese.',
  null,
  5,
  null,
  ARRAY['Roland', 'Agrippina'],
  '{}',
  ARRAY['earth-mother', 'church', 'orthodox-church', 'feynapotter', 'religion'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'earth-mother-harvest-church-backlund',
  'Church of the Earth Mother — The Harvest Church of Backlund',
  'organization',
  'The Harvest Church on Rose Street is the Church of the Earth Mother''s house in Backlund, a chapter of the life-faith set down in a city of soot and class. It is best known for two men. Father Utravsky, its towering bishop, was once a ruthless pirate of the Sonia Sea before an Earth Mother missionary turned him to the faith; he swore upon her sacred emblem to spread her worship abroad, and now tends the poor of Backlund — believer and unbeliever alike — through disaster and smog. With him is the young Sanguine Emlyn White, who fell into the Harvest Church''s keeping and became the representative of Backlund''s Sanguines after they merged with the Church. Both are Beyonders who keep their true natures hidden behind the censer and the soup-line; both came to know the detective Sherlock Moriarty, and through him a wider, stranger world than Rose Street ever sees. It is here, too, that the Apothecary potion''s formula may be earned — by those who can master themselves.',
  null,
  5,
  'backlund',
  ARRAY['Utravsky', 'Emlyn White'],
  '{}',
  ARRAY['earth-mother', 'harvest-church', 'backlund', 'branch-chapter', 'religion'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'earth-mother-church-inner-secret',
  'Church of the Earth Mother — The Goddess''s True Nature',
  'organization',
  'The Earth Mother''s benevolent face hides one of the world''s great impostures. Her true name is Lilith, the Sanguine Ancestor — once an Ancient Goddess of the Moon Pathway who, betrayed and seemingly slain at the close of the Early Era of Fire, faked her death and, with the help of the Evernight Goddess and the Ancient Sun God, stole the very identity and fate of Omebella, the Giant Queen and Goddess of Harvest, to ascend as the Earth Mother at Sequence 0 of the Mother Pathway. Her Church governs the Mother and Moon pathways in full and reaches incompletely into the Justiciar and Twilight Giant — the Demoness was only her own former path, never the Church''s. Fearing the false revelations the Mother Goddess of Depravity whispers to Moon and Mother Beyonders, she split her Church into the Favored and the Blessed, who must countersign each other''s every order, beyond even the Holy See''s power to override. In the 1350 World War she feigned alliance with the God of Combat and drained his life — a god who never knew that his killer wore the face of his own mother.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['earth-mother', 'lilith', 'true-nature', 'secret', 'spoiler'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'combat-church-overview',
  'Church of the God of Combat — Overview',
  'organization',
  'The Church of the God of Combat is the orthodox faith of war and glory and the sole religion of the militarist Feysac Empire, where no other creed may preach. Its god is the Symbol of Power and Glory, the Great Knight God, Master of War and Patron of Guns — a Sequence 0 of the Twilight Giant Pathway. The Church is a brotherhood of men: it discourages women and gender equality more sternly than any other faith, and does not deny its clergy hard drink. From the Great Twilight Hall outside St. Millom — raised in the image of the Giant King''s Court — its Chief Shepherd and archbishops command dioceses across Feysac and out to the Gargas Archipelago, Sonia Island, and the Balam colonies. From its very founding it has borne a long enmity with the Church of the Evernight Goddess over the bordering pathways of eternal darkness. Its foremost servant in this age is the Chief Shepherd Larrion, a towering Twilight Giant of fanatical loyalty.',
  null,
  5,
  'feysac',
  ARRAY['Larrion'],
  '{}',
  ARRAY['god-of-combat', 'church', 'orthodox-church', 'feysac', 'religion'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'combat-church-inner-secret',
  'Church of the God of Combat — The God''s True Nature',
  'organization',
  'The God of Combat''s secret is written in blood and family. His true name is Badheil, the God of Dawn of the Second Epoch — eldest son of the Giant King Aurmir and the Goddess of Harvest Omebella, who inherited his father''s god-seat and climbed to Sequence 0 of the Twilight Giant Pathway. His Church holds the Twilight Giant in full and reaches incompletely into the Death and Darkness pathways — not, as outsiders guess, any "Warrior" or "Hunter" path. He joined Rose Redemption, helped bring about the Cataclysm that killed the Ancient Sun God, and in the Fourth Epoch raised the Einhorn family to found Feysac. His long feud with the Evernight Goddess over the eternal-darkness pathways ended in betrayal: in the Battle of Gods over Backlund he was killed by Lilith — wearing the face of his own mother Omebella — and by the Evernight Goddess, who took the Twilight Sword. His leaderless Church was quietly absorbed by the Church of the Evernight Goddess, his death never announced; his Chief Shepherd Larrion still awaits his return.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['god-of-combat', 'badheil', 'true-nature', 'secret', 'spoiler'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-church-overview',
  'Church of the Fool — Overview',
  'organization',
  'The Church of the Fool is the youngest of the great faiths, founded in 1352 of the Fifth Epoch by the people of the City of Silver and Moon City after they were led out of the Forsaken Land of the Gods. Its god is the Fool — the Mysterious Ruler above the Gray Fog, the King of Yellow and Black who wields good luck — who is said to reign over the Spirit World with eight angels at his side. From the Fool''s Cathedral in the New City of Silver, in the Rorsted Archipelago, the Church keeps its plain, light-filled halls, shelters tramps and unbelievers with meals and honest work, and prays, "Praise be to Mr. Fool," a palm pressed to the breast. Its Ten Commandments forbid living sacrifice and the worship of other gods before him. A Pope leads it — Derrick Berg of the Sun Pathway — with archbishops such as Waite Chirmont, the Moon-City high priest Nim, and Susie; and its true might is the Tarot Club, the circle of the Fool''s chosen, whose members rose to become angels in the world''s last age.',
  null,
  5,
  null,
  ARRAY['Derrick Berg', 'Waite Chirmont', 'Nim', 'Susie'],
  '{}',
  ARRAY['the-fool', 'church', 'fool-pathway', 'fool-church', 'rorsted', 'religion'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-church-inner-secret',
  'Church of the Fool — The God''s True Nature',
  'organization',
  'The Church of the Fool worships a god who walks among mortals unknown. The Fool is Klein Moretti — once Zhou Mingrui, a transmigrator from another world — who rose to Sequence 0 of the Fool Pathway and became the Lord of Mysteries, an Above-the-Sequence power and owner of the Sefirah Castle, with authority over the Fool, Error, and Door pathways. He founded and convenes the Tarot Club under the name The Fool, and is himself the Blessed of the Evernight Goddess. The Church that grew around him is an alliance of refuges — the New City of Silver and New Moon City, the Abraham Family with their Door pathway, the Temperance faithful of the Rose School, the Church of the Sea God under his subsidiary Kalvetua — each guarding fragments of the twenty-two pathways. Its eight named angels, from the Angel of Mercury to the Angel of Stars, are mortals he raised; and the man at the heart of the godhead is one the wider world still believes a mere fortune-teller, a Backlund detective, or a dead adventurer.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['the-fool', 'klein-moretti', 'lord-of-mysteries', 'true-nature', 'spoiler'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'blazing-sun-church-inner-secret',
  'Church of the Eternal Blazing Sun — The God''s True Nature',
  'organization',
  'The Church of the Eternal Blazing Sun proclaims its god the Inextinguishable Light and, in its proselytising, the Father of All Life — a title that is propaganda, not truth. The gated reality is that the god''s name is Aucuses, once the White Angel, one of the eight Kings of Angels who served the Ancient Sun God in the Third Epoch. He betrayed his master, joined Rose Redemption under the Dark Angel Sasrir, and with the Lord of Storms and the God of Knowledge and Wisdom consumed the Ancient Sun God''s body to rise to Sequence 0 of the Sun Pathway. In the end, fragments of the Primordial God Almighty''s mind began to wake within him, and rather than be lost he asked the Evernight Goddess to kill him. After his death the Church passed into the hands of Adam — the True Creator — and the once-heretical Aurora Order was folded into it as the shadow beneath the sun''s rays. The Church holds the Sun Pathway in full and reaches incompletely into the Twilight Giant; its sterner hand remains the Inquisition and its Purifiers.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['eternal-blazing-sun', 'aucuses', 'true-creator', 'true-nature', 'spoiler'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-arianna',
  'Arianna — Head of the Evernight Goddess''s Thirteen Archbishops',
  'npc',
  'Arianna is the matron of the Evernight Cloister and Head of the Thirteen Archbishops of the Church of the Evernight Goddess — by most reckonings, the next Pope. An ascetic who asks to be called "Ma''am" rather than "Your Eminence," she goes barefoot in a patched linen robe, her manner all calm and quiet certainty, and she keeps a conscience strong enough to balk at sacrificing innocents for the Church''s ends. She is a Servant of Concealment, a Sequence 2 demigod of the Darkness Pathway, and a Mythical Creature in truth, though she wears an ordinary woman''s face. Her most important tie is to Klein Moretti: she often relays and assists the Evernight Goddess''s oracles to him, becoming one of the Church''s surest hands in the strange events that gather around the Fool. Within the Council of twenty-two equals she stands first among the archbishops, answering only to the Goddess and the Pope.',
  null,
  5,
  null,
  ARRAY['Arianna', 'Klein Moretti'],
  ARRAY[2],
  ARRAY['evernight-goddess', 'archbishop', 'darkness-pathway', 'cloister'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-gaard-ii',
  'Gaard II — Pontiff of the Lord of Storms',
  'npc',
  'Gaard II is the Pontiff of the Church of the Lord of Storms and the spokesman of the storm-god himself, seated at the Chasm of Storms Cathedral on Pasu Island. Though he wears the face of a man in his forties, he has led the Council of Cardinals for nearly a century; crowned with a triple diadem of sapphire and emerald and robed in storm-dark blue shot with gold and silver, he carries himself like a gathering tempest. As Head of the Council of Cardinals he commands both the Church''s clergy and its Beyonder arm, the Mandated Punishers, who take their orders directly from the Council. He is a Calamity, a Sequence 2 demigod of the Tyrant Pathway and a Mythical Creature beneath the man''s shape. To the faithful of the seas he is the nearest thing to the Lord of Storms made flesh — the voice through which the King of the Skies and Emperor of the Seas speaks to his Church.',
  null,
  5,
  null,
  ARRAY['Gaard II'],
  ARRAY[2],
  ARRAY['lord-of-storms', 'pontiff', 'tyrant-pathway', 'mandated-punishers'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-jahn-kottman',
  'Jahn Kottman — The Sea King of Bayam',
  'npc',
  'Jahn Kottman is a Cardinal of the Church of the Lord of Storms and a high-ranking deacon of the Mandated Punishers, and was long the true ruler of the Beyonder world in the Rorsted Archipelago from the Cathedral of Waves in Bayam. Brawny and deep-eyed, his blue hair thick as a knot of tentacles, he is aggressive and impulsive in the way of his pathway — a Sea King, a Sequence 3 of the Tyrant Pathway who boasts that even a War Bishop must bow his head in his waters. He once contained the rampage of the dying Sea God Kalvetua and tried to claim his characteristics, only to be beaten to the corpse by the Fool. When the bounty hunter Gehrman Sparrow drew his eye in Bayam, Kottman reported him and saw a bounty placed on his head; he later crushed a sea-borne invasion of Bayam during the World War. His rivalries run from the Rose School of Thought to the man behind Gehrman Sparrow''s many masks.',
  null,
  5,
  'bayam',
  ARRAY['Jahn Kottman', 'Klein Moretti', 'Kalvetua'],
  ARRAY[3],
  ARRAY['lord-of-storms', 'cardinal', 'sea-king', 'tyrant-pathway', 'bayam', 'mandated-punishers'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-bornova-gustav',
  'Saint Bornova Gustav — Guardian Angel of Trier',
  'npc',
  'Saint Bornova is venerated as a Guardian Angel of Trier and is the youngest son of the transmigrator-emperor Roselle Gustav. More than a century old, he is a Knowledge Magister — a Sequence 2 Angel of the Paragon Pathway — in the service of the Church of the God of Steam and Machinery, whose Patriarchal Cathedral crowns the capital. His mother was Matilda Abel; his elder sister Bernadette Gustav still lives, his elder brother Ciel does not. The Twilight Hermit Order''s Zaratul mockingly called him the "Lovely Angel." It is whispered at the Church''s heights that the god of Steam used Bornova to keep a quiet hand on his own father, the Son of Steam — a burden the Saint carries behind his serene, radiant face. To the people of Trier he is simply one of the powers that keep the City of Fashion safe, an angel of brass and steam standing watch beside Saint Viève of the sun-faith.',
  null,
  5,
  'trier',
  ARRAY['Bornova Gustav', 'Roselle Gustav', 'Bernadette Gustav'],
  ARRAY[2],
  ARRAY['god-of-steam', 'saint', 'guardian-angel', 'paragon-pathway', 'trier'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-horamick-haydn',
  'Horamick Haydn — Archbishop of Steam and Machinery',
  'npc',
  'Horamick Haydn is an Archbishop of the Church of the God of Steam and Machinery and a member of its Divine Council, presiding now over the Trier diocese after years in Backlund. He leads a double life that the machine-faith finds no contradiction in: an emeritus professor of physics at Backlund University and a celebrated scientist, he is also a captain of the Machinery Hivemind and an Alchemist — a Sequence 4 demigod of the Paragon Pathway. In him the Church''s love of invention and its Beyonder power meet in one man, equally at home before a lecture hall and at the head of a Hivemind team hunting supernatural contamination through the foundries and workshops. Patient and exacting, he embodies the Church''s creed that the one who would be strong should be made strong — and that knowledge and machinery, rightly mastered, are themselves a kind of worship.',
  null,
  5,
  'backlund',
  ARRAY['Horamick Haydn'],
  ARRAY[4],
  ARRAY['god-of-steam', 'archbishop', 'machinery-hivemind', 'paragon-pathway', 'backlund'],
  205
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-isengard-stanton',
  'Isengard Stanton — Mr. Eye of Wisdom',
  'npc',
  'Isengard Stanton, who styles himself Mr. Eye of Wisdom, is a private detective of Backlund and a believer of the Church of the God of Knowledge and Wisdom. He took up the faith while studying four years in Lenburg, and keeps a careful cover as an Evernight worshipper at home in Loen; in truth he is a Detective in the Beyonder sense too — a Sequence 7 of the White Tower Pathway, whose reason and deduction the god he serves prizes above birth or wealth. His cases bring him into the orbit of another Backlund detective, Sherlock Moriarty, with whom he keeps a wary friendship of professional equals. Devout in his own quiet way, he has asked that when he dies his remains be sent to the Holy Temple of Knowledge in distant Azshara — a scholar''s last pilgrimage to the seat of the omniscient eye.',
  null,
  5,
  'backlund',
  ARRAY['Isengard Stanton', 'Klein Moretti'],
  ARRAY[7],
  ARRAY['god-of-knowledge', 'detective', 'white-tower-pathway', 'backlund'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-edwina-edwards',
  'Edwina Edwards — Archbishop and Pirate Admiral ''Iceberg''',
  'npc',
  'Edwina Edwards is an Archbishop of the Church of the God of Knowledge and Wisdom — and, to the navies of the world, the Pirate Admiral "Vice Admiral Iceberg," captain of the Golden Dream with a great bounty on her head. Born in Lenburg, descended from a follower of Roselle Gustav whose family fled and converted to the wisdom-faith, she is a Prophet, a Sequence 4 demigod of the White Tower Pathway. She commands a crew of subordinates across the seas and keeps an old friendship with Anderson Hood, the Fog Sea''s strongest hunter, from their schooldays at the Church''s college. In the great events of the age she becomes an ally of the adventurer Gehrman Sparrow, lending the omniscient eye''s foresight to causes that reach far beyond Lenburg''s borders. Few embody the Church''s prizing of talent over birth so plainly as a prophet who is also a pirate.',
  null,
  5,
  null,
  ARRAY['Edwina Edwards', 'Anderson Hood'],
  ARRAY[4],
  ARRAY['god-of-knowledge', 'archbishop', 'white-tower-pathway', 'pirate', 'lenburg'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-brignais',
  'Baron Brignais — The Wisdom-Faith''s Man in Trier',
  'npc',
  'Baron Brignais is a believer of the Church of the God of Knowledge and Wisdom who keeps his faith and his trade well apart: a nobleman by reputation, he is in fact the head of the Savoie Mob in the market district of Trier. A man of about thirty, married, he is a Student of Ratiocination — a Sequence 8 of the White Tower Pathway — using the god''s gift of reason to run his rackets with uncanny shrewdness. He stands godfather to a young man named Ludwig, a tie that binds him into the quieter networks of the capital. In a city of sun-faith and steam, Brignais is a reminder that the wisdom-faith keeps its own people even where it does not rule: clever, watchful, and useful, valued by his god for exactly the talents the law would condemn.',
  null,
  5,
  'trier',
  ARRAY['Brignais', 'Ludwig'],
  ARRAY[8],
  ARRAY['god-of-knowledge', 'white-tower-pathway', 'trier', 'mob'],
  185
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-emlyn-white',
  'Emlyn White — The Sanguine of the Harvest Church',
  'npc',
  'Emlyn White — once known as Bai Ailin — is a young Sanguine who fell into the keeping of the Harvest Church in Backlund and became a believer of the Earth Mother. A high-ranking deacon, or Hierophant, of the life-faith, he is a Beyonder of the Moon Pathway, rising from Shaman King to Life-Giver, and stands as the representative of Backlund''s Sanguines after they merged with the Church. He came to the faith through Father Utravsky, the towering ex-pirate bishop who confiscated his Master Key and gave him his own blood, and whom Emlyn first despised as a "dirty old man" before coming to respect him. In the Tarot Club, that strange gathering of the Fool''s chosen, he is known as The Moon. He also befriended the detective Sherlock Moriarty, and the Earth Mother herself is said to have entrusted him with a fragment of her own power before her long sleep.',
  null,
  5,
  'backlund',
  ARRAY['Emlyn White', 'Utravsky', 'Klein Moretti'],
  ARRAY[4, 2],
  ARRAY['earth-mother', 'harvest-church', 'sanguine', 'moon-pathway', 'tarot-club', 'backlund'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-utravsky',
  'Father Utravsky — Bishop of the Harvest Church',
  'npc',
  'Father Utravsky is the bishop of the Harvest Church on Rose Street, the Church of the Earth Mother''s house in Backlund. Born in the Feysac highlands and once a ruthless pirate of the Sonia Sea, he was turned to the life-faith by an Earth Mother missionary and swore upon her sacred emblem to spread her worship abroad before he would ask the Church for any help. A mountain of a man over two metres tall, gentle in the face for all his oppressive size, he is a Dawn Paladin — a Sequence 6 of the Twilight Giant Pathway — counted among the Earth Mother''s Blessed, with a grounding in herbalism. He took in the lost Sanguine Emlyn White and shelters Backlund''s poor through disaster and smog alike. It was to Utravsky that the detective Sherlock Moriarty came seeking the Apothecary potion''s formula — earned only by mastering the bishop''s own inner self.',
  null,
  5,
  'backlund',
  ARRAY['Utravsky', 'Emlyn White', 'Klein Moretti'],
  ARRAY[6],
  ARRAY['earth-mother', 'harvest-church', 'twilight-giant-pathway', 'backlund', 'bishop'],
  205
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-matriarch-roland',
  'Matriarch Roland — Leader of the Church of the Earth Mother',
  'npc',
  'Roland is the Matriarch of the Church of the Earth Mother — the leader of the whole life-faith — ruling from its seat in the Feynapotter Kingdom. She is a Desolate Matriarch, a Sequence 2 Angel of the Mother Pathway, the living head of a Church that prizes fertility and the return of every soul to the Mother''s embrace. Her tragedy is the Church''s gravest danger made flesh: in 1359 she was corrupted by the false revelations of the Mother Goddess of Depravity — the very deceit the Church''s split into Favored and Blessed was meant to guard against — and became that Outer Deity''s puppet. It is precisely because a Matriarch could fall this way that no order of the Church may issue without the countersignature of both its halves. Her fall is among the signs that the Earth Mother''s house, for all its talk of life, stands nearer the abyss than any of the orthodox faiths.',
  null,
  5,
  null,
  ARRAY['Roland'],
  ARRAY[2],
  ARRAY['earth-mother', 'matriarch', 'mother-pathway', 'feynapotter'],
  205
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-larrion',
  'Larrion — Chief Shepherd of the God of Combat',
  'npc',
  'Larrion is the Chief Shepherd of the Church of the God of Combat, the highest operational hand of the war-faith in the Feysac Empire. Over two and a half metres tall, light-blue-eyed, speaking in a rough country dialect, he is a Glory — a Sequence 2 demigod of the Twilight Giant Pathway — and fanatically loyal, willing to make of his own body a vessel for his god''s return. When the God of Combat was slain at the Battle of Gods over Backlund, Larrion burned the Church''s records of its Sealed Artifacts and fled with the Trunsoest Brass Book, trapping his pursuers in Belltaine City; confronted there by the Evernight Goddess''s Arianna and by Klein Moretti, he lost some of his characteristics but escaped through the Spirit World, his fate unknown. He believes, against all evidence, that his god will rise again in his own body — and waits.',
  null,
  5,
  'feysac',
  ARRAY['Larrion', 'Arianna', 'Klein Moretti'],
  ARRAY[2],
  ARRAY['god-of-combat', 'chief-shepherd', 'twilight-giant-pathway', 'feysac'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-valentine-de-lacourt',
  'Valentine de Lacourt — Purifier of the Blazing Sun',
  'npc',
  'Valentine de Lacourt is a Purifier of the Inquisition of the Church of the Eternal Blazing Sun, serving in Trier under the Deacon Angoulême de François. A Solar High Priest — a Sequence 7 of the Sun Pathway — he is one of the radiant order''s enforcers, hunting heresy, corruption, and the servants of the Outer Deities through the quartiers of the capital. He works alongside the other members of Angoulême''s small team — Imre, of the same sun-faith, and Antoine of the Twilight Giant Pathway — the censer and the badge moving together in a city that keeps both. In the Inquisition''s ranks he is the kind of steady middle hand on whom its grimmer work depends: devout, disciplined, and dangerous to the enemies of the light.',
  null,
  5,
  'trier',
  ARRAY['Valentine de Lacourt', 'Angoulême de François', 'Imre', 'Antoine'],
  ARRAY[7],
  ARRAY['eternal-blazing-sun', 'inquisition', 'purifier', 'sun-pathway', 'trier'],
  185
);
