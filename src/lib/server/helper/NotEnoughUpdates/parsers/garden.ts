import { formatXPTable, getRawLore, sortByRarity } from "$lib/server/helper";
import type { NEUGardenRaw } from "$types/global";
import type { NEUGardenConstants } from "$types/processed/NotEnoughUpdates/garden";

function getPlotLayout(plots: NEUGardenRaw["plots"]) {
  const sortedPlots = Object.keys(plots).sort((aId, bId) => {
    const a = plots[aId];
    const b = plots[bId];

    return a.y === b.y ? a.x - b.x : a.y - b.y;
  });

  return Object.fromEntries(sortedPlots.map((plotId) => [plotId, getRawLore(plots[plotId].name)]));
}

function formatCropMilestones(milestones: NEUGardenRaw["crop_milestones"]) {
  const output = {} as Record<string, Record<number, number>>;
  for (const key in milestones) {
    output[key] = formatXPTable(milestones[key]);
  }

  return output;
}

function getMaxVisitors(visitors: NEUGardenRaw["visitors"]) {
  const values = Object.values(visitors);
  const maxVisitors = {} as Record<string, number>;

  for (const value of values) {
    maxVisitors[value.toLowerCase()] = (maxVisitors[value.toLowerCase()] ?? 0) + 1;
  }

  return sortByRarity(maxVisitors);
}

export function formatGardenConstants(gardenData: NEUGardenRaw) {
  return {
    visitors: Object.fromEntries(Object.entries(gardenData.visitors as Record<string, string>).map(([key, value]) => [key.toLowerCase(), value.toLowerCase()])) as Record<string, string>,
    maxVisitors: getMaxVisitors(gardenData.visitors),
    plotLayout: getPlotLayout(gardenData.plots),
    gardenXp: formatXPTable(gardenData.garden_exp),
    cropMilestones: formatCropMilestones(gardenData.crop_milestones),
    cropUpgrades: formatXPTable(gardenData.crop_upgrades),
    composterUpgrades: gardenData.composter_upgrades,
    barnSkins: gardenData.barn,
    plotCosts: gardenData.plot_costs
  } as NEUGardenConstants;
}
