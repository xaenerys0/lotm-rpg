#!/usr/bin/env python3
"""
Validate that the sequence names in our pathway lore files match the wiki corpus.
Outputs tmp/pathway_sequence_validation.json and a markdown summary.
"""

import json
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

WIKI_XML = Path("corpus/wiki/lordofthemystery_pages_current.xml")
LORE_INDEX = Path("src/lib/lore/index.ts")
OUT_JSON = Path("tmp/pathway_sequence_validation.json")
OUT_MD = Path("tmp/pathway_sequence_validation.md")

PATHWAY_TITLE_MAP = {
    "fool": "Fool Pathway",
    "visionary": "Visionary Pathway",
    "sun": "Sun Pathway",
    "death": "Death Pathway",
    "darkness": "Darkness Pathway",
    "tyrant": "Tyrant Pathway",
    "door": "Door Pathway",
    "hanged-man": "Hanged Man Pathway",
    "white-tower": "White Tower Pathway",
    "twilight-giant": "Twilight Giant Pathway",
    "justiciar": "Justiciar Pathway",
    "black-emperor": "Black Emperor Pathway",
    "red-priest": "Red Priest Pathway",
    "demoness": "Demoness Pathway",
    "mother": "Mother Pathway",
    "moon": "Moon Pathway",
    "hermit": "Hermit Pathway",
    "paragon": "Paragon Pathway",
    "wheel-of-fortune": "Wheel of Fortune Pathway",
    "abyss": "Abyss Pathway",
    "chained": "Chained Pathway",
    "error": "Error Pathway",
}


def parse_wiki_pathway_sequences():
    ns = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}
    tree = ET.parse(WIKI_XML)
    root = tree.getroot()
    result = {}
    for page in root.findall(".//mw:page", ns):
        title = page.find("mw:title", ns).text
        text_el = page.find(".//mw:text", ns)
        if text_el is None or not text_el.text:
            continue
        text = text_el.text
        if title not in PATHWAY_TITLE_MAP.values():
            continue

        # Extract |sequence N = {{Seq|Name}} from Pathway Index or Sequence Levels
        seqs = {}
        for m in re.finditer(r"\|\s*sequence\s*(\d+)\s*=\s*\{\{Seq\|([^}]+)\}\}", text):
            rank = int(m.group(1))
            name = m.group(2).strip()
            seqs[rank] = name
        # Fallback: plain text sequence list
        if not seqs:
            section = re.search(r"==Sequence Levels==(.+?)(?:==|$)", text, re.DOTALL)
            if section:
                for m in re.finditer(r"\|\s*sequence\s*(\d+)\s*=\s*([^\n]+)", section.group(1)):
                    rank = int(m.group(1))
                    name = re.sub(r"\{\{[^}]+\}\}", "", m.group(2)).strip()
                    seqs[rank] = name
        result[title] = seqs
    return result


def parse_lore_pathway_sequences():
    """Grep sequence names from our TS pathway files via title slugs."""
    text = LORE_INDEX.read_text()
    import_map = {}
    for slug, title in PATHWAY_TITLE_MAP.items():
        var_name = None
        # e.g. "import { FOOL_PATHWAY_LORE } from ..."
        m = re.search(rf"import\s+\{{\s*([A-Z_]+_PATHWAY_LORE)\s*\}}\s+from\s+['\"]\./pathway-{re.escape(slug)}['\"]", text)
        if m:
            var_name = m.group(1)
        import_map[slug] = var_name

    # For now we can't easily execute TS here, so we will regex each pathway file
    lore_seqs = {}
    for slug in PATHWAY_TITLE_MAP.keys():
        file_path = Path(f"src/lib/lore/pathway-{slug}.ts")
        if not file_path.exists():
            continue
        ft = file_path.read_text()
        seqs = {}
        # Match slugs like fool-seq9-seer or titles like "Seer"
        for m in re.finditer(rf"{re.escape(slug)}-seq(\d+)-([a-z-]+)", ft):
            rank = int(m.group(1))
            name_slug = m.group(2)
            # Convert slug to title-ish
            name = " ".join(w.capitalize() for w in name_slug.replace("-", " ").split())
            seqs[rank] = name
        lore_seqs[slug] = seqs
    return lore_seqs


def main():
    wiki_seqs = parse_wiki_pathway_sequences()
    lore_seqs = parse_lore_pathway_sequences()

    def normalize(n):
        return re.sub(r"[^a-z0-9]", "", n.lower())

    mismatches = defaultdict(list)
    missing_in_lore = defaultdict(list)
    missing_in_wiki = defaultdict(list)
    matched = defaultdict(list)

    for slug, title in PATHWAY_TITLE_MAP.items():
        wiki = wiki_seqs.get(title, {})
        lore = lore_seqs.get(slug, {})
        for rank in range(0, 10):
            w = wiki.get(rank)
            l = lore.get(rank)
            if not w and not l:
                continue
            if not l:
                missing_in_lore[slug].append({"sequence": rank, "wiki_name": w})
            elif not w:
                missing_in_wiki[slug].append({"sequence": rank, "lore_name": l})
            elif normalize(w) != normalize(l):
                mismatches[slug].append({"sequence": rank, "wiki": w, "lore": l})
            else:
                matched[slug].append({"sequence": rank, "name": w})

    report = {
        "matched": {k: v for k, v in matched.items() if v},
        "mismatches": {k: v for k, v in mismatches.items() if v},
        "missing_in_lore": {k: v for k, v in missing_in_lore.items() if v},
        "missing_in_wiki": {k: v for k, v in missing_in_wiki.items() if v},
    }
    OUT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    # Markdown summary
    lines = ["# Pathway Sequence Name Validation"]
    total_matched = sum(len(v) for v in matched.values())
    total_mismatches = sum(len(v) for v in mismatches.values())
    total_missing_lore = sum(len(v) for v in missing_in_lore.values())
    total_missing_wiki = sum(len(v) for v in missing_in_wiki.values())
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Matched sequence names: **{total_matched}**")
    lines.append(f"- Mismatched names: **{total_mismatches}**")
    lines.append(f"- Sequences present in wiki but missing from lore files: **{total_missing_lore}**")
    lines.append(f"- Sequences present in lore but not found in wiki: **{total_missing_wiki}**")
    lines.append("")

    if mismatches:
        lines.append("## Mismatches")
        lines.append("")
        for slug, items in sorted(mismatches.items()):
            lines.append(f"### {slug}")
            for item in items:
                lines.append(f"- Sequence {item['sequence']}: wiki **{item['wiki']}** vs lore **{item['lore']}**")
            lines.append("")

    if missing_in_lore:
        lines.append("## Missing from Lore Files")
        lines.append("")
        for slug, items in sorted(missing_in_lore.items()):
            lines.append(f"### {slug}")
            for item in items:
                lines.append(f"- Sequence {item['sequence']}: {item['wiki_name']}")
            lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_JSON} and {OUT_MD}")
    print(f"Matched: {total_matched}, Mismatches: {total_mismatches}, Missing in lore: {total_missing_lore}, Missing in wiki: {total_missing_wiki}")


if __name__ == "__main__":
    main()
