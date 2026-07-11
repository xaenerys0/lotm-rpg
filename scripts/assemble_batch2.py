#!/usr/bin/env python3
"""Assemble Batch 2 (Seq 3-4 Saints & demigods) lore from the workflow output.

Input : tmp/batch2_results.json  — array of {pathway, sequence, name, draft, verdict}
        (verdict.corrected is the canon-verified entry to ship; carryover saints
        have draft=null but a full verdict.corrected).
Output: tmp/batch2_entries.ts    — TS LoreEntry objects to splice into npcs.ts
        tmp/batch2_seed.sql       — upsert INTO public.lore_entries

Validates slugs (unique vs existing + within batch), pathway keys, the Seq 3/4
gate, epoch, narratorOnly. Prints a report. Fork of assemble_batch1.py; the only
behavioural change is the sequence gate now accepts 3 or 4 (Batch 1 was 0-2).

Dev-only. Run: python3 scripts/assemble_batch2.py
"""

import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(REPO, "tmp", "batch2_results.json")
EXISTING = os.path.join(REPO, "tmp", "existing_npc_slugs.json")
TASKLIST = os.path.join(REPO, "tmp", "batch2_tasklist.json")

VALID_PATHWAYS = {
    "abyss", "black-emperor", "chained", "darkness", "death", "demoness", "door",
    "error", "fool", "hanged-man", "hermit", "justiciar", "moon", "mother", "paragon",
    "red-priest", "sun", "twilight-giant", "tyrant", "visionary", "wheel-of-fortune",
    "white-tower",
}
VALID_SEQUENCES = {3, 4}


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
            # A "missing" candidate should not already exist; surface it. The SQL
            # upsert still corrects the row, but a TS splice would duplicate a slug.
            errors.append(f"{name}: slug '{slug}' collides with existing entry")
        if slug in seen_slugs:
            errors.append(f"{name}: slug '{slug}' duplicated within batch")
        seen_slugs.add(slug)

        if e.get("pathway") != exp_pw:
            errors.append(f"{name}: pathway '{e.get('pathway')}' != expected '{exp_pw}'")
        if e.get("pathway") not in VALID_PATHWAYS:
            errors.append(f"{name}: pathway '{e.get('pathway')}' not a valid key")
        seqs = e.get("sequences") or []
        if not seqs or any(s not in VALID_SEQUENCES for s in seqs):
            errors.append(f"{name}: sequences {seqs} not within Seq 3/4")
        if exp_seq is not None and seqs != [exp_seq]:
            warnings.append(f"{name}: sequences {seqs} != finalSequence [{exp_seq}]")
        if e.get("epoch") != 5:
            warnings.append(f"{name}: epoch {e.get('epoch')} != 5")
        if e.get("narratorOnly") is not True:
            errors.append(f"{name}: narratorOnly is not true")
        if v.get("severity") == "major":
            warnings.append(f"{name}: verifier flagged MAJOR — {v.get('notes','')[:120]}")

        entries.append((r, e))

    # ---- emit TS ----
    page_by_name = {}
    if os.path.exists(TASKLIST):
        page_by_name = {t["name"]: t.get("page", t["name"]) for t in json.load(open(TASKLIST))}
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
    open(os.path.join(REPO, "tmp", "batch2_entries.ts"), "w").write("\n".join(ts_lines) + "\n")

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
        "-- Seed Batch 2 Saints & demigods lore (missing high-tier Beyonders audit):\n"
        "-- Sequence 3-4 figures across the pathways, generated from the canonical TS\n"
        "-- source (src/lib/lore/npcs.ts), same lore_entries INSERT format as the\n"
        "-- earlier seed migrations. narratorOnly is a TS-only prompt flag (no column),\n"
        "-- intentionally not persisted. All entries are epoch 5, pathway-keyed, gated\n"
        "-- to their own sequence (progressive disclosure). Array columns seed as '{}'\n"
        "-- (never null) to match the non-null npcs/sequences/tags schema.\n\n"
        "insert into public.lore_entries (slug, title, category, content, pathway, "
        "epoch, city, npcs, sequences, tags, token_count)\nvalues\n"
    )
    # Upsert keeps the seed idempotent/re-runnable and corrects any pre-existing row.
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
    open(os.path.join(REPO, "tmp", "batch2_seed.sql"), "w").write(
        header + ",\n".join(sql_rows) + on_conflict + ";\n"
    )

    # ---- report ----
    print(f"entries assembled: {len(entries)}")
    print("TS  -> tmp/batch2_entries.ts")
    print("SQL -> tmp/batch2_seed.sql")
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
