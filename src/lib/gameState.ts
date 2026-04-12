import { getPetById, getPetByName } from "@/lib/pets";

export interface Planet {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glowClass: string;
  biome: PlanetBiome;
  description: string;
  unlockLevel: number;
  crystals: number;
  xp: number;
  pet: { name: string; emoji: string } | null;
  position: { x: number; y: number };
  miniGame: "tap-crystals" | "find-pets" | "match-3" | "hidden-animals" | "collect-stars";
}

export type FactionId = "mud" | "oni" | "ustur";
export type PlanetBiome = "crystal" | "candy" | "ice" | "jungle" | "nebula" | "ocean" | "crater" | "shore" | "cave" | "legendary";

export interface Faction {
  id: FactionId;
  name: string;
  subtitle: string;
  emoji: string;
  description: string;
  bonusText: string;
  colorClass: string;
  glowClass: string;
  borderClass: string;
  bgClass: string;
  shipEmoji: string;
  shipColor: string;
  companionName: string;
  companionEmoji: string;
  /** HSL color string for influence rings / bars */
  hslColor: string;
}

export const FACTIONS: Faction[] = [
  {
    id: "mud", name: "MUD", subtitle: "The Builders", emoji: "🔴",
    description: "The MUD explorers love building bases and collecting crystals. Brave, curious, and hardworking!",
    bonusText: "+20% more crystals from planets",
    colorClass: "text-cosmic-pink", glowClass: "glow-text",
    borderClass: "border-cosmic-pink", bgClass: "bg-cosmic-pink",
    shipEmoji: "🚀", shipColor: "text-cosmic-pink",
    companionName: "Bolt", companionEmoji: "🤖",
    hslColor: "330 85% 65%",
  },
  {
    id: "oni", name: "ONI", subtitle: "The Alien Masters", emoji: "🔵",
    description: "The ONI aliens use special space magic and discover rare alien pets. Smart, mysterious, and creative!",
    bonusText: "Higher chance to find alien pets",
    colorClass: "text-cosmic-cyan", glowClass: "glow-text-cyan",
    borderClass: "border-cosmic-cyan", bgClass: "bg-cosmic-cyan",
    shipEmoji: "🛸", shipColor: "text-cosmic-cyan",
    companionName: "Zyx", companionEmoji: "👽",
    hslColor: "190 90% 55%",
  },
  {
    id: "ustur", name: "USTUR", subtitle: "The Robot Intelligence", emoji: "🟡",
    description: "The USTUR robots use smart technology to travel faster in space. Logical, fast, and helpful!",
    bonusText: "Faster travel + unlock planets earlier",
    colorClass: "text-cosmic-yellow", glowClass: "glow-text-yellow",
    borderClass: "border-cosmic-yellow", bgClass: "bg-cosmic-yellow",
    shipEmoji: "🚄", shipColor: "text-cosmic-yellow",
    companionName: "Pixel", companionEmoji: "🔮",
    hslColor: "45 95% 60%",
  },
];

export const RANKS = [
  { level: 1, name: "Cadet", emoji: "🌟" },
  { level: 2, name: "Explorer", emoji: "🔭" },
  { level: 3, name: "Navigator", emoji: "🧭" },
  { level: 4, name: "Pilot", emoji: "✈️" },
  { level: 5, name: "Captain", emoji: "⚓" },
  { level: 6, name: "Commander", emoji: "🎖️" },
  { level: 7, name: "Admiral", emoji: "👑" },
  { level: 8, name: "Star Master", emoji: "⭐" },
  { level: 9, name: "Galaxy Hero", emoji: "🦸" },
  { level: 10, name: "Cosmic Legend", emoji: "🌌" },
];

export const XP_THRESHOLDS = [0, 10, 25, 50, 85, 130, 190, 260, 350, 460];

export interface ShipSkin {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  requiredLevel: number;
}

