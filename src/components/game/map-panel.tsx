"use client";

import { useCallback, useState } from "react";

import {
  loadActiveSession,
  persistSession,
  useStoredValue,
} from "@/lib/react/session-store";
import {
  canTravelTo,
  CITIES,
  cityIdFromLocation,
  travelDays,
  travelTo,
  type GameSession,
} from "@/lib/game";
import { addSessionFact } from "@/lib/ai";
import { gazetteerForEpoch, type GazetteerDistrict } from "@/lib/lore";

// Map panel (issue #23, epoch isolation): an epoch-keyed gazetteer. The Fifth
// Epoch shows Tingen's districts plus a "Farther afield" section with inter-city
// travel; earlier epochs show their own era-appropriate region list with travel
// disabled (the CITIES model is Fifth-Epoch only). Every blurb is street-level
// PUBLIC knowledge only — the curated lore is narrator-only by design, so the
// atlas (now `@/lib/lore/gazetteer`) carries its own hand-written copy and can
// never leak what the character hasn't learned. The travel control updates the
// active session's location via the pure `travelTo` engine and persists to
// localStorage (mirroring the session-persist pattern in market-panel.tsx).

function isHere(district: GazetteerDistrict, location: string | null): boolean {
  if (!location) return false;
  const lowered = location.toLowerCase();
  return district.keywords.some((keyword) => lowered.includes(keyword));
}

export function MapPanel() {
  const initialSession = useStoredValue(loadActiveSession, null);
  const [session, setSession] = useState<GameSession | null>(initialSession);
  const [notice, setNotice] = useState<string | null>(null);

  const location = session?.gameState.location ?? null;
  const currentCityId = location ? cityIdFromLocation(location) : undefined;
  // Epoch-keyed atlas: a non-Fifth character sees its own era's regions, never
  // Tingen or the Fifth-Epoch cities. Absent epoch defaults to the Fifth.
  const gazetteer = gazetteerForEpoch(session?.gameState.epoch);

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
      persistSession(next);
    },
    [session],
  );

  // A broad location ("Tingen City") shouldn't pin every district; only mark a
  // district when the location names it specifically.
  const marked = gazetteer.districts.filter((d) => isHere(d, location));
  const specific = marked.length === 1 ? marked[0].slug : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-sm italic text-muted">{gazetteer.intro}</p>
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
        {gazetteer.districts.map((district) => {
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

      {gazetteer.travelEnabled && (
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
            Cities beyond Tingen, reachable by rail and sea. Setting out for one takes
            your character there directly.
          </p>

          {notice && (
            <p className="text-sm text-amber" role="status">
              {notice}
            </p>
          )}

          <ul className="grid gap-4 sm:grid-cols-2">
            {gazetteer.fartherCities.map((city) => {
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
      )}
    </div>
  );
}

// Reference the full CITIES list for completeness in the gazetteer's footer so
// the table stays the single source of truth for known destinations.
export const KNOWN_CITY_NAMES = CITIES.map((c) => c.name);
