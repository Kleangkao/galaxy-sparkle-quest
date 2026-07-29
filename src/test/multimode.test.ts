import { describe, expect, it } from "vitest";
import { createNewGameState, getGameplayModifiers, getUpgradeEffectAtTier, getUpgradeTier, isStoryChapterUnlocked, PLANETS } from "@/lib/gameState";
import { getPilotUnlock, getToolModeSummary, getToolUnlock, getTool } from "@/lib/loadouts";
import { getPuriBonuses, getPuriProgress } from "@/lib/puriBond";
import { DISCOVERY_BIOMES, getDiscoveryClue, getDiscoveryDecoyId, getDiscoveryResearchChapter, getDiscoveryRotation, getMasteryTier } from "@/lib/discoveryBiomes";
import { evaluateRelayRoute, getRelayMission, getStrategyActionValues, getStrategyObjective } from "@/lib/strategyMissions";
import { LocalProfileRepository } from "@/lib/profileRepository";
import { getProgressGoal, getStoryReplayMultiplier } from "@/lib/progressionGuidance";
import { getBossFightWindow, getSwarmRunVariant, getSwarmSpawnDelay, hasMeaningfulSwarmParticipation, SWARM_BALANCE } from "@/lib/swarmBalance";
import { getArcadeGrade, getArcadeRunOutcome } from "@/lib/arcadeContracts";
import { getEconomyProjection } from "@/lib/economyBalance";

