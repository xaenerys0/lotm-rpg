"use client";

import { useCallback, useState, type ReactNode } from "react";

import {
  persistSession as writeSession,
  saveActiveSessionId,
  useActiveSession,
  useHydrated,
  useSessionSummaries,
} from "@/lib/react/session-store";
import { useStoredPreferences } from "./use-stored-preferences";
import { getCumulativeAbilityGroups, getPathway, getSequence } from "@/lib/rules";
import { getEpoch } from "@/lib/lore";
import { TabBar, tabButtonId, tabPanelId, type TabDef } from "./tabs";
import { CodexSection } from "./codex-section";
import {
  isUndeletableCharacter,
  CODEX_KINDS,
  codexCounts,
  resolveCodexState,
  acquirePower,
  powerAcquisitionCapabilities,
  releasePower,
  updateAcquiredPower,
  activeIdentity,
  addProfileNote,
  anchorsRelevant,
  applyProfileChange,
  canConsecrateCongregation,
  consecrateAnchor,
  createIdentity,
  createIdentityState,
  discardIdentity,
  effectiveSupport,
  emptyAnchorState,
  identityCapability,
  isDrasticChange,
  isFateProof,
  joinRoster,
  leaveRoster,
  locationLabel,
  loseAnchor,
  removeProfileNote,
  repairAnchor,
  requiredSupport,
  resolveLocation,
  resolveActingMethodState,
  resolveProfileState,
  resolveTrackedNpcState,
  shakeOff,
  sanityDescriptor,
  sequenceClassificationFor,
  sequenceLabel,
  switchIdentity,
  targetSequence,
  transformationRiteFor,
  ANCHOR_INTEGRITY_MAX,
  DEMIGOD_TRAITS,
  type AcquiredPower,
  type AcquisitionCapability,
  type AnchorKind,
  type AnchorState,
  type DemeanorTrait,
  type GameSession,
  type IdentityCapability,
  type IdentityState,
  type ProfileState,
  type SocialClass,
  type TrueSelfProfile,
} from "@/lib/game";
import type { Item } from "@/lib/types/rules";
import { purgeCharacter } from "./character-actions";

// Character sheet panel (issue #13): identity, abilities & acting
// requirements, condition, and the inventory. Sanity is shown as an in-world
// descriptor — never a number — preserving the hidden-meter design, via the
// canonical `sanityDescriptor` from `@/lib/game`.

const ITEM_CATEGORY_LABELS: Record<Item["category"], string> = {
  "main-ingredient": "Main Ingredients",
  "supplementary-ingredient": "Supplementary Ingredients",
  "potion-formula": "Potion Formulas",
  uniqueness: "Uniqueness",
  "sealed-artifact": "Sealed Artifacts",
  mundane: "Belongings",
};

const ITEM_CATEGORY_GLYPHS: Record<Item["category"], string> = {
  "main-ingredient": "◉",
  "supplementary-ingredient": "❖",
  "potion-formula": "✦",
  uniqueness: "❂",
  "sealed-artifact": "⛓",
  mundane: "❀",
};

// Tab identity base — the TabBar generates `${SHEET_TAB_BASE}-${id}-tab/-panel`
// ids that each TabPanel below mirrors (history-context sheet UI).
const SHEET_TAB_BASE = "sheet-tab";

/** One tab's panel — all panels stay mounted (form state survives a tab switch);
 * the inactive ones are `hidden` (the textbook ARIA tabs pattern). */
function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(SHEET_TAB_BASE, id)}
      aria-labelledby={tabButtonId(SHEET_TAB_BASE, id)}
      hidden={active !== id}
      tabIndex={0}
      className="space-y-8 pt-6 focus:outline-none"
    >
      {children}
    </div>
  );
}

