"use client";

import { Suspense, useState } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

import {
  MIN_BUILDING_SPACING,
  isInMapBounds,
  isWaterAt,
} from "@/lib/game/procgen";
import type { BuildingKind, GameState } from "@/lib/game/types";

import { EdgePanControls } from "./EdgePanControls";
import { PlacementOverlay } from "./PlacementOverlay";
import { TileContents } from "./TileContents";
import { WorldTerrain } from "./WorldTerrain";

export type HoverHit = {
  worldX: number;
  worldZ: number;
};

// Snap fin (en world units) pour la position du ghost. 0.25 unit ≈ 25 cm.
export const SUB_GRID_STEP = 0.25;

export function snapSub(value: number): number {
  return Math.round(value / SUB_GRID_STEP) * SUB_GRID_STEP;
}

type Props = {
  state: GameState;
  selectedKind: BuildingKind | null;
  isReadOnly: boolean;
  pending: boolean;
  onWorldClick: (x: number, z: number, hitBuildingId: string | null) => void;
};

const FOG_COLOR = 0xf5efe0;
const CLICK_PICK_RADIUS = 0.9; // tolérance world pour cliquer un bâtiment

export function Scene({
  state,
  selectedKind,
  isReadOnly,
  pending,
  onWorldClick,
}: Props) {
  const [hoverHit, setHoverHit] = useState<HoverHit | null>(null);

  function findBuildingAt(x: number, z: number): string | null {
    let bestId: string | null = null;
    let bestDistSq = CLICK_PICK_RADIUS * CLICK_PICK_RADIUS;
    for (const b of state.buildings) {
      const dx = b.x - x;
      const dz = b.z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestId = b.id;
      }
    }
    return bestId;
  }

  function clickableAt(x: number, z: number): boolean {
    if (pending) return false;
    // Mode inspection : on peut cliquer si on tape sur un bâtiment proche.
    if (selectedKind === null) {
      return findBuildingAt(x, z) !== null;
    }
    if (isReadOnly) return false;
    if (!isInMapBounds(x, z)) return false;
    if (isWaterAt(x, z)) return false;
    // Overlap check.
    for (const b of state.buildings) {
      const dx = b.x - x;
      const dz = b.z - z;
      if (dx * dx + dz * dz < MIN_BUILDING_SPACING * MIN_BUILDING_SPACING) {
        return false;
      }
    }
    return true;
  }

  function handleWorldClick(x: number, z: number) {
    if (selectedKind === null) {
      const hit = findBuildingAt(x, z);
      if (hit) onWorldClick(x, z, hit);
      return;
    }
    const snappedX = snapSub(x);
    const snappedZ = snapSub(z);
    onWorldClick(snappedX, snappedZ, null);
  }

  return (
    <>
      <color attach="background" args={["#F5EFE0"]} />
      <fog attach="fog" args={[FOG_COLOR, 140, 240]} />

      <Suspense fallback={null}>
        <Environment
          preset="park"
          background={false}
          environmentIntensity={0.55}
        />
      </Suspense>

      <directionalLight
        position={[8, 14, 5]}
        intensity={1.6}
        color="#FFE9B8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-6, 5, -8]} intensity={0.35} color="#A8BAD4" />
      <ambientLight intensity={0.18} color="#FFF1D4" />

      <Suspense fallback={null}>
        <WorldTerrain
          clickableAt={clickableAt}
          onWorldClick={handleWorldClick}
          onHoverChange={setHoverHit}
        />
        <TileContents state={state} />
        <PlacementOverlay
          selectedKind={selectedKind}
          hoverHit={hoverHit}
          clickableAt={clickableAt}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={22}
        maxDistance={260}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.4}
        target={[0, 0, 0]}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
      />
      <EdgePanControls />

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.28}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette
          eskil={false}
          offset={0.2}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}
