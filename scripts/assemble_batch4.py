#!/usr/bin/env python3
"""Assemble Batch 4 lore from the verifier output — two keying groups.

Input : tmp/batch4_results.json — [{candidateId, group, expectedSlug, verdict:{corrected, drop, ...}}]
        tmp/batch4_tasklist.json  — the immutable manifest (candidateId -> record)
        tmp/existing_npc_slugs.json
Output: tmp/batch4_entries.ts, tmp/batch4_seed.sql

Keying invariants (validated, not trusted):
  - no-city-beyonder : NO city, NO pathway, sequences = one integer in 5..9 (RAG-only).
  - non-beyonder     : city set (reviewed stable city), NO pathway, sequences = [] (no sequence).
Every result must map to a manifest candidate of the same group/slug. Fork of
assemble_batch3.py. Dev-only: python3 scripts/assemble_batch4.py
"""

import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(REPO, "tmp", "batch4_results.json")
MANIFEST = os.path.join(REPO, "tmp", "batch4_tasklist.json")
EXISTING = os.path.join(REPO, "tmp", "existing_npc_slugs.json")

VALID_CITIES = {"tingen", "backlund", "trier", "bayam", "constant", "pritz", "feysac", "balam"}
NO_CITY_SEQS = {5, 6, 7, 8, 9}


def ts_str(s):
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def sql_str(s):
    return s.replace("'", "''")


def sql_array(items):
    return "'{}'" if not items else "ARRAY[" + ", ".join("'" + sql_str(x) + "'" for x in items) + "]"


def sql_int_array(items):
    return "'{}'" if not items else "ARRAY[" + ", ".join(str(int(x)) for x in items) + "]"


