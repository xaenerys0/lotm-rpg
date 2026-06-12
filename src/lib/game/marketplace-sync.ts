import type { Database, Json } from "@/lib/types/database";
import type { Item } from "@/lib/types/rules";

import type { MarketListing } from "./marketplace";

// Supabase glue for the marketplace (issue #16), over a minimal structural
// client (the journal-sync pattern). The purchase RPC is the only path that
// marks a listing sold — atomic, self-purchase rejected server-side.

type ListingRow = Database["public"]["Tables"]["market_listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["market_listings"]["Insert"];

export interface MarketplaceClient {
  from(table: "market_listings"): {
    select(columns: string): {
      eq(
        column: "status",
        value: string,
      ): {
        limit(count: number): PromiseLike<{
          data: ListingRow[] | null;
          error: { message: string } | null;
        }>;
      };
      or(filter: string): {
        limit(count: number): PromiseLike<{
          data: ListingRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert(rows: ListingInsert[]): PromiseLike<{ error: { message: string } | null }>;
    update(values: { status: string }): {
      eq(column: "id", value: string): PromiseLike<{ error: { message: string } | null }>;
    };
  };
  rpc(
    fn: "purchase_listing",
    args: { p_listing_id: string },
  ): PromiseLike<{ data: Json | null; error: { message: string } | null }>;
}

function toListing(row: ListingRow): MarketListing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    item: row.item as unknown as Item,
    price: row.price,
    status: row.status as MarketListing["status"],
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    soldTo: row.sold_to,
  };
}

/** Browse the active listings (server filters status; client filters more). */
export async function fetchActiveListings(
  client: MarketplaceClient,
  limit: number = 100,
): Promise<MarketListing[]> {
  const { data, error } = await client
    .from("market_listings")
    .select("*")
    .eq("status", "active")
    .limit(limit);
  if (error) throw new Error(`Browsing the market failed: ${error.message}`);
  return (data ?? []).map(toListing);
}

/** Seller + buyer transaction history (own rows of any status). */
export async function fetchOwnHistory(
  client: MarketplaceClient,
  userId: string,
  limit: number = 50,
): Promise<MarketListing[]> {
  const { data, error } = await client
    .from("market_listings")
    .select("*")
    .or(`seller_id.eq.${userId},sold_to.eq.${userId}`)
    .limit(limit);
  if (error) throw new Error(`Loading your ledger failed: ${error.message}`);
  return (data ?? []).map(toListing);
}

/** Post a validated, escrowed item as a listing. */
export async function createListing(
  client: MarketplaceClient,
  sellerId: string,
  item: Item,
  price: number,
): Promise<void> {
  const { error } = await client.from("market_listings").insert([
    {
      seller_id: sellerId,
      item: item as unknown as Json,
      price,
    },
  ]);
  if (error) throw new Error(`Listing the item failed: ${error.message}`);
}

/** Take an own active listing down (the item returns to the inventory). */
export async function delist(
  client: MarketplaceClient,
  listingId: string,
): Promise<void> {
  const { error } = await client
    .from("market_listings")
    .update({ status: "delisted" })
    .eq("id", listingId);
  if (error) throw new Error(`Delisting failed: ${error.message}`);
}

/** Buy a listing atomically; returns the purchased item for delivery. */
export async function purchase(
  client: MarketplaceClient,
  listingId: string,
): Promise<Item> {
  const { data, error } = await client.rpc("purchase_listing", {
    p_listing_id: listingId,
  });
  if (error) {
    const friendly = error.message.includes("listing_unavailable")
      ? "Someone got there first — the listing is gone."
      : error.message.includes("cannot_buy_own_listing")
        ? "You cannot buy your own listing."
        : `The purchase failed: ${error.message}`;
    throw new Error(friendly);
  }
  return data as unknown as Item;
}
