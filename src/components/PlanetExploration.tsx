/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Boxes, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Gem, Landmark, Map as MapIcon, Navigation, Orbit, Package, PawPrint, Rocket, Skull, Sparkles as SparklesIcon, Star, Zap } from "lucide-react";
import { playCrystalSound, playChestSound, playRobotSound, playPetDiscoverySound, playStepSound, playVictorySound, playFailSound, playImpactSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";
import { getStoryStepCount, isOrthogonallyAdjacent } from "@/lib/storyMovement";
import GaliaSprite from "@/components/GaliaSprite";
import { getReachableStoryCellKeys } from "@/lib/storyMap";
import { countStoryObjectiveItems, evaluateStoryObjective } from "@/lib/storyObjectives";

// ─── Types ───────────────────────────────────────────────────────
export interface ExplorationItem {
  id: string;
  type: "crystal" | "chest" | "pet" | "robot" | "star" | "relic" | "hidden";
  emoji: string;
  collected: boolean;
  revealed: boolean; // hidden items must be revealed first
  row: number;
  col: number;
  value: number;
}

export interface PlanetTheme {
  name: string;
  bgGradient: string;
  groundEmojis: string[];
  decorEmojis: string[];
  items: { type: ExplorationItem["type"]; emoji: string; value: number; count: number }[];
  ambientEmoji: string;
  timeLimit: number;
  hiddenItemEmoji?: string; // emoji shown when a hidden item is revealed
}

type Coord = [number, number];

export interface MissionProfile {
  name: string;
  objective: string;
  duration: number;
  crystalGoal?: number;
  goalItemType?: ExplorationItem["type"];
  petGoal?: number;
  deliveryGoal?: number;
  requireReturn: boolean;
  walls?: Coord[];
  hazards?: Coord[];
  speedTiles?: Coord[];
  dropZones?: Coord[];
  teleportPairs?: [Coord, Coord][];
  enemyCount?: number;
  nodeGoal?: number;
  bossName?: string;
  trailSequence?: boolean;
  patrolVision?: boolean;
}

interface CollectEffect {
  id: string;
  emoji: string;
  value: number;
  x: number;
  y: number;
  type: "collect" | "sparkle" | "chest" | "robot" | "pet";
}

interface SparkleParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  delay: number;
}

interface DamageNotice {
  id: string;
  row: number;
  col: number;
  text: string;
}

function getMoveDirectionFromKeyboard(event: KeyboardEvent): "up" | "down" | "left" | "right" | null {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (key === "arrowup" || key === "w" || code === "KeyW") return "up";
  if (key === "arrowdown" || key === "s" || code === "KeyS") return "down";
  if (key === "arrowleft" || key === "a" || code === "KeyA") return "left";
  if (key === "arrowright" || key === "d" || code === "KeyD") return "right";
  return null;
}

export const MISSION_PROFILES: Record<string, MissionProfile> = {
  "sparkle-moon": {
    name: "Crystal Flight School",
    objective: "Learn movement, collect 5 crystals, then return to your ship.",
    duration: 50,
    crystalGoal: 5,
    goalItemType: "crystal",
    requireReturn: true,
  },
  "candy-planet": {
    name: "Living Signal Hunt",
    objective: "Follow the highlighted signal trail in order through the coral maze.",
    duration: 60,
    crystalGoal: 6,
    goalItemType: "crystal",
    requireReturn: false,
    trailSequence: true,
    walls: [
      [1, 2], [1, 3], [1, 4], [1, 5],
      [3, 1], [3, 2], [3, 4], [3, 5],
      [5, 2], [5, 3], [5, 4],
    ],
  },
  "frosty-star": {
    name: "Slipstream Route",
    objective: "Navigate the ice lanes one tile at a time and collect 8 navigation shards.",
    duration: 45,
    crystalGoal: 8,
    goalItemType: "crystal",
    requireReturn: false,
    walls: [[1, 3], [2, 3], [4, 4], [5, 4]],
  },
  "jungle-world": {
    name: "Silent Canopy",
    objective: "Collect 8 vault keys while evading two guardian patrols.",
    duration: 65,
    crystalGoal: 8,
    goalItemType: "relic",
    requireReturn: false,
    hazards: [[1, 1], [1, 6], [2, 3], [3, 4], [4, 2], [5, 5]],
    enemyCount: 2,
    patrolVision: true,
  },
  "rainbow-nebula": {
    name: "Prism Warden",
    objective: "Activate 5 prism nodes to break the Warden shield.",
    duration: 65,
    nodeGoal: 5,
    requireReturn: false,
    enemyCount: 1,
    bossName: "Prism Warden",
    speedTiles: [[1, 3], [2, 6], [4, 1], [5, 4], [6, 2]],
  },
  "bubbly-bay": {
    name: "Pressure Payload",
    objective: "Collect 6 pressure blooms and deliver charges to both habitat valves.",
    duration: 70,
    crystalGoal: 6,
    goalItemType: "crystal",
    deliveryGoal: 2,
    dropZones: [[0, 1], [0, 6]],
    requireReturn: false,
    enemyCount: 1,
  },
  "cookie-crater": {
    name: "Crater Surge",
    objective: "Collect 6 stabilizers and survive the collapsing hazard field.",
    duration: 65,
    crystalGoal: 6,
    goalItemType: "crystal",
    requireReturn: true,
    hazards: [[1, 1], [1, 6], [2, 3], [3, 4], [4, 2], [5, 5]],
    enemyCount: 1,
  },
  "starlight-shore": {
    name: "Starlight Rescue",
    objective: "Recover a companion signal, collect 7 relay stars, and activate the exit node.",
    duration: 70,
    crystalGoal: 7,
    goalItemType: "star",
    petGoal: 1,
    nodeGoal: 1,
    speedTiles: [[6, 2]],
    requireReturn: false,
    walls: [[1, 4], [2, 4], [3, 4], [4, 4]],
  },
  "crystal-cave": {
    name: "Frontier Decision",
    objective: "Commit to your chosen route, charge two gates, and secure 6 core fragments.",
    duration: 80,
    crystalGoal: 6,
    goalItemType: "crystal",
    deliveryGoal: 2,
    nodeGoal: 2,
    requireReturn: false,
    enemyCount: 2,
    dropZones: [[0, 1], [0, 6]],
    speedTiles: [[6, 1], [6, 6]],
  },
  "golden-galaxy": {
    name: "Aurora Core Finale",
    objective: "Charge both gate nodes, recover pet intel, collect 8 cores, and escape.",
    duration: 90,
    crystalGoal: 8,
    goalItemType: "crystal",
    petGoal: 1,
    requireReturn: true,
    enemyCount: 2,
    nodeGoal: 2,
    bossName: "Aurora Core",
    // Keep the original chaos shape, but remove one damage tile for fairness.
    hazards: [[1, 1], [1, 6], [3, 2], [4, 5], [5, 1], [5, 6]],
    walls: [[2, 2], [2, 3], [2, 5], [3, 5], [4, 2], [4, 3], [5, 4]],
    speedTiles: [[6, 1], [6, 6]],
    teleportPairs: [[[0, 0], [7, 7]]],
  },
};

export const STORY_MISSION_TH: Record<string, { name: string; objective: string }> = {
  "sparkle-moon": { name: "ฝึกบินในถ้ำคริสตัล", objective: "ฝึกเดิน เก็บคริสตัล 5 ชิ้น แล้วกลับมาที่ยาน" },
  "candy-planet": { name: "ตามรอยสัญญาณมีชีวิต", objective: "เก็บสัญญาณตามลำดับที่ไฮไลต์ไว้" },
  "frosty-star": { name: "เส้นทางน้ำแข็ง", objective: "เดินทีละช่องและเก็บชิ้นส่วนนำทาง 8 ชิ้น" },
  "jungle-world": { name: "ป่าเงียบ", objective: "เก็บกุญแจ 8 ชิ้น พร้อมหลบหน่วยลาดตระเวน" },
  "rainbow-nebula": { name: "ผู้พิทักษ์ปริซึม", objective: "เปิดโหนดปริซึม 5 จุดเพื่อทำลายเกราะ" },
  "bubbly-bay": { name: "ส่งพลังแรงดัน", objective: "เก็บพลัง 6 ชิ้น แล้วส่งให้วาล์วทั้ง 2 จุด" },
  "cookie-crater": { name: "คลื่นพลังปล่องดาว", objective: "เก็บตัวปรับเสถียร 6 ชิ้น หลบพื้นที่อันตราย แล้วกลับยาน" },
  "starlight-shore": { name: "ช่วยเหลือชายฝั่งดาว", objective: "พบเพื่อน เก็บดาว 7 ดวง และเปิดโหนดทางออก" },
  "crystal-cave": { name: "ภารกิจแนวหน้า", objective: "ชาร์จประตู 2 จุด และเก็บแกนคริสตัล 6 ชิ้น" },
  "golden-galaxy": { name: "ศึกสุดท้ายแกนออโรรา", objective: "เปิดประตูทั้งสอง พบเพื่อน เก็บแกน 8 ชิ้น แล้วกลับยาน" },
};

