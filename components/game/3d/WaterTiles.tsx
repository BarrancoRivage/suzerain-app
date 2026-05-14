"use client";

import type { GameState } from "@/lib/game/types";
import { HEX_SIZE, axialToWorld } from "./hexMath";
import { terrainElevation } from "./Terrain";

// Plaque d'eau bleue posée juste AU-DESSUS de la surface du terrain pour
// chaque tuile de biome `water`. Les tuiles eau adjacentes forment ainsi
// les lacs et les rivières (chaîne de tuiles d'eau connectées).
//
// On surélève de 3 cm vs l'enfoncement initial : avec une mesh terrain
// continue plate à Y=0, l'eau enfoncée créait du z-fighting aux arêtes
// de la plaque (chevauchement visuel avec le grass). L'eau au-dessus =
// pas de conflit, on lit clairement « surface d'eau qui recouvre le sol ».

const WATER_COLOR = "#3F86B5";
const WATER_RISE = 0.03;
const WATER_THICKNESS = 0.02;

export function WaterTiles({ state }: { state: GameState }) {
  return (
    <>
      {state.tiles.map((tile) => {
        if (tile.biome !== "water") return null;
        const [x, z] = axialToWorld(tile.q, tile.r);
        const y = terrainElevation(x, z) + WATER_RISE;
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
