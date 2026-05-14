"use client";

import { HEX_SIZE } from "./hexMath";
import { useTerrainMaterial } from "./TerrainMaterial";

// Plaque PBR fine posée au-dessus du `hex_grass.gltf` KayKit, juste à 5 mm
// au-dessus du grass-top, pour qu'elle écrase visuellement la texture atlas
// plate de KayKit sans cacher les flancs en terre. Utilise la même
// `useTerrainMaterial` que le sol périph — les textures et le shader sont
// partagés (1 seul material instance pour toutes les tuiles via le cache
// useLoader + useMemo).
//
// Géométrie : prisme hexagonal très fin (0.01 m) avec rayon = 0.99 * HEX_SIZE
// pour rester strictement à l'intérieur de la tuile et ne pas mordre sur
// les voisines.

const TOPPER_RADIUS = HEX_SIZE * 0.99;
const TOPPER_THICKNESS = 0.01;
const TOPPER_Y = 0.005; // juste au-dessus du grass-top KayKit (Y=0)

export function HexPbrTopper() {
  const material = useTerrainMaterial();
  return (
    <mesh material={material} position={[0, TOPPER_Y, 0]} receiveShadow>
      <cylinderGeometry
        args={[TOPPER_RADIUS, TOPPER_RADIUS, TOPPER_THICKNESS, 6]}
      />
    </mesh>
  );
}
