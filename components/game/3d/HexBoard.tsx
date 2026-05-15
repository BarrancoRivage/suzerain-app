"use client";

import { Canvas } from "@react-three/fiber";

import type { BuildingKind, GameState } from "@/lib/game/types";
import { Scene } from "./Scene";

type Props = {
  state: GameState;
  selectedKind: BuildingKind | null;
  isReadOnly: boolean;
  pending: boolean;
  onWorldClick: (x: number, z: number, hitBuildingId: string | null) => void;
};

export function HexBoard({
  state,
  selectedKind,
  isReadOnly,
  pending,
  onWorldClick,
}: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 58, 72], fov: 42, near: 0.1, far: 400 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Scene
          state={state}
          selectedKind={selectedKind}
          isReadOnly={isReadOnly}
          pending={pending}
          onWorldClick={onWorldClick}
        />
      </Canvas>
    </div>
  );
}