export const SHIP_SKINS: ShipSkin[] = [
  { id: "red-rocket", name: "Red Rocket", emoji: "🔴", cost: 0, requiredLevel: 1 },
  { id: "candy-ship", name: "Candy Ship", emoji: "🍭", cost: 20, requiredLevel: 2 },
  { id: "ice-ship", name: "Ice Ship", emoji: "❄️", cost: 35, requiredLevel: 3 },
  { id: "jungle-cruiser", name: "Jungle Cruiser", emoji: "🌿", cost: 50, requiredLevel: 4 },
  { id: "rainbow-ship", name: "Rainbow Ship", emoji: "🌈", cost: 70, requiredLevel: 6 },
  { id: "golden-starship", name: "Golden Starship", emoji: "✨", cost: 100, requiredLevel: 8 },
];

export interface ShipUpgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: string;
  cost: number;
  requiredLevel: number;
}

export const SHIP_UPGRADES: ShipUpgrade[] = [
  { id: "shield", name: "Cosmic Shield", emoji: "🛡️", description: "Permanent passive safety system.", effect: "Failed missions now keep at least 60% of rewards.", cost: 15, requiredLevel: 1 },
  { id: "booster", name: "Turbo Booster", emoji: "⚡", description: "Permanent passive engine upgrade.", effect: "+5 seconds on every mission timer.", cost: 25, requiredLevel: 2 },
  { id: "scanner", name: "Crystal Scanner", emoji: "📡", description: "Permanent passive scan module.", effect: "+15% crystals from missions.", cost: 40, requiredLevel: 3 },
  { id: "garden", name: "Pet Garden", emoji: "🌿", description: "Permanent passive habitat support.", effect: "+15% alien pet discovery chance.", cost: 50, requiredLevel: 4 },
  { id: "wings", name: "Star Wings", emoji: "🦋", description: "Permanent passive flight tuning.", effect: "+8 seconds on every mission timer.", cost: 80, requiredLevel: 6 },
  { id: "crown", name: "Galaxy Crown", emoji: "👑", description: "Permanent passive command relic.", effect: "+20% crystals from missions.", cost: 120, requiredLevel: 8 },
];

// ─── Faction Influence System ────────────────────────────────────

/** Influence data for a single planet: how much each faction has contributed */
export interface PlanetInfluence {
  mud: number;
  oni: number;
  ustur: number;
}

/** Threshold to capture a planet */
export const INFLUENCE_TO_CAPTURE = 100;

export type PlanetStatus = "neutral" | "contested" | "controlled";

export function getPlanetStatus(inf: PlanetInfluence): PlanetStatus {
  const max = Math.max(inf.mud, inf.oni, inf.ustur);
  if (max >= INFLUENCE_TO_CAPTURE) return "controlled";
  if (max > 0) return "contested";
  return "neutral";
}

export function getPlanetController(inf: PlanetInfluence): FactionId | null {
  if (inf.mud >= INFLUENCE_TO_CAPTURE) return "mud";
  if (inf.oni >= INFLUENCE_TO_CAPTURE) return "oni";
  if (inf.ustur >= INFLUENCE_TO_CAPTURE) return "ustur";
  return null;
}

export function getPlanetLeader(inf: PlanetInfluence): FactionId {
  if (inf.mud >= inf.oni && inf.mud >= inf.ustur) return "mud";
  if (inf.oni >= inf.mud && inf.oni >= inf.ustur) return "oni";
  return "ustur";
}

/** Count how many planets a faction controls */
export function countControlled(influence: Record<string, PlanetInfluence>, factionId: FactionId): number {
  return Object.values(influence).filter(inf => getPlanetController(inf) === factionId).length;
}

/** Get faction bonus multiplier based on planets controlled */
export function getFactionControlBonus(influence: Record<string, PlanetInfluence>, factionId: FactionId): number {
  const count = countControlled(influence, factionId);
  // Each controlled planet gives +5% bonus (up to +50%)
  return 1 + count * 0.05;
}

