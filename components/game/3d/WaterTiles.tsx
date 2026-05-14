"use client";

import type { GameState } from "@/lib/game/types";
import { HEX_SIZE, axialToWorld } from "./hexMath";
import { terrainElevation } from "./Terrain";

// Plaque d'eau bleue translucide posée sur la surface du terrain pour
// chaque tuile de biome `water`. Les tuiles eau adjacentes forment ainsi
// les lacs et les rivières visuels (chaîne de tuiles d'eau connectées).
//
// L'eau est légèrement enfoncée (Y - 0.02) pour suggérer un lit de lac
// par rapport au terrain herbeux environnant.

const WATER_COLOR = "#4A8AB8";
const WATER_DROP = 0.02;
const WATER_THICKNESS = 0.04;

export function WaterTiles({ state }: { state: GameState }) {
  return (
    <>
      {state.tiles.map((tile) => {
        if (tile.biome !== "water") return null;
        const [x, z] = axialToWorld(tile.q, tile.r);
        const y = terrainElevation(x, z) - WATER_DROP;
        return (
          <mesh
            key={`water:${tile.q}:${tile.r}`}
            position={[x, y, z]}
            receiveShadow
          >
            <cylinderGeometry
              args={[HEX_SIZE, HEX_SIZE, WATER_THICKNESS, 6]}
            />
            <meshStandardMaterial
              color={WATER_COLOR}
              roughness={0.35}
              metalness={0.05}
            />
          </mesh>
        );
      })}
    </>
  );
}
