"use client";

import { useRef, useState } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

import type { Biome, Tile } from "@/lib/game/types";
import { HEX_HEIGHT, HEX_SIZE, axialToWorld } from "./hexMath";
import { BiomeDecor } from "./BiomeDecor";
import { BuildingMesh } from "./BuildingMesh";

const BIOME_COLORS: Readonly<Record<Biome, string>> = {
  plain: "#C9B07A",
  forest: "#4F6F4A",
  hill: "#9C8769",
};

const HOVER_COLOR = "#E9C76A";

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

  // Lift-on-hover : 8 px of perceived bump quand clickable.
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = clickable && hovered ? 0.08 : 0;
    groupRef.current.position.y += (target - groupRef.current.position.y) * Math.min(1, delta * 12);
  });

  const baseColor = BIOME_COLORS[tile.biome];
  const fillColor = clickable && hovered ? HOVER_COLOR : baseColor;

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh
        castShadow
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
        <cylinderGeometry args={[HEX_SIZE * 0.97, HEX_SIZE * 0.97, HEX_HEIGHT, 6]} />
        <meshStandardMaterial
          color={fillColor}
          roughness={0.95}
          emissive={clickable && hovered ? HOVER_COLOR : "#000000"}
          emissiveIntensity={clickable && hovered ? 0.15 : 0}
        />
      </mesh>

      <group position={[0, HEX_HEIGHT / 2, 0]}>
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
