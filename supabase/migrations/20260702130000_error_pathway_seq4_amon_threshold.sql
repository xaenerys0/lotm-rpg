-- Add Sequence 4 Parasite entry to the Error pathway (Amon / Angel-tier awareness bridge).
-- Generated from src/lib/lore/pathway-error.ts.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'error-seq4-parasite',
  'Error Pathway — Sequence 4: Parasite',
  'pathway',
  'The Parasite is the Saint threshold of the Error pathway and the first demigod rung. Where lower sequences steal objects, abilities, or thoughts, the Parasite steals life itself: a Beyonder at this rung can burrow into a host and live as a parasite, siphoning vitality, identity, and fate from within. The body begins to take on the pathway''s true mythical form — the Worms of Time — and the theft of time, anchors, and authorities ceases to be a distant myth and becomes the next horizon. This is the rung where an Error Beyonder steps into the orbit of the Amon Family, whose every member is in some sense a parasite, fragment, or child of Amon, the Angel of Time and Worm of Time who sits near the apex of the pathway. The family does not merely worship the higher sequences; they are an extension of Amon''s theft of identity and time. The advancement to Parasite demands a parasitic theft of life — to enter a host, consume enough selfhood to fuse the potion, and emerge a demigod without being cast out — and the acting method never stops: live inside another, take what is theirs, and make their story your own while the true Worm of Time watches from higher up the sequence ladder.',
  'error',
  5,
  null,
  ARRAY['Amon'],
  ARRAY[4],
  ARRAY['error-pathway', 'parasite', 'saint-threshold', 'amon', 'worm-of-time'],
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
