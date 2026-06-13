"use client";

import { useCallback, useState } from "react";

import {
  loadAllSessions,
  loadSessionIndex,
  saveSessionIndex,
  persistSession as writeSession,
  useStoredValue,
} from "@/lib/react/session-store";
import { getPathway, getSequence } from "@/lib/rules";
import { classifySanityTier } from "@/lib/ai";
import { getEpoch } from "@/lib/lore";
import { createClient } from "@/lib/supabase/client";
import {
  activeIdentity,
  characterDeletionPlan,
  createIdentity,
  createIdentityState,
  deleteSessionEntriesRemote,
  discardIdentity,
  identityCapability,
  switchIdentity,
  trueGodName,
  type GameSession,
  type IdentityCapability,
  type IdentityState,
  type JournalSyncClient,
  type SocialClass,
} from "@/lib/game";
import type { Item } from "@/lib/types/rules";

// Character sheet panel (issue #13): identity, abilities & acting
// requirements, condition, and the inventory. Sanity is shown as an in-world
// descriptor — never a number — preserving the hidden-meter design.

const SANITY_DESCRIPTORS: Record<ReturnType<typeof classifySanityTier>, string> = {
  high: "Steady — the world holds its shape.",
  medium: "Frayed — small wrongnesses at the edge of sight.",
  low: "Slipping — the fog has started whispering.",
  critical: "Unraveling — very little of the world can be trusted.",
};

const ITEM_CATEGORY_LABELS: Record<Item["category"], string> = {
  "main-ingredient": "Main Ingredients",
  "supplementary-ingredient": "Supplementary Ingredients",
  "potion-formula": "Potion Formulas",
};

const ITEM_CATEGORY_GLYPHS: Record<Item["category"], string> = {
  "main-ingredient": "◉",
  "supplementary-ingredient": "❖",
  "potion-formula": "✦",
};

