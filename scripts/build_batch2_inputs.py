#!/usr/bin/env python3
"""Build the Batch 2 (Seq 3-4 Saints & demigods) workflow inputs.

Reads the freshly-regenerated audit + validation report and emits:
  tmp/batch2_tasklist.json       — [{pathway, sequence, name, page, page_found}]
                                    for the NEW Seq 3/4/saint? figures (carryover
                                    saints excluded — they already have drafts).
  tmp/batch2_corpus_bundle.json  — {name: {title, found, wikitext}} for every
                                    candidate incl. carryover, so the draft/verify
                                    agents get canon source inline.
  tmp/existing_npc_slugs.json    — all slugs currently in src/lib/lore/*.ts, for
                                    the assembler's collision check.

Dev-only. Run after the audit/compare chain:
    python3 scripts/build_batch2_inputs.py
"""

import glob
import json
import os
import re
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT = os.path.join(REPO, "tmp", "npc_validation_report.json")
AUDIT = os.path.join(REPO, "corpus", "audit_wiki_npcs.json")
XML = os.path.join(REPO, "corpus", "wiki", "lordofthemystery_pages_current.xml")
LORE_DIR = os.path.join(REPO, "src", "lib", "lore")
TMP = os.path.join(REPO, "tmp")

# The 7 saints drafted+verified during Batch 1 and held back — handled via
# tmp/batch2_carryover_saints.json (verify-only), not re-drafted here.
CARRYOVER = {
    "Floren Sauron", "Gandalf", "Ma'am Greed", "Miss Sloth",
    "Mr. Envy", "Mr. Gluttony", "Mr. Lust",
}

BUCKETS = ["3", "4", "saint?"]


def load_pages() -> dict:
    """title -> wikitext, via robust XML parsing (the linear regex in
    get_wiki_page.py mis-pairs titles/texts on some pages)."""
    ns = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}
    root = ET.parse(XML).getroot()
    pages = {}
    for page in root.findall(".//mw:page", ns):
        title_el = page.find("mw:title", ns)
        text_el = page.find(".//mw:text", ns)
        if title_el is None or title_el.text is None:
            continue
        pages[title_el.text.strip()] = text_el.text if text_el is not None and text_el.text else ""
    return pages


def existing_slugs() -> list:
    slugs = set()
    for path in glob.glob(os.path.join(LORE_DIR, "*.ts")):
        text = open(path, encoding="utf-8").read()
        for m in re.finditer(r'slug:\s*"([^"]+)"', text):
            slugs.add(m.group(1))
    return sorted(slugs)


def main() -> int:
    report = json.load(open(REPORT))
    redirects = json.load(open(AUDIT)).get("redirect_map", {})
    redirect_lower = {k.lower(): v for k, v in redirects.items()}
    pages = load_pages()

    def fetch(name):
        txt = pages.get(name)
        title = name
        if txt is None:
            target = redirect_lower.get(name.lower())
            if target and target in pages:
                txt, title = pages[target], target
        return title, txt

    mbps = report["missing_by_pathway_sequence"]
    tasklist = []
    bundle = {}
    for pw in sorted(mbps):
        for bucket in BUCKETS:
            for name in mbps[pw].get(bucket, []):
                title, txt = fetch(name)
                bundle[name] = {
                    "title": title,
                    "found": txt is not None,
                    "wikitext": txt or "",
                }
                if name in CARRYOVER:
                    continue
                tasklist.append({
                    "pathway": pw,
                    "sequence": bucket,   # "3" | "4" | "saint?" (verifier finalizes)
                    "name": name,
                    "page": title,
                    "page_found": txt is not None,
                })

    # Also bundle the carryover saints (verify-only needs their source too).
    for name in CARRYOVER:
        if name not in bundle:
            title, txt = fetch(name)
            bundle[name] = {"title": title, "found": txt is not None, "wikitext": txt or ""}

    os.makedirs(TMP, exist_ok=True)
    json.dump(tasklist, open(os.path.join(TMP, "batch2_tasklist.json"), "w"),
              ensure_ascii=False, indent=2)
    json.dump(bundle, open(os.path.join(TMP, "batch2_corpus_bundle.json"), "w"),
              ensure_ascii=False, indent=2)
    json.dump(existing_slugs(), open(os.path.join(TMP, "existing_npc_slugs.json"), "w"),
              ensure_ascii=False, indent=2)

    found = sum(1 for t in tasklist if t["page_found"])
    missing_pages = [t["name"] for t in tasklist if not t["page_found"]]
    print(f"tasklist: {len(tasklist)} new candidates ({found} with a wiki page)")
    print(f"corpus bundle: {len(bundle)} pages (incl. {len(CARRYOVER)} carryover)")
    print(f"existing slugs: {len(existing_slugs())}")
    if missing_pages:
        print(f"\nNO WIKI PAGE (candidate for drop): {missing_pages}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
