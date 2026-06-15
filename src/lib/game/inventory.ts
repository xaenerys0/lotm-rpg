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

/**
 * Whether an inventory carries an item with the given name. The read-side
 * counterpart of `removeItemsByName` — the single shared name-equality check the
 * advancement, apotheosis, and potion-preparation gates use, so they all match
 * carried items the same way.
 */
export function hasItem(inventory: Item[], name: string): boolean {
  return inventory.some((item) => item.name === name);
}
