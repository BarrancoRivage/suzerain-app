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
    <div className="w-full h-[520px] rounded-md border border-ink/15 bg-parchment overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 8, 10], fov: 42, near: 0.1, far: 50 }}
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
