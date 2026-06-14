-- Seed lore for the farther Fifth-Epoch start regions (varied story openings):
-- Pritz Harbor, Enmat Harbor, and the Feysac Empire (3 entries).
-- Generated from src/lib/lore/regions.ts (TS source is canonical).
-- Same lore_entries INSERT format as the earlier city-lore seed migration.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'pritz-harbor-overview',
  'Pritz Harbor — Overview',
  'location',
  'Pritz Harbor is the Loen Kingdom''s chief naval port, set on the cold northern coast below the Hornacis mountain range that walls Loen off from the Feysac Empire. It is a working navy town before it is anything else: dry-docks and shipyards, powder magazines and victualling yards, ironclads and gunboats riding at anchor in a grey, fog-bound roadstead, and streets full of sailors, marines, and the families that supply them. The Hornacis passes at its back are a smuggler''s country and a monster''s country both, so the garrison is heavy and the night watch real. For the Beyonder world the harbour matters as a chokepoint: contraband curios, sealed artifacts, and people who would rather not be noticed all move through a port this busy, and the Church of the Lord of Storms keeps a watchful presence over a town that lives and dies by the sea''s temper.',
  null,
  5,
  'pritz',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'port', 'navy', 'fifth-epoch'],
  180
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'enmat-harbor-overview',
  'Enmat Harbor — Overview',
  'location',
  'Enmat Harbor is a small coastal town of the Loen Kingdom — a huddle of fishing boats, net-lofts, and lamplit lanes that the sea-fog swallows most nights of the year. It is the kind of place where everyone knows everyone, strangers are counted, and the old sea-superstitions are kept up in earnest: charms nailed over doorways, names not spoken after dark, a wary respect for what the tide brings in. Industry has barely touched it; the rhythm of the town is the rhythm of the boats. That quiet is exactly why it draws the Beyonder world''s quieter business — a smuggler''s landing, a cult that wants no neighbours, a thing that came ashore and did not leave. The fog that hides the fishermen''s morning hides a great deal else, and the nearest real authority is a long, cold road away.',
  null,
  5,
  'enmat',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'coastal-town', 'fifth-epoch'],
  175
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'feysac-overview',
  'Feysac Empire — Overview',
  'location',
  'The Feysac Empire is the great northern power of the continent, a cold, mountainous, militarist state whose dominant faith is the Church of the God of Combat. Where Loen runs on ledgers and Intis on ideals, Feysac runs on discipline, martial honour, and devotion: its nobility are warriors, its commoners are hardy, and strength openly commands respect. The climate is harsh and the frontier is dangerous — long winters, walled towns, and wild lands beyond them where evil spirits, mutated beasts, and monsters press in often enough that a town keeps its militia drilled and its walls manned. Beyonders are understood here through a martial lens: the God of Combat''s faithful prize ferocity and the test of battle, and a newly-changed Beyonder in Feysac learns quickly that power is admired but also measured, and that the Church does not look kindly on the kind it cannot account for.',
  null,
  5,
  'feysac',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'feysac-empire', 'god-of-combat', 'fifth-epoch'],
  195
);
