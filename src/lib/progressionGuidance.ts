import { GameState, PLANETS, SHIP_UPGRADES, getUpgradeCost, getUpgradeTier, isPlanetUnlocked } from "@/lib/gameState";
import { getPilotUnlock, getToolUnlock, PILOTS, TOOLS } from "@/lib/loadouts";
import type { PlayMode } from "@/components/ModeHub";

export interface ProgressGoal {
  title: string;
  titleTh: string;
  detail: string;
  detailTh: string;
  mode: PlayMode;
  progress: number;
}

export function getProgressGoal(state: GameState): ProgressGoal {
  const nextChapter = PLANETS.find((planet) => !state.visitedPlanets.includes(planet.id));
  if (nextChapter && isPlanetUnlocked(nextChapter, state.level, state.faction)) {
    return { title: `Continue Story chapter ${nextChapter.unlockLevel}`, titleTh: `เล่นเนื้อเรื่องบทที่ ${nextChapter.unlockLevel} ต่อ`, detail: "First clears give the strongest campaign rewards.", detailTh: "การผ่านครั้งแรกจะได้รางวัลมากที่สุด", mode: "story", progress: state.visitedPlanets.length / PLANETS.length };
  }
  const lockedPilot = PILOTS.find((pilot) => !getPilotUnlock(pilot.id, state).unlocked);
  if (lockedPilot) return { title: `Unlock ${lockedPilot.name}`, titleTh: `ปลดล็อก ${lockedPilot.name}`, detail: getPilotUnlock(lockedPilot.id, state).requirement, detailTh: getPilotUnlock(lockedPilot.id, state).requirementTh, mode: lockedPilot.id === "bastion-7" ? "swarm" : "arcade", progress: lockedPilot.id === "bastion-7" ? Math.min(1, state.modeRecords.swarmHighScore / 1500) : Math.min(1, state.visitedPlanets.length / 2) };
  const lockedTool = TOOLS.find((tool) => !getToolUnlock(tool.id, state).unlocked);
  if (lockedTool) return { title: `Unlock ${lockedTool.name}`, titleTh: `ปลดล็อก ${lockedTool.name}`, detail: getToolUnlock(lockedTool.id, state).requirement, detailTh: getToolUnlock(lockedTool.id, state).requirementTh, mode: lockedTool.id === "aegis-projector" ? "swarm" : "arcade", progress: Math.min(1, state.level / 3) };
  const upgrade = SHIP_UPGRADES.find((item) => getUpgradeTier(state, item.id) < 3);
  if (upgrade) {
    const tier = getUpgradeTier(state, upgrade.id);
    const cost = getUpgradeCost(upgrade, tier);
    return { title: `${upgrade.name} Tier ${tier + 1}`, titleTh: `${upgrade.nameTh} ขั้น ${tier + 1}`, detail: `${Math.max(0, cost - state.crystals)} more crystals needed in the Crew Hangar.`, detailTh: `หาอีก ${Math.max(0, cost - state.crystals)} คริสตัล แล้วอัปเกรดได้ที่หน้าจัดทีม`, mode: "swarm", progress: Math.min(1, state.crystals / cost) };
  }
  return { title: "Master the frontier", titleTh: "ออกสำรวจกาเลียให้ครบ", detail: "Push a favorite record and complete the ten-chapter campaign.", detailTh: "ทำสถิติโหมดที่ชอบ แล้วผ่านเนื้อเรื่องให้ครบ 10 บท", mode: "story", progress: state.visitedPlanets.length / PLANETS.length };
}

export function getFreshUnlocks(state: GameState, lang: "en" | "th" = "en") {
  const unlocks: string[] = [];
  PILOTS.forEach((pilot) => {
    if (pilot.id !== "nova-reyes" && getPilotUnlock(pilot.id, state).unlocked) {
      unlocks.push(lang === "th" ? `ปลดล็อกนักบิน ${pilot.name} แล้ว` : `${pilot.name} pilot available`);
    }
  });
  TOOLS.forEach((tool) => {
    if (tool.id !== "echo-scanner" && getToolUnlock(tool.id, state).unlocked) {
      unlocks.push(lang === "th" ? `ปลดล็อกอาวุธ ${tool.name} แล้ว` : `${tool.name} available`);
    }
  });
  if (state.modeRecords.swarmHighScore >= 1500) unlocks.push(lang === "th" ? "เริ่มเนื้อเรื่องด้วยพลังยาน +1" : "Swarm Hull: +1 Story HP active");
  if (Object.values(state.modeRecords.arcadeContracts).some((record) => record.clears > 0)) unlocks.push(lang === "th" ? "เริ่มเนื้อเรื่องพร้อมพุ่ง 1 ครั้ง" : "Arcade Dash active in Story");
  return [...new Set(unlocks)].slice(-3);
}

export function getStoryReplayMultiplier(alreadyVisited: boolean) {
  return alreadyVisited ? 0.55 : 1;
}
