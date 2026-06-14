// Per-city narration tone (issue #23). A single pure function that maps a
// session's `location` string to one tone-setting sentence for the narrator,
// so each city reads with its own atmosphere. It matches on the location's
// first word lowercased — the same matching convention `getLoreByCity`/the
// curated-lore selection use, so the directive and the curated city lore
// always agree on which city the player is in. Returns `null` for unknown or
// unmapped locations (the default Tingen start included), in which case the
// prompt assembly simply omits the tone layer.

const CITY_TONE: Record<string, string> = {
  backlund:
    "Backlund is the capital and the City of Dust: render it through soot-yellow fog, glittering class divides, opera and squalor within a carriage ride of each other, and the constant hum of political and Beyonder intrigue beneath a five-million-strong metropolis.",
  trier:
    "Trier is the sunlit capital of the Intis Republic: render it through bright boulevards and golden sun-worship, bohemian arts and fashion, the simmering ferment of revolutionary politics, and the labyrinthine dark of the quarries and catacombs beneath the gated quartiers.",
  bayam:
    "Bayam is the colonial City of Generosity in the Rorsted Archipelago: render it through salt air and spice, crowded harbour bars thick with pirates and adventurers, the uneasy mingling of Loen rulers and island natives, and the drowned, hunted superstition of the Sea God beneath the curfewed nights.",
  pritz:
    "Pritz Harbor is the Loen Kingdom's chief naval port beneath the Hornacis range: render it through cold fog off grey water, anchored ironclads and the bustle of dockyards, marching sailors and marines, and the mountain wilds at the city's back where the old monasteries keep their watch.",
  enmat:
    "Enmat Harbor is a small, fog-drowned Loen coastal town: render it through narrow lamplit lanes and creaking fishing boats, close-mouthed locals and old sea-superstition, and a sense that the mist rolling off the water hides more than weather.",
  feysac:
    "Feysac is the frozen militarist empire of the God of Combat: render it through bitter cold and iron discipline, devout soldiers and martial faith, frontier towns walled against the northern wilds, and the ever-present threat of evil spirits and monsters beyond the firelight.",
};

/**
 * Return a one-sentence narration tone directive for the given location, or
 * `null` when the location maps to no city-specific tone. Matching is on the
 * location's first whitespace-delimited word, lowercased.
 */
export function cityNarrationDirective(location: string): string | null {
  const key = location.trim().toLowerCase().split(/\s+/)[0];
  if (!key) return null;
  return CITY_TONE[key] ?? null;
}
