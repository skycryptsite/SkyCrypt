import type { Item, ItemQuery } from "$types/stats";
import * as constants from "../constants/constants";

/**
 * Converts an RGB color value to its corresponding hexadecimal representation.
 * @param rgb - The RGB color value in the format "r, g, b".
 * @returns The hexadecimal representation of the RGB color value.
 */
function rgbToHex(rgb: string) {
  const [r, g, b] = rgb.split(",").map((c) => parseInt(c.trim()));

  return [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

/**
 * Gathers Item Data visualized similarily to in-game NBT format based on a query
 * @param {Object} query Query with optional properties
 * @param {string} [query.skyblockId] Item SkyBlock ID
 * @param {number} [query.id] Item Vanilla ID
 * @param {string} [query.name] Item name
 * @param {number} [query.damage] Item damage value
 * @returns {*} Item Data
 */
export function getItemData(query: ItemQuery) {
  query = Object.assign({ skyblockId: undefined, id: undefined, name: undefined, damage: undefined }, query);
  const dbItem = query.skyblockId ? (constants.ITEMS.get(query.skyblockId) ?? {}) : {};
  const item: Item = { id: -1, Damage: 0, Count: 1, tag: { ExtraAttributes: {} } };

  if (query.id !== undefined) {
    item.id = query.id;
  }

  if (query.name !== undefined) {
    item.tag.display = { Name: query.name };
  }

  if ("item_id" in dbItem) {
    item.id = dbItem.item_id as number;
  }

  if ("damage" in dbItem) {
    item.Damage = dbItem.damage || query.damage || 0;
  }

  if ("name" in dbItem) {
    item.tag.display = { Name: dbItem.name as string };
  }

  if ("id" in dbItem) {
    item.tag.ExtraAttributes.id = dbItem.skyblock_id;
  }

  if ("texture" in dbItem) {
    item.texture = dbItem.texture as string;
  }

  if ("glowing" in dbItem || "shiny" in dbItem) {
    item.glowing = true;
  }

  if (dbItem.item_id && dbItem.item_id >= 298 && dbItem.item_id <= 301) {
    const type = ["helmet", "chestplate", "leggings", "boots"][dbItem.item_id - 298];
    if (dbItem.color !== undefined) {
      const color = rgbToHex(dbItem.color) ?? "955e3b";

      item.texture_path = `/api/leather/${type}/${color}`;
    }
  }

  if ("material" in dbItem) {
    item.material = dbItem.material as string;
  }

  return item;
}
