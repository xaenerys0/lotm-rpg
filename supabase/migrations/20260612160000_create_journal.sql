-- Story journal persistence (issue #11): the auto-recorded event log and the
-- player's annotations. Narrative log rows are written in batches from the
-- client after each turn; annotations sync immediately on edit. RLS: players
-- read and write ONLY their own journal. Annotations are player-only data —
-- nothing here is ever fed back into AI prompt assembly.

create table public.journal_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  character_id text not null,
  character_name text,
  turn_number integer not null,
  event_type text not null,
  summary text not null,
  narrative text not null default '',
  location text not null default '',
  involved_npcs text[] not null default '{}',
  arc text not null default '',
  created_at timestamptz not null default now(),
  constraint journal_entries_event_type_check check (
    event_type in (
      'advancement',
      'major-event',
      'npc-encounter',
      'discovery',
      'timeline-divergence',
      'death',
      'combat'
    )
  ),
  constraint journal_entries_turn_nonneg check (turn_number >= 0)
);

comment on table public.journal_entries is
  'Auto-recorded story journal events (issue #11). Owner-only via RLS.';

create index journal_entries_user_session_idx
  on public.journal_entries (user_id, session_id, turn_number);

create table public.journal_annotations (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.journal_annotations is
  'Player-only notes on journal entries (issue #11). NEVER included in AI context.';

create index journal_annotations_entry_idx on public.journal_annotations (entry_id);

alter table public.journal_entries enable row level security;
alter table public.journal_annotations enable row level security;

create policy "Players manage their own journal entries"
  on public.journal_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Players manage their own annotations"
  on public.journal_annotations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
