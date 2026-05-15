"use client";

import { hashCoord } from "@/lib/game/rng";
import type { GameState, Tile } from "@/lib/game/types";
import { Html } from "@react-three/drei";

import { axialToWorld } from "./hexMath";
import { heightAt } from "./WorldTerrain";
import {
  FarmModel,
  HouseModel,
  LumberjackModel,
  MineModel,
} from "./models/Models";

// Rendu des bâtiments placés. Plus aucun décor naturel (arbres, rochers,
// collines, montagnes) — la map procédurale gère son apparence seule.
export function TileContents({ state }: { state: GameState }) {
  return (
    <>
      {state.tiles
        .filter((tile) => tile.building !== null)
        .map((tile) => (
          <BuildingMesh key={`${tile.q}:${tile.r}`} tile={tile} />
        ))}
    </>
  );
}

function BuildingMesh({ tile }: { tile: Tile }) {
  if (!tile.building) return null;
  const seed = hashCoord(tile.q, tile.r);
  const [cx, cz] = axialToWorld(tile.q, tile.r);
  const subX = tile.building.subX ?? 0;
  const subZ = tile.building.subZ ?? 0;
  const x = cx + subX;
  const z = cz + subZ;
  const y = heightAt(x, z) + 0.02;
  const rotation = ((seed % 6) * Math.PI) / 3;

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]}>
      <group scale={0.72}>
        {tile.building.kind === "farm" && <FarmModel seed={seed} />}
        {tile.building.kind === "lumberjack" && <LumberjackModel />}
        {tile.building.kind === "house" && <HouseModel />}
        {tile.building.kind === "mine" && <MineModel />}
      </group>
      <Html
        position={[0, 1.7, 0]}
        center
        zIndexRange={[10, 0]}
        className="pointer-events-none select-none"
      >
        <div className="whitespace-nowrap rounded-full border border-gold/70 bg-parchment px-2 py-0.5 font-serif text-sm font-semibold leading-none text-ink shadow-sm tabular-nums">
          {tile.building.level}
        </div>
      </Html>
    </group>
  );
}
