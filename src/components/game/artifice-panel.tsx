"use client";

import { useCallback, useMemo, useState } from "react";

import {
  type CraftMode,
  craftArtifact,
  craftCapability,
  craftFee,
  getFunds,
  gradeForCharacteristicSequence,
  parseCharacteristicItem,
} from "@/lib/game";
import type { GameSession } from "@/lib/game";

const OUTCOME_MESSAGES: Record<string, string> = {
  "no-capability":
    "Only a Paragon artisan can forge this themselves — commission one instead.",
  "missing-characteristic": "Choose a Beyonder Characteristic to fuse.",
  "god-tier-forbidden": "A god's characteristic cannot be bound into an artifact.",
  "invalid-name": "Give the artifact a name before forging it.",
  unaffordable: "You cannot afford this craft.",
  "at-capacity": "You are keeping as many crafted artifacts as you can.",
};

/**
 * Artifice — the player-facing crafting surface (Sealed Artifacts subsystem).
 * Fuse a carried Beyonder Characteristic into a Sealed Artifact: a Paragon
 * artisan (Seq ≤ 6) forges it themselves, anyone else commissions one for a
 * higher fee. Pure logic lives in `@/lib/game/artifice`; this is the shell.
 */
export function ArtificePanel({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const capability = craftCapability(session);
  // The carried Characteristics that can actually be fused (not creature mats).
  const characteristics = useMemo(
    () =>
      session.gameState.inventory.filter(
        (item) => parseCharacteristicItem(item) !== undefined,
      ),
    [session.gameState.inventory],
  );

  const [characteristicName, setCharacteristicName] = useState("");
  const [mode, setMode] = useState<CraftMode>(
    capability.canSelfCraft ? "self" : "commission",
  );
  const [name, setName] = useState("");
  const [flavor, setFlavor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = characteristics.find((c) => c.name === characteristicName);
  const parsed = selected ? parseCharacteristicItem(selected) : undefined;
  const grade = parsed ? gradeForCharacteristicSequence(parsed.sequence) : null;
  const fee = grade !== null ? craftFee(mode, grade) : null;
  const funds = getFunds(session.gameState);

  const handleCraft = useCallback(() => {
    setError(null);
    setNotice(null);
    const result = craftArtifact(session, {
      characteristicItemName: characteristicName,
      mode,
      name,
      flavor,
    });
    if (result.outcome !== "crafted" || !result.session) {
      setError(OUTCOME_MESSAGES[result.outcome] ?? "The craft failed.");
      return;
    }
    onUpdate({ ...result.session, updatedAt: Date.now() });
    setNotice(`Forged ${result.item?.name ?? "the artifact"}.`);
    setName("");
    setFlavor("");
    setCharacteristicName("");
  }, [session, characteristicName, mode, name, flavor, onUpdate]);

  return (
    <section
      aria-labelledby="sheet-artifice"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2
        id="sheet-artifice"
        className="font-serif text-lg font-semibold text-foreground"
      >
        Artifice
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Bind a Beyonder Characteristic into a Sealed Artifact. Its powers follow the
        characteristic&rsquo;s pathway and Sequence; its drawback is the price.{" "}
        {capability.canSelfCraft
          ? "As a Paragon artisan you may forge it yourself."
          : "Commission an artisan to forge it for you."}
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-crimson">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-xs text-occult-bright">
          {notice}
        </p>
      )}

      {characteristics.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          You carry no Beyonder Characteristic to fuse. Hunt or buy one first.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="artifice-characteristic"
              className="block text-xs font-medium text-foreground"
            >
              Characteristic to fuse
            </label>
            <select
              id="artifice-characteristic"
              value={characteristicName}
              onChange={(e) => setCharacteristicName(e.target.value)}
              className="mt-1 min-h-[24px] w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            >
              <option value="">Choose a characteristic…</option>
              {characteristics.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {capability.canSelfCraft && (
            <fieldset>
              <legend className="text-xs font-medium text-foreground">
                How to forge
              </legend>
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="artifice-mode"
                    value="self"
                    checked={mode === "self"}
                    onChange={() => setMode("self")}
                  />
                  Forge it myself
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="artifice-mode"
                    value="commission"
                    checked={mode === "commission"}
                    onChange={() => setMode("commission")}
                  />
                  Commission an artisan
                </label>
              </div>
            </fieldset>
          )}

          <div>
            <label
              htmlFor="artifice-name"
              className="block text-xs font-medium text-foreground"
            >
              Artifact name
            </label>
            <input
              id="artifice-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 min-h-[24px] w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="artifice-flavor"
              className="block text-xs font-medium text-foreground"
            >
              Description (optional)
            </label>
            <textarea
              id="artifice-flavor"
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
            />
          </div>

          {grade !== null && fee !== null ? (
            <p className="text-xs text-muted">
              Grade {grade} artifact. Cost: {fee} pence (you hold {funds}).
            </p>
          ) : selected ? (
            <p className="text-xs text-crimson">
              A god-tier characteristic cannot be bound into an artifact.
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCraft}
            disabled={!selected || grade === null || (fee !== null && funds < fee)}
            className="min-h-[24px] rounded-lg border border-occult bg-occult/20 px-4 py-2 text-sm font-medium text-occult-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            Forge the artifact
          </button>
        </div>
      )}
    </section>
  );
}
