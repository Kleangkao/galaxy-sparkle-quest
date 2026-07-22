export type PilotRole = "explorer" | "racer" | "guardian";
export type ToolEffect = "quickdraw" | "power" | "shield";

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
