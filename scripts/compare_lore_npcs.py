#!/usr/bin/env python3
"""
Compare wiki corpus characters with current lore NPCs.
Outputs tmp/npc_validation_report.json with missing and matched breakdowns.
"""

import json
import re
from collections import defaultdict
from pathlib import Path

WIKI_AUDIT = Path("corpus/audit_wiki_npcs.json")
LORE_NPCS = Path("tmp/current_lore_npcs.json")
OUT_PATH = Path("tmp/npc_validation_report.json")


def normalize_name(name: str) -> str:
    """Strip parenthetical disambiguation and normalize whitespace."""
    name = name.split("(")[0].strip()
    name = re.sub(r"\s+", " ", name)
    return name.lower()


def build_lore_lookup(lore: dict, redirect_map: dict) -> dict:
    """Build normalized name -> original name lookup, including redirect aliases.

    If a lore name equals a redirect source (e.g. 'Giant King Aurmir'),
    also register the canonical target (e.g. 'Aurmir') as matching that lore name.
    Also handles first-word matches for formal full names (e.g. 'Ludwig Phil' -> 'Ludwig').
    """
    lookup = {}
    for name in lore.keys():
        norm = normalize_name(name)
        lookup[norm] = name
        # If this lore name is a redirect source, also map the target
        if name in redirect_map:
            target = redirect_map[name]
            lookup[normalize_name(target)] = name

    # Add first-word aliases for single-word lore names (e.g. 'Ludwig' matches 'Ludwig Phil')
    skip_prefixes = {"mr", "mrs", "ms", "dr", "miss", "sir", "lord", "lady"}
    for name in lore.keys():
        parts = normalize_name(name).split()
        if len(parts) == 1:
            first = parts[0]
            if first and first not in skip_prefixes and len(first) > 2 and first not in lookup:
                lookup[first] = name
    return lookup


def match_name(wiki_name: str, lore_lookup: dict) -> str | None:
    """Find a lore name matching the wiki name with normalization and aliases."""
    norm = normalize_name(wiki_name)
    if norm in lore_lookup:
        return lore_lookup[norm]
    # Try first word of wiki name
    first = norm.split()[0]
    if first in lore_lookup:
        return lore_lookup[first]
    return None


def main():
    wiki = json.loads(WIKI_AUDIT.read_text())
    lore = json.loads(LORE_NPCS.read_text())
    redirect_map = wiki.get("redirect_map", {})
    lore_lookup = build_lore_lookup(lore, redirect_map)
    lore_names_lower = set(lore_lookup.keys())

    matched = []
    missing = []

    # Track missing by pathway and sequence
    missing_by_pathway_sequence: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    missing_unmapped = []
    missing_non_beyonder = []

    # Process mapped Beyonders
    for pathway, seqs in wiki["pathways"].items():
        for seq, names in seqs.items():
            for name in names:
                lore_match = match_name(name, lore_lookup)
                if lore_match:
                    matched.append({
                        "wiki_name": name,
                        "lore_name": lore_match,
                        "pathway": pathway,
                        "sequence": seq,
                    })
                else:
                    entry = {"wiki_name": name, "pathway": pathway, "sequence": seq}
                    missing.append(entry)
                    missing_by_pathway_sequence[pathway][seq].append(entry)

    # Process unmapped characters (may be Beyonders with unknown rank or non-Beyonders)
    for entry in wiki["unmapped"]:
        name = entry["wiki_title"]
        lore_match = match_name(name, lore_lookup)
        if lore_match:
            matched.append({
                "wiki_name": name,
                "lore_name": lore_match,
                "pathway": entry.get("pathway_inferred"),
                "sequence": "unknown",
            })
        else:
            missing_entry = {
                "wiki_name": name,
                "pathway": entry.get("pathway_inferred"),
                "sequence": "unknown",
                "pathway_raw": entry.get("pathway_raw"),
                "sequence_rank_raw": entry.get("sequence_rank_raw"),
                "sequence_name": entry.get("sequence_name"),
                "vital_status": entry.get("vital_status"),
            }
            missing.append(missing_entry)
            if entry.get("pathway_inferred"):
                missing_by_pathway_sequence[entry["pathway_inferred"]]["unknown"].append(missing_entry)
            else:
                missing_non_beyonder.append(missing_entry)

    # Lore NPCs not found in wiki at all
    wiki_names = set()
    for pathway, seqs in wiki["pathways"].items():
        for seq, names in seqs.items():
            for name in names:
                wiki_names.add(normalize_name(name))
                # Also add redirect target canonical form
                if name in redirect_map:
                    wiki_names.add(normalize_name(redirect_map[name]))
                # Also add first word
                wiki_names.add(normalize_name(name).split()[0])
    for entry in wiki["unmapped"]:
        name = entry["wiki_title"]
        wiki_names.add(normalize_name(name))
        if name in redirect_map:
            wiki_names.add(normalize_name(redirect_map[name]))
        wiki_names.add(normalize_name(name).split()[0])

    lore_not_in_wiki = []
    for name, data in lore.items():
        norm = normalize_name(name)
        if norm not in wiki_names and norm.split()[0] not in wiki_names:
            lore_not_in_wiki.append({"lore_name": name, "pathways": data["pathways"], "sequences": data["sequences"]})

    report = {
        "summary": {
            "wiki_character_pages": wiki["total_character_pages"],
            "wiki_mapped_beyonders": wiki["mapped_count"],
            "wiki_unmapped": wiki["unmapped_count"],
            "current_lore_npcs": len(lore),
            "matched_count": len(matched),
            "missing_count": len(missing),
            "lore_not_in_wiki_count": len(lore_not_in_wiki),
        },
        "missing_by_pathway_sequence": {
            pathway: {
                seq: [e["wiki_name"] for e in chars]
                for seq, chars in sorted(seqs.items(), key=lambda x: (str(x[0])))
            }
            for pathway, seqs in sorted(missing_by_pathway_sequence.items())
        },
        "missing_non_beyonders": [e["wiki_name"] for e in missing_non_beyonder],
        "missing_full": missing,
        "matched": matched,
        "lore_not_in_wiki": lore_not_in_wiki,
    }

    OUT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Wrote {OUT_PATH}")
    print(f"Matched: {len(matched)}, Missing: {len(missing)}, Lore not in wiki: {len(lore_not_in_wiki)}")


if __name__ == "__main__":
    main()
