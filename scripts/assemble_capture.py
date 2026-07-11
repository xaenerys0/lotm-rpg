#!/usr/bin/env python3
"""Assemble the issue #213 prod->repo capture from the verification workflow output.

Inputs (tmp/):
  capture_results.json    - workflow output: [{slug, category, verdict:{corrected,...}}]
  capture_to_verify.json  - base dossiers (kind: new|updated) keyed by slug
  prod_lore_entries.json  - full prod rows (for the 8 first-seeded, captured as-is)

Outputs:
  - Appends NEW npc entries to src/lib/lore/npcs.ts and NEW org entries to
    src/lib/lore/organizations.ts (before each array's closing `];`).
  - In-place updates the ~21 UPDATED entries' canon-prose fields (title, content,
    npcs, sequences, tags, tokenCount) in their existing TS file, preserving the
    structural fields (category/pathway/city/epoch/narratorOnly).
  - Writes supabase/migrations/20260704020000_capture_issue213_expansion.sql:
    an idempotent ON CONFLICT DO UPDATE upsert of all captured rows (46 verified
    + 8 first-seeded), reproducing prod on a fresh DB and a no-op on prod.

Dev-only. Run: python3 scripts/assemble_capture.py
"""
import json, os, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def P(*a): return os.path.join(REPO, *a)

FIRSTSEED = ["npc-anderson-hood","npc-bernadette-gustav","npc-bethel-abraham","npc-colin-iliad",
"npc-hidden-sage","npc-lovia-tiffany","npc-roselle-gustav","npc-zaratul"]

# ---------- helpers ----------
def pgarr(v):
    if v in (None,"","{}"): return []
    s=v.strip()
    if s.startswith("{") and s.endswith("}"): s=s[1:-1]
    if not s: return []
    out=[]; cur=""; q=False; i=0
    while i<len(s):
        c=s[i]
        if c=='"': q=not q; i+=1; continue
        if c=="," and not q: out.append(cur); cur=""; i+=1; continue
        cur+=c; i+=1
    out.append(cur)
    return [x.strip().strip('"') for x in out if x.strip() != ""]

def ts_tmpl(s):  # escape for TS template literal
    return s.replace("\\","\\\\").replace("`","\\`").replace("${","\\${")

def ts_arr(items):
    return "[" + ", ".join('"' + x.replace('"','\\"') + '"' for x in items) + "]"

def ts_int_arr(items):
    return "[" + ", ".join(str(int(x)) for x in items) + "]"

def sql_str(s): return s.replace("'","''")
def sql_arr(items):
    return "'{}'" if not items else "ARRAY[" + ", ".join("'"+sql_str(x)+"'" for x in items) + "]"
def sql_int_arr(items):
    return "'{}'" if not items else "ARRAY[" + ", ".join(str(int(x)) for x in items) + "]"
def sql_nullable(v): return "null" if v in (None,"") else "'"+sql_str(v)+"'"

# ---------- load ----------
results={r["slug"]: r for r in json.load(open(P("tmp","capture_results.json")))}
base=json.load(open(P("tmp","capture_to_verify.json")))
prod={d["slug"]: d for d in json.load(open(P("tmp","prod_lore_entries.json")))}

def corrected_entry(slug):
    """Return a normalized dict for a verified slug (from workflow corrected)."""
    c=results[slug]["verdict"]["corrected"]
    return {
        "slug": slug, "category": base[slug]["category"], "title": c["title"],
        "content": c["content"], "pathway": c.get("pathway"),
        "epoch": int(c.get("epoch") or 5), "city": c.get("city"),
        "npcs": c.get("npcs",[]), "sequences": [int(x) for x in c.get("sequences",[])],
        "tags": c.get("tags",[]), "tokenCount": int(c.get("tokenCount") or 0),
    }

