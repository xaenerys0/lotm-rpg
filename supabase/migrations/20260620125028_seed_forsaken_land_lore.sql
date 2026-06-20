-- Seed lore for the Forsaken Land of the Gods (world build-out 3, issue #132):
-- the City of Silver / Giant King's Court locations + Third-Epoch history, the
-- Numinous Episcopate organization, and the City-of-Silver NPCs (12 entries).
-- Generated from the TS source (src/lib/lore/{forsaken-land,organizations,npcs}.ts)
-- by scripts/gen-forsaken-seed.ts — TS is canonical. Same lore_entries INSERT
-- format as the earlier lore seed migrations. narratorOnly is a TS-only prompt
-- flag (no column); it is intentionally not persisted, matching prior seeds.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'city-of-silver-overview',
  'The City of Silver — Overview',
  'location',
  'The City of Silver is the last living city of the Forsaken Land of the Gods, the desolate Eastern Continent that was torn from the world long ago and sealed away. Once the seat of the Kingdom of Silver, it now stands alone under a sky that never clears: a grey, ash-lit sprawl of old grey-white stone, narrow streets, and high lightning-rods, ringed by dead country no one crosses. Its people are the descendants of those abandoned here when the continent fell — proud, devout, and inward-looking, keeping the rites of a faith the rest of the world has forgotten. They do not expect rescue and no longer want it; the City endures by its own discipline, its Silver Knights, and the grim certainty that beyond its walls there is nothing but ruin and the sealing sea. To a newcomer it is beautiful and terrible at once, a place that has made its peace with the end of everything.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'geography', 'fifth-epoch'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'city-of-silver-perpetual-lightning',
  'The City of Silver — The Perpetual Lightning',
  'location',
  'The defining curse and clock of the City of Silver is its sky of perpetual lightning. By day the storm overhead is fierce and ceaseless — chains of white fire walking the clouds, thunder that never fully stops, the air sharp with the smell of scorched stone. By night the lightning slows, dimming to a restless flicker on the horizon, and only then do the people move freely through the upper streets. Life is built around this rhythm: tall iron rods and grounded copper lattices crown every quarter, the great houses sit low and shielded, and the day is for shelter and work indoors while the night is for travel, market, and watch. The lightning is more than weather — the devout call it the lingering wrath left when the god fell, and to be caught exposed under the noon storm is to invite a death the City treats as judgement.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'lightning', 'fifth-epoch'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'city-of-silver-society',
  'The City of Silver — The Abandoned Faithful',
  'location',
  'Silver society is a closed order shaped by centuries of isolation. At its head stand the keepers of the old faith and the Silver Knights — a martial order, part guard and part priesthood, who patrol the night streets, hold the walls against what the dead land sends, and enforce the City''s strict observances. Below them the houses and guilds keep the lightning-craft, the foundries, and the rationed fields under their shielded glass. Strangers are almost unknown, so an outsider is marked at once: watched, questioned, and judged against rites they do not know. Yet the City is not cruel for its own sake — it is a people determined to remain people in a place the world wrote off, holding to memory, lineage, and duty as the only walls that have never fallen. Ambition here is measured in standing within the order, and the surest path to belonging is to take up the night-watch yourself.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'silver-knights', 'society', 'fifth-epoch'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'giant-kings-court-overview',
  'Giant King''s Court — Overview',
  'location',
  'Giant King''s Court is the other great site of the Forsaken Land: the ruined seat of a Giant King from the elder ages, a hall built to a scale no human raised, its broken colonnades and titan-sized thrones half-swallowed by the dead grey country east of the City of Silver. By day it lies empty under the same walking lightning; by night the City''s expeditions and the devout come to it warily, for the Court is reckoned a holy and dangerous place — the point where the sealed continent presses closest against the wider world. Its real importance is not its stone but its shadow: in the Dream World, the Court is the single doorway through which the Forsaken Land can still be entered or left at all. Those who keep the City''s deepest secrets guard what that means, and most who walk the Court''s floor never learn it.',
  null,
  5,
  'giant',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'giant-kings-court', 'geography', 'fifth-epoch'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'giant-kings-court-dream-gate',
  'Giant King''s Court — The Dream-World Gate',
  'location',
  'The Forsaken Land has no ordinary road in or out: the Sea of Ruins seals it on every coast. The sole passage is the shadow of Giant King''s Court in the Dream World — a threshold reached not by ship but by crossing into dream and finding the Court''s reflection there, which opens onto the sealed continent and back again. The gate was shut for ages and reopened in the year 1351; since then a precious few have come and gone by it. To use it is to hold the rarest of capabilities, and those who possess it can move between the Forsaken Land and the wider world where no vessel could. The City''s keepers treat the dream-passage as their most guarded knowledge, for it is at once their last tie to the world and the one door through which the world might reach them.',
  null,
  5,
  'giant',
  '{}',
  '{4}',
  ARRAY['forsaken-land', 'giant-kings-court', 'dream-world', 'secret', 'fifth-epoch'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'forsaken-land-sea-of-ruins',
  'The Sea of Ruins',
  'location',
  'The Sea of Ruins is the drowned, debris-choked ocean that walls the Forsaken Land away from the rest of the world. It is not a sea that can be sailed: its waters are wreck-strewn and wrong, swallowing any vessel that tries the crossing and turning back even the strongest Beyonders who attempt it by force. Together with the perpetual storm overhead, the Sea is why the Eastern Continent is "sealed" — why no fleet has ever reached the City of Silver and why its people gave up on rescue generations ago. The City''s scholars hold that the Sea was made by the same catastrophe that sundered the continent, a barrier as much metaphysical as physical. The only way past it is not across but through the Dream World, by the shadow of Giant King''s Court.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'sea-of-ruins', 'barrier', 'geography', 'fifth-epoch'],
  185
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'forsaken-land-eastern-grayfog',
  'The Forsaken Land — The Gray-Fog Eastern Edge',
  'location',
  'At the far eastern rim of the Forsaken Land the dead country ends in a wall of unmoving gray fog — the same dread, world-ending barrier that the elders of other lands speak of in their oldest fears. Beyond it, the City''s deepest lore holds, lies the sealed Western Continent, another place cut off from the world; the gray fog is the seam between two sealings. The fog does not drift and cannot be safely entered: those who walk in do not return, and the City forbids approach to its edge. For most of the abandoned faithful it is simply the eastern end of the world, a grey nothing to be left alone. For the few who understand what it borders, it is a reminder that the Forsaken Land is not the only continent the world has shut away.',
  null,
  5,
  'silver',
  '{}',
  '{4}',
  ARRAY['forsaken-land', 'gray-fog', 'western-continent', 'barrier', 'fifth-epoch'],
  185
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'forsaken-land-sundering',
  'The Sundering of the Eastern Continent',
  'event',
  'The Forsaken Land of the Gods was made at the end of the Third Epoch, when the Ancient Sun God — the human who had slain the Ancient Gods and reigned as the sole Orthodox God — was betrayed and brought down by his own lieutenants. In the cataclysm of his fall the Eastern Continent, heart of his dominion, was torn from the world: its sky set alight with a lightning that would never end, its seas turned to the impassable Sea of Ruins, its faithful abandoned where they stood. What had been the centre of a god''s empire became a sealed and sunless land, left to keep a penance for a god who would not return. The rest of the world moved on into the Fourth Epoch and then the Fifth; the Eastern Continent simply stopped, holding the shape of the moment it was forsaken.',
  null,
  3,
  null,
  '{}',
  '{}',
  ARRAY['forsaken-land', 'ancient-sun-god', 'third-epoch', 'history', 'sundering'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'numinous-episcopate-overview',
  'Numinous Episcopate — Overview',
  'organization',
  'The Numinous Episcopate is a secret society of the Death pathway that originated on the Southern Continent, grown from remnants of the old Church of Death and the legacy of the Eggers family, and has since spread its quiet influence into the Northern Continent where the orthodox churches hold sway. To the wider Beyonder world it is little more than a rumour: a scattered brotherhood preoccupied with death, mourning, and the boundary the living are not meant to cross, surfacing in tales of grave-robbings, hushed funerary rites, and members who treat the dead as unfinished business. Where it is known at all it is treated as a heresy to be watched rather than an open enemy, for it keeps to shadows and speaks of its true purposes to no one outside its inner ranks. Its members recognise one another by signs the churches have never fully catalogued.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['numinous-episcopate', 'death-pathway', 'secret-organization', 'southern-continent'],
  190
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'numinous-episcopate-true-goal',
  'Numinous Episcopate — The True Goal',
  'organization',
  'Behind its funerary face the Numinous Episcopate pursues a single forbidden end: the revival of the dead at a scale the world has not seen since the elder ages, and with it the usurpation of authority over death itself. Its inner doctrine holds that the present custodianship of death — embodied above all in the Church of the Evernight Goddess and her dominion over night, secrets, and the dead — is a throne wrongfully held, and that the Episcopate''s hidden masters mean to take it. To that purpose they gather Death-pathway Beyonders, sealed artifacts, and the bodies and Beyonder characteristics that a true resurrection would demand, working toward a rite the orthodox churches would burn the continent to stop. It is this goal — not its grave-side rituals — that makes the Episcopate one of the most dangerous heresies alive, and the reason it never shows the world its real face.',
  null,
  5,
  null,
  '{}',
  '{4}',
  ARRAY['numinous-episcopate', 'death-pathway', 'secret-organization', 'evernight-goddess', 'spoiler'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-derrick-berg',
  'Derrick Berg — The Sun of the Tarot Club',
  'npc',
  'Derrick Berg is a young man born and raised in the City of Silver, the last living city of the Forsaken Land of the Gods, and one of the rare souls to leave it by the Dream-World passage. A devout, earnest, and physically powerful Beyonder of the Sun pathway, he was a defender of the City before the wider world opened to him. He becomes a member of the Tarot Club under the code name "The Sun," where his sincerity and raw strength make him both a reliable ally and, at times, an unwitting source of comedy among subtler members. His defining ties are to his home: his family and the brotherhood of the City of Silver''s defenders, the faith of the abandoned that he carries with unshaken conviction, and — through the Tarot Club — a growing bond with The Fool (Klein Moretti) and the other members "above the gray fog." Derrick''s arc is one of a sheltered believer discovering how vast and dangerous the real world is, without ever losing the openhearted decency the City raised in him.',
  null,
  5,
  'silver',
  '{"Derrick Berg"}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'tarot-club', 'the-sun', 'sun-pathway'],
  220
);
-- Note: npc-derrick-berg is intentionally NOT pathway-keyed (pathway = null) —
-- a `pathway` value would make selectCuratedLore inject this City-of-Silver entry
-- into any mainland Sun character's prompt (issue #132 leak control). The prose
-- still names his Sun pathway; the row stays city-gated to 'silver'.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-giant-king-aurmir',
  'Giant King Aurmir — The Lord of the Ruined Court',
  'npc',
  'Giant King Aurmir is the legendary figure for whom Giant King''s Court — the titan-scaled ruin east of the City of Silver — is named, remembered in the City''s lore as a lord of the elder Giants from the ages before the continent fell. To the abandoned faithful he is half history and half myth: a being of the old inhuman powers whose seat outlived him, its broken thrones and colossal halls now the holiest and most feared site on the Forsaken Land. The City keeps his name and his rites because his Court is no mere ruin — its shadow in the Dream World is the single doorway in and out of the sealed continent — so the keepers who guard that secret guard his memory with it. Whether anything of Aurmir himself yet lingers about the Court is a question the City''s deepest order does not answer for outsiders.',
  null,
  5,
  'giant',
  '{"Giant King Aurmir"}',
  '{4}',
  ARRAY['forsaken-land', 'giant-kings-court', 'giant', 'legend'],
  195
);
