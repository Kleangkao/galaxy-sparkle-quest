import { describe, expect, it } from "vitest";
import { createNewGameState, getGameplayModifiers } from "@/lib/gameState";
import { getPuriBonuses, getPuriProgress } from "@/lib/puriBond";
import { DISCOVERY_BIOMES, getDiscoveryRotation, getMasteryTier } from "@/lib/discoveryBiomes";
import { getStrategyActionValues, getStrategyObjective } from "@/lib/strategyMissions";
import { LocalProfileRepository } from "@/lib/profileRepository";

describe("multi-mode progression", () => {
  it("creates migration-safe loadout and mode records", () => {
    const state = createNewGameState("mud");
    expect(state.activePilot).toBe("nova-reyes");
    expect(state.activeTool).toBe("echo-scanner");
    expect(state.modeRecords).toEqual({
      swarmHighScore: 0,
      arcadeHighScore: 0,
      discoveryFinds: 0,
      strategyWins: 0,
      puriBond: 0,
      arcadeContracts: {},
      discoveryMastery: {},
      discoveryRuns: 0,
      strategyCycles: 0,
      strategyObjectives: 0,
    });
    expect(state.accessibility).toEqual({ combatSpeed: 1, effects: "full", aimHelp: "standard", contrast: "standard" });
  });

  it("stacks pilot and tool effects into the shared mission model", () => {
    const modifiers = getGameplayModifiers({
      activePilot: "k-rail",
      activeTool: "vector-drive",
      activePet: null,
      upgrades: [],
    });
    expect(modifiers.missionTimeBonus).toBe(10);
    expect(modifiers.crystalMultiplier).toBe(1);
  });

  it("keeps defensive loadouts easy to understand", () => {
    const modifiers = getGameplayModifiers({
      activePilot: "bastion-7",
      activeTool: "aegis-projector",
      activePet: null,
      upgrades: [],
    });
    expect(modifiers.failRewardMultiplier).toBe(0.55);
  });

  it("unlocks PURI abilities at stable milestone thresholds", () => {
    expect(getPuriBonuses(24)).toMatchObject({ combatMagnet: 1.25, combatHull: 0, discoveryHint: false });
    expect(getPuriBonuses(75)).toMatchObject({ combatHull: 15, discoveryHint: true, strategyActions: 1, rewardMultiplier: 1 });
    expect(getPuriBonuses(100).rewardMultiplier).toBe(1.15);
  });

  it("reports PURI progress toward the next named ability", () => {
    const progress = getPuriProgress(32);
    expect(progress.current.ability).toBe("Cushion Shield");
    expect(progress.next?.ability).toBe("Curious Nose");
    expect(progress.progress).toBe(28);
  });

  it("rotates discovery finds without changing the biome collection", () => {
    const biome = DISCOVERY_BIOMES[0];
    const first = getDiscoveryRotation(biome, 0).map((find) => find.name);
    const second = getDiscoveryRotation(biome, 1).map((find) => find.name);
    expect(first).toHaveLength(6);
    expect(second).toHaveLength(6);
    expect(second[0]).toBe(first[1]);
    expect(new Set([...first, ...second]).size).toBeGreaterThan(6);
  });

  it("assigns readable biome mastery ranks", () => {
    expect(getMasteryTier(0)).toBe("New Arrival");
    expect(getMasteryTier(25)).toBe("Field Scout");
    expect(getMasteryTier(60)).toBe("Biome Ranger");
    expect(getMasteryTier(100)).toBe("Master Naturalist");
  });

  it("rotates strategy objectives predictably", () => {
    expect(getStrategyObjective(0).id).toBe("secure");
    expect(getStrategyObjective(1).id).toBe("focus");
    expect(getStrategyObjective(2).id).toBe("survey");
    expect(getStrategyObjective(3).id).toBe("secure");
  });

  it("keeps sector trait action values simple and bounded", () => {
    const values = getStrategyActionValues("sparkle-moon");
    expect(values.scan).toBeGreaterThanOrEqual(12);
    expect(values.reinforce).toBeGreaterThanOrEqual(28);
    expect(values.disrupt).toBeGreaterThanOrEqual(16);
    expect(values.rivalPressure).toBeGreaterThanOrEqual(1);
  });

  it("exposes local saves through a cloud-replaceable profile contract", () => {
    const repository = new LocalProfileRepository();
    expect(repository.kind).toBe("local");
    expect(repository.supportsAccounts).toBe(false);
    expect(typeof repository.load).toBe("function");
    expect(typeof repository.save).toBe("function");
  });
});
