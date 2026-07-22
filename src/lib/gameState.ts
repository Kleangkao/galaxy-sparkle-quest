import { getPetById, getPetByName } from "@/lib/pets";
import { getPilot, getTool } from "@/lib/loadouts";

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
  chapter?: string;
  threat?: string;
  story?: string;
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
    id: "mud", name: "MUD", subtitle: "Forge Vanguard", emoji: "🔴",
    description: "Bold frontier engineers who turn wreckage into wonders. Choose MUD for sturdy gear, big salvage, and fearless exploration.",
    bonusText: "+20% salvage from every expedition",
    colorClass: "text-cosmic-pink", glowClass: "glow-text",
    borderClass: "border-cosmic-pink", bgClass: "bg-cosmic-pink",
    shipEmoji: "🚀", shipColor: "text-cosmic-pink",
    companionName: "Bolt", companionEmoji: "🤖",
    hslColor: "330 85% 65%",
  },
  {
    id: "oni", name: "ONI", subtitle: "Dreamseekers", emoji: "🔵",
    description: "Curious xenobiologists who follow living starlight. Choose ONI for secrets, strange creatures, and clever discoveries.",
    bonusText: "Rare companion signals appear more often",
    colorClass: "text-cosmic-cyan", glowClass: "glow-text-cyan",
    borderClass: "border-cosmic-cyan", bgClass: "bg-cosmic-cyan",
    shipEmoji: "🛸", shipColor: "text-cosmic-cyan",
    companionName: "Zyx", companionEmoji: "👽",
    hslColor: "190 90% 55%",
  },
  {
    id: "ustur", name: "USTUR", subtitle: "Swift Circuit", emoji: "🟡",
    description: "Lightning-fast machine pilots who calculate impossible routes. Choose USTUR for speed, precision, and early access.",
    bonusText: "Scan one sector ahead of your captain rank",
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
  { id: "shield", name: "Cosmic Shield", emoji: "🛡️", description: "Permanent safety system for Story and Swarm.", effect: "Keep 60% of failed Story rewards and start Swarm with +10 hull.", cost: 8, requiredLevel: 1 },
  { id: "booster", name: "Turbo Booster", emoji: "⚡", description: "Permanent route-time upgrade.", effect: "+5 seconds in Story, Swarm, and Arcade.", cost: 25, requiredLevel: 2 },
  { id: "scanner", name: "Crystal Scanner", emoji: "📡", description: "Permanent reward scanner for every mode.", effect: "+15% crystals from every activity.", cost: 40, requiredLevel: 3 },
  { id: "garden", name: "Pet Garden", emoji: "🌿", description: "Permanent passive habitat support.", effect: "+15% alien pet discovery chance.", cost: 50, requiredLevel: 4 },
  { id: "wings", name: "Star Wings", emoji: "🦋", description: "Permanent high-rank route tuning.", effect: "+8 seconds in Story, Swarm, and Arcade.", cost: 80, requiredLevel: 6 },
  { id: "crown", name: "Galaxy Crown", emoji: "👑", description: "Permanent reward relic for every mode.", effect: "+20% crystals from every activity.", cost: 120, requiredLevel: 8 },
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
  upgradeTiers: Record<string, number>;
  activeSkin: string;
  ownedSkins: string[];
  lastDailyReward: string | null;
  /** Per-planet faction influence scores */
  influence: Record<string, PlanetInfluence>;
  /** Active companion pet id */
  activePet: string | null;
  /** Collected eggs waiting to be hatched */
  eggs: import("@/lib/pets").AlienEgg[];
  /** Active expedition pilot. Loadout data is migration-safe and cloud-ready. */
  activePilot: string;
  /** Active expedition tool. */
  activeTool: string;
  modeRecords: {
    swarmHighScore: number;
    arcadeHighScore: number;
    discoveryFinds: number;
    strategyWins: number;
    puriBond: number;
    arcadeContracts: Record<string, { bestScore: number; clears: number }>;
    discoveryMastery: Record<string, number>;
    discoveryRuns: number;
    strategyCycles: number;
    strategyObjectives: number;
  };
  accessibility: {
    combatSpeed: 0.75 | 1 | 1.15;
    effects: "full" | "reduced";
    aimHelp: "standard" | "wide";
    contrast: "standard" | "high";
    sound: "full" | "quiet" | "off";
  };
}

