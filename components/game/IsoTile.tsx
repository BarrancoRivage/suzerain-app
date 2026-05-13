"use client";

import type { CSSProperties } from "react";

import type { BiomeKind, Tile } from "@/lib/game/types";
import { BuildingFarm } from "./iso/BuildingFarm";
import { TileGrass } from "./iso/TileGrass";
import { TileGrassFlower } from "./iso/TileGrassFlower";
import { TileGrassStone } from "./iso/TileGrassStone";
import { TilePath } from "./iso/TilePath";
import { TileWater } from "./iso/TileWater";
import { TreeOverlay } from "./iso/TreeOverlay";

export const TILE_W = 96;
export const TILE_H = 48;
export const SPRITE_SIZE = 96;
export const BOARD_OFFSET_X = 240;
export const BOARD_WIDTH = 576;
export const BOARD_HEIGHT = 336;

const DIAMOND_CLIP = "polygon(50% 50%, 100% 75%, 50% 100%, 0% 75%)";
const SPRITE_FILL: CSSProperties = { width: "100%", height: "100%", display: "block" };

type Props = {
  tile: Tile;
  biome: BiomeKind;
  clickable: boolean;
  onClick: () => void;
};

export function IsoTile({ tile, biome, clickable, onClick }: Props) {
  const left = (tile.x - tile.y) * (TILE_W / 2) + BOARD_OFFSET_X;
  const top = (tile.x + tile.y) * (TILE_H / 2);
  const zIndex = tile.x + tile.y;

  const showTree = !tile.building && biome === "tree";
  const showBuilding = tile.building?.kind === "farm";

  return (
    <div
      className="absolute"
      style={{ left, top, width: SPRITE_SIZE, height: SPRITE_SIZE, zIndex }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        aria-label={describeTile(tile, biome)}
        className={`group absolute inset-0 p-0 m-0 border-0 bg-transparent ${
          clickable ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ clipPath: DIAMOND_CLIP }}
      >
        <FloorSprite biome={biome} hasBuilding={tile.building !== null} />
        {clickable ? (
          <div className="absolute inset-0 bg-gold/15 group-hover:bg-gold/40 transition-colors duration-150" />
        ) : null}
      </button>

      {showTree ? (
        <div className="absolute inset-0 pointer-events-none">
          <TreeOverlay style={SPRITE_FILL} />
        </div>
      ) : null}

      {showBuilding ? (
        <div className="absolute inset-0 pointer-events-none">
          <BuildingFarm style={SPRITE_FILL} />
        </div>
      ) : null}
    </div>
  );
}

function FloorSprite({
  biome,
  hasBuilding,
}: {
  biome: BiomeKind;
  hasBuilding: boolean;
}) {
  if (hasBuilding) return <TileGrass style={SPRITE_FILL} />;
  switch (biome) {
    case "grass":
      return <TileGrass style={SPRITE_FILL} />;
    case "grass-flower":
      return <TileGrassFlower style={SPRITE_FILL} />;
    case "grass-stone":
      return <TileGrassStone style={SPRITE_FILL} />;
    case "path":
      return <TilePath style={SPRITE_FILL} />;
    case "water":
      return <TileWater style={SPRITE_FILL} />;
    case "tree":
      return <TileGrass style={SPRITE_FILL} />;
  }
}

function describeTile(tile: Tile, biome: BiomeKind): string {
  const where = `tuile ${tile.x},${tile.y}`;
  if (tile.building) return `${where} — bâtiment ${tile.building.kind}`;
  const labels: Record<BiomeKind, string> = {
    grass: "prairie",
    "grass-flower": "prairie fleurie",
    "grass-stone": "prairie rocailleuse",
    path: "chemin",
    water: "lac",
    tree: "arbre",
  };
  return `${where} — ${labels[biome]}`;
}
