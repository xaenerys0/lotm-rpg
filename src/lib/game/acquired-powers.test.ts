import { describe, expect, it } from "vitest";

import { getSealedArtifact, mintArtifactItem } from "@/lib/lore";
import type { Item } from "@/lib/types/rules";

import {
  acquirePower,
  acquiredPowerAbilityLabels,
  canAcquirePower,
  capabilityForMethod,
  findAcquiredPower,
  isValidAcquiredPowerShape,
  isValidAcquiredPowersShape,
  permanentPowers,
  powerAcquisitionCapabilities,
  releasePower,
  temporaryPowers,
  tickAcquiredPowers,
  updateAcquiredPower,
  BLOOD_VESSEL_THIEF_DURATION_TURNS,
  IMITATION_DURATION_TURNS,
  MAX_ACQUIRED_POWERS,
  RING_OF_MIMICRY_DURATION_TURNS,
  type AcquiredPower,
} from "./acquired-powers";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// Pathway ids: Error = 8 (Prometheus theft / Parasite), White Tower = 10
// (Imitation), Fool = 1 (no acquisition capability).
function atRung(
  pathwayId: number,
  sequenceLevel: number,
  inventory: Item[] = [],
): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Tester");
  const gameState = { ...base, sequenceLevel, inventory };
  return createSession(gameState, "session-1");
}

/** A deterministic id factory for the tests. */
function ids(): () => string {
  let n = 0;
  return () => `power-${++n}`;
}

function withPowers(session: GameSession, powers: AcquiredPower[]): GameSession {
  return { ...session, acquiredPowers: powers };
}

function samplePower(over: Partial<AcquiredPower> = {}): AcquiredPower {
  return {
    id: "p1",
    name: "Borrowed Flame",
    description: "A copied gout of red-priest fire.",
    method: "imitation",
    permanence: "temporary",
    turnsRemaining: 3,
    acquiredAtTurn: 0,
    ...over,
  };
}

describe("powerAcquisitionCapabilities", () => {
  it("offers Prometheus theft to an Error Beyonder at Sequence 6 (not 7)", () => {
    expect(powerAcquisitionCapabilities(atRung(8, 7)).map((c) => c.method)).toEqual([]);
    const caps = powerAcquisitionCapabilities(atRung(8, 6));
    expect(caps.map((c) => c.method)).toEqual(["prometheus-theft"]);
    expect(caps[0].permanence).toBe("permanent");
    expect(caps[0].source).toBe("pathway");
  });

  it("adds Parasite siphon once the Error Beyonder reaches Sequence 4", () => {
    const caps = powerAcquisitionCapabilities(atRung(8, 4)).map((c) => c.method);
    expect(caps).toEqual(["prometheus-theft", "parasite-siphon"]);
  });

  it("offers temporary Imitation to a White Tower Beyonder at Sequence 6", () => {
    const caps = powerAcquisitionCapabilities(atRung(10, 6));
    expect(caps.map((c) => c.method)).toEqual(["imitation"]);
    expect(caps[0].permanence).toBe("temporary");
    expect(caps[0].defaultDuration).toBe(IMITATION_DURATION_TURNS);
  });

  it("offers nothing to a pathway with no copy/steal ability", () => {
    expect(powerAcquisitionCapabilities(atRung(1, 6))).toEqual([]);
  });

  it("offers the Ring of Mimicry capability when that artifact is carried", () => {
    const ring = mintArtifactItem(getSealedArtifact("2-081")!);
    const caps = powerAcquisitionCapabilities(atRung(1, 9, [ring]));
    expect(caps.map((c) => c.method)).toEqual(["ring-of-mimicry"]);
    expect(caps[0].source).toBe("artifact");
    expect(caps[0].defaultDuration).toBe(RING_OF_MIMICRY_DURATION_TURNS);
  });

  it("offers the Blood Vessel Thief capability when that artifact is carried", () => {
    const thief = mintArtifactItem(getSealedArtifact("2-105")!);
    const caps = powerAcquisitionCapabilities(atRung(1, 9, [thief]));
    expect(caps.map((c) => c.method)).toEqual(["blood-vessel-thief"]);
    expect(caps[0].defaultDuration).toBe(BLOOD_VESSEL_THIEF_DURATION_TURNS);
  });

  it("combines a pathway capability with a carried artifact one", () => {
    const ring = mintArtifactItem(getSealedArtifact("2-081")!);
    const caps = powerAcquisitionCapabilities(atRung(8, 6, [ring])).map((c) => c.method);
    expect(caps).toEqual(["prometheus-theft", "ring-of-mimicry"]);
  });

  it("ignores a carried sealed artifact that is not a copy/steal relic", () => {
    const other = mintArtifactItem(getSealedArtifact("2-078")!);
    expect(powerAcquisitionCapabilities(atRung(1, 9, [other]))).toEqual([]);
  });

  it("ignores a non-artifact item and an item with no recoverable code", () => {
    const mundane: Item = {
      name: "A walking cane",
      description: "",
      category: "mundane",
    };
    const malformed: Item = {
      name: "Ring of Mimicry",
      description: "",
      category: "sealed-artifact",
    };
    expect(powerAcquisitionCapabilities(atRung(1, 9, [mundane, malformed]))).toEqual([]);
  });

  it("de-duplicates two copies of the same artifact", () => {
    const ring = mintArtifactItem(getSealedArtifact("2-081")!);
    const caps = powerAcquisitionCapabilities(atRung(1, 9, [ring, { ...ring }]));
    expect(caps).toHaveLength(1);
  });
});

