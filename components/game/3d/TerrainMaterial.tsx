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

// Matière PBR custom pour le sol périphérique. On patche le shader standard
// de three.js via `onBeforeCompile` pour injecter un splatmap (mélange
// herbe procédurale / terre / pierre) calculé à partir de l'altitude et
// d'un noise tileable. Avantage du patching : on garde toute la pipeline
// PBR standard (IBL, ombres, fog, tone mapping ACES via le composer) — on
// ne réécrit que le calcul de `diffuseColor`.
//
// Textures CC0 Quaternius Medieval Village MegaKit :
//   - T_Noise_Terrain.png : masque procédural pour le mix dirt/grass
//   - T_UnevenBrick_BaseColor.png : pavés / terre tassée
//   - T_RockTrim_BaseColor.png : roche grise
// L'herbe est procédurale (gradient entre 2 verts modulé par le noise),
// pas de texture grass dans MegaKit.

const TEX_NOISE = "/textures/megakit/T_Noise_Terrain.png";
const TEX_DIRT = "/textures/megakit/T_UnevenBrick_BaseColor.png";
const TEX_ROCK = "/textures/megakit/T_RockTrim_BaseColor.png";

const GRASS_DARK = new Color("#4A6A32");
const GRASS_LIGHT = new Color("#86A557");

// Échelle de tuilage des textures : 0.18 = ~1 répétition tous les 5.5 m.
// Plus la valeur est haute plus les textures sont serrées (et visibles).
const TILE_SCALE = 0.18;

export function useTerrainMaterial(): MeshStandardMaterial {
  const [noise, dirt, rock] = useLoader(TextureLoader, [
    TEX_NOISE,
    TEX_DIRT,
    TEX_ROCK,
  ]);

  useEffect(() => {
    for (const t of [noise, dirt, rock]) {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
    }
    // Color textures : sRGB pour décodage gamma correct par three.js.
    dirt.colorSpace = SRGBColorSpace;
    rock.colorSpace = SRGBColorSpace;
    // Noise est une donnée brute (pas une couleur), pas de gamma.
    noise.colorSpace = NoColorSpace;
  }, [noise, dirt, rock]);

  return useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
    });

    const uniforms = {
      uNoise: { value: noise },
      uDirt: { value: dirt },
      uRock: { value: rock },
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

      // FRAGMENT : déclarations + splat blend qui écrase diffuseColor.
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           varying vec3 vTerrainWP;
           uniform sampler2D uNoise;
           uniform sampler2D uDirt;
           uniform sampler2D uRock;
           uniform float uTileScale;
           uniform vec3 uGrassDark;
           uniform vec3 uGrassLight;`,
        )
        .replace(
          "#include <map_fragment>",
          `vec2 tUV = vTerrainWP.xz * uTileScale;
           // Deux échantillonnages de noise à des fréquences différentes :
           //   n1 contrôle la répartition globale roche / non-roche.
           //   n2 module l'herbe et révèle des plaques de terre.
           float n1 = texture2D(uNoise, vTerrainWP.xz * 0.025).r;
           float n2 = texture2D(uNoise, vTerrainWP.xz * 0.08 + 0.5).r;
           float alt = clamp(vTerrainWP.y / 1.2, 0.0, 1.0);

           // Roche sur les hauteurs + perturbée par le noise pour des veines.
           float wRock  = smoothstep(0.35, 0.85, alt + n1 * 0.4 - 0.1);
           // Plaques de terre seulement là où il n'y a pas de roche, et que
           // le noise fin est élevé (cluster de plaques).
           float wDirt  = (1.0 - wRock) * smoothstep(0.62, 0.82, n2);
           float wGrass = 1.0 - wRock - wDirt;

           vec3 grass = mix(uGrassDark, uGrassLight, n2);
           vec3 dirt  = texture2D(uDirt, tUV).rgb;
           vec3 rock  = texture2D(uRock, tUV).rgb;

           diffuseColor.rgb = grass * wGrass + dirt * wDirt + rock * wRock;`,
        );
    };

    return mat;
  }, [noise, dirt, rock]);
}
