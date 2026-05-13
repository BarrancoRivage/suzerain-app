"use client";

import { useMemo } from "react";
import { PlaneGeometry } from "three";

import { HEX_THICKNESS } from "./hexMath";
import {
  BigRockModel,
  MountainModel,
  TreeModel,
} from "./models/Models";

const GROUND_SIZE = 48;
const GROUND_SEGMENTS = 96;
const GROUND_COLOR_NEAR = "#7E9560";
const GROUND_Y = -HEX_THICKNESS / 2 - 0.005;

const DECOR_INNER = 7.0;
const DECOR_OUTER = 17;
const PLAYABLE_FLAT_RADIUS = 6.5;

type DecorKind = "mountain" | "forest_cluster" | "rock_cluster" | "rock_single";

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
  const groundGeometry = useMemo(buildGroundGeometry, []);

  return (
    <>
      <mesh
        geometry={groundGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={GROUND_COLOR_NEAR} roughness={1} />
      </mesh>

      {decor.map((item, i) => (
        <DecorObject key={i} item={item} />
      ))}
    </>
  );
}

function buildGroundGeometry() {
  const geo = new PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    GROUND_SEGMENTS,
    GROUND_SEGMENTS,
  );
  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    if (dist < PLAYABLE_FLAT_RADIUS) continue;
    const t = Math.min(1, (dist - PLAYABLE_FLAT_RADIUS) / 4);
    const ease = t * t * (3 - 2 * t);
    const n =
      Math.sin(x * 0.55 + y * 0.4) * 0.55 +
      Math.sin(x * 1.7 - y * 1.1) * 0.28 +
      Math.sin(x * 3.1 + y * 2.6) * 0.14;
    positions.setZ(i, n * 0.45 * ease);
  }
  positions.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function DecorObject({ item }: { item: DecorItem }) {
  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
    >
      <DecorMesh kind={item.kind} seed={item.seed} />
    </group>
  );
}

function DecorMesh({ kind, seed }: { kind: DecorKind; seed: number }) {
  if (kind === "mountain") return <MountainModel seed={seed} />;
  if (kind === "forest_cluster") return <ForestCluster seed={seed} />;
  if (kind === "rock_cluster") return <RockCluster seed={seed} />;
  return <BigRockModel seed={seed} />;
}

function ForestCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 4 + Math.floor(rng() * 3);
  const trees = Array.from({ length: count }, (_, i) => ({
    x: (rng() - 0.5) * 1.6,
    z: (rng() - 0.5) * 1.6,
    s: 0.85 + rng() * 0.35,
    rot: rng() * Math.PI * 2,
    seed: (seed ^ (i * 0x9e37)) >>> 0,
  }));
  return (
    <>
      {trees.map((t, i) => (
        <group
          key={i}
          position={[t.x, 0, t.z]}
          rotation={[0, t.rot, 0]}
          scale={t.s}
        >
          <TreeModel seed={t.seed} decor />
        </group>
      ))}
    </>
  );
}

function RockCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 2 + Math.floor(rng() * 2);
  const rocks = Array.from({ length: count }, (_, i) => ({
    x: (rng() - 0.5) * 1.0,
    z: (rng() - 0.5) * 1.0,
    s: 0.55 + rng() * 0.4,
    rot: rng() * Math.PI * 2,
    seed: (seed ^ (i * 0x85eb)) >>> 0,
  }));
  return (
    <>
      {rocks.map((r, i) => (
        <group
          key={i}
          position={[r.x, 0, r.z]}
          rotation={[0, r.rot, 0]}
          scale={r.s}
        >
          <BigRockModel seed={r.seed} />
        </group>
      ))}
    </>
  );
}

const KIND_DISTRIBUTION_NEAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["forest_cluster", 0.5],
  ["rock_single", 0.25],
  ["rock_cluster", 0.15],
  ["mountain", 0.1],
];

const KIND_DISTRIBUTION_FAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["mountain", 0.55],
  ["rock_cluster", 0.2],
  ["forest_cluster", 0.15],
  ["rock_single", 0.1],
];

function buildDecor(): DecorItem[] {
  const rng = mulberry32(0xc0ffee);
  const items: DecorItem[] = [];
  const minSpacing = 2.1;
  const attempts = 260;

  for (let i = 0; i < attempts; i++) {
    const angle = rng() * Math.PI * 2;
    const t = Math.sqrt(rng());
    const dist = DECOR_INNER + t * (DECOR_OUTER - DECOR_INNER);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (items.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minSpacing ** 2)) {
      continue;
    }

    const normalized = (dist - DECOR_INNER) / (DECOR_OUTER - DECOR_INNER);
    const table = normalized < 0.4 ? KIND_DISTRIBUTION_NEAR : KIND_DISTRIBUTION_FAR;
    const kind = pickKind(table, rng);

    items.push({
      kind,
      x,
      z,
      rotation: rng() * Math.PI * 2,
      scale: 0.9 + rng() * 0.35,
      seed: ((i + 1) * 0x9e3779b1) >>> 0,
    });
  }

  return items;
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