export function CharacterSheet() {
  // The shared active character drives the sheet (active-character sync): the
  // selector below writes the same pointer the Map/Journal/sidebar read, and an
  // edit persists + re-reads reactively (no local override).
  const hydrated = useHydrated();
  const summaries = useSessionSummaries();
  const session = useActiveSession();

  // Display preferences (issue #95): the digestion-meter toggle gates whether
  // the numeric digestion is shown — but only once the method is discovered.
  const preferences = useStoredPreferences();

  // Active sheet tab (history-context sheet UI). Declared before the early
  // returns to honour the rules of hooks.
  const [activeTab, setActiveTab] = useState("overview");

  const persistSession = useCallback((next: GameSession) => {
    writeSession(next);
  }, []);

  // Permanently delete a character (shared cleanup in `purgeCharacter`); the
  // active pointer self-heals to the newest remaining save and the reactive
  // hooks re-render — no local list bookkeeping needed.
  const handleDelete = useCallback((sessionId: string) => {
    purgeCharacter(sessionId);
  }, []);

  if (!hydrated) {
    return <p className="text-sm text-muted">Consulting the records…</p>;
  }

  if (summaries.length === 0 || !session) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-serif text-lg italic text-foreground">
          &ldquo;The pathways await your choice&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          No Beyonder has been recorded yet. Begin a game to inscribe your first character
          into the chronicle.
        </p>
      </div>
    );
  }

  const state = session.gameState;
  const pathway = getPathway(state.pathwayId);
  const sequence = getSequence(state.pathwayId, state.sequenceLevel);
  // Abilities are cumulative — every rung climbed (Sequence 9 down to the
  // current one) is retained, with earlier powers enhanced by advancement.
  const abilityGroups = getCumulativeAbilityGroups(state.pathwayId, state.sequenceLevel);
  const epoch = getEpoch(state.epoch);
  // Acting-method discovery (issue #95): pre-discovery the digestion mechanic is
  // not leaked numerically (or by name); the numeric value is gated the same way
  // as the status-bar meter (discovered AND the meter opted on).
  const knowsMethod = resolveActingMethodState(session.actingMethodState).knowsMethod;
  const showDigestionNumber = knowsMethod && preferences.digestionMeterVisible;

  const inventoryByCategory = (
    Object.keys(ITEM_CATEGORY_LABELS) as Item["category"][]
  ).map((category) => ({
    category,
    items: state.inventory.filter((item) => item.category === category),
  }));

  // Tabbed sheet (history-context sheet UI): a long game piles ~11 sections into
  // one tall scroll, so they are grouped under tabs. Sections stay where they
  // were authored; the panels just gate their visibility.
  const codex = resolveCodexState(session.codexState);
  const codexCount = codexCounts(codex);
  const codexTotal = CODEX_KINDS.reduce((sum, k) => sum + codexCount[k], 0);
  const tabs: TabDef[] = [
    { id: "overview", label: "Overview" },
    { id: "self", label: "Self & Allies" },
    { id: "powers", label: "Powers" },
    { id: "holdings", label: "Holdings" },
    { id: "codex", label: "Codex", badge: codexTotal },
  ];

  return (
    <div className="space-y-8">
      {summaries.length > 1 && (
        <div>
          <label
            htmlFor="sheet-session"
            className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Active Beyonder
          </label>
          <select
            id="sheet-session"
            value={session.id}
            onChange={(e) => saveActiveSessionId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 sm:w-auto"
          >
            {summaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.characterName ?? "Unnamed Beyonder"} — Turn {s.turnCount}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Identity */}
      <section
        aria-labelledby="sheet-identity"
        className="parchment rounded-xl p-6 md:p-8"
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
              {/* Apex tiers (Seq 0 True God, Pillar) read as their honorific +
                  tier; ordinary rungs keep the "Sequence N — Role" form (#99 D). */}
              {state.sequenceLevel <= 0
                ? `${sequenceLabel(state.pathwayId, state.sequenceLevel)} — ${sequenceClassificationFor(state.sequenceLevel)}`
                : `Sequence ${state.sequenceLevel} ${sequenceLabel(state.pathwayId, state.sequenceLevel)}`}{" "}
              · {pathway?.name ?? "Unknown"} Pathway
            </p>
            <p className="mt-2">
              <span className="inline-flex items-center rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-medium tracking-[0.1em] text-amber uppercase">
                {epoch.name} · {epoch.era}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted">
            {locationLabel(resolveLocation(state, state.epoch))} · Turn{" "}
            {session.turnCount}
          </p>
        </div>
        {state.characterBackground && (
          <p className="mt-4 max-w-2xl font-serif text-sm leading-relaxed text-foreground">
            {state.characterBackground}
          </p>
        )}
      </section>

      <TabBar
        tabs={tabs}
        activeId={activeTab}
        onSelect={setActiveTab}
        idBase={SHEET_TAB_BASE}
        label="Character sheet sections"
      />

      {/* Overview — abilities & current condition */}
      <TabPanel id="overview" active={activeTab}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Abilities & acting */}
          <section
            aria-labelledby="sheet-abilities"
            className="rounded-xl border border-border bg-surface p-6"
          >
            <h2
              id="sheet-abilities"
              className="font-serif text-lg font-semibold text-foreground"
            >
              Abilities
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Every power from the rungs you have climbed is yours — those drawn from
              earlier Sequences are enhanced as you advance.
            </p>
            {abilityGroups.length === 0 ? (
              <p className="mt-4 text-sm text-muted">None recorded.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {abilityGroups.map((group) => (
                  <div key={group.level}>
                    <h3 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                      <span>
                        Sequence {group.level} · {group.name}
                      </span>
                      {group.enhanced && (
                        <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] text-amber normal-case">
                          Enhanced
                        </span>
                      )}
                    </h3>
                    <ul className="mt-2 space-y-3">
                      {group.abilities.map((ability) => (
                        <li key={ability.name} className="text-sm">
                          <span className="font-medium text-foreground">
                            {ability.name}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {ability.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {/* Pre-discovery (issue #95) the secret that living the role digests
              the potion is hidden: the role guidance still shows, but under a
              neutral heading that names neither the mechanic nor digestion. The
              heading flips to "Acting Method" once the character discovers it. */}
            <h3 className="mt-6 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              {knowsMethod ? "Acting Method" : "Your Role"}
            </h3>
            <ul className="mt-2 list-inside space-y-1.5">
              {(sequence?.actingRequirements ?? []).map((req) => (
                <li key={req} className="text-sm leading-relaxed text-foreground">
                  {req}
                </li>
              ))}
            </ul>
          </section>

          {/* Condition */}
          <section
            aria-labelledby="sheet-condition"
            className="rounded-xl border border-border bg-surface p-6"
          >
            <h2
              id="sheet-condition"
              className="font-serif text-lg font-semibold text-foreground"
            >
              Condition
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                  Mind
                </dt>
                <dd className="mt-0.5 font-serif italic text-foreground">
                  {sanityDescriptor(state.sanity, state.maxSanity)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                  {knowsMethod ? "Potion digestion" : "Within"}
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {!state.digestion
                    ? "No potion taken."
                    : !knowsMethod
                      ? // Pre-discovery: the character does not know what is
                        // happening, so no number and no mechanic named. (Once a
                        // potion is fully digested the method is always discovered,
                        // so this branch only ever describes in-progress digestion.)
                        "Something taken in stirs and settles by turns you cannot yet name."
                      : state.digestion.complete
                        ? "Fully digested — ready to advance."
                        : showDigestionNumber
                          ? `${state.digestion.progress}% assimilated through acting.`
                          : "Assimilating through the acting method."}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                  Injuries
                </dt>
                <dd className="mt-0.5 text-foreground">
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
                <dt className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                  Active quests
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {state.activeQuests.length > 0
                    ? state.activeQuests.join("; ")
                    : "None."}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </TabPanel>

      {/* Self & Allies — true self, personas, companions */}
      <TabPanel id="self" active={activeTab}>
        {/* True self (character-info storage) */}
        <TrueSelfSection session={session} onUpdate={persistSession} />

        {/* Identities (issue #22) */}
        <IdentitySection session={session} onUpdate={persistSession} />

        {/* Companions & pursuers (issue #101) */}
        <CompanionsSection session={session} onUpdate={persistSession} />
      </TabPanel>

      {/* Powers — copied/stolen abilities and godhood anchors */}
      <TabPanel id="powers" active={activeTab}>
        {/* Acquired powers — copied/stolen Beyonder abilities */}
        <AcquiredPowersSection session={session} onUpdate={persistSession} />

        {/* Anchors — steady the godhood pressure of the rung you're climbing into
          (issues #35/#25). Shown only when the NEXT advancement leads into the
          Saint tier or deeper (target Seq ≤ 4, i.e. current Seq 1–5) — the
          requirement is gauged on the TARGET, so a Seq 5 about to become a Saint
          sees it (the bug was gating on the current sequence). */}
        {state.sequenceLevel >= 1 &&
          anchorsRelevant(targetSequence(state.sequenceLevel)) && (
            <AnchorsSection session={session} onUpdate={persistSession} />
          )}
      </TabPanel>

      {/* Holdings — inventory and the danger zone */}
      <TabPanel id="holdings" active={activeTab}>
        {/* Inventory */}
        <section
          aria-labelledby="sheet-inventory"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <h2
            id="sheet-inventory"
            className="font-serif text-lg font-semibold text-foreground"
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
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                      {ITEM_CATEGORY_LABELS[group.category]}
                    </h3>
                    <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((item, index) => (
                        <li
                          key={`${item.name}-${index}`}
                          className="parchment rounded-lg p-4"
                        >
                          <p className="text-sm font-medium text-foreground">
                            <span aria-hidden="true" className="mr-2 text-amber">
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
          Keyed by session id so switching Beyonders resets any pending state.
          The premade dev test character is protected from deletion. */}
        {!isUndeletableCharacter(session.id) && (
          <DeleteCharacter
            key={session.id}
            name={state.characterName ?? "Unnamed Beyonder"}
            onDelete={() => handleDelete(session.id)}
          />
        )}
      </TabPanel>

      {/* Codex — the durable registry of people, places, objects, groups, and
          open threads the chronicle has established (history-context Codex). */}
      <TabPanel id="codex" active={activeTab}>
        <CodexSection session={session} />
      </TabPanel>
    </div>
  );
}

function DeleteCharacter({ name, onDelete }: { name: string; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section
      aria-labelledby="sheet-danger"
      className="rounded-xl border border-crimson/30 bg-surface p-6"
    >
      <h2 id="sheet-danger" className="font-serif text-lg font-semibold text-sanity-low">
        Delete Character
      </h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
        Permanently erase <span className="text-foreground">{name}</span> — the save,
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
            className="min-h-[32px] rounded-lg border border-crimson/50 bg-crimson/10 px-3 py-1.5 text-xs font-medium text-sanity-low transition-colors hover:bg-crimson/20"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-[32px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 min-h-[32px] rounded-lg border border-crimson/40 px-3 py-1.5 text-xs font-medium text-sanity-low transition-colors hover:border-crimson/60 hover:bg-crimson/10"
          aria-label={`Delete ${name}`}
        >
          Delete this character
        </button>
      )}
    </section>
  );
}

const SOCIAL_CLASSES: SocialClass[] = ["lower", "middle", "upper", "noble"];

function CompanionsSection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const roster = resolveTrackedNpcState(session.trackedNpcState).roster;
  const rostered = new Set(roster.map((n) => n.name));
  // Present NPCs the player could bind: the current scene cast minus anyone
  // already on the roster. `npcsPresent` is the AI-maintained scene cast.
  const present = session.gameState.npcsPresent.filter((n) => !rostered.has(n));

  const apply = useCallback(
    (next: GameSession) => onUpdate({ ...next, updatedAt: Date.now() }),
    [onUpdate],
  );

  return (
    <section
      aria-labelledby="sheet-companions"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2
        id="sheet-companions"
        className="font-serif text-lg font-semibold text-foreground"
      >
        Companions &amp; pursuers
      </h2>
      <p className="mt-1 text-xs text-muted">
        Those who travel with you across the map — allies at your side, and pursuers on
        your trail. They follow when you set out for another city.
      </p>

      {roster.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No one travels with you yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {roster.map((npc) => {
            const role = npc.disposition === "hostile" ? "Pursuer" : "Companion";
            return (
              <li
                key={npc.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"
              >
                <span className="text-sm text-foreground">
                  {npc.name}{" "}
                  <span className="text-xs text-muted">
                    ({role}
                    {npc.follows ? ", travels with you" : ""})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    apply(
                      npc.disposition === "hostile"
                        ? shakeOff(session, npc.name)
                        : leaveRoster(session, npc.name),
                    )
                  }
                  className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                >
                  {npc.disposition === "hostile" ? "Shake off" : "Part ways"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {present.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
            Present in the scene
          </h3>
          <p className="mt-1 text-xs text-muted">
            Ask one of them to travel with you — they will follow when you set out for
            another city. (Pursuers appear on their own, from the story.)
          </p>
          <ul className="mt-2 space-y-2">
            {present.map((name) => (
              <li
                key={name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised p-4"
              >
                <span className="text-sm text-foreground">{name}</span>
                <button
                  type="button"
                  onClick={() =>
                    apply(
                      joinRoster(session, {
                        name,
                        disposition: "ally",
                        follows: true,
                      }),
                    )
                  }
                  className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/40 px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/10"
                  aria-label={`Have ${name} travel with you`}
                >
                  Travel with
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const PERMANENCE_LABEL: Record<AcquiredPower["permanence"], string> = {
  permanent: "Bound — kept for good",
  temporary: "Fading copy",
};

// Acquired powers — copying/stealing/borrowing another Beyonder's power. The
// add/update/remove surface for the `acquired-powers` engine subsystem: the
// "take a power" form appears only when the character has a means to do it
// (`powerAcquisitionCapabilities` — an Error Prometheus, a White Tower
// Imitation, or a carried Ring of Mimicry / Blood Vessel Thief), each recorded
// power can be edited (retuned / a copy's leash refreshed / a copy bound for
// good) or released, and the temporary ones count down each turn of play.
function AcquiredPowersSection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const powers = session.acquiredPowers ?? [];
  const capabilities = powerAcquisitionCapabilities(session);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "Take a power" form state.
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState<AcquisitionCapability["method"] | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceName, setSourceName] = useState("");

  const resetAddForm = useCallback(() => {
    setAdding(false);
    setMethod("");
    setName("");
    setDescription("");
    setSourceName("");
    setError(null);
  }, []);

  const handleAdd = useCallback(() => {
    const chosen = method || capabilities[0]?.method;
    if (!chosen) return;
    const result = acquirePower(session, {
      method: chosen,
      name,
      description,
      sourceName,
    });
    if (result.outcome === "missing-name") {
      setError("Give the power a name before recording it.");
      return;
    }
    if (result.outcome === "at-capacity") {
      setError("You are already holding as many powers as you can keep.");
      return;
    }
    if (result.outcome !== "acquired" || !result.session) {
      setError("You have no means to take that power right now.");
      return;
    }
    onUpdate({ ...result.session, updatedAt: Date.now() });
    resetAddForm();
  }, [
    session,
    method,
    capabilities,
    name,
    description,
    sourceName,
    onUpdate,
    resetAddForm,
  ]);

  return (
    <section
      aria-labelledby="sheet-acquired-powers"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2
        id="sheet-acquired-powers"
        className="font-serif text-lg font-semibold text-foreground"
      >
        Acquired powers
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Powers taken from others — stolen, copied, or borrowed. Bound powers are yours for
        good; fading copies wane with each passing turn until they slip away.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-crimson">
          {error}
        </p>
      )}

      {powers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">You have taken no one&rsquo;s power.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {powers.map((power) => (
            <li
              key={power.id}
              className="rounded-lg border border-border bg-surface-raised p-4"
            >
              {editingId === power.id ? (
                <AcquiredPowerEditor
                  power={power}
                  onCancel={() => setEditingId(null)}
                  onSave={(changes) => {
                    const result = updateAcquiredPower(session, power.id, changes);
                    if (result.outcome === "missing-name") {
                      setError("A power needs a name.");
                      return;
                    }
                    if (result.session) {
                      onUpdate({ ...result.session, updatedAt: Date.now() });
                    }
                    setEditingId(null);
                    setError(null);
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {power.name}{" "}
                      <span className="text-xs font-normal text-muted">
                        (
                        {power.permanence === "temporary"
                          ? `${Math.max(0, power.turnsRemaining ?? 0)} turn${
                              (power.turnsRemaining ?? 0) === 1 ? "" : "s"
                            } left`
                          : "bound"}
                        )
                      </span>
                    </p>
                    {power.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {power.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted">
                      {PERMANENCE_LABEL[power.permanence]}
                      {power.sourceName ? ` · from ${power.sourceName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(power.id);
                        setError(null);
                      }}
                      className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...releasePower(session, power.id),
                          updatedAt: Date.now(),
                        })
                      }
                      className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-crimson/50 hover:text-crimson"
                      aria-label={`Release ${power.name}`}
                    >
                      Release
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {capabilities.length === 0 ? (
        <p className="mt-5 text-xs text-muted">
          You have no means to take another&rsquo;s power yet — it awaits the right
          pathway rung or a relic that can steal or copy.
        </p>
      ) : adding ? (
        <div className="mt-5 space-y-3 rounded-lg border border-amber/30 bg-amber/5 p-4">
          <div>
            <label
              htmlFor="acquire-method"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              How you take it
            </label>
            <select
              id="acquire-method"
              value={method || capabilities[0].method}
              onChange={(e) =>
                setMethod(e.target.value as AcquisitionCapability["method"])
              }
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            >
              {capabilities.map((cap) => (
                <option key={cap.method} value={cap.method}>
                  {cap.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="acquire-name"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              The power
            </label>
            <input
              id="acquire-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. a Sleepless's nightmare touch"
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          <div>
            <label
              htmlFor="acquire-description"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              What it does (optional)
            </label>
            <textarea
              id="acquire-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          <div>
            <label
              htmlFor="acquire-source"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Taken from (optional)
            </label>
            <input
              id="acquire-source"
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-4 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/20"
            >
              Record the power
            </button>
            <button
              type="button"
              onClick={resetAddForm}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
          className="mt-5 inline-flex min-h-[24px] items-center rounded-lg border border-amber/40 px-4 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/10"
        >
          Take a power
        </button>
      )}
    </section>
  );
}

const ANCHOR_KIND_LABEL: Record<AnchorKind, string> = {
  object: "Significant object",
  place: "Consecrated place",
  congregation: "Congregation of believers",
};

// Anchors (issues #35/#25) — the tier-gated stabilising resource a Saint+ leans
// on to hold their self-image against the godhood pressure of the mythical-
// creature form. Surfaces the otherwise-unreachable engine acquisition path:
// without it, the Saint-tier anchors requirement in `advancementRequirements`
// could never be met and the climb past Sequence 5 stayed blocked. Canon: a
// Saint anchors on "personally meaningful marks" (object/place) and a small
// following, while the strongest anchor — a congregation of believers — needs an
// actual following, gated here on the character's society members + allies.
function AnchorsSection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  // Everything is gauged on the TARGET rung — the sequence being climbed into —
  // because that's what the advancement anchors requirement checks. (Gating on
  // the current sequence hid the section from a Seq 5 about to become a Saint and
  // sized the meter against `requiredSupport(5)` = 0.)
  const target = targetSequence(session.gameState.sequenceLevel);
  // `sequenceLabel` is the canonical display-name helper (handles a True God /
  // Pillar target, not just numbered rungs) — don't re-derive from `getSequence`.
  const targetRole = sequenceLabel(session.gameState.pathwayId, target);
  const anchorState: AnchorState = session.anchorState ?? emptyAnchorState();
  const anchors = anchorState.anchors;
  const support = effectiveSupport(anchorState);
  const needed = requiredSupport(target);
  const traits = DEMIGOD_TRAITS[target];

  // A congregation needs a real following: a secret society's members and/or
  // allies who travel with the character (the roster's allies).
  const allies = resolveTrackedNpcState(session.trackedNpcState).roster.filter(
    (n) => n.disposition === "ally",
  ).length;
  const societyMembers = session.societyState?.members.length ?? 0;
  const followingSize = allies + societyMembers;

  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<AnchorKind>("object");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Plain functions wired straight to events — the React Compiler memoizes the
  // component automatically. (Manual useCallback here trips the compiler's
  // manual-memoization preservation check.)
  function resetForm() {
    setAdding(false);
    setKind("object");
    setName("");
    setError(null);
  }

  function handleConsecrate() {
    const base = session.anchorState ?? emptyAnchorState();
    const trimmed = name.trim();
    // Pre-validate so the engine's `consecrateAnchor` never has to throw (it
    // guards blank/duplicate names too — this surfaces the same in-world copy).
    if (kind === "congregation" && !canConsecrateCongregation(followingSize)) {
      setError(
        "You have gathered no believers to anchor upon — found a society or draw allies to your side first.",
      );
      return;
    }
    if (trimmed === "") {
      setError("An anchor needs a name.");
      return;
    }
    if (base.anchors.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already one of your anchors.`);
      return;
    }
    onUpdate({
      ...session,
      anchorState: consecrateAnchor(base, { kind, name: trimmed }),
      updatedAt: Date.now(),
    });
    resetForm();
  }

  // Round for display: a `place` anchor (weight 0.75) at a non-multiple-of-4
  // integrity yields a fractional `effectiveSupport` that would otherwise read
  // as an ugly float.
  const shownSupport = Math.round(support);
  const supportLabel = `${shownSupport} of ${needed} support`;

  return (
    <section
      aria-labelledby="sheet-anchors"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2 id="sheet-anchors" className="font-serif text-lg font-semibold text-foreground">
        Anchors
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The marks and believers that hold your self in place against the pull of your
        mythical form. Their support must meet what the climb to {targetRole} demands
        before you can ascend — a Saint leans on meaningful objects and places; the
        strongest anchor of all is a congregation of believers.
      </p>

      {traits && (
        <dl className="mt-4 grid gap-3 rounded-lg border border-border bg-surface-raised p-4 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-semibold tracking-[0.18em] text-amber uppercase">Tier</dt>
            <dd className="mt-0.5 text-foreground">{traits.title}</dd>
          </div>
          <div>
            <dt className="font-semibold tracking-[0.18em] text-amber uppercase">
              Lifespan
            </dt>
            <dd className="mt-0.5 text-muted">{traits.lifespan}</dd>
          </div>
          <div>
            <dt className="font-semibold tracking-[0.18em] text-amber uppercase">
              Mythical form
            </dt>
            <dd className="mt-0.5 text-muted">{traits.mythicalForm}</dd>
          </div>
          <div>
            <dt className="font-semibold tracking-[0.18em] text-amber uppercase">
              Prayer response
            </dt>
            <dd className="mt-0.5 text-muted">{traits.prayerResponse}</dd>
          </div>
        </dl>
      )}

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
            Anchor support
          </h3>
          <span className="text-xs text-foreground">{supportLabel}</span>
        </div>
        <div
          role="progressbar"
          // Clamp to the requirement: support can exceed what's needed (an
          // object anchor is 50 vs the Saint's 40), but ARIA requires
          // valuenow <= valuemax; the true figure stays in aria-valuetext.
          aria-valuenow={Math.min(shownSupport, needed)}
          aria-valuemin={0}
          aria-valuemax={needed}
          aria-valuetext={supportLabel}
          aria-label="Anchor support"
          className="mt-1.5 h-2 overflow-hidden rounded-full border border-border bg-surface-raised"
        >
          <div
            aria-hidden="true"
            className={`h-full ${support >= needed ? "bg-amber" : "bg-occult"}`}
            style={{
              width: `${needed > 0 ? Math.min(100, (support / needed) * 100) : 100}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {support >= needed
            ? `Your anchors are enough to hold the shape of ${targetRole}.`
            : `Your anchors fall short of what the climb to ${targetRole} demands.`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-crimson">
          {error}
        </p>
      )}

      {anchors.length === 0 ? (
        <p className="mt-4 text-sm text-muted">You have consecrated no anchors yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {anchors.map((anchor) => {
            const integrityLabel = `${anchor.integrity} of ${ANCHOR_INTEGRITY_MAX} holding strength`;
            return (
              <li
                key={anchor.id}
                className="rounded-lg border border-border bg-surface-raised p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{anchor.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {ANCHOR_KIND_LABEL[anchor.kind]}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {anchor.integrity < ANCHOR_INTEGRITY_MAX && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({
                            ...session,
                            anchorState: repairAnchor(anchorState, anchor.id, 25),
                            updatedAt: Date.now(),
                          })
                        }
                        className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                        aria-label={`Strengthen ${anchor.name}`}
                      >
                        Strengthen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...session,
                          anchorState: loseAnchor(anchorState, anchor.id),
                          updatedAt: Date.now(),
                        })
                      }
                      className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-crimson/50 hover:text-crimson"
                      aria-label={`Release ${anchor.name}`}
                    >
                      Release
                    </button>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={anchor.integrity}
                  aria-valuemin={0}
                  aria-valuemax={ANCHOR_INTEGRITY_MAX}
                  aria-valuetext={integrityLabel}
                  aria-label={`${anchor.name} holding strength`}
                  className="mt-2 h-1.5 overflow-hidden rounded-full border border-border bg-surface"
                >
                  <div
                    aria-hidden="true"
                    className="h-full bg-amber"
                    style={{ width: `${anchor.integrity}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="mt-5 space-y-3 rounded-lg border border-amber/30 bg-amber/5 p-4">
          <div>
            <label
              htmlFor="anchor-kind"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              What you anchor on
            </label>
            <select
              id="anchor-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as AnchorKind)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            >
              <option value="object">{ANCHOR_KIND_LABEL.object}</option>
              <option value="place">{ANCHOR_KIND_LABEL.place}</option>
              <option value="congregation">{ANCHOR_KIND_LABEL.congregation}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="anchor-name"
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Its name
            </label>
            <input
              id="anchor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. your mother's pocket watch"
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          {kind === "congregation" && (
            <p className="text-[11px] text-muted">
              A congregation needs believers — your society&rsquo;s members and the allies
              at your side ({followingSize} so far).
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConsecrate}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-4 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/20"
            >
              Consecrate the anchor
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
          className="mt-5 inline-flex min-h-[24px] items-center rounded-lg border border-amber/40 px-4 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/10"
        >
          Consecrate an anchor
        </button>
      )}
    </section>
  );
}

// The inline editor for one acquired power: rename / re-describe / re-attribute,
// refresh a fading copy's remaining turns, or convert it between bound and
// fading. Local form state; commits via the parent's `updateAcquiredPower`.
function AcquiredPowerEditor({
  power,
  onSave,
  onCancel,
}: {
  power: AcquiredPower;
  onSave: (changes: {
    name: string;
    description: string;
    sourceName: string;
    permanence: AcquiredPower["permanence"];
    turnsRemaining?: number;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(power.name);
  const [description, setDescription] = useState(power.description);
  const [sourceName, setSourceName] = useState(power.sourceName ?? "");
  const [permanence, setPermanence] = useState<AcquiredPower["permanence"]>(
    power.permanence,
  );
  const [turns, setTurns] = useState(String(power.turnsRemaining ?? 1));

  const fieldId = (f: string) => `acquired-${power.id}-${f}`;

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor={fieldId("name")}
          className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
        >
          Name
        </label>
        <input
          id={fieldId("name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
        />
      </div>
      <div>
        <label
          htmlFor={fieldId("description")}
          className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
        >
          What it does
        </label>
        <textarea
          id={fieldId("description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
        />
      </div>
      <div>
        <label
          htmlFor={fieldId("source")}
          className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
        >
          Taken from
        </label>
        <input
          id={fieldId("source")}
          type="text"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label
            htmlFor={fieldId("permanence")}
            className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Hold
          </label>
          <select
            id={fieldId("permanence")}
            value={permanence}
            onChange={(e) => setPermanence(e.target.value as AcquiredPower["permanence"])}
            className="mt-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          >
            <option value="permanent">Bound — kept for good</option>
            <option value="temporary">Fading copy</option>
          </select>
        </div>
        {permanence === "temporary" && (
          <div>
            <label
              htmlFor={fieldId("turns")}
              className="block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Turns left
            </label>
            <input
              id={fieldId("turns")}
              type="number"
              min={1}
              value={turns}
              onChange={(e) => setTurns(e.target.value)}
              className="mt-1 w-24 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              name,
              description,
              sourceName,
              permanence,
              turnsRemaining:
                permanence === "temporary" ? Math.max(1, Number(turns) || 1) : undefined,
            })
          }
          className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-4 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/20"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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
          undefined,
          undefined,
          isFateProof(session.gameState.pathwayId, session.gameState.sequenceLevel),
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
    <section
      aria-labelledby="sheet-identities"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2
        id="sheet-identities"
        className="font-serif text-lg font-semibold text-foreground"
      >
        Identities
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {capability === "flawless"
          ? "Your transformation is flawless — each persona is a wholly separate, real person. No one sees a disguise, and nothing connects your faces to one another or to your true self."
          : capability === "full"
            ? "Your abilities let you live as other people entirely — separate names, reputations, and lives. NPCs treat each face as its own person until something connects them."
            : "Without the right abilities you can manage one surface-level disguise at a time. It frays quickly, and sharp eyes may see through it."}
      </p>

      {active && (
        <p className="mt-3 text-sm text-foreground">
          Currently presenting as{" "}
          <span className="font-medium text-amber">{active.name}</span>.
        </p>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {identityState.identities.map((identity) => {
          const isActive = identity.id === identityState.activeIdentityId;
          return (
            <li
              key={identity.id}
              className="rounded-lg border border-border bg-surface-raised p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {identity.name}
                  {identity.activeDisguise && (
                    <span className="ml-2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-muted uppercase">
                      disguise
                    </span>
                  )}
                  {identity.flawless && (
                    <span className="ml-2 rounded-md border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-amber uppercase">
                      {identity.fateProof ? "fate-proof" : "flawless"}
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
              {identity.flawless ? (
                <p className="mt-3 text-[11px] text-amber">
                  A real, separate person — no exposure risk.
                </p>
              ) : (
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
                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className={`h-full ${identity.exposureRisk >= 60 ? "bg-sanity-low" : identity.exposureRisk >= 30 ? "bg-sanity-mid" : "bg-sanity-high"}`}
                      style={{ width: `${identity.exposureRisk}%` }}
                    />
                  </div>
                </div>
              )}
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
                  className="min-h-[24px] rounded-lg border border-amber/30 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:border-amber/50"
                >
                  {isActive ? "Return to your own face" : "Wear this face"}
                </button>
                <button
                  type="button"
                  onClick={() => apply(discardIdentity(identityState, identity.id))}
                  className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-crimson/40 hover:text-sanity-low"
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
            <label
              htmlFor="identity-name"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Name
            </label>
            <input
              id="identity-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          <div>
            <label
              htmlFor="identity-appearance"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Appearance
            </label>
            <input
              id="identity-appearance"
              type="text"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>
          <div>
            <label
              htmlFor="identity-class"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Social class
            </label>
            <select
              id="identity-class"
              value={socialClass}
              onChange={(e) => setSocialClass(e.target.value as SocialClass)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
            >
              {SOCIAL_CLASSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="identity-backstory"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Backstory (optional)
            </label>
            <textarea
              id="identity-backstory"
              rows={2}
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
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
              className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
            >
              Craft the identity
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-lg border border-amber/30 bg-amber/10 px-4 py-2.5 text-sm font-semibold text-amber transition-colors hover:border-amber/50"
        >
          {capability === "basic" ? "Prepare a disguise" : "Craft a new identity"}
        </button>
      )}
    </section>
  );
}

interface SelfFormFields {
  name: string;
  gender: string;
  pronouns: string;
  appearance: string;
  epithet: string;
  age: string;
  marks: string;
  demeanor: DemeanorTrait[];
}

function fieldsFromProfile(
  profile: TrueSelfProfile,
  currentName: string,
): SelfFormFields {
  return {
    name: currentName,
    gender: profile.gender ?? "",
    pronouns: profile.pronouns ?? "",
    appearance: profile.appearance ?? "",
    epithet: profile.epithet ?? "",
    age: profile.age ?? "",
    marks: profile.marks ?? "",
    demeanor: profile.demeanor,
  };
}

function nextProfileFromFields(
  base: TrueSelfProfile,
  fields: SelfFormFields,
): TrueSelfProfile {
  return {
    ...base,
    gender: fields.gender.trim() || undefined,
    pronouns: fields.pronouns.trim() || undefined,
    appearance: fields.appearance.trim() || undefined,
    epithet: fields.epithet.trim() || undefined,
    age: fields.age.trim() || undefined,
    marks: fields.marks.trim() || undefined,
    demeanor: fields.demeanor,
  };
}

const SELF_TEXT_FIELDS: {
  key: keyof Omit<SelfFormFields, "demeanor">;
  label: string;
  multiline?: boolean;
}[] = [
  { key: "name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "pronouns", label: "Pronouns" },
  { key: "epithet", label: "Epithet / title" },
  { key: "age", label: "Age" },
  { key: "appearance", label: "Appearance", multiline: true },
  { key: "marks", label: "Distinguishing marks", multiline: true },
];

function TrueSelfSection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const profileState: ProfileState = resolveProfileState(session.profileState);
  const currentName = session.gameState.characterName ?? "";
  const flawlessCapable =
    identityCapability(session.gameState.pathwayId, session.gameState.sequenceLevel) ===
    "flawless";
  const rite = transformationRiteFor(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  );

  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState<SelfFormFields>(() =>
    fieldsFromProfile(profileState.profile, currentName),
  );
  const [newTrait, setNewTrait] = useState("");
  const [gapManual, setGapManual] = useState(false);
  const [gapChecked, setGapChecked] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const suggestedGap = isDrasticChange(
    profileState.profile,
    nextProfileFromFields(profileState.profile, fields),
    { flawlessCapable },
  );
  const effectiveGap = gapManual ? gapChecked : suggestedGap;

  const openForm = (seed?: Partial<SelfFormFields>) => {
    setFields({ ...fieldsFromProfile(profileState.profile, currentName), ...seed });
    setGapManual(false);
    setFormError(null);
    setNewTrait("");
    setShowForm(true);
  };

  const setField = (key: keyof Omit<SelfFormFields, "demeanor">, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const addTrait = () => {
    const label = newTrait.trim();
    if (label === "") return;
    setFields((prev) => ({
      ...prev,
      demeanor: [...prev.demeanor, { id: crypto.randomUUID(), label }],
    }));
    setNewTrait("");
  };

  const removeTrait = (id: string) =>
    setFields((prev) => ({
      ...prev,
      demeanor: prev.demeanor.filter((t) => t.id !== id),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trimmedName = fields.name.trim();
      const result = applyProfileChange(
        profileState,
        session.gameState,
        {
          ...(trimmedName && trimmedName !== currentName ? { name: trimmedName } : {}),
          edits: {
            gender: fields.gender,
            pronouns: fields.pronouns,
            appearance: fields.appearance,
            epithet: fields.epithet,
            age: fields.age,
            marks: fields.marks,
            demeanor: fields.demeanor,
          },
        },
        { createGap: effectiveGap, npcsPresent: session.gameState.npcsPresent },
      );
      onUpdate({
        ...session,
        gameState: result.gameState,
        profileState: result.profileState,
        updatedAt: Date.now(),
      });
      setShowForm(false);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "That change will not hold.");
    }
  };

  // Event-handler only (never during render) — useCallback marks it as such
  // for the purity lint, mirroring IdentitySection's `apply`.
  const persistProfile = useCallback(
    (next: ProfileState) =>
      onUpdate({ ...session, profileState: next, updatedAt: Date.now() }),
    [session, onUpdate],
  );

  const handleAddNote = () => {
    const text = newNote.trim();
    if (text === "") return;
    persistProfile(addProfileNote(profileState, text));
    setNewNote("");
  };

  return (
    <section
      aria-labelledby="sheet-trueself"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2
        id="sheet-trueself"
        className="font-serif text-lg font-semibold text-foreground"
      >
        True Self
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Who you truly are — the narrator honours these from your next turn. Renaming or
        transforming carries your reputation with you; only a drastic change leaves those
        who knew you unsure it is the same person.
      </p>

      {profileState.profile.formerNames.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Formerly {profileState.profile.formerNames.join(", ")}.
        </p>
      )}
      {profileState.recognition && (
        <p className="mt-2 text-xs text-amber" role="status">
          {profileState.recognition.pendingNpcs.length}{" "}
          {profileState.recognition.pendingNpcs.length === 1 ? "person" : "people"} who
          knew you have not yet recognised your new face.
        </p>
      )}

      {rite && !showForm && (
        <button
          type="button"
          onClick={() =>
            openForm({
              appearance: rite.appearanceSuggestion ?? fields.appearance,
              demeanor: [
                ...profileState.profile.demeanor,
                ...rite.demeanorSuggestions.map((t) => ({
                  id: crypto.randomUUID(),
                  label: t.label,
                })),
              ],
            })
          }
          className="mt-3 mr-2 rounded-lg border border-occult/40 bg-occult/10 px-4 py-2.5 text-sm font-semibold text-occult-bright transition-colors hover:border-occult/60"
        >
          Begin the rite of the {rite.riteName}
        </button>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-3">
          {SELF_TEXT_FIELDS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label
                htmlFor={`self-${key}`}
                className="mb-1 block text-xs font-medium text-muted"
              >
                {label}
              </label>
              {multiline ? (
                <textarea
                  id={`self-${key}`}
                  rows={2}
                  value={fields[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
              ) : (
                <input
                  id={`self-${key}`}
                  type="text"
                  value={fields[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
              )}
            </div>
          ))}

          <div>
            <label
              htmlFor="self-trait"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Demeanor / allure traits
            </label>
            {fields.demeanor.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-2">
                {fields.demeanor.map((trait) => (
                  <li key={trait.id}>
                    <button
                      type="button"
                      onClick={() => removeTrait(trait.id)}
                      className="inline-flex min-h-[24px] items-center gap-1 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs font-medium text-amber transition-colors hover:border-crimson/50 hover:text-sanity-low"
                      aria-label={`Remove trait ${trait.label}`}
                    >
                      {trait.label}
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                id="self-trait"
                type="text"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
              <button
                type="button"
                onClick={addTrait}
                className="rounded-lg border border-amber/30 px-3 py-1.5 text-sm font-medium text-amber transition-colors hover:border-amber/50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="self-gap"
              type="checkbox"
              checked={effectiveGap}
              onChange={(e) => {
                setGapManual(true);
                setGapChecked(e.target.checked);
              }}
              className="mt-1 h-4 w-4"
            />
            <label htmlFor="self-gap" className="text-xs leading-relaxed text-muted">
              People who knew me won&rsquo;t recognise this face (they must re-recognise
              me or deduce it).
            </label>
          </div>

          {formError && (
            <p role="alert" className="text-xs text-sanity-low">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold"
            >
              Become who you are
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => openForm()}
          className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-2.5 text-sm font-semibold text-amber transition-colors hover:border-amber/50"
        >
          Edit true self
        </button>
      )}

      {/* Personal log — player-authored, never fed to the narrator. */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          Personal log
        </h3>
        {profileState.profile.notes.length > 0 && (
          <ul className="mt-2 space-y-2">
            {profileState.profile.notes.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface-raised p-4"
              >
                <span className="text-sm text-foreground">{note.text}</span>
                <button
                  type="button"
                  onClick={() => persistProfile(removeProfileNote(profileState, note.id))}
                  className="min-h-[24px] shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-crimson/40 hover:text-sanity-low"
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <label htmlFor="self-note" className="sr-only">
            Add a note
          </label>
          <input
            id="self-note"
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Record an oath, an event, a memory…"
            className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="rounded-lg border border-amber/30 px-3 py-1.5 text-sm font-medium text-amber transition-colors hover:border-amber/50"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
