"use client";

import { useState, useCallback } from "react";
import {
  PROLOGUE_SCENES,
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  recommendPathway,
  createPrologueState,
} from "@/lib/game";
import type { PrologueSelection, PrologueState } from "@/lib/game";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";

type CreationStep =
  | "mode-select"
  | "prologue"
  | "recommendation"
  | "character-sheet"
  | "first-potion";

const PATHWAY_DESCRIPTIONS: Record<number, string> = {
  1: "Seer, Clown, Magician — mysteries of fate",
  2: "Prophet, Oracle, Saint — dreams and prophecy",
  3: "Redeemer, Purifier, Holy Knight — radiance and healing",
  4: "Reaper, Sleepless, Spirit Medium — spirits and the beyond",
};

const STEP_NUMBER: Record<CreationStep, number> = {
  "mode-select": 1,
  prologue: 2,
  recommendation: 3,
  "character-sheet": 4,
  "first-potion": 5,
};

interface CharacterCreationProps {
  onComplete: (
    pathwayId: number,
    characterName: string,
    characterBackground: string,
    prologueSelections: PrologueSelection[],
  ) => void;
  onBack: () => void;
}

export function CharacterCreation({ onComplete, onBack }: CharacterCreationProps) {
  const [step, setStep] = useState<CreationStep>("mode-select");
  const [prologueState, setPrologueState] = useState<PrologueState>(createPrologueState);
  const [skipPrologue, setSkipPrologue] = useState(false);
  const [selectedPathwayId, setSelectedPathwayId] = useState<number | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterBackground, setCharacterBackground] = useState("");

  const handleBeginPrologue = useCallback(() => {
    setPrologueState(createPrologueState());
    setSkipPrologue(false);
    setShowOverride(false);
    setStep("prologue");
  }, []);

  const handleSkipPrologue = useCallback(() => {
    setSkipPrologue(true);
    setShowOverride(false);
    setStep("recommendation");
  }, []);

  const handleChoiceSelect = useCallback(
    (sceneId: string, choiceId: string, currentSceneIndex: number) => {
      setPrologueState((prev) => ({
        currentScene: currentSceneIndex + 1,
        selections: [...prev.selections, { sceneId, choiceId }],
        isComplete: currentSceneIndex + 1 >= PROLOGUE_SCENES.length,
      }));
      if (currentSceneIndex >= PROLOGUE_SCENES.length - 1) {
        setStep("recommendation");
      }
    },
    [],
  );

  const handlePrologueBack = useCallback((currentSceneIndex: number) => {
    if (currentSceneIndex === 0) {
      setStep("mode-select");
    } else {
      setPrologueState((prev) => ({
        currentScene: prev.currentScene - 1,
        selections: prev.selections.slice(0, prev.currentScene - 1),
        isComplete: false,
      }));
    }
  }, []);

  const handleAcceptPathway = useCallback((pathwayId: number) => {
    setSelectedPathwayId(pathwayId);
    setShowOverride(false);
    setStep("character-sheet");
  }, []);

  const handleRecommendationBack = useCallback(() => {
    if (skipPrologue) {
      setStep("mode-select");
    } else {
      setPrologueState((prev) => ({
        currentScene: PROLOGUE_SCENES.length - 1,
        selections: prev.selections.slice(0, PROLOGUE_SCENES.length - 1),
        isComplete: false,
      }));
      setStep("prologue");
    }
  }, [skipPrologue]);

  const handleCharacterContinue = useCallback(() => {
    if (characterName.trim()) setStep("first-potion");
  }, [characterName]);

  const handleBeginChronicle = useCallback(() => {
    if (selectedPathwayId !== null) {
      onComplete(
        selectedPathwayId,
        characterName.trim(),
        characterBackground.trim(),
        prologueState.selections,
      );
    }
  }, [
    selectedPathwayId,
    characterName,
    characterBackground,
    prologueState.selections,
    onComplete,
  ]);

  const stepNumber = STEP_NUMBER[step];

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      {/* Step dots */}
      <div className="mb-8 flex items-center justify-between">
        <span className="text-[10px] text-muted/30 uppercase tracking-[0.2em]">
          Character Creation
        </span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`rounded-full transition-all duration-300 ${
                n < stepNumber
                  ? "h-1.5 w-1.5 bg-amber"
                  : n === stepNumber
                    ? "h-1.5 w-3 bg-amber/70"
                    : "h-1.5 w-1.5 bg-border"
              }`}
            />
          ))}
          <span className="ml-1 text-[10px] text-muted/30">
            {stepNumber}&thinsp;/&thinsp;5
          </span>
        </div>
      </div>

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
            The prologue takes ~5 minutes and reveals your Beyonder affinity.
          </p>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleBeginPrologue}
              className="group rounded-lg border border-amber/20 bg-amber/[0.04] p-6 text-left transition-all duration-300 hover:border-amber/40 hover:bg-amber/[0.08] hover:shadow-[0_0_32px_rgba(217,119,6,0.07)]"
            >
              <p className="text-[10px] tracking-widest text-amber/50 uppercase mb-2">
                Guided
              </p>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2 transition-colors group-hover:text-amber">
                Begin the Prologue
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Four narrative vignettes will reveal your instincts. Your choices guide
                you to the pathway that fits your nature.
              </p>
            </button>
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

      {/* ── PROLOGUE ── */}
      {step === "prologue" &&
        (() => {
          const scene = PROLOGUE_SCENES[prologueState.currentScene];
          if (!scene) return null;
          const progress = (prologueState.currentScene / PROLOGUE_SCENES.length) * 100;
          return (
            <div className="animate-fade-in-up">
              <div className="mb-6 h-px bg-border relative overflow-hidden rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-amber/50 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePrologueBack(prologueState.currentScene)}
                  className="text-xs text-muted transition-colors hover:text-amber"
                >
                  &larr; Back
                </button>
                <span className="text-xs text-muted/40">
                  Scene {prologueState.currentScene + 1} of {PROLOGUE_SCENES.length}
                </span>
              </div>
              <div className="max-w-2xl">
                <p className="text-[10px] tracking-[0.15em] text-amber/40 uppercase mb-1">
                  {scene.setting}
                </p>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                  {scene.title}
                </h2>
                <p className="mb-8 border-l-2 border-amber/10 pl-4 text-sm leading-relaxed text-muted">
                  {scene.narrative}
                </p>
                <p className="mb-3 text-[10px] uppercase tracking-wider text-muted/40">
                  What do you do?
                </p>
                <div className="space-y-3">
                  {scene.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() =>
                        handleChoiceSelect(
                          scene.id,
                          choice.id,
                          prologueState.currentScene,
                        )
                      }
                      className="group w-full cursor-pointer rounded-lg border border-border/60 bg-surface/30 p-4 text-left text-sm leading-relaxed text-muted transition-all duration-200 hover:border-amber/30 hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_16px_rgba(217,119,6,0.05)]"
                    >
                      <span className="mr-2 text-amber/30 transition-colors group-hover:text-amber/50">
                        ›
                      </span>
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── RECOMMENDATION ── */}
      {step === "recommendation" &&
        (() => {
          const rec = skipPrologue ? null : recommendPathway(prologueState.selections);
          const affinityLabel =
            rec === null
              ? null
              : rec.score >= 6
                ? "Strong Affinity"
                : rec.score >= 4
                  ? "Clear Affinity"
                  : "Mixed Signals";

          return (
            <div className="animate-fade-in-up">
              <button
                type="button"
                onClick={handleRecommendationBack}
                className="mb-6 text-xs text-muted transition-colors hover:text-amber"
              >
                &larr; Back
              </button>

              {/* Prologue-based recommendation */}
              {rec !== null &&
                !showOverride &&
                (() => {
                  const pathway = ALL_PATHWAYS.find((p) => p.id === rec.pathwayId);
                  const seq9 = pathway ? getSequence(pathway.id, 9) : null;
                  return (
                    <div className="max-w-xl">
                      <p className="text-[10px] tracking-[0.2em] text-amber/50 uppercase mb-2">
                        {affinityLabel}
                      </p>
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-1">
                        Your choices reveal&hellip;
                      </h2>
                      <p className="font-serif text-2xl text-amber mb-6">
                        The {pathway?.name ?? "Unknown"} Pathway
                      </p>
                      <div className="mb-6">
                        <div className="h-0.5 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full bg-amber/60 transition-all duration-700"
                            style={{ width: `${(rec.score / rec.maxPossible) * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted/40">
                          Affinity strength: {rec.score}&thinsp;/&thinsp;{rec.maxPossible}
                        </p>
                      </div>
                      <p className="mb-6 border-l-2 border-amber/10 pl-4 text-sm italic leading-relaxed text-muted">
                        {rec.justification}
                      </p>
                      {seq9 && (
                        <div className="mb-6 rounded-lg border border-border/50 bg-surface/40 p-4">
                          <p className="mb-1 text-xs text-muted/50">You begin as</p>
                          <p className="font-serif text-lg text-foreground/80">
                            Sequence 9 — {seq9.name}
                          </p>
                          <p className="mt-1 text-xs text-muted/40">
                            {seq9.abilities.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => handleAcceptPathway(rec.pathwayId)}
                          className="rounded bg-amber/90 px-6 py-2.5 text-sm font-medium text-background transition-all hover:bg-amber"
                        >
                          Accept this Path
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOverride(true)}
                          className="text-xs text-muted/50 underline underline-offset-2 transition-colors hover:text-muted"
                        >
                          or choose a different path
                        </button>
                      </div>
                    </div>
                  );
                })()}

              {/* Manual pathway selection */}
              {(skipPrologue || showOverride) && (
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                    {skipPrologue
                      ? "Choose Your Beyonder Path"
                      : "Choose a Different Path"}
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
            </div>
          );
        })()}

      {/* ── CHARACTER SHEET ── */}
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
