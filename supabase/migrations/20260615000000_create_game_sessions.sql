-- Cloud-synced character saves (cross-device sync).
--
-- Until now the entire GameSession lived ONLY in the browser's localStorage
-- (`persistSession`), so clearing the browser or switching devices lost every
-- character. This table is the durable, authoritative copy: the full serialized
-- session as jsonb, owner-scoped by RLS. The local session index and the active
-- pointer collapse into rows here (ordering by updated_at; the single is_active
-- row replaces ACTIVE_SESSION_KEY).

create table public.game_sessions (
  id         uuid primary key, -- the existing client-generated session id
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       jsonb not null, -- the full serialized GameSession
  is_active  boolean not null default false, -- the active-character pointer
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- The per-user save list, newest first (replaces the localStorage index).
create index game_sessions_user_updated_idx
  on public.game_sessions (user_id, updated_at desc);

-- At most one active character per user (replaces ACTIVE_SESSION_KEY). Partial
-- unique so only the active rows are constrained; flipped atomically by the
-- set_active_session RPC below to avoid a transient two-active state.
create unique index game_sessions_one_active_idx
  on public.game_sessions (user_id)
  where is_active;

alter table public.game_sessions enable row level security;

create policy "Players manage their own sessions"
  on public.game_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Atomically make one session the active character for the caller: clear the
-- previous active row, then set the chosen one. SECURITY DEFINER so the two
-- writes happen as one statement pair under the caller's own id (auth.uid());
-- the WHERE user_id = auth.uid() clauses keep it scoped to the caller's rows
-- exactly like the RLS policy, so it can never touch another player's saves.
create or replace function public.set_active_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_sessions
    set is_active = false
    where user_id = auth.uid() and is_active and id <> p_id;
  update public.game_sessions
    set is_active = true
    where user_id = auth.uid() and id = p_id;
end;
$$;
