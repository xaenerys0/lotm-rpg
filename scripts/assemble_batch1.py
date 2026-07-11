#!/usr/bin/env python3
"""Assemble Batch 1 (Seq 0-2 gods & angels) lore from the workflow output.

Input : tmp/batch1_results.json  — array of {pathway, sequence, name, draft, verdict}
        (verdict.corrected is the canon-verified entry to use)
Output: tmp/batch1_entries.ts    — TS LoreEntry objects to splice into npcs.ts
        tmp/batch1_seed.sql       — INSERT into public.lore_entries
Also validates slugs (unique vs existing + within batch), pathway keys,
sequences gate, epoch, narratorOnly. Prints a report.

Dev-only. Run: python3 scripts/assemble_batch1.py
"""

import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(REPO, "tmp", "batch1_results.json")
EXISTING = os.path.join(REPO, "tmp", "existing_npc_slugs.json")

VALID_PATHWAYS = {
    "abyss","black-emperor","chained","darkness","death","demoness","door",
    "error","fool","hanged-man","hermit","justiciar","moon","mother","paragon",
    "red-priest","sun","twilight-giant","tyrant","visionary","wheel-of-fortune",
    "white-tower",
}


def ts_str(s: str) -> str:
    """Escape a Python string for a TS template literal (backticks)."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def sql_str(s: str) -> str:
    return s.replace("'", "''")


def sql_array(items):
    if not items:
        return "'{}'"
    return "ARRAY[" + ", ".join("'" + sql_str(x) + "'" for x in items) + "]"


def sql_int_array(items):
    if not items:
        return "'{}'"
    return "ARRAY[" + ", ".join(str(int(x)) for x in items) + "]"


def main() -> int:
    results = json.load(open(RESULTS))
    existing = set(json.load(open(EXISTING))) if os.path.exists(EXISTING) else set()

    errors = []
    warnings = []
    seen_slugs = set()
    entries = []

    for r in results:
        name = r.get("name")
        exp_pw = r.get("pathway")
        exp_seq = r.get("sequence")
        v = r.get("verdict", {})
        e = v.get("corrected") or r.get("draft")
        if not e:
            errors.append(f"{name}: no corrected/draft entry")
            continue

        slug = e.get("slug", "")
        if not slug.startswith("npc-"):
            errors.append(f"{name}: slug '{slug}' missing npc- prefix")
        if slug in existing:
            errors.append(f"{name}: slug '{slug}' collides with existing entry")
        if slug in seen_slugs:
            errors.append(f"{name}: slug '{slug}' duplicated within batch")
        seen_slugs.add(slug)

        if e.get("pathway") != exp_pw:
            errors.append(f"{name}: pathway '{e.get('pathway')}' != expected '{exp_pw}'")
        if e.get("pathway") not in VALID_PATHWAYS:
            errors.append(f"{name}: pathway '{e.get('pathway')}' not a valid key")
        if e.get("sequences") != [exp_seq]:
            warnings.append(f"{name}: sequences {e.get('sequences')} != [{exp_seq}]")
        if e.get("epoch") != 5:
            warnings.append(f"{name}: epoch {e.get('epoch')} != 5")
        if e.get("narratorOnly") is not True:
            errors.append(f"{name}: narratorOnly is not true")
        if v.get("severity") == "major":
            warnings.append(f"{name}: verifier flagged MAJOR — {v.get('notes','')[:120]}")

        entries.append((r, e))

    # ---- emit TS ----
    tasklist_path = os.path.join(REPO, "tmp", "batch1_tasklist.json")
    page_by_name = {}
    if os.path.exists(tasklist_path):
        page_by_name = {t["name"]: t["page"] for t in json.load(open(tasklist_path))}
    ts_lines = []
    for _r, e in entries:
        npcs = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("npcs", []))
        tags = ", ".join('"' + x.replace('"', '\\"') + '"' for x in e.get("tags", []))
        seqs = ", ".join(str(int(x)) for x in e.get("sequences", []))
        page = page_by_name.get(_r["name"], _r["name"])
        ts_lines.append(
            "  {\n"
            f'    // CORPUS: wiki "{page}" (Char infobox: sequence_type/'
            "sequence_rank/sequence_name, titles, affiliations, allies + "
            "lead/history)\n"
            f'    slug: "{e["slug"]}",\n'
            f'    title: "{e["title"].replace(chr(34), chr(92)+chr(34))}",\n'
            '    category: "npc",\n'
            f'    content: `{ts_str(e["content"])}`,\n'
            f'    pathway: "{e["pathway"]}",\n'
            f'    epoch: {int(e.get("epoch", 5))},\n'
            f"    npcs: [{npcs}],\n"
            f"    sequences: [{seqs}],\n"
            f"    tags: [{tags}],\n"
            f'    tokenCount: {int(e.get("tokenCount", 0))},\n'
            "    narratorOnly: true,\n"
            "  },"
        )
    open(os.path.join(REPO, "tmp", "batch1_entries.ts"), "w").write("\n".join(ts_lines) + "\n")

    # ---- emit SQL ----
    sql_rows = []
    for _, e in entries:
        sql_rows.append(
            "  ('{slug}', '{title}', 'npc', '{content}', '{pathway}', {epoch}, null, "
            "{npcs}, {seqs}, {tags}, {tok})".format(
                slug=sql_str(e["slug"]),
                title=sql_str(e["title"]),
                content=sql_str(e["content"]),
                pathway=sql_str(e["pathway"]),
                epoch=int(e.get("epoch", 5)),
                npcs=sql_array(e.get("npcs", [])),
                seqs=sql_int_array(e.get("sequences", [])),
                tags=sql_array(e.get("tags", [])),
                tok=int(e.get("tokenCount", 0)),
            )
        )
    header = (
        "-- Seed Batch 1 gods & angels lore (missing high-tier Beyonders audit):\n"
        "-- 54 Sequence 0-2 figures across all 22 pathways, generated from the\n"
        "-- canonical TS source (src/lib/lore/npcs.ts), same lore_entries INSERT\n"
        "-- format as the earlier seed migrations. narratorOnly is a TS-only prompt\n"
        "-- flag (no column), intentionally not persisted. All entries are epoch 5,\n"
        "-- pathway-keyed, gated to their own sequence (progressive disclosure).\n\n"
        "insert into public.lore_entries (slug, title, category, content, pathway, "
        "epoch, city, npcs, sequences, tags, token_count)\nvalues\n"
    )
    # Upsert: 6 of these slugs (bladel/cohinem/kotar/olmer/ouroboros/suah) already
    # exist on prod from the issue #213 expansion with a different gating model, so a
    # plain INSERT would hit the unique-slug constraint. ON CONFLICT overwrites them
    # with the pathway-keyed / own-sequence versions and makes the seed re-runnable.
    on_conflict = (
        "\non conflict (slug) do update set\n"
        "  title = excluded.title,\n"
        "  category = excluded.category,\n"
        "  content = excluded.content,\n"
        "  pathway = excluded.pathway,\n"
        "  epoch = excluded.epoch,\n"
        "  city = excluded.city,\n"
        "  npcs = excluded.npcs,\n"
        "  sequences = excluded.sequences,\n"
        "  tags = excluded.tags,\n"
        "  token_count = excluded.token_count"
    )
    open(os.path.join(REPO, "tmp", "batch1_seed.sql"), "w").write(
        header + ",\n".join(sql_rows) + on_conflict + ";\n"
    )

    # ---- report ----
    print(f"entries assembled: {len(entries)}")
    print(f"TS  -> tmp/batch1_entries.ts")
    print(f"SQL -> tmp/batch1_seed.sql")
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
