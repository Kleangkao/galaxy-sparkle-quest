export const SWARM_BALANCE = {
  duration: 60,
  bossTime: 34,
  bossHp: 300,
  bossSpeed: 20,
  bossAttackCooldown: 5.2,
  bossTelegraphSeconds: 1.25,
  bossProjectileCount: 10,
  bossProjectileSpeed: 115,
} as const;

export const SWARM_PARTICIPATION = {
  movementDistance: 650,
  energyCollected: 3,
} as const;

export type SwarmBossPattern = "nova-ring" | "aimed-fan";

export type SwarmRunVariant = {
  id: "cadet-patrol" | "energy-bloom" | "ion-rush";
  name: string;
  nameTh: string;
  detail: string;
  detailTh: string;
  enemyHpMultiplier: number;
  spawnDelayMultiplier: number;
  dropMultiplier: number;
  scoreMultiplier: number;
  bossPattern: SwarmBossPattern;
};

const SWARM_VARIANTS: SwarmRunVariant[] = [
  {
    id: "cadet-patrol",
    name: "Cadet Patrol",
    nameTh: "รอบฝึกนักบิน",
    detail: "Gentler enemy hulls · Ahr uses expanding rings",
    detailTh: "ศัตรูพลังน้อยลง · Ahr ยิงเป็นวงรอบตัว",
    enemyHpMultiplier: 0.9,
    spawnDelayMultiplier: 1.08,
    dropMultiplier: 1,
    scoreMultiplier: 1,
    bossPattern: "nova-ring",
  },
  {
    id: "energy-bloom",
    name: "Energy Bloom",
    nameTh: "พลังงานล้นสนาม",
    detail: "Enemies drop more energy · Ahr aims a wide fan",
    detailTh: "ศัตรูปล่อยพลังมากขึ้น และ Ahr ยิงกระจายเป็นพัด",
    enemyHpMultiplier: 1,
    spawnDelayMultiplier: 1,
    dropMultiplier: 1.45,
    scoreMultiplier: 1,
    bossPattern: "aimed-fan",
  },
  {
    id: "ion-rush",
    name: "Ion Rush",
    nameTh: "คลื่นไอออน",
    detail: "More contacts · +15% score · Ahr uses expanding rings",
    detailTh: "ศัตรูมากขึ้น ได้คะแนนเพิ่ม 15% และ Ahr ยิงเป็นวงรอบตัว",
    enemyHpMultiplier: 0.95,
    spawnDelayMultiplier: 0.9,
    dropMultiplier: 1,
    scoreMultiplier: 1.15,
    bossPattern: "nova-ring",
  },
];

export function getSwarmRunVariant(completedRuns: number) {
  if (completedRuns < 2) return SWARM_VARIANTS[0];
  return SWARM_VARIANTS[1 + (Math.max(0, completedRuns - 2) % 2)];
}

export function getSwarmSpawnDelay(elapsed: number, bossActive: boolean) {
  const normalPressure = Math.max(0.5, 1.22 - elapsed * 0.008);
  return normalPressure + (bossActive ? 0.55 : 0);
}

export function getBossFightWindow(duration = SWARM_BALANCE.duration, bossTime = SWARM_BALANCE.bossTime) {
  return Math.max(0, duration - bossTime);
}

export function hasMeaningfulSwarmParticipation({
  won,
  movementDistance,
  energy,
  perkLevel,
}: {
  won: boolean;
  movementDistance: number;
  energy: number;
  perkLevel: number;
}) {
  return won
    || movementDistance >= SWARM_PARTICIPATION.movementDistance
    || energy >= SWARM_PARTICIPATION.energyCollected
    || perkLevel >= 2;
}
