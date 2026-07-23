export type PilotRole = "explorer" | "racer" | "guardian";
export type ToolEffect = "quickdraw" | "power" | "shield";
export type LoadoutPath = "Power" | "Speed" | "Survival";

interface ProgressionSnapshot {
  level: number;
  visitedPlanets: string[];
  activePilot: string;
  activeTool: string;
  modeRecords: { swarmHighScore: number; arcadeContracts: Record<string, { bestScore: number; clears: number }> };
}

export interface PilotDefinition {
  id: string;
  name: string;
  callsign: string;
  role: PilotRole;
  image: string;
  tagline: string;
  effect: string;
  crystalMultiplier?: number;
  missionTimeBonus?: number;
  failRewardMultiplier?: number;
  combatHullBonus?: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  family: string;
  image: string;
  effectType: ToolEffect;
  effect: string;
  combatDamage?: number;
  combatFireRate?: number;
  arcadeMagazineBonus?: number;
  arcadeReloadMultiplier?: number;
  combatHullBonus?: number;
}

export const PILOTS: PilotDefinition[] = [
  {
    id: "nova-reyes",
    name: "Nova Reyes",
    callsign: "Trailblazer",
    role: "explorer",
    image: "/assets/galia-soft-tech/nova-reyes-mud-pilot-v1.png",
    tagline: "Finds the useful path through impossible terrain.",
    effect: "+10% crystals from every activity",
    crystalMultiplier: 1.1,
  },
  {
    id: "k-rail",
    name: "K-RAIL",
    callsign: "Slipstream",
    role: "racer",
    image: "/assets/star-atlas/x3XLlY/01-joao-lira-ust-racer-robo1.webp",
    tagline: "Turns every countdown into a route worth mastering.",
    effect: "+6 seconds in Story, Swarm, and Arcade",
    missionTimeBonus: 6,
  },
  {
    id: "bastion-7",
    name: "Bastion-7",
    callsign: "Bulwark",
    role: "guardian",
    image: "/assets/star-atlas/bgenAm/01-joao-lira-cc-ust-m-combat-001.webp",
    tagline: "Gets the whole crew home when a mission turns rough.",
    effect: "+15 combat hull and keep 55% of failed Story rewards",
    failRewardMultiplier: 0.55,
    combatHullBonus: 15,
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    id: "echo-scanner",
    name: "Arc Pistol",
    family: "Pulse sidearm",
    image: "/assets/star-atlas/Qxm54E/02-vertpaint-studios-eng-pst-final-main-01.webp",
    effectType: "quickdraw",
    effect: "+2 Arcade rounds and 20% faster reloads",
    arcadeMagazineBonus: 2,
    arcadeReloadMultiplier: 0.8,
  },
  {
    id: "vector-drive",
    name: "Vector Rifle",
    family: "Kinetic rifle",
    image: "/assets/star-atlas/RqEw2E/03-vertpaint-studios-kin-ar-main-02.webp",
    effectType: "power",
    effect: "+20% weapon damage in Swarm and Arcade",
    combatDamage: 1.2,
  },
  {
    id: "aegis-projector",
    name: "Aegis Repeater",
    family: "Armored support weapon",
    image: "/assets/star-atlas/Z0gQ4X/02-vertpaint-studios-kin-gat-main-02.webp",
    effectType: "shield",
    effect: "+25 starting hull in Swarm Protocol",
    combatHullBonus: 25,
  },
];

export function getPilot(id: string | null | undefined) {
  return PILOTS.find((pilot) => pilot.id === id) ?? PILOTS[0];
}

export function getTool(id: string | null | undefined) {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0];
}

export function getToolModeSummary(tool: ToolDefinition, mode: "story" | "swarm" | "arcade") {
  if (mode === "story") return "Weapons do not modify Story exploration";
  const applies =
    (mode === "swarm" && Boolean(tool.combatDamage || tool.combatFireRate || tool.combatHullBonus)) ||
    (mode === "arcade" && Boolean(tool.combatDamage || tool.combatFireRate || tool.arcadeMagazineBonus || tool.arcadeReloadMultiplier));
  return applies ? tool.effect : `No ${mode === "swarm" ? "Swarm" : "Arcade"} bonus · switch in Crew Hangar`;
}

export function hasArcadeClear(state: ProgressionSnapshot) {
  return Object.values(state.modeRecords.arcadeContracts).some((record) => record.clears > 0);
}

export function getPilotUnlock(id: string, state: ProgressionSnapshot) {
  if (id === "nova-reyes" || state.activePilot === id) return { unlocked: true, requirement: "Starter pilot" };
  if (id === "k-rail") return { unlocked: state.visitedPlanets.length >= 2 || hasArcadeClear(state), requirement: "Clear Story chapter 2 or one Arcade contract" };
  return { unlocked: state.visitedPlanets.length >= 4 || state.modeRecords.swarmHighScore >= 1500, requirement: "Clear Story chapter 4 or score 1,500 in Swarm" };
}

export function getToolUnlock(id: string, state: ProgressionSnapshot) {
  if (id === "echo-scanner" || state.activeTool === id) return { unlocked: true, requirement: "Starter weapon" };
  if (id === "vector-drive") return { unlocked: state.level >= 2 || hasArcadeClear(state), requirement: "Reach captain level 2 or clear one Arcade contract" };
  return { unlocked: state.level >= 3 || state.modeRecords.swarmHighScore >= 1500, requirement: "Reach captain level 3 or score 1,500 in Swarm" };
}

export function getLoadoutPath(pilotId: string, toolId: string): LoadoutPath {
  if (pilotId === "bastion-7" || toolId === "aegis-projector") return "Survival";
  if (pilotId === "k-rail" || toolId === "echo-scanner") return "Speed";
  return "Power";
}
