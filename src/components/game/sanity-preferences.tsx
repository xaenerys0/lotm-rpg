"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES, type GamePreferences } from "@/lib/game";
import type { NarrativeVerbosity } from "@/lib/ai";
import { noopSubscribe } from "@/lib/react";
import {
  applyContrastPreference,
  loadPreferences,
  savePreferences,
} from "./preferences-store";

// Display preferences (issues #9, #13): the sanity-meter toggle and the
// high-contrast mode. One component so Settings shows them as one group.

export function SanityPreferences() {
  const cacheRef = useRef<GamePreferences | null>(null);
  const initial = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) {
        cacheRef.current = loadPreferences();
      }
      return cacheRef.current;
    },
    () => DEFAULT_PREFERENCES,
  );

  // Derive from the reactive store snapshot until a toggle overrides it.
  // `useState(initial)` would freeze on the server fallback (DEFAULT_PREFERENCES)
  // captured at the hydration render and never reflect saved prefs on a full page
  // load; the override pattern corrects after hydration.
  const [prefsOverride, setPrefsOverride] = useState<GamePreferences | null>(null);
  const prefs = prefsOverride ?? initial;

  const toggle = useCallback(
    (key: keyof GamePreferences) => {
      const next = { ...prefs, [key]: !prefs[key] };
      savePreferences(next);
      if (key === "highContrast") applyContrastPreference(next);
      setPrefsOverride(next);
    },
    [prefs],
  );

  // narrativeVerbosity is an enum, not a boolean — it needs its own setter
  // (the generic `toggle` only flips booleans).
  const setVerbosity = useCallback(
    (value: NarrativeVerbosity) => {
      const next = { ...prefs, narrativeVerbosity: value };
      savePreferences(next);
      setPrefsOverride(next);
    },
    [prefs],
  );

  return (
    <div className="space-y-4">
      <VerbosityControl value={prefs.narrativeVerbosity} onSelect={setVerbosity} />
      <PreferenceToggle
        label="Show sanity meter"
        description="By default your sanity is hidden — you read your state from the world itself, as it distorts around you. Reveal the numeric meter for strategic management."
        checked={prefs.sanityMeterVisible}
        onToggle={() => toggle("sanityMeterVisible")}
      />
      <PreferenceToggle
        label="Show digestion meter"
        description="Reveal the numeric potion-digestion meter and acting readouts. Hidden by default — and it stays hidden until your character has discovered the acting method through play."
        checked={prefs.digestionMeterVisible}
        onToggle={() => toggle("digestionMeterVisible")}
      />
      <PreferenceToggle
        label="Scene illustrations"
        description="Illustrate key moments (advancement, deaths, battles) with AI-generated art. Uses a separate image provider and model you configure in Settings → Scene art (OpenAI, a local/cloud Ollama image model, or local Stable Diffusion) — off by default."
        checked={prefs.sceneArtEnabled}
        onToggle={() => toggle("sceneArtEnabled")}
      />
      <PreferenceToggle
        label="Movement realism"
        description="Block the narrator from teleporting you across the map. Travel between cities stays your deliberate choice on the map; the narrator may still move you within a city. Leave on unless you want the AI to relocate you freely."
        checked={prefs.movementGateEnabled}
        onToggle={() => toggle("movementGateEnabled")}
      />
      <PreferenceToggle
        label="High-contrast mode"
        description="Brightens text and borders and quiets the fog and lamplight effects, so the words always come first."
        checked={prefs.highContrast}
        onToggle={() => toggle("highContrast")}
      />
    </div>
  );
}

const VERBOSITY_OPTIONS: { value: NarrativeVerbosity; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "standard", label: "Standard" },
  { value: "rich", label: "Rich" },
];

function VerbosityControl({
  value,
  onSelect,
}: {
  value: NarrativeVerbosity;
  onSelect: (value: NarrativeVerbosity) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p id="verbosity-label" className="text-sm font-medium text-foreground">
        Narration length
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        How much the narrator writes each turn. <strong>Concise</strong> keeps scenes
        short and tight; <strong>Rich</strong> draws them out with more atmosphere. Shapes
        the AI&rsquo;s prose only — it changes no game mechanics.
      </p>
      <div
        role="radiogroup"
        aria-labelledby="verbosity-label"
        className="mt-3 flex gap-2"
      >
        {VERBOSITY_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(option.value)}
              className={`min-h-[24px] flex-1 rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
                selected
                  ? "border-amber/60 bg-amber/20 text-foreground"
                  : "border-border bg-surface text-muted hover:border-amber/30"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-200">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
          checked
            ? "border-amber/60 bg-amber/30"
            : "border-border bg-surface hover:border-amber/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-5 bg-amber" : "translate-x-1 bg-muted"
          }`}
        />
      </button>
    </div>
  );
}