export function CharacterSheet() {
  const sessions = useStoredValue<GameSession[] | null>(loadAllSessions, null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, GameSession>>({});
  // Locally-removed characters: the underlying store read is one-shot, so we
  // track deletions here to keep the sheet in sync without a full re-read.
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const persistSession = useCallback((next: GameSession) => {
    setOverrides((prev) => ({ ...prev, [next.id]: next }));
    writeSession(next);
  }, []);

  // Permanently delete a character and every scrap of its data — the local
  // save, journal, in-progress combat, and usage estimate — plus a best-effort
  // wipe of the durable Supabase journal rows. Cross-timeline legacies/echoes
  // are world memory and are intentionally left intact (mirrors the dashboard's
  // Manage view).
  const handleDelete = useCallback((sessionId: string) => {
    const plan = characterDeletionPlan(sessionId, loadSessionIndex());
    try {
      for (const key of plan.removeKeys) localStorage.removeItem(key);
      saveSessionIndex(plan.nextIndex);
    } catch {
      // Storage unavailable — the in-memory list still updates below.
    }
    void (async () => {
      try {
        const client = createClient() as unknown as JournalSyncClient;
        await deleteSessionEntriesRemote(client, sessionId);
      } catch {
        // Network/permission failure — non-fatal, the local save is gone.
      }
    })();
    setSelectedId(null);
    setDeletedIds((prev) => [...prev, sessionId]);
  }, []);

  if (sessions === null) {
    return <p className="text-sm text-muted">Consulting the records…</p>;
  }

  const livingSessions = sessions.filter((s) => !deletedIds.includes(s.id));

  if (livingSessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/70">
          &ldquo;The pathways await your choice&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          No Beyonder has been recorded yet. Begin a game to inscribe your first character
          into the chronicle.
        </p>
      </div>
    );
  }

  const baseSession =
    livingSessions.find((s) => s.id === selectedId) ?? livingSessions[0];
  const session = overrides[baseSession.id] ?? baseSession;
  const state = session.gameState;
  const pathway = getPathway(state.pathwayId);
  const sequence = getSequence(state.pathwayId, state.sequenceLevel);
  const epoch = getEpoch(state.epoch);
  const tier = classifySanityTier(state.sanity, state.maxSanity);

  const inventoryByCategory = (
    Object.keys(ITEM_CATEGORY_LABELS) as Item["category"][]
  ).map((category) => ({
    category,
    items: state.inventory.filter((item) => item.category === category),
  }));

  return (
    <div className="space-y-8">
      {livingSessions.length > 1 && (
        <div>
          <label htmlFor="sheet-session" className="mb-1.5 block text-xs text-muted">
            Beyonder
          </label>
          <select
            id="sheet-session"
            value={session.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20 sm:w-auto"
          >
            {livingSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gameState.characterName ?? "Unnamed Beyonder"} — Turn {s.turnCount}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Identity */}
      <section
        aria-labelledby="sheet-identity"
        className="parchment rounded-lg p-6 md:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2
              id="sheet-identity"
              className="font-serif text-2xl font-bold text-foreground"
            >
              {state.characterName ?? "Unnamed Beyonder"}
              {session.ended && (
                <span className="ml-3 align-middle text-xs font-normal tracking-[0.2em] text-sanity-low uppercase">
                  {session.ended.fate === "dead" ? "Deceased" : "Transformed"}
                </span>
              )}
            </h2>
            <p className="mt-1 font-serif text-sm italic text-muted">
              Sequence {state.sequenceLevel}{" "}
              {state.sequenceLevel === 0
                ? `${trueGodName(state.pathwayId)} — True God`
                : (sequence?.name ?? "Beyonder")}{" "}
              · {pathway?.name ?? "Unknown"} Pathway
            </p>
            <p className="mt-2">
              <span className="inline-flex items-center rounded-sm border border-amber/40 bg-amber/10 px-2 py-0.5 text-[11px] font-medium tracking-[0.1em] text-amber uppercase">
                {epoch.name} · {epoch.era}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted">
            {state.location} · Turn {session.turnCount}
          </p>
        </div>
        {state.characterBackground && (
          <p className="mt-4 max-w-2xl font-serif text-sm leading-relaxed text-foreground/80">
            {state.characterBackground}
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Abilities & acting */}
        <section
          aria-labelledby="sheet-abilities"
          className="rounded-lg border border-border/70 bg-surface/60 p-6"
        >
          <h2
            id="sheet-abilities"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Abilities
          </h2>
          <ul className="mt-4 space-y-3">
            {(sequence?.abilities ?? []).map((ability) => (
              <li key={ability.name} className="text-sm">
                <span className="font-medium text-foreground">{ability.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {ability.description}
                </span>
              </li>
            ))}
            {(sequence?.abilities ?? []).length === 0 && (
              <li className="text-sm text-muted">None recorded.</li>
            )}
          </ul>
          <h3 className="mt-6 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            Acting Method
          </h3>
          <ul className="mt-2 list-inside space-y-1.5">
            {(sequence?.actingRequirements ?? []).map((req) => (
              <li key={req} className="text-sm leading-relaxed text-foreground/80">
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Condition */}
        <section
          aria-labelledby="sheet-condition"
          className="rounded-lg border border-border/70 bg-surface/60 p-6"
        >
          <h2
            id="sheet-condition"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Condition
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Mind</dt>
              <dd className="mt-0.5 font-serif italic text-foreground/85">
                {SANITY_DESCRIPTORS[tier]}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                Potion digestion
              </dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.digestion
                  ? state.digestion.complete
                    ? "Fully digested — ready to advance."
                    : `${state.digestion.progress}% assimilated through acting.`
                  : "No potion taken."}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Injuries</dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.injuries && state.injuries.length > 0 ? (
                  <ul className="space-y-1">
                    {state.injuries.map((injury) => (
                      <li key={injury.id}>
                        {injury.description}{" "}
                        <span className="text-xs text-muted">({injury.severity})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Unhurt."
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                Active quests
              </dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.activeQuests.length > 0 ? state.activeQuests.join("; ") : "None."}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Identities (issue #22) */}
      <IdentitySection session={session} onUpdate={persistSession} />

      {/* Inventory */}
      <section aria-labelledby="sheet-inventory">
        <h2
          id="sheet-inventory"
          className="gaslit font-serif text-lg font-semibold text-amber/90"
        >
          Inventory
        </h2>
        {state.inventory.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Empty pockets — the city has not yielded its secrets yet.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {inventoryByCategory
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.category}>
                  <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {ITEM_CATEGORY_LABELS[group.category]}
                  </h3>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="parchment rounded-md p-4"
                      >
                        <p className="text-sm font-medium text-foreground">
                          <span aria-hidden="true" className="mr-2 text-amber/80">
                            {ITEM_CATEGORY_GLYPHS[group.category]}
                          </span>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {item.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Delete character — two-step confirm so it is never a single misclick.
          Keyed by session id so switching Beyonders resets any pending state. */}
      <DeleteCharacter
        key={session.id}
        name={state.characterName ?? "Unnamed Beyonder"}
        onDelete={() => handleDelete(session.id)}
      />
    </div>
  );
}

function DeleteCharacter({ name, onDelete }: { name: string; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section
      aria-labelledby="sheet-danger"
      className="rounded-lg border border-crimson/30 bg-crimson/[0.04] p-6"
    >
      <h2 id="sheet-danger" className="font-serif text-lg font-semibold text-sanity-low">
        Delete Character
      </h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
        Permanently erase <span className="text-foreground/85">{name}</span> — the save,
        journal, in-progress combat, and usage record all vanish. This cannot be undone.
      </p>
      {confirming ? (
        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label={`Confirm deletion of ${name}`}
        >
          <span className="text-sm text-sanity-low" role="status">
            Delete permanently?
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[32px] rounded border border-crimson/50 bg-crimson/10 px-3 py-1.5 text-xs font-medium text-sanity-low transition-colors hover:bg-crimson/20"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-[32px] rounded border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 min-h-[32px] rounded border border-crimson/40 px-3 py-1.5 text-xs font-medium text-sanity-low transition-colors hover:border-crimson/60 hover:bg-crimson/10"
          aria-label={`Delete ${name}`}
        >
          Delete this character
        </button>
      )}
    </section>
  );
}

const SOCIAL_CLASSES: SocialClass[] = ["lower", "middle", "upper", "noble"];

function IdentitySection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const capability: IdentityCapability = identityCapability(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  );
  const identityState: IdentityState = session.identityState ?? createIdentityState();
  const active = activeIdentity(identityState);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [socialClass, setSocialClass] = useState<SocialClass>("middle");
  const [backstory, setBackstory] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Event-handler only (never during render) — useCallback marks it as such
  // for the purity lint.
  const apply = useCallback(
    (next: IdentityState) => {
      onUpdate({ ...session, identityState: next, updatedAt: Date.now() });
    },
    [session, onUpdate],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      apply(
        createIdentity(
          identityState,
          { name, appearance, socialClass, backstory },
          capability,
        ),
      );
      setShowForm(false);
      setName("");
      setAppearance("");
      setBackstory("");
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "That face will not hold.");
    }
  };

  return (
    <section aria-labelledby="sheet-identities">
      <h2
        id="sheet-identities"
        className="gaslit font-serif text-lg font-semibold text-amber/90"
      >
        Identities
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {capability === "full"
          ? "Your abilities let you live as other people entirely — separate names, reputations, and lives. NPCs treat each face as its own person until something connects them."
          : "Without the right abilities you can manage one surface-level disguise at a time. It frays quickly, and sharp eyes may see through it."}
      </p>

      {active && (
        <p className="mt-3 text-sm text-foreground/85">
          Currently presenting as{" "}
          <span className="font-medium text-amber">{active.name}</span>.
        </p>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {identityState.identities.map((identity) => {
          const isActive = identity.id === identityState.activeIdentityId;
          return (
            <li key={identity.id} className="parchment rounded-md p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {identity.name}
                  {identity.activeDisguise && (
                    <span className="ml-2 text-[10px] tracking-[0.15em] text-muted uppercase">
                      disguise
                    </span>
                  )}
                </p>
                <span className="text-xs text-muted">{identity.socialClass} class</span>
              </div>
              {identity.appearance && (
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {identity.appearance}
                </p>
              )}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span id={`risk-${identity.id}`}>Exposure risk</span>
                  <span>{identity.exposureRisk}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-labelledby={`risk-${identity.id}`}
                  aria-valuenow={identity.exposureRisk}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/60"
                >
                  <div
                    className={`h-full ${identity.exposureRisk >= 60 ? "bg-sanity-low" : identity.exposureRisk >= 30 ? "bg-sanity-mid" : "bg-sanity-high"}`}
                    style={{ width: `${identity.exposureRisk}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Known by {identity.knownBy.length}{" "}
                {identity.knownBy.length === 1 ? "person" : "people"}
                {identity.exposedTo.length > 0 &&
                  ` · exposed to ${identity.exposedTo.join(", ")}`}
              </p>
              {Object.keys(identity.reputation).length > 0 && (
                <p className="mt-1 text-[11px] text-muted">
                  Standing:{" "}
                  {Object.entries(identity.reputation)
                    .map(([who, value]) => `${who} ${value > 0 ? "+" : ""}${value}`)
                    .join(" · ")}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    apply(switchIdentity(identityState, isActive ? null : identity.id))
                  }
                  className="min-h-[24px] rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-1.5 text-xs font-medium text-amber hover:border-amber/50"
                >
                  {isActive ? "Return to your own face" : "Wear this face"}
                </button>
                <button
                  type="button"
                  onClick={() => apply(discardIdentity(identityState, identity.id))}
                  className="min-h-[24px] rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-crimson/40 hover:text-sanity-low"
                >
                  Discard
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {showForm ? (
        <form onSubmit={handleCreate} className="mt-4 max-w-md space-y-3">
          <div>
            <label htmlFor="identity-name" className="mb-1 block text-xs text-muted">
              Name
            </label>
            <input
              id="identity-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="identity-appearance"
              className="mb-1 block text-xs text-muted"
            >
              Appearance
            </label>
            <input
              id="identity-appearance"
              type="text"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="identity-class" className="mb-1 block text-xs text-muted">
              Social class
            </label>
            <select
              id="identity-class"
              value={socialClass}
              onChange={(e) => setSocialClass(e.target.value as SocialClass)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            >
              {SOCIAL_CLASSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="identity-backstory" className="mb-1 block text-xs text-muted">
              Backstory (optional)
            </label>
            <textarea
              id="identity-backstory"
              rows={2}
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
            />
          </div>
          {formError && (
            <p role="alert" className="text-xs text-sanity-low">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-amber/90 px-4 py-2 text-sm font-medium text-background hover:bg-amber"
            >
              Craft the identity
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm font-medium text-amber hover:border-amber/50"
        >
          {capability === "full" ? "Craft a new identity" : "Prepare a disguise"}
        </button>
      )}
    </section>
  );
}
