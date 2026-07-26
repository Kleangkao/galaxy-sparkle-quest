import { GameState, PLANETS, getPlanetController, getSectorLore } from "@/lib/gameState";

export type StrategyAction = "scan" | "reinforce" | "disrupt";
export type SectorTrait = "calm" | "volatile" | "fortified" | "resonant";

export type RelayRouteChoice = {
  planetIndex: number;
  signal: number;
  damage: number;
  kind: "safe" | "risk";
};

export type RelayMission = {
  id: "signal-run" | "cargo-shield" | "storm-gap";
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  targetSignal: number;
  startingHull: number;
  recommendedRisks: number;
  routes: RelayRouteChoice[][];
};

export const RELAY_MISSIONS: RelayMission[] = [
  {
    id: "signal-run",
    name: "Signal Run",
    nameTh: "ส่งสัญญาณด่วน",
    description: "Take two risky jumps. One is too little signal; three will break an unshielded ship.",
    descriptionTh: "เลือกทางเสี่ยง 2 ครั้ง เลือกครั้งเดียวยังไม่พอ แต่ 3 ครั้งจะทำให้ยานที่ไม่มีเกราะพัง",
    targetSignal: 95,
    startingHull: 3,
    recommendedRisks: 2,
    routes: [
      [{ planetIndex: 1, signal: 18, damage: 0, kind: "safe" }, { planetIndex: 2, signal: 30, damage: 1, kind: "risk" }],
      [{ planetIndex: 3, signal: 19, damage: 0, kind: "safe" }, { planetIndex: 4, signal: 31, damage: 1, kind: "risk" }],
      [{ planetIndex: 5, signal: 17, damage: 0, kind: "safe" }, { planetIndex: 6, signal: 29, damage: 1, kind: "risk" }],
      [{ planetIndex: 7, signal: 18, damage: 0, kind: "safe" }, { planetIndex: 8, signal: 32, damage: 1, kind: "risk" }],
    ],
  },
  {
    id: "cargo-shield",
    name: "Cargo Escort",
    nameTh: "คุ้มกันสินค้า",
    description: "The cargo is fragile. One well-timed risky jump is enough to beat the signal deadline.",
    descriptionTh: "สินค้าบอบบาง เลือกทางเสี่ยงให้ถูกจังหวะเพียง 1 ครั้ง ก็ส่งสัญญาณทัน",
    targetSignal: 81,
    startingHull: 2,
    recommendedRisks: 1,
    routes: [
      [{ planetIndex: 2, signal: 18, damage: 0, kind: "safe" }, { planetIndex: 3, signal: 27, damage: 1, kind: "risk" }],
      [{ planetIndex: 4, signal: 17, damage: 0, kind: "safe" }, { planetIndex: 5, signal: 28, damage: 1, kind: "risk" }],
      [{ planetIndex: 6, signal: 18, damage: 0, kind: "safe" }, { planetIndex: 7, signal: 28, damage: 1, kind: "risk" }],
      [{ planetIndex: 8, signal: 19, damage: 0, kind: "safe" }, { planetIndex: 9, signal: 30, damage: 1, kind: "risk" }],
    ],
  },
  {
    id: "storm-gap",
    name: "Storm Gap",
    nameTh: "ฝ่าช่องพายุ",
    description: "The relay window is tiny. Take three risky jumps, then use one safe corridor to bring the ship home.",
    descriptionTh: "ช่วงส่งสัญญาณสั้นมาก เลือกทางเสี่ยง 3 ครั้ง และทางปลอดภัย 1 ครั้ง เพื่อพายานกลับบ้าน",
    targetSignal: 107,
    startingHull: 4,
    recommendedRisks: 3,
    routes: [
      [{ planetIndex: 3, signal: 18, damage: 0, kind: "safe" }, { planetIndex: 4, signal: 29, damage: 1, kind: "risk" }],
      [{ planetIndex: 5, signal: 19, damage: 0, kind: "safe" }, { planetIndex: 6, signal: 31, damage: 1, kind: "risk" }],
      [{ planetIndex: 7, signal: 20, damage: 0, kind: "safe" }, { planetIndex: 8, signal: 32, damage: 1, kind: "risk" }],
      [{ planetIndex: 9, signal: 17, damage: 0, kind: "safe" }, { planetIndex: 1, signal: 28, damage: 1, kind: "risk" }],
    ],
  },
];

export function getRelayMission(cycle: number) {
  return RELAY_MISSIONS[Math.abs(cycle) % RELAY_MISSIONS.length];
}

export function evaluateRelayRoute(mission: RelayMission, choices: RelayRouteChoice[], shieldCharges = 0) {
  let hull = mission.startingHull;
  let shields = Math.max(0, shieldCharges);
  let signal = 0;
  choices.forEach((choice) => {
    signal += choice.signal;
    if (choice.damage > 0 && shields > 0) shields -= 1;
    else hull = Math.max(0, hull - choice.damage);
  });
  return {
    signal,
    hull,
    riskCount: choices.filter((choice) => choice.kind === "risk").length,
    complete: choices.length === mission.routes.length && signal >= mission.targetSignal && hull > 0,
  };
}

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
