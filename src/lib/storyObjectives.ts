export type StoryObjectiveItem = {
  collected: boolean;
  type: string;
};

export type StoryObjectiveRules = {
  itemGoal: number;
  itemType?: string;
  petGoal?: number;
  deliveryGoal?: number;
  nodeGoal?: number;
  requireReturn?: boolean;
};

export type StoryObjectiveProgress = {
  items: StoryObjectiveItem[];
  delivered: number;
  nodes: number;
  atShip: boolean;
};

export function countStoryObjectiveItems(
  items: StoryObjectiveItem[],
  itemType?: string,
) {
  return items.filter((item) =>
    item.collected &&
    (itemType ? item.type === itemType : item.type !== "robot" && item.type !== "pet")
  ).length;
}

export function evaluateStoryObjective(
  rules: StoryObjectiveRules,
  progress: StoryObjectiveProgress,
) {
  const itemCount = countStoryObjectiveItems(progress.items, rules.itemType);
  const petCount = progress.items.filter((item) => item.collected && item.type === "pet").length;
  const itemGoalMet = itemCount >= rules.itemGoal;
  const petGoalMet = petCount >= (rules.petGoal ?? 0);
  const deliveryGoalMet = progress.delivered >= (rules.deliveryGoal ?? 0);
  const nodeGoalMet = progress.nodes >= (rules.nodeGoal ?? 0);
  const extractionMet = !rules.requireReturn || progress.atShip;

  return {
    itemCount,
    petCount,
    itemGoalMet,
    petGoalMet,
    deliveryGoalMet,
    nodeGoalMet,
    extractionMet,
    complete: itemGoalMet && petGoalMet && deliveryGoalMet && nodeGoalMet && extractionMet,
  };
}
