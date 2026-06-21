"use client";

import { useCallback, useState } from "react";

import { useActiveSession } from "@/lib/react/session-store";
import { createClient } from "@/lib/supabase/client";
import { getPathway } from "@/lib/rules";
import {
  divergenceScore,
  evaluateAchievements,
  getAchievement,
  publishShowcase,
  sequenceClassificationFor,
  sequenceLabel,
  showcaseStats,
  toShowcaseRow,
  type ShowcaseClient,
} from "@/lib/game";

// Player profile / showcase (issue #18): achievements, divergence, and public
// stats for the active chronicle, with explicit publish + privacy control.
// Nothing leaves the device until the player presses Publish.

export function ShowcasePanel() {
  // The single active character, reactive (active-character sync).
  const session = useActiveSession();

  const [displayName, setDisplayName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handlePublish = useCallback(() => {
    if (!session) return;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setNotice("Sign in to publish your showcase.");
          return;
        }
        const row = toShowcaseRow(session, {
          userId: data.user.id,
          displayName,
          isPublic,
          achievementIds: evaluateAchievements(session),
          divergence: divergenceScore(session),
          stats: showcaseStats(session),
        });
        await publishShowcase(supabase as unknown as ShowcaseClient, row);
        setNotice(
          isPublic
            ? "Your record now hangs on the board for other Beyonders to read."
            : "Saved — and kept private. Only you can see it.",
        );
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "The board refused the entry.");
      }
    })();
  }, [session, displayName, isPublic]);

  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-serif text-lg italic text-foreground">
          &ldquo;No record yet bears your name&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Begin a game and your deeds will gather here.
        </p>
      </div>
    );
  }

  const pathway = getPathway(session.gameState.pathwayId);
  const earned = evaluateAchievements(session);
  const divergence = divergenceScore(session);
  const stats = showcaseStats(session);

  return (
    <div className="space-y-8">
      {/* Identity */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          {session.gameState.characterName ?? "Unnamed Beyonder"}
        </h2>
        <p className="mt-1 font-serif text-sm italic text-muted">
          {session.gameState.sequenceLevel <= 0
            ? `${sequenceLabel(session.gameState.pathwayId, session.gameState.sequenceLevel)} — ${sequenceClassificationFor(session.gameState.sequenceLevel)}`
            : `Sequence ${session.gameState.sequenceLevel} ${sequenceLabel(session.gameState.pathwayId, session.gameState.sequenceLevel)}`}{" "}
          · {pathway?.name ?? "Unknown"} Pathway
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Turns
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{stats.turns}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Combats won
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              {stats.combatsWon}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Potions
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              {stats.potionsConsumed}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Purse
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{stats.funds}p</dd>
          </div>
        </dl>
      </section>

      {/* Divergence */}
      <section
        aria-labelledby="profile-divergence"
        className="rounded-xl border border-border bg-surface p-6"
      >
        <h2
          id="profile-divergence"
          className="font-serif text-lg font-semibold text-foreground"
        >
          Timeline divergence
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div
            role="progressbar"
            aria-labelledby="profile-divergence"
            aria-valuenow={divergence}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised"
          >
            <div className="h-full bg-occult" style={{ width: `${divergence}%` }} />
          </div>
          <span className="text-sm font-semibold text-occult-bright">{divergence}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          How far this world has drifted from the untouched canon — a heuristic over your
          story&rsquo;s length, the fallen it remembers, and the roads taken.
        </p>
      </section>

      {/* Achievements */}
      <section aria-labelledby="profile-achievements">
        <h2
          id="profile-achievements"
          className="font-serif text-lg font-semibold text-foreground"
        >
          Achievements ({earned.length})
        </h2>
        {earned.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None yet — the fog is patient.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((id) => {
              const achievement = getAchievement(id)!;
              return (
                <li key={id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm font-semibold text-foreground">
                    <span aria-hidden="true" className="mr-2 text-gold">
                      ✦
                    </span>
                    {achievement.name}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {achievement.description}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Publish + privacy */}
      <section
        aria-labelledby="profile-publish"
        className="max-w-md space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2
          id="profile-publish"
          className="font-serif text-lg font-semibold text-foreground"
        >
          The public board
        </h2>
        <div>
          <label htmlFor="profile-name" className="mb-1.5 block text-xs text-muted">
            Display name
          </label>
          <input
            id="profile-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={session.gameState.characterName ?? "A nameless Beyonder"}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-raised p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Public showcase</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Off by default. Private showcases are visible only to you — they never
              appear on the leaderboard.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-label="Public showcase"
            onClick={() => setIsPublic((v) => !v)}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
              isPublic
                ? "border-amber bg-amber/30"
                : "border-border bg-surface hover:border-amber/40"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 ${
                isPublic ? "translate-x-5 bg-amber" : "translate-x-1 bg-muted"
              }`}
            />
          </button>
        </div>
        <button
          type="button"
          onClick={handlePublish}
          className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
        >
          Publish
        </button>
        {notice && (
          <p role="status" className="text-xs italic text-muted">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
