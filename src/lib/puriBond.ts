export interface PuriMilestone {
  bond: number;
  name: string;
  ability: string;
  description: string;
}

export const PURI_MILESTONES: PuriMilestone[] = [
  { bond: 0, name: "New Friend", ability: "Signal Chirp", description: "PURI joins every activity and celebrates discoveries." },
  { bond: 10, name: "Trail Buddy", ability: "Pocket Magnet", description: "+25% pickup range in combat." },
  { bond: 25, name: "Brave Buddy", ability: "Cushion Shield", description: "+15 starting hull in combat." },
  { bond: 50, name: "Clever Buddy", ability: "Curious Nose", description: "Discovery signals give a warm-or-cold hint." },
  { bond: 75, name: "Command Buddy", ability: "Bright Idea", description: "+1 action in every Strategy-lite cycle." },
  { bond: 100, name: "Forever Friend", ability: "Lucky Hug", description: "+15% crystals from activity rewards." },
];

export interface PuriBonuses {
  combatMagnet: number;
  combatHull: number;
  discoveryHint: boolean;
  strategyActions: number;
  rewardMultiplier: number;
}

export function getPuriBonuses(bond: number): PuriBonuses {
  return {
    combatMagnet: bond >= 10 ? 1.25 : 1,
    combatHull: bond >= 25 ? 15 : 0,
    discoveryHint: bond >= 50,
    strategyActions: bond >= 75 ? 1 : 0,
    rewardMultiplier: bond >= 100 ? 1.15 : 1,
  };
}

export function getPuriProgress(bond: number) {
  const safeBond = Math.max(0, Math.min(100, bond));
  const unlocked = PURI_MILESTONES.filter((milestone) => safeBond >= milestone.bond);
  const current = unlocked[unlocked.length - 1];
  const next = PURI_MILESTONES.find((milestone) => milestone.bond > safeBond) ?? null;
  const span = next ? next.bond - current.bond : 1;
  const progress = next ? Math.round(((safeBond - current.bond) / span) * 1000) / 10 : 100;
  return { bond: safeBond, current, next, progress, unlockedCount: unlocked.length };
}
