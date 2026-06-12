-- Shared world messages (issue #17): Dark Souls-style asynchronous notes
-- players leave at locations for other players, across timelines. Safety is
-- structural: rows store a template id + slot fills validated client-side
-- against a fixed vocabulary, plus the composed text; a CHECK keeps the text
-- short regardless. Everyone signed-in can READ (it is a shared world);
-- authors insert their own rows; ratings go through a SECURITY DEFINER RPC
-- with one vote per player per message.

create table public.world_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  location text not null,
  template_id text not null,
  fills jsonb not null default '{}'::jsonb,
  text text not null,
  helpful integer not null default 0,
  unhelpful integer not null default 0,
  created_at timestamptz not null default now(),
  constraint world_messages_text_short check (char_length(text) <= 120)
);

comment on table public.world_messages is
  'Template-composed player messages (issue #17). Shared read; owner insert.';

create index world_messages_location_idx on public.world_messages (location);

create table public.world_message_votes (
  message_id uuid not null references public.world_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.world_messages enable row level security;
alter table public.world_message_votes enable row level security;

create policy "Signed-in players read all messages"
  on public.world_messages
  for select
  to authenticated
  using (true);

create policy "Players leave their own messages"
  on public.world_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Players delete their own messages"
  on public.world_messages
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Votes are written only through the RPC below; players may read their own.
create policy "Players read their own votes"
  on public.world_message_votes
  for select
  to authenticated
  using (auth.uid() = user_id);

-- One vote per player per message, counters maintained atomically. SECURITY
-- DEFINER so counter updates need no UPDATE policy on world_messages.
create or replace function public.rate_world_message(
  p_message_id uuid,
  p_helpful boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.world_message_votes (message_id, user_id, helpful)
  values (p_message_id, auth.uid(), p_helpful);

  if p_helpful then
    update public.world_messages set helpful = helpful + 1 where id = p_message_id;
  else
    update public.world_messages set unhelpful = unhelpful + 1 where id = p_message_id;
  end if;
exception
  when unique_violation then
    -- Already voted: a silent no-op keeps the UI simple.
    null;
end;
$$;

revoke all on function public.rate_world_message(uuid, boolean) from public, anon;
grant execute on function public.rate_world_message(uuid, boolean) to authenticated;
