"use client";

import { useCallback, useState } from "react";

import { persistSession, useActiveSession } from "@/lib/react/session-store";
import {
  canTravelTo,
  CITIES,
  companionsPresentOnMove,
  locationLabel,
  mapAtlasFor,
  resolveTrackedNpcState,
  travelDays,
  travelTo,
  type GameSession,
} from "@/lib/game";
import { addSessionFact } from "@/lib/ai";
import { gazetteerForEpoch } from "@/lib/lore";

// Map panel (issue #23, epoch isolation): an epoch-keyed gazetteer. The Fifth
// Epoch shows Tingen's districts plus a "Farther afield" section with inter-city
// travel; earlier epochs show their own era-appropriate region list with travel
// disabled (the CITIES model is Fifth-Epoch only). Every blurb is street-level
// PUBLIC knowledge only — the curated lore is narrator-only by design, so the
// atlas (now `@/lib/lore/gazetteer`) carries its own hand-written copy and can
// never leak what the character hasn't learned. The travel control updates the
// active session's location via the pure `travelTo` engine and persists to
// localStorage (mirroring the session-persist pattern in market-panel.tsx).

export function MapPanel() {
  // The single active character, reactive: switching it (sidebar / character tab)
  // or travelling re-renders this page live (active-character sync).
  const session = useActiveSession();
  const [notice, setNotice] = useState<string | null>(null);

  // One shared resolver (Backlund location sync): the atlas city, the districts
  // (incl. the character's off-map custom venues), and the "you are here" marker
  // all come from `mapAtlasFor`, so the map can never disagree with itself or
  // with the character sheet. An unresolved Fifth-Epoch city yields the neutral
  // "whereabouts uncertain" atlas instead of silently defaulting to Tingen.
  const resolved = session
    ? mapAtlasFor(session.gameState, session.gameState.epoch)
    : null;
  const gazetteer = resolved?.atlas ?? gazetteerForEpoch(undefined);
  const currentCityId = resolved?.resolved.cityId ?? null;
  const currentCityName = resolved?.resolved.cityName ?? null;
  const hereSlug = resolved?.resolved.districtSlug ?? null;
  const whereabouts = resolved ? locationLabel(resolved.resolved) : null;

  const handleTravel = useCallback(
    (cityId: string) => {
      if (!session) return;
      // Companions and pursuers travel with the player (issue #101): the roster's
      // followers are re-asserted at the destination instead of being left behind.
      const roster = resolveTrackedNpcState(session.trackedNpcState);
      const result = travelTo(session.gameState, cityId, session.turnCount, roster);
      if (!result) return;
      const memory = addSessionFact(session.memory, result.fact);
      const next: GameSession = {
        ...session,
        gameState: result.state,
        memory,
        updatedAt: Date.now(),
      };
      const companions = companionsPresentOnMove(roster);
      setNotice(
        companions.length > 0
          ? `You set out for ${result.state.location}. Travelling with: ${companions.join(", ")}.`
          : `You set out for ${result.state.location}.`,
      );
      persistSession(next);
    },
    [session],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-serif text-sm italic text-muted">{gazetteer.intro}</p>
        {whereabouts && (
          <p className="text-xs font-medium text-muted">
            Current whereabouts:{" "}
            <span className="font-semibold text-amber">{whereabouts}</span>
          </p>
        )}
      </div>

      {/* Compass rose — pure ornament. */}
      <div className="flex items-center justify-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="candle-flicker font-serif text-lg text-amber">✦ N ✦</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {gazetteer.districts.map((district) => {
          const here = district.slug === hereSlug;
          return (
            <li
              key={district.slug}
              className={`relative rounded-xl border bg-surface p-5 transition-all duration-200 ${
                here ? "border-amber/40 ring-1 ring-amber/40" : "border-border"
              }`}
            >
              <h2 className="font-serif text-lg font-semibold text-foreground">
                {district.name}
                {here && (
                  <span className="ml-2 rounded-md border border-amber/40 bg-amber/10 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-[0.18em] text-amber uppercase">
                    You are here
                  </span>
                )}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
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
              className="font-serif text-lg font-semibold text-foreground"
            >
              Farther afield
            </h2>
            <div
              className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm text-muted">
            Cities beyond {currentCityName ?? "your current city"}, reachable by rail and
            sea. Setting out for one takes your character there directly.
          </p>

          {notice && (
            <p
              className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-2.5 text-sm font-medium text-amber"
              role="status"
            >
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
                <li
                  key={city.id}
                  className={`relative flex flex-col rounded-xl border bg-surface p-5 ${
                    here ? "border-amber/40 ring-1 ring-amber/40" : "border-border"
                  }`}
                >
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {city.name}
                    {here && (
                      <span className="ml-2 rounded-md border border-amber/40 bg-amber/10 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-[0.18em] text-amber uppercase">
                        You are here
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                    {city.realm}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {city.blurb}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-xs font-medium text-muted">
                      {days !== null
                        ? `Travel: about ${days} day${days === 1 ? "" : "s"}`
                        : "Travel"}
                    </span>
                    {session && !here && (
                      <button
                        type="button"
                        onClick={() => handleTravel(city.id)}
                        disabled={!canGo}
                        className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted"
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

// Reference the freely-reachable CITIES for completeness in the gazetteer's
// footer so the table stays the single source of truth for known destinations.
// Only the dream-gated Forsaken-Land cities (issue #130) are excluded — they must
// stay hidden from a character without the crossing capability. The Southern
// Continent (Balam, issue #138) is freely reachable across the Berserk Sea, so it
// belongs here, like the continent-filtered `fartherCities` list the panel renders.
export const KNOWN_CITY_NAMES = CITIES.filter(
  (c) => (c.continent ?? "central") !== "forsaken-land",
).map((c) => c.name);