export interface GameplayModifiers {
  crystalMultiplier: number;
  petDiscoveryBonus: number;
  missionTimeBonus: number;
  failRewardMultiplier: number;
  combatDamage: number;
  combatFireRate: number;
  combatHullBonus: number;
  arcadeMagazineBonus: number;
  arcadeReloadMultiplier: number;
  storyStartingHpBonus: number;
  storyDashReady: boolean;
}

export const MAX_UPGRADE_TIER = 3;

export function getUpgradeTier(state: Pick<GameState, "upgrades" | "upgradeTiers">, id: string) {
  return Math.max(state.upgrades.includes(id) ? 1 : 0, Math.min(MAX_UPGRADE_TIER, state.upgradeTiers[id] ?? 0));
}

export function getUpgradeCost(upgrade: ShipUpgrade, currentTier: number) {
  return Math.ceil(upgrade.cost * (1 + currentTier * 0.75));
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

export interface SectorLore {
  name: string;
  chapter: string;
  threat: string;
  story: string;
  mission: string;
}

export const SECTOR_LORE: Record<string, SectorLore> = {
  "sparkle-moon": { name: "Luma Outpost", chapter: "01 · First Light", threat: "Crystal surge", story: "A forgotten distress signal is repeating your captain code.", mission: "Restore the silent beacon inside the moon's singing crystal tunnels." },
  "candy-planet": { name: "Kora Wilds", chapter: "02 · Living Signal", threat: "Mimic spores", story: "The signal is alive—and it wants you to follow.", mission: "Track a playful lifeform through glowing coral forests." },
  "frosty-star": { name: "Vesper Drift", chapter: "03 · Cold Trail", threat: "Slipstream ice", story: "A lost navigation core contains a map erased from every archive.", mission: "Ride unstable ice streams and recover the navigation core." },
  "jungle-world": { name: "Verdant Vault", chapter: "04 · The Watchers", threat: "Guardian drones", story: "Someone protected this route long before the three crews arrived.", mission: "Outsmart roaming guardians beneath the ancient canopy." },
  "rainbow-nebula": { name: "Prism Reach", chapter: "05 · Broken Sky", threat: "Ion storm", story: "A rival expedition is racing for the same star-key.", mission: "Dash between shattered islands before the storm closes in." },
  "bubbly-bay": { name: "Pelagos Deep", chapter: "06 · Below the Stars", threat: "Pressure blooms", story: "The drowned observatory points beyond known space.", mission: "Power the observatory beneath an alien ocean." },
  "cookie-crater": { name: "Cinder Hollow", chapter: "07 · Falling Fire", threat: "Meteor swarm", story: "The star-key wakes a machine hidden inside the moon.", mission: "Salvage fuel cells while the crater floor breaks apart." },
  "starlight-shore": { name: "Astra Shoals", chapter: "08 · Starseed Run", threat: "Light tide", story: "The seeds can heal the frontier—or open its final gate.", mission: "Deliver two unstable star-seeds across tidal lightfields." },
  "crystal-cave": { name: "Nullspire", chapter: "09 · Three Rivals", threat: "Null sentinels", story: "The crews must choose: compete for the gate, or open it together.", mission: "Navigate a shifting fortress contested by every faction." },
  "golden-galaxy": { name: "The Aurora Crown", chapter: "10 · Beyond the Map", threat: "Crown keeper", story: "The lost signal has been waiting for a new Guardian.", mission: "Enter the Crown and answer the mystery at the heart of Galia." },
};

export function getSectorLore(planetId: string): SectorLore {
  const planet = PLANETS.find((candidate) => candidate.id === planetId);
  return SECTOR_LORE[planetId] ?? {
    name: planet?.name ?? "Unknown Sector",
    chapter: "Uncharted",
    threat: "Unknown",
    story: "No signal data is available.",
    mission: planet?.description ?? "Survey the sector.",
  };
}

function getStorageKey(faction: FactionId) {
  return `${STORAGE_KEY_PREFIX}:${faction}`;
}

function nonNegativeInteger(value: unknown, fallback = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(0, Math.floor(value)))
    : fallback;
}