describe("canAcquirePower / capabilityForMethod", () => {
  it("reports whether the character can take a power at all", () => {
    expect(canAcquirePower(atRung(8, 6))).toBe(true);
    expect(canAcquirePower(atRung(1, 6))).toBe(false);
  });

  it("looks up a specific method's capability", () => {
    expect(capabilityForMethod(atRung(8, 6), "prometheus-theft")?.method).toBe(
      "prometheus-theft",
    );
    expect(capabilityForMethod(atRung(8, 6), "imitation")).toBeUndefined();
  });
});

describe("acquirePower", () => {
  it("records a permanent stolen power and seeds a memory fact", () => {
    const result = acquirePower(
      atRung(8, 6),
      {
        method: "prometheus-theft",
        name: "Nightmare Touch",
        description: "A stolen Sleepless power.",
        sourceName: "a Sleepless",
      },
      ids(),
      123,
    );
    expect(result.outcome).toBe("acquired");
    const power = result.power!;
    expect(power.id).toBe("power-1");
    expect(power.permanence).toBe("permanent");
    expect(power.turnsRemaining).toBeUndefined();
    expect(power.sourceName).toBe("a Sleepless");
    expect(power.acquiredAtTurn).toBe(0);
    expect(result.session!.acquiredPowers).toHaveLength(1);
    expect(result.session!.updatedAt).toBe(123);
    const facts = result.session!.memory.sessionFacts;
    expect(facts[facts.length - 1].description).toContain("Took the Beyonder power");
    expect(facts[facts.length - 1].description).toContain("from a Sleepless");
  });

  it("records a temporary copy with the capability's default duration", () => {
    const result = acquirePower(
      atRung(10, 6),
      { method: "imitation", name: "Flame Leap", description: "copied" },
      ids(),
    );
    expect(result.outcome).toBe("acquired");
    expect(result.power!.permanence).toBe("temporary");
    expect(result.power!.turnsRemaining).toBe(IMITATION_DURATION_TURNS);
    expect(result.power!.sourceName).toBeUndefined();
    const facts = result.session!.memory.sessionFacts;
    expect(facts[facts.length - 1].description).toContain("Copied the Beyonder power");
    expect(facts[facts.length - 1].description).toContain("fading imitation");
  });

  it("honours an overridden permanence (binding a normally-temporary copy)", () => {
    const result = acquirePower(atRung(10, 6), {
      method: "imitation",
      name: "Flame Leap",
      description: "copied then bound",
      permanence: "permanent",
    });
    expect(result.power!.permanence).toBe("permanent");
    expect(result.power!.turnsRemaining).toBeUndefined();
  });

  it("honours an overridden duration and rounds/floors it", () => {
    const result = acquirePower(atRung(10, 6), {
      method: "imitation",
      name: "Flame Leap",
      description: "short",
      turnsRemaining: 1.4,
    });
    expect(result.power!.turnsRemaining).toBe(1);
  });

  it("falls back to a one-turn floor for a non-positive override", () => {
    const result = acquirePower(atRung(10, 6), {
      method: "imitation",
      name: "Flame Leap",
      description: "",
      turnsRemaining: 0,
    });
    expect(result.power!.turnsRemaining).toBe(1);
  });

  it("trims overlong fields to their caps", () => {
    const result = acquirePower(atRung(8, 6), {
      method: "prometheus-theft",
      name: "x".repeat(200),
      description: "y".repeat(400),
      sourceName: "z".repeat(200),
    });
    expect(result.power!.name.length).toBe(80);
    expect(result.power!.description.length).toBe(280);
    expect(result.power!.sourceName!.length).toBe(80);
  });

  it("drops a blank source name", () => {
    const result = acquirePower(atRung(8, 6), {
      method: "prometheus-theft",
      name: "P",
      description: "",
      sourceName: "   ",
    });
    expect(result.power!.sourceName).toBeUndefined();
  });

  it("refuses an empty name", () => {
    const result = acquirePower(atRung(8, 6), {
      method: "prometheus-theft",
      name: "   ",
      description: "",
    });
    expect(result.outcome).toBe("missing-name");
    expect(result.session).toBeUndefined();
  });

  it("refuses a character with no acquisition capability", () => {
    const result = acquirePower(atRung(1, 6), {
      method: "prometheus-theft",
      name: "P",
      description: "",
    });
    expect(result.outcome).toBe("no-capability");
  });

  it("refuses a method the character does not have but reports it as invalid", () => {
    const result = acquirePower(atRung(8, 6), {
      method: "imitation",
      name: "P",
      description: "",
    });
    expect(result.outcome).toBe("invalid-method");
  });

  it("refuses once the cap is reached", () => {
    const full = withPowers(
      atRung(8, 6),
      Array.from({ length: MAX_ACQUIRED_POWERS }, (_, i) =>
        samplePower({ id: `p${i}`, permanence: "permanent", turnsRemaining: undefined }),
      ),
    );
    const result = acquirePower(full, {
      method: "prometheus-theft",
      name: "One too many",
      description: "",
    });
    expect(result.outcome).toBe("at-capacity");
  });
});

