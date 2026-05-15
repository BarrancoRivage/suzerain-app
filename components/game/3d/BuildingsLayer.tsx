"use client";

import type { GameState, WorldBuilding } from "@/lib/game/types";
import { Html } from "@react-three/drei";

import { terrainHeightAt } from "@/lib/game/procgen";
import {
  FarmModel,
  HouseModel,
  LumberjackModel,
  MineModel,
} from "./models/Models";

// Rendu de tous les bâtiments du joueur en coordonnées monde.
export function BuildingsLayer({ state }: { state: GameState }) {
  return (
    <>
      {state.buildings.map((b) => (
        <BuildingMesh key={b.id} building={b} />
      ))}
    </>
  );
}

function BuildingMesh({ building }: { building: WorldBuilding }) {
  const y = terrainHeightAt(building.x, building.z) + 0.02;
  // Rotation déterministe basée sur l'id pour la variété visuelle.
  const rotation = hashRotation(building.id);
  const seed = hashSeed(building.id);

  return (
    <group position={[building.x, y, building.z]} rotation={[0, rotation, 0]}>
      <group scale={0.72}>
        {building.kind === "farm" && <FarmModel seed={seed} />}
        {building.kind === "lumberjack" && <LumberjackModel />}
        {building.kind === "house" && <HouseModel />}
        {building.kind === "mine" && <MineModel />}
      </group>
      <Html
        position={[0, 1.7, 0]}
        center
        zIndexRange={[10, 0]}
        className="pointer-events-none select-none"
      >
        <div className="whitespace-nowrap rounded-full border border-gold/70 bg-parchment px-2 py-0.5 font-serif text-sm font-semibold leading-none text-ink shadow-sm tabular-nums">
          {building.level}
        </div>
      </Html>
    </group>
  );
}

function hashRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ((h % 6) * Math.PI) / 3;
}

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 131 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}
