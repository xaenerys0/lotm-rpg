import type { GameState } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";

// ---------------------------------------------------------------------------
// Item marketplace (issue #16)
// ---------------------------------------------------------------------------
//
// Player-to-player trading post. Pure engine here; Supabase glue in
// marketplace-sync.ts. Design notes, stated honestly:
//   - Currency (issue #16 introduces it): integer PENCE on GameState.funds
//     (Loen flavor — 12 pence to a soli, 20 soli to a pound). Sessions are
//     client-side by architecture, so funds are too: the SERVER guarantees
//     item transfer atomicity and listing legitimacy *of the marketplace
//     rows*; the funds ledger is the same honor system as the rest of the
//     save file.
//   - Anti-exploit: an item can be listed only if it exists in the seller's
//     inventory (validateListing) and is removed at listing time; categories
//     must be the rules engine's known item categories. The purchase RPC
//     (server-side) is the only path that marks a listing sold.

export const STARTING_FUNDS = 120;

/** Read a session's funds; older saves predate currency and start fresh. */
export function getFunds(state: GameState): number {
  return state.funds ?? STARTING_FUNDS;
}

export function adjustFunds(state: GameState, delta: number): GameState {
  return { ...state, funds: Math.max(0, getFunds(state) + delta) };
}

export function canAfford(state: GameState, price: number): boolean {
  return getFunds(state) >= price;
}

/** Suggested price bands per item category (pence). Pure guidance. */
export const PRICE_GUIDANCE: Record<
  Item["category"],
  { min: number; suggested: number; max: number }
> = {
  "supplementary-ingredient": { min: 10, suggested: 40, max: 200 },
  "main-ingredient": { min: 100, suggested: 350, max: 1500 },
  "potion-formula": { min: 250, suggested: 800, max: 4000 },
};

export interface ListingValidation {
  ok: boolean;
  reason?: string;
}

/**
 * A listing is legitimate only if the named item actually exists in the
 * seller's inventory with a rules-engine category, and the price is a
 * positive integer. The item leaves the inventory at listing time, so it
 * cannot be listed twice or kept while listed.
 */
export function validateListing(
  state: GameState,
  itemName: string,
  price: number,
): ListingValidation {
  const item = state.inventory.find((i) => i.name === itemName);
  if (!item) {
    return { ok: false, reason: "You can only list items you actually carry." };
  }
  if (!(item.category in PRICE_GUIDANCE)) {
    return { ok: false, reason: "That is not a tradable kind of thing." };
  }
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, reason: "Set an honest price in whole pence." };
  }
  if (price > PRICE_GUIDANCE[item.category].max * 10) {
    return { ok: false, reason: "No one in the city would pay that." };
  }
  return { ok: true };
}

/** Remove the listed item from the seller's inventory (escrow). */
export function removeItemForListing(
  state: GameState,
  itemName: string,
): { state: GameState; item: Item } {
  const index = state.inventory.findIndex((i) => i.name === itemName);
  if (index === -1) throw new Error(`"${itemName}" is not in the inventory.`);
  const item = state.inventory[index];
  return {
    state: {
      ...state,
      inventory: [
        ...state.inventory.slice(0, index),
        ...state.inventory.slice(index + 1),
      ],
    },
    item,
  };
}

/** Deliver a purchased (or returned) item into an inventory. */
export function addItemToInventory(state: GameState, item: Item): GameState {
  return { ...state, inventory: [...state.inventory, item] };
}

/** Listing lifetime before it expires back to the seller. */
export const LISTING_DAYS = 14;

export type ListingStatus = "active" | "sold" | "delisted" | "expired";

export interface MarketListing {
  id: string;
  sellerId: string;
  item: Item;
  price: number;
  status: ListingStatus;
  createdAt: string;
  expiresAt: string;
  soldTo: string | null;
}

export interface ListingFilter {
  category?: Item["category"];
  maxPrice?: number;
  text?: string;
}

/** Client-side browse filter over fetched listings. */
export function filterListings(
  listings: readonly MarketListing[],
  filter: ListingFilter,
): MarketListing[] {
  const text = filter.text?.toLowerCase();
  return listings.filter((listing) => {
    if (listing.status !== "active") return false;
    if (new Date(listing.expiresAt).getTime() < Date.now()) return false;
    if (filter.category && listing.item.category !== filter.category) return false;
    if (filter.maxPrice !== undefined && listing.price > filter.maxPrice) return false;
    if (text && !listing.item.name.toLowerCase().includes(text)) return false;
    return true;
  });
}
