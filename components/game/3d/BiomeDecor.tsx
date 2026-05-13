"use client";

import { useMemo } from "react";

import type { Biome } from "@/lib/game/types";
import { PlainTuftModel, RockModel, TreeModel } from "./models/Models";

type Props = { biome: Biome; seed: number };

export function BiomeDecor({ biome, seed }: Props) {
  const items = useMemo(() => buildItems(biome, seed), [biome, seed]);
  return <>{items}</>;
}

function buildItems(biome: Biome, seed: number): React.ReactElement[] {
  const rng = mulberry32(seed);
  if (biome === "forest") {
    const count = 3 + Math.floor(rng() * 2);
    return Array.from({ length: count }, (_, i) => (
      <group
        key={`t-${i}`}
        position={[
          rngRange(rng, -0.42, 0.42),
          0,
          rngRange(rng, -0.42, 0.42),
        ]}
        rotation={[0, rng() * Math.PI * 2, 0]}
        scale={rngRange(rng, 0.85, 1.15)}
      >
        <TreeModel seed={(seed ^ (i * 0x9e37)) >>> 0} />
      </group>
    ));
  }
  if (biome === "hill") {
    const count = 2 + Math.floor(rng() * 2);
    return Array.from({ length: count }, (_, i) => (
      <group
        key={`r-${i}`}
        position={[
          rngRange(rng, -0.4, 0.4),
          0,
          rngRange(rng, -0.4, 0.4),
        ]}
        rotation={[0, rng() * Math.PI * 2, 0]}
        scale={rngRange(rng, 0.7, 1.1)}
      >
        <RockModel seed={(seed ^ (i * 0x85eb)) >>> 0} />
      </group>
    ));
  }
  if (biome === "plain" && rng() < 0.55) {
    return [
      <group
        key="g"
        position={[
          rngRange(rng, -0.35, 0.35),
          0,
          rngRange(rng, -0.35, 0.35),
        ]}
        rotation={[0, rng() * Math.PI * 2, 0]}
      >
        <PlainTuftModel seed={seed} />
      </group>,
    ];
  }
  return [];
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
