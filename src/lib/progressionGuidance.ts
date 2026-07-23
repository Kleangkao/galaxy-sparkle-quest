import { GameState, PLANETS, SHIP_UPGRADES, getUpgradeCost, getUpgradeTier, isPlanetUnlocked } from "@/lib/gameState";
import { getPilotUnlock, getToolUnlock, PILOTS, TOOLS } from "@/lib/loadouts";
import type { PlayMode } from "@/components/ModeHub";

export interface ProgressGoal {
  title: string;
  detail: string;
  mode: PlayMode;
  progress: number;
}

export function getProgressGoal(state: GameState): ProgressGoal {
  const nextChapter = PLANETS.find((planet) => !state.visitedPlanets.includes(planet.id));
  if (nextChapter && isPlanetUnlocked(nextChapter, state.level, state.faction)) {
    return { title: `Continue Story chapter ${nextChapter.unlockLevel}`, detail: "First clears give the strongest campaign rewards.", mode: "story", progress: state.visitedPlanets.length / PLANETS.length };
  }
  const lockedPilot = PILOTS.find((pilot) => !getPilotUnlock(pilot.id, state).unlocked);
  if (lockedPilot) return { title: `Unlock ${lockedPilot.name}`, detail: getPilotUnlock(lockedPilot.id, state).requirement, mode: lockedPilot.id === "bastion-7" ? "swarm" : "arcade", progress: lockedPilot.id === "bastion-7" ? Math.min(1, state.modeRecords.swarmHighScore / 1500) : Math.min(1, state.visitedPlanets.length / 2) };
  const lockedTool = TOOLS.find((tool) => !getToolUnlock(tool.id, state).unlocked);
  if (lockedTool) return { title: `Unlock ${lockedTool.name}`, detail: getToolUnlock(lockedTool.id, state).requirement, mode: lockedTool.id === "aegis-projector" ? "swarm" : "arcade", progress: Math.min(1, state.level / 3) };
  const upgrade = SHIP_UPGRADES.find((item) => getUpgradeTier(state, item.id) < 3);
  if (upgrade) {
    const tier = getUpgradeTier(state, upgrade.id);
    const cost = getUpgradeCost(upgrade, tier);
    return { title: `${upgrade.name} Tier ${tier + 1}`, detail: `${Math.max(0, cost - state.crystals)} more crystals needed in the Crew Hangar.`, mode: state.modeRecords.discoveryFinds < 18 ? "discovery" : "swarm", progress: Math.min(1, state.crystals / cost) };
  }
  return { title: "Master the frontier", detail: "Push a favorite record and complete the ten-chapter campaign.", mode: "story", progress: state.visitedPlanets.length / PLANETS.length };
}

export function getFreshUnlocks(state: GameState) {
  const unlocks: string[] = [];
  PILOTS.forEach((pilot) => { if (pilot.id !== "nova-reyes" && getPilotUnlock(pilot.id, state).unlocked) unlocks.push(`${pilot.name} pilot available`); });
  TOOLS.forEach((tool) => { if (tool.id !== "echo-scanner" && getToolUnlock(tool.id, state).unlocked) unlocks.push(`${tool.name} available`); });
  if (state.modeRecords.swarmHighScore >= 1500) unlocks.push("Swarm Hull: +1 Story HP active");
  if (Object.values(state.modeRecords.arcadeContracts).some((record) => record.clears > 0)) unlocks.push("Arcade Dash active in Story");
  if (state.modeRecords.discoveryFinds >= 18) unlocks.push("Field Scanner: +10% companion chance");
  if (state.modeRecords.strategyObjectives >= 2) unlocks.push("Frontier Network: +10% crystals");
  return [...new Set(unlocks)].slice(-3);
}

export function getStoryReplayMultiplier(alreadyVisited: boolean) {
  return alreadyVisited ? 0.55 : 1;
}
