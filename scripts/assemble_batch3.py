#!/usr/bin/env python3
"""Assemble Batch 3 lore from the workflow output — two keying groups.

Input : tmp/batch3_results.json — [{group, name, pathway|null, sequence, draft, verdict}]
        group "city"  -> verdict.corrected is CITY-keyed (has `city`, NO `pathway`)
        group "angel" -> verdict.corrected is PATHWAY-keyed (has `pathway`, NO `city`)
Output: tmp/batch3_entries.ts, tmp/batch3_seed.sql

City entries follow the leak rule (city-keyed, pathway named only in prose/tags);
angel entries are the Batch-1-style pathway-keyed Seq 1-2 gods/angels. Fork of
assemble_batch2.py. Dev-only: python3 scripts/assemble_batch3.py
"""

import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(REPO, "tmp", "batch3_results.json")
EXISTING = os.path.join(REPO, "tmp", "existing_npc_slugs.json")
TASKLIST = os.path.join(REPO, "tmp", "batch3_tasklist.json")

VALID_PATHWAYS = {
    "abyss", "black-emperor", "chained", "darkness", "death", "demoness", "door",
    "error", "fool", "hanged-man", "hermit", "justiciar", "moon", "mother", "paragon",
    "red-priest", "sun", "twilight-giant", "tyrant", "visionary", "wheel-of-fortune",
    "white-tower",
}
VALID_CITIES = {"tingen", "backlund", "trier", "bayam", "constant", "pritz", "feysac", "balam"}


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
    page_by_name = {}
    if os.path.exists(TASKLIST):
        page_by_name = {t["name"]: t.get("page", t["name"]) for t in json.load(open(TASKLIST))}

    errors, warnings, seen, entries = [], [], set(), []
    for r in results:
        name, group = r.get("name"), r.get("group")
        e = r.get("verdict", {}).get("corrected") or r.get("draft")
        if not e:
            errors.append(f"{name}: no corrected/draft entry"); continue
        slug = e.get("slug", "")
        if not slug.startswith("npc-"):
            errors.append(f"{name}: slug '{slug}' missing npc- prefix")
        if slug in existing:
            errors.append(f"{name}: slug '{slug}' collides with existing entry")
        if slug in seen:
            errors.append(f"{name}: slug '{slug}' duplicated within batch")
        seen.add(slug)
        seqs = e.get("sequences") or []
        if not seqs:
            errors.append(f"{name}: empty sequences")
        if e.get("narratorOnly") is not True:
            errors.append(f"{name}: narratorOnly is not true")
        if group == "city":
            if e.get("city") not in VALID_CITIES:
                errors.append(f"{name}: city '{e.get('city')}' not a valid active city")
            if e.get("pathway"):
                errors.append(f"{name}: city entry must NOT have a pathway field (leak rule)")
            if any(s not in range(1, 10) for s in seqs):
                warnings.append(f"{name}: city sequences {seqs} outside 1-9")
        elif group == "angel":
            if e.get("pathway") not in VALID_PATHWAYS:
                errors.append(f"{name}: pathway '{e.get('pathway')}' not a valid key")
            if e.get("city"):
                errors.append(f"{name}: angel entry must NOT have a city field")
            if any(s not in (1, 2) for s in seqs):
                errors.append(f"{name}: angel sequences {seqs} not within Seq 1/2")
        else:
            errors.append(f"{name}: unknown group '{group}'"); continue
        if r.get("verdict", {}).get("severity") == "major":
            warnings.append(f"{name}: verifier flagged MAJOR — {r['verdict'].get('notes', '')[:110]}")
        entries.append((r, e, group))

    # ---- TS ----
    ts_lines = []
    for r, e, group in entries:
        npcs = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("npcs", []))
        tags = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("tags", []))
        seqs = ", ".join(str(int(x)) for x in e.get("sequences", []))
        page = page_by_name.get(r["name"], r["name"])
        key_line = (f'    city: "{e["city"]}",\n' if group == "city"
                    else f'    pathway: "{e["pathway"]}",\n')
        ts_lines.append(
            "  {\n"
            f'    // CORPUS: wiki "{page}" (Char infobox: sequence_type/'
            "sequence_rank/sequence_name, residence, affiliations + lead/history)\n"
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
    open(os.path.join(REPO, "tmp", "batch3_entries.ts"), "w").write("\n".join(ts_lines) + "\n")

    # ---- SQL ----
    rows = []
    for r, e, group in entries:
        pathway = "'" + sql_str(e["pathway"]) + "'" if group == "angel" else "null"
        city = "'" + sql_str(e["city"]) + "'" if group == "city" else "null"
        rows.append(
            "  ('{slug}', '{title}', 'npc', '{content}', {pathway}, {epoch}, {city}, "
            "{npcs}, {seqs}, {tags}, {tok})".format(
                slug=sql_str(e["slug"]), title=sql_str(e["title"]), content=sql_str(e["content"]),
                pathway=pathway, epoch=int(e.get("epoch", 5)), city=city,
                npcs=sql_array(e.get("npcs", [])), seqs=sql_int_array(e.get("sequences", [])),
                tags=sql_array(e.get("tags", [])), tok=int(e.get("tokenCount", 0)),
            )
        )
    header = (
        "-- Seed Batch 3 lore (missing Beyonders audit): city-level named Beyonders\n"
        "-- (city-keyed, NOT pathway-keyed per the leak rule) + a Sequence 1-2 angel\n"
        "-- cleanup (pathway-keyed) that Batch 1 missed. Generated from the canonical\n"
        "-- TS source (src/lib/lore/npcs.ts). narratorOnly is a TS-only prompt flag\n"
        "-- (no column), not persisted. Array columns seed as '{}' (never null).\n\n"
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
    open(os.path.join(REPO, "tmp", "batch3_seed.sql"), "w").write(
        header + ",\n".join(rows) + on_conflict + ";\n"
    )

    city_n = sum(1 for _, _, g in entries if g == "city")
    print(f"entries assembled: {len(entries)} ({city_n} city, {len(entries) - city_n} angel)")
    print("TS  -> tmp/batch3_entries.ts\nSQL -> tmp/batch3_seed.sql")
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
