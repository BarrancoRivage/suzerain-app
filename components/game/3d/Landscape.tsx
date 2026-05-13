"use client";

import { useMemo } from "react";
import { PlaneGeometry } from "three";

import { mulberry32, pickWeighted } from "@/lib/game/rng";
import { reliefNoise } from "./hexMath";
import {
  StandaloneHill,
  StandaloneMountain,
  StandaloneRock,
  StandaloneTree,
} from "./models/Models";

// Sol périphérique avec relief. PlaneGeometry 96² sommets, chaque vertex
// déplacé en Y par une somme de sinus pondérée par un easing radial : flat
// dans le disque jouable (rayon ≤ 6.5), ramp doux entre 6.5 et 8, full
// déplacement au-delà. Le décor (arbres, rochers, collines, montagnes)
// échantillonne la même fonction `groundY` pour suivre les bosses du sol.

const TILE_BOTTOM_Y = -0.05;
const GROUND_COLOR = "#7BA549";
const GROUND_SIZE = 110;
const GROUND_SEGMENTS = 160;
// Disque jouable de rayon axial 6 → world distance max ≈ 10.4. On garde une
// marge de 1.5 avant que le sol commence à monter.
const PLAYABLE_FLAT_RADIUS = 12;
const RAMP_END = 15.0;
// Relief : 80 cm d'amplitude. Combiné aux fréquences basses de reliefNoise,
// donne des ondulations marquées (collines visibles) sans pics aigus.
const RELIEF_AMPLITUDE = 0.8;

const DECOR_INNER = 13.5;
const DECOR_OUTER_NEAR = 22;
const DECOR_OUTER_FAR = 38;

type DecorKind = "tree" | "rock" | "hill" | "mountain";

type DecorItem = {
  kind: DecorKind;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  seed: number;
};

function easedRamp(dist: number): number {
  const t = Math.max(
    0,
    Math.min(1, (dist - PLAYABLE_FLAT_RADIUS) / (RAMP_END - PLAYABLE_FLAT_RADIUS)),
  );
  return t * t * (3 - 2 * t);
}

function groundY(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  return (
    TILE_BOTTOM_Y + reliefNoise(x, z) * RELIEF_AMPLITUDE * easedRamp(dist)
  );
}

function buildGroundGeometry() {
  const geo = new PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    GROUND_SEGMENTS,
    GROUND_SEGMENTS,
  );
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    // Plan tourné -π/2 autour de X : local (x, y, 0) → world (x, 0, -y).
    // Donc world_z pour ce vertex = -local_y. On échantillonne `noise2D`
    // sur les coords world pour que `groundY(x, z)` (utilisée par le
    // décor) renvoie exactement la hauteur de ce vertex.
    const wx = lx;
    const wz = -ly;
    const dist = Math.sqrt(wx * wx + wz * wz);
    pos.setZ(i, reliefNoise(wx, wz) * RELIEF_AMPLITUDE * easedRamp(dist));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function Landscape() {
  const decor = useMemo(buildDecor, []);
  const groundGeometry = useMemo(buildGroundGeometry, []);

  return (
    <>
      <mesh
        geometry={groundGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, TILE_BOTTOM_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={GROUND_COLOR} roughness={1} flatShading />
      </mesh>

      {decor.map((item, i) => (
        <DecorObject key={i} item={item} />
      ))}
    </>
  );
}

function DecorObject({ item }: { item: DecorItem }) {
  // Le décor s'aligne sur la hauteur du sol à ses coords XZ — il monte avec
  // les bosses au lieu de flotter à TILE_BOTTOM_Y.
  const y = groundY(item.x, item.z);
  return (
    <group
      position={[item.x, y, item.z]}
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

  for (let i = 0; i < 400; i++) {
    const item = sampleAnnulus(
      rng,
      DECOR_INNER,
      DECOR_OUTER_NEAR,
      1.5,
      KIND_NEAR,
      i,
      items,
    );
    if (item) items.push(item);
  }
  for (let i = 0; i < 260; i++) {
    const item = sampleAnnulus(
      rng,
      DECOR_OUTER_NEAR,
      DECOR_OUTER_FAR,
      2.8,
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
    kind: pickWeighted(table, rng),
    x,
    z,
    rotation: rng() * Math.PI * 2,
    scale: 0.85 + rng() * 0.35,
    seed: ((index + 1) * 0x9e3779b1) >>> 0,
  };
}

