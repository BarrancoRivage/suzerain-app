"use client";

import { useMemo } from "react";
import { IcosahedronGeometry } from "three";

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
      <Tree
        key={`t-${i}`}
        x={rngRange(rng, -0.42, 0.42)}
        z={rngRange(rng, -0.42, 0.42)}
        scale={rngRange(rng, 0.85, 1.15)}
        seed={(seed ^ (i * 0x9e37)) >>> 0}
      />
    ));
  }
  if (biome === "hill") {
    const count = 2 + Math.floor(rng() * 2);
    return Array.from({ length: count }, (_, i) => (
      <Rock
        key={`r-${i}`}
        x={rngRange(rng, -0.4, 0.4)}
        z={rngRange(rng, -0.4, 0.4)}
        scale={rngRange(rng, 0.7, 1.05)}
        seed={(seed ^ (i * 0x85eb)) >>> 0}
      />
    ));
  }
  // Plaine : quelques touffes d'herbe / fleurs très basses
  if (biome === "plain" && rng() < 0.6) {
    return [
      <GrassTuft
        key="g"
        x={rngRange(rng, -0.35, 0.35)}
        z={rngRange(rng, -0.35, 0.35)}
      />,
    ];
  }
  return [];
}

// Arbre feuillu : tronc + 3 couches de feuillage de teintes différentes,
// plus un peu de bruit sur la rotation/taille pour casser la régularité.
function Tree({
  x,
  z,
  scale,
  seed,
}: {
  x: number;
  z: number;
  scale: number;
  seed: number;
}) {
  const rng = mulberry32(seed);
  const trunkH = 0.32 + rng() * 0.1;
  const foliageBaseR = 0.27 + rng() * 0.05;
  const foliageTint = pickTreeTint(rng);
  return (
    <group position={[x, 0, z]} scale={scale} rotation={[0, rng() * Math.PI, 0]}>
      {/* Tronc */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, trunkH, 7]} />
        <meshStandardMaterial color="#3F2D1F" roughness={0.95} />
      </mesh>
      {/* Feuillage : 3 couches coniques empilées avec léger overshoot */}
      <mesh position={[0, trunkH + 0.18, 0]} castShadow>
        <coneGeometry args={[foliageBaseR, 0.42, 9]} />
        <meshStandardMaterial color={foliageTint[0]} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, trunkH + 0.42, 0]} castShadow>
        <coneGeometry args={[foliageBaseR * 0.78, 0.4, 9]} />
        <meshStandardMaterial color={foliageTint[1]} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, trunkH + 0.62, 0]} castShadow>
        <coneGeometry args={[foliageBaseR * 0.55, 0.32, 9]} />
        <meshStandardMaterial color={foliageTint[2]} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

const TREE_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#244A24", "#356B37", "#458C42"],
  ["#2E5238", "#3F6E48", "#558C58"],
  ["#2D4324", "#3E5C32", "#587442"],
];

function pickTreeTint(rng: () => number): readonly [string, string, string] {
  return TREE_PALETTES[Math.floor(rng() * TREE_PALETTES.length)];
}

// Rocher : icosaèdre subdivisé avec déplacement de bruit sur chaque vertex.
// Donne un volume irrégulier crédible sans recourir à un asset.
function Rock({
  x,
  z,
  scale,
  seed,
}: {
  x: number;
  z: number;
  scale: number;
  seed: number;
}) {
  const geometry = useMemo(() => buildRockGeometry(seed), [seed]);
  return (
    <mesh
      position={[x, 0.11 * scale, z]}
      scale={scale}
      rotation={[0, seed * 0.001, 0]}
      castShadow
      receiveShadow
      geometry={geometry}
    >
      <meshStandardMaterial color="#7E7263" roughness={1} flatShading />
    </mesh>
  );
}

function buildRockGeometry(seed: number) {
  const geo = new IcosahedronGeometry(0.18, 1);
  const positions = geo.attributes.position;
  const rng = mulberry32(seed);
  for (let i = 0; i < positions.count; i++) {
    const offset = (rng() - 0.5) * 0.12;
    positions.setX(i, positions.getX(i) + (rng() - 0.5) * 0.05);
    positions.setY(i, positions.getY(i) + offset);
    positions.setZ(i, positions.getZ(i) + (rng() - 0.5) * 0.05);
  }
  positions.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// Touffe d'herbe : quelques petits cônes/quads inclinés pour suggérer la prairie.
function GrassTuft({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.04, 0]}>
        <coneGeometry args={[0.04, 0.08, 4]} />
        <meshStandardMaterial color="#7A9351" roughness={1} />
      </mesh>
      <mesh position={[0.05, 0.04, 0.03]} rotation={[0.1, 0.5, 0.15]}>
        <coneGeometry args={[0.03, 0.07, 4]} />
        <meshStandardMaterial color="#8AA559" roughness={1} />
      </mesh>
      <mesh position={[-0.04, 0.03, 0.04]} rotation={[-0.1, 1.2, -0.1]}>
        <coneGeometry args={[0.025, 0.06, 4]} />
        <meshStandardMaterial color="#9CB661" roughness={1} />
      </mesh>
    </group>
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
