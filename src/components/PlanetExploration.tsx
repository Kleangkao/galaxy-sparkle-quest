import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Boxes, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Gem, Landmark, Map as MapIcon, Navigation, Orbit, Package, PawPrint, Rocket, Skull, Sparkles as SparklesIcon, Star, Zap } from "lucide-react";
import { playCrystalSound, playChestSound, playRobotSound, playPetDiscoverySound, playStepSound, playVictorySound, playFailSound, playImpactSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";
import { getStoryStepCount, isOrthogonallyAdjacent } from "@/lib/storyMovement";

// ─── Types ───────────────────────────────────────────────────────
interface ExplorationItem {
  id: string;
  type: "crystal" | "chest" | "pet" | "robot" | "star" | "relic" | "hidden";
  emoji: string;
  collected: boolean;
  revealed: boolean; // hidden items must be revealed first
  row: number;
  col: number;
  value: number;
}

interface PlanetTheme {
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

interface MissionProfile {
  name: string;
  objective: string;
  duration: number;
  crystalGoal?: number;
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

const MISSION_PROFILES: Record<string, MissionProfile> = {
  "sparkle-moon": {
    name: "Crystal Flight School",
    objective: "Learn movement, collect 5 crystals, then return to your ship.",
    duration: 50,
    crystalGoal: 5,
    requireReturn: true,
  },
  "candy-planet": {
    name: "Living Signal Hunt",
    objective: "Follow the highlighted signal trail in order through the coral maze.",
    duration: 60,
    crystalGoal: 6,
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
    requireReturn: false,
    walls: [[1, 3], [2, 3], [4, 4], [5, 4]],
  },
  "jungle-world": {
    name: "Silent Canopy",
    objective: "Collect 8 vault keys while evading two guardian patrols.",
    duration: 65,
    crystalGoal: 8,
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
    requireReturn: true,
    hazards: [[1, 1], [1, 6], [2, 3], [3, 4], [4, 2], [5, 5]],
    enemyCount: 1,
  },
  "starlight-shore": {
    name: "Starlight Rescue",
    objective: "Recover a companion signal, collect 7 relay stars, and activate the exit node.",
    duration: 70,
    crystalGoal: 7,
    petGoal: 1,
    nodeGoal: 1,
    requireReturn: false,
    walls: [[1, 4], [2, 4], [3, 4], [4, 4]],
  },
  "crystal-cave": {
    name: "Frontier Decision",
    objective: "Commit to your chosen route, charge two gates, and secure 6 core fragments.",
    duration: 80,
    crystalGoal: 6,
    deliveryGoal: 2,
    nodeGoal: 2,
    requireReturn: false,
    enemyCount: 2,
    dropZones: [[0, 1], [0, 6]],
  },
  "golden-galaxy": {
    name: "Aurora Core Finale",
    objective: "Charge both gate nodes, recover pet intel, collect 8 cores, and escape.",
    duration: 90,
    crystalGoal: 8,
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

// ─── Planet Themes ───────────────────────────────────────────────
const PLANET_THEMES: Record<string, PlanetTheme> = {
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
      { type: "crystal", emoji: "💎", value: 2, count: 5 },
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
      { type: "crystal", emoji: "💠", value: 3, count: 5 },
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
      { type: "relic", emoji: "🏺", value: 5, count: 3 },
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
      { type: "crystal", emoji: "💎", value: 2, count: 5 },
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
      { type: "star", emoji: "🌟", value: 3, count: 6 },
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
      { type: "crystal", emoji: "💎", value: 5, count: 6 },
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
  onComplete: (bonus: number) => void;
  missionTimeBonus?: number;
  failRewardMultiplier?: number;
  shipEmoji?: string;
  startingHpBonus?: number;
  startDashReady?: boolean;
  pilotImage?: string;
  shipSkinId?: string;
  routeMode?: "scout" | "steady" | "salvage";
}

function StoryItemMarker({ item }: { item: ExplorationItem }) {
  const Icon = item.type === "crystal" ? Gem
    : item.type === "chest" ? Boxes
      : item.type === "pet" ? PawPrint
        : item.type === "robot" ? Bot
          : item.type === "star" ? Star
            : item.type === "relic" ? Landmark
              : CircleHelp;
  return <span className={`story-item-marker story-item-marker--${item.type}`}><Icon aria-hidden="true" /><small>{item.type === "robot" ? "HELP" : item.type === "pet" ? "ALLY" : item.type === "hidden" ? "SCAN" : `+${item.value}`}</small></span>;
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

function generateMap(theme: PlanetTheme, mission: MissionProfile): { items: ExplorationItem[]; ground: string[][]; decorations: (string | null)[][]; requiredCollect: number } {
  const ground: string[][] = [];
  const decorations: (string | null)[][] = [];
  const occupied = new Set<string>();
  const items: ExplorationItem[] = [];
  const wallKeys = new Set((mission.walls ?? []).map(([r, c]) => coordKey(r, c)));
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
        if (!occupied.has(key) && !blockedKeys.has(key)) {
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
}: Props) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const completedRef = useRef(false);
  const { t } = useI18n();
  const theme = PLANET_THEMES[planetId] || PLANET_THEMES["sparkle-moon"];
  const mission = useMemo(() => MISSION_PROFILES[planetId] ?? ({
    name: "Survey Operation",
    objective: "Collect enough resources and secure extraction.",
    duration: theme.timeLimit,
    petGoal: 1,
    requireReturn: true,
  }), [planetId, theme.timeLimit]);
  const missionTimeLimit = mission.duration + missionTimeBonus;
  const [mapData] = useState(() => generateMap(theme, mission));
  const [items, setItems] = useState<ExplorationItem[]>(() => mapData.items.map((item) => routeMode === "scout" && item.type === "hidden" ? { ...item, revealed: true } : item));
  const [playerPos, setPlayerPos] = useState({ row: GRID_ROWS - 1, col: Math.floor(GRID_COLS / 2) });
  const [timeLeft, setTimeLeft] = useState(missionTimeLimit);
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
    () =>
      Array.from({ length: (mission.enemyCount ?? 0) + (routeMode === "salvage" && mission.enemyCount ? 1 : 0) }, (_, index) => ({
        row: 1 + (index % 2),
        col: GRID_COLS - 2 - index,
      })),
  );
  const totalCollected = useRef(0);
  const collectedItemCount = useRef(0);
  const requiredCollect = mapData.requiredCollect + (routeMode === "salvage" && mission.crystalGoal ? 1 : 0);
  const effectiveCrystalGoal = mission.crystalGoal ? requiredCollect : 0;
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

  const completeOnce = useCallback((reward: number) => {
    if (!mountedRef.current || completedRef.current) return;
    completedRef.current = true;
    onComplete(reward);
  }, [onComplete]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Landing animation
  useEffect(() => {
    const t = setTimeout(() => setLanding(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Timer (only starts after landing)
  useEffect(() => {
    if (landing || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      const crystalCollected = items.filter((i) => i.collected && i.type !== "robot" && i.type !== "pet").length;
      const petCollected = items.filter((i) => i.collected && i.type === "pet").length;
      const hasEnough =
        crystalCollected >= effectiveCrystalGoal &&
        petCollected >= (mission.petGoal ?? 0) &&
        deliveredZones.length >= (mission.deliveryGoal ?? 0) &&
        activatedNodes.length >= (mission.nodeGoal ?? 0) &&
        (!mission.requireReturn || (playerPos.row === shipPos.current.row && playerPos.col === shipPos.current.col));
      setMissionResult(hasEnough ? "success" : "fail");
      if (hasEnough) playVictorySound(); else playFailSound();
      setTimeout(() => {
        setShipReached(true);
        completeOnce(hasEnough ? totalCollected.current : Math.floor(totalCollected.current * failRewardMultiplier));
      }, 2500);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, landing, completeOnce, requiredCollect, effectiveCrystalGoal, items, mission, deliveredZones.length, activatedNodes.length, playerPos.row, playerPos.col, failRewardMultiplier]);

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
    if (mission.trailSequence && item.type !== "robot" && item.type !== "pet") {
      const nextTrailItem = items.find((candidate) => !candidate.collected && candidate.type !== "robot" && candidate.type !== "pet");
      if (nextTrailItem && nextTrailItem.id !== item.id) {
        setRobotMessage("Signal out of sequence. Follow the highlighted TRACK marker.");
        setTimeout(() => setRobotMessage(null), 1600);
        return;
      }
    }
    if (item.type === "robot") {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
      activateRobot(row, col);
      addCollectEffect("🤖", 0, row, col, "robot");
      spawnSparkles(row, col);
      playRobotSound();
      return;
    }

    if (item.type === "hidden" && !item.revealed) {
      addCollectEffect("❓", 0, row, col, "collect");
      return;
    }

    if (item.type === "chest") {
      setOpeningChest(item.id);
      playChestSound();
      setTimeout(() => {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, collected: true } : i));
        setScore(s => s + item.value);
        totalCollected.current += item.value;
        collectedItemCount.current += 1;
        addCollectEffect("🎉", item.value, row, col, "chest");
        spawnSparkles(row, col);
        setOpeningChest(null);
      }, 700);
      return;
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
  }, [activateRobot, addCollectEffect, spawnSparkles, items, mission.trailSequence]);

  const crystalCollected = items.filter((i) => i.collected && i.type !== "robot" && i.type !== "pet").length;
  const petCollected = items.filter((i) => i.collected && i.type === "pet").length;
  const deliveryDone = deliveredZones.length;
  const nodesDone = activatedNodes.length;
  const goalsMet =
    crystalCollected >= effectiveCrystalGoal &&
    petCollected >= (mission.petGoal ?? 0) &&
    deliveryDone >= (mission.deliveryGoal ?? 0) &&
    nodesDone >= (mission.nodeGoal ?? 0);
  const trailTargetId = mission.trailSequence ? items.find((item) => !item.collected && item.type !== "robot" && item.type !== "pet")?.id : undefined;

  const checkShipReturn = useCallback((row: number, col: number) => {
    if (row === shipPos.current.row && col === shipPos.current.col && goalsMet && mission.requireReturn) {
      setGameOver(true);
      setMissionResult("success");
      setShipReached(true);
      setTimeout(() => completeOnce(totalCollected.current), 800);
    }
  }, [completeOnce, goalsMet, mission.requireReturn]);

  const movePlayer = useCallback((deltaRow: number, deltaCol: number, useDash = false) => {
    if (landing || gameOver) return;
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
        collectItem(itemAtPos, nextRow, nextCol);
        if (itemAtPos.type !== "robot") {
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
  }, [landing, gameOver, dashReady, mission.bossName, mission.patrolVision, playerPos.row, playerPos.col, walls, hazards, patrolSight, speedTiles, teleportMap, dropZones, carriedPayload, deliveredZones, activatedNodes, items, collectItem, checkShipReturn, addCollectEffect, applyDamage]);

  // Keyboard controls
  useEffect(() => {
    if (landing || gameOver) return;
    if (hp <= 0) {
      setGameOver(true);
      setMissionResult("fail");
      playFailSound();
      setTimeout(() => completeOnce(Math.floor(totalCollected.current * failRewardMultiplier)), 1200);
    }
  }, [hp, landing, gameOver, completeOnce, failRewardMultiplier]);

  useEffect(() => {
    if (landing || gameOver || enemies.length === 0) return;
    const timer = setInterval(() => {
      setEnemies((prev) =>
        prev.map((enemy) => {
          const dirs: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          const chase = Math.random() < 0.35;
          const [dr, dc] = chase
            ? [Math.sign(playerPos.row - enemy.row), Math.sign(playerPos.col - enemy.col)]
            : dirs[Math.floor(Math.random() * dirs.length)];
          const nr = enemy.row + dr;
          const nc = enemy.col + dc;
          if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS || walls.has(coordKey(nr, nc))) return enemy;
          return { row: nr, col: nc };
        }),
      );
    }, 900);
    return () => clearInterval(timer);
  }, [landing, gameOver, enemies.length, playerPos.row, playerPos.col, walls]);

  useEffect(() => {
    if (landing || gameOver || enemies.length === 0) return;
    const collided = enemies.some((enemy) => enemy.row === playerPos.row && enemy.col === playerPos.col);
    if (collided) {
      applyDamage(playerPos.row, playerPos.col);
      addCollectEffect("👾", 0, playerPos.row, playerPos.col, "robot");
      setPlayerPos({ row: shipPos.current.row, col: shipPos.current.col });
    }
  }, [enemies, playerPos.row, playerPos.col, landing, gameOver, addCollectEffect, applyDamage]);

  useEffect(() => {
    if (landing || gameOver || mission.requireReturn) return;
    if (goalsMet) {
      setGameOver(true);
      setMissionResult("success");
      setShipReached(true);
      playVictorySound();
      setTimeout(() => completeOnce(totalCollected.current), 700);
    }
  }, [completeOnce, goalsMet, landing, gameOver, mission.requireReturn]);

  useEffect(() => {
    if (landing || gameOver) return;
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
  }, [landing, gameOver, movePlayer]);

  // Tap handler
  const handleCellTap = useCallback((row: number, col: number) => {
    if (landing || gameOver) return;
    if (!isAdjacent(playerPos.row, playerPos.col, row, col)) return;
    movePlayer(row - playerPos.row, col - playerPos.col);
  }, [playerPos, landing, gameOver, movePlayer]);

  const handleReturnToShip = useCallback(() => {
    if (gameOver || landing) return;
    if (!goalsMet || !mission.requireReturn) return;
    if (playerPos.row !== shipPos.current.row || playerPos.col !== shipPos.current.col) return;
    setGameOver(true);
    setMissionResult("success");
    setShipReached(true);
    playVictorySound();
    setTimeout(() => completeOnce(totalCollected.current), 800);
  }, [completeOnce, gameOver, landing, playerPos, goalsMet, mission.requireReturn]);

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
    mission.crystalGoal ? `Crystals ${crystalCollected}/${mission.crystalGoal}` : null,
    mission.petGoal ? `Companion ${petCollected}/${mission.petGoal}` : null,
    mission.deliveryGoal ? `Deliveries ${deliveryDone}/${mission.deliveryGoal}` : null,
    mission.nodeGoal ? `Glow nodes ${nodesDone}/${mission.nodeGoal}` : null,
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
                  {t("landingOn")} {theme.name}...
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
      <div className="w-full flex flex-col gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-card/90 backdrop-blur-sm border border-border/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
          <span className="rounded-full border border-border/50 bg-background/25 px-2.5 py-1">Live Mission HUD</span>
          <span className={`rounded-full border px-2.5 py-1 ${canReturn ? "border-cosmic-green/30 bg-cosmic-green/10 text-cosmic-green" : "border-cosmic-yellow/25 bg-cosmic-yellow/10 text-cosmic-yellow"}`}>
            {canReturn ? (mission.requireReturn ? "Return Window Open" : "Extraction Complete") : "Objective In Progress"}
          </span>
        </div>
        <div className="text-center text-[10px] sm:text-xs font-semibold text-cosmic-cyan">
          {mission.name}: {mission.objective}
        </div>
        <div className="text-center text-[10px] font-bold text-white/80 sm:text-xs">
          Finish rule: {mission.requireReturn ? "Complete every counter below, then walk back onto the ship tile." : "Complete every counter below; extraction happens automatically. No return trip needed."}
        </div>
        {mission.bossName && (
          <div className="story-boss-bar" aria-label={`${mission.bossName} shield ${bossShield}%`}>
            <div><span>Boss encounter</span><strong>{mission.bossName}</strong><small>Shield {bossShield}%</small></div>
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
            <span className={`text-xs sm:text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
          </div>
        </div>
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
              ? "Mission targets complete. Head back to your ship to lock the run."
              : "Mission targets complete. Auto extraction in progress."}
          </p>
        )}
      </div>

      {/* Theme label */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        <span className="flex items-center gap-1.5">
          <MapIcon className="h-3.5 w-3.5" /> {theme.name}
          <span className="text-[8px] sm:text-[10px] opacity-60">({GRID_COLS}×{GRID_ROWS})</span>
        </span>
        <span className="rounded-full border border-border/40 bg-background/20 px-2.5 py-1">
          One tile per move · WASD / arrows · {dashReady ? "Hold Shift + direction to use your 2-tile dash" : "cross a swirl node to charge a dash"}
        </span>
        <span className="story-board-legend"><Navigation /> Pilot = you</span>
        <span className="story-board-legend"><Rocket /> Rocket = extraction</span>
        <span className="story-board-legend"><Gem /> Glowing badges = collectibles</span>
      </div>

      {/* Exploration Grid */}
      <div
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
                  aria-label={isPlayer ? "Your explorer" : isShip ? "Extraction ship" : item ? `${item.type} ${item.value ? `worth ${item.value}` : ""}` : `Grid cell ${row + 1}, ${col + 1}`}
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
                  {isHazard && !isPlayer && !isWall && <span className="story-objective-marker is-danger"><Zap aria-hidden="true" /><small>HAZARD</small></span>}
                  {isSpeedTile && !isPlayer && !isWall && <span className={`story-objective-marker is-node ${isActivatedNode ? "is-complete" : ""}`}>{isActivatedNode ? <Zap aria-hidden="true" /> : <Orbit aria-hidden="true" />}<small>{isActivatedNode ? "ONLINE" : "NODE"}</small></span>}
                  {isDropZone && !isPlayer && !isWall && <span className="story-objective-marker is-delivery"><Package aria-hidden="true" /><small>DROP</small></span>}
                  {isTeleport && !isPlayer && !isWall && <span className="story-objective-marker is-portal"><Orbit aria-hidden="true" /><small>GATE</small></span>}

                  {/* Ship marker (when player is not on it) */}
                  {isShip && !isPlayer && (
                    <motion.span
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="story-extraction-marker"
                    >
                      <Rocket aria-hidden="true" /><small>{canReturn ? "EXIT" : "SHIP"}</small>
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
                          <CircleHelp aria-hidden="true" /><small>SCAN</small>
                        </motion.span>
                      ) : (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={
                            isOpeningThis
                              ? { scale: [1, 1.5, 0], rotate: [0, 20, -20, 0] }
                              : { scale: 1, y: [0, -3, 0] }
                          }
                          transition={
                            isOpeningThis
                              ? { duration: 0.7 }
                              : { duration: 1.5 + Math.random(), repeat: Infinity }
                          }
                          className={`${item.type === "robot" ? "animate-pulse" : ""} ${item.id === trailTargetId ? "is-trail-target" : ""}`}
                        >
                          <StoryItemMarker item={item} />
                        </motion.span>
                      )}
                    </>
                  )}

                  {/* Enemies */}
                  {enemies.some((enemy) => enemy.row === row && enemy.col === col) && !isPlayer && (
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="story-enemy-marker"
                    >
                      <Skull aria-hidden="true" /><small>THREAT</small>
                    </motion.span>
                  )}

                  {/* Player */}
                  {isPlayer && (
                    <motion.div
                      layoutId="player"
                      className="story-player-marker z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <span>{pilotImage ? <img src={pilotImage} alt="" /> : <Navigation aria-hidden="true" />}</span><small>YOU</small>
                    </motion.div>
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
        <div className="flex flex-col items-center gap-1 sm:hidden">
          <button
            onClick={() => handleDpad("up")}
            className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
          >
            <ChevronUp className="w-8 h-8 text-foreground" />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => handleDpad("left")}
              className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
            >
              <ChevronLeft className="w-8 h-8 text-foreground" />
            </button>
            <div className="w-14 h-14" />
            <button
              onClick={() => handleDpad("right")}
              className="w-14 h-14 min-h-[56px] rounded-xl bg-card/80 border border-border/60 flex items-center justify-center active:bg-primary/30 active:scale-90 transition-all touch-manipulation shadow-md"
            >
              <ChevronRight className="w-8 h-8 text-foreground" />
            </button>
          </div>
          <button
            onClick={() => handleDpad("down")}
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
