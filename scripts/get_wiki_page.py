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
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XML = os.path.join(REPO, "corpus", "wiki", "lordofthemystery_pages_current.xml")
AUDIT = os.path.join(REPO, "corpus", "audit_wiki_npcs.json")


def unescape(t: str) -> str:
    return (
        t.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&amp;", "&")
    )


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: get_wiki_page.py <page title>", file=sys.stderr)
        return 2
    name = sys.argv[1].strip()
    xml = open(XML, encoding="utf-8").read()
    pages = {
        m.group(1).strip(): m.group(2)
        for m in re.finditer(
            r"<title>(.*?)</title>.*?<text[^>]*>(.*?)</text>", xml, re.S
        )
    }
    txt = pages.get(name)
    if txt is None and os.path.exists(AUDIT):
        redirects = json.load(open(AUDIT)).get("redirect_map", {})
        lower = {k.lower(): v for k, v in redirects.items()}
        target = lower.get(name.lower())
        if target and target in pages:
            txt = pages[target]
            print(f"# (redirected: {name} -> {target})", file=sys.stderr)
    if txt is None:
        print(f"# NO PAGE FOUND for {name!r}", file=sys.stderr)
        return 1
    print(unescape(txt))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