const PLANET_BIOME_RIVAL_BIAS: Record<PlanetBiome, Record<FactionId, number>> = {
  crystal: { mud: 1.45, oni: 0.9, ustur: 1.05 },
  candy: { mud: 0.9, oni: 1.4, ustur: 1.0 },
  ice: { mud: 0.95, oni: 0.95, ustur: 1.4 },
  jungle: { mud: 1.05, oni: 1.35, ustur: 0.9 },
  nebula: { mud: 0.95, oni: 1.15, ustur: 1.3 },
  ocean: { mud: 1.1, oni: 1.15, ustur: 1.1 },
  crater: { mud: 1.25, oni: 1.15, ustur: 0.95 },
  shore: { mud: 0.95, oni: 1.0, ustur: 1.35 },
  cave: { mud: 1.3, oni: 1.05, ustur: 1.0 },
  legendary: { mud: 1.1, oni: 1.2, ustur: 1.2 },
};

function getMiniGameRivalBias(planet: Planet): Record<FactionId, number> {
  switch (planet.miniGame) {
    case "tap-crystals":
      return { mud: 1.2, oni: 0.95, ustur: 1.0 };
    case "find-pets":
      return { mud: 0.95, oni: 1.25, ustur: 1.0 };
    case "hidden-animals":
      return { mud: 1.0, oni: 1.2, ustur: 0.95 };
    case "match-3":
      return { mud: 0.95, oni: 1.0, ustur: 1.2 };
    case "collect-stars":
      return { mud: 1.0, oni: 1.1, ustur: 1.15 };
    default:
      return { mud: 1, oni: 1, ustur: 1 };
  }
}

function getPlanetRivalBias(planet: Planet, factionId: FactionId) {
  const biomeBias = PLANET_BIOME_RIVAL_BIAS[planet.biome]?.[factionId] ?? 1;
  const miniGameBias = getMiniGameRivalBias(planet)[factionId] ?? 1;
  return biomeBias * miniGameBias;
}

/** Simulate background faction activity on a planet between the player's solo missions */
export function simulateRivalInfluence(inf: PlanetInfluence, playerFaction: FactionId, planet: Planet): PlanetInfluence {
  const result = { ...inf };
  const total = inf.mud + inf.oni + inf.ustur;
  const leader = total > 0 ? getPlanetLeader(inf) : null;
  const rivals: FactionId[] = (["mud", "oni", "ustur"] as FactionId[]).filter(f => f !== playerFaction);

  for (const rival of rivals) {
    const current = inf[rival];
    const pressureBias = getPlanetRivalBias(planet, rival);
    const depthBonus = Math.min(planet.unlockLevel, 10) * 0.18;
    const leaderMomentum = leader === rival ? 1.15 : 1;
    const catchupBonus = total > 0 && current < 40 ? 1.08 : 1;
    const controlledSlowdown = getPlanetController(inf) ? 0.72 : 1;
    const baseGain = 2.5 + Math.random() * 3.5;
    const weightedGain = baseGain * pressureBias * (1 + depthBonus) * leaderMomentum * catchupBonus * controlledSlowdown;
    const gain = Math.max(1, Math.round(weightedGain));
    result[rival] = Math.min(result[rival] + gain, INFLUENCE_TO_CAPTURE - 1); // rivals can't auto-capture
  }

  return result;
}

/** How much influence a player earns from completing a mission */
export function calcInfluenceGain(crystalsCollected: number, xp: number): number {
  // Base 15 + bonus from performance
  return 15 + Math.floor(crystalsCollected / 3) + Math.floor(xp / 5);
}

// ─── Game State ──────────────────────────────────────────────────

export interface GameState {
  faction: FactionId | null;
  level: number;
  xp: number;
  crystals: number;
  pets: string[];
  visitedPlanets: string[];
  shipLevel: number;
  upgrades: string[];
  activeSkin: string;
  ownedSkins: string[];
  lastDailyReward: string | null;
  /** Per-planet faction influence scores */
  influence: Record<string, PlanetInfluence>;
  /** Active companion pet id */
  activePet: string | null;
  /** Collected eggs waiting to be hatched */
  eggs: import("@/lib/pets").AlienEgg[];
}

export interface GameplayModifiers {
  crystalMultiplier: number;
  petDiscoveryBonus: number;
  missionTimeBonus: number;
  failRewardMultiplier: number;
}

