"use client";

import { GRID_RADIUS, type Tile } from "@/lib/game/types";

import { HEX_SIZE } from "./hexMath";

export const MAP_WORLD_RADIUS = GRID_RADIUS * Math.sqrt(3) * HEX_SIZE + 1.5;
// Le sol périphérique vit à Y = LANDSCAPE_GROUND_Y (cf. Landscape.tsx). On
// garde toutes les tuiles jouables nettement AU-DESSUS de ce sol pour que (a)
// le sol ne masque jamais visuellement les tuiles à basse élévation et (b) il
// n'intercepte pas le raycast de pose de bâtiment.
export const TERRAIN_BASE_Y = 0.08;
export const TERRAIN_HEIGHT_SCALE = 3.2;
export const WATER_Y = 0.18;

export function terrainY(tile: Pick<Tile, "elevation" | "water">): number {
  if (tile.water !== null) return WATER_Y;
  return TERRAIN_BASE_Y + tile.elevation * TERRAIN_HEIGHT_SCALE;
}

export function pathY(tile: Pick<Tile, "elevation" | "water">): number {
  return Math.max(terrainY(tile), WATER_Y) + 0.035;
}
