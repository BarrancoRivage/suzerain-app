"use client";

import { useMemo } from "react";

import { mulberry32, pickWeighted } from "@/lib/game/rng";
import { terrainElevation } from "./Terrain";
import {
  StandaloneHill,
  StandaloneMountain,
  StandaloneRock,
  StandaloneTree,
} from "./models/Models";

// Décor périphérique au-delà du disque jouable. La mesh de terrain elle-même
// est gérée par Terrain.tsx (mesh continue, displacement intégré). Ici on
// ne fait que scattering : arbres, rochers, collines, montagnes au-delà
// du rayon `DECOR_INNER`, chaque élément aligné en Y sur l'élévation du
// terrain (terrainElevation partagée).

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

export function Landscape() {
  const decor = useMemo(buildDecor, []);
  // Pas de ground mesh ici — la grosse mesh terrain continue (cf. Terrain.tsx)
  // couvre toute la map. Landscape ne s'occupe plus que de scattering les
  // décors périphériques (arbres, rochers, montagnes au-delà du disque
  // jouable).
  return (
    <>
      {decor.map((item, i) => (
        <DecorObject key={i} item={item} />
      ))}
    </>
  );
}

function DecorObject({ item }: { item: DecorItem }) {
  // L'élévation vient de la même fonction que la mesh terrain — décor et
  // sol restent cohérents partout.
  const y = terrainElevation(item.x, item.z);
  return (
    <group
      position={[item.x, y, item.z]}
      rotation={[0, item.rotation, 0]}
      scale={item.scale}
    >
      {item.kind === "tree" && <StandaloneTree seed={item.seed} />}
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

