"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { noopSubscribe } from "@/lib/react";
import {
  addItemToInventory,
  addJournalEntries,
  canConvene,
  canFoundSociety,
  createJournal,
  deserializeJournal,
  deserializeSession,
  foundSociety,
  holdGathering,
  recruitMember,
  resolveMemberArc,
  serializeJournal,
  serializeSession,
  GATHERING_COOLDOWN_TURNS,
  JOURNAL_KEY_PREFIX,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
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

export function SocietyPanel() {
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
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<GatheringOutcome | null>(null);

  const persist = useCallback((next: GameSession) => {
    setSession(next);
    try {
      localStorage.setItem(SESSION_KEY_PREFIX + next.id, serializeSession(next));
    } catch {
      // Storage unavailable — in-memory state still updates.
    }
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
                arc: `Sequence ${session.gameState.sequenceLevel}`,
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
      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/70">
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
      <div className="max-w-lg space-y-4">
        <p className="font-serif text-sm leading-relaxed text-foreground/85">
          Your pathway would gather as{" "}
          <span className="text-occult-bright">{SOCIETY_KIND_LABELS[kind]}</span> — a
          circle of code names and careful favors, convened where no one can follow.
        </p>
        {eligible ? (
          <>
            <div>
              <label htmlFor="society-name" className="mb-1 block text-xs text-muted">
                Name it (optional)
              </label>
              <input
                id="society-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={SOCIETY_KIND_LABELS[kind]}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-serif text-sm text-foreground placeholder-muted focus:border-occult/50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleFound}
              className="rounded-md border border-occult/40 bg-occult/[0.08] px-4 py-2 text-sm font-medium text-occult-bright hover:border-occult/60"
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-sm italic text-muted">
          {society.name} · {society.members.length}{" "}
          {society.members.length === 1 ? "member" : "members"} · {society.gatheringCount}{" "}
          {society.gatheringCount === 1 ? "gathering" : "gatherings"} held
        </p>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={handleRecruit}
            className="rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-2 text-xs font-medium text-amber hover:border-amber/50"
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
            className="rounded-md border border-occult/40 bg-occult/[0.08] px-3 py-2 text-xs font-medium text-occult-bright hover:border-occult/60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Convene above the gray fog
          </button>
        </span>
      </div>

      {notice && (
        <p role="status" className="font-serif text-sm italic text-foreground/80">
          {notice}
        </p>
      )}

      {lastOutcome && (
        <section
          aria-label="Latest gathering"
          className="parchment rounded-lg p-5 animate-fade-in"
        >
          <p className="font-serif text-sm leading-relaxed text-foreground/90">
            {lastOutcome.narrativeSeed}
          </p>
          {lastOutcome.facts.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-foreground/80">
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
          className="gaslit font-serif text-lg font-semibold text-amber/90"
        >
          The long table
        </h2>
        {society.members.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Empty seats. Extend an invitation before convening.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {society.members.map((member) => (
              <li key={member.id} className="parchment rounded-md p-4">
                <p className="text-sm font-semibold text-occult-bright">
                  {member.codeName}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  This one {member.pathwayHint}. They {member.arc}.
                </p>
                <div className="mt-3">
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
                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/60"
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
                    className="mt-3 min-h-[24px] rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-1.5 text-xs font-medium text-amber hover:border-amber/50"
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
