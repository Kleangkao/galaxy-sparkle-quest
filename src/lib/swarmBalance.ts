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

export function getSwarmSpawnDelay(elapsed: number, bossActive: boolean) {
  const normalPressure = Math.max(0.5, 1.22 - elapsed * 0.008);
  return normalPressure + (bossActive ? 0.55 : 0);
}

export function getBossFightWindow(duration = SWARM_BALANCE.duration, bossTime = SWARM_BALANCE.bossTime) {
  return Math.max(0, duration - bossTime);
}
