export type ArcadeObjective = "boss" | "energy" | "score";

export interface ArcadeContract {
  id: string;
  name: string;
  nameTh: string;
  subtitle: string;
  subtitleTh: string;
  briefing: string;
  briefingTh: string;
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
    nameTh: "บุกแกน Ahr",
    subtitle: "Boss assault",
    subtitleTh: "สู้กับบอส",
    briefing: "Track the moving Ahr core with your mouse, manage reload timing, and break its armor before extraction.",
    briefingTh: "เล็งแกนพลัง Ahr ที่กำลังขยับ เติมกระสุนให้ทัน และทำลายเกราะก่อนหมดเวลา",
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
    nameTh: "ล่าคริสตัล",
    subtitle: "Collection sprint",
    subtitleTh: "เก็บสัญญาณ",
    briefing: "Aim at drifting crystal signals, ignore the red decoys, and build a clean accuracy streak.",
    briefingTh: "ยิงสัญญาณคริสตัลที่ลอยอยู่ อย่ายิงเป้าหลอกสีแดง และรักษาความแม่นให้ต่อเนื่อง",
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
    nameTh: "ทุบสถิติ",
    subtitle: "High-score attack",
    subtitleTh: "ทำคะแนนสูง",
    briefing: "Hit fast drones without clipping decoys. Combos and smart reload timing build the score.",
    briefingTh: "ยิงโดรนให้เร็ว อย่ายิงโดนเป้าหลอก รักษาคอมโบและเติมกระสุนให้ถูกจังหวะ",
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

export function getArcadeRunOutcome({
  score,
  shotsFired,
  hits,
  bestCombo,
  cleared,
  rewardMultiplier = 1,
  crystalMultiplier = 1,
}: {
  score: number;
  shotsFired: number;
  hits: number;
  bestCombo: number;
  cleared: boolean;
  rewardMultiplier?: number;
  crystalMultiplier?: number;
}) {
  const participated = shotsFired >= 3 && hits >= 1;
  const accuracy = shotsFired > 0 ? hits / shotsFired : 0;
  return {
    participated,
    accuracy,
    grade: getArcadeGrade(accuracy, cleared, bestCombo),
    crystals: participated
      ? Math.ceil((2 + Math.floor(score / 450) + (cleared ? 8 : 0)) * rewardMultiplier * crystalMultiplier)
      : 0,
    xp: participated ? 2 + Math.floor(score / 500) + (cleared ? 8 : 0) : 0,
  };
}