describe("updateAcquiredPower", () => {
  const base = () => withPowers(atRung(8, 6), [samplePower()]);

  it("renames and re-describes a power", () => {
    const r = updateAcquiredPower(base(), "p1", {
      name: "New Name",
      description: "new desc",
    });
    expect(r.outcome).toBe("updated");
    expect(r.power!.name).toBe("New Name");
    expect(r.power!.description).toBe("new desc");
  });

  it("sets and clears the source name", () => {
    const set = updateAcquiredPower(base(), "p1", { sourceName: "a thief" });
    expect(set.power!.sourceName).toBe("a thief");
    const cleared = updateAcquiredPower(set.session!, "p1", { sourceName: "  " });
    expect(cleared.power!.sourceName).toBeUndefined();
  });

  it("converting to permanent drops the countdown", () => {
    const r = updateAcquiredPower(base(), "p1", { permanence: "permanent" });
    expect(r.power!.permanence).toBe("permanent");
    expect(r.power!.turnsRemaining).toBeUndefined();
  });

  it("refreshes a temporary power's remaining turns", () => {
    const r = updateAcquiredPower(base(), "p1", { turnsRemaining: 9 });
    expect(r.power!.turnsRemaining).toBe(9);
  });

  it("keeps the current countdown when temporary and none given", () => {
    const r = updateAcquiredPower(base(), "p1", { name: "Renamed" });
    expect(r.power!.turnsRemaining).toBe(3);
  });

  it("converting permanent→temporary seeds a default countdown", () => {
    const perm = withPowers(atRung(8, 6), [
      samplePower({ permanence: "permanent", turnsRemaining: undefined }),
    ]);
    const r = updateAcquiredPower(perm, "p1", { permanence: "temporary" });
    expect(r.power!.turnsRemaining).toBe(IMITATION_DURATION_TURNS);
  });

  it("refuses a blank rename", () => {
    const r = updateAcquiredPower(base(), "p1", { name: "   " });
    expect(r.outcome).toBe("missing-name");
    expect(r.session).toBeUndefined();
  });

  it("reports a missing power", () => {
    expect(updateAcquiredPower(base(), "nope", { name: "x" }).outcome).toBe("not-found");
  });

  it("reports not-found on a session that has taken no powers", () => {
    expect(updateAcquiredPower(atRung(8, 6), "p1", { name: "x" }).outcome).toBe(
      "not-found",
    );
  });
});

