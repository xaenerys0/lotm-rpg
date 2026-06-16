"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyPreparation,
  chooseOption,
  emptyPreparation,
  enemyIntel,
  isExchangeComplete,
  resolveEncounter,
  type CombatEncounter,
  type CombatOutcome,
  type CombatPreparationInput,
  type CombatResult,
  type IntelligenceLevel,
  type TerrainAdvantage,
} from "@/lib/game";
import { generate } from "@/lib/ai";
import type { GameState, LoreContext, ProviderConfig } from "@/lib/ai";
import { getPathway, getSequence } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

const INTELLIGENCE_OPTIONS: { value: IntelligenceLevel; label: string }[] = [
  { value: "none", label: "None — you know nothing of this foe" },
  { value: "partial", label: "Partial — you know their pathway or rough strength" },
  { value: "thorough", label: "Thorough — pathway, sequence, and known abilities" },
];

const TERRAIN_OPTIONS: { value: TerrainAdvantage; label: string }[] = [
  { value: "none", label: "None — wherever the fight finds you" },
  { value: "neutral", label: "Neutral — you have surveyed the ground" },
  { value: "favorable", label: "Favorable — a position of your choosing" },
];

const OUTCOME_COPY: Record<CombatOutcome, { title: string; tone: string }> = {
  victory: { title: "Victory", tone: "text-sanity-high" },
  escape: { title: "Escape", tone: "text-gaslight" },
  stalemate: { title: "Stalemate", tone: "text-amber" },
  defeat: { title: "Defeat", tone: "text-sanity-low" },
};

const EMPTY_LORE: LoreContext = { entries: [], totalTokens: 0 };

/**
 * The combat encounter UI (issue #10): a mechanical preparation phase, an
 * exchange of inline tactical decision points, and a resolution screen. The
 * deterministic engine in `@/lib/game` owns every mechanic; this component
 * renders it and layers optional, pathway-flavoured AI narration on top
 * (falling back to the engine's own text when no provider is configured).
 */
