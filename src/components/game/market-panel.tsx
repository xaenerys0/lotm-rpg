"use client";

import { useCallback, useEffect, useState } from "react";

import {
  loadActiveSession,
  persistSession,
  useStoredValue,
} from "@/lib/react/session-store";
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
  purchase,
  removeItemForListing,
  validateListing,
  PRICE_GUIDANCE,
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
  const initialSession = useStoredValue(loadActiveSession, null);
  const [session, setSession] = useState<GameSession | null>(initialSession);

  const persist = useCallback((next: GameSession) => {
    setSession(next);
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

  const visible = filterListings(listings, filter);
  const funds = session ? getFunds(session.gameState) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-sm italic text-muted">
          A quiet arcade off the market square, where unusual goods change hands.
        </p>
        {session && (
          <p className="text-sm text-foreground/85">
            Purse: <span className="font-medium text-amber">{funds}p</span>
          </p>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-md border border-amber/30 bg-amber/[0.05] px-4 py-2.5 font-serif text-sm italic text-foreground/85"
        >
          {notice}
        </p>
      )}

      {/* Browse */}
      <section aria-labelledby="market-browse">
        <h2
          id="market-browse"
          className="gaslit font-serif text-lg font-semibold text-amber/90"
        >
          Stalls
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="market-category" className="mb-1 block text-xs text-muted">
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
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            >
              <option value="">All</option>
              <option value="main-ingredient">Main ingredients</option>
              <option value="supplementary-ingredient">Supplementary</option>
              <option value="potion-formula">Formulas</option>
            </select>
          </div>
          <div>
            <label htmlFor="market-max" className="mb-1 block text-xs text-muted">
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none sm:w-28"
            />
          </div>
          <div>
            <label htmlFor="market-search" className="mb-1 block text-xs text-muted">
              Search
            </label>
            <input
              id="market-search"
              type="search"
              value={filter.text ?? ""}
              onChange={(e) =>
                setFilter((f) => ({ ...f, text: e.target.value || undefined }))
              }
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber/50 focus:outline-none"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted">
            The stalls are bare — or the fog is keeping their wares from you.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => (
              <li key={entry.id} className="parchment rounded-md p-4">
                <p className="text-sm font-semibold text-foreground">{entry.item.name}</p>
                {entry.item.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {entry.item.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber">{entry.price}p</span>
                  {entry.sellerId === userId ? (
                    <button
                      type="button"
                      onClick={() => handleDelist(entry)}
                      className="min-h-[24px] rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                    >
                      Take down
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(entry)}
                      disabled={!session || !canAfford(session.gameState, entry.price)}
                      className="min-h-[24px] rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-1.5 text-xs font-medium text-amber hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-30"
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
          <h2
            id="market-sell"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Offer something
          </h2>
          {session.gameState.inventory.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Your satchel has nothing to spare.</p>
          ) : (
            <form onSubmit={handleList} className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="market-item" className="mb-1 block text-xs text-muted">
                  Item
                </label>
                <select
                  id="market-item"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
                >
                  <option value="">choose…</option>
                  {session.gameState.inventory.map((item: Item, index: number) => (
                    <option key={`${item.name}-${index}`} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="market-price" className="mb-1 block text-xs text-muted">
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
                  className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!itemName || !price || !userId}
                className="rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm font-medium text-amber hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                List it
              </button>
            </form>
          )}
        </section>
      )}

      {/* Ledger */}
      {history.length > 0 && (
        <section aria-labelledby="market-ledger">
          <h2
            id="market-ledger"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Your ledger
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between gap-3 text-foreground/80"
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
                <span className="text-amber">{entry.price}p</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
