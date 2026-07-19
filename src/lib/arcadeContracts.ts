export type ArcadeObjective = "boss" | "energy" | "score";

export interface ArcadeContract {
  id: string;
  name: string;
  subtitle: string;
  briefing: string;
  objective: ArcadeObjective;
  target: number;
  duration: number;
  bossTime: number | null;
  spawnMultiplier: number;
  image: string;
  accent: "pink" | "cyan" | "yellow";
}

export const ARCADE_CONTRACTS: ArcadeContract[] = [
  {
    id: "ahr-blitz",
    name: "Ahr Blitz",
    subtitle: "Boss assault",
    briefing: "Build quickly, read the telegraphs, and drive Ahr out before extraction.",
    objective: "boss",
    target: 1,
    duration: 45,
    bossTime: 28,
    spawnMultiplier: 1,
    image: "/assets/star-atlas/14NRqo/01-joao-lira-ahr.webp",
    accent: "pink",
  },
  {
    id: "crystal-rush",
    name: "Crystal Rush",
    subtitle: "Collection sprint",
    briefing: "Cut through a dense field and collect 24 energy before the route collapses.",
    objective: "energy",
    target: 24,
    duration: 40,
    bossTime: null,
    spawnMultiplier: 1.25,
    image: "/assets/star-atlas/kN1PYn/03-robin-karlsson-pistol-still-03.webp",
    accent: "cyan",
  },
  {
    id: "score-breaker",
    name: "Score Breaker",
    subtitle: "High-score attack",
    briefing: "Reach 2,800 points against faster specialist units. Every pickup matters.",
    objective: "score",
    target: 2800,
    duration: 55,
    bossTime: 42,
    spawnMultiplier: 1.4,
    image: "/assets/star-atlas/bgenAm/01-joao-lira-cc-ust-m-combat-001.webp",
    accent: "yellow",
  },
];

export function getArcadeContract(id: string | null | undefined) {
  return ARCADE_CONTRACTS.find((contract) => contract.id === id) ?? ARCADE_CONTRACTS[0];
}