def prod_entry(slug):
    d=prod[slug]
    return {
        "slug": slug, "category": d["category"], "title": d["title"], "content": d["content"],
        "pathway": d["pathway"], "epoch": int(d["epoch"]) if d["epoch"] else 5, "city": d["city"],
        "npcs": pgarr(d["npcs"]), "sequences": [int(x) for x in pgarr(d["sequences"])],
        "tags": pgarr(d["tags"]), "tokenCount": int(d["token_count"]),
    }

new_slugs=[s for s,v in base.items() if v["kind"]=="new"]
upd_slugs=[s for s,v in base.items() if v["kind"]=="updated"]
new_entries=[corrected_entry(s) for s in new_slugs]
upd_entries=[corrected_entry(s) for s in upd_slugs]
firstseed_entries=[prod_entry(s) for s in FIRSTSEED]

# ---------- TS: append NEW ----------
def ts_literal(e, corpus_note):
    npcs=", ".join('"'+x.replace('"','\\"')+'"' for x in e["npcs"])
    tags=", ".join('"'+x.replace('"','\\"')+'"' for x in e["tags"])
    seqs=", ".join(str(int(x)) for x in e["sequences"])
    lines=["  {"]
    lines.append(f'    // CORPUS: {corpus_note}')
    lines.append(f'    slug: "{e["slug"]}",')
    lines.append(f'    title: "{e["title"].replace(chr(34),chr(92)+chr(34))}",')
    lines.append(f'    category: "{e["category"]}",')
    lines.append(f'    content: `{ts_tmpl(e["content"])}`,')
    if e["pathway"]: lines.append(f'    pathway: "{e["pathway"]}",')
    lines.append(f'    epoch: {e["epoch"]},')
    if e["city"]: lines.append(f'    city: "{e["city"]}",')
    lines.append(f'    npcs: [{npcs}],')
    lines.append(f'    sequences: [{seqs}],')
    lines.append(f'    tags: [{tags}],')
    lines.append(f'    tokenCount: {e["tokenCount"]},')
    lines.append('    narratorOnly: true,')
    lines.append('  },')
    return "\n".join(lines)

def append_before_close(path, literals):
    t=open(path).read()
    lines=t.splitlines(keepends=True)
    # find last line that is exactly '];'
    idx=max(i for i,l in enumerate(lines) if l.rstrip("\n")=="];")
    block="".join(literals)
    if not block.endswith("\n"): block+="\n"
    new="".join(lines[:idx])+block+"".join(lines[idx:])
    open(path,"w").write(new)

npc_new=[e for e in new_entries if e["category"]=="npc"]
org_new=[e for e in new_entries if e["category"]=="organization"]
append_before_close(P("src","lib","lore","npcs.ts"),
    [ts_literal(e, f'issue #213 capture, wiki "{e["npcs"][0] if e["npcs"] else e["title"]}"')+"\n" for e in npc_new])
append_before_close(P("src","lib","lore","organizations.ts"),
    [ts_literal(e, 'issue #213 capture, corpus-verified')+"\n" for e in org_new])

# ---------- TS: in-place UPDATE ----------
FILES=["src/lib/lore/npcs.ts","src/lib/lore/bayam.ts","src/lib/lore/organizations.ts"]
def locate_block(text, slug):
    i=text.find(f'slug: "{slug}"')
    if i<0: return None
    st=text.rfind("{",0,i)
    d=0; j=st
    while j<len(text):
        if text[j]=="{": d+=1
        elif text[j]=="}":
            d-=1
            if d==0: break
        j+=1
    return st, j+1

upd_by_file={}
for e in upd_entries:
    for f in FILES:
        t=open(P(f)).read()
        if f'slug: "{e["slug"]}"' in t:
            upd_by_file.setdefault(f,[]).append(e); break

