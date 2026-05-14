"use client";

import { useEffect, useMemo } from "react";
import {
  Color,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { useLoader } from "@react-three/fiber";

// Matière PBR custom pour le sol (périph + dessus des tuiles hex). On patche
// le shader standard de three.js via `onBeforeCompile` pour injecter :
//   1. un splatmap (mélange herbe procédurale / terre / pierre) calé sur
//      l'altitude et un noise tileable
//   2. une normale tangent-space blendée à partir des normal maps de chaque
//      couche (UnevenBrick pour dirt, RockTrim pour rock ; herbe = normale
//      neutre — la déformation visuelle vient du noise du splatmap)
//
// Avantage du patching : on garde toute la pipeline PBR standard (IBL,
// ombres, fog, ACES tone mapping via le composer) — on ne réécrit que le
// calcul de `diffuseColor` et de la normale tangent-space.
//
// Textures CC0 Quaternius Medieval Village MegaKit.

const TEX_NOISE = "/textures/megakit/T_Noise_Terrain.png";
const TEX_DIRT_BASE = "/textures/megakit/T_UnevenBrick_BaseColor.png";
const TEX_DIRT_NORMAL = "/textures/megakit/T_UnevenBrick_Normal.png";
const TEX_ROCK_BASE = "/textures/megakit/T_RockTrim_BaseColor.png";
const TEX_ROCK_NORMAL = "/textures/megakit/T_RockTrim_Normal.png";

const GRASS_DARK = new Color("#4A6A32");
const GRASS_LIGHT = new Color("#86A557");

// Tuilage des textures : ~1 répétition tous les 5.5 m. Plus c'est élevé,
// plus les textures sont serrées (et visibles).
const TILE_SCALE = 0.18;

export function useTerrainMaterial(): MeshStandardMaterial {
  const [noise, dirtBase, dirtNormal, rockBase, rockNormal] = useLoader(
    TextureLoader,
    [TEX_NOISE, TEX_DIRT_BASE, TEX_DIRT_NORMAL, TEX_ROCK_BASE, TEX_ROCK_NORMAL],
  );

  useEffect(() => {
    for (const t of [noise, dirtBase, dirtNormal, rockBase, rockNormal]) {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
    }
    // Color textures : sRGB. Noise + normal maps : données brutes (linear).
    dirtBase.colorSpace = SRGBColorSpace;
    rockBase.colorSpace = SRGBColorSpace;
    noise.colorSpace = NoColorSpace;
    dirtNormal.colorSpace = NoColorSpace;
    rockNormal.colorSpace = NoColorSpace;
  }, [noise, dirtBase, dirtNormal, rockBase, rockNormal]);

  return useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      // On définit une normalMap pour activer le chunk <normal_fragment_maps>
      // du shader standard — on remplace ensuite son contenu par notre blend.
      normalMap: dirtNormal,
    });

    const uniforms = {
      uNoise: { value: noise },
      uDirtBase: { value: dirtBase },
      uDirtNormal: { value: dirtNormal },
      uRockBase: { value: rockBase },
      uRockNormal: { value: rockNormal },
      uTileScale: { value: TILE_SCALE },
      uGrassDark: { value: GRASS_DARK },
      uGrassLight: { value: GRASS_LIGHT },
    };

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);

      // VERTEX : exposer la worldPosition au fragment.
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec3 vTerrainWP;`,
        )
        .replace(
          "#include <worldpos_vertex>",
          `#include <worldpos_vertex>
           vTerrainWP = worldPosition.xyz;`,
        );

      // FRAGMENT : déclarations partagées + splat color + splat normal.
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec3 vTerrainWP;
           uniform sampler2D uNoise;
           uniform sampler2D uDirtBase;
           uniform sampler2D uDirtNormal;
           uniform sampler2D uRockBase;
           uniform sampler2D uRockNormal;
           uniform float uTileScale;
           uniform vec3 uGrassDark;
           uniform vec3 uGrassLight;`,
        )
        // Splatmap → diffuseColor.rgb. On déclare aussi les weights ici
        // pour pouvoir les réutiliser dans le blend de normale ci-dessous.
        .replace(
          "#include <map_fragment>",
          `vec2 splatUV = vTerrainWP.xz * uTileScale;
           float splatN1 = texture2D(uNoise, vTerrainWP.xz * 0.025).r;
           float splatN2 = texture2D(uNoise, vTerrainWP.xz * 0.08 + 0.5).r;
           float splatAlt = clamp(vTerrainWP.y / 1.2, 0.0, 1.0);

           // Roche révélée par l'altitude + brisures du noise.
           // Sur la zone jouable (alt ≈ 0), wRock est faible donc roche rare.
           float splatRockW = smoothstep(0.30, 0.80, splatAlt + splatN1 * 0.45);
           // Plaques de terre dispersées par noise — sans gate sur la roche
           // pour qu'on en voie aussi sur les hauteurs (chemins de terre).
           float splatDirtW = smoothstep(0.55, 0.78, splatN2) * (1.0 - 0.5 * splatRockW);
           float splatGrassW = max(0.0, 1.0 - splatRockW - splatDirtW);

           // Normalize so weights sum to 1.
           float splatTotal = splatRockW + splatDirtW + splatGrassW + 1e-4;
           splatRockW /= splatTotal;
           splatDirtW /= splatTotal;
           splatGrassW /= splatTotal;

           vec3 splatGrass = mix(uGrassDark, uGrassLight, splatN2);
           vec3 splatDirt = texture2D(uDirtBase, splatUV).rgb;
           vec3 splatRock = texture2D(uRockBase, splatUV).rgb;

           diffuseColor.rgb = splatGrass * splatGrassW
                            + splatDirt * splatDirtW
                            + splatRock * splatRockW;`,
        )
        // Remplacement du calcul de normale : on échantillonne les 2 normal
        // maps (dirt + rock) en tangent space et on les blend selon les
        // weights du splatmap. L'herbe garde la normale géométrique
        // (vec3(0,0,1) en TS) — les variations de l'herbe viennent du noise
        // appliqué à sa couleur, pas d'un bumping de surface.
        .replace(
          "#include <normal_fragment_maps>",
          `vec3 nDirt = texture2D(uDirtNormal, splatUV).xyz * 2.0 - 1.0;
           vec3 nRock = texture2D(uRockNormal, splatUV).xyz * 2.0 - 1.0;
           vec3 nGrass = vec3(0.0, 0.0, 1.0);
           vec3 tsNormal = normalize(
             nGrass * splatGrassW + nDirt * splatDirtW + nRock * splatRockW
           );
           // Reproduit le tbn standard de three.js (sans tangent attribute
           // explicite, three.js calcule un tangent local au moment du
           // fragment). On utilise vTBN si dispo, sinon perturbNormal2Arb.
           #ifdef USE_TANGENT
             vec3 mappedNormal = normalize(tbn * tsNormal);
           #else
             vec3 mappedNormal = perturbNormal2Arb(
               -vViewPosition, normal, tsNormal, faceDirection
             );
           #endif
           normal = mappedNormal;`,
        );
    };

    return mat;
  }, [noise, dirtBase, dirtNormal, rockBase, rockNormal]);
}
