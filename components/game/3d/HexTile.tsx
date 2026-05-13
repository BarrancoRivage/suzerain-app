"use client";

import { useRef, useState } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";

import type { Tile } from "@/lib/game/types";
import { axialToWorld } from "./hexMath";
import {
  FarmModel,
  ForestDecor,
  HexGrassTile,
  HillsDecor,
  MineModel,
} from "./models/Models";

type Props = {
  tile: Tile;
  clickable: boolean;
  onClick: () => void;
};

export function HexTile({ tile, clickable, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const [x, z] = axialToWorld(tile.q, tile.r);

  // Hover lift : ~12 cm de soulèvement quand la tuile est clickable et
  // survolée. Seul indice visuel pour signaler la cliquabilité — pas de
  // recoloration de la texture (les modèles KayKit partagent un atlas).
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = clickable && hovered ? 0.14 : 0;
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
      <HexGrassTile />
      {/* Le contenu de la tuile (bâtiment ou décor de biome) est réduit pour
          ne pas remplir entièrement le hex — laisse respirer le bord. */}
      <group scale={0.72}>
        <TopDressing tile={tile} />
      </group>
    </group>
  );
}

// Bâtiment > biome decor > rien. Quand un bâtiment est posé, on fait disparaître
// le décor naturel (champ défriché).
function TopDressing({ tile }: { tile: Tile }) {
  const seed = hashCoord(tile.q, tile.r);

  if (tile.building) {
    if (tile.building.kind === "farm") return <FarmModel seed={seed} />;
    return <MineModel />;
  }

  if (tile.biome === "forest") return <ForestDecor seed={seed} />;
  if (tile.biome === "hill") return <HillsDecor seed={seed} />;
  return null;
}

function hashCoord(q: number, r: number): number {
  let h = 2166136261 ^ q;
  h = Math.imul(h, 16777619);
  h ^= r;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}
