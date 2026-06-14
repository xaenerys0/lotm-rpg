import type { Item } from "@/lib/types/rules";

/**
 * Remove `items` from an inventory by name — one match removed per entry,
 * unmatched names ignored. The single shared form of the "drop these items"
 * operation the combat, advancement, and failure subsystems all need (so they
 * stay consistent if matching ever moves from name-equality to ids/quantities).
 * Pure: returns a new array, never mutates the input.
 */
export function removeItemsByName(inventory: Item[], items: Item[]): Item[] {
  const remaining = [...inventory];
  for (const item of items) {
    const index = remaining.findIndex((i) => i.name === item.name);
    if (index !== -1) remaining.splice(index, 1);
  }
  return remaining;
}
