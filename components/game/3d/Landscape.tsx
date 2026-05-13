"use client";

import { useMemo } from "react";

import {
  StandaloneHill,
  StandaloneMountain,
  StandaloneRock,
  StandaloneTree,
} from "./models/Models";

// Sol périphérique : plan continu vert au niveau du bas des tuiles hex
// (Y ≈ -0.866 après KAYKIT_SCALE). Les tuiles jouables apparaissent comme
// des plateaux légèrement surélevés au-dessus du paysage, leurs flancs en
// terre étant visibles à la frontière.
//
// Décor : props KayKit standalone (tree_single, rock_single, hill_single)
// + montagnes (mountain_*) au loin, scattered dans un anneau autour du
// disque jouable. Pas de tuiles hex au-delà de la zone interactive.

const KAYKIT_SCALE = Math.sqrt(3) / 2;
const TILE_BOTTOM_Y = -KAYKIT_SCALE;
const GROUND_COLOR = "#7BA549";
const GROUND_SIZE = 56;

const DECOR_INNER = 7.0;
const DECOR_OUTER_NEAR = 11;
const DECOR_OUTER_FAR = 18;

type DecorKind = "tree" | "rock" | "hill" | "mountain";

type DecorItem = {
  kind: DecorKind;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  seed: number;
};

export function Landscape() {
  const decor = useMemo(buildDecor, []);
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, TILE_BOTTOM_Y, 0]}
        receiveShadow
      >
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color={GROUND_COLOR} roughness={1} />
      </mesh>

      {decor.map((item, i) => (
        <DecorObject key={i} item={item} />
      ))}
    </>
  );
}

function DecorObject({ item }: { item: DecorItem }) {
  return (
    <group
      position={[item.x, TILE_BOTTOM_Y, item.z]}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
    >
      {item.kind === "tree" && <StandaloneTree />}
      {item.kind === "rock" && <StandaloneRock seed={item.seed} />}
      {item.kind === "hill" && <StandaloneHill seed={item.seed} />}
      {item.kind === "mountain" && <StandaloneMountain seed={item.seed} />}
    </group>
  );
}

const KIND_NEAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["tree", 0.55],
  ["hill", 0.25],
  ["rock", 0.2],
];

const KIND_FAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["mountain", 0.6],
  ["hill", 0.25],
  ["tree", 0.15],
];

function buildDecor(): DecorItem[] {
  const rng = mulberry32(0xc0ffee);
  const items: DecorItem[] = [];

  for (let i = 0; i < 180; i++) {
    const item = sampleAnnulus(
      rng,
      DECOR_INNER,
      DECOR_OUTER_NEAR,
      1.2,
      KIND_NEAR,
      i,
      items,
    );
    if (item) items.push(item);
  }
  for (let i = 0; i < 120; i++) {
    const item = sampleAnnulus(
      rng,
      DECOR_OUTER_NEAR,
      DECOR_OUTER_FAR,
      2.4,
      KIND_FAR,
      i + 1000,
      items,
    );
    if (item) items.push(item);
  }

  return items;
}

function sampleAnnulus(
  rng: () => number,
  inner: number,
  outer: number,
  minSpacing: number,
  table: ReadonlyArray<readonly [DecorKind, number]>,
  index: number,
  existing: DecorItem[],
): DecorItem | null {
  const angle = rng() * Math.PI * 2;
  const t = Math.sqrt(rng());
  const dist = inner + t * (outer - inner);
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  if (existing.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minSpacing ** 2)) {
    return null;
  }
  return {
    kind: pickKind(table, rng),
    x,
    z,
    rotation: rng() * Math.PI * 2,
    scale: 0.85 + rng() * 0.35,
    seed: ((index + 1) * 0x9e3779b1) >>> 0,
  };
}

function pickKind(
  table: ReadonlyArray<readonly [DecorKind, number]>,
  rng: () => number,
): DecorKind {
  let roll = rng();
  for (const [kind, weight] of table) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return table[table.length - 1][0];
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
