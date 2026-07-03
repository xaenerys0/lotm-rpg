"use client";

import { useCallback, useState } from "react";

import { persistSession, useActiveSession } from "@/lib/react/session-store";
import {
  addItemToInventory,
  addJournalEntries,
  applyGatheringNarration,
  canConvene,
  canFoundSociety,
  canonCandidateSeeds,
  commitAndIntegrateMember,
  createJournal,
  deserializeJournal,
  foundSociety,
  getCity,
  holdGathering,
  invitedCanonIds,
  memberArc,
  memberPathwayHint,
  recruitMember,
  resolveMemberArc,
  sequenceLabel,
  serializeJournal,
  GATHERING_COOLDOWN_TURNS,
  JOURNAL_KEY_PREFIX,
  PROVIDER_CONFIG_KEY,
  SOCIETY_FOUNDING_SEQUENCE,
  SOCIETY_KIND_LABELS,
  societyKindForPathway,
  type GameSession,
  type GatheringOutcome,
  type SocietyKind,
  type SocietyState,
} from "@/lib/game";
import {
  generateGathering,
  generateInvitationOutcome,
  generateSocietyCandidates,
  generateSocietyIdentity,
  type ProviderConfig,
  type SocietyCandidate,
} from "@/lib/ai";
import { getEpoch } from "@/lib/lore";
import { getPathway, getSequence } from "@/lib/rules";

// The Gathering (/society): an AI-DRIVEN secret-society hub grounded on the LOTM
// corpus but free to diverge. Canon takeovers begin with their real society
// (Klein → the empty Tarot Club); the "extend an invitation" mechanic models the
// Fool reaching from above the gray fog to pull a distant Beyonder in — canon
// figures (Audrey/Justice, …) AND invented NPCs are candidates. All AI affordances
// are provider-gated with a working deterministic fallback (no provider → the
// engine's own random recruit + template gathering prose); the engine owns every
// mechanic, the AI only supplies text. A recruited member is ALSO registered as a
// tracked ally and a Codex person, so the narrator knows them and they can appear
// in the story.

/** A short corpus flavour line per kind, for grounding the AI's society identity. */
const KIND_CANON_REFERENCE: Partial<Record<SocietyKind, string>> = {
  "tarot-club":
    "The Tarot Club: Beyonders who convene above the gray fog, known to one another only by the tarot cards they hold, trading intelligence and formulas.",
};

/** How many wholly-invented candidates a slate adds beyond the canon seeds. */
const INVENT_COUNT = 3;

function loadProviderConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as ProviderConfig) : null;
  } catch {
    return null;
  }
}

/** The founder's pathway + role names for grounding the AI generators. */
function founderNames(session: GameSession): {
  pathwayName: string;
  sequenceName: string;
} {
  const { pathwayId, sequenceLevel } = session.gameState;
  return {
    pathwayName: getPathway(pathwayId)?.name ?? "an unknown pathway",
    sequenceName:
      getSequence(pathwayId, sequenceLevel)?.name ??
      sequenceLabel(pathwayId, sequenceLevel),
  };
}

function cityNameFor(session: GameSession): string | undefined {
  const cityId = session.gameState.currentCity;
  return cityId ? getCity(cityId)?.name : undefined;
}

function epochLabelFor(session: GameSession): string {
  return getEpoch(session.gameState.epoch).name;
}

