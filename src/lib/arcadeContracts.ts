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
    briefing: "Track the moving Ahr core with your mouse, manage reload timing, and break its armor before extraction.",
    objective: "boss",
    target: 1,
    duration: 50,
    bossTime: null,
    spawnMultiplier: 1,
    image: "/assets/galia-current/ahr-boss-master-v3.webp",
    accent: "pink",
  },
  {
    id: "crystal-rush",
    name: "Crystal Rush",
    subtitle: "Collection sprint",
    briefing: "Aim at drifting crystal signals, ignore the red decoys, and build a clean accuracy streak.",
    objective: "energy",
    target: 14,
    duration: 45,
    bossTime: null,
    spawnMultiplier: 1.25,
    image: "/assets/galia-current/arcade-calibration-pistol-v1.webp",
    accent: "cyan",
  },
  {
    id: "score-breaker",
    name: "Score Breaker",
    subtitle: "High-score attack",
    briefing: "Hit fast drones without clipping decoys. Combos and smart reload timing build the score.",
    objective: "score",
    target: 1800,
    duration: 50,
    bossTime: null,
    spawnMultiplier: 1.4,
    image: "/assets/galia-current/bastion-7-ustur-guardian-v2.webp",
    accent: "yellow",
  },
];

export function getArcadeContract(id: string | null | undefined) {
  return ARCADE_CONTRACTS.find((contract) => contract.id === id) ?? ARCADE_CONTRACTS[0];
}

export function getArcadeGrade(accuracy: number, cleared: boolean, bestCombo: number) {
  if (cleared && accuracy >= 0.85 && bestCombo >= 8) return "S";
  if (cleared && accuracy >= 0.7) return "A";
  if (cleared || accuracy >= 0.6) return "B";
  if (accuracy >= 0.4) return "C";
  return "D";
}