def main() -> int:
    results = json.load(open(RESULTS))
    existing = set(json.load(open(EXISTING))) if os.path.exists(EXISTING) else set()
    manifest = {c["candidateId"]: c for c in json.load(open(MANIFEST))["candidates"]}

    errors, warnings, seen, entries = [], [], set(), []
    for r in results:
        cid, group = r.get("candidateId"), r.get("group")
        man = manifest.get(cid)
        if not man:
            errors.append(f"{cid}: result has no matching manifest candidate"); continue
        if man["group"] != group:
            errors.append(f"{cid}: group '{group}' != manifest '{man['group']}'")
        v = r.get("verdict", {})
        if v.get("drop"):
            continue  # dropped results are not assembled
        e = v.get("corrected")
        if not e:
            errors.append(f"{cid}: approved but no corrected entry"); continue

        slug = e.get("slug", "")
        if slug != man["expectedSlug"]:
            errors.append(f"{cid}: slug '{slug}' != manifest expectedSlug '{man['expectedSlug']}'")
        if not slug.startswith("npc-"):
            errors.append(f"{cid}: slug '{slug}' missing npc- prefix")
        if slug in existing:
            errors.append(f"{cid}: slug '{slug}' collides with existing entry")
        if slug in seen:
            errors.append(f"{cid}: slug '{slug}' duplicated within batch")
        seen.add(slug)

        if e.get("category") not in (None, "npc"):
            errors.append(f"{cid}: category '{e.get('category')}' != npc")
        if e.get("narratorOnly") is not True:
            errors.append(f"{cid}: narratorOnly is not true")
        if e.get("pathway"):
            errors.append(f"{cid}: Batch 4 entry must NOT have a pathway field")
        seqs = e.get("sequences") or []

        if group == "no-city-beyonder":
            if e.get("city"):
                errors.append(f"{cid}: no-city Beyonder must NOT have a city field")
            if len(seqs) != 1 or seqs[0] not in NO_CITY_SEQS:
                errors.append(f"{cid}: no-city sequences {seqs} must be one integer in 5..9")
        elif group == "non-beyonder":
            if e.get("city") not in VALID_CITIES:
                errors.append(f"{cid}: non-Beyonder city '{e.get('city')}' not a valid active city")
            if seqs:
                errors.append(f"{cid}: non-Beyonder sequences {seqs} must be [] (no sequence)")
        else:
            errors.append(f"{cid}: unknown group '{group}'"); continue

        if v.get("severity") == "major":
            warnings.append(f"{cid}: shipped despite MAJOR (second-opinion approved)")
        entries.append((man, e, group))

    # ---- TS ----
    ts_lines = []
    for man, e, group in entries:
        npcs = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("npcs", []))
        tags = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("tags", []))
        seqs = ", ".join(str(int(x)) for x in e.get("sequences", []))
        page = man["canonicalWikiTitle"]
        key_line = f'    city: "{e["city"]}",\n' if group == "non-beyonder" else ""
        ts_lines.append(
            "  {\n"
            f'    // CORPUS: wiki "{page}" (Char infobox + lead/history)\n'
            f'    slug: "{e["slug"]}",\n'
            f'    title: "{e["title"].replace(chr(34), chr(92) + chr(34))}",\n'
            '    category: "npc",\n'
            f'    content: `{ts_str(e["content"])}`,\n'
            + key_line
            + f'    epoch: {int(e.get("epoch", 5))},\n'
            f"    npcs: [{npcs}],\n"
            f"    sequences: [{seqs}],\n"
            f"    tags: [{tags}],\n"
            f'    tokenCount: {int(e.get("tokenCount", 0))},\n'
            "    narratorOnly: true,\n"
            "  },"
        )
    open(os.path.join(REPO, "tmp", "batch4_entries.ts"), "w").write("\n".join(ts_lines) + "\n")

    # ---- SQL ----
    rows = []
    for man, e, group in entries:
        city = "'" + sql_str(e["city"]) + "'" if group == "non-beyonder" else "null"
        rows.append(
            "  ('{slug}', '{title}', 'npc', '{content}', null, {epoch}, {city}, "
            "{npcs}, {seqs}, {tags}, {tok})".format(
                slug=sql_str(e["slug"]), title=sql_str(e["title"]), content=sql_str(e["content"]),
                epoch=int(e.get("epoch", 5)), city=city,
                npcs=sql_array(e.get("npcs", [])), seqs=sql_int_array(e.get("sequences", [])),
                tags=sql_array(e.get("tags", [])), tok=int(e.get("tokenCount", 0)),
            )
        )
    header = (
        "-- Seed Batch 4 lore (missing NPC audit): city-level non-Beyonder color/\n"
        "-- plot-hook NPCs (city-keyed, sequences '{}') + no-active-city Sequence 5-9\n"
        "-- Beyonders (RAG-only: no city, no pathway). Generated from the canonical TS\n"
        "-- source (src/lib/lore/npcs.ts). narratorOnly is a TS-only prompt flag (no\n"
        "-- column), not persisted. All entries pathway-less. Arrays seed as '{}'.\n\n"
        "insert into public.lore_entries (slug, title, category, content, pathway, "
        "epoch, city, npcs, sequences, tags, token_count)\nvalues\n"
    )
    on_conflict = (
        "\non conflict (slug) do update set\n"
        "  title = excluded.title,\n  category = excluded.category,\n"
        "  content = excluded.content,\n  pathway = excluded.pathway,\n"
        "  epoch = excluded.epoch,\n  city = excluded.city,\n"
        "  npcs = excluded.npcs,\n  sequences = excluded.sequences,\n"
        "  tags = excluded.tags,\n  token_count = excluded.token_count"
    )
    if rows:
        open(os.path.join(REPO, "tmp", "batch4_seed.sql"), "w").write(
            header + ",\n".join(rows) + on_conflict + ";\n"
        )
    else:
        open(os.path.join(REPO, "tmp", "batch4_seed.sql"), "w").write("-- Batch 4: 0 approved entries — no seed.\n")

    nc = sum(1 for _, _, g in entries if g == "no-city-beyonder")
    print(f"entries assembled: {len(entries)} ({nc} no-city-beyonder, {len(entries) - nc} non-beyonder)")
    print("TS  -> tmp/batch4_entries.ts\nSQL -> tmp/batch4_seed.sql")
    if warnings:
        print("\nWARNINGS:")
        for w in warnings:
            print("  -", w)
    if errors:
        print("\nERRORS:")
        for er in errors:
            print("  -", er)
        return 1
    print("\nno blocking errors.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