describe("multi-mode progression", () => {
  it("keeps the permanent economy welcoming without finishing in one sitting", () => {
    const projection = getEconomyProjection();
    expect(projection.firstUpgradeRuns).toBeLessThanOrEqual(2);
    expect(projection.allTierOneRuns).toBeGreaterThanOrEqual(20);
    expect(projection.allTierOneRuns).toBeLessThanOrEqual(40);
    expect(projection.fullBuildRuns).toBeGreaterThanOrEqual(60);
    expect(projection.fullBuildRuns).toBeLessThanOrEqual(110);
  });

  it("keeps first clears valuable while making Story replays worth doing", () => {
    expect(getStoryReplayMultiplier(false)).toBe(1);
    expect(getStoryReplayMultiplier(true)).toBe(0.55);
  });

  it("does not issue Arcade rewards for an idle or accidental run", () => {
    expect(getArcadeRunOutcome({
      score: 0,
      shotsFired: 0,
      hits: 0,
      bestCombo: 0,
      cleared: false,
    })).toMatchObject({ participated: false, crystals: 0, xp: 0, accuracy: 0 });

    expect(getArcadeRunOutcome({
      score: 600,
      shotsFired: 2,
      hits: 1,
      bestCombo: 1,
      cleared: false,
    })).toMatchObject({ participated: false, crystals: 0, xp: 0 });
  });

  it("recommends the next unlocked campaign chapter before optional grinding", () => {
    const state = createNewGameState("mud");
    expect(getProgressGoal(state)).toMatchObject({ mode: "story", title: "Continue Story chapter 1" });
    state.visitedPlanets.push("sparkle-moon"); state.xp = 10; state.level = 2;
    expect(getProgressGoal(state)).toMatchObject({ mode: "story", title: "Continue Story chapter 2" });
  });
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
      swarmRuns: 0,
      swarmClears: 0,
      swarmEvolutions: 0,
    });
    expect(state.accessibility).toEqual({ combatSpeed: 1, effects: "full", aimHelp: "standard", contrast: "standard", sound: "full", music: "quiet", screenShake: "full" });
    expect(state.upgradeTiers).toMatchObject({ shield: 0, booster: 0, scanner: 0 });
  });

  it("turns side-mode mastery into visible campaign support", () => {
    const state = createNewGameState("mud");
    state.modeRecords.swarmHighScore = 1500;
    state.modeRecords.arcadeContracts = { patrol: { bestScore: 900, clears: 1 } };
    state.modeRecords.discoveryFinds = 18;
    state.modeRecords.strategyObjectives = 2;
    const modifiers = getGameplayModifiers(state);
    expect(modifiers.storyStartingHpBonus).toBe(1);
    expect(modifiers.storyDashReady).toBe(true);
    expect(modifiers.petDiscoveryBonus).toBeCloseTo(0.1);
    expect(modifiers.crystalMultiplier).toBeCloseTo(1.21);
  });

  it("unlocks loadouts through Story or mode mastery and preserves upgrade tiers", () => {
    const state = createNewGameState("oni");
    expect(getPilotUnlock("k-rail", state).unlocked).toBe(false);
    expect(getToolUnlock("vector-drive", state).unlocked).toBe(false);
    state.visitedPlanets.push("sparkle-moon", "candy-planet");
    state.level = 2;
    expect(getPilotUnlock("k-rail", state).unlocked).toBe(true);
    expect(getToolUnlock("vector-drive", state).unlocked).toBe(true);
    state.upgrades.push("shield");
    state.upgradeTiers.shield = 3;
    expect(getUpgradeTier(state, "shield")).toBe(3);
  });

  it("keeps the connected campaign sequential even when side modes raise captain level", () => {
    const state = createNewGameState("ustur");
    state.level = 8;
    expect(isStoryChapterUnlocked(PLANETS[0], state)).toBe(true);
    expect(isStoryChapterUnlocked(PLANETS[1], state)).toBe(false);
    state.visitedPlanets.push(PLANETS[0].id);
    expect(isStoryChapterUnlocked(PLANETS[1], state)).toBe(true);
    expect(isStoryChapterUnlocked(PLANETS[2], state)).toBe(false);
  });

  it("explains exact upgrade tiers and mode-specific weapon relevance", () => {
    expect(getUpgradeEffectAtTier("shield", 1)).toContain("60%");
    expect(getUpgradeEffectAtTier("shield", 3)).toContain("80%");
    expect(getToolModeSummary(getTool("echo-scanner"), "swarm")).toBe("+8% fire rate");
    expect(getToolModeSummary(getTool("echo-scanner"), "arcade")).toBe("+2 rounds · 20% faster reload");
    expect(getToolModeSummary(getTool("echo-scanner"), "swarm", "th")).toBe("ยิงเร็วขึ้น 8%");
    expect(getToolModeSummary(getTool("echo-scanner"), "arcade", "th")).toBe("กระสุน +2 นัด · เติมกระสุนเร็วขึ้น 20%");
    expect(getToolModeSummary(getTool("vector-drive"), "swarm")).toContain("+20% weapon damage");
  });

  it("grades Arcade accuracy and clear quality consistently", () => {
    expect(getArcadeGrade(0.9, true, 10)).toBe("S");
    expect(getArcadeGrade(0.75, true, 4)).toBe("A");
    expect(getArcadeGrade(0.45, false, 2)).toBe("C");
  });

  it("keeps pilot timing and weapon power as separate, truthful effects", () => {
    const modifiers = getGameplayModifiers({
      ...createNewGameState("mud"),
      activePilot: "k-rail",
      activeTool: "vector-drive",
      activePet: null,
      upgrades: [],
    });
    expect(modifiers.missionTimeBonus).toBe(6);
    expect(modifiers.crystalMultiplier).toBe(1);
    expect(modifiers.combatDamage).toBe(1.2);
    expect(modifiers.arcadeMagazineBonus).toBe(0);
  });

  it("keeps defensive loadouts easy to understand", () => {
    const modifiers = getGameplayModifiers({
      ...createNewGameState("mud"),
      activePilot: "bastion-7",
      activeTool: "aegis-projector",
      activePet: null,
      upgrades: [],
    });
    expect(modifiers.failRewardMultiplier).toBe(0.55);
    expect(modifiers.combatHullBonus).toBe(40);
  });

  it("applies every installed ship system automatically to its real gameplay modifier", () => {
    const state = createNewGameState("mud");
    state.activePet = null;
    state.upgrades = ["shield", "booster", "scanner", "garden", "wings", "crown"];
    state.upgradeTiers = Object.fromEntries(state.upgrades.map((id) => [id, 2]));
    const modifiers = getGameplayModifiers(state);

    expect(modifiers.failRewardMultiplier).toBeCloseTo(0.7);
    expect(modifiers.combatHullBonus).toBe(20);
    expect(modifiers.missionTimeBonus).toBe(26);
    expect(modifiers.petDiscoveryBonus).toBeCloseTo(0.3);
    expect(modifiers.crystalMultiplier).toBeCloseTo(1.1 * 1.3 * 1.4);
  });

  it("makes the sidearm a quick-reload choice instead of an unrelated scanner", () => {
    const modifiers = getGameplayModifiers({
      ...createNewGameState("mud"),
      activePilot: "nova-reyes",
      activeTool: "echo-scanner",
      activePet: null,
      upgrades: [],
    });
    expect(modifiers.arcadeMagazineBonus).toBe(2);
    expect(modifiers.arcadeReloadMultiplier).toBe(0.8);
    expect(modifiers.petDiscoveryBonus).toBe(0);
  });

  it("unlocks PURI abilities at stable milestone thresholds", () => {
    expect(getPuriBonuses(24)).toMatchObject({ combatMagnet: 1.25, combatHull: 0, arcadeReloadMultiplier: 1, combatDamageMultiplier: 1 });
    expect(getPuriBonuses(75)).toMatchObject({ combatHull: 15, arcadeReloadMultiplier: 0.85, combatDamageMultiplier: 1.1, rewardMultiplier: 1 });
    expect(getPuriBonuses(100).rewardMultiplier).toBe(1.15);
  });

  it("reports PURI progress toward the next named ability", () => {
    const progress = getPuriProgress(32);
    expect(progress.current.ability).toBe("Cushion Shield");
    expect(progress.next?.ability).toBe("Quick Reload");
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

  it("uses a distant decoy and rotates easy-to-read Discovery clues", () => {
    const points = [
      { id: 0, x: 10, y: 10 },
      { id: 1, x: 18, y: 14 },
      { id: 2, x: 88, y: 84 },
    ];
    expect(getDiscoveryDecoyId(0, points, [])).toBe(2);
    expect(getDiscoveryClue(points[0], points[2], 0)).toContain("upper-left");
    expect(getDiscoveryClue(points[0], points[2], 1)).toContain("left");
    expect(getDiscoveryResearchChapter(0)).toBe(1);
    expect(getDiscoveryResearchChapter(100)).toBe(5);
  });

  it("rotates strategy objectives predictably", () => {
    expect(getStrategyObjective(0).id).toBe("secure");
    expect(getStrategyObjective(1).id).toBe("focus");
    expect(getStrategyObjective(2).id).toBe("survey");
    expect(getStrategyObjective(3).id).toBe("contain");
  });

  it("keeps sector trait action values simple and bounded", () => {
    const values = getStrategyActionValues("sparkle-moon");
    expect(values.scan).toBeGreaterThanOrEqual(12);
    expect(values.reinforce).toBeGreaterThanOrEqual(28);
    expect(values.disrupt).toBeGreaterThanOrEqual(16);
    expect(values.rivalPressure).toBeGreaterThanOrEqual(1);
  });

  it("rotates three solvable relay missions with different risk plans", () => {
    expect(getRelayMission(0).id).toBe("signal-run");
    expect(getRelayMission(1).id).toBe("cargo-shield");
    expect(getRelayMission(2).id).toBe("storm-gap");
    expect(getRelayMission(3).id).toBe("signal-run");
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const mission = getRelayMission(cycle);
      const planned = mission.routes.map((choices, index) =>
        index < mission.recommendedRisks ? choices[1] : choices[0],
      );
      expect(evaluateRelayRoute(mission, planned).complete).toBe(true);
    }
  });

  it("exposes local saves through a cloud-replaceable profile contract", () => {
    const repository = new LocalProfileRepository();
    expect(repository.kind).toBe("local");
    expect(repository.supportsAccounts).toBe(false);
    expect(typeof repository.load).toBe("function");
    expect(typeof repository.save).toBe("function");
  });

});

