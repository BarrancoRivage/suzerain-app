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
        dpr={[1, 2]}
        camera={{ position: [0, 10, 12], fov: 38, near: 0.1, far: 60 }}
        gl={{ antialias: true }}
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
