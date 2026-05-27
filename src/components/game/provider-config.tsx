"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ProviderId, ProviderConfig } from "@/lib/ai";
import { PROVIDER_MODELS, validateProviderConfig } from "@/lib/ai";
import { PROVIDER_CONFIG_KEY } from "@/lib/game";

const PROVIDERS: { id: ProviderId; label: string; needsBaseUrl: boolean }[] = [
  { id: "anthropic", label: "Anthropic", needsBaseUrl: false },
  { id: "openai", label: "OpenAI", needsBaseUrl: false },
  { id: "openrouter", label: "OpenRouter", needsBaseUrl: false },
  { id: "ollama", label: "Ollama", needsBaseUrl: true },
  { id: "custom", label: "Custom Provider", needsBaseUrl: true },
];

type ConnectionStatus = "idle" | "testing" | "valid" | "invalid";
type SaveStatus = "saved" | "unsaved" | "saving";

interface FormState {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  routineModel: string;
  premiumModel: string;
  customRoutineModel: string;
  customPremiumModel: string;
}

function getDefaultBaseUrl(providerId: ProviderId): string {
  if (providerId === "ollama") return "http://localhost:11434";
  if (providerId === "custom") return "";
  return "";
}

function getDefaultModels(providerId: ProviderId) {
  const models = PROVIDER_MODELS[providerId];
  return {
    routine: models.find((m) => m.tier === "routine")?.id ?? "",
    premium: models.find((m) => m.tier === "premium")?.id ?? "",
  };
}

function loadInitialState(): FormState {
  const defaults = getDefaultModels("anthropic");
  const defaultState: FormState = {
    providerId: "anthropic",
    apiKey: "",
    baseUrl: "",
    routineModel: defaults.routine,
    premiumModel: defaults.premium,
    customRoutineModel: "",
    customPremiumModel: "",
  };

  if (typeof window === "undefined") {
    return defaultState;
  }
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    if (raw) {
      const config = JSON.parse(raw) as ProviderConfig;
      return {
        providerId: config.providerId,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl ?? "",
        routineModel: config.providerId === "custom" ? "" : config.routineModel,
        premiumModel: config.providerId === "custom" ? "" : config.premiumModel,
        customRoutineModel: config.providerId === "custom" ? config.routineModel : "",
        customPremiumModel: config.providerId === "custom" ? config.premiumModel : "",
      };
    }
  } catch {
    // Corrupt data — start fresh
  }
  return defaultState;
}

const defaultFormState: FormState = (() => {
  const defaults = getDefaultModels("anthropic");
  return {
    providerId: "anthropic" as ProviderId,
    apiKey: "",
    baseUrl: "",
    routineModel: defaults.routine,
    premiumModel: defaults.premium,
    customRoutineModel: "",
    customPremiumModel: "",
  };
})();

const noopSubscribe = () => () => {};

