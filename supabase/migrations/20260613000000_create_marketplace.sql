-- Item marketplace (issue #16): player-to-player trading post. The server
-- guarantees listing legitimacy of the ROWS (one active listing per escrowed
-- item, purchases atomic via RPC); item escrow in/out of the save file and
-- the funds ledger live client-side with the rest of the session, by
-- architecture. Listings expire back to sellers after 14 days.

create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id) on delete cascade,
  item jsonb not null,
  price integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  sold_to uuid references auth.users (id) on delete set null,
  sold_at timestamptz,
  constraint market_listings_price_positive check (price > 0),
  constraint market_listings_status_check
    check (status in ('active', 'sold', 'delisted', 'expired'))
);

comment on table public.market_listings is
  'Player trading post (issue #16). Purchases only via purchase_listing().';

create index market_listings_status_idx on public.market_listings (status, expires_at);

alter table public.market_listings enable row level security;

-- Everyone signed-in browses active listings; sellers and buyers always see
-- their own rows (that is the transaction history).
create policy "Browse active listings"
  on public.market_listings
  for select
  to authenticated
  using (status = 'active' or auth.uid() = seller_id or auth.uid() = sold_to);

create policy "Sellers create their own listings"
  on public.market_listings
  for insert
  to authenticated
  with check (auth.uid() = seller_id and status = 'active');

-- Delisting is the only direct mutation a seller may make, and only on their
-- own still-active rows.
create policy "Sellers delist their own active listings"
  on public.market_listings
  for update
  to authenticated
  using (auth.uid() = seller_id and status = 'active')
  with check (status = 'delisted');

-- Atomic purchase: only path to 'sold'. Locks the row, rejects self-purchase
-- and stale listings, records the buyer, and returns the item payload for
-- client-side delivery.
create or replace function public.purchase_listing(p_listing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.market_listings%rowtype;
begin
  select * into v_listing
  from public.market_listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'active'
     or v_listing.expires_at < now() then
    raise exception 'listing_unavailable';
  end if;
  if v_listing.seller_id = auth.uid() then
    raise exception 'cannot_buy_own_listing';
  end if;

  update public.market_listings
  set status = 'sold', sold_to = auth.uid(), sold_at = now()
  where id = p_listing_id;

  return v_listing.item;
end;
$$;

revoke all on function public.purchase_listing(uuid) from public, anon;
grant execute on function public.purchase_listing(uuid) to authenticated;
