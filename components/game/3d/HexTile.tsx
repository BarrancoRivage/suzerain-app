"use client";

import { useRef, useState } from "react";
import type { Mesh } from "three";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { Biome, Tile } from "@/lib/game/types";
import {
  HEX_OUTLINE_POINTS,
  HEX_SIZE,
  HEX_THICKNESS,
  axialToWorld,
} from "./hexMath";
import { BiomeDecor } from "./BiomeDecor";
import { BuildingMesh } from "./BuildingMesh";

// Couleurs de biome calées sur la palette parchemin du HUD : prairie tirant
// vers le moss, forêt dense, colline rocailleuse beige. Le rendu est très
// désaturé volontairement pour ne pas écraser la toile de fond.
const BIOME_COLORS: Readonly<Record<Biome, string>> = {
  plain: "#A6BD68",
  forest: "#3F6B3E",
  hill: "#A89368",
};

const HOVER_COLOR = "#EFC75A";
const OUTLINE_COLOR = "#1F1A14";

const TILE_REST_Y = HEX_THICKNESS / 2 + 0.002;

type Props = {
  tile: Tile;
  clickable: boolean;
  onClick: () => void;
};

export function HexTile({ tile, clickable, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Mesh>(null);
  const [x, z] = axialToWorld(tile.q, tile.r);
  const seed = hashCoord(tile.q, tile.r);

  // Affordance hover : la tuile entière monte légèrement (~3 cm).
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = clickable && hovered ? 0.06 : 0;
    const lerp = Math.min(1, delta * 12);
    groupRef.current.position.y += (target - groupRef.current.position.y) * lerp;
  });

  const baseColor = BIOME_COLORS[tile.biome];
  const fillColor = clickable && hovered ? HOVER_COLOR : baseColor;

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh
        position={[0, TILE_REST_Y, 0]}
        receiveShadow
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
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_THICKNESS, 6]} />
        <meshStandardMaterial
          color={fillColor}
          roughness={0.95}
          emissive={clickable && hovered ? HOVER_COLOR : "#000000"}
          emissiveIntensity={clickable && hovered ? 0.18 : 0}
        />
      </mesh>

      <Line
        points={HEX_OUTLINE_POINTS as unknown as [number, number, number][]}
        color={OUTLINE_COLOR}
        lineWidth={1.1}
        transparent
        opacity={clickable && hovered ? 0.7 : 0.32}
        position={[0, TILE_REST_Y + HEX_THICKNESS / 2 + 0.001, 0]}
      />

      <group position={[0, TILE_REST_Y + HEX_THICKNESS / 2, 0]}>
        {tile.building ? (
          <BuildingMesh kind={tile.building.kind} />
        ) : (
          <BiomeDecor biome={tile.biome} seed={seed} />
        )}
      </group>
    </group>
  );
}

function hashCoord(q: number, r: number): number {
  let h = 2166136261 ^ q;
  h = Math.imul(h, 16777619);
  h ^= r;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}
