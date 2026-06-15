import type { Item } from "@/lib/types/rules";

/**
 * The three advancement-ladder reagent categories — the rules-engine-owned
 * kinds (formula + main/supplementary ingredient) the AI may not mint and that
 * trade on the Beyonder market. The single source of truth for "is this an
 * advancement reagent?": `world-state` blocks these from AI item discovery and
 * `marketplace` lists exactly these, so the two can never drift (issue #90).
 * `mundane` and `uniqueness` are deliberately excluded.
 */
export const REAGENT_CATEGORIES = new Set<Item["category"]>([
  "main-ingredient",
  "supplementary-ingredient",
  "potion-formula",
]);

/** Whether a category is an advancement-ladder reagent (see `REAGENT_CATEGORIES`). */
export function isReagentCategory(category: Item["category"]): boolean {
  return REAGENT_CATEGORIES.has(category);
}

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

/**
 * Whether an inventory carries an item matching BOTH category and name. The
 * advancement and potion-preparation gates use this (not the name-only
 * `hasItem`) so a `mundane` item that merely shares a required reagent's name
 * cannot satisfy a prerequisite or soft-lock its acquisition — the canonical
 * advancement check in `@/lib/rules` (`laws.ts`) likewise matches category+name,
 * and these stay consistent with it.
 */
export function hasItemMatching(inventory: Item[], item: Item): boolean {
  return inventory.some(
    (carried) => carried.category === item.category && carried.name === item.name,
  );
}
