#!/usr/bin/env python3
"""Build the conservative, immutable Phase 2 Batch 4 NPC input manifest.

This is deliberately a selection aid, not an NPC generator: every selected
candidate carries its canonical wiki source and explicit verifier obligations.
"""

import glob
import hashlib
import json
import os
import re
import unicodedata
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(REPO, "tmp")
REPORT = os.path.join(TMP, "npc_validation_report.json")
AUDIT = os.path.join(REPO, "corpus", "audit_wiki_npcs.json")
LORE_IDENTITIES = os.path.join(TMP, "current_lore_npcs.json")
XML = os.path.join(REPO, "corpus", "wiki", "lordofthemystery_pages_current.xml")
LORE_DIR = os.path.join(REPO, "src", "lib", "lore")

ACTIVE_CITIES = {
    "tingen": "Tingen", "backlund": "Backlund", "trier": "Trier",
    "bayam": "Bayam", "constant": "Constant", "pritz": "Pritz",
    "feysac": "Feysac", "balam": "Balam", "enmat": "Enmat Harbor",
    "silver": "City of Silver", "giant": "Giant King's Court", "moon": "Moon City",
}
BAD_LABEL = re.compile(
    r"\b(author|creator|character tabs?|animal trainer|headmaster|doll messenger|"
    r"white paper|montsouris ghost|artifact|sealed|class |table|prototype|"
    r"isotope|matter|someone|sage|angel|god|goddess|deity|outer|cosmic|"
    r"creator|overseer|dominator|monarch|ravings|circle|mother tree|son of|"
    r"original|celestial|buddha|dragon|fiend|master of|breeder|holy monk)\b",
    re.I,
)
GENERIC_LABEL = re.compile(r"^(?:Mr\.?|Mrs\.?|Miss|Lady|Lord|Old)\s*$|\b(?:and|or)\b", re.I)
# These audit titles look like names at a glance, but are plainly collective,
# generic, meta, or real-world labels. Keep this small and conservative.
REJECTED_TITLES = {
    "Cuttlefish That Loves Diving", "Ed Sheeran", "Joyce Meyer", "Giant",
    "Worms", "Ultraman", "Carnot", "Batna Comté", "Jack",
}


def local_name(element):
    return element.tag.rsplit("}", 1)[-1]


def load_pages():
    """Read MediaWiki XML without regex pairing; include XML/text redirects."""
    pages, redirects = {}, {}
    for _, page in ET.iterparse(XML, events=("end",)):
        if local_name(page) != "page":
            continue
        title = text = redirect = None
        for child in page.iter():
            kind = local_name(child)
            if kind == "title" and child is not page:
                title = (child.text or "").strip()
            elif kind == "text":
                text = child.text or ""
            elif kind == "redirect":
                redirect = (child.attrib.get("title") or "").strip()
        if title:
            pages[title] = text or ""
            match = re.match(r"\s*#redirect\s*\[\[([^\]|#]+)", text or "", re.I)
            redirects[title] = redirect or (match.group(1).strip() if match else None)
        page.clear()
    return pages, {key: value for key, value in redirects.items() if value}


def norm(value):
    return re.sub(r"\s+", " ", value.split("(", 1)[0]).strip().casefold()


def slugify(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value))


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def existing_slugs():
    slugs = set()
    for path in glob.glob(os.path.join(LORE_DIR, "*.ts")):
        with open(path, encoding="utf-8") as source:
            slugs.update(re.findall(r'slug:\s*"([^"]+)"', source.read()))
    return sorted(slugs)


def aliases_from_wikitext(text, canonical_name):
    aliases = []
    for field in ("alias", "aliases", "also known as", "other names"):
        for match in re.finditer(rf"\|\s*{re.escape(field)}\s*=\s*([^\n]+)", text, re.I):
            value = match.group(1).strip()
            # Do not turn an adjacent infobox field or a template fragment into
            # an alias. Dropping a dubious alias is safer than emitting one.
            if re.search(r"[|={}]|{{|}}", value):
                continue
            value = re.sub(r"\[\[([^\]]+)\]\]", r"\1", value)
            for alias in re.split(r"<br\s*/?>|;|/", value, flags=re.I):
                alias = alias.strip(" '\t[]")
                if (alias and not re.search(r"[|={}]|{{|}}", alias)
                        and norm(alias) != norm(canonical_name) and alias not in aliases):
                    aliases.append(alias)
    return aliases


