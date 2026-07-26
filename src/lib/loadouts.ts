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
  callsignTh: string;
  role: PilotRole;
  roleTh: string;
  image: string;
  tagline: string;
  taglineTh: string;
  effect: string;
  effectTh: string;
  crystalMultiplier?: number;
  missionTimeBonus?: number;
  failRewardMultiplier?: number;
  combatHullBonus?: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  family: string;
  familyTh: string;
  image: string;
  effectType: ToolEffect;
  effect: string;
  effectTh: string;
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
    callsignTh: "ผู้บุกเบิก",
    role: "explorer",
    roleTh: "นักสำรวจ",
    image: "/assets/galia-current/nova-reyes-mud-pilot-v2.webp",
    tagline: "Finds the useful path through impossible terrain.",
    taglineTh: "มองเห็นเส้นทางที่ปลอดภัย แม้ในพื้นที่ที่ผ่านยาก",
    effect: "+10% crystals from every activity",
    effectTh: "รับคริสตัลเพิ่ม 10% จากทุกโหมด",
    crystalMultiplier: 1.1,
  },
  {
    id: "k-rail",
    name: "K-RAIL",
    callsign: "Slipstream",
    callsignTh: "จ้าวความเร็ว",
    role: "racer",
    roleTh: "นักแข่ง",
    image: "/assets/galia-current/k-rail-ustur-racer-v2.webp",
    tagline: "Turns every countdown into a route worth mastering.",
    taglineTh: "เพิ่มเวลาให้ภารกิจ เพื่อวางเส้นทางได้ง่ายขึ้น",
    effect: "+6 seconds in Story, Swarm, and Arcade",
    effectTh: "เพิ่มเวลา 6 วินาทีในเนื้อเรื่อง ฝ่าฝูงศัตรู และยิงเป้า",
    missionTimeBonus: 6,
  },
  {
    id: "bastion-7",
    name: "Bastion-7",
    callsign: "Bulwark",
    callsignTh: "เกราะแนวหน้า",
    role: "guardian",
    roleTh: "ผู้พิทักษ์",
    image: "/assets/galia-current/bastion-7-ustur-guardian-v2.webp",
    tagline: "Gets the whole crew home when a mission turns rough.",
    taglineTh: "ช่วยให้ทีมรอดกลับมา เมื่อภารกิจเริ่มอันตราย",
    effect: "+15 combat hull and keep 55% of failed Story rewards",
    effectTh: "พลังป้องกันต่อสู้ +15 และเก็บรางวัลเนื้อเรื่องไว้ 55% เมื่อพลาด",
    failRewardMultiplier: 0.55,
    combatHullBonus: 15,
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    id: "echo-scanner",
    name: "Arc Pistol",
    family: "Pulse sidearm",
    familyTh: "ปืนพกพลังงาน",
    image: "/assets/galia-current/arc-pistol-tool-v2.webp",
    effectType: "quickdraw",
    effect: "+2 Arcade rounds and 20% faster reloads",
    effectTh: "กระสุนยิงเป้า +2 นัด และรีโหลดเร็วขึ้น 20%",
    arcadeMagazineBonus: 2,
    arcadeReloadMultiplier: 0.8,
  },
  {
    id: "vector-drive",
    name: "Vector Rifle",
    family: "Kinetic rifle",
    familyTh: "ไรเฟิลจลน์",
    image: "/assets/galia-current/vector-rifle-tool-v2.webp",
    effectType: "power",
    effect: "+20% weapon damage in Swarm and Arcade",
    effectTh: "ความแรงอาวุธ +20% ในฝ่าฝูงศัตรูและยิงเป้า",
    combatDamage: 1.2,
  },
  {
    id: "aegis-projector",
    name: "Aegis Repeater",
    family: "Armored support weapon",
    familyTh: "ปืนสนับสนุนเกราะหนัก",
    image: "/assets/galia-current/aegis-repeater-tool-v2.webp",
    effectType: "shield",
    effect: "+25 starting hull in Swarm Protocol",
    effectTh: "พลังป้องกันเริ่มต้น +25 ในฝ่าฝูงศัตรู",
    combatHullBonus: 25,
  },
];

export function getPilot(id: string | null | undefined) {
  return PILOTS.find((pilot) => pilot.id === id) ?? PILOTS[0];
}

export function getTool(id: string | null | undefined) {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0];
}

