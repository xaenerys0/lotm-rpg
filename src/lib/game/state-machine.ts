import type { GameSession, GameLoopAction, GamePhase } from "./types";
import { VALID_TRANSITIONS } from "./types";

export class InvalidTransitionError extends Error {
  readonly from: GamePhase;
  readonly to: GamePhase;

  constructor(from: GamePhase, to: GamePhase) {
    super(`Invalid phase transition: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function transition(
  session: GameSession,
  action: GameLoopAction,
  now: number = Date.now(),
): GameSession {
  switch (action.type) {
    case "START_SITUATION": {
      assertTransition(session.phase, "situation");
      return {
        ...session,
        phase: "situation",
        currentNarrative: null,
        currentChoices: null,
        selectedChoiceId: null,
        lastResolution: null,
        errorMessage: null,
        errorCode: null,
        updatedAt: now,
      };
    }

    case "SITUATION_READY": {
      assertTransition(session.phase, "choices");
      return {
        ...session,
        phase: "choices",
        currentNarrative: action.narrative,
        currentChoices: action.choices,
        updatedAt: now,
      };
    }

    case "SELECT_CHOICE": {
      assertTransition(session.phase, "resolution");
      const validChoice = session.currentChoices?.some((c) => c.id === action.choiceId);
      if (!validChoice) {
        throw new Error(`Invalid choice ID: ${action.choiceId}`);
      }
      return {
        ...session,
        phase: "resolution",
        selectedChoiceId: action.choiceId,
        // The prior turn's resolution recap (outcome + consequences) only lingers
        // on the merged choices screen; picking the next action moves to the
        // resolution loading state, so drop it.
        lastResolution: null,
        updatedAt: now,
      };
    }

    case "RESOLUTION_READY": {
      assertTransition(session.phase, "consequences");
      return {
        ...session,
        phase: "consequences",
        lastResolution: action.result,
        updatedAt: now,
      };
    }

    case "PRESENT_NEXT_CHOICES": {
      // A normal player turn resolved: the caller has already committed every
      // consequence onto the session (applyResolution + bookkeeping), so this
      // carries the resolution's OWN result + choices straight into `choices` as
      // the next decision point — no separate forward-narration beat. The result
      // is set into `lastResolution` (SELECT_CHOICE cleared the prior turn's), so
      // the choices screen renders the outcome recap + consequences summary from
      // it — `currentNarrative`, which the choices screen reserves for a fresh
      // scene, is cleared.
      assertTransition(session.phase, "choices");
      return {
        ...session,
        phase: "choices",
        turnCount: session.turnCount + 1,
        currentNarrative: null,
        currentChoices: action.choices,
        lastResolution: action.result,
        selectedChoiceId: null,
        activePillar: null,
        pendingPlayerAction: null,
        pendingTurnKind: null,
        updatedAt: now,
      };
    }

    case "ENGINE_RESOLUTION": {
      // An engine-decided turn (advancement / apotheosis): the engine has
      // already committed the outcome onto `session.gameState`, so this carries
      // the narration-only AI response straight into `consequences`, bypassing
      // the AI resolution-generation step. The narration becomes the current
      // narrative and a memory turn record via the normal `handleContinue`.
      assertTransition(session.phase, "consequences");
      return {
        ...session,
        phase: "consequences",
        lastResolution: action.result,
        currentNarrative: action.result.response.narrative,
        selectedChoiceId: null,
        pendingPlayerAction: action.playerAction,
        pendingTurnKind: action.kind ?? null,
        updatedAt: now,
      };
    }

    case "APPLY_CONSEQUENCES": {
      if (session.phase !== "consequences") {
        throw new InvalidTransitionError(session.phase, "situation");
      }
      return {
        ...session,
        phase: "situation",
        turnCount: session.turnCount + 1,
        currentNarrative: null,
        currentChoices: null,
        selectedChoiceId: null,
        lastResolution: null,
        activePillar: null,
        pendingPlayerAction: null,
        pendingTurnKind: null,
        updatedAt: now,
      };
    }

    case "ERROR": {
      return {
        ...session,
        phase: "error",
        errorMessage: action.message,
        errorCode: action.errorCode ?? null,
        updatedAt: now,
      };
    }

    case "RETRY": {
      if (session.phase !== "error") {
        throw new InvalidTransitionError(session.phase, "situation");
      }
      return {
        ...session,
        phase: "situation",
        currentNarrative: null,
        currentChoices: null,
        selectedChoiceId: null,
        lastResolution: null,
        activePillar: null,
        errorMessage: null,
        errorCode: null,
        updatedAt: now,
      };
    }
  }
}

function assertTransition(from: GamePhase, to: GamePhase): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
