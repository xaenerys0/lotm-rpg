"use client";

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  createPrologueMemory,
  createAIPrologueMemory,
  tallyAffinities,
  selectTopCandidates,
  dominantAffinity,
  PROVIDER_CONFIG_KEY,
  PROLOGUE_DRAFT_KEY,
  isValidDraftShape,
  clearDraft,
  TUTORIAL_SCENES,
} from "@/lib/game";
import { DEFAULT_EPOCH_ID, EPOCHS } from "@/lib/lore";
import type { PrologueDraft } from "@/lib/game";
import type { MemoryState } from "@/lib/ai";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import { noopSubscribe } from "@/lib/react";
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

type CreationStep =
  | "tutorial"
  | "mode-select"
  | "character-setup"
  | "ai-prologue"
  | "recommendation"
  | "character-sheet"
  | "first-potion";

const PATHWAY_DESCRIPTIONS: Record<number, string> = {
  1: "Seer, Clown, Magician — divination and hidden knowledge",
  2: "Spectator, Telepathist, Psychiatrist — mind and imagination",
  3: "Bard, Light Suppliant, Solar High Priest — radiance and healing",
  4: "Corpse Collector, Gravedigger, Spirit Medium — spirits and the dead",
  5: "Sleepless, Midnight Poet, Nightmare — night, dreams, and concealment",
  6: "Sailor, Folk of Rage, Seafarer — sea, storm, and wrath",
  7: "Apprentice, Trickmaster, Astrologer — travel, doors, and space",
  8: "Marauder, Swindler, Cryptologist — theft, trickery, and secrets",
  9: "Secrets Suppliant, Listener, Shadow Ascetic — sacrifice, shadow, and taboo",
};