describe("releasePower", () => {
  it("removes a power and seeds a memory fact", () => {
    const session = withPowers(atRung(8, 6), [samplePower()]);
    const next = releasePower(session, "p1", 55);
    expect(next.acquiredPowers).toHaveLength(0);
    expect(next.updatedAt).toBe(55);
    const facts = next.memory.sessionFacts;
    expect(facts[facts.length - 1].description).toContain("Released the acquired power");
  });

  it("is a no-op when the power does not exist", () => {
    const session = withPowers(atRung(8, 6), [samplePower()]);
    expect(releasePower(session, "nope")).toBe(session);
  });

  it("is a no-op on a session that has taken no powers", () => {
    const session = atRung(8, 6);
    expect(releasePower(session, "p1")).toBe(session);
  });
});

describe("tickAcquiredPowers", () => {
  it("is a no-op with no powers", () => {
    const session = atRung(8, 6);
    expect(tickAcquiredPowers(session)).toBe(session);
  });

  it("is a no-op when every power is permanent", () => {
    const session = withPowers(atRung(8, 6), [
      samplePower({ permanence: "permanent", turnsRemaining: undefined }),
    ]);
    expect(tickAcquiredPowers(session)).toBe(session);
  });

  it("decrements a temporary power without expiring it", () => {
    const session = withPowers(atRung(8, 6), [samplePower({ turnsRemaining: 3 })]);
    const next = tickAcquiredPowers(session, 77);
    expect(next.acquiredPowers![0].turnsRemaining).toBe(2);
    expect(next.updatedAt).toBe(77);
    // No expiry fact appended.
    expect(next.memory.sessionFacts).toHaveLength(session.memory.sessionFacts.length);
  });

  it("releases a temporary power that fades to zero and seeds a fact", () => {
    const session = withPowers(atRung(8, 6), [samplePower({ turnsRemaining: 1 })]);
    const next = tickAcquiredPowers(session);
    expect(next.acquiredPowers).toHaveLength(0);
    const facts = next.memory.sessionFacts;
    expect(facts[facts.length - 1].description).toContain("faded");
  });

  it("expires a temporary power whose countdown is missing", () => {
    const session = withPowers(atRung(8, 6), [
      samplePower({ turnsRemaining: undefined }),
    ]);
    const next = tickAcquiredPowers(session);
    expect(next.acquiredPowers).toHaveLength(0);
  });

  it("keeps permanent powers while expiring a faded temporary one", () => {
    const session = withPowers(atRung(8, 6), [
      samplePower({ id: "perm", permanence: "permanent", turnsRemaining: undefined }),
      samplePower({ id: "temp", turnsRemaining: 1 }),
    ]);
    const next = tickAcquiredPowers(session);
    expect(next.acquiredPowers!.map((p) => p.id)).toEqual(["perm"]);
  });
});

