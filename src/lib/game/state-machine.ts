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
