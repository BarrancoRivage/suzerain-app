"use client";

import { Suspense } from "react";
import { Environment, OrbitControls, SoftShadows } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
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

      {/* Soft contact shadows pour ancrer les volumes sans pénalité GPU énorme. */}
      <SoftShadows size={28} samples={12} focus={0.6} />

      {/* IBL : <Environment preset="park"> charge un HDR de Poly Haven via CDN.
          background={false} → on garde notre couleur parchemin, on n'utilise
          l'environnement que pour l'éclairage indirect des matériaux PBR. */}
      <Suspense fallback={null}>
        <Environment preset="park" background={false} environmentIntensity={0.55} />
      </Suspense>

      {/* Soleil principal : chaud, position oblique, ombres douces. */}
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

      {/* Lumière de remplissage froide (côté opposé) pour adoucir l'ombre. */}
      <directionalLight position={[-6, 5, -8]} intensity={0.35} color="#A8BAD4" />

      {/* Ambient résiduel : très faible, l'essentiel vient de l'IBL. */}
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

      {/* Post-processing :
          - N8AO : occlusion ambiante moderne, donne du contact aux objets.
          - Bloom : halo léger sur les highlights (neige des sommets, hover).
          - Vignette : ferme le cadre, fait respirer la scène.
          - ToneMapping ACES : remappe le HDR vers un sRGB cinéma. */}
      <EffectComposer multisampling={4} enableNormalPass>
        <N8AO
          aoRadius={1.5}
          intensity={3}
          aoSamples={16}
          denoiseSamples={4}
        />
        <Bloom
          intensity={0.32}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette
          eskil={false}
          offset={0.18}
          darkness={0.55}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}