for f, entries in upd_by_file.items():
    t=open(P(f)).read()
    for e in entries:
        loc=locate_block(t, e["slug"])
        if not loc: raise SystemExit(f"block not found: {e['slug']}")
        st,en=loc; block=t[st:en]; nb=block
        nb=re.sub(r'title: "(?:[^"\\]|\\.)*"', 'title: "'+e["title"].replace('"','\\"')+'"', nb, count=1)
        nb=re.sub(r'content: `(?:[^`\\]|\\.)*`', lambda m: 'content: `'+ts_tmpl(e["content"])+'`', nb, count=1)
        nb=re.sub(r'npcs: \[[^\]]*\]', 'npcs: '+ts_arr(e["npcs"]), nb, count=1)
        nb=re.sub(r'sequences: \[[^\]]*\]', 'sequences: '+ts_int_arr(e["sequences"]), nb, count=1)
        nb=re.sub(r'tags: \[[^\]]*\]', 'tags: '+ts_arr(e["tags"]), nb, count=1)
        nb=re.sub(r'tokenCount: \d+', 'tokenCount: '+str(e["tokenCount"]), nb, count=1)
        t=t[:st]+nb+t[en:]
    open(P(f),"w").write(t)

# ---------- migration ----------
all_rows=new_entries+upd_entries+firstseed_entries
rows_sql=[]
for e in sorted(all_rows, key=lambda x:x["slug"]):
    rows_sql.append(
        "  ('{slug}', '{title}', '{cat}', '{content}', {pw}, {epoch}, {city}, {npcs}, {seqs}, {tags}, {tok})".format(
            slug=sql_str(e["slug"]), title=sql_str(e["title"]), cat=e["category"],
            content=sql_str(e["content"]), pw=sql_nullable(e["pathway"]), epoch=int(e["epoch"]),
            city=sql_nullable(e["city"]), npcs=sql_arr(e["npcs"]), seqs=sql_int_arr(e["sequences"]),
            tags=sql_arr(e["tags"]), tok=int(e["tokenCount"]),
        ))
header=(
"-- Capture the issue #213 canon expansion into the repo (prod->repo reconciliation).\n"
"-- The 6 remote-only migrations 20260704010619..20260704011343 were applied to\n"
"-- prod via MCP but never committed; this consolidates their effect into one\n"
"-- idempotent upsert so a fresh DB / branching preview reproduces prod and it is a\n"
"-- no-op on prod. Content re-verified against the wiki corpus. 54 rows: 25 new\n"
"-- (23 NPC + 2 org), 8 previously-unseeded repo entries, 21 updated dossiers.\n"
"-- The 6 batch1-owned gods/angels (bladel/cohinem/kotar/olmer/ouroboros/suah) are\n"
"-- intentionally excluded (seeded by 20260709130000). narratorOnly is a TS-only\n"
"-- flag, not persisted.\n\n"
"insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)\nvalues\n")
on_conflict=(
"\non conflict (slug) do update set\n"
"  title = excluded.title,\n  category = excluded.category,\n  content = excluded.content,\n"
"  pathway = excluded.pathway,\n  epoch = excluded.epoch,\n  city = excluded.city,\n"
"  npcs = excluded.npcs,\n  sequences = excluded.sequences,\n  tags = excluded.tags,\n"
"  token_count = excluded.token_count")
open(P("supabase","migrations","20260704020000_capture_issue213_expansion.sql"),"w").write(
    header + ",\n".join(rows_sql) + on_conflict + ";\n")

# ---------- report ----------
sev={}
for s in list(new_slugs)+list(upd_slugs):
    v=results[s]["verdict"]["severity"]; sev[v]=sev.get(v,0)+1
print(f"NEW appended: {len(npc_new)} npc + {len(org_new)} org")
print(f"UPDATED in place: {len(upd_entries)}")
print(f"firstseed in migration: {len(firstseed_entries)}")
print(f"migration rows: {len(all_rows)}")
print(f"verification severity: {sev}")
majors=[s for s in list(new_slugs)+list(upd_slugs) if results[s]['verdict']['severity']=='major']
if majors: print("MAJOR:", majors)
