/*
Minecraft Head Rendering base provided by Crafatar: https://github.com/crafatar/crafatar
Hat layers, transparency and shading added by @LeaPhant
Modified and Improved by @DuckySoLucky
*/

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export const CACHE_PATH = helper.getCacheFolderPath();

import { base } from "$app/paths";
import { REDIS } from "$lib/server/db/redis";
import type { ItemQuery } from "$types/global";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs-extra";
import minecraftData from "minecraft-data";
import sanitize from "mongo-sanitize";
import path from "path";
import * as helper from "../helper";
import { getItemData } from "./item";
const mcData = minecraftData("1.8.9");

const skewA = 26 / 45;
const skewB = skewA * 2;

/**
 * Check if a canvas image has transparency
 * @param {HTMLCanvasElement} canvas - The canvas to check for transparency
 * @returns {Boolean} - Returns true if the canvas has any transparent pixels, false otherwise
 */
function hasTransparency(canvas: HTMLCanvasElement) {
  // Get 2D context of canvas
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return false;
  }

  // Get image data of canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Loop through all the pixels in the image data
  for (let i = 3; i < imageData.length; i += 4) {
    // Check the alpha channel (the 4th value) of each pixel
    if (imageData[i] < 255) {
      // Return true if any alpha value is less than 255 (not fully opaque)
      return true;
    }
  }

  // Return false if all alpha values are 255 (fully opaque)
  return false;
}

/**
 * Resizes an image using canvas
 * @param {HTMLCanvasElement | HTMLImageElement | HTMLVideoElement} src - The source image to resize
 * @param {Number} scale - The scale factor to resize the image by
 * @returns {HTMLCanvasElement} - A canvas element with the resized image
 */
function resize(src: Canvas | Image, scale: number) {
  // Create a new canvas with resized dimensions
  const dst = createCanvas(scale * src.width, scale * src.height);
  // Get 2D context of the new canvas
  const ctx = dst.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  // Set the pattern quality to "fast" to avoid blurring on resize
  ctx.patternQuality = "fast";

  // Draw the source image onto the new canvas with resized dimensions
  ctx.drawImage(src, 0, 0, src.width * scale, src.height * scale);

  // Return the resized canvas
  return dst;
}

/**
 * Crops and resizes an image using canvas
 * @param {HTMLCanvasElement | HTMLImageElement | HTMLVideoElement} src - The source image to crop and resize
 * @param {Number} x - The x coordinate of the top left corner of the crop area
 * @param {Number} y - The y coordinate of the top left corner of the crop area
 * @param {Number} width - The width of the crop area
 * @param {Number} height - The height of the crop area
 * @param {Number} scale - The scale factor to resize the cropped image by
 * @returns {HTMLCanvasElement} - A canvas element with the cropped and resized image
 */
function getPart(src: Canvas | Image, x: number, y: number, width: number, height: number, scale: number): Canvas | Image {
  // Create a new canvas with resized dimensions
  const dst = createCanvas(scale * width, scale * height);
  // Get 2D context of the new canvas
  const ctx = dst.getContext("2d");

  // Set the pattern quality to "fast" to avoid blurring on resize
  ctx.patternQuality = "fast";

  // Draw the cropped area of the source image onto the new canvas with resized dimensions
  ctx.drawImage(src, x, y, width, height, 0, 0, width * scale, height * scale);

  // Return the cropped and resized canvas
  return dst;
}

/**
 * Flips an image horizontally using canvas
 * @param {HTMLCanvasElement | HTMLImageElement | HTMLVideoElement} src - The source image to flip
 * @returns {HTMLCanvasElement} - A canvas element with the flipped image
 */
function flipX(src: Canvas | Image) {
  // Create a new canvas with the same dimensions as the source image
  const dst = createCanvas(src.width, src.height);
  // Get 2D context of the new canvas
  const ctx = dst.getContext("2d");

  // Translate the context to the center of the canvas
  ctx.translate(src.width, 0);
  // Flip the context horizontally
  ctx.scale(-1, 1);

  // Draw the source image onto the new canvas
  ctx.drawImage(src, 0, 0);

  // Return the flipped canvas
  return dst;
}

/**
 * Darkens an image using canvas
 * @param {HTMLCanvasElement | HTMLImageElement | HTMLVideoElement} src - The source image to darken
 * @param {Number} factor - A value between 0 and 1 representing the degree of darkness to apply
 * @returns {HTMLCanvasElement} - A canvas element with the darkened image
 */