export function getPilotRole(pilot: PilotDefinition, lang: "en" | "th") {
  return lang === "th" ? pilot.roleTh : pilot.role;
}

export function getPilotCallsign(pilot: PilotDefinition, lang: "en" | "th") {
  return lang === "th" ? pilot.callsignTh : pilot.callsign;
}

export function getPilotTagline(pilot: PilotDefinition, lang: "en" | "th") {
  return lang === "th" ? pilot.taglineTh : pilot.tagline;
}

export function getPilotEffect(pilot: PilotDefinition, lang: "en" | "th") {
  return lang === "th" ? pilot.effectTh : pilot.effect;
}

export function getToolFamily(tool: ToolDefinition, lang: "en" | "th") {
  return lang === "th" ? tool.familyTh : tool.family;
}

export function getToolEffect(tool: ToolDefinition, lang: "en" | "th") {
  return lang === "th" ? tool.effectTh : tool.effect;
}

export function getToolModeSummary(tool: ToolDefinition, mode: "story" | "swarm" | "arcade", lang: "en" | "th" = "en") {
  if (mode === "story") return lang === "th" ? "อาวุธไม่มีผลกับการสำรวจในเนื้อเรื่อง" : "Weapons do not modify Story exploration";
  const applies =
    (mode === "swarm" && Boolean(tool.combatDamage || tool.combatFireRate || tool.combatHullBonus)) ||
    (mode === "arcade" && Boolean(tool.combatDamage || tool.combatFireRate || tool.arcadeMagazineBonus || tool.arcadeReloadMultiplier));
  if (applies) return getToolEffect(tool, lang);
  if (lang === "th") return `ไม่มีโบนัสใน${mode === "swarm" ? "ฝ่าฝูงศัตรู" : "ยิงเป้า"} · เปลี่ยนได้ที่หน้าจัดทีม`;
  return `No ${mode === "swarm" ? "Swarm" : "Arcade"} bonus · switch in Crew Hangar`;
}

export function hasArcadeClear(state: ProgressionSnapshot) {
  return Object.values(state.modeRecords.arcadeContracts).some((record) => record.clears > 0);
}

export function getPilotUnlock(id: string, state: ProgressionSnapshot) {
  if (id === "nova-reyes" || state.activePilot === id) return { unlocked: true, requirement: "Starter pilot", requirementTh: "นักบินเริ่มต้น" };
  if (id === "k-rail") return { unlocked: state.visitedPlanets.length >= 2 || hasArcadeClear(state), requirement: "Clear Story chapter 2 or one Arcade contract", requirementTh: "ผ่านเนื้อเรื่องบท 2 หรือภารกิจยิงเป้า 1 ภารกิจ" };
  return { unlocked: state.visitedPlanets.length >= 4 || state.modeRecords.swarmHighScore >= 1500, requirement: "Clear Story chapter 4 or score 1,500 in Swarm", requirementTh: "ผ่านเนื้อเรื่องบท 4 หรือทำ 1,500 คะแนนในฝ่าฝูงศัตรู" };
}

export function getToolUnlock(id: string, state: ProgressionSnapshot) {
  if (id === "echo-scanner" || state.activeTool === id) return { unlocked: true, requirement: "Starter weapon", requirementTh: "อาวุธเริ่มต้น" };
  if (id === "vector-drive") return { unlocked: state.level >= 2 || hasArcadeClear(state), requirement: "Reach captain level 2 or clear one Arcade contract", requirementTh: "ถึงเลเวล 2 หรือผ่านภารกิจยิงเป้า 1 ภารกิจ" };
  return { unlocked: state.level >= 3 || state.modeRecords.swarmHighScore >= 1500, requirement: "Reach captain level 3 or score 1,500 in Swarm", requirementTh: "ถึงเลเวล 3 หรือทำ 1,500 คะแนนในฝ่าฝูงศัตรู" };
}

export function getLoadoutPath(pilotId: string, toolId: string): LoadoutPath {
  if (pilotId === "bastion-7" || toolId === "aegis-projector") return "Survival";
  if (pilotId === "k-rail" || toolId === "echo-scanner") return "Speed";
  return "Power";
}

export function getLoadoutPathLabel(pilotId: string, toolId: string, lang: "en" | "th") {
  const path = getLoadoutPath(pilotId, toolId);
  if (lang === "en") return path;
  return path === "Power" ? "สายพลัง" : path === "Speed" ? "สายความเร็ว" : "สายเอาตัวรอด";
}
