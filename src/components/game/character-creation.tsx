"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";
import {
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  createPrologueMemory,
  createAIPrologueMemory,
  PROVIDER_CONFIG_KEY,
} from "@/lib/game";
import type { MemoryState } from "@/lib/ai";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import { generatePrologueScene, PROLOGUE_TURN_COUNT } from "@/lib/ai";
import type { AIPrologueResponse, PrologueTurn, ProviderConfig } from "@/lib/ai";

type CreationStep =
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
  ) => void;
  onBack: () => void;
}

const noopSubscribe = () => () => {};

export function CharacterCreation({ onComplete, onBack }: CharacterCreationProps) {
  // Provider config — read once from localStorage using useSyncExternalStore
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

  // Step / flow state
  const [step, setStep] = useState<CreationStep>("mode-select");
  const [skipPrologue, setSkipPrologue] = useState(false);

  // Character identity
  const [characterName, setCharacterName] = useState("");
  const [characterBackground, setCharacterBackground] = useState("");

  // Pathway selection
  const [selectedPathwayId, setSelectedPathwayId] = useState<number | null>(null);

  // AI prologue state
  const [prologueHistory, setPrologueHistory] = useState<PrologueTurn[]>([]);
  const [currentScene, setCurrentScene] = useState<AIPrologueResponse | null>(null);
  const [prologueLoading, setPrologueLoading] = useState(false);
  const [prologueError, setPrologueError] = useState<string | null>(null);

  // ── AI Prologue Generation ──

  const runPrologueScene = useCallback(
    async (config: ProviderConfig, name: string, bg: string, history: PrologueTurn[]) => {
      setPrologueLoading(true);
      setPrologueError(null);
      setCurrentScene(null);
      try {
        const scene = await generatePrologueScene(config, name, bg, history);
        setCurrentScene(scene);
        if (scene.isConclusion) {
          setSelectedPathwayId(scene.inferredPathwayId);
        }
      } catch (err) {
        setPrologueError(
          err instanceof Error ? err.message : "Failed to generate scene. Please retry.",
        );
      } finally {
        setPrologueLoading(false);
      }
    },
    [],
  );

  const handleBeginAIPrologue = useCallback(() => {
    if (!characterName.trim() || !providerConfig) return;
    setStep("ai-prologue");
    setPrologueHistory([]);
    void runPrologueScene(
      providerConfig,
      characterName.trim(),
      characterBackground.trim(),
      [],
    );
  }, [characterName, characterBackground, providerConfig, runPrologueScene]);

  const handleChoiceSelect = useCallback(
    (choiceText: string) => {
      if (!currentScene || !providerConfig) return;
      const newTurn: PrologueTurn = {
        narrative: currentScene.narrative,
        choices: currentScene.choices,
        selectedChoiceText: choiceText,
        rawResponse: currentScene.rawResponse,
      };
      const newHistory = [...prologueHistory, newTurn];
      setPrologueHistory(newHistory);
      setCurrentScene(null);
      void runPrologueScene(
        providerConfig,
        characterName.trim(),
        characterBackground.trim(),
        newHistory,
      );
    },
    [
      currentScene,
      providerConfig,
      prologueHistory,
      characterName,
      characterBackground,
      runPrologueScene,
    ],
  );

  const handleContinueToFirstPotion = useCallback(() => {
    setStep("first-potion");
  }, []);

  const handleRetryPrologue = useCallback(() => {
    if (!providerConfig) return;
    void runPrologueScene(
      providerConfig,
      characterName.trim(),
      characterBackground.trim(),
      prologueHistory,
    );
  }, [
    providerConfig,
    characterName,
    characterBackground,
    prologueHistory,
    runPrologueScene,
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
    onComplete(selectedPathwayId, name, bg, memory);
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
  const progressPct = (prologueHistory.length / PROLOGUE_TURN_COUNT) * 100;

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      {/* Step dots — shown for all steps except mode-select */}
      {step !== "mode-select" && progress.show && (
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[10px] text-muted/30 uppercase tracking-[0.2em]">
            Character Creation
          </span>
          <div className="flex items-center gap-2">
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
            <span className="ml-1 text-[10px] text-muted/30">
              {progress.number}&thinsp;/&thinsp;{progress.total}
            </span>
          </div>
        </div>
      )}

      {/* ── MODE SELECT ── */}
      {step === "mode-select" && (
        <div className="animate-fade-in-up">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 text-xs text-muted transition-colors hover:text-amber"
          >
            &larr; Back
          </button>
          <p className="text-[10px] tracking-[0.2em] text-amber/50 uppercase mb-2">
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
          <p className="mb-10 text-xs italic text-muted/40">
            The AI prologue takes ~5 minutes and reveals your Beyonder affinity through
            story.
          </p>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            {/* AI Prologue card */}
            {providerConfig ? (
              <button
                type="button"
                onClick={() => setStep("character-setup")}
                className="group rounded-lg border border-amber/20 bg-amber/[0.04] p-6 text-left transition-all duration-300 hover:border-amber/40 hover:bg-amber/[0.08] hover:shadow-[0_0_32px_rgba(217,119,6,0.07)]"
              >
                <p className="text-[10px] tracking-widest text-amber/50 uppercase mb-2">
                  AI-Guided
                </p>
                <h2 className="font-serif text-xl font-semibold text-foreground mb-2 transition-colors group-hover:text-amber">
                  Begin the Prologue
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  Five AI-generated scenes will shape your character&apos;s fate. Your
                  choices guide you to the Beyonder pathway that fits your nature.
                </p>
              </button>
            ) : (
              <div className="rounded-lg border border-border/40 bg-surface/30 p-6 opacity-50 cursor-not-allowed">
                <p className="text-[10px] tracking-widest text-muted/40 uppercase mb-2">
                  AI-Guided
                </p>
                <h2 className="font-serif text-xl font-semibold text-foreground/50 mb-2">
                  Begin the Prologue
                </h2>
                <p className="text-sm leading-relaxed text-muted/50">
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
              <p className="text-[10px] tracking-widest text-muted/40 uppercase mb-2">
                Direct
              </p>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2 transition-colors group-hover:text-amber/80">
                Choose Your Path
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Already know your Beyonder pathway? Skip the prologue and select from all
                four available paths directly.
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
              className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted/60"
            >
              Character Name <span className="text-amber/50">*</span>
            </label>
            <input
              id="setup-name"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Klein Moretti"
              className="w-full rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/30 transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
          </div>

          <div className="mb-8">
            <label
              htmlFor="setup-bg"
              className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted/60"
            >
              Your Background{" "}
              <span className="text-muted/30 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <p className="mb-1.5 text-xs text-muted/40">
              What is your occupation? What brought you to Tingen City?
            </p>
            <textarea
              id="setup-bg"
              value={characterBackground}
              onChange={(e) => setCharacterBackground(e.target.value.slice(0, 280))}
              maxLength={280}
              placeholder="A brief backstory — your occupation, your district, what drew you to this world..."
              rows={3}
              className="w-full resize-none rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/30 transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
            <p className="mt-1 text-right text-xs text-muted/30">
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
              <span className="text-xs text-muted/40">
                Scene {sceneNumber} of {PROLOGUE_TURN_COUNT}
              </span>
            </div>
            <div className="h-px bg-border relative overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-amber/50 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Loading state */}
          {prologueLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div className="h-12 w-12 rounded-full border border-amber/20 animate-ping absolute inset-0" />
                <div className="h-12 w-12 rounded-full border border-amber/40 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-amber/60 animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted/50 italic">The fog stirs&hellip;</p>
            </div>
          )}

          {/* Error state */}
          {!prologueLoading && prologueError !== null && (
            <div className="py-10 text-center">
              <p className="mb-2 text-sm text-crimson/80">{prologueError}</p>
              <button
                type="button"
                onClick={handleRetryPrologue}
                className="mt-4 rounded border border-amber/30 px-5 py-2 text-sm text-amber/70 transition-colors hover:border-amber/50 hover:text-amber"
              >
                Retry
              </button>
            </div>
          )}

          {/* Scene ready */}
          {!prologueLoading && prologueError === null && currentScene !== null && (
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

              {/* Choices */}
              {!currentScene.isConclusion && currentScene.choices.length > 0 && (
                <>
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-muted/40">
                    What do you do?
                  </p>
                  <div className="space-y-3">
                    {currentScene.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => handleChoiceSelect(choice.text)}
                        className="group w-full cursor-pointer rounded-lg border border-border/60 bg-surface/30 p-4 text-left text-sm leading-relaxed text-muted transition-all duration-200 hover:border-amber/30 hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_16px_rgba(217,119,6,0.05)]"
                      >
                        <span className="mr-2 text-amber/30 transition-colors group-hover:text-amber/50">
                          ›
                        </span>
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Conclusion */}
              {currentScene.isConclusion && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={handleContinueToFirstPotion}
                    className="rounded bg-amber/90 px-8 py-3 text-sm font-medium text-background transition-all hover:bg-amber hover:shadow-[0_0_24px_rgba(217,119,6,0.2)]"
                  >
                    Continue
                  </button>
                </div>
              )}
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
                    <span className="rounded bg-amber/[0.07] px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber/50">
                      {pathway.group}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted/50">
                    {PATHWAY_DESCRIPTIONS[pathway.id] ?? "A mysterious path."}
                  </p>
                  {seq9 && (
                    <div className="border-t border-border/30 pt-2">
                      <p className="text-xs text-muted/50">
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
                    <span className="text-xs text-muted/40">
                      Sequence 9 — {seq9.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {seq9.abilities.slice(0, 3).map((ability) => (
                      <span
                        key={ability.name}
                        className="rounded border border-border/40 bg-surface/80 px-2 py-0.5 text-[11px] text-muted/60"
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
                  className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted/60"
                >
                  Character Name <span className="text-amber/50">*</span>
                </label>
                <input
                  id="char-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. Klein Moretti"
                  className="w-full rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/30 transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="char-bg"
                  className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted/60"
                >
                  Your Story{" "}
                  <span className="text-muted/30 normal-case tracking-normal">
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
                  className="w-full resize-none rounded-md border border-border/60 bg-surface/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/30 transition-colors focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
                />
                <p className="mt-1 text-right text-xs text-muted/30">
                  {characterBackground.length}&thinsp;/&thinsp;280
                </p>
              </div>
              <div className="mb-6 rounded-lg border border-border/40 bg-surface/30 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-muted/40">
                  Starting State
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted/40">Sequence</p>
                    <p className="font-serif text-lg text-foreground/70">9</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted/40">Sanity</p>
                    <p className="font-serif text-lg text-foreground/70">100</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted/40">Location</p>
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
          <p className="text-[10px] tracking-[0.2em] text-amber/40 uppercase mb-2">
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
