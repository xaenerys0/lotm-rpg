"use client";

import Link from "next/link";
import { useState } from "react";

import {
  buildAdminCharacter,
  forceLossOfControl,
  grantArtifactsToSession,
  lossOfControlPreview,
  makeAdvancementReady,
  setSessionFunds,
  setSessionSanity,
  PROVIDER_CONFIG_KEY,
  type AdminAnchorSpec,
  type AdminEndgame,
  type AdminCharacterOptions,
} from "@/lib/game";
import {
  generateCharacterIdentity,
  CHARACTER_REGIONS,
  type CharacterRegion,
  type ProviderConfig,
} from "@/lib/ai";
import {
  loadSessionIndex,
  persistSession,
  saveActiveSessionId,
  saveSessionIndex,
  useActiveSession,
} from "@/lib/react/session-store";
import { ALL_PATHWAYS, getPathway, getSequence } from "@/lib/rules";
import { SEALED_ARTIFACTS, sealedArtifactsForGrade } from "@/lib/lore/sealed-artifacts";
import type { ArtifactGrade } from "@/lib/lore/sealed-artifacts";

import { PageHeader } from "./page-header";

/** Read the saved BYOK provider config (the AI generator needs it). */
function loadProviderConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as ProviderConfig) : null;
  } catch {
    return null;
  }
}

const REGION_IDS = Object.keys(CHARACTER_REGIONS) as CharacterRegion[];

/** Parse a numeric-field string to a finite number, or undefined (blank/garbage). */
function finiteOrUndefined(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const SEQUENCES = [9, 8, 7, 6, 5, 4, 3, 2, 1] as const;
const GRADES: readonly ArtifactGrade[] = [0, 1, 2, 3];
const GRADE_LABEL: Record<ArtifactGrade, string> = {
  0: "Grade 0 · Angel-tier",
  1: "Grade 1 · Saint-tier",
  2: "Grade 2 · Mid-Sequence",
  3: "Grade 3 · Low-Sequence",
};

// Shared control styling so the whole console reads in one voice.
const fieldCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40";
const labelCls = "mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase";
const primaryBtn =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-gold hover:shadow-[0_12px_28px_-12px_rgba(224,167,60,0.55)] disabled:opacity-50";
const subtleBtn =
  "inline-flex min-h-[36px] items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-amber/40 hover:text-amber";

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="parchment relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <h2 className="gaslit font-serif text-xl font-semibold text-foreground">{title}</h2>
      {hint ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
      <div aria-hidden="true" className="gilt-rule my-5" />
      {children}
    </section>
  );
}

export function AdminToolsPanel() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Dev · Admin"
        title="Test Utilities"
        description="Stand a character up in any state — at any sequence, mid- or post-digestion, armed with sealed artifacts or poised at the endgame — and drive loss-of-control and advancement on demand. Changes touch only your own saves."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ForgeCharacter />
        <ModifyActive />
      </div>
    </div>
  );
}

// ─── Region 1: forge a test character ────────────────────────────────

