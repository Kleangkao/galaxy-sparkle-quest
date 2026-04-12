export interface MissionBrief {
  title: string;
  encounters: string;
  tip: string;
}

export const MISSION_BRIEFS: Record<string, MissionBrief> = {
  "sparkle-moon": {
    title: "First Contact",
    encounters: "Open route, no enemies, basic crystal collect loop.",
    tip: "Take a clean path, grab 5 resources, return quickly to learn controls.",
  },
  "candy-planet": {
    title: "Simple Maze",
    encounters: "Small wall maze and dead ends.",
    tip: "Scan lanes first, then commit to one side to avoid backtracking.",
  },
  "frosty-star": {
    title: "First Decision",
    encounters: "45s timer pressure with spread-out resources.",
    tip: "Prioritize nearby clusters first, do not chase isolated pickups early.",
  },
  "jungle-world": {
    title: "Risk Zone",
    encounters: "Hazard cells that damage HP.",
    tip: "Avoid hazard shortcuts unless timer is low and target count is almost done.",
  },
  "rainbow-nebula": {
    title: "Speed Control",
    encounters: "Speed tiles can push movement rhythm faster.",
    tip: "Use boost tiles when aligned with your route, not while turning.",
  },
  "bubbly-bay": {
    title: "First Enemy",
    encounters: "One roaming enemy applies pressure.",
    tip: "Keep moving and avoid staying in corners where escape options are limited.",
  },
  "cookie-crater": {
    title: "Pet Hunt",
    encounters: "Hidden pockets and maze pockets with pet objective.",
    tip: "Clear hidden sectors methodically; do not rush random tiles.",
  },
  "starlight-shore": {
    title: "Slippery Ice",
    encounters: "Slippery movement and narrow lanes.",
    tip: "Move in straight lines and plan one tile ahead before each input.",
  },
  "crystal-cave": {
    title: "Multi Delivery",
    encounters: "Two delivery zones with enemy pressure.",
    tip: "Collect in batches and finish the nearest drop zone first.",
  },
  "golden-galaxy": {
    title: "Sector Chaos",
    encounters: "Mixed hazards: enemies, walls, teleports, and multi-goals.",
    tip: "Do objectives in order: safe collect -> pet confirm -> controlled return.",
  },
};

export function getMissionBrief(planetId: string): MissionBrief | null {
  return MISSION_BRIEFS[planetId] ?? null;
}