export function CombatEncounterView({
  encounter,
  gameState,
  abilities,
  config,
  onUpdate,
  onApplyResult,
  onExit,
}: {
  encounter: CombatEncounter;
  gameState: GameState;
  abilities: string[];
  config: ProviderConfig | null;
  onUpdate: (next: CombatEncounter) => void;
  onApplyResult: (result: CombatResult) => void;
  onExit: () => void;
}) {
  const [aiNarrative, setAiNarrative] = useState<Record<string, string>>({});
  const [narrating, setNarrating] = useState(false);
  const narrationRef = useRef<Set<string>>(new Set());

  // Fetch optional AI narration for the current beat (opening + resolution),
  // keyed so each beat is narrated at most once. Falls back to engine text.
  useEffect(() => {
    if (!config || encounter.phase === "preparation") return;
    const key =
      encounter.phase === "resolution"
        ? `resolution:${encounter.id}`
        : `scene:${encounter.id}`;
    if (narrationRef.current.has(key)) return;
    narrationRef.current.add(key);

    const playerAction =
      encounter.phase === "resolution"
        ? `Narrate the conclusion of my fight with ${encounter.enemy.name}. The outcome is: ${encounter.outcome}. ${encounter.result?.narrativeSummary ?? ""}`
        : `A fight with ${encounter.enemy.name} begins. Set the scene in a sentence or two.`;

    setNarrating(true);
    generate({
      config,
      gameState,
      memory: { immediateTurns: [], recentSummaries: [], sessionFacts: [] },
      loreContext: EMPTY_LORE,
      instruction: "combat",
      playerAction,
      abilities,
      actingRequirements: [],
    })
      .then((result) => {
        setAiNarrative((prev) => ({ ...prev, [key]: result.response.narrative }));
      })
      .catch(() => {
        // Narration is best-effort; the engine text remains as the fallback.
      })
      .finally(() => setNarrating(false));
  }, [encounter.phase, encounter.id, encounter.outcome]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrepare = useCallback(
    (input: CombatPreparationInput) => {
      onUpdate(applyPreparation(encounter, input));
    },
    [encounter, onUpdate],
  );

  const handleChoose = useCallback(
    (optionId: string) => {
      const chosen = chooseOption(encounter, optionId);
      onUpdate(isExchangeComplete(chosen) ? resolveEncounter(chosen) : chosen);
    },
    [encounter, onUpdate],
  );

  const sceneNarrative = aiNarrative[`scene:${encounter.id}`];
  const resolutionNarrative = aiNarrative[`resolution:${encounter.id}`];

  return (
    <section aria-labelledby="combat-heading" className="animate-fade-in-up">
      <div className="mx-auto mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">combat</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />
      </div>

      <h2
        id="combat-heading"
        className="mb-1 text-center font-serif text-lg text-foreground"
      >
        {encounter.ambush ? "Ambush!" : "Confrontation"}
      </h2>

      <EnemyPanel encounter={encounter} />

      {encounter.phase === "preparation" && (
        <PreparationForm
          inventory={gameState.inventory}
          abilities={abilities}
          onPrepare={handlePrepare}
          onAmbushSelf={() => handlePrepare(emptyPreparation())}
          onExit={onExit}
        />
      )}

      {encounter.phase === "exchange" && (
        <ExchangePhase
          encounter={encounter}
          sceneNarrative={sceneNarrative}
          narrating={narrating}
          onChoose={handleChoose}
        />
      )}

      {encounter.phase === "resolution" && encounter.result && (
        <ResolutionPhase
          result={encounter.result}
          aiNarrative={resolutionNarrative}
          narrating={narrating}
          onContinue={() => onApplyResult(encounter.result!)}
        />
      )}
    </section>
  );
}

// ─── Enemy ───────────────────────────────────────────────────────────

// The opponent dossier: name + description always, plus whatever the player's
// intelligence level has revealed (rough strength, pathway, exact sequence and
// known abilities). All gating lives in the pure `enemyIntel`; this only formats.
function EnemyPanel({ encounter }: { encounter: CombatEncounter }) {
  const intel = enemyIntel(
    encounter.enemy,
    encounter.preparation?.intelligence ?? "none",
    encounter.playerSequence,
  );
  const pathwayName =
    intel.pathwayId !== null ? (getPathway(intel.pathwayId)?.name ?? null) : null;
  const roleName =
    intel.pathwayId !== null && intel.sequenceLevel !== null
      ? (getSequence(intel.pathwayId, intel.sequenceLevel)?.name ?? null)
      : null;

  return (
    <div className="mx-auto mb-6 max-w-md rounded-md border border-crimson/30 bg-crimson/[0.04] px-5 py-4">
      <p className="text-center font-serif text-base text-foreground">{intel.name}</p>
      {intel.description && (
        <p className="mt-1 text-center text-sm text-muted">{intel.description}</p>
      )}
      <dl className="mt-3 space-y-1 text-sm">
        {intel.strength && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Strength</dt>
            <dd className="text-foreground/85">
              {roleName
                ? `${roleName} — ${intel.strength}`
                : intel.sequenceLevel !== null
                  ? `Sequence ${intel.sequenceLevel} — ${intel.strength}`
                  : intel.strength}
            </dd>
          </div>
        )}
        {pathwayName && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Pathway</dt>
            <dd className="text-foreground/85">{pathwayName}</dd>
          </div>
        )}
        {intel.knownAbilities.length > 0 && (
          <div>
            <dt className="text-muted">Known abilities</dt>
            <dd>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-foreground/85">
                {intel.knownAbilities.map((ability) => (
                  <li key={ability}>{ability}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      {intel.strength === null && (
        <p className="mt-2 text-center text-xs text-muted">
          You know little of this foe — scout them first to learn their measure.
        </p>
      )}
    </div>
  );
}

// ─── Preparation ─────────────────────────────────────────────────────

function PreparationForm({
  inventory,
  abilities,
  onPrepare,
  onAmbushSelf,
  onExit,
}: {
  inventory: Item[];
  abilities: string[];
  onPrepare: (input: CombatPreparationInput) => void;
  onAmbushSelf: () => void;
  onExit: () => void;
}) {
  const [intelligence, setIntelligence] = useState<IntelligenceLevel>("none");
  const [terrain, setTerrain] = useState<TerrainAdvantage>("none");
  const [materials, setMaterials] = useState<string[]>([]);
  const [artifacts, setArtifacts] = useState<string[]>([]);
  const [readied, setReadied] = useState<string[]>([]);

  const toggle = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const byName = (names: string[]): Item[] =>
    names.map((n) => inventory.find((i) => i.name === n)).filter((i): i is Item => !!i);

  const submit = () => {
    // An item readied as an artifact is not also spent as a ritual material.
    const materialItems = byName(materials.filter((m) => !artifacts.includes(m)));
    onPrepare({
      intelligence,
      ritualMaterials: materialItems,
      sealedArtifacts: byName(artifacts),
      readiedAbilities: readied,
      terrain,
    });
  };

  const inventoryNames = inventory.map((i) => i.name);

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-border/40 bg-surface/40 px-5 py-4 font-serif text-sm leading-relaxed text-foreground/80">
        Preparation gives you an edge — but it never decides a fight. Gather what you can,
        then trust your wits in the moment.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="combat-intel"
            className="mb-1.5 block text-xs tracking-wider text-muted uppercase"
          >
            Intelligence on the enemy
          </label>
          <select
            id="combat-intel"
            value={intelligence}
            onChange={(e) => setIntelligence(e.target.value as IntelligenceLevel)}
            className="w-full rounded-md border border-border/60 bg-surface/60 px-3 py-2 text-sm text-foreground"
          >
            {INTELLIGENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="combat-terrain"
            className="mb-1.5 block text-xs tracking-wider text-muted uppercase"
          >
            Terrain &amp; positioning
          </label>
          <select
            id="combat-terrain"
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as TerrainAdvantage)}
            className="w-full rounded-md border border-border/60 bg-surface/60 px-3 py-2 text-sm text-foreground"
          >
            {TERRAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {abilities.length > 0 && (
        <CheckGroup
          legend="Ready abilities"
          items={abilities}
          selected={readied}
          onToggle={(v) => toggle(v, readied, setReadied)}
          namePrefix="ability"
        />
      )}

      {inventory.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckGroup
            legend="Prepare ritual materials (consumed)"
            items={inventoryNames}
            selected={materials}
            onToggle={(v) => toggle(v, materials, setMaterials)}
            namePrefix="material"
          />
          <CheckGroup
            legend="Ready sealed artifacts (spent only if used)"
            items={inventoryNames}
            selected={artifacts}
            onToggle={(v) => toggle(v, artifacts, setArtifacts)}
            namePrefix="artifact"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">
          You carry nothing to prepare with — you will have to rely on your abilities and
          your wits.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={submit}
          className="rounded-md border border-amber/40 bg-amber/[0.08] px-6 py-3 font-serif text-sm font-medium text-amber transition-all duration-300 hover:border-amber/60 hover:bg-amber/[0.14]"
        >
          Commit and engage
        </button>
        <button
          type="button"
          onClick={onAmbushSelf}
          className="min-h-[24px] rounded-md border border-border/50 bg-surface/30 px-4 py-2.5 text-sm text-muted transition-colors hover:border-border hover:text-foreground/80"
        >
          Engage without preparing
        </button>
        <button
          type="button"
          onClick={onExit}
          className="min-h-[24px] rounded-md px-4 py-2.5 text-sm text-muted underline-offset-4 transition-colors hover:text-foreground/80 hover:underline"
        >
          Avoid the fight
        </button>
      </div>
    </div>
  );
}

function CheckGroup({
  legend,
  items,
  selected,
  onToggle,
  namePrefix,
}: {
  legend: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  namePrefix: string;
}) {
  return (
    <fieldset className="rounded-md border border-border/40 bg-surface/30 p-4">
      <legend className="px-1 text-xs tracking-wider text-muted uppercase">
        {legend}
      </legend>
      <div className="mt-2 space-y-2">
        {items.map((item, i) => {
          const id = `${namePrefix}-${i}`;
          return (
            <label
              key={id}
              htmlFor={id}
              className="flex min-h-[24px] cursor-pointer items-center gap-2.5 text-sm text-foreground/80"
            >
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => onToggle(item)}
                className="h-4 w-4 rounded border-border bg-surface accent-amber"
              />
              <span>{item}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ─── Exchange ────────────────────────────────────────────────────────

function ExchangePhase({
  encounter,
  sceneNarrative,
  narrating,
  onChoose,
}: {
  encounter: CombatEncounter;
  sceneNarrative: string | undefined;
  narrating: boolean;
  onChoose: (optionId: string) => void;
}) {
  const point = encounter.decisionPoints[encounter.decisionIndex];
  if (!point) return null;
  const total = encounter.decisionPoints.length;
  const current = encounter.decisionIndex + 1;

  return (
    <div>
      {(sceneNarrative || narrating) && (
        <div
          role="status"
          className="mb-5 rounded-md border border-border/40 bg-surface/40 px-5 py-4"
        >
          <p className="font-serif text-sm leading-relaxed text-foreground/80">
            {sceneNarrative ?? "The narrator draws breath…"}
          </p>
        </div>
      )}

      <p className="mb-2 text-center text-[10px] tracking-[0.2em] text-muted uppercase">
        Exchange {current} of {total}
      </p>
      <div className="mb-6 rounded-lg border border-border/40 bg-surface/50 px-6 py-5">
        <p className="font-serif text-base leading-[1.85] text-foreground/90">
          {point.prompt}
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="mb-3 text-center text-xs tracking-[0.2em] text-muted uppercase">
          Your move
        </p>
        {point.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            className="group w-full rounded-md border border-border/60 bg-surface/30 px-5 py-4 text-left transition-all duration-200 hover:border-amber/30 hover:bg-surface/60"
          >
            <p className="font-serif text-sm text-foreground/90 transition-colors group-hover:text-foreground">
              {option.label}
              {option.consumesArtifact && (
                <span className="ml-2 text-xs text-occult-bright">
                  (spends an artifact)
                </span>
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Resolution ──────────────────────────────────────────────────────

function ResolutionPhase({
  result,
  aiNarrative,
  narrating,
  onContinue,
}: {
  result: CombatResult;
  aiNarrative: string | undefined;
  narrating: boolean;
  onContinue: () => void;
}) {
  const copy = OUTCOME_COPY[result.outcome];

  return (
    <div className="animate-fade-in-up">
      <p className={`mb-4 text-center font-serif text-xl font-semibold ${copy.tone}`}>
        {copy.title}
      </p>

      <div
        role="status"
        className="mb-6 rounded-lg border border-border/40 bg-surface/50 px-6 py-5"
      >
        <p className="font-serif text-base leading-[1.85] text-foreground/90">
          {aiNarrative ?? result.narrativeSummary}
          {narrating && !aiNarrative && (
            <span className="ml-2 text-sm italic text-muted">the dust settles…</span>
          )}
        </p>
      </div>

      <div className="mb-6 space-y-3 rounded-md border border-border/30 bg-background/50 p-4">
        <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Consequences</p>

        {result.sanityImpact !== 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sanity</span>
            <span className="font-medium text-sanity-low">{result.sanityImpact}</span>
          </div>
        )}

        {result.injuries.length > 0 && (
          <ul className="space-y-1">
            {result.injuries.map((injury) => (
              <li key={injury.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-sanity-low" aria-hidden="true">
                  ✚
                </span>
                <span className="text-foreground/80">
                  {injury.description}{" "}
                  <span className="text-muted">
                    ({injury.severity}, heals in {injury.recoveryTurns} turns)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {result.itemsGained.length > 0 &&
          result.itemsGained.map((item, i) => (
            <div key={`gain-${i}`} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-amber" aria-hidden="true">
                ✦
              </span>
              <span>
                <span className="font-medium text-amber">{item.name}</span>{" "}
                <span className="text-muted">gained</span>
              </span>
            </div>
          ))}

        {result.itemsLost.length > 0 &&
          result.itemsLost.map((item, i) => (
            <div key={`loss-${i}`} className="text-sm">
              <span className="text-foreground/70">{item.name}</span>{" "}
              <span className="text-muted">spent</span>
            </div>
          ))}

        {result.characteristicsDropped.length > 0 && (
          <div className="text-sm text-occult-bright">
            <span aria-hidden="true">✦ </span>A Beyonder characteristic falls from the
            slain foe.
          </div>
        )}

        {result.sanityImpact === 0 &&
          result.injuries.length === 0 &&
          result.itemsGained.length === 0 &&
          result.itemsLost.length === 0 &&
          result.characteristicsDropped.length === 0 && (
            <p className="text-sm text-muted">You walk away unmarked.</p>
          )}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md border border-amber/40 bg-amber/[0.08] px-6 py-3 font-serif text-sm font-medium text-amber transition-all duration-300 hover:border-amber/60 hover:bg-amber/[0.14]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
