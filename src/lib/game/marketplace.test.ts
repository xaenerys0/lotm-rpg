import { describe, expect, it, vi } from "vitest";

import type { GameState } from "@/lib/ai";

import {
  addItemToInventory,
  adjustFunds,
  canAfford,
  filterListings,
  getFunds,
  removeItemForListing,
  validateListing,
  PRICE_GUIDANCE,
  STARTING_FUNDS,
  type MarketListing,
} from "./marketplace";
import {
  createListing,
  delist,
  fetchActiveListings,
  fetchOwnHistory,
  purchase,
  type MarketplaceClient,
} from "./marketplace-sync";
import { createDefaultGameState } from "./session";

const state = (overrides: Partial<GameState> = {}): GameState => ({
  ...createDefaultGameState(1, "char-1", "Klein"),
  inventory: [
    {
      name: "Night Vanilla",
      description: "13 drops.",
      category: "supplementary-ingredient",
    },
    {
      name: "Seer Potion Formula",
      description: "The recipe.",
      category: "potion-formula",
    },
  ],
  ...overrides,
});

const listing = (overrides: Partial<MarketListing> = {}): MarketListing => ({
  id: "l1",
  sellerId: "seller-1",
  item: { name: "Night Vanilla", description: "", category: "supplementary-ingredient" },
  price: 40,
  status: "active",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  soldTo: null,
  ...overrides,
});

describe("funds", () => {
  it("seeds STARTING_FUNDS for saves that predate currency", () => {
    expect(getFunds(state())).toBe(STARTING_FUNDS);
    expect(getFunds(state({ funds: 7 }))).toBe(7);
  });

  it("adjusts without going negative and gates affordability", () => {
    const rich = adjustFunds(state({ funds: 100 }), 50);
    expect(getFunds(rich)).toBe(150);
    expect(getFunds(adjustFunds(state({ funds: 10 }), -50))).toBe(0);
    expect(canAfford(state({ funds: 39 }), 40)).toBe(false);
    expect(canAfford(state({ funds: 40 }), 40)).toBe(true);
  });
});

describe("validateListing", () => {
  it("accepts a carried, sanely-priced item", () => {
    expect(validateListing(state(), "Night Vanilla", 40)).toEqual({ ok: true });
  });

  it("rejects items the seller does not carry (anti-exploit)", () => {
    expect(validateListing(state(), "Antigonus Notebook", 40).reason).toMatch(
      /actually carry/,
    );
  });

  it("rejects nonsense prices", () => {
    expect(validateListing(state(), "Night Vanilla", 0).ok).toBe(false);
    expect(validateListing(state(), "Night Vanilla", 12.5).ok).toBe(false);
    const cap = PRICE_GUIDANCE["supplementary-ingredient"].max * 10;
    expect(validateListing(state(), "Night Vanilla", cap + 1).reason).toMatch(
      /No one in the city/,
    );
  });
});

describe("escrow", () => {
  it("removes the item at listing time and restores it on return", () => {
    const { state: after, item } = removeItemForListing(state(), "Night Vanilla");
    expect(after.inventory.map((i) => i.name)).toEqual(["Seer Potion Formula"]);
    expect(item.name).toBe("Night Vanilla");
    const restored = addItemToInventory(after, item);
    expect(restored.inventory).toHaveLength(2);
    expect(() => removeItemForListing(after, "Night Vanilla")).toThrow(
      /not in the inventory/,
    );
  });
});

describe("filterListings", () => {
  const listings = [
    listing(),
    listing({
      id: "l2",
      item: { name: "Seer Potion Formula", description: "", category: "potion-formula" },
      price: 900,
    }),
    listing({ id: "sold", status: "sold" }),
    listing({ id: "stale", expiresAt: new Date(Date.now() - 1000).toISOString() }),
  ];

  it("hides sold and expired rows and applies the browse filters", () => {
    expect(filterListings(listings, {}).map((l) => l.id)).toEqual(["l1", "l2"]);
    expect(
      filterListings(listings, { category: "potion-formula" }).map((l) => l.id),
    ).toEqual(["l2"]);
    expect(filterListings(listings, { maxPrice: 100 }).map((l) => l.id)).toEqual(["l1"]);
    expect(filterListings(listings, { text: "seer" }).map((l) => l.id)).toEqual(["l2"]);
  });
});

describe("marketplace-sync", () => {
  function makeClient(
    error: { message: string } | null = null,
    rows: unknown[] = [],
    rpcData: unknown = null,
  ) {
    const limit = vi.fn().mockResolvedValue({ data: rows, error });
    const eq = vi.fn().mockReturnValue({ limit });
    const or = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ eq, or });
    const insert = vi.fn().mockResolvedValue({ error });
    const updateEq = vi.fn().mockResolvedValue({ error });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const rpc = vi.fn().mockResolvedValue({ data: rpcData, error });
    return {
      client: { from: vi.fn().mockReturnValue({ select, insert, update }), rpc },
      eq,
      or,
      insert,
      update,
      updateEq,
      rpc,
    };
  }

  const item = {
    name: "Night Vanilla",
    description: "",
    category: "supplementary-ingredient" as const,
  };
  const row = {
    id: "l1",
    seller_id: "seller-1",
    item,
    price: 40,
    status: "active",
    created_at: "2026-06-12T00:00:00Z",
    expires_at: "2026-06-26T00:00:00Z",
    sold_to: null,
    sold_at: null,
  };

  it("fetches active listings and own history", async () => {
    const { client, eq, or } = makeClient(null, [row]);
    const active = await fetchActiveListings(client as unknown as MarketplaceClient);
    expect(eq).toHaveBeenCalledWith("status", "active");
    expect(active[0]).toMatchObject({ id: "l1", price: 40, sellerId: "seller-1" });

    await fetchOwnHistory(client as unknown as MarketplaceClient, "u1");
    expect(or).toHaveBeenCalledWith("seller_id.eq.u1,sold_to.eq.u1");
  });

  it("creates, delists, and purchases atomically via the RPC", async () => {
    const { client, insert, updateEq, rpc } = makeClient(null, [], row.item);
    await createListing(client as unknown as MarketplaceClient, "u1", item, 40);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ seller_id: "u1", price: 40 }),
    ]);
    await delist(client as unknown as MarketplaceClient, "l1");
    expect(updateEq).toHaveBeenCalledWith("id", "l1");
    const bought = await purchase(client as unknown as MarketplaceClient, "l1");
    expect(rpc).toHaveBeenCalledWith("purchase_listing", { p_listing_id: "l1" });
    expect(bought.name).toBe("Night Vanilla");
  });

  it("translates purchase failures into friendly messages", async () => {
    const gone = makeClient({ message: "listing_unavailable" });
    await expect(
      purchase(gone.client as unknown as MarketplaceClient, "l1"),
    ).rejects.toThrow(/Someone got there first/);
    const own = makeClient({ message: "cannot_buy_own_listing" });
    await expect(
      purchase(own.client as unknown as MarketplaceClient, "l1"),
    ).rejects.toThrow(/your own listing/);
    const other = makeClient({ message: "boom" });
    await expect(
      fetchActiveListings(other.client as unknown as MarketplaceClient),
    ).rejects.toThrow(/Browsing the market failed/);
  });
});
