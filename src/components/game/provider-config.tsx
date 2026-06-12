"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { ProviderId, ProviderConfig, ModelOption } from "@/lib/ai";
import { PROVIDER_MODELS, validateProviderConfig, listProviderModels } from "@/lib/ai";
import { PROVIDER_CONFIG_KEY, MODELS_CACHE_KEY } from "@/lib/game";
import { noopSubscribe } from "@/lib/react";

const PROVIDERS: {
  id: ProviderId;
  label: string;
  needsBaseUrl: boolean;
  requiresAuth: boolean;
}[] = [
  { id: "anthropic", label: "Anthropic", needsBaseUrl: false, requiresAuth: true },
  { id: "openai", label: "OpenAI", needsBaseUrl: false, requiresAuth: true },
  { id: "openrouter", label: "OpenRouter", needsBaseUrl: false, requiresAuth: true },
  { id: "ollama", label: "Ollama (local)", needsBaseUrl: true, requiresAuth: false },
  { id: "ollama-cloud", label: "Ollama Cloud", needsBaseUrl: false, requiresAuth: true },
  { id: "custom", label: "Custom Provider", needsBaseUrl: true, requiresAuth: true },
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

// ─── Live model catalog: caching ───────────────────────────────────
// Provider /models endpoints are fetched on demand and cached in localStorage
// with a TTL so the dropdowns stay current without refetching every visit.

const MODELS_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedModels {
  models: ModelOption[];
  fetchedAt: number;
}

// Cache key uses the resolved base URL so local Ollama / custom endpoints don't
// collide; auth-only providers share one entry ("").
function effectiveBaseUrl(providerId: ProviderId, baseUrl: string): string {
  const meta = PROVIDERS.find((p) => p.id === providerId);
  if (!meta?.needsBaseUrl) return "";
  return baseUrl || getDefaultBaseUrl(providerId);
}

function modelCacheKey(providerId: ProviderId, baseUrl: string): string {
  return `${MODELS_CACHE_KEY}:${providerId}:${effectiveBaseUrl(providerId, baseUrl)}`;
}

function loadCachedModels(providerId: ProviderId, baseUrl: string): ModelOption[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(modelCacheKey(providerId, baseUrl));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedModels;
    if (!Array.isArray(parsed.models) || Date.now() - parsed.fetchedAt > MODELS_TTL_MS) {
      return null;
    }
    return parsed.models;
  } catch {
    return null;
  }
}

function saveCachedModels(
  providerId: ProviderId,
  baseUrl: string,
  models: ModelOption[],
): void {
  try {
    localStorage.setItem(
      modelCacheKey(providerId, baseUrl),
      JSON.stringify({ models, fetchedAt: Date.now() } satisfies CachedModels),
    );
  } catch {
    // Quota or unavailable — non-fatal, dropdowns fall back to the static list.
  }
}

// Picks sensible default routine/premium models from a list (live or static),
// using the inferred tier and falling back to the first/last entry.
function pickDefaultModels(models: ModelOption[]) {
  return {
    routine: models.find((m) => m.tier === "routine")?.id ?? models[0]?.id ?? "",
    premium:
      models.find((m) => m.tier === "premium")?.id ?? models[models.length - 1]?.id ?? "",
  };
}

function getDefaultModels(providerId: ProviderId) {
  return pickDefaultModels(PROVIDER_MODELS[providerId]);
}

