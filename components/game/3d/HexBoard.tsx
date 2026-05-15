"use client";

import { Canvas } from "@react-three/fiber";

import type { BuildingKind, GameState } from "@/lib/game/types";
import { Scene } from "./Scene";

type Props = {
  state: GameState;
  selectedKind: BuildingKind | null;
  clickableTileKey: (q: number, r: number) => boolean;
  onTileClick: (q: number, r: number, subX?: number, subZ?: number) => void;
};

export function HexBoard({
  state,
  selectedKind,
  clickableTileKey,
  onTileClick,
}: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        // `flat` désactive le tone mapping du renderer — c'est l'EffectComposer
        // qui s'en charge via la passe ToneMapping ACES_FILMIC.
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 58, 72], fov: 42, near: 0.1, far: 260 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Scene
          state={state}
          selectedKind={selectedKind}
          clickableTileKey={clickableTileKey}
          onTileClick={onTileClick}
        />
      </Canvas>
    </div>
  );
}
