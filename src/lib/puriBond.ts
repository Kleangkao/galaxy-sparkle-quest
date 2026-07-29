export interface PuriMilestone {
  bond: number;
  name: string;
  nameTh: string;
  ability: string;
  abilityTh: string;
  description: string;
  descriptionTh: string;
}

export const PURI_MILESTONES: PuriMilestone[] = [
  { bond: 0, name: "New Friend", nameTh: "เพื่อนใหม่", ability: "Signal Chirp", abilityTh: "เสียงนำทาง", description: "PURI joins every activity and celebrates discoveries.", descriptionTh: "PURI จะร่วมเดินทางและคอยส่งเสียงเมื่อคุณพบสิ่งใหม่" },
  { bond: 10, name: "Trail Buddy", nameTh: "คู่หูนักเดินทาง", ability: "Pocket Magnet", abilityTh: "แม่เหล็กจิ๋ว", description: "+25% pickup range in combat.", descriptionTh: "ดูดพลังในโหมดต่อสู้ได้ไกลขึ้น 25%" },
  { bond: 25, name: "Brave Buddy", nameTh: "คู่หูใจกล้า", ability: "Cushion Shield", abilityTh: "เกราะกันกระแทก", description: "+15 starting hull in combat.", descriptionTh: "เริ่มโหมดต่อสู้ด้วยพลังยาน +15" },
  { bond: 50, name: "Clever Buddy", nameTh: "คู่หูหัวไว", ability: "Quick Reload", abilityTh: "ช่วยเติมกระสุน", description: "Arcade reloads are 15% faster.", descriptionTh: "เติมกระสุนในโหมดยิงเป้าเร็วขึ้น 15%" },
  { bond: 75, name: "Power Buddy", nameTh: "คู่หูพลังล้น", ability: "Power Link", abilityTh: "เชื่อมพลัง", description: "+10% shot damage in Swarm and Arcade.", descriptionTh: "ยิงแรงขึ้น 10% ในโหมดฝ่าฝูงศัตรูและยิงเป้า" },
  { bond: 100, name: "Signal Synchronized", nameTh: "ใจตรงกัน", ability: "Fortune Link", abilityTh: "สายใยนำโชค", description: "+15% crystals from activity rewards.", descriptionTh: "รับคริสตัลจากทุกโหมดเพิ่ม 15%" },
];

export interface PuriBonuses {
  combatMagnet: number;
  combatHull: number;
  discoveryHint: boolean;
  strategyActions: number;
  arcadeReloadMultiplier: number;
  combatDamageMultiplier: number;
  rewardMultiplier: number;
}

export function getPuriBonuses(bond: number): PuriBonuses {
  return {
    combatMagnet: bond >= 10 ? 1.25 : 1,
    combatHull: bond >= 25 ? 15 : 0,
    discoveryHint: bond >= 50,
    strategyActions: bond >= 75 ? 1 : 0,
    arcadeReloadMultiplier: bond >= 50 ? 0.85 : 1,
    combatDamageMultiplier: bond >= 75 ? 1.1 : 1,
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
