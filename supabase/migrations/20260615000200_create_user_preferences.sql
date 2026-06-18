-- Cloud-synced player preferences + first-time-hint dismissals (cross-device).
--
-- Display preferences (PREFERENCES_KEY) and one-shot hint dismissals
-- (lotm-rpg-hint-*) were browser-only, so settings did not follow a player
-- across devices. One row per user: the GamePreferences object as jsonb and the
-- set of dismissed hint ids.

create table public.user_preferences (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  preferences     jsonb not null default '{}'::jsonb,
  dismissed_hints text[] not null default '{}',
  updated_at      timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Players manage their own preferences"
  on public.user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
