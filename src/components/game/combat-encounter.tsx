"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyPreparation,
  chooseOption,
  combatNarrationContext,
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
import type {
  GameState,
  ImageProviderConfig,
  LoreContext,
  NarrativeVerbosity,
  ProviderConfig,
  SceneArtContext,
} from "@/lib/ai";
import { getPathway, getSequence } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

import { SceneArt } from "./scene-art";

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

// The illustrated-moment description for a resolved fight (issue #20). Combat is
// one of the scene-art trigger moments, but the encounter runs on its own
// surface (outside the normal consequences phase where SceneArt is otherwise
// mounted), so the resolution screen builds its own context.
function combatArtContext(
  encounter: CombatEncounter,
  gameState: GameState,
): SceneArtContext {
  const seq = getSequence(gameState.pathwayId, gameState.sequenceLevel);
  const title = encounter.outcome ? OUTCOME_COPY[encounter.outcome].title : "Aftermath";
  return {
    summary: `${title} — the clash with ${encounter.enemy.name}`,
    location: gameState.location,
    ...(seq ? { pathwayName: seq.name } : {}),
  };
}

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
  sessionId,
  imageConfig,
  sceneArtEnabled,
  identityContext,
  profileContext,
  recognitionContext,
  epochContext,
  cityNarration,
  verbosity,
  onUpdate,
  onApplyResult,
  onExit,
}: {
  encounter: CombatEncounter;
  gameState: GameState;
  abilities: string[];
  config: ProviderConfig | null;
  /** The active save id — namespaces the combat illustration's cache key. */
  sessionId: string;
  /** Independently-configured image provider for scene art (issue #20). */
  imageConfig: ImageProviderConfig | null;
  /** Whether the player has opted into AI scene illustrations. */
  sceneArtEnabled: boolean;
  /** The worn persona's narrator presentation (issue #22), so the fight is
   * narrated as the face the player is actually wearing. Null when none worn. */
  identityContext?: string | null;
  /** True-self ground truth (pronouns/appearance/etc.) for narration fidelity. */
  profileContext?: string | null;
  /** Recognition gap (character-info storage): set only while showing the true
   * face, so a drastically-changed character is narrated consistently in-fight. */
  recognitionContext?: string | null;
  /** Epoch tone (issues #26/#29): so a fight in a pre-Iron-Age era is narrated
   * in that era's framing, not the Fifth-Epoch default. Null for the Fifth. */
  epochContext?: string | null;
  /** Per-city narration tone (issue #23): one tone sentence for the current
   * place. Null for cities with no specific tone. */
  cityNarration?: string | null;
  /** Player-chosen narration length (verbosity preset). Combat inherits the
   * verbosity directive (but never the pacing rule). Absent/"standard" = baseline. */
  verbosity?: NarrativeVerbosity;
  onUpdate: (next: CombatEncounter) => void;
  onApplyResult: (result: CombatResult, narratedScene?: string) => void;
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

    // The choices the player actually committed (preparation + chosen tactics),
    // so the narration matches what they did rather than a generic clash.
    const choices = combatNarrationContext(encounter);
    const choicesLine = choices ? ` ${choices}` : "";
    const playerAction =
      encounter.phase === "resolution"
        ? `Narrate the conclusion of my fight with ${encounter.enemy.name}. The outcome is: ${encounter.outcome}. ${encounter.result?.narrativeSummary ?? ""}${choicesLine}`
        : `A fight with ${encounter.enemy.name} begins. Set the scene in a sentence or two.${choicesLine}`;

    setNarrating(true);
    generate({
      config,
      gameState,
      memory: { immediateTurns: [], recentSummaries: [], sessionFacts: [] },
      loreContext: EMPTY_LORE,
      // Narrate as the worn persona / true self so the fight matches who the
      // player presents as (issue #22 / character-info storage).
      identityContext,
      profileContext,
      recognitionContext,
      // Era + place tone so the fight reads in the right setting, not the
      // Fifth-Epoch default (parity with the normal turn).
      epochContext,
      cityNarration,
      verbosity,
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
        <div
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-transparent via-crimson/40 to-transparent"
        />
        <span className="text-xs font-semibold tracking-[0.18em] text-crimson uppercase">
          combat
        </span>
        <div
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-transparent via-crimson/40 to-transparent"
        />
      </div>

      <h2
        id="combat-heading"
        className="mb-5 text-center font-serif text-lg font-semibold text-foreground"
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
          narrating={narrating}
          hasNarrative={resolutionNarrative !== undefined}
          artKey={`${sessionId}:combat:${encounter.id}`}
          artContext={combatArtContext(encounter, gameState)}
          imageConfig={imageConfig}
          sceneArtEnabled={sceneArtEnabled}
          // The fight's prose returns to the MAIN story (woven into the chronicle
          // + memory via ENGINE_RESOLUTION), not duplicated here — this screen is
          // the mechanical aftermath only. Falls back to the engine summary when
          // no narrator is configured.
          onContinue={() =>
            onApplyResult(encounter.result!, resolutionNarrative ?? undefined)
          }
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
    <div className="mx-auto mb-6 max-w-md rounded-xl border border-crimson/40 bg-surface p-5">
      <p className="text-center text-xs font-semibold tracking-[0.18em] text-crimson uppercase">
        Adversary
      </p>
      <p className="mt-2 text-center font-serif text-base font-semibold text-foreground">
        {intel.name}
      </p>
      {intel.description && (
        <p className="mt-1 text-center text-sm text-muted">{intel.description}</p>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        {intel.strength && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Strength</dt>
            <dd className="text-right font-medium text-foreground">
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
            <dd className="text-right font-medium text-foreground">{pathwayName}</dd>
          </div>
        )}
        {intel.knownAbilities.length > 0 && (
          <div>
            <dt className="text-muted">Known abilities</dt>
            <dd>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-foreground">
                {intel.knownAbilities.map((ability) => (
                  <li key={ability}>{ability}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      {intel.strength === null && (
        <p className="mt-3 text-center text-xs text-muted">
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

  // Sealed Artifacts get their own picker (they carry a mid-fight backlash and
  // are the only items the engine treats as combat artifacts); every OTHER
  // carried item — ordinary gear, weapons, loot, reagents — is offerable as a
  // consumed ritual material. The two lists are disjoint, so a mundane item can
  // no longer be readied as a "sealed artifact" to game the preparation score.
  const artifactNames = inventory
    .filter((i) => i.category === "sealed-artifact")
    .map((i) => i.name);
  const materialNames = inventory
    .filter((i) => i.category !== "sealed-artifact")
    .map((i) => i.name);
  const hasPreparables = materialNames.length > 0 || artifactNames.length > 0;

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-border bg-surface p-5 font-serif text-sm leading-relaxed text-foreground">
        Preparation gives you an edge — but it never decides a fight. Gather what you can,
        then trust your wits in the moment.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="combat-intel"
            className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Intelligence on the enemy
          </label>
          <select
            id="combat-intel"
            value={intelligence}
            onChange={(e) => setIntelligence(e.target.value as IntelligenceLevel)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
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
            className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Terrain &amp; positioning
          </label>
          <select
            id="combat-terrain"
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as TerrainAdvantage)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
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

      {hasPreparables ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {materialNames.length > 0 && (
            <CheckGroup
              legend="Prepare ritual materials (consumed)"
              items={materialNames}
              selected={materials}
              onToggle={(v) => toggle(v, materials, setMaterials)}
              namePrefix="material"
            />
          )}
          {artifactNames.length > 0 && (
            <CheckGroup
              legend="Ready sealed artifacts (spent only if used)"
              items={artifactNames}
              selected={artifacts}
              onToggle={(v) => toggle(v, artifacts, setArtifacts)}
              namePrefix="artifact"
            />
          )}
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
          className="min-h-[24px] rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
        >
          Commit and engage
        </button>
        <button
          type="button"
          onClick={onAmbushSelf}
          className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
        >
          Engage without preparing
        </button>
        <button
          type="button"
          onClick={onExit}
          className="min-h-[24px] rounded-lg px-3 py-1.5 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-amber hover:underline"
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
    <fieldset className="rounded-lg border border-border bg-surface-raised p-4">
      <legend className="px-1 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
        {legend}
      </legend>
      <div className="mt-2 space-y-2">
        {items.map((item, i) => {
          const id = `${namePrefix}-${i}`;
          return (
            <label
              key={id}
              htmlFor={id}
              className="flex min-h-[24px] cursor-pointer items-center gap-2.5 text-sm text-foreground"
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
          className="mb-5 rounded-xl border border-border bg-surface p-5"
        >
          <p className="font-serif text-sm leading-relaxed text-foreground">
            {sceneNarrative ?? "The narrator draws breath…"}
          </p>
        </div>
      )}

      <p className="mb-2 text-center text-xs font-semibold tracking-[0.18em] text-amber uppercase">
        Exchange {current} of {total}
      </p>
      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <p className="font-serif text-base leading-[1.85] text-foreground">
          {point.prompt}
        </p>
      </div>

      <div className="space-y-3">
        <p className="mb-3 text-center text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          Your move
        </p>
        {point.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            className="group w-full rounded-xl border border-border bg-surface px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40"
          >
            <p className="font-serif text-sm font-medium text-foreground">
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
  narrating,
  hasNarrative,
  artKey,
  artContext,
  imageConfig,
  sceneArtEnabled,
  onContinue,
}: {
  result: CombatResult;
  narrating: boolean;
  hasNarrative: boolean;
  artKey: string;
  artContext: SceneArtContext;
  imageConfig: ImageProviderConfig | null;
  sceneArtEnabled: boolean;
  onContinue: () => void;
}) {
  const copy = OUTCOME_COPY[result.outcome];

  return (
    <div className="animate-fade-in-up">
      <p className={`mb-4 text-center font-serif text-xl font-semibold ${copy.tone}`}>
        {copy.title}
      </p>

      {/* Scene art (issue #20): combat is a trigger moment. Renders from cache
          instantly, generates once when the player opted in + configured an
          image provider, and stays silent on failure. */}
      <SceneArt
        artKey={artKey}
        context={artContext}
        imageConfig={imageConfig}
        enabled={sceneArtEnabled}
      />

      <div className="mb-6 space-y-3 rounded-lg border border-border bg-surface-raised p-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          Consequences
        </p>

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
                <span className="text-foreground">
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
              <span className="text-foreground">{item.name}</span>{" "}
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

      <p className="mb-4 text-center text-sm text-muted" role="status">
        {narrating && !hasNarrative
          ? "The dust settles; the narrator draws breath…"
          : "The chronicle takes up the clash where you left it."}
      </p>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-[24px] rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
        >
          Return to the story →
        </button>
      </div>
    </div>
  );
}