// Ensures a saved selection that isn't in the catalog still appears as an
// option (so the <select> stays on the user's choice rather than blanking).
function withSelected(models: ModelOption[], selected: string): ModelOption[] {
  if (selected && !models.some((m) => m.id === selected)) {
    return [{ id: selected, name: selected, tier: "routine" }, ...models];
  }
  return models;
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
      // Reject stale provider IDs that no longer exist in PROVIDERS
      if (!PROVIDERS.some((p) => p.id === config.providerId)) {
        return defaultState;
      }
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

  // Initial cached model catalog, read through the same store pattern as the
  // form so SSR and the first client paint agree (server snapshot is null).
  const modelsCacheRef = useRef<ModelOption[] | null | undefined>(undefined);
  const initialModels = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (modelsCacheRef.current === undefined) {
        modelsCacheRef.current = loadCachedModels(
          initialState.providerId,
          initialState.baseUrl,
        );
      }
      return modelsCacheRef.current;
    },
    () => null,
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [availableModels, setAvailableModels] = useState<ModelOption[] | null>(
    initialModels,
  );
  const [modelsStatus, setModelsStatus] = useState<"idle" | "loading" | "error">("idle");

  const providerMeta = PROVIDERS.find((p) => p.id === form.providerId)!;
  const isCustom = form.providerId === "custom";
  const canTest = !!form.apiKey || !providerMeta.requiresAuth;
  // Live catalog when available, otherwise the curated built-in list.
  const displayModels = availableModels ?? PROVIDER_MODELS[form.providerId];

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("unsaved");
      setConnectionStatus("idle");
    },
    [],
  );

  const handleProviderChange = useCallback((newId: ProviderId) => {
    const newBaseUrl = getDefaultBaseUrl(newId);
    const cached = loadCachedModels(newId, newBaseUrl);
    const list = cached ?? PROVIDER_MODELS[newId];
    const defaults = pickDefaultModels(list);

    setAvailableModels(cached);
    setModelsStatus("idle");
    setForm({
      providerId: newId,
      apiKey: "",
      baseUrl: newBaseUrl,
      routineModel: defaults.routine,
      premiumModel: defaults.premium,
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

  const handleRefreshModels = useCallback(async () => {
    setModelsStatus("loading");
    try {
      const models = await listProviderModels(buildConfig());
      setAvailableModels(models);
      saveCachedModels(form.providerId, form.baseUrl, models);
      setModelsStatus("idle");
    } catch {
      setModelsStatus("error");
    }
  }, [buildConfig, form.providerId, form.baseUrl]);

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus("testing");
    setConnectionError("");
    try {
      const result = await validateProviderConfig(buildConfig());
      if (result.valid) {
        setConnectionStatus("valid");
        // Best-effort: refresh the live model list once the key is known good.
        if (!isCustom) void handleRefreshModels();
      } else {
        setConnectionStatus("invalid");
        setConnectionError(result.error ?? "Connection failed");
      }
    } catch (err) {
      setConnectionStatus("invalid");
      setConnectionError(err instanceof Error ? err.message : "Unexpected error");
    }
  }, [buildConfig, isCustom, handleRefreshModels]);

  // Key removal/rotation (issue #15): wipe the key from the form AND from the
  // persisted config immediately — no save step where a stale key lingers.
  const handleRemoveKey = useCallback(() => {
    setForm((f) => ({ ...f, apiKey: "" }));
    setConnectionStatus("idle");
    try {
      const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem(
          PROVIDER_CONFIG_KEY,
          JSON.stringify({ ...stored, apiKey: "" }),
        );
      }
    } catch {
      // Storage unavailable — the in-memory form is still cleared.
    }
    setSaveStatus("unsaved");
  }, []);

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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProviderChange(p.id)}
              aria-pressed={form.providerId === p.id}
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
          {providerMeta.requiresAuth ? "API Key" : "Connection"}
        </legend>
        {providerMeta.requiresAuth && (
          <div className="relative">
            <input
              id="provider-api-key"
              aria-label="API key"
              type={showKey ? "text" : "password"}
              value={form.apiKey}
              onChange={(e) => updateField("apiKey", e.target.value)}
              placeholder={
                form.providerId === "anthropic"
                  ? "sk-ant-..."
                  : form.providerId === "openai"
                    ? "sk-..."
                    : form.providerId === "ollama-cloud"
                      ? "Enter your ollama.com API key"
                      : "Enter your API key"
              }
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 pr-20 font-mono text-sm text-foreground placeholder-muted transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              aria-pressed={showKey}
              aria-controls="provider-api-key"
              aria-label={showKey ? "Hide API key" : "Show API key"}
              className="absolute top-1/2 right-3 flex min-h-[24px] -translate-y-1/2 items-center rounded px-2 py-1 text-xs text-muted transition-colors hover:text-amber"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {!providerMeta.requiresAuth
            ? "Ollama runs locally — no API key required. Just ensure Ollama is running."
            : form.providerId === "ollama-cloud"
              ? "Your API key from ollama.com. Sign in at ollama.com → Account Settings to generate one."
              : "Your key is stored locally in this browser. It is never sent to our servers."}
        </p>
        {providerMeta.requiresAuth && (
          <p className="mt-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs leading-relaxed text-muted">
            <strong className="font-semibold text-foreground/80">Privacy:</strong> your
            key lives only in this browser&apos;s local storage and is sent only to your
            chosen provider, directly from your browser, with each AI call. It never
            touches our servers or database, and nothing derived from it is logged. Remove
            it at any time with &ldquo;Remove key&rdquo; below.
          </p>
        )}
      </fieldset>

      {/* Base URL (conditional) */}
      {providerMeta.needsBaseUrl && (
        <fieldset>
          <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            Base URL
          </legend>
          <input
            type="url"
            aria-label="Base URL"
            value={form.baseUrl}
            onChange={(e) => updateField("baseUrl", e.target.value)}
            placeholder={
              form.providerId === "ollama"
                ? "http://localhost:11434"
                : "https://your-endpoint.example.com/v1"
            }
            className="w-full rounded-md border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder-muted transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
          />
        </fieldset>
      )}

      {/* Model Selection */}
      <fieldset>
        <legend className="mb-3 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Models
        </legend>
        {!isCustom && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {modelsStatus === "error"
                ? "Couldn't fetch models — showing the built-in list."
                : availableModels
                  ? "Live list from your provider."
                  : "Built-in list — refresh to fetch the latest."}
            </p>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={modelsStatus === "loading" || !canTest}
              className="shrink-0 rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-1.5 text-xs font-medium text-amber transition-all duration-200 hover:border-amber/50 hover:bg-amber/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {modelsStatus === "loading" ? "Refreshing..." : "Refresh list"}
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Routine Model */}
          <div>
            <label htmlFor="routine-model" className="mb-1.5 block text-xs text-muted">
              Routine <span className="text-muted">— narration, choices, evaluation</span>
            </label>
            {isCustom ? (
              <input
                id="routine-model"
                type="text"
                value={form.customRoutineModel}
                onChange={(e) => updateField("customRoutineModel", e.target.value)}
                placeholder="e.g. gpt-4o-mini"
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-muted transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              />
            ) : (
              <select
                id="routine-model"
                value={form.routineModel}
                onChange={(e) => updateField("routineModel", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              >
                {displayModels.length === 0 && <option value="">No models found</option>}
                {withSelected(displayModels, form.routineModel).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Premium Model */}
          <div>
            <label htmlFor="premium-model" className="mb-1.5 block text-xs text-muted">
              Premium <span className="text-muted">— advancement, combat</span>
            </label>
            {isCustom ? (
              <input
                id="premium-model"
                type="text"
                value={form.customPremiumModel}
                onChange={(e) => updateField("customPremiumModel", e.target.value)}
                placeholder="e.g. gpt-4o"
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-muted transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              />
            ) : (
              <select
                id="premium-model"
                value={form.premiumModel}
                onChange={(e) => updateField("premiumModel", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
              >
                {displayModels.length === 0 && <option value="">No models found</option>}
                {withSelected(displayModels, form.premiumModel).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
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
            disabled={connectionStatus === "testing" || !canTest}
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

          {providerMeta.requiresAuth && form.apiKey && (
            <button
              type="button"
              onClick={handleRemoveKey}
              className="rounded-md border border-crimson/30 px-4 py-2 text-sm font-medium text-sanity-low transition-all duration-200 hover:border-crimson/50 hover:bg-crimson/[0.06]"
            >
              Remove key
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div role="status" className="flex items-center gap-4 text-xs">
          {connectionStatus === "valid" && (
            <span className="flex items-center gap-1.5 text-sanity-high">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-sanity-high shadow-[0_0_6px_var(--color-sanity-high)]"
                aria-hidden="true"
              />
              {form.providerId === "ollama-cloud" ? "Key accepted" : "Connected"}
            </span>
          )}
          {connectionStatus === "invalid" && (
            <span className="flex items-center gap-1.5 text-sanity-low">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-sanity-low shadow-[0_0_6px_var(--color-sanity-low)]"
                aria-hidden="true"
              />
              Failed
            </span>
          )}
          {connectionStatus === "testing" && (
            <span className="flex items-center gap-1.5 text-gaslight">
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gaslight"
                aria-hidden="true"
              />
              Testing...
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-muted italic">Unsaved changes</span>
          )}
          {saveStatus === "saved" && connectionStatus === "idle" && (
            <span className="text-muted">Configuration saved</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {connectionStatus === "invalid" && connectionError && (
        <div
          role="alert"
          className="rounded-md border border-crimson/30 bg-crimson/[0.06] px-4 py-3 text-sm text-sanity-low"
        >
          {connectionError}
        </div>
      )}
    </div>
  );
}