const STORY_THEME_TH: Record<string, string> = {
  "sparkle-moon": "ถ้ำคริสตัล",
  "candy-planet": "เทือกเขาปะการัง",
  "frosty-star": "โลกน้ำแข็ง",
  "jungle-world": "ป่าต่างดาว",
  "rainbow-nebula": "หมู่เกาะลอยฟ้า",
  "bubbly-bay": "มหาสมุทรฟองแสง",
  "cookie-crater": "ปล่องดาวสีอำพัน",
  "starlight-shore": "ชายฝั่งแสงดาว",
  "crystal-cave": "ถ้ำคริสตัลชั้นลึก",
  "golden-galaxy": "เขตแกนออโรรา",
};

// ─── Planet Themes ───────────────────────────────────────────────
export const PLANET_THEMES: Record<string, PlanetTheme> = {
  "sparkle-moon": {
    name: "Crystal Caves",
    bgGradient: "from-indigo-950 via-purple-950 to-slate-950",
    groundEmojis: ["🪨", "⬛", "🌑"],
    decorEmojis: ["✨", "💫"],
    items: [
      { type: "crystal", emoji: "💎", value: 3, count: 6 },
      { type: "crystal", emoji: "🔮", value: 2, count: 4 },
      { type: "chest", emoji: "🧳", value: 5, count: 3 },
      { type: "robot", emoji: "🤖", value: 0, count: 2 },
      { type: "hidden", emoji: "💠", value: 4, count: 3 },
    ],
    ambientEmoji: "✨",
    timeLimit: 60,
    hiddenItemEmoji: "🪨",
  },
  "candy-planet": {
    name: "Candy Mountains",
    bgGradient: "from-pink-950 via-rose-950 to-fuchsia-950",
    groundEmojis: ["🍬", "🍫", "🧁"],
    decorEmojis: ["🍭", "🎀"],
    items: [
      { type: "crystal", emoji: "💎", value: 2, count: 7 },
      { type: "pet", emoji: "👽", value: 4, count: 2 },
      { type: "chest", emoji: "🎁", value: 5, count: 3 },
      { type: "star", emoji: "⭐", value: 1, count: 4 },
      { type: "robot", emoji: "🤖", value: 0, count: 1 },
      { type: "hidden", emoji: "🍭", value: 3, count: 3 },
    ],
    ambientEmoji: "🍬",
    timeLimit: 60,
    hiddenItemEmoji: "🍫",
  },
  "frosty-star": {
    name: "Ice World",
    bgGradient: "from-cyan-950 via-sky-950 to-blue-950",
    groundEmojis: ["🧊", "❄️", "🌨️"],
    decorEmojis: ["⛄", "🏔️"],
    items: [
      { type: "crystal", emoji: "💠", value: 3, count: 8 },
      { type: "chest", emoji: "📦", value: 6, count: 3 },
      { type: "robot", emoji: "🤖", value: 0, count: 2 },
      { type: "star", emoji: "🌟", value: 2, count: 4 },
      { type: "hidden", emoji: "❄️", value: 4, count: 2 },
    ],
    ambientEmoji: "❄️",
    timeLimit: 55,
    hiddenItemEmoji: "🧊",
  },
  "jungle-world": {
    name: "Alien Jungle",
    bgGradient: "from-green-950 via-emerald-950 to-teal-950",
    groundEmojis: ["🌿", "🍃", "🌴"],
    decorEmojis: ["🦜", "🌺"],
    items: [
      { type: "relic", emoji: "🏺", value: 5, count: 8 },
      { type: "crystal", emoji: "💎", value: 2, count: 5 },
      { type: "pet", emoji: "🦎", value: 4, count: 2 },
      { type: "chest", emoji: "🗝️", value: 3, count: 3 },
      { type: "robot", emoji: "🤖", value: 0, count: 1 },
      { type: "hidden", emoji: "🏛️", value: 6, count: 2 },
    ],
    ambientEmoji: "🌿",
    timeLimit: 65,
    hiddenItemEmoji: "🌿",
  },
  "rainbow-nebula": {
    name: "Floating Islands",
    bgGradient: "from-violet-950 via-purple-950 to-indigo-950",
    groundEmojis: ["☁️", "🌤️", "💨"],
    decorEmojis: ["🌈", "🦋"],
    items: [
      { type: "star", emoji: "🌈", value: 3, count: 5 },
      { type: "crystal", emoji: "💎", value: 2, count: 4 },
      { type: "chest", emoji: "🎁", value: 5, count: 3 },
      { type: "pet", emoji: "🦋", value: 4, count: 2 },
      { type: "robot", emoji: "🤖", value: 0, count: 1 },
    ],
    ambientEmoji: "🌈",
    timeLimit: 60,
  },
  "bubbly-bay": {
    name: "Bubble Ocean",
    bgGradient: "from-blue-950 via-cyan-950 to-teal-950",
    groundEmojis: ["🫧", "🌊", "🐚"],
    decorEmojis: ["🐠", "🪸"],
    items: [
      { type: "crystal", emoji: "🔵", value: 2, count: 6 },
      { type: "chest", emoji: "🧳", value: 5, count: 3 },
      { type: "pet", emoji: "🐙", value: 4, count: 1 },
      { type: "star", emoji: "⭐", value: 2, count: 4 },
      { type: "robot", emoji: "🤖", value: 0, count: 1 },
      { type: "hidden", emoji: "🐚", value: 3, count: 2 },
    ],
    ambientEmoji: "🫧",
    timeLimit: 60,
  },
  "cookie-crater": {
    name: "Cookie Craters",
    bgGradient: "from-orange-950 via-amber-950 to-yellow-950",
    groundEmojis: ["🍪", "🥮", "🧇"],
    decorEmojis: ["🍩", "🧁"],
    items: [
      { type: "crystal", emoji: "💎", value: 2, count: 6 },
      { type: "chest", emoji: "🎁", value: 6, count: 3 },
      { type: "pet", emoji: "🐻", value: 4, count: 1 },
      { type: "robot", emoji: "🤖", value: 0, count: 2 },
      { type: "star", emoji: "⭐", value: 2, count: 3 },
      { type: "hidden", emoji: "🍩", value: 4, count: 2 },
    ],
    ambientEmoji: "🍪",
    timeLimit: 60,
    hiddenItemEmoji: "🍪",
  },
  "starlight-shore": {
    name: "Starlight Beach",
    bgGradient: "from-yellow-950 via-amber-950 to-orange-950",
    groundEmojis: ["🏖️", "🐚", "⭐"],
    decorEmojis: ["🌅", "🌴"],
    items: [
      { type: "star", emoji: "🌟", value: 3, count: 7 },
      { type: "crystal", emoji: "💎", value: 2, count: 4 },
      { type: "chest", emoji: "🧳", value: 5, count: 3 },
      { type: "pet", emoji: "🐚", value: 3, count: 1 },
      { type: "robot", emoji: "🤖", value: 0, count: 1 },
    ],
    ambientEmoji: "⭐",
    timeLimit: 60,
  },
  "crystal-cave": {
    name: "Deep Crystal Caves",
    bgGradient: "from-cyan-950 via-blue-950 to-indigo-950",
    groundEmojis: ["🪨", "💎", "⬛"],
    decorEmojis: ["🔮", "💠"],
    items: [
      { type: "crystal", emoji: "💎", value: 4, count: 7 },
      { type: "relic", emoji: "🏺", value: 6, count: 2 },
      { type: "chest", emoji: "📦", value: 5, count: 3 },
      { type: "pet", emoji: "🦊", value: 4, count: 1 },
      { type: "robot", emoji: "🤖", value: 0, count: 2 },
      { type: "hidden", emoji: "💠", value: 5, count: 3 },
    ],
    ambientEmoji: "💎",
    timeLimit: 65,
  },
  "golden-galaxy": {
    name: "Golden Galaxy",
    bgGradient: "from-yellow-950 via-amber-950 to-orange-950",
    groundEmojis: ["✨", "🌟", "⭐"],
    decorEmojis: ["👑", "🏆"],
    items: [
      { type: "crystal", emoji: "💎", value: 5, count: 8 },
      { type: "chest", emoji: "🎁", value: 8, count: 4 },
      { type: "pet", emoji: "🐉", value: 6, count: 1 },
      { type: "star", emoji: "🌟", value: 3, count: 4 },
      { type: "relic", emoji: "👑", value: 7, count: 2 },
      { type: "robot", emoji: "🤖", value: 0, count: 2 },
    ],
    ambientEmoji: "✨",
    timeLimit: 70,
  },
};

// ─── Grid Config ─────────────────────────────────────────────────
const GRID_ROWS = 8;
const GRID_COLS = 8;

// ─── Props ───────────────────────────────────────────────────────
interface Props {
  planetId: string;
  onComplete: (result: ExplorationResult) => void;
  suspended?: boolean;
  missionTimeBonus?: number;
  failRewardMultiplier?: number;
  shipEmoji?: string;
  startingHpBonus?: number;
  startDashReady?: boolean;
  pilotImage?: string;
  shipSkinId?: string;
  routeMode?: "scout" | "steady" | "salvage";
}