const LEGACY_STORAGE_KEY = "cosmic-explorer-save";
const STORAGE_KEY_PREFIX = "cosmic-explorer-save-v2";
const LAST_PLAYED_FACTION_KEY = "cosmic-explorer-last-faction";

function defaultInfluence(): Record<string, PlanetInfluence> {
  const inf: Record<string, PlanetInfluence> = {};
  for (const p of PLANETS) {
    inf[p.id] = { mud: 0, oni: 0, ustur: 0 };
  }
  return inf;
}

export const PLANETS: Planet[] = [
  { id: "sparkle-moon", name: "Sparkle Moon", emoji: "🌙", color: "bg-cosmic-yellow", glowClass: "planet-glow-yellow", biome: "crystal", description: "Explore crystal caves and collect glowing gems!", unlockLevel: 1, crystals: 5, xp: 10, pet: { name: "Aneko", emoji: "🐱" }, position: { x: 23, y: 16 }, miniGame: "tap-crystals" },
  { id: "candy-planet", name: "Candy Planet", emoji: "🍭", color: "bg-cosmic-pink", glowClass: "planet-glow-pink", biome: "candy", description: "Find hidden alien pets behind candy rocks!", unlockLevel: 2, crystals: 8, xp: 15, pet: { name: "Tigu", emoji: "😺" }, position: { x: 41, y: 16 }, miniGame: "find-pets" },
  { id: "frosty-star", name: "Frosty Star", emoji: "❄️", color: "bg-cosmic-cyan", glowClass: "planet-glow-cyan", biome: "ice", description: "Slide across ice to reach treasure chests!", unlockLevel: 3, crystals: 12, xp: 20, pet: { name: "SnowD", emoji: "⛄" }, position: { x: 59, y: 16 }, miniGame: "match-3" },
  { id: "jungle-world", name: "Jungle World", emoji: "🌴", color: "bg-cosmic-green", glowClass: "planet-glow", biome: "jungle", description: "Discover hidden temples and treasure relics!", unlockLevel: 4, crystals: 15, xp: 25, pet: { name: "Vada", emoji: "🐲" }, position: { x: 77, y: 16 }, miniGame: "hidden-animals" },
  { id: "rainbow-nebula", name: "Rainbow Nebula", emoji: "🌈", color: "bg-cosmic-purple", glowClass: "planet-glow", biome: "nebula", description: "Fly between islands collecting rainbow stars!", unlockLevel: 5, crystals: 18, xp: 30, pet: { name: "Flynnie", emoji: "🐶" }, position: { x: 32, y: 38 }, miniGame: "collect-stars" },
  { id: "bubbly-bay", name: "Bubbly Bay", emoji: "🫧", color: "bg-cosmic-blue", glowClass: "planet-glow-cyan", biome: "ocean", description: "Pop bubbles to find ocean treasures!", unlockLevel: 6, crystals: 22, xp: 35, pet: { name: "Blobbo", emoji: "🫧" }, position: { x: 50, y: 38 }, miniGame: "tap-crystals" },
  { id: "cookie-crater", name: "Cookie Crater", emoji: "🍪", color: "bg-cosmic-orange", glowClass: "planet-glow-yellow", biome: "crater", description: "Find cookies hidden in craters!", unlockLevel: 7, crystals: 25, xp: 40, pet: { name: "Sparkle", emoji: "✨" }, position: { x: 68, y: 38 }, miniGame: "find-pets" },
  { id: "starlight-shore", name: "Starlight Shore", emoji: "⭐", color: "bg-cosmic-yellow", glowClass: "planet-glow-yellow", biome: "shore", description: "Match glowing starlight gems!", unlockLevel: 8, crystals: 28, xp: 45, pet: { name: "Zippy", emoji: "🦎" }, position: { x: 41, y: 61 }, miniGame: "match-3" },
  { id: "crystal-cave", name: "Crystal Cave", emoji: "💎", color: "bg-cosmic-cyan", glowClass: "planet-glow-cyan", biome: "cave", description: "Explore deep caves full of crystals!", unlockLevel: 9, crystals: 32, xp: 50, pet: { name: "Lumi", emoji: "🦋" }, position: { x: 59, y: 61 }, miniGame: "hidden-animals" },
  { id: "golden-galaxy", name: "Golden Galaxy", emoji: "🌟", color: "bg-cosmic-yellow", glowClass: "planet-glow-yellow", biome: "legendary", description: "The legendary golden galaxy awaits!", unlockLevel: 10, crystals: 40, xp: 60, pet: { name: "Little", emoji: "🐯" }, position: { x: 50, y: 84 }, miniGame: "collect-stars" },
];

