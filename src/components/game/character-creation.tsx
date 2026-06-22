"use client";

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  PATHWAY_DESCRIPTIONS,
  createPrologueMemory,
  createAIPrologueMemory,
  buildPrologueRecap,
  tallyAffinities,
  selectTopCandidates,
  dominantAffinity,
  PROVIDER_CONFIG_KEY,
  PROLOGUE_DRAFT_KEY,
  isValidDraftShape,
  clearDraft,
  TUTORIAL_SCENES,
} from "@/lib/game";
import {
  DEFAULT_EPOCH_ID,
  EPOCHS,
  startLocationsForEpoch,
  startOptionSuitsPathway,
  describeStartLocation,
  startArchetypesForEpoch,
  forsakenLandStartsForEpoch,
  forsakenLandArchetypesForEpoch,
  circleNpcSuggestions,
  MAX_TIE_LENGTH,
  MAX_COMPANIONS,
  MAX_COMPANION_LENGTH,
  type StartSelection,
} from "@/lib/lore";
import type { PrologueDraft } from "@/lib/game";
import type { MemoryState } from "@/lib/ai";
import { ALL_PATHWAYS, getSequence, PATHWAY_GROUPS } from "@/lib/rules";
import { noopSubscribe } from "@/lib/react";
import { StepHeader, ChoiceCard } from "./creation-ui";
import {
  generatePrologueScene,
  generatePrologueFinale,
  MIN_PROLOGUE_SCENES,
  MAX_PROLOGUE_SCENES,
} from "@/lib/ai";
import type {
  AIPrologueResponse,
  AIPrologueFinale,
  AIPrologueChoice,
  PrologueTurn,
  ProviderConfig,
} from "@/lib/ai";

// The player's freeform backstory limit (issue #92 — raised from 280 so a rich,
// prefilled-style backstory can fit; canon-takeover presets supply their own
// much longer durable backgrounds out of band).
const MAX_BACKGROUND_LENGTH = 1200;

type CreationStep =
  | "tutorial"
  | "mode-select"
  | "character-setup"
  | "ai-prologue"
  | "recommendation"
  | "character-sheet"
  | "first-potion";

/** The opening-chooser families on the final step (the start-opening picker). */
type OpeningMode = "random" | "place" | "circle" | "custom" | "origin";

const AI_PATH: CreationStep[] = ["character-setup", "ai-prologue", "first-potion"];
const MANUAL_PATH: CreationStep[] = ["recommendation", "character-sheet", "first-potion"];

/** Pathway families, in canonical order, for the grouped manual-path picker. */
const ALL_GROUPS = Object.values(PATHWAY_GROUPS);

function getProgress(step: CreationStep, skipPrologue: boolean) {
  const steps = skipPrologue ? MANUAL_PATH : AI_PATH;
  const i = steps.indexOf(step);
  return { number: i + 1, total: steps.length, show: i >= 0 };
}

interface CharacterCreationProps {
  onComplete: (
    pathwayId: number,
    characterName: string,
    characterBackground: string,
    initialMemory: MemoryState,
    epoch: number,
    prologueRecap: string,
    /** How the chronicle opens — place, curated archetype, custom circle, or
     * random (issue #131). One discriminated value, never a set of nullables. */
    start: StartSelection,
  ) => void;
  onBack: () => void;
}

