"use client";

import { useMemo } from "react";

import type { Biome } from "@/lib/game/types";

type Props = { biome: Biome; seed: number };

// Décor passif d'une tuile (arbres, rochers). Posé seulement si la tuile n'a
// pas de bâtiment ; les positions sont seedées par (q, r) pour rester stables
// d'une frame à l'autre.
export function BiomeDecor({ biome, seed }: Props) {
  const items = useMemo(() => buildItems(biome, seed), [biome, seed]);
  return <>{items}</>;
}

function buildItems(biome: Biome, seed: number): React.ReactElement[] {
  const rng = mulberry32(seed);
  if (biome === "forest") {
    const count = 3 + Math.floor(rng() * 2);
    return Array.from({ length: count }, (_, i) => (
      <Tree key={`t-${i}`} x={rngRange(rng, -0.45, 0.45)} z={rngRange(rng, -0.45, 0.45)} scale={rngRange(rng, 0.85, 1.15)} />
    ));
  }
  if (biome === "hill") {
    const count = 2 + Math.floor(rng() * 2);
    return Array.from({ length: count }, (_, i) => (
      <Rock key={`r-${i}`} x={rngRange(rng, -0.45, 0.45)} z={rngRange(rng, -0.45, 0.45)} scale={rngRange(rng, 0.7, 1.1)} />
    ));
  }
  return [];
}

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.22, 6]} />
        <meshStandardMaterial color="#5C4033" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[0.2, 0.45, 8]} />
        <meshStandardMaterial color="#2F4A2F" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Rock({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <mesh
      position={[x, 0.08 * scale, z]}
      scale={scale}
      rotation={[0, scale * 1.7, 0]}
      castShadow
    >
      <dodecahedronGeometry args={[0.13, 0]} />
      <meshStandardMaterial color="#8B7B6B" roughness={1} />
    </mesh>
  );
}

function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
