export type PilotRole = "explorer" | "racer" | "guardian";
export type ToolEffect = "discovery" | "time" | "shield";

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
}

export interface ToolDefinition {
  id: string;
  name: string;
  family: string;
  image: string;
  effectType: ToolEffect;
  effect: string;
}

export const PILOTS: PilotDefinition[] = [
  {
    id: "nova-reyes",
    name: "Nova Reyes",
    callsign: "Trailblazer",
    role: "explorer",
    image: "/assets/galia-soft-tech/nova-reyes-mud-pilot-v1.png",
    tagline: "Finds the useful path through impossible terrain.",
    effect: "+10% expedition salvage",
    crystalMultiplier: 1.1,
  },
  {
    id: "k-rail",
    name: "K-RAIL",
    callsign: "Slipstream",
    role: "racer",
    image: "/assets/star-atlas/x3XLlY/01-joao-lira-ust-racer-robo1.webp",
    tagline: "Turns every countdown into a route worth mastering.",
    effect: "+6 seconds on every mission",
    missionTimeBonus: 6,
  },
  {
    id: "bastion-7",
    name: "Bastion-7",
    callsign: "Bulwark",
    role: "guardian",
    image: "/assets/star-atlas/bgenAm/01-joao-lira-cc-ust-m-combat-001.webp",
    tagline: "Gets the whole crew home when a mission turns rough.",
    effect: "Keep at least 55% of rewards on a failed run",
    failRewardMultiplier: 0.55,
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    id: "echo-scanner",
    name: "Echo Scanner",
    family: "Energy sidearm",
    image: "/assets/star-atlas/Qxm54E/02-vertpaint-studios-eng-pst-final-main-01.webp",
    effectType: "discovery",
    effect: "+12% companion and egg discovery chance",
  },
  {
    id: "vector-drive",
    name: "Vector Drive",
    family: "Kinetic rifle",
    image: "/assets/star-atlas/RqEw2E/03-vertpaint-studios-kin-ar-main-02.webp",
    effectType: "time",
    effect: "+4 seconds on mission timers",
  },
  {
    id: "aegis-projector",
    name: "Aegis Projector",
    family: "Kinetic support tool",
    image: "/assets/star-atlas/Z0gQ4X/02-vertpaint-studios-kin-gat-main-02.webp",
    effectType: "shield",
    effect: "Failed runs keep at least 50% of rewards",
  },
];

export function getPilot(id: string | null | undefined) {
  return PILOTS.find((pilot) => pilot.id === id) ?? PILOTS[0];
}

export function getTool(id: string | null | undefined) {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0];
}
