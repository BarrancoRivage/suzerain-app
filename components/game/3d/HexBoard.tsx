"use client";

import { Canvas } from "@react-three/fiber";

import type { GameState } from "@/lib/game/types";
import { Scene } from "./Scene";

type Props = {
  state: GameState;
  clickableTileKey: (q: number, r: number) => boolean;
  onTileClick: (q: number, r: number) => void;
};

export function HexBoard({ state, clickableTileKey, onTileClick }: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        // `flat` désactive le tone mapping du renderer — c'est l'EffectComposer
        // qui s'en charge via la passe ToneMapping ACES_FILMIC.
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 22, 28], fov: 38, near: 0.1, far: 150 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Scene
          state={state}
          clickableTileKey={clickableTileKey}
          onTileClick={onTileClick}
        />
      </Canvas>
    </div>
  );
}
