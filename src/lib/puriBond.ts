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
  { bond: 0, name: "New Friend", nameTh: "เพื่อนใหม่", ability: "Signal Chirp", abilityTh: "เสียงเรียกจาก PURI", description: "PURI joins every activity and celebrates discoveries.", descriptionTh: "PURI จะร่วมเดินทางและฉลองทุกครั้งที่คุณค้นพบสิ่งใหม่" },
  { bond: 10, name: "Trail Buddy", nameTh: "คู่หูนักเดินทาง", ability: "Pocket Magnet", abilityTh: "แม่เหล็กจิ๋ว", description: "+25% pickup range in combat.", descriptionTh: "เก็บพลังในโหมดต่อสู้ได้ไกลขึ้น 25%" },
  { bond: 25, name: "Brave Buddy", nameTh: "คู่หูใจกล้า", ability: "Cushion Shield", abilityTh: "เกราะกันกระแทก", description: "+15 starting hull in combat.", descriptionTh: "เริ่มการต่อสู้ด้วยพลังยานเพิ่ม 15" },
  { bond: 50, name: "Clever Buddy", nameTh: "คู่หูหัวไว", ability: "Curious Nose", abilityTh: "เรดาร์นักสำรวจ", description: "Discovery signals give a warm-or-cold hint.", descriptionTh: "PURI จะช่วยบอกว่าอยู่ใกล้สัญญาณแค่ไหน" },
  { bond: 75, name: "Command Buddy", nameTh: "คู่หูนักวางแผน", ability: "Bright Idea", abilityTh: "ไอเดียปิ๊ง", description: "The first risky Control route takes no hull damage.", descriptionTh: "ทางเสี่ยงครั้งแรกในโหมดวางแผนจะไม่ทำให้ยานเสียพลัง" },
  { bond: 100, name: "Signal Synchronized", nameTh: "ใจตรงกัน", ability: "Fortune Link", abilityTh: "สายใยนำโชค", description: "+15% crystals from activity rewards.", descriptionTh: "ได้คริสตัลจากรางวัลเพิ่ม 15%" },
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
