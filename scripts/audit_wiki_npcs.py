#!/usr/bin/env python3
"""
Audit wiki corpus for NPCs (character pages) and their pathway/sequence info.
Outputs corpus/audit_wiki_npcs.json with:
  - pathway -> sequence_rank -> list of character pages
  - unmapped characters (no sequence info or non-standard pathway)
  - summary counts
"""

import json
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

WIKI_XML = Path("corpus/wiki/lordofthemystery_pages_current.xml")
OUT_PATH = Path("corpus/audit_wiki_npcs.json")

PATHWAY_SLUG_MAP = {
    "Fool": "fool",
    "Error": "error",
    "Door": "door",
    "Visionary": "visionary",
    "Sun": "sun",
    "Tyrant": "tyrant",
    "Hanged Man": "hanged-man",
    "Death": "death",
    "Darkness": "darkness",
    "Twilight Giant": "twilight-giant",
    "White Tower": "white-tower",
    "Justiciar": "justiciar",
    "Black Emperor": "black-emperor",
    "Red Priest": "red-priest",
    "Demoness": "demoness",
    "Mother": "mother",
    "Moon": "moon",
    "Hermit": "hermit",
    "Paragon": "paragon",
    "Wheel of Fortune": "wheel-of-fortune",
    "Abyss": "abyss",
    "Chained": "chained",
}

# Pathway aliases from novel/wiki
PATHWAY_ALIASES = {
    "Seer": "fool",
    "Mysteries": "fool",
    "Sleepless": "darkness",
    "Warrior": "twilight-giant",
    "Reader": "white-tower",
    "Bard": "sun",
    "Sailor": "tyrant",
    "Gladiator": "red-priest",
    "Hunter": "red-priest",
    "Assassin": "demoness",
    "Prisoner": "chained",
    "Criminal": "abyss",
    "Apothecary": "mother",
    "Beast Tamer": "moon",
    "Planter": "mother",
    "Mystery Pryer": "hermit",
    "Marauder": "error",
    "Savant": "paragon",
    "Monster": "wheel-of-fortune",
    "Lawyer": "black-emperor",
    "Arbiter": "justiciar",
    "Apprentice": "door",
    "Baron": "door",
}


def normalize_pathway(value: str | None) -> str | None:
    if not value:
        return None
    v = value.strip()
    # Strip "Pathway" suffix
    if v.endswith(" Pathway"):
        v = v[:-8].strip()
    if v in PATHWAY_SLUG_MAP:
        return PATHWAY_SLUG_MAP[v]
    if v in PATHWAY_ALIASES:
        return PATHWAY_ALIASES[v]
    # Lowercase lookup
    lower = v.lower()
    for name, slug in PATHWAY_SLUG_MAP.items():
        if name.lower() == lower or slug == lower:
            return slug
    return None


def parse_infobox(text: str) -> dict:
    """Extract key infobox fields from Char temp template."""
    info = {}
    m = re.search(r"\{\{[Cc]har[_\s]temp\b", text)
    if not m:
        return info
    start = m.start()
    depth = 0
    end = start
    i = start
    while i < len(text):
        if text[i:i+2] == "{{":
            depth += 1
            i += 2
        elif text[i:i+2] == "}}":
            depth -= 1
            i += 2
            if depth == 0:
                end = i
                break
        else:
            i += 1
    box = text[start:end]

    # Extract fields robustly - values may span multiple lines and contain templates
    base_fields = ["sequence_type", "sequence_rank", "sequence_name", "vital_status", "sex", "authorities", "pathway", "former_pathway", "additional_pathways"]
    # Also book2 variants
    fields = base_fields + [f"{f}(book2)" for f in base_fields]
    for field in fields:
        # Capture up to the end of the value's line(s), stopping at the next
        # infobox field (`| name =`, incl. `(book2)` variants) or the closing
        # `}}`. Use [ \t]* (not \s*) after `=` so a BLANK field yields empty
        # instead of swallowing subsequent lines — that over-capture is what
        # pulled spurious sequence numbers (e.g. a "1" from a later |novel=
        # citation) and mis-tiered blank-rank Saints.
        pattern = (
            r"\|\s*" + re.escape(field) + r"\s*=[ \t]*(.*?)\n"
            r"(?=\s*\|\s*[\w()]+\s*=|\s*\}\})"
        )
        fm = re.search(pattern, box, re.DOTALL)
        if fm:
            val = fm.group(1).strip()
            val = re.sub(r"<ref[^>]*/?>", "", val)
            val = re.sub(r"<[^>]+>", "", val)
            val = val.strip()
            if val:
                info[field] = val
    return info


def extract_sequence_number(rank: str | None) -> int | str | None:
    if not rank:
        return None
    r = rank.strip().lower()
    # Direct number
    m = re.search(r"\d+", r)
    if m:
        return int(m.group())
    # Text ranks - approximate to common tiers for grouping
    text_rank_map = {
        "saint": 4,
        "king of angels": 1,
        "angel": 2,
        "true god": 0,
        "god": 0,
        "above the sequence": -1,
        "uniqueness": -2,
        "low sequence": 8,      # roughly seq 7-9
        "mid sequence": 5,      # roughly seq 4-6
        "high sequence": 3,     # seq 0-3
    }
    for key, val in text_rank_map.items():
        if key in r:
            return val
    return None


CATEGORY_RE = re.compile(r"\[\[Category:([^\]|]+)", re.IGNORECASE)


def extract_categories(text: str) -> list[str]:
    """All [[Category:...]] tags on a page (title portion only)."""
    return [m.strip() for m in CATEGORY_RE.findall(text)]


