"use client";

import { useMemo } from "react";
import { IcosahedronGeometry, PlaneGeometry } from "three";

import { HEX_THICKNESS } from "./hexMath";

// Sol continu sous la scène + décor posé en anneau autour du disque jouable.
// Aucun hexagone hors zone interactive — l'œil identifie immédiatement la
// frontière entre carte de jeu (tuiles hex overlay) et toile de fond.

const GROUND_SIZE = 48;
const GROUND_SEGMENTS = 96;
const GROUND_COLOR_NEAR = "#7E9560";
const GROUND_Y = -HEX_THICKNESS / 2 - 0.005;

// Anneau de placement du décor. Le disque jouable (rayon axial 3) atteint
// distance world ~6.1, on commence à 7.0 pour éviter de mordre dessus.
const DECOR_INNER = 7.0;
const DECOR_OUTER = 17;
const PLAYABLE_FLAT_RADIUS = 6.5;

type DecorKind = "mountain" | "forest_cluster" | "rock_cluster" | "hill";

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
        <meshStandardMaterial
          color={GROUND_COLOR_NEAR}
          roughness={1}
          flatShading
        />
      </mesh>

      {decor.map((item, i) => (
        <DecorObject key={i} item={item} />
      ))}
    </>
  );
}

// Sol : PlaneGeometry subdivisée, déplacement procédural via sommes de sinus.
// Plat dans la zone jouable (radius 6.5), pente progressive ensuite. Variation
// d'amplitude par bandes pour suggérer collines proches et reliefs lointains.
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
    if (dist < PLAYABLE_FLAT_RADIUS) {
      continue;
    }
    // Easing entre flat (0) et displacement plein (1).
    const t = Math.min(1, (dist - PLAYABLE_FLAT_RADIUS) / 4);
    const ease = t * t * (3 - 2 * t);

    const n =
      Math.sin(x * 0.55 + y * 0.4) * 0.55 +
      Math.sin(x * 1.7 - y * 1.1) * 0.28 +
      Math.sin(x * 3.1 + y * 2.6) * 0.14;
    // Le sol est tourné -π/2 autour de X — le Z local (axe normal) devient Y dans
    // le monde. PlaneGeometry stocke ses sommets en (x, y, z=0), on déplace Z.
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
  if (kind === "mountain") return <MountainCluster seed={seed} />;
  if (kind === "forest_cluster") return <ForestCluster seed={seed} />;
  if (kind === "rock_cluster") return <RockCluster seed={seed} />;
  return <Hill seed={seed} />;
}

// --- Décors ---

// Pic individuel : tronc en cône pierreux + calotte de neige centrée sur l'apex.
function Peak({
  x = 0,
  z = 0,
  height,
  radius,
  snowRatio = 0.4,
  segments = 7,
}: {
  x?: number;
  z?: number;
  height: number;
  radius: number;
  snowRatio?: number;
  segments?: number;
}) {
  const snowH = height * snowRatio;
  const snowR = radius * snowRatio + 0.05;
  const snowCenterY = height - snowH / 2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius, height, segments]} />
        <meshStandardMaterial color="#5F574A" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, snowCenterY, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, segments]} />
        <meshStandardMaterial color="#EFE4C9" roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

function MountainCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const mainH = 1.8 + rng() * 1.2;
  const mainR = 0.85 + rng() * 0.4;
  const secondaryCount = rng() < 0.7 ? (rng() < 0.5 ? 1 : 2) : 0;
  const secondaries = Array.from({ length: secondaryCount }, () => {
    const angle = rng() * Math.PI * 2;
    const dist = 0.7 + rng() * 0.4;
    return {
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      h: mainH * (0.5 + rng() * 0.25),
      r: mainR * (0.55 + rng() * 0.2),
    };
  });
  return (
    <>
      <Peak height={mainH} radius={mainR} />
      {secondaries.map((s, i) => (
        <Peak key={i} x={s.x} z={s.z} height={s.h} radius={s.r} />
      ))}
    </>
  );
}

function ForestCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 5 + Math.floor(rng() * 4);
  const trees = Array.from({ length: count }, (_, i) => ({
    x: (rng() - 0.5) * 1.8,
    z: (rng() - 0.5) * 1.8,
    s: 0.95 + rng() * 0.45,
    seed: (seed ^ (i * 0x9e37)) >>> 0,
  }));
  return (
    <>
      {trees.map((t, i) => (
        <BigTree key={i} x={t.x} z={t.z} scale={t.s} seed={t.seed} />
      ))}
    </>
  );
}

const BIG_TREE_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#1F3D21", "#2F5232", "#406841"],
  ["#234027", "#345A38", "#467548"],
  ["#1B3320", "#2A4828", "#3F6438"],
];

function BigTree({
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
  const trunkH = 0.45 + rng() * 0.18;
  const palette = BIG_TREE_PALETTES[Math.floor(rng() * BIG_TREE_PALETTES.length)];
  // Couronne volumétrique : 6 à 8 icosaèdres imbriqués.
  const blobs = useMemo(() => {
    const rng2 = mulberry32(seed ^ 0xb1);
    const count = 6 + Math.floor(rng2() * 3);
    return Array.from({ length: count }, (_, i) => ({
      x: (rng2() - 0.5) * 0.5,
      y: (rng2() - 0.35) * 0.45,
      z: (rng2() - 0.5) * 0.5,
      s: 0.3 + rng2() * 0.14,
      color: palette[i % palette.length],
    }));
  }, [seed, palette]);
  return (
    <group position={[x, 0, z]} scale={scale} rotation={[0, rng() * Math.PI, 0]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, trunkH, 7]} />
        <meshStandardMaterial color="#332218" roughness={0.95} />
      </mesh>
      <group position={[0, trunkH + 0.28, 0]}>
        {blobs.map((b, i) => (
          <mesh
            key={i}
            position={[b.x, b.y, b.z]}
            scale={b.s}
            castShadow
            receiveShadow
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={b.color}
              roughness={0.85}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RockCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 2 + Math.floor(rng() * 3);
  const rocks = Array.from({ length: count }, (_, i) => ({
    x: (rng() - 0.5) * 1.1,
    z: (rng() - 0.5) * 1.1,
    s: 0.55 + rng() * 0.4,
    seed: (seed ^ (i * 0x85eb)) >>> 0,
    rot: rng() * Math.PI * 2,
  }));
  return (
    <>
      {rocks.map((r, i) => (
        <BigRock key={i} x={r.x} z={r.z} scale={r.s} seed={r.seed} rot={r.rot} />
      ))}
    </>
  );
}

function BigRock({
  x,
  z,
  scale,
  seed,
  rot,
}: {
  x: number;
  z: number;
  scale: number;
  seed: number;
  rot: number;
}) {
  // Déplacement radial uniforme (cf. BiomeDecor.buildRockGeometry) — préserve
  // la topologie convexe, pas d'auto-intersection de triangles.
  const geometry = useMemo(() => {
    const geo = new IcosahedronGeometry(0.42, 1);
    const positions = geo.attributes.position;
    const rng = mulberry32(seed);
    for (let i = 0; i < positions.count; i++) {
      const factor = 0.88 + rng() * 0.22;
      positions.setXYZ(
        i,
        positions.getX(i) * factor,
        positions.getY(i) * factor,
        positions.getZ(i) * factor,
      );
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [seed]);
  return (
    <mesh
      position={[x, 0.3 * scale, z]}
      scale={scale}
      rotation={[0, rot, 0]}
      castShadow
      receiveShadow
      geometry={geometry}
    >
      <meshStandardMaterial color="#736657" roughness={1} flatShading />
    </mesh>
  );
}

function Hill({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const h = 0.45 + rng() * 0.3;
  const r = 1.1 + rng() * 0.4;
  return (
    <mesh
      position={[0, h * 0.35, 0]}
      scale={[r, h, r]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#728F4D" roughness={1} flatShading />
    </mesh>
  );
}

// --- Distribution ---

const KIND_DISTRIBUTION_NEAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["forest_cluster", 0.5],
  ["hill", 0.3],
  ["rock_cluster", 0.12],
  ["mountain", 0.08],
];

const KIND_DISTRIBUTION_FAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["mountain", 0.6],
  ["rock_cluster", 0.18],
  ["forest_cluster", 0.15],
  ["hill", 0.07],
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
      scale: 0.9 + rng() * 0.4,
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
