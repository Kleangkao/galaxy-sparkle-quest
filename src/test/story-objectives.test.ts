import { describe, expect, it } from "vitest";
import { MISSION_PROFILES, PLANET_THEMES } from "@/components/PlanetExploration";
import { getReachableStoryCellKeys } from "@/lib/storyMap";
import { evaluateStoryObjective } from "@/lib/storyObjectives";

describe("Story objective contract", () => {
  it("gives every chapter enough real items and reachable objective cells to finish", () => {
    for (const [planetId, mission] of Object.entries(MISSION_PROFILES)) {
      const theme = PLANET_THEMES[planetId];
      const objectiveItemCount = theme.items
        .filter((item) => item.type === mission.goalItemType)
        .reduce((sum, item) => sum + item.count, 0);
      const companionCount = theme.items
        .filter((item) => item.type === "pet")
        .reduce((sum, item) => sum + item.count, 0);
      const reachable = getReachableStoryCellKeys(mission.walls);

      expect(
        objectiveItemCount,
        `${planetId} must spawn its full item objective`,
      ).toBeGreaterThanOrEqual(mission.crystalGoal ?? 0);
      expect(
        companionCount,
        `${planetId} must spawn its companion objective`,
      ).toBeGreaterThanOrEqual(mission.petGoal ?? 0);
      expect(
        mission.dropZones?.length ?? 0,
        `${planetId} must define every delivery zone`,
      ).toBeGreaterThanOrEqual(mission.deliveryGoal ?? 0);
      expect(
        mission.speedTiles?.length ?? 0,
        `${planetId} must define every activation node`,
      ).toBeGreaterThanOrEqual(mission.nodeGoal ?? 0);

      for (const [row, col] of [...(mission.dropZones ?? []), ...(mission.speedTiles ?? [])]) {
        expect(reachable.has(`${row},${col}`), `${planetId} objective cell ${row},${col} must be reachable`).toBe(true);
      }
    }
  });

  it("counts only the chapter's named objective item", () => {
    const result = evaluateStoryObjective(
      { itemGoal: 2, itemType: "relic" },
      {
        items: [
          { type: "crystal", collected: true },
          { type: "relic", collected: true },
          { type: "relic", collected: false },
          { type: "pet", collected: true },
        ],
        delivered: 0,
        nodes: 0,
        atShip: false,
      },
    );

    expect(result.itemCount).toBe(1);
    expect(result.complete).toBe(false);
  });

  it("requires every stated condition, including extraction, before clearing", () => {
    const rules = {
      itemGoal: 2,
      itemType: "crystal",
      petGoal: 1,
      deliveryGoal: 1,
      nodeGoal: 1,
      requireReturn: true,
    };
    const progress = {
      items: [
        { type: "crystal", collected: true },
        { type: "crystal", collected: true },
        { type: "pet", collected: true },
      ],
      delivered: 1,
      nodes: 1,
      atShip: false,
    };

    expect(evaluateStoryObjective(rules, progress).complete).toBe(false);
    expect(evaluateStoryObjective(rules, { ...progress, atShip: true }).complete).toBe(true);
  });
});
