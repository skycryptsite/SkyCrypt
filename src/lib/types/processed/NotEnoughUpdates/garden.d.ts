import type { NEUGardenRawBarnSkin, NEUGardenRawPlotCost } from "$types/global";

export type NEUGardenConstants = {
  visitors: Record<string, string>;
  plotLayout: Record<string, string>;
  gardenXp: Record<string, number>;
  cropMilestones: Record<string, Record<string, number>>;
  barnSkins: Record<string, NEUGardenRawBarnSkin>;
  plotCosts: Record<string, NEUGardenRawPlotCost[]>;
};
