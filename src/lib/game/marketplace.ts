import type { GameState } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import {
  type ArtifactGrade,
  gradeForArtifactItem,
  isArtifactTradeable,
} from "@/lib/lore";

import { isReagentCategory } from "./inventory";

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

/**
 * Per-turn cap (in pence) on funds the narrator may grant or take in a single
 * turn via `AIResponse.fundsDiscovered` (issue #16 follow-up: money found in the
 * fiction must reach the wallet, but bounded so a player cannot simply declare a
 * fortune to buy a deep-Sequence ingredient outright). 2400 pence = 10 pounds —
 * a plausible purse or reward; larger sums accrue over multiple turns. Signed:
 * negative covers a robbery, bribe, or loss narrated in-fiction.
 */
export const FUNDS_DISCOVERED_CAP = 2400;

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
  // Mundane loot fetches only pocket change at a fence (see vendorSaleValue);
  // it is never listed on the player market (see isReagentCategory).
  mundane: { min: 1, suggested: 8, max: 40 },
  // The singular pathway Uniqueness is never sold by any channel; this band
  // exists only to keep `PRICE_GUIDANCE[item.category]` total over the Item union.
  uniqueness: { min: 0, suggested: 0, max: 0 },
  // Sealed Artifacts are church-catalogued and locked away — never circulated on
  // the open market or fenced. Like `uniqueness`, the zero band exists only to
  // keep the Record total over the Item union (`validateListing` refuses them).
  "sealed-artifact": { min: 0, suggested: 0, max: 0 },
};

/**
 * Grade-scaled price bands (pence) for a TRADEABLE Sealed Artifact (individually-
 * owned or player-crafted; church-custodied ones never reach a price). A Grade 0
 * relic is the most valuable. Used for the listing price cap and the fence value.
 */
export const ARTIFACT_PRICE_BY_GRADE: Record<
  ArtifactGrade,
  { min: number; suggested: number; max: number }
> = {
  3: { min: 200, suggested: 800, max: 4000 },
  2: { min: 800, suggested: 3000, max: 15000 },
  1: { min: 3000, suggested: 10000, max: 50000 },
  0: { min: 10000, suggested: 40000, max: 200000 },
};

/** The price band for a carried artifact item by its recovered grade (Grade 3 default). */
export function artifactPriceGuidance(item: Item): {
  min: number;
  suggested: number;
  max: number;
} {
  const grade = gradeForArtifactItem(item);
  return ARTIFACT_PRICE_BY_GRADE[grade ?? 3];
}

/**
 * Categories a non-player vendor (a fence/pawnbroker) will buy. `mundane`
 * belongings (pocket change) and a TRADEABLE Sealed Artifact (individual/crafted,
 * gated in `canFenceItem` — a church relic is never fenced). Reagents go to the
 * player market; the Uniqueness is never sold.
 */
export const VENDOR_SALE_CATEGORIES = new Set<Item["category"]>([
  "mundane",
  "sealed-artifact",
]);

/**
 * Whether an item is market-tradeable on the player-to-player market: the
 * advancement reagents, OR a non-church Sealed Artifact (individually-owned /
 * crafted). `mundane` is fenced, not listed; `uniqueness` is never sold. Pure.
 */
export function isMarketTradeable(item: Item): boolean {
  if (isReagentCategory(item.category)) return true;
  if (item.category === "sealed-artifact") return isArtifactTradeable(item);
  return false;
}

/** Whether a fence will buy an item (a church-custody artifact never is). Pure. */
export function canFenceItem(item: Item): boolean {
  if (!VENDOR_SALE_CATEGORIES.has(item.category)) return false;
  if (item.category === "sealed-artifact") return isArtifactTradeable(item);
  return true;
}

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
  // The player-to-player market trades the rules-engine reagent kinds AND a
  // non-church Sealed Artifact (individually-owned / player-crafted): `mundane`
  // loot is fenced instead (sellItemToVendor), `uniqueness` is never sold, and a
  // CHURCH-custodied artifact is locked away (stolen or earned by affiliation,
  // never sold). Keeping AI-mintable mundane off the open market matters because
  // a player-set listing price is unbounded (a fence pays only pocket change).
  if (!isMarketTradeable(item)) {
    return { ok: false, reason: "That is not a tradable kind of thing." };
  }
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, reason: "Set an honest price in whole pence." };
  }
  const maxBand =
    item.category === "sealed-artifact"
      ? artifactPriceGuidance(item).max
      : PRICE_GUIDANCE[item.category].max;
  if (price > maxBand * 10) {
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

/**
 * What a fence pays for one item — the category's `suggested` band, but only for
 * the vendor-sellable kinds (mundane). Anything else is worthless to a fence
 * (reagents go to the player market; the Uniqueness is never sold), so 0.
 */
export function vendorSaleValue(item: Item): number {
  if (!canFenceItem(item)) return 0;
  if (item.category === "sealed-artifact") return artifactPriceGuidance(item).suggested;
  return PRICE_GUIDANCE[item.category].suggested;
}

export interface VendorSaleResult {
  ok: boolean;
  reason?: string;
  /** The updated state after the sale (on success). */
  state?: GameState;
  /** Pence credited (on success). */
  proceeds?: number;
}

/**
 * Sell one carried item to a non-player vendor (a fence) for `vendorSaleValue`.
 * Local + pure — no marketplace row, no other player involved: this is the
 * "sellable, but not to users" path for mundane belongings. Refuses items the
 * seller does not carry and anything a fence will not buy.
 */
export function sellItemToVendor(state: GameState, itemName: string): VendorSaleResult {
  const item = state.inventory.find((i) => i.name === itemName);
  if (!item) {
    return { ok: false, reason: "You are not carrying that." };
  }
  if (!canFenceItem(item)) {
    return { ok: false, reason: "No fence would give you a penny for that." };
  }
  const proceeds = vendorSaleValue(item);
  const { state: without } = removeItemForListing(state, itemName);
  return { ok: true, state: adjustFunds(without, proceeds), proceeds };
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
