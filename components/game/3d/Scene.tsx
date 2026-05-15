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

import { isInsideGrid } from "@/lib/game/hex";
import type { BuildingKind, GameState, Tile } from "@/lib/game/types";

import { EdgePanControls } from "./EdgePanControls";
import { axialToWorld, worldToAxial } from "./hexMath";
import { PlacementOverlay } from "./PlacementOverlay";
import { TileContents } from "./TileContents";
import { isWaterAt, WorldTerrain } from "./WorldTerrain";

export type HoverHit = {
  tile: Tile;
  worldX: number;
  worldZ: number;
};

// Pas de grille hex visible : on snap le placement à une grille fine (1/4
// unit world) pour le feel "snap-to-grid" sans contrainte hex.
export const SUB_GRID_STEP = 0.25;

export function snapSub(value: number): number {
  return Math.round(value / SUB_GRID_STEP) * SUB_GRID_STEP;
}

type Props = {
  state: GameState;
  selectedKind: BuildingKind | null;
  clickableTileKey: (q: number, r: number) => boolean;
  onTileClick: (q: number, r: number, subX?: number, subZ?: number) => void;
};

const FOG_COLOR = 0xf5efe0;

export function Scene({
  state,
  selectedKind,
  clickableTileKey,
  onTileClick,
}: Props) {
  const [hoverHit, setHoverHit] = useState<HoverHit | null>(null);

  // Mapping world → tile (back-compat avec backend tile-based). Tant que
  // l'engine n'est pas refactor en buildings list, on convertit le clic
  // world en (q, r) + sub-position pour appeler placeBuilding.
  const tileMap = useTileMap(state);

  function tileFromWorld(wx: number, wz: number): Tile | null {
    const [q, r] = worldToAxial(wx, wz);
    if (!isInsideGrid(q, r)) return null;
    return tileMap.get(`${q}:${r}`) ?? null;
  }

  function clickableAt(wx: number, wz: number): boolean {
    if (selectedKind === null) return false;
    if (isWaterAt(wx, wz)) return false;
    const tile = tileFromWorld(wx, wz);
    if (!tile) return false;
    return clickableTileKey(tile.q, tile.r);
  }

  function handleWorldClick(wx: number, wz: number) {
    const tile = tileFromWorld(wx, wz);
    if (!tile) return;
    const [cx, cz] = axialToWorld(tile.q, tile.r);
    const subX = snapSub(wx - cx);
    const subZ = snapSub(wz - cz);
    onTileClick(tile.q, tile.r, subX, subZ);
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

function useTileMap(state: GameState): Map<string, Tile> {
  // Pas de useMemo ici car le composant est simple ; reconstruire à chaque
  // render est négligeable (~1k entrées). Suffit tant que les tiles n'ont
  // pas été retirées du backend.
  const map = new Map<string, Tile>();
  for (const t of state.tiles) map.set(`${t.q}:${t.r}`, t);
  return map;
}
