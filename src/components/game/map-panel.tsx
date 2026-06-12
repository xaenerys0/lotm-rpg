"use client";

import { useRef, useSyncExternalStore } from "react";

import { noopSubscribe } from "@/lib/react";
import { deserializeSession, SESSION_INDEX_KEY, SESSION_KEY_PREFIX } from "@/lib/game";

// Map panel (issue #13): Tingen City's districts as a walker's gazetteer.
// Every blurb is street-level PUBLIC knowledge only — the curated lore is
// narrator-only by design, so the atlas carries its own hand-written copy
// and can never leak what the character hasn't learned.

interface District {
  slug: string;
  name: string;
  blurb: string;
  /** Keywords matched against the session's location string. */
  keywords: string[];
}

const DISTRICTS: District[] = [
  {
    slug: "zouteland-street",
    name: "Zouteland Street & the Old Quarter",
    blurb:
      "Gas lamps, narrow brick terraces, and the smell of coal and rain. Most of Tingen's clerks and dockworkers live out their whole lives within ten streets of here.",
    keywords: ["zouteland", "old quarter", "tingen"],
  },
  {
    slug: "iron-cross-district",
    name: "Iron Cross District",
    blurb:
      "The working heart of the city: foundries, machine shops, and pubs that open before dawn. Wages are thin, tempers thinner, and the constables patrol in pairs.",
    keywords: ["iron cross"],
  },
  {
    slug: "khoy-university",
    name: "Khoy University",
    blurb:
      "Lecture halls, debating societies, and students who can quote the Roselle diaries they are not supposed to own. A respectable place to be poor and ambitious.",
    keywords: ["khoy", "university"],
  },
  {
    slug: "tussock-river",
    name: "Tussock River & the Docks",
    blurb:
      "Barges, fish markets, and fog thick enough to lose a cart in. Sailors trade stories here that respectable people pretend not to believe.",
    keywords: ["tussock", "dock", "river", "canal"],
  },
  {
    slug: "cathedral-of-serenity",
    name: "Cathedral of Serenity",
    blurb:
      "Seat of the Church of the Evernight Goddess in Tingen. Black-robed clergy, evening services, and bells that mark the hours after dark.",
    keywords: ["cathedral", "serenity", "chapel", "church"],
  },
  {
    slug: "divination-club",
    name: "The Divination Club",
    blurb:
      "A fashionable salon where the curious pay to have their fortunes read over tea. Mostly theatre — or so its members insist.",
    keywords: ["divination club"],
  },
  {
    slug: "north-borough",
    name: "The Northern Borough",
    blurb:
      "Townhouses, private clubs, and streets that are swept twice a day. Money lives here, and money prefers not to be stared at.",
    keywords: ["north", "borough", "hillston"],
  },
  {
    slug: "blackthorn",
    name: "Blackthorn Security Company",
    blurb:
      "A private security firm with an unremarkable office and a reputation for handling the cases the police decline to discuss.",
    keywords: ["blackthorn"],
  },
];

function loadCurrentLocation(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || typeof ids[0] !== "string") return null;
    const sessionRaw = localStorage.getItem(SESSION_KEY_PREFIX + ids[0]);
    const session = sessionRaw ? deserializeSession(sessionRaw) : null;
    return session?.gameState.location ?? null;
  } catch {
    return null;
  }
}

function isHere(district: District, location: string | null): boolean {
  if (!location) return false;
  const lowered = location.toLowerCase();
  return district.keywords.some((keyword) => lowered.includes(keyword));
}

export function MapPanel() {
  const locationCacheRef = useRef<string | null | undefined>(undefined);
  const location = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (locationCacheRef.current === undefined) {
        locationCacheRef.current = loadCurrentLocation();
      }
      return locationCacheRef.current;
    },
    () => null,
  );

  // "Tingen City" alone shouldn't pin every district; only mark a district
  // when the location names it specifically.
  const marked = DISTRICTS.filter((d) => isHere(d, location));
  const specific = marked.length === 1 ? marked[0].slug : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-sm italic text-muted">
          A walker&rsquo;s gazetteer of Tingen, in the Awwa region of the Loen Kingdom.
        </p>
        {location && (
          <p className="text-xs text-muted">
            Current whereabouts:{" "}
            <span className="font-medium text-amber">{location}</span>
          </p>
        )}
      </div>

      {/* Compass rose — pure ornament. */}
      <div
        className="flex items-center justify-center gap-4 text-muted/40"
        aria-hidden="true"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="candle-flicker font-serif text-lg text-amber/60">✦ N ✦</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DISTRICTS.map((district) => {
          const here = district.slug === specific;
          return (
            <li
              key={district.slug}
              className={`parchment relative rounded-lg p-5 ${
                here ? "ring-1 ring-amber/50" : ""
              }`}
            >
              <h2 className="font-serif text-base font-semibold text-foreground">
                {district.name}
                {here && (
                  <span className="ml-2 rounded-sm border border-amber/40 bg-amber/10 px-1.5 py-0.5 align-middle text-[10px] font-medium tracking-[0.15em] text-amber uppercase">
                    You are here
                  </span>
                )}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {district.blurb}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        Farther afield: the capital Backlund, the port of Enmat Harbor, and the Hornacis
        mountains — beyond the edge of this map, for now.
      </p>
    </div>
  );
}
