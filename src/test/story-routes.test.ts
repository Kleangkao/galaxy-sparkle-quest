import { describe, expect, it } from "vitest";
import {
  addStoryRouteItems,
  generateMap,
  getStoryEnemySpawnCells,
  MISSION_PROFILES,
  PLANET_THEMES,
} from "@/components/PlanetExploration";
import { getReachableStoryCellKeys } from "@/lib/storyMap";

describe("all Story chapter and route combinations", () => {
  const routes = ["scout", "steady", "salvage"] as const;

  for (const [planetId, mission] of Object.entries(MISSION_PROFILES)) {
    for (const route of routes) {
      it(`${planetId} ${route} always contains a solvable objective`, () => {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const map = generateMap(PLANET_THEMES[planetId], mission);
          const items = addStoryRouteItems(map.items, mission, route);
          const reachable = getReachableStoryCellKeys(mission.walls, 8, 8);
          expect(items.every((item) => reachable.has(`${item.row},${item.col}`))).toBe(true);
          if (mission.crystalGoal) {
            expect(items.filter((item) => item.type === mission.goalItemType).length).toBeGreaterThanOrEqual(mission.crystalGoal);
          }
          if (mission.petGoal) {
            expect(items.filter((item) => item.type === "pet").length).toBeGreaterThanOrEqual(mission.petGoal);
          }
          expect((mission.speedTiles ?? []).every(([row, col]) => reachable.has(`${row},${col}`))).toBe(true);
          expect((mission.dropZones ?? []).every(([row, col]) => reachable.has(`${row},${col}`))).toBe(true);
          if (route === "salvage") {
            const cargo = items.find((item) => item.id === "salvage-cargo");
            expect(cargo, "Salvage must generate a distinct optional cargo").toBeDefined();
            expect(cargo?.type).toBe("chest");
          } else {
            expect(items.some((item) => item.id === "salvage-cargo")).toBe(false);
          }
          const enemyCount = (mission.enemyCount ?? 0) + (route === "salvage" && mission.enemyCount ? 1 : 0);
          const enemySpawns = getStoryEnemySpawnCells(mission, items, enemyCount);
          const protectedCells = new Set([
            ...items.map((item) => `${item.row},${item.col}`),
            ...(mission.speedTiles ?? []).map(([row, col]) => `${row},${col}`),
            ...(mission.dropZones ?? []).map(([row, col]) => `${row},${col}`),
            ...(mission.hazards ?? []).map(([row, col]) => `${row},${col}`),
            ...(mission.teleportPairs ?? []).flatMap(([a, b]) => [`${a[0]},${a[1]}`, `${b[0]},${b[1]}`]),
            "7,4",
          ]);
          expect(enemySpawns, `${planetId} ${route} must create every patrol`).toHaveLength(enemyCount);
          expect(
            enemySpawns.every(([row, col]) => reachable.has(`${row},${col}`) && !protectedCells.has(`${row},${col}`)),
            `${planetId} ${route} patrols must not spawn on objectives, hazards, portals, or the ship`,
          ).toBe(true);
          expect(map.requiredCollect).toBe(mission.crystalGoal ?? map.requiredCollect);
        }
      });
    }
  }
});
