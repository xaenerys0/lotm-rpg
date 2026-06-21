"use client";

import { useCallback, useEffect, useState } from "react";

import { persistSession, useActiveSession } from "@/lib/react/session-store";
import { createBrowserClientSafe, createClient } from "@/lib/supabase/client";
import type { Item } from "@/lib/types/rules";
import {
  addItemToInventory,
  adjustFunds,
  canAfford,
  createListing,
  delist,
  fetchActiveListings,
  fetchOwnHistory,
  filterListings,
  getFunds,
  isReagentCategory,
  purchase,
  removeItemForListing,
  sellItemToVendor,
  validateListing,
  vendorSaleValue,
  PRICE_GUIDANCE,
  VENDOR_SALE_CATEGORIES,
  type GameSession,
  type ListingFilter,
  type MarketListing,
  type MarketplaceClient,
} from "@/lib/game";

// Trading post (issue #16). Listing escrows the item out of the local save;
// purchase goes through the atomic server RPC, then funds/items settle into
// the save. Realtime-ish freshness comes from refetch-on-action plus a
// Supabase realtime subscription when available (best-effort).

const marketClient = (): MarketplaceClient | null =>
  createBrowserClientSafe<MarketplaceClient>();

export function MarketPanel() {
  // The single active character, reactive (active-character sync): a sale/listing
  // persists and this page re-reads; switching character updates it live.
  const session = useActiveSession();

  const persist = useCallback((next: GameSession) => {
    persistSession(next);
  }, []);

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [history, setHistory] = useState<MarketListing[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingFilter>({});

  const refresh = useCallback(async () => {
    const client = marketClient();
    if (!client) return;
    try {
      setListings(await fetchActiveListings(client));
      const { data } = await (
        client as unknown as ReturnType<typeof createClient>
      ).auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        setHistory(await fetchOwnHistory(client, data.user.id));
      }
    } catch {
      // Offline — the stalls stay shuttered.
    }
  }, []);

  useEffect(() => {
    // Deferred a tick so the effect body itself never sets state (lint rule).
    queueMicrotask(() => void refresh());
    // Live updates (best-effort): re-pull when any listing changes.
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("market_listings")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "market_listings" },
          () => void refresh(),
        )
        .subscribe();
      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return;
    }
  }, [refresh]);

  // ── Listing creation ──
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");

  const handleList = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!session || !userId) return;
      const parsedPrice = Number(price);
      const verdict = validateListing(session.gameState, itemName, parsedPrice);
      if (!verdict.ok) {
        setNotice(verdict.reason ?? "The stall keeper shakes their head.");
        return;
      }
      const client = marketClient();
      if (!client) return;
      const { state: escrowed, item } = removeItemForListing(session.gameState, itemName);
      persist({ ...session, gameState: escrowed, updatedAt: Date.now() });
      setItemName("");
      setPrice("");
      void (async () => {
        try {
          await createListing(client, userId, item, parsedPrice);
          setNotice(`"${item.name}" is on the market.`);
        } catch (err) {
          // Listing failed — return the escrowed item.
          persist({
            ...session,
            gameState: addItemToInventory(escrowed, item),
            updatedAt: Date.now(),
          });
          setNotice(err instanceof Error ? err.message : "The market refused.");
        }
        await refresh();
      })();
    },
    [session, userId, itemName, price, persist, refresh],
  );

  const handleBuy = useCallback(
    (target: MarketListing) => {
      if (!session) return;
      if (!canAfford(session.gameState, target.price)) {
        setNotice("Your purse is lighter than that.");
        return;
      }
      const client = marketClient();
      if (!client) return;
      void (async () => {
        try {
          const item = await purchase(client, target.id);
          persist({
            ...session,
            gameState: addItemToInventory(
              adjustFunds(session.gameState, -target.price),
              item,
            ),
            updatedAt: Date.now(),
          });
          setNotice(`"${item.name}" is yours for ${target.price}p.`);
        } catch (err) {
          setNotice(err instanceof Error ? err.message : "The deal fell through.");
        }
        await refresh();
      })();
    },
    [session, persist, refresh],
  );

  const handleDelist = useCallback(
    (target: MarketListing) => {
      if (!session) return;
      const client = marketClient();
      if (!client) return;
      void (async () => {
        try {
          await delist(client, target.id);
          persist({
            ...session,
            gameState: addItemToInventory(session.gameState, target.item),
            updatedAt: Date.now(),
          });
          setNotice(`"${target.item.name}" returns to your satchel.`);
        } catch (err) {
          setNotice(err instanceof Error ? err.message : "The stall keeper refused.");
        }
        await refresh();
      })();
    },
    [session, persist, refresh],
  );

  // Sell a mundane belonging to a fence — local, no other player, works offline.
  const handleFence = useCallback(
    (item: Item) => {
      if (!session) return;
      const result = sellItemToVendor(session.gameState, item.name);
      if (!result.ok || !result.state) {
        setNotice(result.reason ?? "The fence waves you off.");
        return;
      }
      persist({ ...session, gameState: result.state, updatedAt: Date.now() });
      setNotice(`The fence takes "${item.name}" for ${result.proceeds}p.`);
    },
    [session, persist],
  );

  const visible = filterListings(listings, filter);
  const funds = session ? getFunds(session.gameState) : 0;
  // The player market lists reagents; mundane belongings go to the fence instead.
  const listableInventory =
    session?.gameState.inventory.filter((i) => isReagentCategory(i.category)) ?? [];
  const fenceable =
    session?.gameState.inventory.filter((i) => VENDOR_SALE_CATEGORIES.has(i.category)) ??
    [];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <p className="font-serif text-sm italic text-muted">
          A quiet arcade off the market square, where unusual goods change hands.
        </p>
        {session && (
          <p className="text-sm font-medium text-foreground">
            Purse: <span className="font-semibold text-amber">{funds}p</span>
          </p>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-amber/40 bg-surface px-4 py-3 font-serif text-sm italic text-foreground"
        >
          {notice}
        </p>
      )}

      {/* Browse */}
      <section aria-labelledby="market-browse">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          Browse
        </p>
        <h2
          id="market-browse"
          className="mt-1 font-serif text-lg font-semibold text-foreground"
        >
          Stalls
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-5">
          <div>
            <label
              htmlFor="market-category"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Kind
            </label>
            <select
              id="market-category"
              value={filter.category ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  category: (e.target.value || undefined) as ListingFilter["category"],
                }))
              }
              className="rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            >
              <option value="">All</option>
              <option value="main-ingredient">Main ingredients</option>
              <option value="supplementary-ingredient">Supplementary</option>
              <option value="potion-formula">Formulas</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="market-max"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Max price (p)
            </label>
            <input
              id="market-max"
              type="number"
              min={1}
              value={filter.maxPrice ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 sm:w-28"
            />
          </div>
          <div>
            <label
              htmlFor="market-search"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              Search
            </label>
            <input
              id="market-search"
              type="search"
              value={filter.text ?? ""}
              onChange={(e) =>
                setFilter((f) => ({ ...f, text: e.target.value || undefined }))
              }
              className="rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
            The stalls are bare — or the fog is keeping their wares from you.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-amber/40"
              >
                <p className="font-serif text-base font-semibold text-foreground">
                  {entry.item.name}
                </p>
                {entry.item.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {entry.item.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-lg font-semibold text-amber">{entry.price}p</span>
                  {entry.sellerId === userId ? (
                    <button
                      type="button"
                      onClick={() => handleDelist(entry)}
                      className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                    >
                      Take down
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(entry)}
                      disabled={!session || !canAfford(session.gameState, entry.price)}
                      className="min-h-[24px] rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Buy
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sell */}
      {session && (
        <section aria-labelledby="market-sell">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
            Sell
          </p>
          <h2
            id="market-sell"
            className="mt-1 font-serif text-lg font-semibold text-foreground"
          >
            Offer something
          </h2>
          {listableInventory.length === 0 ? (
            <p className="mt-3 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
              You carry nothing the market would take.
            </p>
          ) : (
            <form
              onSubmit={handleList}
              className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-5"
            >
              <div>
                <label
                  htmlFor="market-item"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  Item
                </label>
                <select
                  id="market-item"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                >
                  <option value="">choose…</option>
                  {listableInventory.map((item: Item, index: number) => (
                    <option key={`${item.name}-${index}`} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="market-price"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  Price (p)
                  {(() => {
                    const item = session.gameState.inventory.find(
                      (i) => i.name === itemName,
                    );
                    return item
                      ? ` — suggested ~${PRICE_GUIDANCE[item.category].suggested}`
                      : "";
                  })()}
                </label>
                <input
                  id="market-price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-28 rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
              </div>
              <button
                type="submit"
                disabled={!itemName || !price || !userId}
                className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                List it
              </button>
            </form>
          )}
        </section>
      )}

      {/* Fence — sell mundane belongings to a vendor (not to other players) */}
      {session && fenceable.length > 0 && (
        <section aria-labelledby="market-fence">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
            Vendor
          </p>
          <h2
            id="market-fence"
            className="mt-1 font-serif text-lg font-semibold text-foreground"
          >
            The fence
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            A back-room dealer who quietly buys ordinary oddments — no questions, modest
            coin.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fenceable.map((item: Item, index: number) => (
              <li
                key={`${item.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-amber/40"
              >
                <div>
                  <p className="font-serif text-base font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber">
                    {vendorSaleValue(item)}p
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFence(item)}
                  className="min-h-[24px] rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold"
                >
                  Sell
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ledger */}
      {history.length > 0 && (
        <section aria-labelledby="market-ledger">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
            History
          </p>
          <h2
            id="market-ledger"
            className="mt-1 font-serif text-lg font-semibold text-foreground"
          >
            Your ledger
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface px-5 py-1.5 text-sm">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between gap-3 py-2.5 text-foreground"
              >
                <span>
                  {entry.item.name}{" "}
                  <span className="text-xs text-muted">
                    {entry.sellerId === userId
                      ? entry.status === "sold"
                        ? "(sold)"
                        : `(${entry.status})`
                      : "(bought)"}
                  </span>
                </span>
                <span className="font-semibold text-amber">{entry.price}p</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
