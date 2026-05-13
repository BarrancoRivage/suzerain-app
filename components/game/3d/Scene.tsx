"use client";

import { Suspense } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

import type { GameState } from "@/lib/game/types";
import { HexTile } from "./HexTile";
import { Landscape } from "./Landscape";

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
      <fog attach="fog" args={[FOG_COLOR, 20, 38]} />

      {/* IBL pour l'éclairage indirect des matériaux PBR. */}
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
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-6, 5, -8]} intensity={0.35} color="#A8BAD4" />
      <ambientLight intensity={0.18} color="#FFF1D4" />

      <Suspense fallback={null}>
        <Landscape />
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
        minDistance={9}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.4}
        target={[0, 0, 0]}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />

      {/* Post-processing léger : Bloom + Vignette + ACES.
          N8AO et SoftShadows retirés (~50 % du frame budget gagné). */}
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
