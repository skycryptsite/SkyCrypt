import * as constants from "$lib/server/constants/constants";
import * as helper from "$lib/server/helper";
import { sendWebhookMessage } from "$lib/server/lib";
import { STATS_DATA } from "$lib/shared/constants/stats";
import type { StatsData } from "$types/processed/profile/stats";
import type { Gemstone, GemTier } from "$types/stats";

export function addLevelableEnchantmentsToLore(
  amount: number,
  constant: {
    name: string;
    ladder: number[];
  },
  itemLore: string[]
) {
  itemLore.push("", `§7${constant.name}: §c${amount.toLocaleString()}`);
  if (amount >= (constant.ladder.at(-1) ?? 100) || amount < 0) {
    itemLore.push(`§8MAXED OUT!`);
  } else {
    let toNextLevel = 0;
    for (const e of constant.ladder) {
      if (amount < e) {
        toNextLevel = e - amount;
        break;
      }
    }
    itemLore.push(`§8${toNextLevel.toLocaleString()} to tier up!`);
  }
}

export function parseItemGems(gems: { [key: string]: string }, rarity: string) {
  const slots = {
    normal: Object.keys(constants.GEMSTONES),
    special: ["UNIVERSAL", "COMBAT", "OFFENSIVE", "DEFENSIVE", "MINING", "CHISEL"],
    ignore: ["unlocked_slots"]
  };

  const parsed = [] as Gemstone[];
  for (const [key, value] of Object.entries(gems)) {
    const slotType = key.split("_")[0];

    if (slots.ignore.includes(key) || (slots.special.includes(slotType) && key.endsWith("_gem"))) {
      continue;
    }

    if (slots.special.includes(slotType)) {
      parsed.push({
        slot_type: slotType,
        slot_number: +key.split("_")[1],
        gem_type: gems[`${key}_gem`],
        gem_tier: (value as unknown as GemTier)?.quality || value,
        lore: ""
      });
    } else if (slots.normal.includes(slotType)) {
      parsed.push({
        slot_type: slotType,
        slot_number: +key.split("_")[1],
        gem_type: key.split("_")[0],
        gem_tier: (value as unknown as GemTier)?.quality || value,
        lore: ""
      });
    } else {
      sendWebhookMessage(new Error(`Error! Unknown gemstone slot key: ${key}\n\n${JSON.stringify(gems, null, 2)}`), {
        uuid: "GEMSTONE",
        username: "GEMSTONE",
        profileCuteName: "GEMSTONE",
        profileId: "GEMSTONE"
      });
    }
  }

  parsed.forEach((gem) => {
    gem.lore = generateGemLore(gem.gem_type, gem.gem_tier.toString(), rarity);
  });

  return parsed;
}

export function generateGemLore(type: string, tier: string, rarity: string): string {
  const lore = [];
  const stats = [] as string[];

  const gemstoneData = constants.GEMSTONES[type.toUpperCase() as keyof typeof constants.GEMSTONES];
  if (!gemstoneData) {
    return "§c§oMISSING GEMSTONE DATA§r";
  }

  // Gem color
  const color = `§${gemstoneData.color}`;

  // Gem stats
  if (rarity) {
    const gemstoneStats = gemstoneData.stats?.[tier.toUpperCase() as keyof typeof gemstoneData.stats];
    if (gemstoneStats) {
      Object.keys(gemstoneStats).forEach((stat) => {
        let statValue = gemstoneStats[stat as keyof typeof gemstoneStats][helper.rarityNameToInt(rarity)];

        // Fallback since skyblock devs didn't code all gemstone stats for divine rarity yet
        // ...they didn't expect people to own divine tier items other than divan's drill
        if (rarity.toUpperCase() === "DIVINE" && statValue === null) {
          statValue = gemstoneStats[stat as keyof typeof gemstoneStats][helper.rarityNameToInt("MYTHIC")];
        }

        if (statValue) {
          const statsData = STATS_DATA[stat as keyof typeof STATS_DATA] as unknown as StatsData;

          stats.push(["§", String(statsData.color).at(-1), "+", statValue, " ", statsData.symbol].join(""));
        } else {
          stats.push("§c§oMISSING VALUE§r");
        }
      });
    }
  }

  lore.push(color, helper.titleCase(tier), " ", helper.titleCase(type));

  if (stats.length) {
    lore.push("§7 (", stats.join("§7, "), "§7)");
  }

  return lore.join("");
}