def infer_sequence_from_categories(categories: list[str]) -> str | None:
    """Fallback tiering when sequence_rank is blank.

    The wiki tags Saint-tier figures with [[Category:Book One Saint]] /
    [[Category:Book Two Saint]] even when the infobox sequence_rank is empty
    (this is how the 7 carryover saints were originally lost to `unmapped` and
    then hand-mislabeled). The category can't distinguish Seq 3 from Seq 4, so
    return an ambiguous marker to surface the figure for per-candidate
    verification rather than guessing a concrete number.
    """
    for c in categories:
        # Match only the Saint RANK categories ("Saint", "Book One/Two Saint"),
        # not any category that merely contains the word (e.g. an org/place like
        # "Saint Samson Cathedral clergy"), which would mis-tier a low-Seq figure.
        if re.fullmatch(r"(?:book (?:one|two) )?saint", c.strip(), re.IGNORECASE):
            return "saint?"
    return None


def main():
    ns = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}
    tree = ET.parse(WIKI_XML)
    root = tree.getroot()

    # Build redirect map first
    redirect_map = {}
    for page in root.findall(".//mw:page", ns):
        title = page.find("mw:title", ns).text
        text_el = page.find(".//mw:text", ns)
        if text_el is None or not text_el.text:
            continue
        text = text_el.text.strip()
        m = re.match(r"#REDIRECT\s*\[\[(.+?)\]\]", text, re.IGNORECASE)
        if m:
            redirect_map[title] = m.group(1).strip()

    def resolve_redirect(title: str) -> str:
        seen = set()
        while title in redirect_map and title not in seen:
            seen.add(title)
            title = redirect_map[title]
        return title

    pathway_seq_chars: dict[str, dict[int, list[dict]]] = defaultdict(lambda: defaultdict(list))
    unmapped = []
    total_char_pages = 0

    for page in root.findall(".//mw:page", ns):
        raw_title = page.find("mw:title", ns).text
        ns_val = page.find("mw:ns", ns)
        # Skip template/forum/etc namespace pages (main articles are ns=0)
        if ns_val is not None and ns_val.text and ns_val.text != "0":
            continue

        text_el = page.find(".//mw:text", ns)
        if text_el is None or not text_el.text:
            continue
        text = text_el.text

        # Skip pure redirects (we already mapped them)
        if re.match(r"#REDIRECT\s*\[\[.+?\]\]", text.strip(), re.IGNORECASE):
            continue

        # Only character pages
        if not re.search(r"\{\{[Cc]har[_\s]temp\b", text[:2000]):
            continue
        total_char_pages += 1

        # Resolve redirect if this title is a known redirect target
        title = resolve_redirect(raw_title)

        info = parse_infobox(text)

        # Try to find pathway from multiple fields
        pathway = None
        for field in ["sequence_type", "sequence_type(book2)", "pathway", "pathway(book2)", "former_pathway", "former_pathway(book2)"]:
            pathway = normalize_pathway(info.get(field))
            if pathway:
                break

        # If still no pathway, try to extract from authorities field (e.g. {{Pathway|Fool|Error}})
        if not pathway:
            for field in ["authorities", "authorities(book2)"]:
                val = info.get(field, "")
                if val:
                    # Find all pathway slugs mentioned
                    for slug in PATHWAY_SLUG_MAP.values():
                        if re.search(rf"\b{re.escape(slug.replace('-', ' '))}\b", val, re.I):
                            pathway = slug
                            break
                    if pathway:
                        break

        seq_num = extract_sequence_number(info.get("sequence_rank") or info.get("sequence_rank(book2)"))
        seq_source = "sequence_rank" if seq_num is not None else None
        if seq_num is None:
            # Blank/unrecognized rank: fall back to Saint category tags so the
            # figure lands in a distinguishable bucket instead of generic unmapped.
            seq_num = infer_sequence_from_categories(extract_categories(text))
            if seq_num is not None:
                seq_source = "category-saint"
        seq_name = info.get("sequence_name") or info.get("sequence_name(book2)")
        status = info.get("vital_status", "") or info.get("vital_status(book2)", "")

        entry = {
            "wiki_title": title,
            "pathway_raw": info.get("sequence_type") or info.get("sequence_type(book2)"),
            "sequence_rank_raw": info.get("sequence_rank") or info.get("sequence_rank(book2)"),
            "sequence_name": seq_name,
            "vital_status": status,
            "seq_source": seq_source,
        }

        if pathway and seq_num is not None:
            pathway_seq_chars[pathway][seq_num].append(entry)
        elif pathway:
            # Known pathway but unknown sequence rank
            unmapped.append({**entry, "pathway_inferred": pathway})
        else:
            unmapped.append(entry)

    # Sort and build report
    report = {
        "total_character_pages": total_char_pages,
        "mapped_count": sum(len(chars) for seqs in pathway_seq_chars.values() for chars in seqs.values()),
        "unmapped_count": len(unmapped),
        "redirect_map": redirect_map,
        "pathways": {},
        "unmapped": unmapped,
    }

    # Sequence keys are mostly ints but may include the string "saint?" marker;
    # order ints numerically first, then string markers (never compare int to str).
    def seq_sort_key(kv):
        k = kv[0]
        return (1, str(k)) if isinstance(k, str) else (0, k)

    for pathway in sorted(pathway_seq_chars.keys()):
        seqs = pathway_seq_chars[pathway]
        report["pathways"][pathway] = {
            str(seq): sorted([c["wiki_title"] for c in chars])
            for seq, chars in sorted(seqs.items(), key=seq_sort_key)
        }

    OUT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Wrote {OUT_PATH}")
    print(f"Total character pages: {total_char_pages}")
    print(f"Mapped: {report['mapped_count']}, Unmapped: {report['unmapped_count']}")


if __name__ == "__main__":
    main()
