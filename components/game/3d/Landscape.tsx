"use client";

import { useMemo } from "react";

import { HEX_HEIGHT } from "./hexMath";

// Sol continu sous la scène + décor posé en anneau autour du disque jouable.
// Aucun hexagone hors zone interactive — l'œil identifie immédiatement la
// frontière entre carte de jeu (tuiles hex surélevées) et toile de fond.

const GROUND_RADIUS = 22;
const GROUND_COLOR = "#C8B68E";
const GROUND_Y = -HEX_HEIGHT / 2 - 0.005;

// Anneau de placement du décor. Le disque jouable (rayon axial 3) atteint
// distance world ~6.1, on commence à 6.7 pour éviter de mordre dessus.
const DECOR_INNER = 6.7;
const DECOR_OUTER = 14;

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
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y, 0]}
        receiveShadow
      >
        <circleGeometry args={[GROUND_RADIUS, 96]} />
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

function Mountain({
  x = 0,
  z = 0,
  height,
  radius,
  snowRatio = 0.42,
}: {
  x?: number;
  z?: number;
  height: number;
  radius: number;
  snowRatio?: number;
}) {
  // Le cap de neige est un cône plus petit dont l'apex coïncide pile avec
  // celui de la montagne. Son rayon de base reprend la section du cône à
  // cette hauteur (snowRatio * radius), avec un léger débord pour le rendre
  // visible comme « calotte ».
  const snowH = height * snowRatio;
  const snowR = radius * snowRatio + 0.03;
  const snowCenterY = height - snowH / 2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius, height, 6]} />
        <meshStandardMaterial color="#6E6354" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, snowCenterY, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, 6]} />
        <meshStandardMaterial color="#EFE4C9" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function MountainCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const mainH = 1.6 + rng() * 0.9;
  const mainR = 0.7 + rng() * 0.3;
  const hasSecondary = rng() < 0.55;
  const sndOffsetAngle = rng() * Math.PI * 2;
  const sndDist = 0.55 + rng() * 0.25;
  const sndH = mainH * (0.55 + rng() * 0.2);
  const sndR = mainR * (0.55 + rng() * 0.2);
  return (
    <>
      <Mountain height={mainH} radius={mainR} />
      {hasSecondary ? (
        <Mountain
          x={Math.cos(sndOffsetAngle) * sndDist}
          z={Math.sin(sndOffsetAngle) * sndDist}
          height={sndH}
          radius={sndR}
        />
      ) : null}
    </>
  );
}

function ForestCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 4 + Math.floor(rng() * 4);
  const trees = Array.from({ length: count }, () => ({
    x: (rng() - 0.5) * 1.6,
    z: (rng() - 0.5) * 1.6,
    s: 0.85 + rng() * 0.4,
  }));
  return (
    <>
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} scale={t.s} />
      ))}
    </>
  );
}

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.32, 6]} />
        <meshStandardMaterial color="#3F2D1F" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <coneGeometry args={[0.26, 0.65, 8]} />
        <meshStandardMaterial color="#2F4A2F" roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

function RockCluster({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const count = 2 + Math.floor(rng() * 3);
  const rocks = Array.from({ length: count }, () => ({
    x: (rng() - 0.5) * 1.0,
    z: (rng() - 0.5) * 1.0,
    s: 0.4 + rng() * 0.35,
    rot: rng() * Math.PI * 2,
    tilt: (rng() - 0.5) * 0.3,
  }));
  return (
    <>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.s * 0.4, r.z]}
          scale={r.s}
          rotation={[r.tilt, r.rot, r.tilt]}
          castShadow
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#7E7263" roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Hill({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const h = 0.35 + rng() * 0.25;
  const r = 0.9 + rng() * 0.35;
  return (
    <mesh position={[0, h * 0.35, 0]} scale={[r, h, r]} castShadow receiveShadow>
      <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#A89368" roughness={1} flatShading />
    </mesh>
  );
}

// --- Distribution ---

const KIND_DISTRIBUTION_NEAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["forest_cluster", 0.45],
  ["hill", 0.3],
  ["rock_cluster", 0.15],
  ["mountain", 0.1],
];

const KIND_DISTRIBUTION_FAR: ReadonlyArray<readonly [DecorKind, number]> = [
  ["mountain", 0.55],
  ["rock_cluster", 0.2],
  ["forest_cluster", 0.15],
  ["hill", 0.1],
];

function buildDecor(): DecorItem[] {
  // Échantillonnage type Poisson-disc grossier : on tire 200 candidats,
  // on garde ceux qui sont assez éloignés des précédents. Déterministe via
  // une seed fixe pour que la map du monde reste cohérente d'une session
  // à l'autre.
  const rng = mulberry32(0xc0ffee);
  const items: DecorItem[] = [];
  const minSpacing = 1.9;
  const attempts = 220;

  for (let i = 0; i < attempts; i++) {
    const angle = rng() * Math.PI * 2;
    const t = Math.sqrt(rng()); // uniforme par aire entre les rayons
    const dist = DECOR_INNER + t * (DECOR_OUTER - DECOR_INNER);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (items.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minSpacing ** 2)) {
      continue;
    }

    const normalized = (dist - DECOR_INNER) / (DECOR_OUTER - DECOR_INNER);
    const table = normalized < 0.5 ? KIND_DISTRIBUTION_NEAR : KIND_DISTRIBUTION_FAR;
    const kind = pickKind(table, rng);

    items.push({
      kind,
      x,
      z,
      rotation: rng() * Math.PI * 2,
      scale: 0.85 + rng() * 0.35,
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