def city_hits(text, fields):
    # Infobox values can continue onto indented/list lines. Inspect only stable
    # location signals and stop at the next top-level pipe field.
    locations = re.findall(
        rf"^\s*\|\s*(?:{'|'.join(fields)})\s*=\s*"
        r"((?:[^\n]|\n(?!\s*\|))*)",
        text,
        re.I | re.M,
    )
    haystack = "\n".join(locations)
    hits = []
    for slug, city in ACTIVE_CITIES.items():
        # City NAMES are proper nouns (always capitalized as wiki links/titles),
        # so match case-SENSITIVELY — otherwise "Constant" the city false-matches
        # the adjective "constant" in prose/origin text.
        if re.search(rf"\b{re.escape(city)}\b", haystack):
            hits.append(slug)
    return hits


def active_cities(text):
    """Return stable city keys first, then only supplemental city signals.

    Residence/resident/location/city and a city of origin are keying evidence.
    Affiliation is intentionally not allowed to override a single stable city.
    Character-in-city categories are treated as stable location evidence.
    """
    stable = city_hits(text, ("residence", "resident", "location", "city", "origin"))
    for slug, city in ACTIVE_CITIES.items():
        if re.search(rf"\[\[Category:[^\]]*\b{re.escape(city)}\b", text) and slug not in stable:
            stable.append(slug)
    if stable:
        return stable
    return city_hits(text, (r"affiliation(?:\(s\))?",))


def confirmed_sequence(text, expected, locator):
    """Return only an exact, corpus-stated rank matching the audit value."""
    match = re.search(r"^\s*\|\s*sequence_rank\s*=\s*([^\n]+)", text, re.I | re.M)
    if not match:
        return None
    raw = match.group(1).strip()
    # Accept an annotated rank ("5", "5 (Desire Apostle)", "5{{c|...}}") by
    # reading the LEADING sequence digit, not only a bare digit.
    lead = re.match(r"(\d)\b", raw)
    if not lead or lead.group(1) != str(expected) or not 5 <= int(lead.group(1)) <= 9:
        return None
    return {
        "sequence": int(lead.group(1)),
        "evidenceLocator": locator,
        "evidenceExcerpt": f"sequence_rank = {raw}",
    }


def epoch_scoped_narrative_role(text, name, locator):
    """Require a concrete Fifth-Epoch role before allowing city-null mortals."""
    for block in re.split(r"\n\s*\n", text):
        plain = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", block)
        plain = re.sub(r"\[\[([^\]]+)\]\]", r"\1", plain)
        if (re.search(r"\b(?:Fifth|5th)\s+Epoch\b", plain, re.I)
                and re.search(rf"\b{re.escape(name)}\b", plain, re.I)):
            excerpt = re.sub(r"\s+", " ", plain).strip()
            return {
                "rationale": f"Corpus Fifth-Epoch narrative role: {excerpt[:300]}",
                "evidenceLocator": locator,
            }
    return None


def epoch(text, locator):
    match = re.search(r"\b(?:fifth|5th)\s+epoch\b", text, re.I)
    if match:
        return {"value": 5, "policy": "exact-known", "evidence": locator}
    return {"value": None, "policy": "provisional-needs-verifier", "source": locator}