function uniqueStrings(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
    : [];
}

function sanitizeInfluence(value: unknown): Record<string, PlanetInfluence> {
  const source = value && typeof value === "object" ? value as Record<string, Partial<PlanetInfluence>> : {};
  return Object.fromEntries(PLANETS.map((planet) => {
    const sector = source[planet.id];
    return [planet.id, {
      mud: nonNegativeInteger(sector?.mud, 0, INFLUENCE_TO_CAPTURE),
      oni: nonNegativeInteger(sector?.oni, 0, INFLUENCE_TO_CAPTURE),
      ustur: nonNegativeInteger(sector?.ustur, 0, INFLUENCE_TO_CAPTURE),
    }];
  }));
}

function sanitizeNumberRecord(value: unknown, maximum = Number.MAX_SAFE_INTEGER) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, nonNegativeInteger(entry, 0, maximum)]),
  );
}

function sanitizeContractRecords(value: unknown): GameState["modeRecords"]["arcadeContracts"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    const record = entry && typeof entry === "object" ? entry as { bestScore?: unknown; clears?: unknown } : {};
    return [key, {
      bestScore: nonNegativeInteger(record.bestScore),
      clears: nonNegativeInteger(record.clears),
    }];
  }));
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
  } catch {
    // Local storage is optional; private browsing may block it.
  }
}

