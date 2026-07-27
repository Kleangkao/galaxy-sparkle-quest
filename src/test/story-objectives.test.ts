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

  it("resolves every chapter only after all of its declared goals are complete", () => {
    for (const [planetId, mission] of Object.entries(MISSION_PROFILES)) {
      const itemGoal = mission.crystalGoal ?? 0;
      const itemType = mission.goalItemType ?? "crystal";
      const petGoal = mission.petGoal ?? 0;
      const rules = {
        itemGoal,
        itemType,
        petGoal,
        deliveryGoal: mission.deliveryGoal,
        nodeGoal: mission.nodeGoal,
        requireReturn: mission.requireReturn,
      };
      const completeProgress = {
        items: [
          ...Array.from({ length: itemGoal }, () => ({ type: itemType, collected: true })),
          ...Array.from({ length: petGoal }, () => ({ type: "pet", collected: true })),
        ],
        delivered: mission.deliveryGoal ?? 0,
        nodes: mission.nodeGoal ?? 0,
        atShip: mission.requireReturn,
      };

      expect(
        evaluateStoryObjective(rules, completeProgress).complete,
        `${planetId} should clear when every displayed objective is complete`,
      ).toBe(true);

      if (itemGoal > 0) {
        expect(
          evaluateStoryObjective(rules, {
            ...completeProgress,
            items: completeProgress.items.filter((_, index) => index !== 0),
          }).complete,
          `${planetId} should not clear before its collection goal`,
        ).toBe(false);
      }

      if (petGoal > 0) {
        expect(
          evaluateStoryObjective(rules, {
            ...completeProgress,
            items: completeProgress.items.filter((item) => item.type !== "pet"),
          }).complete,
          `${planetId} should not clear before its companion goal`,
        ).toBe(false);
      }

      if ((mission.deliveryGoal ?? 0) > 0) {
        expect(
          evaluateStoryObjective(rules, {
            ...completeProgress,
            delivered: (mission.deliveryGoal ?? 0) - 1,
          }).complete,
          `${planetId} should not clear before its delivery goal`,
        ).toBe(false);
      }

      if ((mission.nodeGoal ?? 0) > 0) {
        expect(
          evaluateStoryObjective(rules, {
            ...completeProgress,
            nodes: (mission.nodeGoal ?? 0) - 1,
          }).complete,
          `${planetId} should not clear before its node goal`,
        ).toBe(false);
      }

      if (mission.requireReturn) {
        expect(
          evaluateStoryObjective(rules, { ...completeProgress, atShip: false }).complete,
          `${planetId} should not clear before returning to the ship`,
        ).toBe(false);
      }
    }
  });
});
