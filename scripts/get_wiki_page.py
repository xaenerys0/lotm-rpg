#!/usr/bin/env python3
"""Extract a single character/page's wikitext from the LOTM wiki corpus dump.

Dev-only helper used when fact-checking authored lore against canon
(corpus/wiki/lordofthemystery_pages_current.xml). Resolves one level of
redirect via corpus/audit_wiki_npcs.json when present.

Usage:
    python3 scripts/get_wiki_page.py "Hermes"
    python3 scripts/get_wiki_page.py "Evernight Goddess"
"""

import json
import os
import sys
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XML = os.path.join(REPO, "corpus", "wiki", "lordofthemystery_pages_current.xml")
AUDIT = os.path.join(REPO, "corpus", "audit_wiki_npcs.json")


def load_pages() -> dict:
    """title -> wikitext. Uses XML parsing rather than a linear regex, which
    mis-pairs <title>/<text> across some pages (e.g. 'Crestet Cesimir')."""
    ns = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}
    root = ET.parse(XML).getroot()
    pages = {}
    for page in root.findall(".//mw:page", ns):
        title_el = page.find("mw:title", ns)
        text_el = page.find(".//mw:text", ns)
        if title_el is None or title_el.text is None:
            continue
        pages[title_el.text.strip()] = (
            text_el.text if text_el is not None and text_el.text else ""
        )
    return pages


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: get_wiki_page.py <page title>", file=sys.stderr)
        return 2
    name = sys.argv[1].strip()
    pages = load_pages()
    txt = pages.get(name)
    if txt is None and os.path.exists(AUDIT):
        with open(AUDIT, encoding="utf-8") as fh:
            redirects = json.load(fh).get("redirect_map", {})
        lower = {k.lower(): v for k, v in redirects.items()}
        target = lower.get(name.lower())
        if target and target in pages:
            txt = pages[target]
            print(f"# (redirected: {name} -> {target})", file=sys.stderr)
    if txt is None:
        print(f"# NO PAGE FOUND for {name!r}", file=sys.stderr)
        return 1
    print(txt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