export function CharacterCreation({ onComplete, onBack }: CharacterCreationProps) {
  // Provider config — read once from localStorage
  const configCacheRef = useRef<ProviderConfig | null | undefined>(undefined);
  const providerConfig = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (configCacheRef.current === undefined) {
        try {
          const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
          configCacheRef.current = raw ? (JSON.parse(raw) as ProviderConfig) : null;
        } catch {
          configCacheRef.current = null;
        }
      }
      return configCacheRef.current ?? null;
    },
    () => null,
  );

  // Prologue draft — read once from localStorage (restored on refresh/navigation)
  const draftCacheRef = useRef<PrologueDraft | null | undefined>(undefined);
  const savedDraft = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (draftCacheRef.current === undefined) {
        try {
          const raw = localStorage.getItem(PROLOGUE_DRAFT_KEY);
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            draftCacheRef.current = isValidDraftShape(parsed) ? parsed : null;
          } else {
            draftCacheRef.current = null;
          }
        } catch {
          draftCacheRef.current = null;
        }
      }
      return draftCacheRef.current ?? null;
    },
    () => null,
  );

  // Step / flow state — restored from draft when available
  const [step, setStep] = useState<CreationStep>(savedDraft?.step ?? "mode-select");
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [epoch, setEpoch] = useState(DEFAULT_EPOCH_ID);
  const [skipPrologue, setSkipPrologue] = useState(false);
  // The single start pick on the final step (varied story openings + start
  // archetypes, issue #131). One field so the choice can never be inconsistent:
  // `""` = "Surprise me" (random), `"archetype:<id>"` = a curated circle preset,
  // `"custom"` = describe-your-own-circle, anything else = a preferred location.
  const [startChoice, setStartChoice] = useState<string>("");
  const archetypeId = startChoice.startsWith("archetype:")
    ? startChoice.slice("archetype:".length)
    : null;
  // Custom-circle form (the "Describe your own circle" path). Creativity is never
  // capped by the presets: any tie, and companions that may be canon OR invented.
  const [customTie, setCustomTie] = useState("");
  const [customCompanions, setCustomCompanions] = useState<string[]>([]);
  const [customCompanionDraft, setCustomCompanionDraft] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  // Origin starts (issue #132) are hidden behind an explicit opt-in: a character
  // beginning inside a sealed, access-gated continent (the Forsaken Land) is an
  // advanced choice the default picker must not surface.
  const [showOrigins, setShowOrigins] = useState(false);
  // Which family of openings the final-step chooser is showing. Purely a UI
  // concern — `startChoice` remains the single source of truth that
  // `handleBeginChronicle` resolves into the discriminated `StartSelection`;
  // the mode just decides which set of option cards is revealed (so the player
  // browses places, circles, or the sealed origins as cards instead of hunting
  // through one crammed native dropdown).
  const [openingMode, setOpeningMode] = useState<OpeningMode>("random");

  // Character identity — restored from draft when available
  const [characterName, setCharacterName] = useState(savedDraft?.characterName ?? "");
  const [characterBackground, setCharacterBackground] = useState(
    savedDraft?.characterBackground ?? "",
  );

  // Pathway selection — restored from draft when available
  const [selectedPathwayId, setSelectedPathwayId] = useState<number | null>(
    savedDraft?.selectedPathwayId ?? null,
  );

  // AI prologue state — restored from draft when available
  const [prologueHistory, setPrologueHistory] = useState<PrologueTurn[]>(
    savedDraft?.prologueHistory ?? [],
  );
  const [currentScene, setCurrentScene] = useState<AIPrologueResponse | null>(null);
  const [finale, setFinale] = useState<AIPrologueFinale | null>(
    savedDraft?.finale ?? null,
  );
  // Whether the next AI call should produce the finale (vs. another scene).
  // Used so retry/resume re-runs the correct generator after an error.
  const [awaitingFinale, setAwaitingFinale] = useState(savedDraft?.finale != null);
  const [prologueLoading, setPrologueLoading] = useState(false);
  const [prologueError, setPrologueError] = useState<string | null>(null);

  // ── Draft Persistence ──
  // Save to localStorage whenever prologue-relevant state changes
  useEffect(() => {
    if (step !== "ai-prologue" && step !== "first-potion") return;
    const draft: PrologueDraft = {
      step,
      characterName,
      characterBackground,
      prologueHistory,
      selectedPathwayId,
      finale,
    };
    try {
      localStorage.setItem(PROLOGUE_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage full — ignore
    }
  }, [
    step,
    characterName,
    characterBackground,
    prologueHistory,
    selectedPathwayId,
    finale,
  ]);

  // ── AI Prologue Generation ──

  // Shared loading/error envelope for both prologue generators: clear the
  // prior view, run the work, surface any error, settle loading.
  const runPrologueRequest = useCallback(async (work: () => Promise<void>) => {
    setPrologueLoading(true);
    setPrologueError(null);
    setCurrentScene(null);
    setFinale(null);
    try {
      await work();
    } catch (err) {
      setPrologueError(
        err instanceof Error ? err.message : "The fog refused to part. Please retry.",
      );
    } finally {
      setPrologueLoading(false);
    }
  }, []);

  const runPrologueScene = useCallback(
    (config: ProviderConfig, name: string, bg: string, history: PrologueTurn[]) =>
      runPrologueRequest(async () => {
        // Thread the chosen epoch so the becoming is narrated in the right era
        // (the prologue runs on its own system prompt, not `assemblePrompt`).
        setCurrentScene(await generatePrologueScene(config, name, bg, history, epoch));
      }),
    [runPrologueRequest, epoch],
  );

  // The finale is engine-decided: the cumulative affinity tally narrows the
  // field to a handful of candidate potions; the AI only renders them and the
  // player picks. The candidate set is a deterministic function of history.
  const runFinale = useCallback(
    (config: ProviderConfig, name: string, bg: string, history: PrologueTurn[]) =>
      runPrologueRequest(async () => {
        const candidates = selectTopCandidates(
          tallyAffinities(history.map((t) => t.selectedAffinities)),
        );
        setFinale(
          await generatePrologueFinale(config, name, bg, history, candidates, epoch),
        );
      }),
    [runPrologueRequest, epoch],
  );

  const handleBeginAIPrologue = useCallback(() => {
    if (!characterName.trim() || !providerConfig) return;
    setStep("ai-prologue");
    setPrologueHistory([]);
    setFinale(null);
    setAwaitingFinale(false);
    setSelectedPathwayId(null);
    void runPrologueScene(
      providerConfig,
      characterName.trim(),
      characterBackground.trim(),
      [],
    );
  }, [characterName, characterBackground, providerConfig, runPrologueScene]);

  const handleChoiceSelect = useCallback(
    (choice: AIPrologueChoice) => {
      if (!currentScene || !providerConfig) return;
      const newTurn: PrologueTurn = {
        narrative: currentScene.narrative,
        choices: currentScene.choices,
        selectedChoiceText: choice.text,
        selectedAffinities: choice.affinities,
        rawResponse: currentScene.rawResponse,
      };
      const newHistory = [...prologueHistory, newTurn];
      setPrologueHistory(newHistory);
      setCurrentScene(null);

      // readyToConclude is advisory; the engine enforces MIN/MAX.
      const concluding =
        (newHistory.length >= MIN_PROLOGUE_SCENES && currentScene.readyToConclude) ||
        newHistory.length >= MAX_PROLOGUE_SCENES;
      setAwaitingFinale(concluding);

      const name = characterName.trim();
      const bg = characterBackground.trim();
      if (concluding) {
        void runFinale(providerConfig, name, bg, newHistory);
      } else {
        void runPrologueScene(providerConfig, name, bg, newHistory);
      }
    },
    [
      currentScene,
      providerConfig,
      prologueHistory,
      characterName,
      characterBackground,
      runPrologueScene,
      runFinale,
    ],
  );

  // The finale pick IS the pathway decision — it is NOT fed back into the tally.
  const handleFinaleSelect = useCallback((choice: AIPrologueChoice) => {
    setSelectedPathwayId(dominantAffinity(choice.affinities));
    setStep("first-potion");
  }, []);

  // Retry/resume re-runs the correct generator. Candidate selection inside the
  // finale is deterministic, so a retry reproduces the same shortlist.
  const handleRetryPrologue = useCallback(() => {
    if (!providerConfig) return;
    const name = characterName.trim();
    const bg = characterBackground.trim();
    const shouldConclude =
      awaitingFinale || prologueHistory.length >= MAX_PROLOGUE_SCENES;
    if (shouldConclude) {
      void runFinale(providerConfig, name, bg, prologueHistory);
    } else {
      void runPrologueScene(providerConfig, name, bg, prologueHistory);
    }
  }, [
    providerConfig,
    characterName,
    characterBackground,
    awaitingFinale,
    prologueHistory,
    runPrologueScene,
    runFinale,
  ]);

  // ── Manual Path Handlers ──

  const handleSkipPrologue = useCallback(() => {
    setSkipPrologue(true);
    setStep("recommendation");
  }, []);

  const handleAcceptPathway = useCallback((pathwayId: number) => {
    setSelectedPathwayId(pathwayId);
    setStep("character-sheet");
  }, []);

  const handleCharacterContinue = useCallback(() => {
    if (characterName.trim()) setStep("first-potion");
  }, [characterName]);

  const handleBeginChronicle = useCallback(() => {
    if (selectedPathwayId === null) return;
    const name = characterName.trim();
    const bg = characterBackground.trim();
    const memory = skipPrologue
      ? createPrologueMemory(name, bg)
      : createAIPrologueMemory(
          prologueHistory.map((t) => t.selectedChoiceText),
          name,
          bg,
        );
    // Carry the prologue forward (the prologue → story bridge): the story
    // narrator runs on a different prompt and never sees these scenes, so a
    // compact recap of the defining choices, the finale encounter, and the
    // potion the character drank is pinned into the durable game state. Empty
    // on the manual path (no AI prologue to recap).
    const prologueRecap = skipPrologue
      ? ""
      : buildPrologueRecap({
          choices: prologueHistory.map((t) => t.selectedChoiceText),
          finaleNarrative: finale?.narrative,
          chosenPotion: finale?.choices.find(
            (c) => dominantAffinity(c.affinities) === selectedPathwayId,
          )?.text,
        });
    // Resolve the single picker value into the discriminated start selection.
    let start: StartSelection;
    if (archetypeId !== null) {
      start = { kind: "archetype", archetypeId };
    } else if (startChoice.startsWith("origin-scenario:")) {
      start = {
        kind: "origin-scenario",
        scenarioId: startChoice.slice("origin-scenario:".length),
      };
    } else if (startChoice === "custom") {
      start = {
        kind: "custom",
        circle: {
          tie: customTie,
          companions: customCompanions,
          location: customLocation || undefined,
        },
      };
    } else if (startChoice !== "") {
      start = { kind: "location", location: startChoice };
    } else {
      start = { kind: "random" };
    }
    clearDraft();
    onComplete(selectedPathwayId, name, bg, memory, epoch, prologueRecap, start);
  }, [
    epoch,
    selectedPathwayId,
    characterName,
    characterBackground,
    skipPrologue,
    prologueHistory,
    finale,
    startChoice,
    archetypeId,
    customTie,
    customCompanions,
    customLocation,
    onComplete,
  ]);

  // Add a companion to the custom circle (canon-suggested or invented), de-duped
  // case-insensitively; bounded so the form can't grow without limit (the same
  // bound `buildCustomArchetype` enforces, sourced from one constant).
  const addCustomCompanion = useCallback(() => {
    const name = customCompanionDraft.trim();
    if (!name) return;
    setCustomCompanions((prev) =>
      prev.length >= MAX_COMPANIONS ||
      prev.some((n) => n.toLowerCase() === name.toLowerCase())
        ? prev
        : [...prev, name],
    );
    setCustomCompanionDraft("");
  }, [customCompanionDraft]);

  // Clear the custom-circle form so reopening it (or switching epoch) starts
  // fresh — the pick is the single source of truth; stale fields never linger.
  const clearCustomCircle = useCallback(() => {
    setCustomTie("");
    setCustomCompanions([]);
    setCustomCompanionDraft("");
    setCustomLocation("");
  }, []);

  // Choosing an epoch resets the start pick so a location/archetype chosen for
  // the prior epoch can't leak into the new one (issue #131), and returns the
  // opening chooser to its neutral "random" family.
  const selectEpoch = useCallback(
    (id: number) => {
      setEpoch(id);
      setStartChoice("");
      setOpeningMode("random");
      clearCustomCircle();
    },
    [clearCustomCircle],
  );

  // Switch the opening-chooser family. Each family resets `startChoice` to its
  // own neutral value so a pick can never linger from a family the player left:
  // "custom" arms the author-your-own form; every other family clears to "" (a
  // random start) until the player picks a card within it.
  const selectOpeningMode = useCallback(
    (mode: OpeningMode) => {
      setOpeningMode(mode);
      setStartChoice(mode === "custom" ? "custom" : "");
      if (mode !== "custom") clearCustomCircle();
    },
    [clearCustomCircle],
  );

  // ── Progress Dots ──

  const progress = getProgress(step, skipPrologue);
  const sceneNumber = prologueHistory.length + 1;
  const progressPct = Math.min((prologueHistory.length / MAX_PROLOGUE_SCENES) * 100, 95);

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      {/* ── TUTORIAL (issue #14) ── */}
      {step === "tutorial" && (
        <div className="animate-fade-in-up">
          {(() => {
            const scene = TUTORIAL_SCENES[tutorialIndex];
            const isLast = tutorialIndex === TUTORIAL_SCENES.length - 1;
            return (
              <div className="mx-auto max-w-2xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  An Introduction — {tutorialIndex + 1} of {TUTORIAL_SCENES.length}
                </p>
                <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                  {scene.title}
                </h1>
                <div className="parchment rounded-xl px-6 py-5 sm:px-8 sm:py-6">
                  <p className="font-serif text-base leading-[1.85] text-foreground">
                    {scene.body}
                  </p>
                </div>
                <p className="mt-4 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted italic">
                  {scene.lesson}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("mode-select")}
                    className="min-h-[24px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                  >
                    Skip the introduction
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isLast
                        ? setStep("mode-select")
                        : setTutorialIndex((index) => index + 1)
                    }
                    className="rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
                  >
                    {isLast ? "Choose your path" : "Continue"}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── MODE SELECT ── */}
      {step === "mode-select" && (
        <div className="animate-fade-in-up">
          <StepHeader
            eyebrow="A New Chronicle Begins"
            onBack={() => {
              clearDraft();
              onBack();
            }}
          />
          <h1 className="mb-4 font-serif text-2xl font-semibold text-foreground">
            Who Will You Become?
          </h1>
          <p className="mb-2 max-w-lg text-sm leading-relaxed text-muted">
            In the Fifth Epoch — an age of steam, secrets, and terrible power — a chance
            encounter has led you to the threshold of the Beyonders. What happens next
            depends on who you are.
          </p>
          <p className="mb-8 text-xs italic text-muted">
            The AI prologue takes ~5 minutes and reveals your Beyonder affinity through
            story.
          </p>

          {/* Epoch start (issues #26/#29) — a browsable row of eras (the Fifth
              is the classic default) rather than a dropdown whose summary only
              showed after selecting. */}
          <div className="mb-8">
            <p
              id="era-label"
              className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber"
            >
              Choose Your Era
            </p>
            <div
              role="group"
              aria-labelledby="era-label"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {EPOCHS.map((era) => (
                <ChoiceCard
                  key={era.id}
                  title={era.name}
                  badge={era.era}
                  description={era.summary}
                  selected={epoch === era.id}
                  onClick={() => selectEpoch(era.id)}
                />
              ))}
            </div>
          </div>

          {/* Tutorial gate (issue #14): newcomers get the introduction;
              veterans skip it entirely without missing gameplay content. */}
          <button
            type="button"
            onClick={() => {
              setTutorialIndex(0);
              setStep("tutorial");
            }}
            className="mb-10 block w-full rounded-xl border border-border bg-surface px-5 py-4 text-left text-sm text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40"
          >
            <span className="font-semibold text-amber">
              New to Lord of the Mysteries?
            </span>{" "}
            Begin with a short introduction to Beyonders, potions, and the acting method
            (~3 minutes, skippable at any point).
          </button>

          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
            How Will You Find Your Path?
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* AI Prologue card */}
            <ChoiceCard
              title="Begin the Prologue"
              badge="AI-Guided"
              description={
                providerConfig
                  ? "A series of AI-generated scenes shapes your character's fate. Your choices guide you to the Beyonder pathway that fits your nature."
                  : "Configure an AI provider in Settings first."
              }
              disabled={!providerConfig}
              onClick={() => setStep("character-setup")}
            />

            {/* Manual card */}
            <ChoiceCard
              title="Choose Your Path"
              badge="Direct"
              description="Already know your Beyonder pathway? Skip the prologue and select from all available paths directly."
              onClick={handleSkipPrologue}
            />
          </div>
        </div>
      )}

      {/* ── CHARACTER SETUP ── */}
      {step === "character-setup" && (
        <div className="max-w-lg animate-fade-in-up">
          <StepHeader
            eyebrow="Before the Chronicle Begins"
            onBack={() => setStep("mode-select")}
            progress={progress.show ? progress : undefined}
          />
          <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground">
            Tell the Fog Who You Are
          </h2>
          <p className="mb-8 text-sm text-muted">
            The AI will use your name and background to craft a personal story.
          </p>

          <div className="mb-4">
            <label
              htmlFor="setup-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
            >
              Character Name <span className="text-amber">*</span>
            </label>
            <input
              id="setup-name"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Klein Moretti"
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>

          <div className="mb-8">
            <label
              htmlFor="setup-bg"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
            >
              Your Background{" "}
              <span className="text-muted normal-case tracking-normal">(optional)</span>
            </label>
            <p className="mb-1.5 text-xs text-muted">
              What is your occupation? What brought you to Tingen City?
            </p>
            <textarea
              id="setup-bg"
              value={characterBackground}
              onChange={(e) =>
                setCharacterBackground(e.target.value.slice(0, MAX_BACKGROUND_LENGTH))
              }
              maxLength={MAX_BACKGROUND_LENGTH}
              placeholder="A brief backstory — your occupation, your district, what drew you to this world..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {characterBackground.length}&thinsp;/&thinsp;{MAX_BACKGROUND_LENGTH}
            </p>
          </div>

          <button
            type="button"
            onClick={handleBeginAIPrologue}
            disabled={!characterName.trim()}
            className="w-full rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            Begin the Prologue
          </button>
        </div>
      )}

      {/* ── AI PROLOGUE ── */}
      {step === "ai-prologue" && (
        <div className="max-w-2xl animate-fade-in-up">
          {/* Scene counter + progress bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("character-setup")}
                className="min-h-[24px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
              >
                <span aria-hidden="true">&larr;</span> Back
              </button>
              <span className="text-xs text-muted">Scene {sceneNumber}</span>
            </div>
            <div
              className="h-px bg-border relative overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <div
                className="absolute inset-y-0 left-0 bg-amber/50 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Loading state */}
          {prologueLoading && (
            <div
              role="status"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-6" aria-hidden="true">
                <div className="h-12 w-12 rounded-full border border-amber/20 animate-ping absolute inset-0" />
                <div className="h-12 w-12 rounded-full border border-amber/40 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-amber/60 animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted italic">The fog stirs&hellip;</p>
            </div>
          )}

          {/* Error state */}
          {!prologueLoading && prologueError !== null && (
            <div role="alert" className="py-10 text-center">
              <p className="mb-2 text-sm text-crimson">{prologueError}</p>
              <button
                type="button"
                onClick={handleRetryPrologue}
                className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
              >
                Retry
              </button>
            </div>
          )}

          {/* Restored from draft — needs resume */}
          {!prologueLoading &&
            prologueError === null &&
            currentScene === null &&
            finale === null && (
              <div className="py-14 flex flex-col items-center text-center animate-fade-in-up">
                <div
                  className="mb-7 flex flex-col items-center gap-1.5"
                  aria-hidden="true"
                >
                  <div className="w-px h-8 bg-gradient-to-b from-amber/35 to-amber/5" />
                  <div className="h-1 w-1 rounded-full bg-amber/25" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  Scene {sceneNumber}
                </p>
                <h3 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                  The Fog Held
                </h3>
                <p className="mb-10 max-w-[20rem] text-sm leading-relaxed text-muted">
                  Your story rests at the threshold, unchanged. The chronicle resumes
                  where the gaslight flickered out.
                </p>
                <div className="relative inline-flex">
                  <div
                    className="absolute -inset-[3px] rounded-lg border border-amber/18 animate-pulse"
                    style={{ animationDuration: "3s" }}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={handleRetryPrologue}
                    className="relative rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
                  >
                    Resume the Chronicle
                  </button>
                </div>
                {prologueHistory.length > 0 && (
                  <p className="mt-5 text-xs text-muted">
                    {prologueHistory.length}{" "}
                    {prologueHistory.length === 1 ? "scene" : "scenes"} complete
                  </p>
                )}
              </div>
            )}

          {/* Scene ready */}
          {!prologueLoading &&
            prologueError === null &&
            finale === null &&
            currentScene !== null && (
              <div>
                {/* Narrative */}
                <div className="mb-8 rounded-xl border border-border bg-surface p-6">
                  {currentScene.narrative.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className="mb-3 text-sm leading-relaxed text-foreground last:mb-0"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Choices — exactly one per affinity, position shuffled by the
                    AI. The narrative ends on tension and leads into the choices;
                    the UI adds no instructional prompt. */}
                <div className="space-y-3">
                  {currentScene.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleChoiceSelect(choice)}
                      className="group w-full cursor-pointer rounded-xl border border-border bg-surface px-5 py-4 text-left text-sm leading-relaxed text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40"
                    >
                      <span
                        className="mr-2 text-amber transition-colors"
                        aria-hidden="true"
                      >
                        ›
                      </span>
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Finale — engine-narrowed candidate potions; the player decides.
              The cumulative affinity tally has narrowed the field; the player's
              pick here sets the pathway. The AI's narrative builds the moment
              and leads into the choice — the UI adds only atmosphere, never
              instructional copy. */}
          {!prologueLoading && prologueError === null && finale !== null && (
            <div className="animate-fade-in-up">
              {/* Gaslight marker — a wordless visual shift into the final beat */}
              <div className="mb-6 flex flex-col items-center gap-1.5" aria-hidden="true">
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gold/40 to-gold/10" />
                <div className="h-1 w-1 rounded-full bg-gold/40" />
              </div>

              {/* Narrative — the AI builds up to the decision */}
              <div className="mb-8 rounded-xl border border-border bg-surface p-6">
                {finale.narrative.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="mb-3 text-sm leading-relaxed text-foreground last:mb-0"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* The potions the narrative just set before the character */}
              <div className="relative space-y-3">
                {/* Atmospheric glow gathering behind the offered vials */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-8 -inset-y-4 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_70%)]"
                />
                {finale.choices.map((choice, i) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleFinaleSelect(choice)}
                    style={{ animationDelay: `${i * 90}ms` }}
                    className="group relative flex w-full animate-fade-in-up cursor-pointer items-stretch gap-4 overflow-hidden rounded-xl border border-border bg-surface px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40"
                  >
                    {/* The vial — a phial of luminous liquid that brightens as
                        the hand reaches for it */}
                    <span
                      aria-hidden
                      className="w-1.5 shrink-0 rounded-full bg-gradient-to-b from-gaslight/70 via-gold/50 to-copper/30 opacity-70 shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                    />
                    <span className="text-sm leading-relaxed text-foreground transition-colors duration-200">
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RECOMMENDATION (manual path) ── */}
      {step === "recommendation" && (
        <div className="animate-fade-in-up">
          <StepHeader
            eyebrow="Choose Your Beyonder Path"
            onBack={() => setStep("mode-select")}
            progress={progress.show ? progress : undefined}
          />
          <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground">
            The Two-and-Twenty Pathways
          </h2>
          <p className="mb-8 text-sm text-muted">
            Each pathway shapes your abilities, your obligations, and your fate. They are
            grouped by the cosmic family they descend from.
          </p>
          {/* Grouped by pathway family (issue #28 groups) so all twenty-two are
              scannable instead of one undifferentiated wall of cards. */}
          <div className="space-y-8">
            {ALL_GROUPS.map((group) => {
              const members = ALL_PATHWAYS.filter((p) => p.group === group.id);
              if (members.length === 0) return null;
              return (
                <section key={group.id}>
                  <div className="mb-3">
                    <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.14em] text-amber">
                      {group.name}
                    </h3>
                    <p className="text-xs text-muted">{group.sefirah}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.map((pathway) => {
                      const seq9 = getSequence(pathway.id, 9);
                      return (
                        <ChoiceCard
                          key={pathway.id}
                          title={pathway.name}
                          description={
                            PATHWAY_DESCRIPTIONS[pathway.id] ?? "A mysterious path."
                          }
                          meta={
                            seq9 ? (
                              <>
                                Begins as{" "}
                                <span className="text-foreground">
                                  Sequence 9 — {seq9.name}
                                </span>
                              </>
                            ) : undefined
                          }
                          selected={selectedPathwayId === pathway.id}
                          onClick={() => handleAcceptPathway(pathway.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CHARACTER SHEET (manual path) ── */}
      {step === "character-sheet" &&
        (() => {
          const pathway = ALL_PATHWAYS.find((p) => p.id === selectedPathwayId);
          const seq9 = pathway ? getSequence(pathway.id, 9) : null;
          return (
            <div className="max-w-xl animate-fade-in-up">
              <StepHeader
                eyebrow="Your Beyonder Identity"
                onBack={() => setStep("recommendation")}
                progress={progress.show ? progress : undefined}
              />
              <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                Step Into Your Becoming
              </h2>
              {pathway && seq9 && (
                <div className="mb-6 rounded-xl border border-amber bg-amber/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold text-amber">
                      {pathway.name} Pathway
                    </span>
                    <span className="text-xs text-muted">Sequence 9 — {seq9.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {seq9.abilities.slice(0, 3).map((ability) => (
                      <span
                        key={ability.name}
                        className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-xs text-foreground"
                      >
                        {ability.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="char-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
                >
                  Character Name <span className="text-amber">*</span>
                </label>
                <input
                  id="char-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. Klein Moretti"
                  className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="char-bg"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
                >
                  Your Story{" "}
                  <span className="text-muted normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="char-bg"
                  value={characterBackground}
                  onChange={(e) =>
                    setCharacterBackground(e.target.value.slice(0, MAX_BACKGROUND_LENGTH))
                  }
                  maxLength={MAX_BACKGROUND_LENGTH}
                  placeholder="A brief backstory — your occupation, your district, what drew you to this world..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
                <p className="mt-1 text-right text-xs text-muted">
                  {characterBackground.length}&thinsp;/&thinsp;{MAX_BACKGROUND_LENGTH}
                </p>
              </div>
              <div className="mb-6 rounded-xl border border-border bg-surface p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  Starting State
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted">Sequence</p>
                    <p className="font-serif text-lg text-foreground">9</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Sanity</p>
                    <p className="font-serif text-lg text-foreground">100</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Location</p>
                    <p className="font-serif text-sm text-foreground">Chosen next</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCharacterContinue}
                disabled={!characterName.trim()}
                className="w-full rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          );
        })()}

      {/* ── FIRST POTION ── */}
      {step === "first-potion" && selectedPathwayId !== null && (
        <div className="mx-auto max-w-lg animate-fade-in-up">
          <StepHeader
            eyebrow="The Moment of Becoming"
            onBack={() => setStep(skipPrologue ? "character-sheet" : "ai-prologue")}
            progress={progress.show ? progress : undefined}
          />
          <h2 className="mb-8 gaslit font-serif text-2xl font-semibold text-foreground">
            {POTION_HEADINGS[selectedPathwayId] ?? "The First Change"}
          </h2>
          <div className="parchment mb-10 space-y-5 rounded-xl px-6 py-5">
            {(FIRST_POTION_NARRATIVE[selectedPathwayId] ?? "")
              .split("\n\n")
              .map((para, i) => (
                <p
                  key={i}
                  className="font-serif text-sm leading-[1.85] text-foreground/90"
                >
                  {para}
                </p>
              ))}
          </div>

          {/* Where the chronicle begins (varied story openings) — a plain place
              OR an existing character's circle (start archetypes, issue #131).
              The old single crammed <select> is now a two-level chooser: a row of
              opening "families" (random / a place / someone's circle / author your
              own / a sealed origin), each revealing browsable option cards whose
              blurb and "suits your pathway" hint are visible without selecting.
              `startChoice` is still the single source of truth — the cards just
              set the same encoded values the dropdown used to. */}
          {(() => {
            const options = startLocationsForEpoch(epoch);
            const archetypes = startArchetypesForEpoch(epoch);
            const npcSuggestions = circleNpcSuggestions(epoch);
            // Origin starts (issue #132) — gated behind the explicit affordance.
            const originScenarios = forsakenLandStartsForEpoch(epoch);
            const originArchetypes = forsakenLandArchetypesForEpoch(epoch);
            const hasOrigins = originScenarios.length + originArchetypes.length > 0;
            const pathwayName = ALL_PATHWAYS.find(
              (p) => p.id === selectedPathwayId,
            )?.name;
            const isCustom = startChoice === "custom";
            const selectedLoc = options.find((o) => o.location === startChoice);
            // Origin archetypes live outside the default `archetypes` list, so
            // resolve the selected archetype across both for the blurb.
            const selectedArchetype = [...archetypes, ...originArchetypes].find(
              (a) => a.id === archetypeId,
            );
            const selectedOriginScenario = startChoice.startsWith("origin-scenario:")
              ? originScenarios.find(
                  (s) => s.id === startChoice.slice("origin-scenario:".length),
                )
              : undefined;
            // The screen-reader summary of the current pick (the cards already
            // show each blurb inline; this announces the active selection).
            const describe = selectedArchetype
              ? selectedArchetype.blurb
              : selectedOriginScenario
                ? selectedOriginScenario.blurb
                : isCustom
                  ? "Describe your own place in the world — your tie, and who stands with you. They can be characters from the world or your own invention."
                  : selectedLoc
                    ? describeStartLocation(selectedLoc, selectedPathwayId, pathwayName)
                    : "The fog will decide where you wake — a different place, and a different opening, each time.";
            const suitsBadge = (affinity: readonly number[] | undefined) =>
              startOptionSuitsPathway(affinity, selectedPathwayId) && pathwayName
                ? `Suits the ${pathwayName}`
                : undefined;
            return (
              <fieldset className="mb-8 min-w-0 border-0 p-0">
                <legend className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  Where Your Chronicle Begins
                </legend>

                {/* Opening families */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    title="Let the fog decide"
                    description="A different place, and a different opening, each time."
                    selected={openingMode === "random"}
                    onClick={() => selectOpeningMode("random")}
                  />
                  <ChoiceCard
                    title="A place in the world"
                    description="Begin in a place of your choosing — the scene still varies."
                    selected={openingMode === "place"}
                    onClick={() => selectOpeningMode("place")}
                  />
                  {archetypes.length > 0 && (
                    <ChoiceCard
                      title="Within someone's circle"
                      description="Begin embedded among an existing character's circle."
                      selected={openingMode === "circle"}
                      onClick={() => selectOpeningMode("circle")}
                    />
                  )}
                  <ChoiceCard
                    title="Author your own circle"
                    description="Describe your own tie and who stands with you."
                    selected={openingMode === "custom"}
                    onClick={() => selectOpeningMode("custom")}
                  />
                  {showOrigins && hasOrigins && (
                    <ChoiceCard
                      tone="occult"
                      title="A sealed origin"
                      description="Begin as a native of a sealed, far-off land."
                      selected={openingMode === "origin"}
                      onClick={() => selectOpeningMode("origin")}
                    />
                  )}
                </div>

                {/* Status summary of the active pick (polite, for SR users). */}
                <p className="mt-3 text-xs leading-relaxed text-muted" role="status">
                  {describe}
                </p>

                {/* The advanced origin affordance (issue #132): an explicit opt-in
                    that reveals the sealed-continent family above. */}
                {hasOrigins && (
                  <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={showOrigins}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setShowOrigins(on);
                        // Turning origins off clears a now-hidden origin pick so
                        // the control can't hold a value its options no longer show.
                        if (
                          !on &&
                          (openingMode === "origin" ||
                            startChoice.startsWith("origin-scenario:") ||
                            (archetypeId !== null &&
                              originArchetypes.some((a) => a.id === archetypeId)))
                        ) {
                          setStartChoice("");
                          setOpeningMode("random");
                          clearCustomCircle();
                        }
                      }}
                      className="h-4 w-4 rounded border-border bg-surface-raised text-amber focus:ring-2 focus:ring-amber/30"
                    />
                    Begin as a native of a sealed, far-off land (an advanced origin start)
                  </label>
                )}

                {/* ── Revealed option cards for the chosen family ── */}
                {openingMode === "place" && (
                  <div
                    role="group"
                    aria-label="Choose a place"
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    {options.map((o) => (
                      <ChoiceCard
                        key={o.location}
                        title={o.location}
                        description={o.blurb}
                        badge={suitsBadge(o.pathwayAffinity)}
                        selected={startChoice === o.location}
                        onClick={() => setStartChoice(o.location)}
                      />
                    ))}
                  </div>
                )}

                {openingMode === "circle" && archetypes.length > 0 && (
                  <div
                    role="group"
                    aria-label="Choose a circle"
                    className="mt-4 grid gap-3"
                  >
                    {archetypes.map((a) => (
                      <ChoiceCard
                        key={a.id}
                        title={a.label}
                        description={a.blurb}
                        badge={suitsBadge(a.pathwayAffinity)}
                        selected={startChoice === `archetype:${a.id}`}
                        onClick={() => setStartChoice(`archetype:${a.id}`)}
                      />
                    ))}
                  </div>
                )}

                {openingMode === "origin" && showOrigins && hasOrigins && (
                  <div
                    role="group"
                    aria-label="Choose a sealed origin"
                    className="mt-4 grid gap-3"
                  >
                    {originScenarios.map((s) => (
                      <ChoiceCard
                        key={s.id}
                        tone="occult"
                        title={s.location}
                        description={s.blurb}
                        selected={startChoice === `origin-scenario:${s.id}`}
                        onClick={() => setStartChoice(`origin-scenario:${s.id}`)}
                      />
                    ))}
                    {originArchetypes.map((a) => (
                      <ChoiceCard
                        key={a.id}
                        tone="occult"
                        title={a.label}
                        description={a.blurb}
                        selected={startChoice === `archetype:${a.id}`}
                        onClick={() => setStartChoice(`archetype:${a.id}`)}
                      />
                    ))}
                  </div>
                )}

                {isCustom && (
                  <div className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-4">
                    <div>
                      <label
                        htmlFor="custom-tie"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
                      >
                        Your tie to this world
                      </label>
                      <input
                        id="custom-tie"
                        type="text"
                        value={customTie}
                        onChange={(e) =>
                          setCustomTie(e.target.value.slice(0, MAX_TIE_LENGTH))
                        }
                        maxLength={MAX_TIE_LENGTH}
                        placeholder="e.g. a fence who owes the Tingen Nighthawks a favour"
                        className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="custom-companion"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
                      >
                        Who stands with you{" "}
                        <span className="text-muted normal-case tracking-normal">
                          (canon or your own — optional)
                        </span>
                      </label>
                      {customCompanions.length > 0 && (
                        <ul className="mb-2 flex flex-wrap gap-1.5">
                          {customCompanions.map((name) => (
                            <li
                              key={name}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-xs text-foreground"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomCompanions((prev) =>
                                    prev.filter((n) => n !== name),
                                  )
                                }
                                aria-label={`Remove ${name}`}
                                className="inline-flex min-h-[24px] items-center px-1 text-muted transition-colors hover:text-crimson"
                              >
                                <span aria-hidden="true">×</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2">
                        <input
                          id="custom-companion"
                          type="text"
                          list="custom-companion-suggestions"
                          value={customCompanionDraft}
                          onChange={(e) =>
                            setCustomCompanionDraft(
                              e.target.value.slice(0, MAX_COMPANION_LENGTH),
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomCompanion();
                            }
                          }}
                          maxLength={MAX_COMPANION_LENGTH}
                          placeholder="a name — known or invented"
                          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                        />
                        <datalist id="custom-companion-suggestions">
                          {npcSuggestions.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                        <button
                          type="button"
                          onClick={addCustomCompanion}
                          disabled={
                            customCompanionDraft.trim().length === 0 ||
                            customCompanions.length >= MAX_COMPANIONS
                          }
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="custom-location"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber"
                      >
                        Begins in
                      </label>
                      <select
                        id="custom-location"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                      >
                        <option value="">The default starting place</option>
                        {options.map((o) => (
                          <option key={o.location} value={o.location}>
                            {o.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })()}

          <button
            type="button"
            onClick={handleBeginChronicle}
            className="w-full rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
          >
            Begin Your Chronicle
          </button>
        </div>
      )}
    </div>
  );
}
