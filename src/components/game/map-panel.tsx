"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { noopSubscribe } from "@/lib/react";
import {
  canTravelTo,
  CITIES,
  cityIdFromLocation,
  deserializeSession,
  serializeSession,
  travelDays,
  travelTo,
  type GameSession,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
} from "@/lib/game";
import { addSessionFact } from "@/lib/ai";

// Map panel (issue #23): Tingen City's districts as a walker's gazetteer, plus
// a "Farther afield" section for the three additional cities. Every blurb is
// street-level PUBLIC knowledge only — the curated lore is narrator-only by
// design, so the atlas carries its own hand-written copy and can never leak
// what the character hasn't learned. The travel control updates the active
// session's location via the pure `travelTo` engine and persists to
// localStorage (mirroring the session-persist pattern in market-panel.tsx).

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

// Public, street-level descriptions of the farther cities. Written fresh — the
// narrator-only lore files must NOT bleed into the player-facing atlas.
interface FartherCity {
  id: string;
  name: string;
  realm: string;
  blurb: string;
}

const FARTHER_CITIES: FartherCity[] = [
  {
    id: "backlund",
    name: "Backlund",
    realm: "Loen Kingdom — the capital",
    blurb:
      "The capital, days downriver: a vast metropolis of five million souls under a permanent pall of yellow smog. Opera houses and counting-houses on one bank, factories and rookeries on the other, joined by the great Backlund Bridge over the Tussock.",
  },
  {
    id: "trier",
    name: "Trier",
    realm: "Intis Republic — the capital",
    blurb:
      "The sunlit capital of the Intis Republic across the border, a walled city of fifty-four gates famed for its artists and its fashion. Students shout politics in the boulevards; quarries and catacombs honeycomb the ground beneath.",
  },
  {
    id: "bayam",
    name: "Bayam",
    realm: "Rorsted Archipelago — the capital",
    blurb:
      "A colonial port-capital far out in the Sonia Sea, built on a forested island and named the City of Generosity for its gold and spice. Its harbour bars are loud with sailors and adventurers; a curfew falls hard at nightfall.",
  },
];

function loadActiveSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || typeof ids[0] !== "string") return null;
    const sessionRaw = localStorage.getItem(SESSION_KEY_PREFIX + ids[0]);
    return sessionRaw ? deserializeSession(sessionRaw) : null;
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
  const sessionCacheRef = useRef<GameSession | null | undefined>(undefined);
  const initialSession = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (sessionCacheRef.current === undefined) {
        sessionCacheRef.current = loadActiveSession();
      }
      return sessionCacheRef.current;
    },
    () => null,
  );
  const [session, setSession] = useState<GameSession | null>(initialSession ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  const location = session?.gameState.location ?? null;
  const currentCityId = location ? cityIdFromLocation(location) : undefined;

  const handleTravel = useCallback(
    (cityId: string) => {
      if (!session) return;
      const result = travelTo(session.gameState, cityId, session.turnCount);
      if (!result) return;
      const memory = addSessionFact(session.memory, result.fact);
      const next: GameSession = {
        ...session,
        gameState: result.state,
        memory,
        updatedAt: Date.now(),
      };
      setSession(next);
      setNotice(`You set out for ${result.state.location}.`);
      try {
        localStorage.setItem(SESSION_KEY_PREFIX + next.id, serializeSession(next));
      } catch {
        // Storage unavailable — in-memory state still updates.
      }
    },
    [session],
  );

  // "Tingen City" alone shouldn't pin every district; only mark a district
  // when the location names it specifically.
  const marked = DISTRICTS.filter((d) => isHere(d, location));
  const specific = marked.length === 1 ? marked[0].slug : null;

  return (
    <div className="space-y-8">
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

      <section aria-labelledby="farther-afield-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2
            id="farther-afield-heading"
            className="font-serif text-lg font-semibold text-amber"
          >
            Farther afield
          </h2>
          <div
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm text-muted">
          Cities beyond Tingen, reachable by rail and sea. Setting out for one takes your
          character there directly.
        </p>

        {notice && (
          <p className="text-sm text-amber" role="status">
            {notice}
          </p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {FARTHER_CITIES.map((city) => {
            const here = currentCityId === city.id;
            const canGo = session ? canTravelTo(session.gameState, city.id) : false;
            const days =
              currentCityId && currentCityId !== city.id
                ? travelDays(currentCityId, city.id)
                : null;
            return (
              <li key={city.id} className="parchment relative rounded-lg p-5">
                <h3 className="font-serif text-base font-semibold text-foreground">
                  {city.name}
                  {here && (
                    <span className="ml-2 rounded-sm border border-amber/40 bg-amber/10 px-1.5 py-0.5 align-middle text-[10px] font-medium tracking-[0.15em] text-amber uppercase">
                      You are here
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-xs tracking-wide text-muted uppercase">
                  {city.realm}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  {city.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {days !== null
                      ? `Travel: about ${days} day${days === 1 ? "" : "s"}`
                      : "Travel"}
                  </span>
                  {session && !here && (
                    <button
                      type="button"
                      onClick={() => handleTravel(city.id)}
                      disabled={!canGo}
                      className="inline-flex min-h-[24px] items-center rounded border border-amber/40 px-3 py-1 text-xs font-medium text-amber transition-colors hover:bg-amber/10 disabled:opacity-50"
                      aria-label={`Travel to ${city.name}`}
                    >
                      Set out
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!session && (
          <p className="text-xs text-muted">
            Begin or continue a game to travel between cities.
          </p>
        )}
      </section>
    </div>
  );
}

// Reference the full CITIES list for completeness in the gazetteer's footer so
// the table stays the single source of truth for known destinations.
export const KNOWN_CITY_NAMES = CITIES.map((c) => c.name);
