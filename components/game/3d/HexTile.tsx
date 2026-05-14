"use client";

import { hashCoord } from "@/lib/game/rng";
import type { Tile } from "@/lib/game/types";
import { axialToWorld } from "./hexMath";
import { terrainElevation } from "./Terrain";
import {
  FarmModel,
  ForestDecor,
  HillsDecor,
  MineModel,
} from "./models/Models";

// Avec le passage au terrain continu, HexTile n'est plus une mesh — c'est
// juste le « top dressing » (décor de biome ou bâtiment) positionné au
// centre de la tuile, à l'élévation correcte du terrain. La grille hex
// elle-même n'existe plus comme géométrie : c'est juste une logique de
// coordonnées axiales partagée entre le state et le placement visuel.
//
// Le clic et le hover sont gérés par Terrain.tsx (raycast sur la grosse
// mesh continue → conversion world → axial → callback Board).

type Props = { tile: Tile };

export function HexTile({ tile }: Props) {
  const [x, z] = axialToWorld(tile.q, tile.r);
  const y = terrainElevation(x, z);
  const seed = hashCoord(tile.q, tile.r);

  return (
    <group position={[x, y, z]}>
      <TopDressing tile={tile} seed={seed} />
    </group>
  );
}

// Bâtiment > décor de biome > rien. Les tuiles eau / path n'ont pas de
// décor par-dessus — leur surface est gérée par des composants dédiés
// (WaterTiles / RoadTiles côté Scene).
function TopDressing({ tile, seed }: { tile: Tile; seed: number }) {
  if (tile.building) {
    if (tile.building.kind === "farm") return <FarmModel seed={seed} />;
    return <MineModel />;
  }
  if (tile.biome === "water") return null;
  if (tile.path) return null;
  if (tile.biome === "forest") return <ForestDecor seed={seed} />;
  if (tile.biome === "hill") return <HillsDecor seed={seed} />;
  return null;
}