def main():
    with open(REPORT, encoding="utf-8") as source:
        report = json.load(source)
    with open(AUDIT, encoding="utf-8") as source:
        audit = json.load(source)
    with open(LORE_IDENTITIES, encoding="utf-8") as source:
        lore = json.load(source)
    pages, xml_redirects = load_pages()
    redirects = {**audit.get("redirect_map", {}), **xml_redirects}
    title_lookup = {title.casefold(): title for title in pages}
    redirect_lookup = {key.casefold(): value for key, value in redirects.items()}
    lore_names = {norm(name) for name in lore}
    slugs = existing_slugs()
    source_locator_base = "corpus/wiki/lordofthemystery_pages_current.xml"
    exclusions = {"no-city-beyonder": [], "non-beyonder": []}
    candidate_identity_keys = set()

    def resolve(name):
        chain, seen, current = [], set(), name
        while current.casefold() not in seen:
            seen.add(current.casefold())
            exact = title_lookup.get(current.casefold(), current)
            target = redirect_lookup.get(current.casefold()) or redirect_lookup.get(exact.casefold())
            if not target:
                return exact, chain, pages.get(exact)
            chain.append(exact)
            current = target
        return current, chain, None

    def add(group, name, sequence, pathway=None):
        canonical_title, chain, text = resolve(name)
        if text is None:
            exclusions[group].append(f"{name}: no canonical wiki page")
            return None
        canonical_name = canonical_title.split("(", 1)[0].strip()
        if norm(name) in lore_names or norm(canonical_name) in lore_names:
            exclusions[group].append(f"{name}: already in current lore identities")
            return None
        slug_base = slugify(canonical_name)
        candidate_slug = f"npc-{slug_base}" if slug_base else ""
        if not candidate_slug or candidate_slug in slugs:
            exclusions[group].append(f"{name}: empty or colliding slug")
            return None
        locator = f"{source_locator_base}#{canonical_title}"
        corpus_sequence = None
        aliases = aliases_from_wikitext(text, canonical_name)
        identity_keys = {norm(canonical_name), *(norm(alias) for alias in aliases)}
        if identity_keys & lore_names:
            exclusions[group].append(f"{name}: canonical name or alias collides with current lore identity")
            return None
        if identity_keys & candidate_identity_keys:
            exclusions[group].append(f"{name}: canonical name or alias collides with another candidate")
            return None
        cities = active_cities(text)
        if group == "no-city-beyonder":
            if cities:
                exclusions[group].append(f"{name}: active-city signal ({', '.join(cities)})")
                return None
            corpus_sequence = confirmed_sequence(text, sequence, locator)
            if not corpus_sequence:
                exclusions[group].append(f"{name}: corpus does not confirm exact Seq {sequence}")
                return None
            key_policy = {"city": None, "pathway": None, "policy": "exact-no-city-no-pathway"}
            rationale = f"Missing audit-mapped named Seq {sequence} Beyonder with no active-city residence/category signal."
        else:
            key_policy = {
                "city": cities[0] if len(cities) == 1 else None,
                "pathway": None,
                "policy": "exact-stable-city" if len(cities) == 1 else "exact-no-pathway-city-null",
            }
            narrative = None if cities else epoch_scoped_narrative_role(text, canonical_name, locator)
            if not cities and not narrative:
                exclusions[group].append(f"{name}: city-null candidate lacks epoch-scoped narrative-role evidence")
                return None
            rationale = (narrative["rationale"] if narrative else
                         "Missing audit-unmapped named mortal/social candidate with stable city evidence; no pathway key is inferred.")
        # NOTE: identity_keys are reserved by the CALLER on commit (below), not
        # here — otherwise a candidate the caller drops for a within-run slug
        # collision would still reserve its aliases and reject a later valid one.
        return {
            "candidateId": f"batch4-{group}-{slug_base}",
            "canonicalWikiTitle": canonical_title,
            "redirectChain": chain,
            "canonicalName": canonical_name,
            "aliases": aliases,
            "group": group,
            "expectedSlug": candidate_slug,
            "audit": {"pathway": pathway, "sequence": int(sequence) if str(sequence).isdigit() else sequence},
            **({"corpusConfirmedSequence": corpus_sequence} if group == "no-city-beyonder" else {}),
            "expectedExactKeyPolicy": key_policy,
            "epoch": epoch(text, locator),
            "selectionRationale": rationale,
            "sourceLocator": locator,
        }, {"title": canonical_title, "redirectChain": chain, "found": True, "wikitext": text}, identity_keys

    candidates, bundle, used_names, used_slugs = [], {}, set(), set()
    for pathway in sorted(report["missing_by_pathway_sequence"]):
        for sequence in ("5", "6", "7", "8", "9"):
            for name in report["missing_by_pathway_sequence"][pathway].get(sequence, []):
                if len([c for c in candidates if c["group"] == "no-city-beyonder"]) >= 25:
                    break
                if name in used_names or name in REJECTED_TITLES or BAD_LABEL.search(name) or GENERIC_LABEL.search(name):
                    exclusions["no-city-beyonder"].append(f"{name}: non-individual/generic label")
                    continue
                result = add("no-city-beyonder", name, sequence, pathway)
                if result:
                    candidate, source, ikeys = result
                    if candidate["expectedSlug"] in used_slugs:
                        exclusions["no-city-beyonder"].append(
                            f"{name}: expectedSlug {candidate['expectedSlug']} collides with an already-selected candidate")
                    else:
                        candidates.append(candidate); bundle[candidate["candidateId"]] = source
                        used_names.add(name); used_slugs.add(candidate["expectedSlug"])
                        candidate_identity_keys.update(ikeys)
    for name in report["missing_non_beyonders"]:
        if len([c for c in candidates if c["group"] == "non-beyonder"]) >= 25:
            break
        if name in used_names or name in REJECTED_TITLES or BAD_LABEL.search(name) or GENERIC_LABEL.search(name):
            exclusions["non-beyonder"].append(f"{name}: rejected label")
            continue
        # A raw pathway/rank is evidence this is not safely classifiable as mortal/social.
        entry = next((item for item in report["missing_full"] if item["wiki_name"] == name), {})
        if entry.get("pathway_raw") or entry.get("sequence_rank_raw") or entry.get("sequence_name"):
            exclusions["non-beyonder"].append(f"{name}: possible Beyonder/other-pathway metadata")
            continue
        result = add("non-beyonder", name, "unknown")
        if result:
            candidate, source, ikeys = result
            if candidate["expectedSlug"] in used_slugs:
                exclusions["non-beyonder"].append(
                    f"{name}: expectedSlug {candidate['expectedSlug']} collides with an already-selected candidate")
            else:
                candidates.append(candidate); bundle[candidate["candidateId"]] = source
                used_names.add(name); used_slugs.add(candidate["expectedSlug"])
                candidate_identity_keys.update(ikeys)

    ids = [candidate["candidateId"] for candidate in candidates]
    assert len(ids) == len(set(ids)) and len(used_slugs) == len(candidates)
    assert all(candidate["expectedSlug"].startswith("npc-") for candidate in candidates)
    assert all(candidate["expectedSlug"] not in slugs for candidate in candidates)
    assert sum(c["group"] == "no-city-beyonder" for c in candidates) <= 25
    assert sum(c["group"] == "non-beyonder" for c in candidates) <= 25
    manifest = {
        "schemaVersion": 1,
        "immutable": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "inputs": {path: sha256(path) for path in (REPORT, AUDIT, LORE_IDENTITIES, XML)},
        "candidates": candidates,
        "exclusions": exclusions,
    }
    os.makedirs(TMP, exist_ok=True)
    for path, value in (("batch4_tasklist.json", manifest), ("batch4_corpus_bundle.json", bundle), ("existing_npc_slugs.json", slugs)):
        with open(os.path.join(TMP, path), "w", encoding="utf-8") as output:
            json.dump(value, output, ensure_ascii=False, indent=2)
            output.write("\n")
    print(f"no-city-beyonder: {sum(c['group'] == 'no-city-beyonder' for c in candidates)} | non-beyonder: {sum(c['group'] == 'non-beyonder' for c in candidates)}")
    print(f"bundle: {len(bundle)} | existing slugs: {len(slugs)}")
    print(f"excluded: no-city-beyonder={len(exclusions['no-city-beyonder'])}, non-beyonder={len(exclusions['non-beyonder'])}")


if __name__ == "__main__":
    main()