export function SocietyPanel() {
  // The single active character, reactive (active-character sync).
  const session = useActiveSession();
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<GatheringOutcome | null>(null);

  // AI-founding draft fields (filled by "Suggest an identity", player-editable).
  const [description, setDescription] = useState("");
  const [ethos, setEthos] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");

  // Invitation slate (transient — regenerated, never persisted).
  const [candidates, setCandidates] = useState<SocietyCandidate[] | null>(null);
  const [invitationNarrative, setInvitationNarrative] = useState<string | null>(null);

  // Async status flags.
  const [busy, setBusy] = useState<
    null | "identity" | "candidates" | "invite" | "convene"
  >(null);

  const persist = useCallback((next: GameSession) => {
    persistSession(next);
  }, []);

  const clearMessages = useCallback(() => {
    setNotice(null);
    setError(null);
  }, []);

  // --- Founding -------------------------------------------------------------

  const handleSuggestIdentity = useCallback(async () => {
    if (!session) return;
    const config = loadProviderConfig();
    if (!config) {
      setError(
        "Configure an AI provider in Settings to have one suggested — or name it yourself below.",
      );
      return;
    }
    clearMessages();
    setBusy("identity");
    try {
      const kind = societyKindForPathway(session.gameState.pathwayId);
      const { pathwayName, sequenceName } = founderNames(session);
      const identity = await generateSocietyIdentity(config, {
        kindLabel: SOCIETY_KIND_LABELS[kind],
        pathwayName,
        sequenceName,
        epochLabel: epochLabelFor(session),
        cityName: cityNameFor(session),
        canonKindReference: KIND_CANON_REFERENCE[kind],
        variety: Math.floor(Math.random() * 1_000_000),
      });
      if (!identity) {
        setError("The fog offered no name. Try again, or name it yourself.");
        return;
      }
      setName(identity.name);
      setDescription(identity.description);
      setEthos(identity.ethos);
      setMeetingPlace(identity.meetingPlace);
      setNotice("A shape rises from the fog — edit it, then found it.");
    } catch {
      setError("The suggestion failed. Name it yourself, or try again.");
    } finally {
      setBusy(null);
    }
  }, [session, clearMessages]);

  const handleFound = useCallback(() => {
    if (!session) return;
    clearMessages();
    try {
      const base = foundSociety(
        session.gameState.pathwayId,
        session.gameState.sequenceLevel,
        name,
      );
      // Layer any AI (or hand-edited) fiction onto the founded society.
      const society: SocietyState = {
        ...base,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(ethos.trim() ? { ethos: ethos.trim() } : {}),
        ...(meetingPlace.trim() ? { meetingPlace: meetingPlace.trim() } : {}),
      };
      persist({ ...session, societyState: society, updatedAt: Date.now() });
      setNotice(`${society.name} exists now — quietly.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The fog declines.");
    }
  }, [session, name, description, ethos, meetingPlace, persist, clearMessages]);

  // --- Invitations ----------------------------------------------------------

  const handleSeekCandidates = useCallback(async () => {
    if (!session?.societyState) return;
    const config = loadProviderConfig();
    clearMessages();
    setInvitationNarrative(null);
    // No provider → the deterministic fallback: a random code name takes a seat.
    if (!config) {
      try {
        persist({
          ...session,
          societyState: recruitMember(session.societyState),
          updatedAt: Date.now(),
        });
        setNotice(
          "A figure takes a seat at the long table. (Configure an AI provider in Settings to choose whom to invite.)",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "No one answers the call.");
      }
      return;
    }
    setBusy("candidates");
    try {
      const society = session.societyState;
      const { pathwayName } = founderNames(session);
      const seated = new Set(invitedCanonIds(society));
      const seeds = canonCandidateSeeds(society.kind, {
        excludeCanonIds: [...seated],
        excludeSelfId: session.gameState.canonCharacterId,
      });
      const slate = await generateSocietyCandidates(config, {
        societyName: society.name,
        kindLabel: SOCIETY_KIND_LABELS[society.kind],
        pathwayName,
        epochLabel: epochLabelFor(session),
        cityName: cityNameFor(session),
        sequenceLevel: session.gameState.sequenceLevel,
        canonSeeds: seeds,
        inventCount: INVENT_COUNT,
        variety: Math.floor(Math.random() * 1_000_000),
      });
      // Belt-and-braces beyond the seed exclusion: drop any canon candidate the
      // model echoed back despite being already seated, AND any INTRA-slate
      // duplicate canonId (a model may list the same seed twice — committing the
      // second would then throw).
      const slateSeen = new Set<string>();
      const fresh = slate.filter((candidate) => {
        if (!candidate.canonId) return true;
        if (seated.has(candidate.canonId) || slateSeen.has(candidate.canonId)) {
          return false;
        }
        slateSeen.add(candidate.canonId);
        return true;
      });
      if (fresh.length === 0) {
        setError("No one answered the call this time. Try again.");
        return;
      }
      setCandidates(fresh);
    } catch {
      setError("The summoning faltered. Try again.");
    } finally {
      setBusy(null);
    }
  }, [session, persist, clearMessages]);

  const handleExtendInvitation = useCallback(
    async (candidate: SocietyCandidate) => {
      if (!session?.societyState) return;
      const config = loadProviderConfig();
      if (!config) {
        setError(
          "Configure an AI provider in Settings to extend an invitation to a chosen candidate.",
        );
        return;
      }
      clearMessages();
      setInvitationNarrative(null);
      setBusy("invite");
      try {
        const society = session.societyState;
        const { sequenceName } = founderNames(session);
        const outcome = await generateInvitationOutcome(config, {
          societyName: society.name,
          kindLabel: SOCIETY_KIND_LABELS[society.kind],
          meetingPlace: society.meetingPlace,
          inviterRoleName: sequenceName,
          candidate: {
            codeName: candidate.codeName,
            realName: candidate.realName,
            dossier: candidate.dossier,
            origin: candidate.origin,
          },
        });
        if (!outcome) {
          setError("The fog swallowed your call. Try again.");
          return;
        }
        setInvitationNarrative(outcome.narrative);
        if (!outcome.accepted) {
          setCandidates((prev) => (prev ?? []).filter((c) => c !== candidate));
          setNotice(`${candidate.codeName} declines the invitation.`);
          return;
        }
        // Commit FIRST; only drop the candidate from the slate once the member is
        // actually seated, so a commit failure (a duplicate the model re-minted, a
        // full table) leaves the entry available to retry rather than vanishing.
        // The pure engine helper seats the member AND integrates them as a tracked
        // ally + Codex person (full-world integration).
        persist({
          ...commitAndIntegrateMember(session, {
            codeName: candidate.codeName,
            pathwayHintProse: candidate.pathwayHint,
            arcProse: candidate.arc,
            origin: candidate.origin,
            note: candidate.dossier,
            ...(candidate.realName ? { realName: candidate.realName } : {}),
            ...(candidate.canonId ? { canonId: candidate.canonId } : {}),
          }),
          updatedAt: Date.now(),
        });
        setCandidates((prev) => (prev ?? []).filter((c) => c !== candidate));
        setNotice(`${candidate.codeName} takes a seat at the long table.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The invitation went unanswered.");
      } finally {
        setBusy(null);
      }
    },
    [session, persist, clearMessages],
  );

  const handleDismissCandidate = useCallback((candidate: SocietyCandidate) => {
    setCandidates((prev) => (prev ?? []).filter((c) => c !== candidate));
  }, []);

  // --- Gatherings -----------------------------------------------------------

  const handleConvene = useCallback(async () => {
    if (!session?.societyState) return;
    clearMessages();
    setBusy("convene");
    try {
      let outcome = holdGathering(session.societyState, session.turnCount);
      // Provider present → overlay AI prose onto the deterministic outcome.
      const config = loadProviderConfig();
      if (config) {
        try {
          const society = outcome.society;
          const narration = await generateGathering(config, {
            societyName: society.name,
            kindLabel: SOCIETY_KIND_LABELS[society.kind],
            meetingPlace: society.meetingPlace,
            members: society.members.map((member) => ({
              codeName: member.codeName,
              pathwayHint: memberPathwayHint(member),
              arc: memberArc(member),
              disposition: member.disposition,
            })),
            sharerCodeNames: outcome.sharers,
            itemTraded: outcome.items.length > 0,
            locationName: session.gameState.location,
            epochLabel: epochLabelFor(session),
          });
          if (narration) outcome = applyGatheringNarration(outcome, narration);
        } catch {
          // Best-effort: keep the deterministic prose on any AI failure.
        }
      }

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
      writeGatheringJournal(session, outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The fog stays shut.");
    } finally {
      setBusy(null);
    }
  }, [session, persist, clearMessages]);

  const handleResolveArc = useCallback(
    (memberId: string) => {
      if (!session?.societyState) return;
      clearMessages();
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
    [session, persist, clearMessages],
  );

  // --- Render ---------------------------------------------------------------

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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSuggestIdentity}
                disabled={busy !== null}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === "identity" ? "Consulting the fog…" : "Suggest an identity (AI)"}
              </button>
            </div>
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
            <div>
              <label
                htmlFor="society-description"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
              >
                What it is (optional)
              </label>
              <textarea
                id="society-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 font-serif text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>
            <div>
              <label
                htmlFor="society-ethos"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
              >
                Its creed (optional)
              </label>
              <input
                id="society-ethos"
                type="text"
                value={ethos}
                onChange={(e) => setEthos(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 font-serif text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>
            <div>
              <label
                htmlFor="society-meeting"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
              >
                Where it convenes (optional)
              </label>
              <input
                id="society-meeting"
                type="text"
                value={meetingPlace}
                onChange={(e) => setMeetingPlace(e.target.value)}
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
        {error && (
          <p role="alert" className="text-xs italic text-crimson">
            {error}
          </p>
        )}
      </div>
    );
  }

  const convenable = canConvene(society, session.turnCount);

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-serif text-sm italic text-muted">
            {society.name} · {society.members.length}{" "}
            {society.members.length === 1 ? "member" : "members"} ·{" "}
            {society.gatheringCount}{" "}
            {society.gatheringCount === 1 ? "gathering" : "gatherings"} held
          </p>
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSeekCandidates}
              disabled={busy !== null}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "candidates" ? "Seeking…" : "Seek someone to invite"}
            </button>
            <button
              type="button"
              onClick={handleConvene}
              disabled={!convenable || busy !== null}
              title={
                convenable
                  ? undefined
                  : `The fog opens every ${GATHERING_COOLDOWN_TURNS} turns, and only for a peopled table.`
              }
              className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "convene" ? "Convening…" : "Convene the gathering"}
            </button>
          </span>
        </div>
        {(society.description || society.ethos || society.meetingPlace) && (
          <div className="space-y-1.5 border-t border-border pt-3 text-sm text-muted">
            {society.description && (
              <p className="font-serif leading-relaxed text-foreground">
                {society.description}
              </p>
            )}
            {society.ethos && (
              <p>
                <span className="text-amber">Creed:</span> {society.ethos}
              </p>
            )}
            {society.meetingPlace && (
              <p>
                <span className="text-amber">Convenes:</span> {society.meetingPlace}
              </p>
            )}
          </div>
        )}
      </div>

      {notice && (
        <p role="status" className="font-serif text-sm italic text-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="font-serif text-sm italic text-crimson">
          {error}
        </p>
      )}

      {/* The summoning narration renders OUTSIDE the candidate-slate gate so the
          prose survives inviting the LAST candidate (which empties the slate). */}
      {invitationNarrative && (
        <p
          aria-label="Invitation outcome"
          className="parchment rounded-xl p-4 font-serif text-sm leading-relaxed text-foreground animate-fade-in"
        >
          {invitationNarrative}
        </p>
      )}

      {candidates && candidates.length > 0 && (
        <section aria-labelledby="society-candidates" className="space-y-4">
          <h2
            id="society-candidates"
            className="gaslit font-serif text-lg font-semibold text-foreground"
          >
            Whom to summon
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate, i) => (
              <li
                key={`${candidate.codeName}-${i}`}
                className="flex flex-col rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-occult-bright">
                    {candidate.codeName}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      candidate.origin === "canon"
                        ? "bg-amber/15 text-amber"
                        : "bg-border/60 text-muted"
                    }`}
                  >
                    {candidate.origin === "canon" ? "Canon" : "Original"}
                  </span>
                </div>
                {candidate.realName && (
                  <p className="mt-0.5 text-xs text-muted">{candidate.realName}</p>
                )}
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                  {candidate.dossier ||
                    `This one ${candidate.pathwayHint || "keeps their nature hidden"}.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendInvitation(candidate)}
                    disabled={busy !== null}
                    className="min-h-[24px] rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy === "invite" ? "Reaching…" : "Extend the invitation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissCandidate(candidate)}
                    disabled={busy !== null}
                    className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Pass
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
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
                {member.realName && member.realName !== member.codeName && (
                  <p className="mt-0.5 text-xs text-muted">{member.realName}</p>
                )}
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

/** Record a gathering as a major-event journal entry (best-effort, localStorage). */
function writeGatheringJournal(session: GameSession, outcome: GatheringOutcome): void {
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
            location: outcome.society.meetingPlace ?? "Above the gray fog",
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
}
