import { describe, expect, it } from "vitest";
import {
  addStoryRouteItems,
  generateMap,
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
          expect(map.requiredCollect).toBe(mission.crystalGoal ?? map.requiredCollect);
        }
      });
    }
  }
});