export function ProviderConfig() {
  const cacheRef = useRef<FormState | null>(null);
  const initialState = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) {
        cacheRef.current = loadInitialState();
      }
      return cacheRef.current;
    },
    () => defaultFormState,
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const providerMeta = PROVIDERS.find((p) => p.id === form.providerId)!;
  const models = PROVIDER_MODELS[form.providerId];
  const routineModels = useMemo(
    () => models.filter((m) => m.tier === "routine"),
    [models],
  );
  const premiumModels = useMemo(
    () => models.filter((m) => m.tier === "premium"),
    [models],
  );
  const isCustom = form.providerId === "custom";

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("unsaved");
      setConnectionStatus("idle");
    },
    [],
  );

  const handleProviderChange = useCallback((newId: ProviderId) => {
    const newModels = PROVIDER_MODELS[newId];
    const defaultRoutine = newModels.find((m) => m.tier === "routine")?.id ?? "";
    const defaultPremium = newModels.find((m) => m.tier === "premium")?.id ?? "";

    setForm({
      providerId: newId,
      apiKey: "",
      baseUrl: getDefaultBaseUrl(newId),
      routineModel: defaultRoutine,
      premiumModel: defaultPremium,
      customRoutineModel: "",
      customPremiumModel: "",
    });
    setConnectionStatus("idle");
    setConnectionError("");
    setSaveStatus("unsaved");
  }, []);

  const buildConfig = useCallback((): ProviderConfig => {
    return {
      providerId: form.providerId,
      apiKey: form.apiKey,
      baseUrl: providerMeta.needsBaseUrl ? form.baseUrl : undefined,
      routineModel: isCustom ? form.customRoutineModel : form.routineModel,
      premiumModel: isCustom ? form.customPremiumModel : form.premiumModel,
    };
  }, [form, isCustom, providerMeta.needsBaseUrl]);

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus("testing");
    setConnectionError("");
    try {
      const result = await validateProviderConfig(buildConfig());
      if (result.valid) {
        setConnectionStatus("valid");
      } else {
        setConnectionStatus("invalid");
        setConnectionError(result.error ?? "Connection failed");
      }
    } catch (err) {
      setConnectionStatus("invalid");
      setConnectionError(err instanceof Error ? err.message : "Unexpected error");
    }
  }, [buildConfig]);

  const handleSave = useCallback(() => {
    setSaveStatus("saving");
    try {
      localStorage.setItem(PROVIDER_CONFIG_KEY, JSON.stringify(buildConfig()));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [buildConfig]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Provider Selector */}
      <fieldset>
        <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Provider
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProviderChange(p.id)}
              className={`group relative rounded-md border px-3 py-2.5 text-sm transition-all duration-200 ${
                form.providerId === p.id
                  ? "border-amber/60 bg-amber/[0.08] text-amber shadow-[inset_0_1px_0_rgba(217,119,6,0.1),0_0_12px_rgba(217,119,6,0.06)]"
                  : "border-border bg-surface text-muted hover:border-amber/20 hover:text-foreground/80"
              }`}
            >
              <span
                className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                  form.providerId === p.id
                    ? "bg-amber shadow-[0_0_6px_var(--color-amber)]"
                    : "bg-transparent"
                }`}
                aria-hidden="true"
              />
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* API Key */}
      <fieldset>
        <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          {form.providerId === "ollama" ? "Connection" : "API Key"}
        </legend>
        {form.providerId !== "ollama" && (
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={form.apiKey}
              onChange={(e) => updateField("apiKey", e.target.value)}
              placeholder={
                form.providerId === "anthropic"
                  ? "sk-ant-..."
                  : form.providerId === "openai"
                    ? "sk-..."
                    : "Enter your API key"
              }
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 pr-20 font-mono text-sm text-foreground placeholder-muted/40 transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded px-2 py-1 text-xs text-muted transition-colors hover:text-amber"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted/60">
          {form.providerId === "ollama"
            ? "Ollama runs locally. No API key required — just ensure Ollama is running."
            : "Your key is stored locally in this browser. It is never sent to our servers."}
        </p>
      </fieldset>

      {/* Base URL (conditional) */}
      {providerMeta.needsBaseUrl && (
        <fieldset>
          <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            Base URL
          </legend>
          <input
            type="url"
            value={form.baseUrl}
            onChange={(e) => updateField("baseUrl", e.target.value)}
            placeholder={
              form.providerId === "ollama"
                ? "http://localhost:11434"
                : "https://your-endpoint.example.com/v1"
            }
            className="w-full rounded-md border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder-muted/40 transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
          />
        </fieldset>
      )}

      {/* Model Selection */}
      <fieldset>
        <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Models
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Routine Model */}
          <div>
            <label className="mb-1.5 block text-xs text-muted">
              Routine{" "}
              <span className="text-muted/40">— narration, choices, evaluation</span>
            </label>
            {isCustom ? (
              <input
                type="text"
                value={form.customRoutineModel}
                onChange={(e) => updateField("customRoutineModel", e.target.value)}
                placeholder="e.g. gpt-4o-mini"
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-muted/40 transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              />
            ) : (
              <select
                value={form.routineModel}
                onChange={(e) => updateField("routineModel", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              >
                {routineModels.length === 0 && (
                  <option value="">No routine models</option>
                )}
                {routineModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                {premiumModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (premium)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Premium Model */}
          <div>
            <label className="mb-1.5 block text-xs text-muted">
              Premium <span className="text-muted/40">— advancement, combat</span>
            </label>
            {isCustom ? (
              <input
                type="text"
                value={form.customPremiumModel}
                onChange={(e) => updateField("customPremiumModel", e.target.value)}
                placeholder="e.g. gpt-4o"
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-muted/40 transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              />
            ) : (
              <select
                value={form.premiumModel}
                onChange={(e) => updateField("premiumModel", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              >
                {premiumModels.length === 0 && (
                  <option value="">No premium models</option>
                )}
                {premiumModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                {routineModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (routine)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </fieldset>

      {/* Connection Status & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={
              connectionStatus === "testing" ||
              (!form.apiKey && form.providerId !== "ollama")
            }
            className="rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/50 hover:bg-amber/[0.1] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-amber/30 disabled:hover:bg-amber/[0.06]"
          >
            {connectionStatus === "testing" ? "Testing..." : "Test Connection"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className="rounded-md bg-amber/90 px-4 py-2 text-sm font-medium text-background transition-all duration-200 hover:bg-amber disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : "Save Configuration"}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          {connectionStatus === "valid" && (
            <span className="flex items-center gap-1.5 text-sanity-high">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sanity-high shadow-[0_0_6px_var(--color-sanity-high)]" />
              Connected
            </span>
          )}
          {connectionStatus === "invalid" && (
            <span className="flex items-center gap-1.5 text-sanity-low">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sanity-low shadow-[0_0_6px_var(--color-sanity-low)]" />
              Failed
            </span>
          )}
          {connectionStatus === "testing" && (
            <span className="flex items-center gap-1.5 text-gaslight">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gaslight" />
              Testing...
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-muted/60 italic">Unsaved changes</span>
          )}
          {saveStatus === "saved" && connectionStatus === "idle" && (
            <span className="text-muted/40">Configuration saved</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {connectionStatus === "invalid" && connectionError && (
        <div className="rounded-md border border-crimson/30 bg-crimson/[0.06] px-4 py-3 text-sm text-sanity-low">
          {connectionError}
        </div>
      )}
    </div>
  );
}
