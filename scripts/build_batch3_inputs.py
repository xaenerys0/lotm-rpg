#!/usr/bin/env python3
"""Build the Batch 3 workflow inputs — city-level Beyonders + a Seq 1-2 angel cleanup.

Two candidate groups with DIFFERENT keying conventions:
  - "city"  : Seq 5-9 + unknown Beyonders tied to an active city. Emitted
              CITY-keyed and NOT pathway-keyed (the leak rule — a pathway field
              injects a regional NPC into every same-pathway prompt). Includes
              the two Batch-1 dropouts Basil + Kaslana.
  - "angel" : Seq 1-2 gods/angels Batch 1 missed (surfaced by the audit-parser
              fix). Emitted pathway-keyed like Batch 1/2.

Emits:
  tmp/batch3_tasklist.json       — [{group, name, pathway|cities, sequence, page, page_found}]
  tmp/batch3_corpus_bundle.json  — {name: {title, found, wikitext}}
  tmp/existing_npc_slugs.json    — all slugs in src/lib/lore/*.ts (collision check)

Dev-only. Run after the audit/compare chain: python3 scripts/build_batch3_inputs.py
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

CITY_SEQS = {"5", "6", "7", "8", "9", "unknown", "-2"}
ANGEL_SEQS = {"1", "2"}

# city slug -> wiki name token used in residence / category detection.
CITIES = {
    "tingen": "Tingen", "backlund": "Backlund", "trier": "Trier", "bayam": "Bayam",
    "constant": "Constant", "pritz": "Pritz", "feysac": "Feysac", "balam": "Balam",
}
# Batch-1 dropouts to fold into the city group; cities pre-assigned where known.
EXTRA_CITY = {"Basil": [], "Kaslana": ["backlund"]}


def load_pages() -> dict:
    ns = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}
    root = ET.parse(XML).getroot()
    pages = {}
    for page in root.findall(".//mw:page", ns):
        t = page.find("mw:title", ns)
        tx = page.find(".//mw:text", ns)
        if t is not None and t.text:
            pages[t.text.strip()] = tx.text if tx is not None and tx.text else ""
    return pages


def detect_cities(txt: str) -> list:
    m = re.search(r"\|\s*residence\s*=([^\n]*)", txt)
    res = m.group(1) if m else ""
    hits = []
    for slug, name in CITIES.items():
        if re.search(rf"\b{name}\b", res) or re.search(rf"Category:[^\]]*\b{name}\b", txt):
            hits.append(slug)
    return hits


def existing_slugs() -> list:
    slugs = set()
    for path in glob.glob(os.path.join(LORE_DIR, "*.ts")):
        for m in re.finditer(r'slug:\s*"([^"]+)"', open(path, encoding="utf-8").read()):
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
    tasklist, bundle = [], {}

    def add_bundle(name):
        if name not in bundle:
            title, txt = fetch(name)
            bundle[name] = {"title": title, "found": txt is not None, "wikitext": txt or ""}
        return bundle[name]

    # ---- city group: Seq 5-9 + unknown with an active-city signal ----
    seen_city = set()
    for pw, seqs in mbps.items():
        for b, names in seqs.items():
            if b not in CITY_SEQS:
                continue
            for name in names:
                title, txt = fetch(name)
                cities = detect_cities(txt or "")
                if not cities or name in seen_city:
                    continue
                seen_city.add(name)
                add_bundle(name)
                tasklist.append({
                    "group": "city", "name": name, "cities": cities,
                    "sequence": b, "page": title, "page_found": txt is not None,
                })
    # Basil + Kaslana
    for name, cities in EXTRA_CITY.items():
        if name in seen_city:
            continue
        title, txt = fetch(name)
        add_bundle(name)
        tasklist.append({
            "group": "city", "name": name, "cities": cities,
            "sequence": "unknown", "page": title, "page_found": txt is not None,
        })

    # ---- angel group: Seq 1-2 gods/angels Batch 1 missed ----
    for pw, seqs in mbps.items():
        for b in ANGEL_SEQS:
            for name in seqs.get(b, []):
                title, txt = fetch(name)
                add_bundle(name)
                tasklist.append({
                    "group": "angel", "name": name, "pathway": pw,
                    "sequence": b, "page": title, "page_found": txt is not None,
                })

    os.makedirs(TMP, exist_ok=True)
    json.dump(tasklist, open(os.path.join(TMP, "batch3_tasklist.json"), "w"), ensure_ascii=False, indent=2)
    json.dump(bundle, open(os.path.join(TMP, "batch3_corpus_bundle.json"), "w"), ensure_ascii=False, indent=2)
    json.dump(existing_slugs(), open(os.path.join(TMP, "existing_npc_slugs.json"), "w"), ensure_ascii=False, indent=2)

    city = [t for t in tasklist if t["group"] == "city"]
    angel = [t for t in tasklist if t["group"] == "angel"]
    nopage = [t["name"] for t in tasklist if not t["page_found"]]
    print(f"city group: {len(city)} | angel group: {len(angel)} | total: {len(tasklist)}")
    print(f"corpus bundle: {len(bundle)} pages | existing slugs: {len(existing_slugs())}")
    if nopage:
        print(f"\nNO WIKI PAGE (verify/drop): {nopage}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