const AI_PATH: CreationStep[] = ["character-setup", "ai-prologue", "first-potion"];
const MANUAL_PATH: CreationStep[] = ["recommendation", "character-sheet", "first-potion"];

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
        setCurrentScene(await generatePrologueScene(config, name, bg, history));
      }),
    [runPrologueRequest],
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
        setFinale(await generatePrologueFinale(config, name, bg, history, candidates));
      }),
    [runPrologueRequest],
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
      ? createPrologueMemory([], name, bg)
      : createAIPrologueMemory(
          prologueHistory.map((t) => t.selectedChoiceText),
          name,
          bg,
        );
    clearDraft();
    onComplete(selectedPathwayId, name, bg, memory, epoch);
  }, [
    selectedPathwayId,
    characterName,
    characterBackground,
    skipPrologue,
    prologueHistory,
    onComplete,
  ]);

  // ── Progress Dots ──

  const progress = getProgress(step, skipPrologue);
  const sceneNumber = prologueHistory.length + 1;
  const progressPct = Math.min((prologueHistory.length / MAX_PROLOGUE_SCENES) * 100, 95);

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      {/* Step dots — shown for all steps except mode-select */}
      {step !== "mode-select" && step !== "tutorial" && progress.show && (
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[10px] text-muted uppercase tracking-[0.2em]">
            Character Creation
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2" aria-hidden="true">
              {Array.from({ length: progress.total }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={`rounded-full transition-all duration-300 ${
                    n < progress.number
                      ? "h-1.5 w-1.5 bg-amber"
                      : n === progress.number
                        ? "h-1.5 w-3 bg-amber/70"
                        : "h-1.5 w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-[10px] text-muted">
              Step {progress.number}&thinsp;/&thinsp;{progress.total}
            </span>
          </div>
        </div>
      )}

      {/* ── TUTORIAL (issue #14) ── */}
      {step === "tutorial" && (
        <div className="animate-fade-in-up">
          {(() => {
            const scene = TUTORIAL_SCENES[tutorialIndex];
            const isLast = tutorialIndex === TUTORIAL_SCENES.length - 1;
            return (
              <div className="mx-auto max-w-2xl">
                <p className="mb-2 text-[10px] tracking-[0.2em] text-gaslight uppercase">
                  An Introduction — {tutorialIndex + 1} of {TUTORIAL_SCENES.length}
                </p>
                <h1 className="mb-6 font-serif text-3xl font-bold text-foreground">
                  {scene.title}
                </h1>
                <div className="parchment rounded-lg px-6 py-5 sm:px-8 sm:py-6">
                  <p className="font-serif text-base leading-[1.85] text-foreground/90">
                    {scene.body}
                  </p>
                </div>
                <p className="mt-4 border-l-2 border-gaslight/40 pl-4 text-sm leading-relaxed text-muted italic">
                  {scene.lesson}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("mode-select")}
                    className="min-h-[24px] rounded px-2 py-1 text-xs text-muted transition-colors hover:text-amber"
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
                    className="rounded-md bg-amber/90 px-5 py-2.5 text-sm font-medium text-background transition-all duration-200 hover:bg-amber"
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
          <button
            type="button"
            onClick={() => {
              clearDraft();
              onBack();
            }}
            className="mb-6 text-xs text-muted transition-colors hover:text-amber"
          >
            &larr; Back
          </button>
          <p className="text-[10px] tracking-[0.2em] text-amber uppercase mb-2">
            A New Chronicle Begins
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            Who Will You Become?
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted mb-2">
            In the Fifth Epoch — an age of steam, secrets, and terrible power — a chance
            encounter has led you to the threshold of the Beyonders. What happens next
            depends on who you are.
          </p>
          <p className="mb-6 text-xs italic text-muted">
            The AI prologue takes ~5 minutes and reveals your Beyonder affinity through
            story.
          </p>
          {/* Epoch start (issues #26/#29): the Fifth is the classic default. */}
          <div className="mb-6 max-w-md">
            <label htmlFor="epoch-select" className="mb-1.5 block text-xs text-muted">
              Begin in
            </label>
            <select
              id="epoch-select"
              value={epoch}
              onChange={(e) => setEpoch(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            >
              {EPOCHS.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.name} — {era.era}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {EPOCHS.find((era) => era.id === epoch)?.summary}
            </p>
          </div>

          {/* Tutorial gate (issue #14): newcomers get the introduction;
              veterans skip it entirely without missing gameplay content. */}
          <button
            type="button"
            onClick={() => {
              setTutorialIndex(0);
              setStep("tutorial");
            }}
            className="mb-10 block rounded-md border border-gaslight/30 bg-gaslight/[0.05] px-4 py-3 text-left text-sm text-foreground/85 transition-all duration-200 hover:border-gaslight/50 hover:bg-gaslight/[0.08]"
          >
            <span className="font-medium text-gaslight">
              New to Lord of the Mysteries?
            </span>{" "}
            Begin with a short introduction to Beyonders, potions, and the acting method
            (~3 minutes, skippable at any point).
          </button>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            {/* AI Prologue card */}
            {providerConfig ? (
              <button
                type="button"
                onClick={() => setStep("character-setup")}
                className="group rounded-lg border border-amber/20 bg-amber/[0.04] p-6 text-left transition-all duration-300 hover:border-amber/40 hover:bg-amber/[0.08] hover:shadow-[0_0_32px_rgba(217,119,6,0.07)]"
              >
                <p className="text-[10px] tracking-widest text-amber uppercase mb-2">
                  AI-Guided
                </p>
                <h2 className="font-serif text-xl font-semibold text-foreground mb-2 transition-colors group-hover:text-amber">
                  Begin the Prologue
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  A series of AI-generated scenes will shape your character&apos;s fate.
                  Your choices guide you to the Beyonder pathway that fits your nature.
                </p>
              </button>
            ) : (
              <div className="rounded-lg border border-border/40 bg-surface/30 p-6 opacity-50 cursor-not-allowed">
                <p className="text-[10px] tracking-widest text-muted uppercase mb-2">
                  AI-Guided
                </p>
                <h2 className="font-serif text-xl font-semibold text-foreground/70 mb-2">
                  Begin the Prologue
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  Configure an AI provider in Settings first.
                </p>
              </div>
            )}

            {/* Manual card */}
            <button
              type="button"
              onClick={handleSkipPrologue}
              className="group rounded-lg border border-border bg-surface/50 p-6 text-left transition-all duration-300 hover:border-amber/20 hover:bg-surface"
            >
              <p className="text-[10px] tracking-widest text-muted uppercase mb-2">
                Direct
              </p>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2 transition-colors group-hover:text-amber/80">
                Choose Your Path
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Already know your Beyonder pathway? Skip the prologue and select from all
                available paths directly.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ── CHARACTER SETUP ── */}
      {step === "character-setup" && (
        <div className="max-w-lg animate-fade-in-up">
          <button
            type="button"
            onClick={() => setStep("mode-select")}
            className="mb-6 text-xs text-muted transition-colors hover:text-amber"
          >
            &larr; Back
          </button>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
            Before the Chronicle Begins
          </h2>
          <p className="mb-8 text-sm text-muted">
            The AI will use your name and background to craft a personal story.
          </p>

          <div className="mb-4">
            <label
              htmlFor="setup-name"
              className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted"
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
              className="w-full rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
          </div>

          <div className="mb-8">
            <label
              htmlFor="setup-bg"
              className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted"
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
              onChange={(e) => setCharacterBackground(e.target.value.slice(0, 280))}
              maxLength={280}
              placeholder="A brief backstory — your occupation, your district, what drew you to this world..."
              rows={3}
              className="w-full resize-none rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {characterBackground.length}&thinsp;/&thinsp;280
            </p>
          </div>

          <button
            type="button"
            onClick={handleBeginAIPrologue}
            disabled={!characterName.trim()}
            className="w-full rounded bg-amber/90 px-6 py-2.5 text-sm font-medium text-background transition-all hover:bg-amber disabled:cursor-not-allowed disabled:opacity-30"
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
                className="text-xs text-muted transition-colors hover:text-amber"
              >
                &larr; Back
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
              <p className="mb-2 text-sm text-sanity-low">{prologueError}</p>
              <button
                type="button"
                onClick={handleRetryPrologue}
                className="mt-4 rounded border border-amber/30 px-5 py-2 text-sm text-amber transition-colors hover:border-amber/50 hover:text-amber"
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
                <div className="mb-7 flex flex-col items-center gap-1.5">
                  <div className="w-px h-8 bg-gradient-to-b from-amber/35 to-amber/5" />
                  <div className="h-1 w-1 rounded-full bg-amber/25" />
                </div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-amber">
                  Scene {sceneNumber}
                </p>
                <h3 className="font-serif text-2xl tracking-wide text-foreground/70 mb-3">
                  The Fog Held
                </h3>
                <p className="mb-10 max-w-[20rem] text-sm leading-relaxed text-muted">
                  Your story rests at the threshold, unchanged. The chronicle resumes
                  where the gaslight flickered out.
                </p>
                <div className="relative inline-flex">
                  <div
                    className="absolute -inset-[3px] rounded border border-amber/18 animate-pulse"
                    style={{ animationDuration: "3s" }}
                  />
                  <button
                    type="button"
                    onClick={handleRetryPrologue}
                    className="relative rounded border border-amber/30 bg-amber/[0.04] px-7 py-2.5 text-sm text-amber transition-all duration-300 hover:border-amber/55 hover:bg-amber/[0.08] hover:text-amber hover:shadow-[0_0_20px_rgba(217,119,6,0.1)]"
                  >
                    Resume the Chronicle
                  </button>
                </div>
                {prologueHistory.length > 0 && (
                  <p className="mt-5 text-[11px] text-muted">
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
                <div className="mb-8 border-l-2 border-amber/10 pl-4">
                  {currentScene.narrative.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className="mb-3 text-sm leading-relaxed text-muted last:mb-0"
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
                      className="group w-full cursor-pointer rounded-lg border border-border/60 bg-surface/30 p-4 text-left text-sm leading-relaxed text-muted transition-all duration-200 hover:border-amber/30 hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_16px_rgba(217,119,6,0.05)]"
                    >
                      <span
                        className="mr-2 text-amber/40 transition-colors group-hover:text-amber/70"
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
              <div className="mb-6 flex flex-col items-center gap-1.5">
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gold/40 to-gold/10" />
                <div className="h-1 w-1 rounded-full bg-gold/40" />
              </div>

              {/* Narrative — the AI builds up to the decision */}
              <div className="mb-8 border-l-2 border-gold/15 pl-4">
                {finale.narrative.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="mb-3 text-sm leading-relaxed text-muted last:mb-0"
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
                    className="group relative flex w-full animate-fade-in-up cursor-pointer items-stretch gap-4 overflow-hidden rounded-lg border border-amber/15 bg-gradient-to-br from-surface/50 to-amber/[0.03] p-4 text-left transition-all duration-300 hover:border-gold/45 hover:from-surface/70 hover:to-amber/[0.07] hover:shadow-[0_0_28px_rgba(245,158,11,0.1)]"
                  >
                    {/* The vial — a phial of luminous liquid that brightens as
                        the hand reaches for it */}
                    <span
                      aria-hidden
                      className="w-1.5 shrink-0 rounded-full bg-gradient-to-b from-gaslight/70 via-gold/50 to-copper/30 opacity-70 shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                    />
                    <span className="text-sm leading-relaxed text-muted transition-colors duration-300 group-hover:text-foreground">
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
          <button
            type="button"
            onClick={() => setStep("mode-select")}
            className="mb-6 text-xs text-muted transition-colors hover:text-amber"
          >
            &larr; Back
          </button>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            Choose Your Beyonder Path
          </h2>
          <p className="mb-6 text-sm text-muted">
            Each pathway shapes your abilities, your obligations, and your fate.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {ALL_PATHWAYS.map((pathway) => {
              const seq9 = getSequence(pathway.id, 9);
              return (
                <button
                  key={pathway.id}
                  type="button"
                  onClick={() => handleAcceptPathway(pathway.id)}
                  className="group rounded-lg border border-border bg-surface/50 p-5 text-left transition-all duration-300 hover:border-amber/30 hover:bg-surface hover:shadow-[0_0_24px_rgba(217,119,6,0.05)]"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-amber">
                      {pathway.name}
                    </h3>
                    <span className="rounded bg-amber/[0.07] px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber">
                      {pathway.group}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted">
                    {PATHWAY_DESCRIPTIONS[pathway.id] ?? "A mysterious path."}
                  </p>
                  {seq9 && (
                    <div className="border-t border-border/30 pt-2">
                      <p className="text-xs text-muted">
                        Begins as{" "}
                        <span className="text-foreground/60">
                          Sequence 9 — {seq9.name}
                        </span>
                      </p>
                    </div>
                  )}
                </button>
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
              <button
                type="button"
                onClick={() => setStep("recommendation")}
                className="mb-6 text-xs text-muted transition-colors hover:text-amber"
              >
                &larr; Back
              </button>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
                Your Beyonder Identity
              </h2>
              {pathway && seq9 && (
                <div className="mb-6 rounded-lg border border-amber/15 bg-amber/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-serif text-lg text-amber">
                      {pathway.name} Pathway
                    </span>
                    <span className="text-xs text-muted">Sequence 9 — {seq9.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {seq9.abilities.slice(0, 3).map((ability) => (
                      <span
                        key={ability.name}
                        className="rounded border border-border/40 bg-surface/80 px-2 py-0.5 text-[11px] text-muted"
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
                  className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted"
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
                  className="w-full rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="char-bg"
                  className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted"
                >
                  Your Story{" "}
                  <span className="text-muted normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="char-bg"
                  value={characterBackground}
                  onChange={(e) => setCharacterBackground(e.target.value.slice(0, 280))}
                  maxLength={280}
                  placeholder="A brief backstory — your occupation, your district, what drew you to this world..."
                  rows={3}
                  className="w-full resize-none rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
                />
                <p className="mt-1 text-right text-xs text-muted">
                  {characterBackground.length}&thinsp;/&thinsp;280
                </p>
              </div>
              <div className="mb-6 rounded-lg border border-border/40 bg-surface/30 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-muted">
                  Starting State
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted">Sequence</p>
                    <p className="font-serif text-lg text-foreground/70">9</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Sanity</p>
                    <p className="font-serif text-lg text-foreground/70">100</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Location</p>
                    <p className="font-serif text-sm text-foreground/70">Tingen City</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCharacterContinue}
                disabled={!characterName.trim()}
                className="w-full rounded bg-amber/90 px-6 py-2.5 text-sm font-medium text-background transition-all hover:bg-amber disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          );
        })()}

      {/* ── FIRST POTION ── */}
      {step === "first-potion" && selectedPathwayId !== null && (
        <div className="mx-auto max-w-lg animate-fade-in-up">
          <p className="text-[10px] tracking-[0.2em] text-amber uppercase mb-2">
            The Moment of Becoming
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
            {POTION_HEADINGS[selectedPathwayId] ?? "The First Change"}
          </h2>
          <div className="mb-10 space-y-5">
            {(FIRST_POTION_NARRATIVE[selectedPathwayId] ?? "")
              .split("\n\n")
              .map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted">
                  {para}
                </p>
              ))}
          </div>
          <button
            type="button"
            onClick={handleBeginChronicle}
            className="rounded bg-amber/90 px-8 py-3 text-sm font-medium text-background transition-all hover:bg-amber hover:shadow-[0_0_24px_rgba(217,119,6,0.2)]"
          >
            Begin Your Chronicle
          </button>
        </div>
      )}
    </div>
  );
}