function darken(src: Canvas | Image, factor: number) {
  // Create a new canvas with the same dimensions as the source image
  const dst = createCanvas(src.width, src.height);
  // Get 2D context of the new canvas
  const ctx = dst.getContext("2d");

  // Draw the source image onto the new canvas
  ctx.drawImage(src, 0, 0);

  // Set the composite operation to "source-atop"
  ctx.globalCompositeOperation = "source-atop";

  // Fill the canvas with a black rectangle with the specified opacity
  ctx.fillStyle = `rgba(0, 0, 0, ${factor})`;
  ctx.fillRect(0, 0, src.width, src.height);

  // Return the darkened canvas
  return dst;
}

const textureDir = path.resolve(base, "static", "img", "textures", "item");

async function renderColoredItem(color: string, baseImage: Canvas, overlayImage: Canvas) {
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "multiply";

  ctx.drawImage(baseImage, 0, 0);

  ctx.globalCompositeOperation = "destination-in";

  ctx.drawImage(baseImage, 0, 0);

  ctx.globalCompositeOperation = "source-over";

  ctx.drawImage(overlayImage, 0, 0);

  return canvas.toBuffer("image/png");
}

/**
 * Gets either the cached texture or attempts to render and saves it
 * @param {string} textureId
 * @param {number} scale
 * @returns Image of a rendered head
 */