function ForgeCharacter() {
  const [pathwayId, setPathwayId] = useState(1);
  const [sequenceLevel, setSequenceLevel] = useState(9);
  const [digestion, setDigestion] = useState<"start" | "end">("end");
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [region, setRegion] = useState<CharacterRegion>("loen");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [funds, setFunds] = useState("");
  const [sanity, setSanity] = useState("");
  const [knowsMethod, setKnowsMethod] = useState(true);
  const [advancementReady, setAdvancementReady] = useState(false);
  const [endgame, setEndgame] = useState<AdminEndgame>("none");
  const [grantPower, setGrantPower] = useState(false);
  const [grantAnchor, setGrantAnchor] = useState(false);
  const [switchReady, setSwitchReady] = useState(false);
  const [artifacts, setArtifacts] = useState<ReadonlySet<string>>(new Set());
  const [created, setCreated] = useState<string | null>(null);

  function toggleArtifact(code: string) {
    setArtifacts((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Generate a name + background with the player's BYOK provider — names follow
  // the chosen region's naming register (read inside the handler so a provider
  // configured after opening the page is picked up, mirroring the Codex rebuild).
  async function handleGenerateIdentity() {
    const config = loadProviderConfig();
    if (!config) {
      setGenError("Configure an AI provider in Settings to generate an identity.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const identity = await generateCharacterIdentity(config, {
        pathwayName: getPathway(pathwayId)?.name ?? "unknown",
        sequenceName: getSequence(pathwayId, sequenceLevel)?.name ?? "Beyonder",
        sequenceLevel,
        region,
      });
      if (!identity) {
        setGenError("The model returned nothing legible. Try again.");
        return;
      }
      setName(identity.name);
      setBackground(identity.background);
    } catch {
      setGenError("Generation failed. Check your provider settings and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleForge() {
    const endgameAnchorsActive = endgame !== "none";
    const anchors: AdminAnchorSpec[] | undefined =
      grantAnchor && !endgameAnchorsActive
        ? [
            { kind: "object", name: "A test relic" },
            { kind: "congregation", name: "A test congregation" },
          ]
        : undefined;
    const options: AdminCharacterOptions = {
      pathwayId,
      sequenceLevel,
      digestion,
      characterName: name.trim() || undefined,
      characterBackground: background.trim() || undefined,
      funds: finiteOrUndefined(funds),
      sanity: finiteOrUndefined(sanity),
      knowsActingMethod: knowsMethod,
      advancementReady,
      endgame,
      // Pathway switching (issue #211): poise the build to exchange into its
      // first neighbouring pathway (recipe seeded, potion digested).
      switchReadyTarget: switchReady
        ? getPathway(pathwayId)?.neighboringPathways.find((id) => id !== pathwayId)
        : undefined,
      artifactNumbers: [...artifacts],
      anchors,
      acquiredPowers: grantPower
        ? [
            {
              name: "Borrowed Beyonder Ability",
              description: "A copied power, granted for testing.",
              sourceName: "a test subject",
            },
          ]
        : undefined,
    };
    const session = buildAdminCharacter(options);
    persistSession(session);
    const index = loadSessionIndex();
    if (!index.includes(session.id)) saveSessionIndex([session.id, ...index]);
    saveActiveSessionId(session.id);
    setCreated(session.gameState.characterName ?? "Admin Subject");
  }

  return (
    <Panel
      title="Forge a test character"
      hint="Build and activate a fresh Beyonder in any configuration. It becomes the active character everywhere."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="forge-pathway" className={labelCls}>
              Pathway
            </label>
            <select
              id="forge-pathway"
              className={fieldCls}
              value={pathwayId}
              onChange={(e) => setPathwayId(Number(e.target.value))}
            >
              {ALL_PATHWAYS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}. {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="forge-sequence" className={labelCls}>
              Sequence
            </label>
            <select
              id="forge-sequence"
              className={fieldCls}
              value={sequenceLevel}
              onChange={(e) => setSequenceLevel(Number(e.target.value))}
            >
              {SEQUENCES.map((s) => (
                <option key={s} value={s}>
                  Sequence {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className={labelCls}>Digestion of current potion</legend>
          <div className="flex gap-2">
            {(["start", "end"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDigestion(d)}
                aria-pressed={digestion === d}
                className={`min-h-[36px] flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  digestion === d
                    ? "border-amber bg-amber/10 font-medium text-amber"
                    : "border-border text-muted hover:border-amber/40 hover:text-foreground"
                }`}
              >
                {d === "start" ? "Start (fresh)" : "End (digested)"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-occult/30 bg-occult/[0.04] p-3">
          <legend className="px-1 text-xs font-semibold tracking-wide text-occult-bright">
            AI identity generator
          </legend>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="forge-region" className={labelCls}>
                Naming region
              </label>
              <select
                id="forge-region"
                className={fieldCls}
                value={region}
                onChange={(e) => setRegion(e.target.value as CharacterRegion)}
              >
                {REGION_IDS.map((id) => (
                  <option key={id} value={id}>
                    {CHARACTER_REGIONS[id].label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerateIdentity}
              disabled={generating}
              className={primaryBtn}
            >
              {generating ? "Generating…" : "Generate name & background"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Uses your configured AI provider; names follow the region&apos;s naming
            conventions from the novel.
          </p>
          {generating ? (
            <p role="status" className="mt-1 text-xs text-occult-bright">
              Summoning an identity…
            </p>
          ) : null}
          {genError ? (
            <p role="alert" className="mt-1 text-xs text-crimson">
              {genError}
            </p>
          ) : null}
        </fieldset>

        <div>
          <label htmlFor="forge-name" className={labelCls}>
            Name
          </label>
          <input
            id="forge-name"
            className={fieldCls}
            value={name}
            placeholder="Leave blank for “Admin Subject”"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="forge-background" className={labelCls}>
            Background
          </label>
          <textarea
            id="forge-background"
            rows={3}
            className={fieldCls}
            value={background}
            placeholder="Optional backstory"
            onChange={(e) => setBackground(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="forge-funds" className={labelCls}>
              Funds (pence)
            </label>
            <input
              id="forge-funds"
              type="number"
              inputMode="numeric"
              className={fieldCls}
              value={funds}
              placeholder="Default 100,000"
              onChange={(e) => setFunds(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="forge-sanity" className={labelCls}>
              Sanity
            </label>
            <input
              id="forge-sanity"
              type="number"
              inputMode="numeric"
              className={fieldCls}
              value={sanity}
              placeholder="Default full"
              onChange={(e) => setSanity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="forge-endgame" className={labelCls}>
            Endgame readiness
          </label>
          <select
            id="forge-endgame"
            className={fieldCls}
            value={endgame}
            onChange={(e) => setEndgame(e.target.value as AdminEndgame)}
          >
            <option value="none">None</option>
            <option value="apotheosis">Apotheosis-ready (Seq 1, poised)</option>
            <option value="pillar">Pillar-ready (Seq 0 True God, poised)</option>
            <option value="true-god">True God — ascended (Seq 0)</option>
            <option value="pillar-enthroned">
              Pillar — enthroned (Above the Sequence)
            </option>
          </select>
          <p className="mt-1 text-xs text-muted">
            The <em>-ready</em> builds override the sequence and seed the Uniqueness +
            anchors + a matured rite (poised to attempt). The <em>ascended</em> builds
            stand up the finished True God / Pillar so you can view the post-ascension
            sheet and family kits directly.
          </p>
        </div>

        <fieldset className="space-y-2.5">
          <legend className={labelCls}>Toggles</legend>
          <Toggle
            id="forge-method"
            label="Acting method discovered (reveals digestion)"
            checked={knowsMethod}
            onChange={setKnowsMethod}
          />
          <Toggle
            id="forge-advance"
            label="Advancement-ready (next potion's ingredients + digested)"
            checked={advancementReady}
            onChange={setAdvancementReady}
          />
          <Toggle
            id="forge-power"
            label="Grant a sample acquired power"
            checked={grantPower}
            onChange={setGrantPower}
          />
          <Toggle
            id="forge-anchor"
            label="Consecrate sample anchors"
            checked={grantAnchor}
            onChange={setGrantAnchor}
            disabled={endgame !== "none"}
            note={endgame !== "none" ? "Endgame seeds its own anchors" : undefined}
          />
          <Toggle
            id="forge-switch"
            label="Pathway-switch ready (neighbour's potion + digested)"
            checked={switchReady}
            onChange={setSwitchReady}
            note="Poises the character to exchange into a neighbouring pathway"
          />
        </fieldset>

        <fieldset>
          <legend className={labelCls}>Sealed artifacts</legend>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border bg-surface/60 p-3">
            {GRADES.map((grade) => (
              <div key={grade}>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-occult-bright">
                  {GRADE_LABEL[grade]}
                </p>
                <div className="space-y-1.5">
                  {sealedArtifactsForGrade(grade).map((a) => (
                    <Toggle
                      key={a.number}
                      id={`forge-art-${a.number}`}
                      label={`${a.number} — ${a.name}`}
                      checked={artifacts.has(a.number)}
                      onChange={() => toggleArtifact(a.number)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">
            {artifacts.size} of {SEALED_ARTIFACTS.length} selected.
          </p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" onClick={handleForge} className={primaryBtn}>
            Forge &amp; activate
          </button>
          {created ? (
            <p role="status" className="text-sm text-foreground">
              Forged <span className="font-semibold text-amber">{created}</span>.{" "}
              <Link href="/play" className="font-medium text-gaslight underline">
                Open in play →
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

// ─── Region 2: modify the active character ───────────────────────────

function ModifyActive() {
  const session = useActiveSession();
  const [sanity, setSanity] = useState("");
  const [funds, setFunds] = useState("");
  const [artifactCode, setArtifactCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [armLoc, setArmLoc] = useState(false);

  if (!session) {
    return (
      <Panel title="Modify the active character">
        <p role="status" className="text-sm text-muted">
          No active character. Forge one (left) or open a save in{" "}
          <Link href="/play" className="font-medium text-gaslight underline">
            Play
          </Link>
          .
        </p>
      </Panel>
    );
  }

  const gs = session.gameState;

  function commit(next: typeof session, message: string) {
    if (!next) return;
    persistSession(next);
    setStatus(message);
  }

  return (
    <Panel
      title="Modify the active character"
      hint={`${gs.characterName ?? "Unnamed Beyonder"} — ${gs.pathwayId}/Seq ${gs.sequenceLevel}. Sanity ${gs.sanity}/${gs.maxSanity}, funds ${gs.funds}.`}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mod-sanity" className={labelCls}>
              Set sanity
            </label>
            <div className="flex gap-2">
              <input
                id="mod-sanity"
                type="number"
                inputMode="numeric"
                className={fieldCls}
                value={sanity}
                placeholder={String(gs.sanity)}
                onChange={(e) => setSanity(e.target.value)}
              />
              <button
                type="button"
                className={subtleBtn}
                onClick={() => {
                  const value = finiteOrUndefined(sanity);
                  if (value === undefined) return;
                  commit(setSessionSanity(session, value), "Sanity updated.");
                  setSanity("");
                }}
              >
                Set
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="mod-funds" className={labelCls}>
              Set funds
            </label>
            <div className="flex gap-2">
              <input
                id="mod-funds"
                type="number"
                inputMode="numeric"
                className={fieldCls}
                value={funds}
                placeholder={String(gs.funds)}
                onChange={(e) => setFunds(e.target.value)}
              />
              <button
                type="button"
                className={subtleBtn}
                onClick={() => {
                  const value = finiteOrUndefined(funds);
                  if (value === undefined) return;
                  commit(setSessionFunds(session, value), "Funds updated.");
                  setFunds("");
                }}
              >
                Set
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="mod-artifact" className={labelCls}>
            Grant sealed artifact (code)
          </label>
          <div className="flex gap-2">
            <input
              id="mod-artifact"
              className={fieldCls}
              value={artifactCode}
              placeholder="e.g. 0-08"
              onChange={(e) => setArtifactCode(e.target.value)}
            />
            <button
              type="button"
              className={subtleBtn}
              onClick={() => {
                const code = artifactCode.trim();
                if (code === "") return;
                commit(
                  grantArtifactsToSession(session, [code]),
                  `Granted ${code} (no-op if unknown/held).`,
                );
                setArtifactCode("");
              }}
            >
              Grant
            </button>
          </div>
        </div>

        <button
          type="button"
          className={subtleBtn + " w-full"}
          onClick={() =>
            commit(
              makeAdvancementReady(session),
              "Advancement-ready: ingredients + digested.",
            )
          }
        >
          Make advancement-ready
        </button>

        <div className="rounded-lg border border-crimson/40 bg-crimson/[0.06] p-4">
          <p className="text-sm font-medium text-foreground">Trigger loss of control</p>
          <p className="mt-1 text-xs text-muted">
            Empties sanity. At Seq {gs.sequenceLevel} this resolves as a{" "}
            <span className="font-semibold text-crimson">
              {lossOfControlPreview(session)}
            </span>{" "}
            when next opened in Play.
          </p>
          {armLoc ? (
            <div className="mt-3 flex flex-wrap gap-2" role="alert">
              <button
                type="button"
                className="inline-flex min-h-[36px] items-center rounded-lg bg-crimson px-4 py-2 text-sm font-semibold text-background transition-colors hover:opacity-90"
                onClick={() => {
                  commit(
                    forceLossOfControl(session),
                    "Sanity emptied — loss of control armed.",
                  );
                  setArmLoc(false);
                }}
              >
                Confirm — empty sanity
              </button>
              <button
                type="button"
                className={subtleBtn}
                onClick={() => setArmLoc(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-crimson/60 px-4 py-2 text-sm font-medium text-crimson transition-colors hover:bg-crimson/10"
              onClick={() => setArmLoc(true)}
            >
              Trigger…
            </button>
          )}
        </div>

        {status ? (
          <p role="status" className="text-sm text-foreground">
            {status}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
  disabled,
  note,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2.5 text-sm ${
        disabled ? "text-muted/70" : "text-foreground"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-amber"
      />
      <span>
        {label}
        {note ? <span className="ml-1 text-xs text-muted">({note})</span> : null}
      </span>
    </label>
  );
}