export interface ExplorationResult {
  success: boolean;
  bonus: number;
  reason: "completed" | "timeout" | "hull";
  salvageRecovered?: boolean;
}

function StoryItemMarker({ item }: { item: ExplorationItem }) {
  const { tr } = useI18n();
  const Icon = item.type === "crystal" ? Gem
    : item.type === "chest" ? Boxes
      : item.type === "pet" ? PawPrint
        : item.type === "robot" ? Bot
          : item.type === "star" ? Star
            : item.type === "relic" ? Landmark
              : CircleHelp;
  const sprite = item.type === "crystal"
    ? item.value >= 3 ? [0, 1] : item.value >= 2 ? [3, 0] : [2, 0]
    : item.type === "chest" ? [1, 1]
      : item.type === "hidden" ? [2, 1]
        : item.type === "robot" ? [3, 1]
          : item.type === "star" ? [0, 1]
            : item.type === "relic" ? [3, 3]
              : null;
  return <span className={`story-item-marker story-item-marker--${item.type}`}>{sprite ? <GaliaSprite sheet="story" column={sprite[0]} row={sprite[1]} /> : <Icon aria-hidden="true" />}<small>{item.id === "salvage-cargo" ? tr("CARGO", "สินค้า") : item.type === "robot" ? tr("HELP", "ผู้ช่วย") : item.type === "pet" ? tr("ALLY", "เพื่อน") : item.type === "hidden" ? tr("SCAN", "สแกน") : `+${item.value}`}</small></span>;
}

// ─── Helpers ─────────────────────────────────────────────────────
function distFromStart(row: number, col: number): number {
  const startRow = GRID_ROWS - 1;
  const startCol = Math.floor(GRID_COLS / 2);
  return Math.abs(row - startRow) + Math.abs(col - startCol);
}

function coordKey(row: number, col: number) {
  return `${row},${col}`;
}

export function getStoryEnemySpawnCells(
  mission: MissionProfile,
  items: ExplorationItem[],
  count: number,
): Coord[] {
  if (count <= 0) return [];
  const reachable = getReachableStoryCellKeys(mission.walls, GRID_ROWS, GRID_COLS);
  const blocked = new Set((mission.walls ?? []).map(([row, col]) => coordKey(row, col)));
  (mission.hazards ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.speedTiles ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.dropZones ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.teleportPairs ?? []).forEach(([a, b]) => {
    blocked.add(coordKey(a[0], a[1]));
    blocked.add(coordKey(b[0], b[1]));
  });
  items.filter((item) => !item.collected).forEach((item) => blocked.add(coordKey(item.row, item.col)));
  blocked.add(coordKey(GRID_ROWS - 1, Math.floor(GRID_COLS / 2)));

  const directions: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const candidates = Array.from(reachable)
    .filter((key) => !blocked.has(key))
    .map((key) => key.split(",").map(Number) as Coord)
    .map(([row, col]) => ({
      row,
      col,
      exits: directions.filter(([dr, dc]) => reachable.has(coordKey(row + dr, col + dc))).length,
      distance: distFromStart(row, col),
    }))
    .filter((cell) => cell.exits >= 2 && cell.distance >= 3)
    .sort((a, b) => b.exits - a.exits || b.distance - a.distance || a.row - b.row || a.col - b.col);

  const selected: Coord[] = [];
  for (const candidate of candidates) {
    if (selected.every(([row, col]) => Math.abs(row - candidate.row) + Math.abs(col - candidate.col) >= 2)) {
      selected.push([candidate.row, candidate.col]);
      if (selected.length === count) break;
    }
  }
  if (selected.length < count) {
    for (const candidate of candidates) {
      if (!selected.some(([row, col]) => row === candidate.row && col === candidate.col)) {
        selected.push([candidate.row, candidate.col]);
        if (selected.length === count) break;
      }
    }
  }
  return selected;
}

export function generateMap(theme: PlanetTheme, mission: MissionProfile): { items: ExplorationItem[]; ground: string[][]; decorations: (string | null)[][]; requiredCollect: number } {
  const ground: string[][] = [];
  const decorations: (string | null)[][] = [];
  const occupied = new Set<string>();
  const items: ExplorationItem[] = [];
  const wallKeys = new Set((mission.walls ?? []).map(([r, c]) => coordKey(r, c)));
  const reachableKeys = getReachableStoryCellKeys(mission.walls, GRID_ROWS, GRID_COLS);
  const blockedKeys = new Set<string>(wallKeys);
  (mission.hazards ?? []).forEach(([r, c]) => blockedKeys.add(coordKey(r, c)));
  (mission.dropZones ?? []).forEach(([r, c]) => blockedKeys.add(coordKey(r, c)));
  (mission.speedTiles ?? []).forEach(([r, c]) => blockedKeys.add(coordKey(r, c)));
  (mission.teleportPairs ?? []).forEach(([a, b]) => {
    blockedKeys.add(coordKey(a[0], a[1]));
    blockedKeys.add(coordKey(b[0], b[1]));
  });

  // Generate ground tiles and scattered decorations
  for (let r = 0; r < GRID_ROWS; r++) {
    ground[r] = [];
    decorations[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      ground[r][c] = theme.groundEmojis[Math.floor(Math.random() * theme.groundEmojis.length)];
      decorations[r][c] = Math.random() < 0.15
        ? theme.decorEmojis[Math.floor(Math.random() * theme.decorEmojis.length)]
        : null;
    }
  }

  // Reserve player start and adjacent cells
  const startRow = GRID_ROWS - 1;
  const startCol = Math.floor(GRID_COLS / 2);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = startRow + dr;
      const nc = startCol + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        occupied.add(`${nr},${nc}`);
      }
    }
  }

  let itemId = 0;
  for (const itemDef of theme.items) {
    for (let i = 0; i < itemDef.count; i++) {
      let attempts = 0;
      let bestRow = -1, bestCol = -1, bestDist = -1;
      while (attempts < 100) {
        const row = Math.floor(Math.random() * GRID_ROWS);
        const col = Math.floor(Math.random() * GRID_COLS);
        const key = `${row},${col}`;
        if (reachableKeys.has(key) && !occupied.has(key) && !blockedKeys.has(key)) {
          const dist = distFromStart(row, col);
          if (dist > bestDist) {
            bestRow = row;
            bestCol = col;
            bestDist = dist;
          }
          if (dist >= 3 || attempts > 50) break;
        }
        attempts++;
      }
      if (bestRow < 0) {
        const fallback = Array.from(reachableKeys)
          .filter((key) => !occupied.has(key) && !blockedKeys.has(key))
          .map((key) => key.split(",").map(Number) as Coord)
          .sort((a, b) => distFromStart(b[0], b[1]) - distFromStart(a[0], a[1]))[0];
        if (fallback) [bestRow, bestCol] = fallback;
      }
      if (bestRow >= 0) {
        occupied.add(`${bestRow},${bestCol}`);
        decorations[bestRow][bestCol] = null; // Remove decoration if item placed
        items.push({
          id: `item-${itemId++}`,
          type: itemDef.type,
          emoji: itemDef.emoji,
          collected: false,
          revealed: itemDef.type !== "hidden", // Hidden items start unrevealed
          row: bestRow,
          col: bestCol,
          value: itemDef.value,
        });
      }
    }
  }

  // Count only collectible items (not robots, they're helpers)
  const collectibleItems = items.filter(i => i.type !== "robot");
  const requiredCollect = mission.crystalGoal ?? Math.ceil(collectibleItems.length * 0.5);

  return { items, ground, decorations, requiredCollect };
}

