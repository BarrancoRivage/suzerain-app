"use client";

import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";

import type { GameState } from "@/lib/game/types";
import { HexTile } from "./HexTile";

type Props = {
  state: GameState;
  clickableTileKey: (q: number, r: number) => boolean;
  onTileClick: (q: number, r: number) => void;
};

// 0xF5EFE0 = parchment
const FOG_COLOR = 0xf5efe0;

export function Scene({ state, clickableTileKey, onTileClick }: Props) {
  return (
    <>
      <color attach="background" args={["#F5EFE0"]} />
      <fog attach="fog" args={[FOG_COLOR, 12, 22]} />

      <ambientLight intensity={0.55} color="#FFF6E0" />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.15}
        color="#FFE9B8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <directionalLight position={[-4, 3, -6]} intensity={0.3} color="#B89060" />

      <Suspense fallback={null}>
        {state.tiles.map((tile) => (
          <HexTile
            key={`${tile.q}:${tile.r}`}
            tile={tile}
            clickable={clickableTileKey(tile.q, tile.r)}
            onClick={() => onTileClick(tile.q, tile.r)}
          />
        ))}
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.6}
        target={[0, 0, 0]}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </>
  );
}