describe("acquiredPowerAbilityLabels", () => {
  it("labels temporary powers with their remaining turns (plural/singular)", () => {
    const session = withPowers(atRung(8, 6), [
      samplePower({ name: "A", turnsRemaining: 2 }),
      samplePower({ id: "p2", name: "B", turnsRemaining: 1 }),
    ]);
    expect(acquiredPowerAbilityLabels(session)).toEqual([
      "A (copied — 2 turns left)",
      "B (copied — 1 turn left)",
    ]);
  });

  it("labels permanent powers as stolen", () => {
    const session = withPowers(atRung(8, 6), [
      samplePower({ name: "Bound", permanence: "permanent", turnsRemaining: undefined }),
    ]);
    expect(acquiredPowerAbilityLabels(session)).toEqual(["Bound (stolen)"]);
  });

  it("returns an empty list when none are held", () => {
    expect(acquiredPowerAbilityLabels(atRung(8, 6))).toEqual([]);
  });
});

describe("permanentPowers / temporaryPowers / findAcquiredPower", () => {
  const session = withPowers(atRung(8, 6), [
    samplePower({ id: "a", permanence: "permanent", turnsRemaining: undefined }),
    samplePower({ id: "b", permanence: "temporary", turnsRemaining: 2 }),
  ]);

  it("partitions by permanence", () => {
    expect(permanentPowers(session).map((p) => p.id)).toEqual(["a"]);
    expect(temporaryPowers(session).map((p) => p.id)).toEqual(["b"]);
  });

  it("finds a power by id", () => {
    expect(findAcquiredPower(session, "b")?.id).toBe("b");
    expect(findAcquiredPower(session, "z")).toBeUndefined();
  });
});

describe("shape validation", () => {
  it("accepts a well-formed permanent and temporary power", () => {
    expect(
      isValidAcquiredPowerShape(
        samplePower({ permanence: "permanent", turnsRemaining: undefined }),
      ),
    ).toBe(true);
    expect(isValidAcquiredPowerShape(samplePower())).toBe(true);
  });

  it("rejects malformed powers", () => {
    expect(isValidAcquiredPowerShape(null)).toBe(false);
    expect(isValidAcquiredPowerShape([])).toBe(false);
    expect(isValidAcquiredPowerShape(samplePower({ id: "" }))).toBe(false);
    expect(isValidAcquiredPowerShape(samplePower({ name: "" }))).toBe(false);
    expect(
      isValidAcquiredPowerShape({
        ...samplePower(),
        description: 5 as unknown as string,
      }),
    ).toBe(false);
    expect(
      isValidAcquiredPowerShape({ ...samplePower(), sourceName: 5 as unknown as string }),
    ).toBe(false);
    expect(
      isValidAcquiredPowerShape({
        ...samplePower(),
        method: "made-up" as unknown as AcquiredPower["method"],
      }),
    ).toBe(false);
    expect(
      isValidAcquiredPowerShape({
        ...samplePower(),
        permanence: "forever" as unknown as AcquiredPower["permanence"],
      }),
    ).toBe(false);
    expect(isValidAcquiredPowerShape(samplePower({ turnsRemaining: -1 }))).toBe(false);
    expect(
      isValidAcquiredPowerShape({
        ...samplePower(),
        acquiredAtTurn: "soon" as unknown as number,
      }),
    ).toBe(false);
  });

  it("validates the list shape", () => {
    expect(isValidAcquiredPowersShape([])).toBe(true);
    expect(isValidAcquiredPowersShape([samplePower()])).toBe(true);
    expect(isValidAcquiredPowersShape({})).toBe(false);
    expect(isValidAcquiredPowersShape([samplePower(), null])).toBe(false);
  });
});