export function addStoryRouteItems(
  items: ExplorationItem[],
  mission: MissionProfile,
  routeMode: "scout" | "steady" | "salvage",
): ExplorationItem[] {
  const prepared = items.map((item) =>
    routeMode === "scout" && item.type === "hidden" ? { ...item, revealed: true } : item,
  );
  if (routeMode !== "salvage") return prepared;

  const occupied = new Set(prepared.map((item) => coordKey(item.row, item.col)));
  const blocked = new Set<string>();
  (mission.walls ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.hazards ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.dropZones ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.speedTiles ?? []).forEach(([row, col]) => blocked.add(coordKey(row, col)));
  (mission.teleportPairs ?? []).forEach(([a, b]) => {
    blocked.add(coordKey(a[0], a[1]));
    blocked.add(coordKey(b[0], b[1]));
  });
  const startRow = GRID_ROWS - 1;
  const startCol = Math.floor(GRID_COLS / 2);
  const cargoCell = Array.from(getReachableStoryCellKeys(mission.walls, GRID_ROWS, GRID_COLS))
    .map((key) => key.split(",").map(Number) as Coord)
    .filter(([row, col]) =>
      !occupied.has(coordKey(row, col)) &&
      !blocked.has(coordKey(row, col)) &&
      Math.abs(row - startRow) + Math.abs(col - startCol) >= 3,
    )
    .sort((a, b) => distFromStart(b[0], b[1]) - distFromStart(a[0], a[1]))[0];

  if (!cargoCell) return prepared;
  return [
    ...prepared,
    {
      id: "salvage-cargo",
      type: "chest",
      emoji: "📦",
      collected: false,
      revealed: true,
      row: cargoCell[0],
      col: cargoCell[1],
      value: 0,
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────
export default function PlanetExploration({
  planetId,
  onComplete,
  missionTimeBonus = 0,
  failRewardMultiplier = 0.3,
  shipEmoji = "🚀",
  startingHpBonus = 0,
  startDashReady = false,
  pilotImage,
  shipSkinId = "red-rocket",
  routeMode = "steady",
  suspended = false,
}: Props) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const completedRef = useRef(false);
  const resolutionTimerRef = useRef<number | null>(null);
  const resolutionPriorityRef = useRef(0);
  const { lang, t, tr } = useI18n();
  const theme = PLANET_THEMES[planetId] || PLANET_THEMES["sparkle-moon"];
  const mission = useMemo(() => MISSION_PROFILES[planetId] ?? ({
    name: "Survey Operation",
    objective: "Collect enough resources and secure extraction.",
    duration: theme.timeLimit,
    petGoal: 1,
    requireReturn: true,
  }), [planetId, theme.timeLimit]);
  const missionTimeLimit = mission.duration + missionTimeBonus;
  const routeStatus = routeMode === "scout"
    ? tr("Scout · hidden items revealed, fewer hazards", "สำรวจ · เห็นของซ่อนและลดพื้นที่อันตราย")
    : routeMode === "salvage"
      ? tr("Salvage · extra objective and patrol pressure where present", "เก็บกู้ · มีของให้เก็บ และมีศัตรูเพิ่มในบทที่มีศัตรู")
      : tr("Balanced · standard objective and pressure", "ปกติ · เป้าหมายและความยากมาตรฐาน");
  const [mapData] = useState(() => generateMap(theme, mission));
  const [items, setItems] = useState<ExplorationItem[]>(() => addStoryRouteItems(mapData.items, mission, routeMode));
  const [playerPos, setPlayerPos] = useState({ row: GRID_ROWS - 1, col: Math.floor(GRID_COLS / 2) });
  const [timeLeft, setTimeLeft] = useState(missionTimeLimit);
  const deadlineRef = useRef<number | null>(null);
  const suspendedAtRef = useRef<number | null>(null);
  const [score, setScore] = useState(0);
  const maxHp = 3 + startingHpBonus;
  const [hp, setHp] = useState(maxHp);
  const [dashReady, setDashReady] = useState(startDashReady || routeMode === "scout");
  const [carriedPayload, setCarriedPayload] = useState(0);
  const [deliveredZones, setDeliveredZones] = useState<string[]>([]);
  const [activatedNodes, setActivatedNodes] = useState<string[]>([]);
  const [collectEffects, setCollectEffects] = useState<CollectEffect[]>([]);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [damageNotices, setDamageNotices] = useState<DamageNotice[]>([]);
  const [hpHitFlash, setHpHitFlash] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [missionResult, setMissionResult] = useState<"success" | "fail" | null>(null);
  const [shipReached, setShipReached] = useState(false);
  const [openingChest, setOpeningChest] = useState<string | null>(null);
  const [robotMessage, setRobotMessage] = useState<string | null>(null);
  const [landing, setLanding] = useState(true);
  const shipPos = useRef({ row: GRID_ROWS - 1, col: Math.floor(GRID_COLS / 2) });
  const [enemies, setEnemies] = useState<{ row: number; col: number }[]>(
    () => getStoryEnemySpawnCells(
      mission,
      items,
      (mission.enemyCount ?? 0) + (routeMode === "salvage" && mission.enemyCount ? 1 : 0),
    ).map(([row, col]) => ({ row, col })),
  );
  const totalCollected = useRef(0);
  const collectedItemCount = useRef(0);
  const requiredCollect = mapData.requiredCollect;
  const effectiveCrystalGoal = mission.crystalGoal ? requiredCollect : 0;
  const salvageRecovered = items.some((item) => item.id === "salvage-cargo" && item.collected);
  const walls = useMemo(() => new Set((mission.walls ?? []).map(([r, c]) => coordKey(r, c))), [mission.walls]);
  const patrolSight = useMemo(() => {
    if (!mission.patrolVision) return new Set<string>();
    const seen = new Set<string>();
    enemies.forEach((enemy) => {
      ([[-1, 0], [-2, 0], [1, 0], [2, 0], [0, -1], [0, -2], [0, 1], [0, 2]] as Coord[]).forEach(([dr, dc]) => {
        const row = enemy.row + dr; const col = enemy.col + dc;
        if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS && !walls.has(coordKey(row, col))) seen.add(coordKey(row, col));
      });
    });
    return seen;
  }, [enemies, mission.patrolVision, walls]);
  const hazards = useMemo(() => {
    const entries = routeMode === "scout" ? (mission.hazards ?? []).filter((_, index) => index % 2 === 0) : (mission.hazards ?? []);
    return new Set(entries.map(([r, c]) => coordKey(r, c)));
  }, [mission.hazards, routeMode]);
  const speedTiles = useMemo(() => new Set((mission.speedTiles ?? []).map(([r, c]) => coordKey(r, c))), [mission.speedTiles]);
  const dropZones = useMemo(() => mission.dropZones ?? [], [mission.dropZones]);
  const teleportMap = useMemo(() => {
    const pairs = mission.teleportPairs ?? [];
    const map = new Map<string, Coord>();
    pairs.forEach(([a, b]) => {
      map.set(coordKey(a[0], a[1]), b);
      map.set(coordKey(b[0], b[1]), a);
    });
    return map;
  }, [mission.teleportPairs]);
  const patrolBlockedCells = useMemo(() => {
    const blocked = new Set(walls);
    hazards.forEach((key) => blocked.add(key));
    speedTiles.forEach((key) => blocked.add(key));
    dropZones.forEach(([row, col]) => blocked.add(coordKey(row, col)));
    teleportMap.forEach((_, key) => blocked.add(key));
    items.filter((item) => !item.collected).forEach((item) => blocked.add(coordKey(item.row, item.col)));
    blocked.add(coordKey(shipPos.current.row, shipPos.current.col));
    return blocked;
  }, [dropZones, hazards, items, speedTiles, teleportMap, walls]);

  const completeOnce = useCallback((result: ExplorationResult) => {
    if (!mountedRef.current || completedRef.current) return;
    completedRef.current = true;
    onComplete(result);
  }, [onComplete]);

  const scheduleResolution = useCallback((result: ExplorationResult, delay: number) => {
    const priority = result.reason === "hull" ? 3 : result.success ? 2 : 1;
    if (priority < resolutionPriorityRef.current || completedRef.current) return;
    resolutionPriorityRef.current = priority;
    if (resolutionTimerRef.current !== null) window.clearTimeout(resolutionTimerRef.current);
    resolutionTimerRef.current = window.setTimeout(() => {
      resolutionTimerRef.current = null;
      completeOnce(result);
    }, delay);
  }, [completeOnce]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resolutionTimerRef.current !== null) window.clearTimeout(resolutionTimerRef.current);
    };
  }, []);

  // Landing animation
  useEffect(() => {
    const t = setTimeout(() => setLanding(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // The deadline is wall-clock based. Movement and React renders must never
  // postpone the timer tick on faster or slower machines.
  useEffect(() => {
    if (landing || gameOver) {
      deadlineRef.current = null;
      suspendedAtRef.current = null;
      return;
    }
    if (suspended) {
      if (deadlineRef.current !== null && suspendedAtRef.current === null) {
        suspendedAtRef.current = Date.now();
      }
      return;
    }
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + missionTimeLimit * 1000;
    } else if (suspendedAtRef.current !== null) {
      deadlineRef.current += Date.now() - suspendedAtRef.current;
      suspendedAtRef.current = null;
    }
    const timer = window.setInterval(() => {
      if (deadlineRef.current === null) return;
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 200);
    return () => window.clearInterval(timer);
  }, [landing, gameOver, missionTimeLimit, suspended]);

  useEffect(() => {
    if (landing || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      const result = evaluateStoryObjective(
        {
          itemGoal: effectiveCrystalGoal,
          itemType: mission.goalItemType,
          petGoal: mission.petGoal,
          deliveryGoal: mission.deliveryGoal,
          nodeGoal: mission.nodeGoal,
          requireReturn: mission.requireReturn,
        },
        {
          items,
          delivered: deliveredZones.length,
          nodes: activatedNodes.length,
          atShip: playerPos.row === shipPos.current.row && playerPos.col === shipPos.current.col,
        },
      );
      const hasEnough = result.complete;
      setMissionResult(hasEnough ? "success" : "fail");
      if (hasEnough) playVictorySound(); else playFailSound();
      setShipReached(true);
      scheduleResolution({
        success: hasEnough,
        bonus: hasEnough ? totalCollected.current : Math.floor(totalCollected.current * failRewardMultiplier),
        reason: hasEnough ? "completed" : "timeout",
        salvageRecovered,
      }, 2500);
    }
  }, [timeLeft, gameOver, landing, effectiveCrystalGoal, items, mission, deliveredZones.length, activatedNodes.length, playerPos.row, playerPos.col, failRewardMultiplier, salvageRecovered, scheduleResolution]);

  // Spawn sparkle burst at a grid position
  const spawnSparkles = useCallback((row: number, col: number) => {
    const newSparkles: SparkleParticle[] = Array.from({ length: 6 }, (_, i) => ({
      id: `sp-${Date.now()}-${i}`,
      x: (col / GRID_COLS) * 100 + (100 / GRID_COLS / 2),
      y: (row / GRID_ROWS) * 100 + (100 / GRID_ROWS / 2),
      emoji: ["✨", "💫", "⭐", "🌟", "💎", "🔮"][i % 6],
      delay: i * 0.05,
    }));
    setSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(n => n.id === s.id)));
    }, 1000);
  }, []);

  const addCollectEffect = useCallback((emoji: string, value: number, row: number, col: number, type: CollectEffect["type"] = "collect") => {
    const id = `effect-${Date.now()}-${Math.random()}`;
    setCollectEffects(prev => [...prev, { id, emoji, value, x: col, y: row, type }]);
    setTimeout(() => setCollectEffects(prev => prev.filter(e => e.id !== id)), 1200);
  }, []);

  const applyDamage = useCallback((row: number, col: number) => {
    setHp((prev) => Math.max(0, prev - 1));
    setHpHitFlash(true);
    const id = `dmg-${Date.now()}-${Math.random()}`;
    setDamageNotices((prev) => [...prev, { id, row, col, text: "-1 HP" }]);
    setTimeout(() => {
      setHpHitFlash(false);
      setDamageNotices((prev) => prev.filter((notice) => notice.id !== id));
    }, 500);
  }, []);

  const isAdjacent = (r1: number, c1: number, r2: number, c2: number) => {
    return isOrthogonallyAdjacent(r1, c1, r2, c2);
  };

  // Robot helper: reveals hidden items in 2-cell radius
  const activateRobot = useCallback((robotRow: number, robotCol: number) => {
    setRobotMessage(t("robotScanning"));
    setTimeout(() => {
      setItems(prev => prev.map(item => {
        if (!item.revealed && Math.abs(item.row - robotRow) <= 2 && Math.abs(item.col - robotCol) <= 2) {
          return { ...item, revealed: true };
        }
        return item;
      }));
      setRobotMessage(t("robotRevealed"));
      setTimeout(() => setRobotMessage(null), 2000);
    }, 800);
  }, [t]);

  const collectItem = useCallback((item: ExplorationItem, row: number, col: number) => {
    const isTrailItem = mission.trailSequence && item.type === (mission.goalItemType ?? "crystal");
    if (isTrailItem) {
      const nextTrailItem = items.find((candidate) => !candidate.collected && candidate.type === (mission.goalItemType ?? "crystal"));
      if (nextTrailItem && nextTrailItem.id !== item.id) {
        setRobotMessage(tr("Wrong signal. Collect the glowing TRACK marker first.", "ยังไม่ใช่จุดนี้ ให้เก็บจุด TRACK ที่กำลังเรืองแสงก่อน"));
        setTimeout(() => setRobotMessage(null), 1600);
        return false;
      }
    }
    if (item.type === "robot") {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
      activateRobot(row, col);
      addCollectEffect("🤖", 0, row, col, "robot");
      spawnSparkles(row, col);
      playRobotSound();
      return true;
    }

    if (item.type === "hidden" && !item.revealed) {
      addCollectEffect("❓", 0, row, col, "collect");
      return false;
    }

    if (item.type === "chest") {
      setOpeningChest(item.id);
      playChestSound();
      if (item.id === "salvage-cargo") {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
        collectedItemCount.current += 1;
        addCollectEffect("📦", 0, row, col, "chest");
        spawnSparkles(row, col);
        setOpeningChest(null);
        return true;
      }
      setTimeout(() => {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
        setScore(s => s + item.value);
        totalCollected.current += item.value;
        collectedItemCount.current += 1;
        addCollectEffect("🎉", item.value, row, col, "chest");
        spawnSparkles(row, col);
        setOpeningChest(null);
      }, 700);
      return true;
    }

    // Normal collection
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
    setScore(s => s + item.value);
    totalCollected.current += item.value;
    collectedItemCount.current += 1;
    if (item.type === "pet") {
      playPetDiscoverySound();
    } else {
      playCrystalSound();
    }
    addCollectEffect(item.emoji, item.value, row, col, item.type === "pet" ? "pet" : "sparkle");
    spawnSparkles(row, col);
    return true;
  }, [activateRobot, addCollectEffect, spawnSparkles, items, mission.goalItemType, mission.trailSequence, tr]);

  const crystalCollected = countStoryObjectiveItems(items, mission.goalItemType);
  const petCollected = items.filter((i) => i.collected && i.type === "pet").length;
  const deliveryDone = deliveredZones.length;
  const nodesDone = activatedNodes.length;
  const goalsMet =
    crystalCollected >= effectiveCrystalGoal &&
    petCollected >= (mission.petGoal ?? 0) &&
    deliveryDone >= (mission.deliveryGoal ?? 0) &&
    nodesDone >= (mission.nodeGoal ?? 0);
  const trailTargetId = mission.trailSequence
    ? items.find((item) => !item.collected && item.type === (mission.goalItemType ?? "crystal"))?.id
    : undefined;

  const checkShipReturn = useCallback((row: number, col: number) => {
    if (row === shipPos.current.row && col === shipPos.current.col && goalsMet && mission.requireReturn) {
      setGameOver(true);
      setMissionResult("success");
      setShipReached(true);
      scheduleResolution({ success: true, bonus: totalCollected.current, reason: "completed", salvageRecovered }, 800);
    }
  }, [goalsMet, mission.requireReturn, salvageRecovered, scheduleResolution]);

  const movePlayer = useCallback((deltaRow: number, deltaCol: number, useDash = false) => {
    if (landing || gameOver || suspended) return;
    // Normal inputs always move exactly one tile. A stored dash is only consumed
    // when the player deliberately holds Shift, preventing surprise two-tile jumps.
    const stepCount = getStoryStepCount(dashReady, useDash);
    if (useDash && dashReady) setDashReady(false);
    let nextRow = playerPos.row;
    let nextCol = playerPos.col;
    let payloadBuffer = carriedPayload;
    const deliveredSet = new Set(deliveredZones);

    for (let step = 0; step < stepCount; step++) {
      const candidateRow = nextRow + deltaRow;
      const candidateCol = nextCol + deltaCol;
      if (candidateRow < 0 || candidateRow >= GRID_ROWS || candidateCol < 0 || candidateCol >= GRID_COLS) break;
      if (walls.has(coordKey(candidateRow, candidateCol))) break;
      nextRow = candidateRow;
      nextCol = candidateCol;

      const cellKey = coordKey(nextRow, nextCol);
      if (hazards.has(cellKey)) {
        applyDamage(nextRow, nextCol);
        addCollectEffect("⚡", 0, nextRow, nextCol, "collect");
      }
      if (mission.patrolVision && patrolSight.has(cellKey)) {
        applyDamage(nextRow, nextCol);
        addCollectEffect("!", 0, nextRow, nextCol, "collect");
      }
      if (speedTiles.has(cellKey)) {
        setDashReady(true);
        if (!activatedNodes.includes(cellKey)) {
          setActivatedNodes((previous) => [...previous, cellKey]);
          if (mission.bossName) playImpactSound();
        }
        addCollectEffect("🌀", 0, nextRow, nextCol, "collect");
      }
      const teleportTarget = teleportMap.get(cellKey);
      if (teleportTarget) {
        nextRow = teleportTarget[0];
        nextCol = teleportTarget[1];
        addCollectEffect("🌀", 0, nextRow, nextCol, "sparkle");
      }

      const dropZoneIndex = dropZones.findIndex(([r, c]) => r === nextRow && c === nextCol);
      if (dropZoneIndex >= 0) {
        const zoneKey = `${dropZones[dropZoneIndex][0]},${dropZones[dropZoneIndex][1]}`;
        if (payloadBuffer > 0 && !deliveredSet.has(zoneKey)) {
          deliveredSet.add(zoneKey);
          payloadBuffer = Math.max(0, payloadBuffer - 1);
          addCollectEffect("📦", 0, nextRow, nextCol, "chest");
        }
      }

      const itemAtPos = items.find(i => i.row === nextRow && i.col === nextCol && !i.collected);
      if (itemAtPos) {
        const collected = collectItem(itemAtPos, nextRow, nextCol);
        if (collected && itemAtPos.type !== "robot") {
          payloadBuffer += 1;
        }
      }
    }

    setPlayerPos({ row: nextRow, col: nextCol });
    setCarriedPayload(payloadBuffer);
    if (deliveredSet.size !== deliveredZones.length) {
      setDeliveredZones(Array.from(deliveredSet));
    }
    playStepSound();
    checkShipReturn(nextRow, nextCol);
  }, [landing, gameOver, suspended, dashReady, mission.bossName, mission.patrolVision, playerPos.row, playerPos.col, walls, hazards, patrolSight, speedTiles, teleportMap, dropZones, carriedPayload, deliveredZones, activatedNodes, items, collectItem, checkShipReturn, addCollectEffect, applyDamage]);

  // Keyboard controls
  useEffect(() => {
    if (landing || gameOver) return;
    if (hp <= 0) {
      setGameOver(true);
      setMissionResult("fail");
      playFailSound();
      scheduleResolution({ success: false, bonus: Math.floor(totalCollected.current * failRewardMultiplier), reason: "hull", salvageRecovered }, 1200);
    }
  }, [hp, landing, gameOver, failRewardMultiplier, salvageRecovered, scheduleResolution]);

  useEffect(() => {
    if (landing || gameOver || suspended || enemies.length === 0) return;
    const timer = setInterval(() => {
      setEnemies((prev) => {
        const occupied = new Set(prev.map((enemy) => coordKey(enemy.row, enemy.col)));
        return prev.map((enemy) => {
          const dirs: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          const chase = Math.random() < 0.35;
          const rowDistance = playerPos.row - enemy.row;
          const colDistance = playerPos.col - enemy.col;
          const [dr, dc] = chase
            ? Math.abs(rowDistance) >= Math.abs(colDistance)
              ? [Math.sign(rowDistance), 0]
              : [0, Math.sign(colDistance)]
            : dirs[Math.floor(Math.random() * dirs.length)];
          const nr = enemy.row + dr;
          const nc = enemy.col + dc;
          const nextKey = coordKey(nr, nc);
          occupied.delete(coordKey(enemy.row, enemy.col));
          if (
            nr < 0 || nr >= GRID_ROWS ||
            nc < 0 || nc >= GRID_COLS ||
            patrolBlockedCells.has(nextKey) ||
            occupied.has(nextKey)
          ) {
            occupied.add(coordKey(enemy.row, enemy.col));
            return enemy;
          }
          occupied.add(nextKey);
          return { row: nr, col: nc };
        });
      });
    }, 900);
    return () => clearInterval(timer);
  }, [landing, gameOver, suspended, enemies.length, patrolBlockedCells, playerPos.row, playerPos.col]);

  useEffect(() => {
    if (landing || gameOver || suspended || enemies.length === 0) return;
    const collided = enemies.some((enemy) => enemy.row === playerPos.row && enemy.col === playerPos.col);
    if (collided) {
      applyDamage(playerPos.row, playerPos.col);
      addCollectEffect("👾", 0, playerPos.row, playerPos.col, "robot");
      setEnemies((previous) => {
        const safeCells = getStoryEnemySpawnCells(mission, items, previous.length + 2);
        const occupied = new Set(
          previous
            .filter((enemy) => enemy.row !== playerPos.row || enemy.col !== playerPos.col)
            .map((enemy) => coordKey(enemy.row, enemy.col)),
        );
        return previous.map((enemy) => {
          if (enemy.row !== playerPos.row || enemy.col !== playerPos.col) return enemy;
          const retreat = safeCells.find(([row, col]) =>
            (row !== playerPos.row || col !== playerPos.col) && !occupied.has(coordKey(row, col)),
          );
          if (!retreat) return enemy;
          occupied.add(coordKey(retreat[0], retreat[1]));
          return { row: retreat[0], col: retreat[1] };
        });
      });
    }
  }, [enemies, playerPos.row, playerPos.col, landing, gameOver, suspended, addCollectEffect, applyDamage, items, mission]);

  useEffect(() => {
    if (landing || gameOver || mission.requireReturn) return;
    if (goalsMet) {
      setGameOver(true);
      setMissionResult("success");
      setShipReached(true);
      playVictorySound();
      scheduleResolution({ success: true, bonus: totalCollected.current, reason: "completed", salvageRecovered }, 700);
    }
  }, [goalsMet, landing, gameOver, mission.requireReturn, salvageRecovered, scheduleResolution]);

  useEffect(() => {
    if (landing || gameOver || suspended) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = getMoveDirectionFromKeyboard(e);
      if (!direction) return;
      e.preventDefault();
      switch (direction) {
        case "up":
          movePlayer(-1, 0, e.shiftKey);
          break;
        case "down":
          movePlayer(1, 0, e.shiftKey);
          break;
        case "left":
          movePlayer(0, -1, e.shiftKey);
          break;
        case "right":
          movePlayer(0, 1, e.shiftKey);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [landing, gameOver, suspended, movePlayer]);

  // Tap handler
  const handleCellTap = useCallback((row: number, col: number) => {
    if (landing || gameOver || suspended) return;
    if (!isAdjacent(playerPos.row, playerPos.col, row, col)) return;
    movePlayer(row - playerPos.row, col - playerPos.col);
  }, [playerPos, landing, gameOver, suspended, movePlayer]);

  const handleReturnToShip = useCallback(() => {
    if (gameOver || landing) return;
    if (!goalsMet || !mission.requireReturn) return;
    if (playerPos.row !== shipPos.current.row || playerPos.col !== shipPos.current.col) return;
    setGameOver(true);
    setMissionResult("success");
    setShipReached(true);
    playVictorySound();
    scheduleResolution({
      success: true,
      bonus: totalCollected.current,
      reason: "completed",
      salvageRecovered,
    }, 800);
  }, [gameOver, landing, playerPos, goalsMet, mission.requireReturn, salvageRecovered, scheduleResolution]);

  const handleDpad = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (landing || gameOver) return;
    switch (dir) {
      case "up": movePlayer(-1, 0); break;
      case "down": movePlayer(1, 0); break;
      case "left": movePlayer(0, -1); break;
      case "right": movePlayer(0, 1); break;
    }
  }, [landing, gameOver, movePlayer]);

  useEffect(() => {
    if (!landing) {
      boardRef.current?.focus();
    }
  }, [landing]);

  // Derived state
  const collectibleItems = items.filter(i => i.type !== "robot");
  const collectedCount = collectibleItems.filter(i => i.collected).length;
  const timerColor = timeLeft <= 10 ? "text-destructive" : timeLeft <= 20 ? "text-cosmic-orange" : "text-cosmic-green";
  const timerPercent = (timeLeft / missionTimeLimit) * 100;
  const canReturn = goalsMet;
  const atShip = playerPos.row === shipPos.current.row && playerPos.col === shipPos.current.col;
  const goalBits = [
    mission.crystalGoal ? mission.trailSequence
      ? tr(`Signal crystals ${crystalCollected}/${effectiveCrystalGoal}`, `คริสตัลสัญญาณ ${crystalCollected}/${effectiveCrystalGoal}`)
      : tr(`Mission items ${crystalCollected}/${effectiveCrystalGoal}`, `ของภารกิจ ${crystalCollected}/${effectiveCrystalGoal}`)
      : null,
    mission.petGoal ? tr(`Companion ${petCollected}/${mission.petGoal}`, `เพื่อน ${petCollected}/${mission.petGoal}`) : null,
    mission.deliveryGoal ? tr(`Deliveries ${deliveryDone}/${mission.deliveryGoal}`, `จุดส่งของ ${deliveryDone}/${mission.deliveryGoal}`) : null,
    mission.nodeGoal ? tr(`Glow nodes ${nodesDone}/${mission.nodeGoal}`, `โหนดแสง ${nodesDone}/${mission.nodeGoal}`) : null,
  ].filter(Boolean).join("  •  ");
  const bossShield = mission.nodeGoal ? Math.max(0, Math.round((1 - nodesDone / mission.nodeGoal) * 100)) : 0;

  // Star rating
  const starRating = useMemo(() => {
    const percent = collectibleItems.length > 0 ? collectedCount / collectibleItems.length : 0;
    if (percent >= 0.9) return 3;
    if (percent >= 0.6) return 2;
    if (percent >= 0.3) return 1;
    return 0;
  }, [collectedCount, collectibleItems.length]);
  const ambientParticles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        top: 5 + Math.random() * 90,
        duration: 2 + Math.random() * 3,
        delay: i * 0.3,
      })),
    [],
  );

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      onPointerDown={() => boardRef.current?.focus()}
      role="region"
      aria-label={tr("Story mission board", "กระดานภารกิจเนื้อเรื่อง")}
      className="w-full max-w-[95vw] sm:max-w-lg md:max-w-xl mx-auto flex flex-col items-center gap-2 sm:gap-3 outline-none"
    >
      {/* Landing Animation Overlay */}
      <AnimatePresence>
        {landing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: -200, scale: 0.5, rotate: -30 }}
              animate={{ y: 0, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, duration: 1.2 }}
              className="flex flex-col items-center gap-3"
            >
              <span className="text-5xl sm:text-7xl">{shipEmoji}</span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {t("landingOn")} {tr(theme.name, STORY_THEME_TH[planetId] ?? theme.name)}...
                </p>
              </motion.div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="w-40 h-1.5 rounded-full bg-primary origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Bar */}
      <section aria-label={tr("Mission status", "สถานะภารกิจ")} className="w-full flex flex-col gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-card/90 backdrop-blur-sm border border-border/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
          <span className="rounded-full border border-border/50 bg-background/25 px-2.5 py-1">{tr("Live mission", "กำลังทำภารกิจ")}</span>
          <span className={`rounded-full border px-2.5 py-1 ${canReturn ? "border-cosmic-green/30 bg-cosmic-green/10 text-cosmic-green" : "border-cosmic-yellow/25 bg-cosmic-yellow/10 text-cosmic-yellow"}`}>
            {canReturn ? (mission.requireReturn ? tr("Return route open", "กลับยานได้แล้ว") : tr("Extraction ready", "พร้อมกลับอัตโนมัติ")) : tr("Objective in progress", "กำลังทำเป้าหมาย")}
          </span>
          <span className="rounded-full border border-cosmic-cyan/25 bg-cosmic-cyan/10 px-2.5 py-1 text-cosmic-cyan">{routeStatus}</span>
        </div>
      <div className="text-center text-[10px] sm:text-xs font-semibold text-cosmic-cyan">
          {tr(mission.name, STORY_MISSION_TH[planetId]?.name ?? mission.name)}: {tr(mission.objective, STORY_MISSION_TH[planetId]?.objective ?? mission.objective)}
        </div>
        <div className="text-center text-[10px] font-bold text-white/80 sm:text-xs">
          {mission.requireReturn
            ? tr("Win condition: complete every counter, then walk back onto the ship tile.", "เงื่อนไขผ่าน: ทำตัวนับให้ครบ แล้วเดินกลับมาที่ช่องยาน")
            : tr("Win condition: complete every counter. Extraction then happens automatically.", "เงื่อนไขผ่าน: ทำตัวนับให้ครบ แล้วระบบจะพากลับอัตโนมัติ")}
        </div>
        {(mission.enemyCount ?? 0) > 0 && <div className="text-center text-[10px] text-muted-foreground sm:text-xs">{tr("Patrols move continuously. Contact drains one hull, but patrols retreat and never lock an objective.", "ศัตรูเดินเองตามเวลา ถ้าชนจะเสียพลังยาน 1 หน่วย แต่ศัตรูจะถอยและไม่ขวางเป้าหมายถาวร")}</div>}
        {mission.bossName && (
          <div className="story-boss-bar" aria-label={`${mission.bossName} shield ${bossShield}%`}>
            <div><span>{tr("Boss encounter", "เผชิญหน้าบอส")}</span><strong>{mission.bossName}</strong><small>{tr("Shield", "เกราะ")} {bossShield}%</small></div>
            <i><b style={{ width: `${bossShield}%` }} /></i>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 px-2 py-1 rounded-lg">
            <Gem className="h-4 w-4 text-cosmic-cyan" />
            <span className="text-xs sm:text-sm font-bold text-foreground">{score}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 px-2 py-1 rounded-lg">
            <Package className="h-4 w-4 text-cosmic-yellow" />
            <span className={`text-xs sm:text-sm font-bold ${canReturn ? "text-cosmic-green" : "text-foreground"}`}>
              {goalBits || `${collectedCount}/${requiredCollect}`}
            </span>
            {canReturn && <span className="text-xs">✅</span>}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 px-2 py-1 rounded-lg">
            <Clock3 className="h-4 w-4 text-cosmic-green" />
            <span aria-label={tr("Time remaining", "เวลาที่เหลือ")} className={`text-xs sm:text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}{lang === "th" ? " วิ" : "s"}</span>
          </div>
        </div>
        {routeMode === "salvage" && (
          <div className={`text-center text-[10px] font-bold sm:text-xs ${salvageRecovered ? "text-cosmic-green" : "text-cosmic-yellow"}`}>
            {salvageRecovered
              ? tr("Optional salvage cargo recovered · +25% route bonus secured", "เก็บกล่องเสริมแล้ว · ได้โบนัสเส้นทาง +25%")
              : tr("Optional: recover the cargo crate for the +25% route bonus", "เป้าหมายเสริม: เก็บกล่องสินค้าเพื่อรับโบนัสเส้นทาง +25%")}
          </div>
        )}
        {(mission.enemyCount ?? 0) > 0 && (
          <div className="text-center text-[10px] sm:text-xs font-bold text-destructive">HP {hp}/{maxHp}</div>
        )}
        {/* Timer progress bar */}
        <div className="w-full h-2 sm:h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timeLeft <= 10 ? "bg-destructive" : timeLeft <= 20 ? "bg-cosmic-orange" : "bg-cosmic-green"}`}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* Robot message */}
        <AnimatePresence>
          {robotMessage && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] sm:text-xs text-cosmic-cyan text-center font-bold"
            >
              {robotMessage}
            </motion.p>
          )}
        </AnimatePresence>
        {!canReturn && !robotMessage && (
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            {goalBits || `${t("collectAtLeast")} ${requiredCollect} ${t("itemsThenReturn")}`}
          </p>
        )}
        {canReturn && !robotMessage && (
          <p className="text-[10px] sm:text-xs text-cosmic-green text-center font-semibold">
            {mission.requireReturn
              ? tr("Mission targets complete. Head back to your ship to lock the run.", "ทำเป้าหมายครบแล้ว กลับไปที่ยานเพื่อจบภารกิจ")
              : tr("Mission targets complete. Auto extraction in progress.", "ทำเป้าหมายครบแล้ว กำลังพากลับอัตโนมัติ")}
          </p>
        )}
      </section>

      {/* Theme label */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        <span className="flex items-center gap-1.5">
          <MapIcon className="h-3.5 w-3.5" /> {tr(theme.name, STORY_THEME_TH[planetId] ?? theme.name)}
          <span className="text-[8px] sm:text-[10px] opacity-60">({GRID_COLS}×{GRID_ROWS})</span>
        </span>
        <span className="rounded-full border border-border/40 bg-background/20 px-2.5 py-1">
          {tr("One tile per move · WASD / arrows", "เดินครั้งละ 1 ช่อง · ใช้ WASD หรือปุ่มลูกศร")} · {dashReady ? tr("Hold Shift + direction for a 2-tile dash", "กด Shift พร้อมทิศทางเพื่อพุ่ง 2 ช่อง") : tr("cross a glow node to charge a dash", "เดินผ่านโหนดแสงเพื่อชาร์จพุ่ง")}
        </span>
        <span className="story-board-legend"><Navigation /> {tr("Pilot = you", "นักบิน = ตัวคุณ")}</span>
        <span className="story-board-legend"><Rocket /> {tr("Rocket = extraction", "ยาน = จุดกลับ")}</span>
        <span className="story-board-legend"><Gem /> {tr("Glowing badges = objectives", "สัญลักษณ์เรืองแสง = เป้าหมาย")}</span>
      </div>

      {/* Exploration Grid */}
      <div
        role="group"
        aria-label={tr("Exploration grid", "ตารางสำรวจ")}
        className={`story-expedition-board story-expedition-board--${planetId} relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 border-border/40 shadow-2xl bg-gradient-to-b ${theme.bgGradient}`}
      >
        {hpHitFlash && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 z-20 bg-red-500/25"
          />
        )}
        {/* Ambient floating particles */}
        {ambientParticles.map((particle) => (
          <div
            key={`amb-${particle.id}`}
            className="absolute text-xs sm:text-base opacity-15 animate-float pointer-events-none"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            {theme.ambientEmoji}
          </div>
        ))}

        {/* Grid */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            gap: "1px",
            padding: "2px",
          }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => {
              const isPlayer = playerPos.row === row && playerPos.col === col;
              const isShip = shipPos.current.row === row && shipPos.current.col === col;
              const item = items.find(i => i.row === row && i.col === col && !i.collected);
              const isOpeningThis = item && openingChest === item.id;
              const isWall = walls.has(coordKey(row, col));
              const isHazard = hazards.has(coordKey(row, col));
              const isSpeedTile = speedTiles.has(coordKey(row, col));
              const isActivatedNode = activatedNodes.includes(coordKey(row, col));
              const isDropZone = dropZones.some(([r, c]) => r === row && c === col);
              const isTeleport = teleportMap.has(coordKey(row, col));
              const isPatrolSight = patrolSight.has(coordKey(row, col));
              const canMove = !gameOver && !landing && !isWall && isAdjacent(playerPos.row, playerPos.col, row, col);
              const decoration = mapData.decorations[row][col];

              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleCellTap(row, col)}
                  aria-label={isPlayer
                    ? tr("Your explorer", "ตำแหน่งของคุณ")
                    : isShip
                      ? tr("Extraction ship", "ยานสำหรับกลับ")
                      : item
                        ? tr(`${item.type}${item.value ? ` worth ${item.value}` : ""}`, `${item.type === "crystal" ? "คริสตัล" : item.type === "star" ? "ดาว" : item.type === "pet" ? "เพื่อน" : item.type === "robot" ? "ผู้ช่วย" : item.type === "chest" ? "กล่อง" : item.type === "relic" ? "วัตถุโบราณ" : "ของซ่อน"}${item.value ? ` มูลค่า ${item.value}` : ""}`)
                        : tr(`Grid cell ${row + 1}, ${col + 1}`, `ช่อง ${row + 1}, ${col + 1}`)}
                  className={`story-grid-cell relative rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 select-none
                    ${canMove && !isPlayer ? "is-reachable cursor-pointer active:scale-95" : ""}
                    ${isPlayer ? "is-player z-10" : ""}
                    ${isShip && !isPlayer ? `is-extraction is-skin-${shipSkinId} ${canReturn ? "is-ready" : ""}` : ""}
                    ${isWall ? "is-wall" : ""}
                    ${isHazard ? "is-hazard" : ""}
                    ${isPatrolSight && !isPlayer ? "is-patrol-sight" : ""}
                    ${isActivatedNode ? "is-activated" : ""}
                  `}
                >
                  {isWall && !isPlayer && (
                    <span className="story-terrain-marker story-terrain-marker--wall"><span /><span /><span /></span>
                  )}
                  {/* Ground/decoration layer */}
                  {!item && !isPlayer && !isShip && !isWall && (
                    <span className={`story-ground-detail ${decoration ? "has-decoration" : ""}`} aria-hidden="true" />
                  )}
                  {isHazard && !isPlayer && !isWall && <span className="story-objective-marker is-danger"><Zap aria-hidden="true" /><small>{tr("HAZARD", "อันตราย")}</small></span>}
                  {isSpeedTile && !isPlayer && !isWall && <span className={`story-objective-marker is-node ${isActivatedNode ? "is-complete" : ""}`}>{isActivatedNode ? <Zap aria-hidden="true" /> : <Orbit aria-hidden="true" />}<small>{isActivatedNode ? tr("ONLINE", "พร้อม") : tr("NODE", "โหนด")}</small></span>}
                  {isDropZone && !isPlayer && !isWall && <span className="story-objective-marker is-delivery"><Package aria-hidden="true" /><small>{tr("DROP", "ส่ง")}</small></span>}
                  {isTeleport && !isPlayer && !isWall && <span className="story-objective-marker is-portal"><Orbit aria-hidden="true" /><small>{tr("GATE", "ประตู")}</small></span>}

                  {/* Ship marker (when player is not on it) */}
                  {isShip && !isPlayer && (
                    <motion.span
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="story-extraction-marker"
                    >
                      <Rocket aria-hidden="true" /><small>{canReturn ? tr("EXIT", "กลับ") : tr("SHIP", "ยาน")}</small>
                    </motion.span>
                  )}

                  {/* Items */}
                  {item && !isPlayer && (
                    <>
                      {item.type === "hidden" && !item.revealed ? (
                        /* Hidden item disguised as ground */
                        <motion.span
                          animate={{ opacity: [0.3, 0.5, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="story-item-marker story-item-marker--hidden is-concealed"
                        >
                          <CircleHelp aria-hidden="true" /><small>{tr("SCAN", "สแกน")}</small>
                        </motion.span>
                      ) : (
                        <motion.span
                          animate={
                            isOpeningThis
                              ? { scale: [1, 1.5, 0], rotate: [0, 20, -20, 0] }
                              : item.id === trailTargetId
                                ? { y: 0 }
                                : { y: [0, -2, 0] }
                          }
                          transition={
                            isOpeningThis
                              ? { duration: 0.7 }
                              : item.id === trailTargetId
                                ? { duration: 0 }
                              : { duration: 1.5 + Math.random(), repeat: Infinity }
                          }
                          className={`${item.type === "robot" ? "animate-pulse" : ""} ${item.id === trailTargetId ? "is-trail-target" : ""}`}
                          data-story-item-type={item.type}
                          aria-label={item.type === "crystal" ? tr("Signal crystal", "คริสตัลสัญญาณ") : undefined}
                        >
                          {item.id === trailTargetId && <span className="story-trail-label">{tr("TRACK", "ตามรอย")}</span>}
                          <StoryItemMarker item={item} />
                        </motion.span>
                      )}
                    </>
                  )}

                  {/* Enemies */}
                  {enemies.some((enemy) => enemy.row === row && enemy.col === col) && !isPlayer && (
                    <span className="story-enemy-marker">
                      <Skull aria-hidden="true" /><small>{tr("THREAT", "ศัตรู")}</small>
                    </span>
                  )}

                  {/* Player */}
                  {isPlayer && (
                    <div className="story-player-marker z-10">
                      <span>{pilotImage ? <img src={pilotImage} alt="" /> : <Navigation aria-hidden="true" />}</span><small>{tr("YOU", "คุณ")}</small>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Collection effects */}
        <AnimatePresence>
          {collectEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: effect.type === "chest" ? 2 : 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute pointer-events-none flex flex-col items-center z-30"
              style={{
                left: `${(effect.x / GRID_COLS) * 100 + 100 / GRID_COLS / 2}%`,
                top: `${(effect.y / GRID_ROWS) * 100}%`,
              }}
            >
              <span className={`story-collect-burst ${effect.type === "pet" ? "animate-bounce" : ""}`}><SparklesIcon aria-hidden="true" /></span>
              {effect.value > 0 && (
                <span className="text-[10px] sm:text-xs font-bold text-cosmic-yellow drop-shadow-md">+{effect.value}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {damageNotices.map((notice) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -28, scale: 1.08 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute pointer-events-none z-30"
              style={{
                left: `${(notice.col / GRID_COLS) * 100 + 100 / GRID_COLS / 2}%`,
                top: `${(notice.row / GRID_ROWS) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="rounded-full border border-red-300/40 bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-200">
                {notice.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sparkle particles */}
        <AnimatePresence>
          {sparkles.map(sp => (
            <motion.div
              key={sp.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1.5,
                x: (Math.random() - 0.5) * 60,
                y: -30 - Math.random() * 40,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: sp.delay }}
              className="absolute pointer-events-none z-30 text-sm sm:text-base"
              style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
            >
              {sp.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Game over overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-xl sm:rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-2 sm:gap-4 text-center p-3 sm:p-6"
              >
                <span className="text-4xl sm:text-6xl">
                  {missionResult === "success" ? "🎉" : "💥"}
                </span>
                <h3 className="text-lg sm:text-2xl font-bold glow-text" style={{ fontFamily: "var(--font-display)" }}>
                  {missionResult === "success" ? t("missionSuccess") : t("missionFail")}
                </h3>

                {/* Star rating */}
                {missionResult === "success" && (
                  <div className="flex gap-1 text-2xl sm:text-3xl">
                    {[1, 2, 3].map(i => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3 + i * 0.2, type: "spring" }}
                        className={i <= starRating ? "" : "opacity-20 grayscale"}
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {missionResult === "fail"
                    ? `${t("onlyCollected")} ${collectedCount}/${requiredCollect} ${t("itemsRewards")}`
                    : `${collectedCount}/${collectibleItems.length} ${t("collectedTreasures")}`}
                </p>
                <div className="flex gap-3 text-lg sm:text-xl font-bold">
                  <span>💎 {missionResult === "fail" ? Math.floor(score * failRewardMultiplier) : score}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* D-Pad for mobile */}
      {!gameOver && !landing && (
        <div className="story-touch-dpad flex flex-col items-center gap-1 sm:hidden" role="group" aria-label={tr("Movement controls", "ปุ่มเคลื่อนที่")}>
          <button
            onClick={() => handleDpad("up")}
            aria-label={tr("Move up", "ขึ้น")}
            className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
          >
            <ChevronUp className="w-8 h-8 text-foreground" />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => handleDpad("left")}
              aria-label={tr("Move left", "ซ้าย")}
              className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
            >
              <ChevronLeft className="w-8 h-8 text-foreground" />
            </button>
            <div className="w-14 h-14" />
            <button
              onClick={() => handleDpad("right")}
              aria-label={tr("Move right", "ขวา")}
              className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
            >
              <ChevronRight className="w-8 h-8 text-foreground" />
            </button>
          </div>
          <button
            onClick={() => handleDpad("down")}
            aria-label={tr("Move down", "ลง")}
            className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
          >
            <ChevronDown className="w-8 h-8 text-foreground" />
          </button>
        </div>
      )}

      {/* Return to ship button */}
      {!gameOver && !landing && canReturn && atShip && mission.requireReturn && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleReturnToShip}
          className="px-5 sm:px-6 py-2 sm:py-2.5 min-h-[48px] rounded-xl sm:rounded-2xl bg-cosmic-green/20 border-2 border-cosmic-green/50 text-cosmic-green text-sm sm:text-base font-bold hover:bg-cosmic-green/30 transition-all animate-pulse shadow-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {shipEmoji} {t("returnToShip")}
        </motion.button>
      )}

      {/* Instructions */}
      {!gameOver && !landing && !canReturn && (
        <p className="text-xs sm:text-sm text-muted-foreground text-center animate-pulse">
          👆 {t("collectTreasures")}
        </p>
      )}
      {!gameOver && !landing && canReturn && !atShip && mission.requireReturn && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs sm:text-sm text-cosmic-green text-center font-bold"
        >
          ✅ {t("returnToShip")}
        </motion.p>
      )}
    </div>
  );
}
