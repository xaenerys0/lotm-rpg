"use client";

import type { MemoryState, TurnRecord } from "@/lib/ai";

// ─── The Chronicle ───────────────────────────────────────────────────
//
// A running, illuminated transcript of the story so far — the recent turns the
// memory layer already keeps (the same `immediateTurns` the narrator reads),
// rendered as a continuous chat-like chronicle above the live scene. Combat and
// advancement are engine-decided turns routed through the normal loop, so they
// land in this same transcript as story beats rather than vanishing into a
// disconnected side-screen. Past beats recede; the live scene below stays
// prominent. Derived entirely from persisted memory — no new save state.
//
// Layout: the durable "story so far" summary sits at the top, and the running
// "Chronicle" transcript of recent beats sits below it in its own disclosure.
// Both are collapsible and closed by default, so the live scene stays the focus
// — the player unfolds either to read the recap or the turn-by-turn chat. Both
// are native <details>/<summary>, no client JS.

type BeatKind = "story" | "combat" | "ascension";

interface ChronicleBeat {
  turnNumber: number;
  /** The compact "what you did" line that opened this beat. */
  action: string;
  /** The narrator's prose for the beat. */
  prose: string;
  kind: BeatKind;
}

// The exact, distinctive fragments the engine builds into an engine-decided
// turn's action text — matched precisely so an ordinary story action that merely
// mentions a verb ("I ascend the staircase", "in combat training") is NOT
// mis-tinted. Keep in sync with the action strings in `game-loop.tsx`
// (`handleCombatResult`, `handleAdvancement`, `handleApotheosis`,
// `handlePillarAscension`). A structured `TurnRecord.kind` would remove the
// coupling entirely — a worthwhile follow-up if these grow.
const COMBAT_ACTION_MARK = "in combat; it ended in";
const ASCENSION_ACTION_MARKS = [
  "undergo the advancement", // sequence advancement
  "ascend to sequence 0", // apotheosis
  "ascend above the sequences", // pillar
];

/**
 * Classify a past turn for styling, from the engine-controlled action text.
 * Combat and advancement/apotheosis/pillar turns carry deterministic phrasings;
 * everything else reads as ordinary story.
 */
function classifyBeat(action: string): BeatKind {
  const a = action.toLowerCase();
  if (a.includes(COMBAT_ACTION_MARK)) return "combat";
  if (ASCENSION_ACTION_MARKS.some((mark) => a.includes(mark))) return "ascension";
  return "story";
}

function toBeat(turn: TurnRecord): ChronicleBeat | null {
  const prose = turn.aiResponse.narrative?.trim();
  if (!prose) return null;
  return {
    turnNumber: turn.turnNumber,
    action: turn.playerAction.trim(),
    prose,
    // Prefer the structured engine-turn kind (issue #171); fall back to the
    // action-text classifier for legacy turns saved before `kind` existed.
    kind:
      turn.kind === "combat"
        ? "combat"
        : turn.kind === "advancement"
          ? "ascension"
          : classifyBeat(turn.playerAction),
  };
}

const KIND_RULE: Record<BeatKind, string> = {
  story: "border-amber/40",
  combat: "border-crimson/50",
  ascension: "border-occult/60",
};

const KIND_GLYPH: Record<BeatKind, string> = {
  story: "❦",
  combat: "⚔",
  ascension: "✦",
};

const KIND_LABEL: Record<BeatKind, string> = {
  story: "",
  combat: "Encounter",
  ascension: "Ascension",
};

export function StoryChronicle({ memory }: { memory: MemoryState }) {
  const beats = memory.immediateTurns
    .map(toBeat)
    .filter((b): b is ChronicleBeat => b !== null);
  const summary = memory.runningSummary?.trim();

  // Nothing to chronicle yet (the opening scene) — render nothing.
  if (beats.length === 0 && !summary) return null;

  return (
    <section aria-label="The chronicle so far" className="mb-8">
      {/* The story so far — the durable summary, kept at the top and collapsible. */}
      {summary && (
        <details className="group mb-5">
          <summary className="mb-4 flex cursor-pointer list-none items-center gap-3 marker:content-none">
            <span className="font-serif text-[0.7rem] tracking-[0.3em] text-amber uppercase">
              The story so far
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-amber/40 to-transparent"
            />
            <span
              aria-hidden="true"
              className="inline-block text-amber transition-transform group-open:rotate-90"
            >
              ▸
            </span>
          </summary>
          <p className="font-serif text-sm leading-relaxed text-muted">{summary}</p>
        </details>
      )}

      {/* The Chronicle — the running transcript of recent beats, at the bottom and
          collapsible. Closed by default so the live scene stays the focus; the
          player can unfold it to read the turn as a continuous chat. */}
      {beats.length > 0 && (
        <details className="group">
          <summary className="mb-4 flex cursor-pointer list-none items-center gap-3 marker:content-none">
            <span className="font-serif text-[0.7rem] tracking-[0.3em] text-amber uppercase">
              The Chronicle
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-amber/40 to-transparent"
            />
            <span
              aria-hidden="true"
              className="inline-block text-amber transition-transform group-open:rotate-90"
            >
              ▸
            </span>
          </summary>

          <ol className="space-y-5">
            {beats.map((beat) => (
              <li
                key={beat.turnNumber}
                className={`border-l-2 ${KIND_RULE[beat.kind]} pl-4`}
              >
                <p className="mb-1.5 flex items-baseline gap-2">
                  <span aria-hidden="true" className="text-copper">
                    {KIND_GLYPH[beat.kind]}
                  </span>
                  {KIND_LABEL[beat.kind] && (
                    <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-copper uppercase">
                      {KIND_LABEL[beat.kind]}
                    </span>
                  )}
                  <span className="font-serif text-xs italic text-muted">
                    {beat.action}
                  </span>
                </p>
                <p className="font-serif text-sm leading-[1.8] text-muted">
                  {beat.prose}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
            <span className="text-amber/60">◆</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
          </div>
        </details>
      )}
    </section>
  );
}