function createStateSnapshot(source: Partial<GameState> | null | undefined, faction: FactionId | null): GameState {
  const xp = nonNegativeInteger(source?.xp);
  const pets = [...new Set(uniqueStrings(source?.pets)
    .map((pet) => getPetById(pet) ?? getPetByName(pet))
    .filter((pet): pet is NonNullable<typeof pet> => Boolean(pet))
    .map((pet) => pet.name))];
  const upgrades = uniqueStrings(source?.upgrades).filter((id) => SHIP_UPGRADES.some((upgrade) => upgrade.id === id));
  const upgradeTiers = Object.fromEntries(SHIP_UPGRADES.map((upgrade) => [
    upgrade.id,
    Math.min(MAX_UPGRADE_TIER, Math.max(nonNegativeInteger(source?.upgradeTiers?.[upgrade.id]), upgrades.includes(upgrade.id) ? 1 : 0)),
  ]));
  const ownedSkins = uniqueStrings(source?.ownedSkins).filter((id) => SHIP_SKINS.some((skin) => skin.id === id));
  if (!ownedSkins.includes("red-rocket")) ownedSkins.unshift("red-rocket");
  const requestedSkin = typeof source?.activeSkin === "string" ? source.activeSkin : "red-rocket";
  const activePetDefinition = typeof source?.activePet === "string"
    ? getPetById(source.activePet) ?? getPetByName(source.activePet)
    : undefined;
  const activePet = activePetDefinition && pets.includes(activePetDefinition.name) ? activePetDefinition.id : null;
  const eggs = Array.isArray(source?.eggs)
    ? source.eggs.filter((egg) => (
      egg && typeof egg.id === "string" &&
      (egg.rarity === "common" || egg.rarity === "rare" || egg.rarity === "legendary") &&
      typeof egg.foundAt === "string" && PLANETS.some((planet) => planet.id === egg.foundAt)
    )).slice(0, 8)
    : [];
  const lastDailyReward = typeof source?.lastDailyReward === "string" && Number.isFinite(Date.parse(source.lastDailyReward))
    ? source.lastDailyReward
    : null;

  return {
    faction,
    level: Math.min(RANKS.length, Math.max(nonNegativeInteger(source?.level, 1), getLevelFromXP(xp))),
    xp,
    crystals: nonNegativeInteger(source?.crystals),
    pets,
    visitedPlanets: uniqueStrings(source?.visitedPlanets).filter((id) => PLANETS.some((planet) => planet.id === id)),
    shipLevel: Math.max(1, nonNegativeInteger(source?.shipLevel, 1)),
    upgrades,
    upgradeTiers,
    activeSkin: ownedSkins.includes(requestedSkin) ? requestedSkin : "red-rocket",
    ownedSkins,
    lastDailyReward,
    influence: sanitizeInfluence(source?.influence),
    activePet,
    eggs,
    activePilot: getPilot(source?.activePilot).id,
    activeTool: getTool(source?.activeTool).id,
    modeRecords: {
      swarmHighScore: nonNegativeInteger(source?.modeRecords?.swarmHighScore),
      arcadeHighScore: nonNegativeInteger(source?.modeRecords?.arcadeHighScore),
      discoveryFinds: nonNegativeInteger(source?.modeRecords?.discoveryFinds),
      strategyWins: nonNegativeInteger(source?.modeRecords?.strategyWins),
      puriBond: nonNegativeInteger(source?.modeRecords?.puriBond, 0, 100),
      arcadeContracts: sanitizeContractRecords(source?.modeRecords?.arcadeContracts),
      discoveryMastery: sanitizeNumberRecord(source?.modeRecords?.discoveryMastery, 100),
      discoveryRuns: nonNegativeInteger(source?.modeRecords?.discoveryRuns),
      strategyCycles: nonNegativeInteger(source?.modeRecords?.strategyCycles),
      strategyObjectives: nonNegativeInteger(source?.modeRecords?.strategyObjectives),
    },
    accessibility: {
      combatSpeed: source?.accessibility?.combatSpeed === 0.75 || source?.accessibility?.combatSpeed === 1.15 ? source.accessibility.combatSpeed : 1,
      effects: source?.accessibility?.effects === "reduced" ? "reduced" : "full",
      aimHelp: source?.accessibility?.aimHelp === "wide" ? "wide" : "standard",
      contrast: source?.accessibility?.contrast === "high" ? "high" : "standard",
      sound: source?.accessibility?.sound === "off" ? "off" : source?.accessibility?.sound === "quiet" ? "quiet" : "full",
    },
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
  } catch {
    // Local storage is optional; private browsing may block it.
  }
}

export function loadGame(faction: FactionId | null = null): GameState {
  if (!faction) return createNewGameState(null);

  try {
    migrateLegacySave();
    const saved = localStorage.getItem(getStorageKey(faction));
    if (saved) {
      return createStateSnapshot(JSON.parse(saved) as Partial<GameState>, faction);
    }
  } catch {
    // Invalid legacy saves are ignored and replaced with safe defaults.
  }

  return createNewGameState(faction);
}

export function saveGame(state: GameState) {
  if (!state.faction) return;
  try {
    setLastPlayedFaction(state.faction);
    localStorage.setItem(getStorageKey(state.faction), JSON.stringify(createStateSnapshot(state, state.faction)));
  } catch {
    // Gameplay remains available in memory when storage is blocked or full.
  }
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
  } catch {
    // Local storage is optional; gameplay remains available without persistence.
  }

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

