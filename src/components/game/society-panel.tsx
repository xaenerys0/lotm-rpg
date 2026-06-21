"use client";

import { useCallback, useState } from "react";

import { persistSession, useActiveSession } from "@/lib/react/session-store";
import {
  addItemToInventory,
  addJournalEntries,
  canConvene,
  canFoundSociety,
  createJournal,
  deserializeJournal,
  foundSociety,
  holdGathering,
  memberArc,
  memberPathwayHint,
  recruitMember,
  resolveMemberArc,
  sequenceLabel,
  serializeJournal,
  GATHERING_COOLDOWN_TURNS,
  JOURNAL_KEY_PREFIX,
  SOCIETY_FOUNDING_SEQUENCE,
  SOCIETY_KIND_LABELS,
  societyKindForPathway,
  type GameSession,
  type GatheringOutcome,
} from "@/lib/game";

// Secret society hub (issue #32): found, recruit, and convene "above the
// gray fog". Gathering outcomes are MECHANICAL — intel becomes memory facts
// the narrator and investigation pillar consume, trades land in the
// inventory, and the journal records the session.

export function SocietyPanel() {
  // The single active character, reactive (active-character sync).
  const session = useActiveSession();
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<GatheringOutcome | null>(null);

  const persist = useCallback((next: GameSession) => {
    persistSession(next);
  }, []);

  const handleFound = useCallback(() => {
    if (!session) return;
    try {
      const society = foundSociety(
        session.gameState.pathwayId,
        session.gameState.sequenceLevel,
        name,
      );
      persist({ ...session, societyState: society, updatedAt: Date.now() });
      setNotice(`${society.name} exists now — quietly.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "The fog declines.");
    }
  }, [session, name, persist]);

  const handleRecruit = useCallback(() => {
    if (!session?.societyState) return;
    try {
      persist({
        ...session,
        societyState: recruitMember(session.societyState),
        updatedAt: Date.now(),
      });
      setNotice("A new figure takes a seat at the long table.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "No one answers the call.");
    }
  }, [session, persist]);

  const handleConvene = useCallback(() => {
    if (!session?.societyState) return;
    try {
      const outcome = holdGathering(session.societyState, session.turnCount);
      let gameState = session.gameState;
      for (const item of outcome.items) {
        gameState = addItemToInventory(gameState, item);
      }
      const next: GameSession = {
        ...session,
        gameState,
        societyState: outcome.society,
        memory: {
          ...session.memory,
          sessionFacts: [...session.memory.sessionFacts, ...outcome.facts],
        },
        updatedAt: Date.now(),
      };
      persist(next);
      setLastOutcome(outcome);
      setNotice(null);
      // The gathering is journal-worthy.
      try {
        const raw = localStorage.getItem(JOURNAL_KEY_PREFIX + session.id);
        const journal = (raw ? deserializeJournal(raw) : null) ?? createJournal();
        localStorage.setItem(
          JOURNAL_KEY_PREFIX + session.id,
          serializeJournal(
            addJournalEntries(journal, [
              {
                id: crypto.randomUUID(),
                turnNumber: session.turnCount,
                createdAt: Date.now(),
                location: "Above the gray fog",
                eventType: "major-event",
                summary: `${outcome.society.name} convened.`,
                narrative: outcome.narrativeSeed,
                involvedNpcs: outcome.society.members.map((m) => m.codeName),
                arc:
                  session.gameState.sequenceLevel <= 0
                    ? sequenceLabel(
                        session.gameState.pathwayId,
                        session.gameState.sequenceLevel,
                      )
                    : `Sequence ${session.gameState.sequenceLevel}`,
                characterId: session.gameState.characterId,
                ...(session.gameState.characterName
                  ? { characterName: session.gameState.characterName }
                  : {}),
              },
            ]),
          ),
        );
      } catch {
        // Journal unavailable — the gathering still happened.
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "The fog stays shut.");
    }
  }, [session, persist]);

  const handleResolveArc = useCallback(
    (memberId: string) => {
      if (!session?.societyState) return;
      const { society, fact } = resolveMemberArc(session.societyState, memberId);
      if (!fact) return;
      persist({
        ...session,
        societyState: society,
        memory: {
          ...session.memory,
          sessionFacts: [...session.memory.sessionFacts, fact],
        },
        updatedAt: Date.now(),
      });
      setNotice(fact.description);
    },
    [session, persist],
  );

  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-serif text-lg italic text-foreground">
          &ldquo;The long table waits in the fog&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Begin a game first — societies gather around someone.
        </p>
      </div>
    );
  }

  const society = session.societyState;
  const kind = societyKindForPathway(session.gameState.pathwayId);

  if (!society) {
    const eligible = canFoundSociety(session.gameState.sequenceLevel);
    return (
      <div className="max-w-lg space-y-5 rounded-xl border border-border bg-surface p-6">
        <p className="font-serif text-sm leading-relaxed text-foreground">
          Your pathway would gather as{" "}
          <span className="text-occult-bright">{SOCIETY_KIND_LABELS[kind]}</span> — a
          circle of code names and careful favors, convened where no one can follow.
        </p>
        {eligible ? (
          <>
            <div>
              <label
                htmlFor="society-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
              >
                Name it (optional)
              </label>
              <input
                id="society-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={SOCIETY_KIND_LABELS[kind]}
                className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 font-serif text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>
            <button
              type="button"
              onClick={handleFound}
              className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
            >
              Found it
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">
            You lack the standing to gather others — reach Sequence{" "}
            {SOCIETY_FOUNDING_SEQUENCE} first.
          </p>
        )}
        {notice && (
          <p role="status" className="text-xs italic text-muted">
            {notice}
          </p>
        )}
      </div>
    );
  }

  const convenable = canConvene(society, session.turnCount);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <p className="font-serif text-sm italic text-muted">
          {society.name} · {society.members.length}{" "}
          {society.members.length === 1 ? "member" : "members"} · {society.gatheringCount}{" "}
          {society.gatheringCount === 1 ? "gathering" : "gatherings"} held
        </p>
        <span className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRecruit}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
          >
            Extend an invitation
          </button>
          <button
            type="button"
            onClick={handleConvene}
            disabled={!convenable}
            title={
              convenable
                ? undefined
                : `The fog opens every ${GATHERING_COOLDOWN_TURNS} turns, and only for a peopled table.`
            }
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Convene above the gray fog
          </button>
        </span>
      </div>

      {notice && (
        <p role="status" className="font-serif text-sm italic text-foreground">
          {notice}
        </p>
      )}

      {lastOutcome && (
        <section
          aria-label="Latest gathering"
          className="parchment rounded-xl p-6 animate-fade-in"
        >
          <p className="font-serif text-sm leading-relaxed text-foreground">
            {lastOutcome.narrativeSeed}
          </p>
          {lastOutcome.facts.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              {lastOutcome.facts.map((fact) => (
                <li key={fact.description}>
                  <span aria-hidden="true" className="mr-2 text-occult-bright">
                    ✧
                  </span>
                  {fact.description}
                </li>
              ))}
            </ul>
          )}
          {lastOutcome.items.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Traded across the table:{" "}
              {lastOutcome.items.map((item) => item.name).join(", ")} — now in your
              satchel.
            </p>
          )}
          {lastOutcome.facts.length === 0 && lastOutcome.items.length === 0 && (
            <p className="mt-3 text-xs text-muted">
              A quiet session. Trust, at least, was built.
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="society-members">
        <h2
          id="society-members"
          className="gaslit font-serif text-lg font-semibold text-foreground"
        >
          The long table
        </h2>
        {society.members.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Empty seats. Extend an invitation before convening.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {society.members.map((member) => (
              <li
                key={member.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="text-sm font-semibold text-occult-bright">
                  {member.codeName}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  This one {memberPathwayHint(member)}. They {memberArc(member)}.
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span id={`trust-${member.id}`}>Trust</span>
                    <span>{member.disposition}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-labelledby={`trust-${member.id}`}
                    aria-valuenow={member.disposition}
                    aria-valuemin={-100}
                    aria-valuemax={100}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className="h-full bg-occult"
                      style={{ width: `${(member.disposition + 100) / 2}%` }}
                    />
                  </div>
                </div>
                {member.arcStage >= 3 && (
                  <button
                    type="button"
                    onClick={() => handleResolveArc(member.id)}
                    className="mt-4 min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:border-amber/40"
                  >
                    Help settle their matter
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
