import { getUpgradeCost, MAX_UPGRADE_TIER, SHIP_UPGRADES, XP_THRESHOLDS } from "@/lib/gameState";

export const ECONOMY_ASSUMPTIONS = {
  averageCrystalsPerCompletedActivity: 16,
  averageXpPerCompletedActivity: 9,
  averageLateGameRewardMultiplier: 1.25,
} as const;

export function getTotalUpgradeCost(maxTier = MAX_UPGRADE_TIER) {
  return SHIP_UPGRADES.reduce((total, upgrade) => {
    let upgradeTotal = 0;
    for (let tier = 0; tier < maxTier; tier += 1) upgradeTotal += getUpgradeCost(upgrade, tier);
    return total + upgradeTotal;
  }, 0);
}

export function getEconomyProjection() {
  const averageCrystals = ECONOMY_ASSUMPTIONS.averageCrystalsPerCompletedActivity;
  const averageXp = ECONOMY_ASSUMPTIONS.averageXpPerCompletedActivity;
  const firstUpgradeRuns = Math.ceil(SHIP_UPGRADES[0].cost / averageCrystals);
  const allTierOneCost = SHIP_UPGRADES.reduce((total, upgrade) => total + getUpgradeCost(upgrade, 0), 0);
  const finalLevelGateXp = XP_THRESHOLDS[Math.max(...SHIP_UPGRADES.map((upgrade) => upgrade.requiredLevel - 1))];
  const allTierOneRuns = Math.max(
    Math.ceil(allTierOneCost / averageCrystals),
    Math.ceil(finalLevelGateXp / averageXp),
  );
  const fullBuildRuns = Math.ceil(
    getTotalUpgradeCost() /
    (averageCrystals * ECONOMY_ASSUMPTIONS.averageLateGameRewardMultiplier),
  );
  return {
    firstUpgradeRuns,
    allTierOneRuns,
    fullBuildRuns,
    allTierOneCost,
    fullBuildCost: getTotalUpgradeCost(),
  };
}