export function canClaimDaily(lastClaim: string | null, now = new Date()): boolean {
  if (!lastClaim) return true;
  const last = new Date(lastClaim);
  if (!Number.isFinite(last.getTime())) return true;
  return now.getTime() - last.getTime() >= 24 * 60 * 60 * 1000;
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

export function getGameplayModifiers(state: Pick<GameState, "activePet" | "upgrades" | "upgradeTiers" | "activePilot" | "activeTool" | "modeRecords">): GameplayModifiers {
  let crystalMultiplier = 1;
  let petDiscoveryBonus = 0;
  let missionTimeBonus = 0;
  let failRewardMultiplier = 0.3;
  let combatDamage = 1;
  let combatFireRate = 1;
  let combatHullBonus = 0;
  let arcadeMagazineBonus = 0;
  let arcadeReloadMultiplier = 1;
  let storyStartingHpBonus = 0;
  let storyDashReady = false;

  const activePet = state.activePet ? getPetById(state.activePet) || getPetByName(state.activePet) : undefined;
  const activePilot = getPilot(state.activePilot);
  const activeTool = getTool(state.activeTool);

  crystalMultiplier *= activePilot.crystalMultiplier ?? 1;
  missionTimeBonus += activePilot.missionTimeBonus ?? 0;
  failRewardMultiplier = Math.max(failRewardMultiplier, activePilot.failRewardMultiplier ?? 0);
  combatHullBonus += activePilot.combatHullBonus ?? 0;

  combatDamage *= activeTool.combatDamage ?? 1;
  combatFireRate *= activeTool.combatFireRate ?? 1;
  combatHullBonus += activeTool.combatHullBonus ?? 0;
  arcadeMagazineBonus += activeTool.arcadeMagazineBonus ?? 0;
  arcadeReloadMultiplier *= activeTool.arcadeReloadMultiplier ?? 1;

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
    const tier = getUpgradeTier(state, upgrade);
    switch (upgrade) {
      case "scanner":
        crystalMultiplier *= 1 + 0.15 * tier;
        break;
      case "crown":
        crystalMultiplier *= 1 + 0.2 * tier;
        break;
      case "garden":
        petDiscoveryBonus += 0.15 * tier;
        break;
      case "booster":
        missionTimeBonus += 5 * tier;
        break;
      case "wings":
        missionTimeBonus += 8 * tier;
        break;
      case "shield":
        failRewardMultiplier = Math.max(failRewardMultiplier, 0.5 + 0.1 * tier);
        combatHullBonus += 10 * tier;
        break;
    }
  }

  // The guard also keeps direct modifier calls from older integrations safe.
  if (state.modeRecords) {
    if (state.modeRecords.swarmHighScore >= 1500) storyStartingHpBonus += 1;
    if (Object.values(state.modeRecords.arcadeContracts).some((record) => record.clears > 0)) storyDashReady = true;
    if (state.modeRecords.discoveryFinds >= 18) petDiscoveryBonus += 0.1;
    if (state.modeRecords.strategyObjectives >= 2) crystalMultiplier *= 1.1;
  }

  return {
    crystalMultiplier,
    petDiscoveryBonus,
    missionTimeBonus,
    failRewardMultiplier,
    combatDamage,
    combatFireRate,
    combatHullBonus,
    arcadeMagazineBonus,
    arcadeReloadMultiplier,
    storyStartingHpBonus,
    storyDashReady,
  };
}

const FACTION_PLANET_NAMES: Record<FactionId, string[]> = {
  mud: ["MUD CSS", "MUD-01", "MUD-02", "MUD-03", "MUD-04", "MUD-05", "MRZ-1", "MRZ-2", "MRZ-3", "MRZ-4"],
  oni: ["ONI CSS", "ONI-01", "ONI-02", "ONI-03", "ONI-04", "ONI-05", "MRZ-17", "MRZ-18", "MRZ-19", "MRZ-20"],
  ustur: ["USTUR CSS", "USTUR-01", "USTUR-02", "USTUR-03", "USTUR-04", "USTUR-05", "MRZ-1", "MRZ-2", "MRZ-3", "MRZ-4"],
};

export function getPlanetDisplayName(planetIndex: number, faction: FactionId | null): string {
  const planet = PLANETS[planetIndex];
  if (planet) return getSectorLore(planet.id).name;
  if (!faction) return "Unknown";
  return FACTION_PLANET_NAMES[faction]?.[planetIndex] || "Unknown";
}