function getStorageKey(faction: FactionId) {
  return `${STORAGE_KEY_PREFIX}:${faction}`;
}

export function getLastPlayedFaction(): FactionId | null {
  try {
    const faction = localStorage.getItem(LAST_PLAYED_FACTION_KEY);
    return faction === "mud" || faction === "oni" || faction === "ustur" ? faction : null;
  } catch {
    return null;
  }
}

export function setLastPlayedFaction(faction: FactionId | null) {
  try {
    if (!faction) {
      localStorage.removeItem(LAST_PLAYED_FACTION_KEY);
      return;
    }
    localStorage.setItem(LAST_PLAYED_FACTION_KEY, faction);
  } catch {}
}

function createStateSnapshot(source: Partial<GameState> | null | undefined, faction: FactionId | null): GameState {
  return {
    faction,
    level: source?.level || 1,
    xp: source?.xp || 0,
    crystals: source?.crystals || 0,
    pets: source?.pets || [],
    visitedPlanets: source?.visitedPlanets || [],
    shipLevel: source?.shipLevel || 1,
    upgrades: source?.upgrades || [],
    activeSkin: source?.activeSkin || "red-rocket",
    ownedSkins: source?.ownedSkins || ["red-rocket"],
    lastDailyReward: source?.lastDailyReward || null,
    influence: source?.influence || defaultInfluence(),
    activePet: source?.activePet || null,
    eggs: source?.eggs || [],
  };
}

export function createNewGameState(faction: FactionId | null = null): GameState {
  return createStateSnapshot(null, faction);
}

function migrateLegacySave() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return;

    const parsed = JSON.parse(legacy) as Partial<GameState>;
    const legacyFaction = parsed?.faction;

    if (legacyFaction === "mud" || legacyFaction === "oni" || legacyFaction === "ustur") {
      const targetKey = getStorageKey(legacyFaction);
      if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, JSON.stringify(createStateSnapshot(parsed, legacyFaction)));
      }
    }

    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}

export function loadGame(faction: FactionId | null = null): GameState {
  if (!faction) return createNewGameState(null);

  try {
    migrateLegacySave();
    const saved = localStorage.getItem(getStorageKey(faction));
    if (saved) {
      return createStateSnapshot(JSON.parse(saved) as Partial<GameState>, faction);
    }
  } catch {}

  return createNewGameState(faction);
}

export function saveGame(state: GameState) {
  if (!state.faction) return;
  setLastPlayedFaction(state.faction);
  localStorage.setItem(getStorageKey(state.faction), JSON.stringify(createStateSnapshot(state, state.faction)));
}

export function resetGame(faction: FactionId | null = null): GameState {
  try {
    if (!faction) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setLastPlayedFaction(null);
      for (const id of ["mud", "oni", "ustur"] as FactionId[]) {
        localStorage.removeItem(getStorageKey(id));
      }
      return createNewGameState(null);
    }

    localStorage.removeItem(getStorageKey(faction));
    if (getLastPlayedFaction() === faction) {
      setLastPlayedFaction(faction);
    }
  } catch {}

  return createNewGameState(faction);
}

export function isPlanetUnlocked(planet: Planet, level: number, faction: FactionId | null) {
  const bonus = faction === "ustur" ? 1 : 0;
  return planet.unlockLevel <= level + bonus;
}