export async function getHead(textureId: string, scale = 6.4) {
  const filePath = helper.getCacheFilePath(CACHE_PATH, "head", textureId);
  let file;

  try {
    file = await fs.readFile(filePath);
  } catch {
    file = await renderHead(textureId, scale);

    fs.writeFile(filePath, file, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  return file;
}

async function renderHead(textureId: string, scale: number) {
  const hatFactor = 0.94;

  const canvas = createCanvas(scale * 20, scale * 18.5);
  const hatCanvas = createCanvas(scale * 20, scale * 18.5);
  const hatBgCanvas = createCanvas(scale * 20, scale * 18.5);
  const headCanvas = createCanvas(scale * 20 * hatFactor, scale * 18.5);

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const hat = hatCanvas.getContext("2d");
  hat.imageSmoothingEnabled = false;
  const hatBg = hatBgCanvas.getContext("2d");
  hatBg.imageSmoothingEnabled = false;
  const head = headCanvas.getContext("2d");
  head.imageSmoothingEnabled = false;

  const skin = await loadImage(`https://textures.minecraft.net/texture/${textureId}`);

  let headBottom = resize(getPart(skin, 16, 0, 8, 8, 1), scale * (hatFactor + 0.01));
  const headTop = resize(getPart(skin, 8, 0, 8, 8, 1), scale * (hatFactor + 0.01));
  let headBack = flipX(resize(getPart(skin, 24, 8, 8, 8, 1), scale * (hatFactor + 0.01)));
  let headFront = resize(getPart(skin, 8, 8, 8, 8, 1), scale * (hatFactor + 0.01));
  const headLeft = flipX(resize(getPart(skin, 16, 8, 8, 8, 1), scale * (hatFactor + 0.01)));
  let headRight = resize(getPart(skin, 0, 8, 8, 8, 1), scale * (hatFactor + 0.01));

  headRight = darken(headRight, 0.15);
  headFront = darken(headFront, 0.25);
  headBottom = darken(headBottom, 0.3);
  headBack = darken(headBack, 0.3);

  let headTopOverlay, headFrontOverlay, headRightOverlay, headBackOverlay, headBottomOverlay, headLeftOverlay;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (hasTransparency(getPart(skin, 32, 0, 32, 32, 1))) {
    // render head overlay
    headTopOverlay = resize(getPart(skin, 40, 0, 8, 8, 1), scale);
    headFrontOverlay = resize(getPart(skin, 40, 8, 8, 8, 1), scale);
    headRightOverlay = resize(getPart(skin, 32, 8, 8, 8, 1), scale);
    headBackOverlay = flipX(resize(getPart(skin, 56, 8, 8, 8, 1), scale));
    headBottomOverlay = resize(getPart(skin, 48, 0, 8, 8, 1), scale);
    headLeftOverlay = flipX(resize(getPart(skin, 48, 8, 8, 8, 1), scale));

    headRightOverlay = darken(headRightOverlay, 0.15);
    headFrontOverlay = darken(headFrontOverlay, 0.25);
    headBottomOverlay = darken(headBottomOverlay, 0.3);
    headBackOverlay = darken(headBackOverlay, 0.3);
  }

  let x = 0;
  let y = 0;
  let z = 0;

  const zOffset = scale * 3;
  const xOffset = scale * 2;

  if (headTopOverlay) {
    // hat left
    x = xOffset + 8 * scale;
    y = 0;
    z = zOffset - 8 * scale;
    hatBg.setTransform(1, skewA, 0, skewB, 0, 0);
    hatBg.drawImage(headLeftOverlay, x + y, z - y, headLeftOverlay.width, headLeftOverlay.height);

    // hat back
    x = xOffset;
    y = 0;
    z = zOffset - 0.5;
    hatBg.setTransform(1, -skewA, 0, skewB, 0, skewA);
    hatBg.drawImage(headBackOverlay, y + x, x + z, headBackOverlay.width, headBackOverlay.height);

    // hat bottom
    x = xOffset;
    y = 0;
    z = zOffset + 8 * scale;
    hatBg.setTransform(1, -skewA, 1, skewA, 0, 0);
    hatBg.drawImage(headBottomOverlay, y - z, x + z, headBottomOverlay.width, headBottomOverlay.height);

    // hat top
    x = xOffset;
    y = 0;
    z = zOffset;
    hat.setTransform(1, -skewA, 1, skewA, 0, 0);
    hat.drawImage(headTopOverlay, y - z, x + z, headTopOverlay.width, headTopOverlay.height + 1);

    // hat front
    x = xOffset + 8 * scale;
    y = 0;
    z = zOffset - 0.5;
    hat.setTransform(1, -skewA, 0, skewB, 0, skewA);
    hat.drawImage(headFrontOverlay, y + x, x + z, headFrontOverlay.width, headFrontOverlay.height);

    // hat right
    x = xOffset;
    y = 0;
    z = zOffset;
    hat.setTransform(1, skewA, 0, skewB, 0, 0);
    hat.drawImage(headRightOverlay, x + y, z - y, headRightOverlay.width, headRightOverlay.height);
  }

  scale *= hatFactor;

  // head bottom
  x = xOffset;
  y = 0;
  z = zOffset + 8 * scale;
  head.setTransform(1, -skewA, 1, skewA, 0, 0);
  head.drawImage(headBottom, y - z, x + z, headBottom.width, headBottom.height);

  // head left
  x = xOffset + 8 * scale;
  y = 0;
  z = zOffset - 8 * scale;
  head.setTransform(1, skewA, 0, skewB, 0, 0);
  head.drawImage(headLeft, x + y, z - y, headLeft.width, headLeft.height);

  // head back
  x = xOffset;
  y = 0;
  z = zOffset;
  head.setTransform(1, -skewA, 0, skewB, 0, skewA);
  head.drawImage(headBack, y + x, x + z, headBack.width, headBack.height);

  // head top
  x = xOffset;
  y = 0;
  z = zOffset;
  head.setTransform(1, -skewA, 1, skewA, 0, 0);
  head.drawImage(headTop, y - z, x + z, headTop.width, headTop.height);

  // head front
  x = xOffset + 8 * scale;
  y = 0;
  z = zOffset;
  head.setTransform(1, -skewA, 0, skewB, 0, skewA);
  head.drawImage(headFront, y + x, x + z, headFront.width, headFront.height);

  // head right
  x = xOffset;
  y = 0;
  z = zOffset;
  head.setTransform(1, skewA, 0, skewB, 0, 0);
  head.drawImage(headRight, x + y, z - y, headRight.width, headRight.height);

  ctx.drawImage(hatBgCanvas, 0, 0);
  ctx.drawImage(headCanvas, (scale * 20 - scale * 20 * hatFactor) / 2, (scale * 18.5 - scale * 18.5 * hatFactor) / 2);
  ctx.drawImage(hatCanvas, 0, 0);

  return canvas.toBuffer("image/png");
}

/**
 * Gets either the cached texture or attempts to render and saves it
 * @param {string} type
 * @param {string} color
 * @returns Image of a rendered armor piece
 */
export async function getArmor(type: string, color: string) {
  const filePath = helper.getCacheFilePath(CACHE_PATH, `leather`, `${type}_${color}`);
  let file;

  try {
    file = await fs.readFile(filePath);
  } catch {
    file = await renderArmor(type, color);

    fs.writeFile(filePath, file, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  return file;
}

/**
 * Loads and renders an armor with the specified type and color.
 *
 * @async
 * @param {string} type - The type of the armor to be rendered.
 * @param {string} color - The color of the armor to be rendered.
 * @returns {Promise<Image>} The rendered armor image.
 */
async function renderArmor(type: string, color: string) {
  // Load the base image and overlay image of the armor
  const [armorBase, armorOverlay] = await Promise.all([loadImage(path.resolve(textureDir, `leather_${type}.png`)), loadImage(path.resolve(textureDir, `leather_${type}_overlay.png`))]);

  // Return the rendered colored item
  return await renderColoredItem("#" + color, armorBase, armorOverlay);
}

/**
 * Gets either the cached texture or attempts to render and saves it
 * @param {string} type
 * @param {string} color
 * @returns Image of a rendered potion
 */
export async function getPotion(type: string, color: string) {
  const filePath = helper.getCacheFilePath(CACHE_PATH, `potion`, `${type}_${color}`);
  let file;

  try {
    file = await fs.readFile(filePath);
  } catch {
    file = await renderPotion(type, color);

    fs.writeFile(filePath, file, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  return file;
}

/**
 * Loads and renders a potion with the specified type and color.
 *
 * @async
 * @param {string} type - The type of the potion to be rendered.
 * @param {string} color - The color of the potion to be rendered.
 * @returns {Promise<Image>} The rendered potion image.
 */
async function renderPotion(type: string, color: string) {
  // Load the liquid image and bottle image of the potion
  const [potionLiquid, potionBottlle] = await Promise.all([loadImage(path.resolve(textureDir, "potion_overlay.png")), loadImage(path.resolve(textureDir, type === "splash" ? "splash_potion.png" : "potion.png"))]);

  // Return the rendered colored item
  return await renderColoredItem("#" + color, potionLiquid, potionBottlle);
}

/**
 * Gets a texture of an item, either from stylesheet or from resource packs
 * @param {string|undefined} skyblockId
 * @param {object} query
 * @returns Image of an item
 */
export async function renderItem(skyblockId: string | undefined, query: ItemQuery): Promise<RenderItemOutput> {
  const cacheId = `ITEM:${skyblockId}:${JSON.stringify(query)}`;
  const cache = await REDIS.get(cacheId);
  if (cache) {
    return JSON.parse(cache);
  }

  query = sanitize(query);
  let itemQuery = query ?? {};

  if (skyblockId !== undefined) {
    itemQuery = Object.assign(query, { skyblockId });
  }

  const item = getItemData({ skyblockId, ...itemQuery });
  const outputTexture: Partial<RenderItemOutput> = { mime: "image/png" };

  const sbId = skyblockId?.toLowerCase();
  const material = item.material?.toLowerCase();
  if (material !== undefined && item.texture === undefined) {
    Object.assign(item, mcData.itemsByName[material] ?? mcData.blocksByName[material]);
  } else if (item.id !== (mcData.itemsByName[sbId] ?? mcData.blocksByName[sbId])?.id) {
    Object.assign(item, mcData.itemsByName[sbId] ?? mcData.blocksByName[sbId]);
  }

  helper.applyResourcePack(item, query.packs);

  if (item.texture_path && item.texture_path.includes("/api/")) {
    if (item.texture_path.startsWith("/api/leather/")) {
      const args = item.texture_path.split("/");
      const color = args.pop();
      const type = args.pop();

      outputTexture.image = await getArmor(type, color);
    } else if (item.texture_path.startsWith("/api/head/")) {
      const args = item.texture_path.split("/");
      const id = args.pop();

      outputTexture.image = await getHead(id);
    } else {
      outputTexture.image = outputTexture.texture_path;
    }
  } else if (item.texture_path !== undefined && item.texture_path.endsWith("/skull-3.png") === false) {
    outputTexture.image = await fs.readFile(`static/${item.texture_path}`);
  } else if (item.texture !== undefined && item.texture) {
    outputTexture.image = await getHead(item.texture);
  }

  if (!("image" in outputTexture)) {
    outputTexture.error = "item not found";
  }

  if (query.static === true && outputTexture.image) {
    try {
      const image = await loadImage(outputTexture.image);
      const canvas = createCanvas(128, 128);
      const ctx = canvas.getContext("2d");

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, 128, 128);
      outputTexture.image = canvas.toBuffer("image/png");
    } catch (error) {
      console.error("Error processing static image:", error);
    }
  }

  REDIS.SETEX(cacheId, 60 * 30, JSON.stringify(outputTexture));

  return outputTexture;
}
