import { CROP_TO_ID, CROPS } from "$constants/farming";
import type { GardenResponse } from "$types/global";
import { getRawLore, sortByRarity } from "../helper";
import { NEU_CONSTANTS } from "../helper/NotEnoughUpdates/parseNEURepository";
import { getLevelByXp, getSkillExperience } from "./leveling/leveling";

function getVisitorRarities(gardenData: GardenResponse) {
  const output = {} as Record<string, { visited?: number; completed?: number; unique: string[]; maxUnique: number }>;
  for (const [key, value] of Object.entries(gardenData.commission_data?.visits ?? {})) {
    const rarity = NEU_CONSTANTS.get("garden").visitors[key] ?? "unknown";

    const visited = output[rarity]?.visited ?? 0;
    const completed = output[rarity]?.completed ?? 0;
    const unique = output[rarity]?.unique ?? [];

    output[rarity] = {
      visited: visited + value,
      completed: completed + (gardenData.commission_data?.completed?.[key] ?? 0),
      unique: unique.includes(key) ? unique : [...unique, key],
      maxUnique: NEU_CONSTANTS.get("garden").maxVisitors[rarity]
    };
  }

  return sortByRarity(Object.fromEntries(Object.entries(output).map(([key, value]) => [key, { ...value, unique: value.unique.length }])));
}

function getVisitors(gardenData: GardenResponse) {
  const output = {
    visited: Object.values(gardenData.commission_data?.visits ?? {}).reduce((a, b) => a + b, 0),
    completed: gardenData.commission_data?.total_completed ?? 0,
    uniqueVisitors: gardenData.commission_data?.unique_npcs_served ?? 0,
    visitors: getVisitorRarities(gardenData)
  };

  return output;
}

function getCropMilestones(gardenData: GardenResponse) {
  const output = [];
  for (const id in CROPS) {
    const amount = gardenData.resources_collected?.[id];
    output.push({
      name: CROPS[id],
      texture: `/api/item/${id}`,
      level: getLevelByXp(amount, { type: `GARDEN_CROP_MILESTONE:${CROP_TO_ID[id]}`.toLowerCase() })
    });
  }

  return output;
}

function getCropUpgrades(gardenData: GardenResponse) {
  const output = [];
  for (const id in CROPS) {
    const amount = getSkillExperience("crop_upgrades", gardenData.crop_upgrade_levels?.[id] ?? 0);

    output.push({
      name: CROPS[id],
      texture: `/api/item/${id}`,
      level: getLevelByXp(amount, { type: "crop_upgrades" })
    });
  }

  return output;
}

function getComposterUpgrades(gardenData: GardenResponse) {
  const output = {} as Record<string, number>;
  for (const key in NEU_CONSTANTS.get("garden").composterUpgrades) {
    output[key] = gardenData.composter_data?.upgrades?.[key] ?? 0;
  }

  return output;
}

function getPlotLayout(gardenData: GardenResponse) {
  const output = [];

  const PLOT_LAYOUT = NEU_CONSTANTS.get("garden").plotLayout;
  for (const [plotId, plotName] of Object.entries(PLOT_LAYOUT)) {
    const index = Object.keys(PLOT_LAYOUT).indexOf(plotId);
    const checkPlots = [
      PLOT_LAYOUT[Number(index) - 5], // above
      PLOT_LAYOUT[Number(index) + 1], // right
      PLOT_LAYOUT[Number(index) + 5], // below
      PLOT_LAYOUT[Number(index) - 1] // left
    ];

    let hasAdjacentUnlocked = false;
    for (const checkPlot of checkPlots) {
      if (!checkPlot) {
        continue;
      }

      if (gardenData.unlocked_plots_ids?.includes(checkPlot)) {
        hasAdjacentUnlocked = true;
        break;
      }
    }

    const plotIndex = output.length;
    if (plotIndex === 12) {
      const item = NEU_CONSTANTS.get("garden").barnSkins[gardenData.selected_barn_skin] ?? NEU_CONSTANTS.get("garden").barnSkins["default_1"];
      output.push({ display_name: `Barn Skin: ${item.name}`, texture_path: `/api/item/${item.item.replace("-", ":")}` });
    }

    const textureId = gardenData.unlocked_plots_ids?.includes(plotId) ? "GRASS" : hasAdjacentUnlocked ? "WOOD_BUTTON" : "STAINED_GLASS_PANE:14";
    output.push({ display_name: plotName, texture_path: `/api/item/${textureId}` });
  }

  return output;
}

function getPlotData(gardenData: GardenResponse) {
  const layout = getPlotLayout(gardenData);
  const barnSkin = NEU_CONSTANTS.get("garden").barnSkins[gardenData.selected_barn_skin] ?? NEU_CONSTANTS.get("garden").barnSkins["default_1"];
  return {
    unlocked: gardenData.unlocked_plots_ids?.length ?? 0,
    total: Object.keys(NEU_CONSTANTS.get("garden").plotLayout).length,
    barnSkin: getRawLore(barnSkin.name),
    layout: layout
  };
}

export function formatGarden(gardenData: GardenResponse) {
  return {
    level: getLevelByXp(gardenData.garden_experience, { type: "garden" }),
    visitors: getVisitors(gardenData),
    cropMilestones: getCropMilestones(gardenData),
    cropUpgrades: getCropUpgrades(gardenData),
    composter: getComposterUpgrades(gardenData),
    plot: getPlotData(gardenData)
  };
}
