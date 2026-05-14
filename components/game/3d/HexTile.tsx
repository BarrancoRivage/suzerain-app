"use client";

import { useRef, useState } from "react";
import type { Group } from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { hashCoord } from "@/lib/game/rng";
import type { Tile } from "@/lib/game/types";
import { axialToWorld, reliefNoise } from "./hexMath";
import {
  FarmModel,
  ForestDecor,
  HexGrassTile,
  HexRiverTile,
  HexRoadTile,
  HexWaterTile,
  HillsDecor,
  HouseModel,
  LumberjackModel,
  MineModel,
  WaterDecor,
} from "./models/Models";

// Tuiles jouables : on reste TOUJOURS au-dessus du sol périphérique (jamais
// de tuile enterrée). baseline = (reliefNoise + 1) * 0.15, soit ~0 à ~30 cm
// au-dessus du grass-top de référence. Le sol périphérique va plus haut
// encore (80 cm) en empruntant la même fonction `reliefNoise`.
const TILE_RELIEF_AMPLITUDE = 0.15;

type Props = {
  tile: Tile;
  clickable: boolean;
  onClick: () => void;
};

export function HexTile({ tile, clickable, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const [x, z] = axialToWorld(tile.q, tile.r);
  // reliefNoise est dans [-0.97, 0.97]. On le décale et on prend max(0, …)
  // pour ne descendre jamais sous Y=0 (= jamais enterrée par le ground plane).
  const baselineY = Math.max(
    0,
    (reliefNoise(x, z) + 1) * TILE_RELIEF_AMPLITUDE,
  );

  // La tuile a une Y de base déterministe (relief partagé avec le sol),
  // sur laquelle se superpose le hover lift quand elle est clickable.
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = baselineY + (clickable && hovered ? 0.14 : 0);
    const lerp = Math.min(1, delta * 12);
    groupRef.current.position.y += (target - groupRef.current.position.y) * lerp;
  });

  return (
    <group
      ref={groupRef}
      position={[x, 0, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (clickable) document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        if (!clickable) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <TileBase tile={tile} />
      {/* Le contenu de la tuile (bâtiment ou décor de biome) est réduit pour
          ne pas remplir entièrement le hex — laisse respirer le bord. */}
      {tile.biome !== "water" && (
        <group scale={0.72}>
          <TopDressing tile={tile} />
        </group>
      )}
      {tile.biome === "water" && <WaterTopDressing tile={tile} />}
      {tile.building && <BuildingLevelBadge level={tile.building.level} />}
    </group>
  );
}

// Badge de niveau flottant au-dessus d'un bâtiment. Rendu via un overlay DOM
// (drei <Html>) ancré au repère de la tuile — il suit donc le hover lift.
function BuildingLevelBadge({ level }: { level: number }) {
  return (
    <Html
      position={[0, 1.7, 0]}
      center
      zIndexRange={[10, 0]}
      className="pointer-events-none select-none"
    >
      <div className="whitespace-nowrap rounded-full border border-gold/70 bg-parchment px-2 py-0.5 font-serif text-sm font-semibold leading-none text-ink shadow-sm tabular-nums">
        {level}
      </div>
    </Html>
  );
}

// La tuile : rivière > eau > route > grass. Forêt et colline sont des
// décors empilés par-dessus le grass.
function TileBase({ tile }: { tile: Tile }) {
  if (tile.path?.type === "river") {
    return <HexRiverTile inEdge={tile.path.inEdge} outEdge={tile.path.outEdge} />;
  }
  if (tile.biome === "water") return <HexWaterTile />;
  if (tile.path?.type === "road") {
    return <HexRoadTile inEdge={tile.path.inEdge} outEdge={tile.path.outEdge} />;
  }
  return <HexGrassTile />;
}

// Bâtiment > biome decor > rien. Quand un bâtiment est posé, on fait disparaître
// le décor naturel (champ défriché). Les tuiles avec un path (rivière ou
// route) ne reçoivent pas de décor de biome — le mesh de la tuile elle-même
// porte déjà l'élément (eau, chemin).
function TopDressing({ tile }: { tile: Tile }) {
  const seed = hashCoord(tile.q, tile.r);

  if (tile.building) {
    switch (tile.building.kind) {
      case "farm":
        return <FarmModel seed={seed} />;
      case "lumberjack":
        return <LumberjackModel />;
      case "house":
        return <HouseModel />;
      default:
        return <MineModel />;
    }
  }

  if (tile.path) return null;
  if (tile.biome === "forest") return <ForestDecor seed={seed} />;
  if (tile.biome === "hill") return <HillsDecor seed={seed} />;
  return null;
}

// ~40 % des tuiles d'eau reçoivent un nénuphar / roseau. Posé sur la surface
// de l'eau (Y = 0 dans le repère du HexTile, qui est aussi le top de la
// tuile water après son raise interne).
function WaterTopDressing({ tile }: { tile: { q: number; r: number } }) {
  const seed = hashCoord(tile.q, tile.r);
  if (seed % 5 < 2) {
    return (
      <group position={[0, 0, 0]} scale={0.55}>
        <WaterDecor seed={seed} />
      </group>
    );
  }
  return null;
}

