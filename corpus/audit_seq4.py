#!/usr/bin/env python3
"""Audit local LOTM wiki corpus for Sequence 4 / pathway / god / family anchors."""
import re, sys, json
from pathlib import Path

CORPUS = Path(__file__).with_name("wiki") / "lordofthemystery_pages_current.xml"
if not CORPUS.exists():
    print("Corpus not found at", CORPUS, file=sys.stderr)
    sys.exit(1)

text = CORPUS.read_text(encoding="utf-8")
# strip some wiki markup noise
plain = re.sub(r"<[^>]+>", " ", text)

def count(term: str) -> int:
    return len(re.findall(re.escape(term), plain, re.IGNORECASE))

def snippet(term: str, radius: int = 180) -> str | None:
    pat = re.compile(re.escape(term), re.IGNORECASE)
    m = pat.search(plain)
    if not m:
        return None
    start = max(0, m.start() - radius)
    end = min(len(plain), m.end() + radius)
    s = plain[start:end]
    s = re.sub(r"\s+", " ", s)
    return s.strip()

QUERIES = {
    "fool": ["Sequence 4", "Bizarro Sorcerer", "Fool pathway", "Berserk Sea"],
    "visionary": ["Sequence 4", "Manipulator", "Visionary pathway", "Mind Dragon"],
    "sun": ["Sequence 4", "Unshadowed", "Sun pathway", "Eternal Blazing Sun"],
    "death": ["Sequence 4", "Undying", "Death pathway", "Undying", "Death Consul"],
    "darkness": ["Sequence 4", "Nightwatcher", "Darkness pathway", "Evernight"],
    "tyrant": ["Sequence 4", "Cataclysmic Interrer", "Tyrant pathway", "Lord of Storms"],
    "door": ["Sequence 4", "Secrets Sorcerer", "Door pathway", "Abraham family"],
    "hanged-man": ["Sequence 4", "Black Knight", "Hanged Man pathway", "Rose School of Thought"],
    "white-tower": ["Sequence 4", "Prophet", "White Tower pathway", "God of Knowledge and Wisdom"],
    "twilight-giant": ["Sequence 4", "Demon Hunter", "Twilight Giant pathway", "Church of the God of Combat"],
    "justiciar": ["Sequence 4", "Imperative Mage", "Justiciar pathway", "Order of the Twilight Hermit"],
    "black-emperor": ["Sequence 4", "Earl of the Fallen", "Black Emperor pathway", "Solomon"],
    "red-priest": ["Sequence 4", "Iron-blooded Knight", "Red Priest pathway", "Church of the God of War"],
    "demoness": ["Sequence 4", "Despair", "Demoness pathway", "Demoness Sect"],
    "mother": ["Sequence 4", "Classical Alchemist", "Mother pathway", "Earth Mother"],
    "moon": ["Sequence 4", "Shaman King", "Moon pathway", "Sanguine"],
    "hermit": ["Sequence 4", "Mysticologist", "Hermit pathway", "God of Steam and Machinery"],
    "paragon": ["Sequence 4", "Alchemist", "Paragon pathway", "God of Steam and Machinery"],
    "wheel-of-fortune": ["Sequence 4", "Misfortune Mage", "Wheel of Fortune pathway", "Snake of Mercury"],
    "abyss": ["Sequence 4", "Demon", "Abyss pathway", "Mother Tree of Desire"],
    "chained": ["Sequence 4", "Puppet", "Chained pathway", "Rose School of Thought"],
    "error": ["Sequence 4", "Parasite", "Error pathway", "Amon family"],
}

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    out = {}
    for pathway, terms in QUERIES.items():
        if target and pathway != target:
            continue
        row = {}
        for t in terms:
            row[t] = {"count": count(t), "snippet": snippet(t)}
        out[pathway] = row
    print(json.dumps(out, indent=2, ensure_ascii=False))