describe("Swarm boss balance", () => {
  it("gives starter pilots a meaningful boss fight window", () => {
    expect(getBossFightWindow()).toBeGreaterThanOrEqual(24);
    expect(SWARM_BALANCE.bossHp).toBeLessThanOrEqual(320);
  });

  it("reduces background swarm pressure while Ahr is active", () => {
    expect(getSwarmSpawnDelay(40, true)).toBeGreaterThan(getSwarmSpawnDelay(40, false));
  });

  it("keeps first Swarm runs gentle before rotating boss patterns", () => {
    expect(getSwarmRunVariant(0).id).toBe("cadet-patrol");
    expect(getSwarmRunVariant(1).id).toBe("cadet-patrol");
    expect(getSwarmRunVariant(2).bossPattern).toBe("aimed-fan");
    expect(getSwarmRunVariant(3).id).toBe("ion-rush");
  });

  it("does not count an idle auto-fire Swarm run as meaningful participation", () => {
    expect(hasMeaningfulSwarmParticipation({ won: false, movementDistance: 0, energy: 0, perkLevel: 1 })).toBe(false);
    expect(hasMeaningfulSwarmParticipation({ won: false, movementDistance: 700, energy: 0, perkLevel: 1 })).toBe(true);
    expect(hasMeaningfulSwarmParticipation({ won: false, movementDistance: 0, energy: 3, perkLevel: 1 })).toBe(true);
    expect(hasMeaningfulSwarmParticipation({ won: true, movementDistance: 0, energy: 0, perkLevel: 1 })).toBe(true);
  });
});