export function getCrystalBonus(base: number, faction: FactionId | null): number {
  if (faction === "mud") return Math.floor(base * 1.2);
  return base;
}

export function getLevelFromXP(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getRank(level: number) {
  return RANKS[Math.min(level - 1, RANKS.length - 1)];
}

export function getXPProgress(xp: number, level: number) {
  const current = XP_THRESHOLDS[level - 1] || 0;
  const next = XP_THRESHOLDS[level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 100;
  return { current, next, progress: Math.min(((xp - current) / (next - current)) * 100, 100) };
}

export function canClaimDaily(lastClaim: string | null): boolean {
  if (!lastClaim) return true;
  const last = new Date(lastClaim);
  const now = new Date();
  return now.getTime() - last.getTime() > 24 * 60 * 60 * 1000;
}

export function getFaction(id: FactionId | null): Faction | undefined {
  return FACTIONS.find((f) => f.id === id);
}

export function getShipSkin(id: string) {
  return SHIP_SKINS.find((skin) => skin.id === id);
}

export function getActiveShipEmoji(state: Pick<GameState, "activeSkin" | "faction">): string {
  return getShipSkin(state.activeSkin)?.emoji || getFaction(state.faction)?.shipEmoji || "🚀";
}

export function getGameplayModifiers(state: Pick<GameState, "activePet" | "upgrades">): GameplayModifiers {
  let crystalMultiplier = 1;
  let petDiscoveryBonus = 0;
  let missionTimeBonus = 0;
  let failRewardMultiplier = 0.3;

  const activePet = state.activePet ? getPetById(state.activePet) || getPetByName(state.activePet) : undefined;

  switch (activePet?.id) {
    case "aneko":
      crystalMultiplier *= 1.1;
      break;
    case "vada":
      crystalMultiplier *= 1.2;
      break;
    case "blobbo":
      crystalMultiplier *= 1.15;
      break;
    case "tigu":
      petDiscoveryBonus += 0.08;
      break;
    case "nova":
      petDiscoveryBonus += 0.25;
      break;
    case "lumi":
      petDiscoveryBonus += 0.15;
      break;
    case "flynnie":
      missionTimeBonus += 3;
      break;
    case "sparkle":
      missionTimeBonus += 5;
      break;
    case "frosty":
      missionTimeBonus += 5;
      break;
    case "zippy":
      missionTimeBonus += 4;
      break;
  }

  for (const upgrade of state.upgrades) {
    switch (upgrade) {
      case "scanner":
        crystalMultiplier *= 1.15;
        break;
      case "crown":
        crystalMultiplier *= 1.2;
        break;
      case "garden":
        petDiscoveryBonus += 0.15;
        break;
      case "booster":
        missionTimeBonus += 5;
        break;
      case "wings":
        missionTimeBonus += 8;
        break;
      case "shield":
        failRewardMultiplier = Math.max(failRewardMultiplier, 0.6);
        break;
    }
  }

  return {
    crystalMultiplier,
    petDiscoveryBonus,
    missionTimeBonus,
    failRewardMultiplier,
  };
}

const FACTION_PLANET_NAMES: Record<FactionId, string[]> = {
  mud: ["MUD CSS", "MUD-01", "MUD-02", "MUD-03", "MUD-04", "MUD-05", "MRZ-1", "MRZ-2", "MRZ-3", "MRZ-4"],
  oni: ["ONI CSS", "ONI-01", "ONI-02", "ONI-03", "ONI-04", "ONI-05", "MRZ-17", "MRZ-18", "MRZ-19", "MRZ-20"],
  ustur: ["USTUR CSS", "USTUR-01", "USTUR-02", "USTUR-03", "USTUR-04", "USTUR-05", "MRZ-1", "MRZ-2", "MRZ-3", "MRZ-4"],
};

export function getPlanetDisplayName(planetIndex: number, faction: FactionId | null): string {
  if (!faction) return PLANETS[planetIndex]?.name || "Unknown";
  return FACTION_PLANET_NAMES[faction]?.[planetIndex] || PLANETS[planetIndex]?.name || "Unknown";
}

