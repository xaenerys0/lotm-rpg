-- Player showcase + leaderboards (issue #18). One row per player, published
-- explicitly from the client. Privacy is enforced in the SELECT policy: only
-- rows the owner marked public are visible to others — private data cannot
-- leak because it is never selectable.

create table public.player_showcases (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'A nameless Beyonder',
  public boolean not null default false,
  pathway_id integer not null,
  sequence_level integer not null,
  achievement_ids text[] not null default '{}',
  divergence_score integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint player_showcases_divergence_range
    check (divergence_score between 0 and 100)
);

comment on table public.player_showcases is
  'Published player profiles for leaderboards (issue #18). Public rows only are world-readable.';

create index player_showcases_leaderboard_idx
  on public.player_showcases (public, pathway_id, sequence_level);

alter table public.player_showcases enable row level security;

create policy "Owners manage their own showcase"
  on public.player_showcases
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public showcases are readable"
  on public.player_showcases
  for select
  to authenticated
  using (public = true);
