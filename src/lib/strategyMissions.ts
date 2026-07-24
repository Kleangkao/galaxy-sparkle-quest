import { GameState, PLANETS, getPlanetController, getSectorLore } from "@/lib/gameState";

export type StrategyAction = "scan" | "reinforce" | "disrupt";
export type SectorTrait = "calm" | "volatile" | "fortified" | "resonant";

export const SECTOR_TRAITS: Record<string, { trait: SectorTrait; name: string; effect: string }> = Object.fromEntries(
  PLANETS.map((planet, index) => {
    const options = [
      { trait: "calm" as const, name: "Calm Route", effect: "Signal relays gain +4 influence." },
      { trait: "volatile" as const, name: "Volatile Front", effect: "Reinforce gains +6, but rivals react harder." },
      { trait: "fortified" as const, name: "Old Defenses", effect: "Disrupt is 5 points stronger here." },
      { trait: "resonant" as const, name: "Signal Resonance", effect: "All friendly actions gain +3 influence." },
    ];
    return [planet.id, options[index % options.length]];
  })
);

export interface StrategyObjective {
  id: "secure" | "focus" | "survey" | "contain";
  name: string;
  description: string;
  targetPlanetId: string;
}

export function getStrategyObjective(cycle: number): StrategyObjective {
  const target = PLANETS[(cycle * 3 + 1) % PLANETS.length];
  const type = cycle % 4;
  if (type === 0) return { id: "secure", name: "Secure a sector", description: "Bring any neutral or rival sector to 100 influence.", targetPlanetId: target.id };
  if (type === 1) return { id: "focus", name: `Stabilize ${getSectorLore(target.id).name}`, description: "Reach 65 influence in the highlighted sector.", targetPlanetId: target.id };
  if (type === 2) return { id: "survey", name: "Map three sectors", description: "Use command actions in three different sectors.", targetPlanetId: target.id };
  return { id: "contain", name: `Contain rivals at ${getSectorLore(target.id).name}`, description: "Reach 50 friendly influence and keep every rival below 40.", targetPlanetId: target.id };
}

export function isStrategyObjectiveComplete(objective: StrategyObjective, state: GameState, startControlled: number, touched: string[]) {
  if (!state.faction) return false;
  if (objective.id === "secure") {
    const now = Object.values(state.influence).filter((sector) => getPlanetController(sector) === state.faction).length;
    return now > startControlled;
  }
  if (objective.id === "focus") return state.influence[objective.targetPlanetId]?.[state.faction] >= 65;
  if (objective.id === "survey") return new Set(touched).size >= 3;
  const sector = state.influence[objective.targetPlanetId];
  return sector[state.faction] >= 50 && Object.entries(sector).every(([id, value]) => id === state.faction || value < 40);
}

export function getStrategyActionValues(planetId: string) {
  const trait = SECTOR_TRAITS[planetId]?.trait;
  return {
    scan: 12 + (trait === "calm" ? 4 : 0) + (trait === "resonant" ? 3 : 0),
    reinforce: 28 + (trait === "volatile" ? 6 : 0) + (trait === "resonant" ? 3 : 0),
    disrupt: 16 + (trait === "fortified" ? 5 : 0),
    rivalPressure: trait === "volatile" ? 1.35 : 1,
  };
}
