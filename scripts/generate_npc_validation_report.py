#!/usr/bin/env python3
"""
Generate a human-readable markdown report from tmp/npc_validation_report.json.
"""

import json
from collections import defaultdict
from pathlib import Path

REPORT_JSON = Path("tmp/npc_validation_report.json")
OUT_MD = Path("tmp/npc_validation_report.md")


def main():
    r = json.loads(REPORT_JSON.read_text())

    lines = []
    lines.append("# NPC Validation Report: Lore vs. Wiki Corpus")
    lines.append("")
    s = r["summary"]
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Wiki character pages scanned: **{s['wiki_character_pages']}**")
    lines.append(f"- Wiki Beyonders with pathway/sequence: **{s['wiki_mapped_beyonders']}**")
    lines.append(f"- Wiki characters without pathway/sequence info: **{s['wiki_unmapped']}**")
    lines.append(f"- Current unique NPC names in lore: **{s['current_lore_npcs']}**")
    lines.append(f"- Matched (in both lore and wiki): **{s['matched_count']}**")
    lines.append(f"- Missing from lore (present in wiki): **{s['missing_count']}**")
    lines.append(f"- Lore names not found in wiki (likely aliases or typos): **{s['lore_not_in_wiki_count']}**")
    lines.append("")

    lines.append("## Missing Beyonders by Pathway and Sequence")
    lines.append("")
    lines.append("Characters that have a known pathway and sequence in the wiki but are not yet represented in the lore system.")
    lines.append("")

    # Sort pathways by total missing count (descending)
    pathway_totals = {
        pathway: sum(len(names) for names in seqs.values())
        for pathway, seqs in r["missing_by_pathway_sequence"].items()
    }
    for pathway in sorted(pathway_totals.keys(), key=lambda p: -pathway_totals[p]):
        seqs = r["missing_by_pathway_sequence"][pathway]
        total = pathway_totals[pathway]
        lines.append(f"### {pathway.replace('-', ' ').title()} Pathway ({total} missing)")
        lines.append("")
        # Sort sequences: numeric where possible, then "unknown"
        def seq_key(item):
            seq = item[0]
            if seq == "unknown":
                return (1, 999)
            try:
                return (0, int(seq))
            except ValueError:
                return (1, 0)

        for seq, names in sorted(seqs.items(), key=seq_key):
            label = f"Sequence {seq}" if seq != "unknown" else "Known pathway, unknown sequence"
            lines.append(f"- **{label}** ({len(names)}): {', '.join(names)}")
        lines.append("")

    lines.append("## Missing Non-Beyonders / Unmapped Characters")
    lines.append("")
    lines.append(f"These {len(r['missing_non_beyonders'])} wiki characters have no inferred pathway/sequence in the corpus. They may be non-Beyonders, spoilers from Book 2, or infoboxes lacking Beyonder data. A sample is shown; see `tmp/npc_validation_report.json` for the full list.")
    lines.append("")
    for name in r["missing_non_beyonders"][:80]:
        lines.append(f"- {name}")
    if len(r["missing_non_beyonders"]) > 80:
        lines.append(f"- ... and {len(r['missing_non_beyonders']) - 80} more")
    lines.append("")

    if r["lore_not_in_wiki"]:
        lines.append("## Lore Names Not Found in Wiki")
        lines.append("")
        lines.append("These names appear in the lore but could not be matched to any wiki page. They are typically aliases of existing characters or minor original characters.")
        lines.append("")
        for e in r["lore_not_in_wiki"]:
            lines.append(f"- **{e['lore_name']}** (pathways: {e['pathways']}, sequences: {e['sequences']})")
        lines.append("")

    lines.append("## How to Use This Report")
    lines.append("")
    lines.append("1. Start with high-sequence gaps (Sequence 0 gods, Sequence 1-2 angels, Sequence 4 saints) — these have the biggest narrative impact.")
    lines.append("2. Fill named low-sequence Beyonders for regions/cities currently in play (Tingen, Backlund, etc.).")
    lines.append("3. Add non-Beyonder NPCs only when they are needed for city/epoch color or specific plot hooks.")
    lines.append("4. Re-run `python3 scripts/audit_wiki_npcs.py && python3 scripts/compare_lore_npcs.py` after adding NPCs to update the report.")
    lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_MD}")


if __name__ == "__main__":
    main()
