"use client";

import { useMemo } from "react";
import { Mesh, type Object3D } from "three";
import { useGLTF } from "@react-three/drei";

// KayKit Medieval Hexagon Pack (CC0, Kay Lousberg). Tous les modèles partagent
// un atlas unique `hexagons_medieval.png` chargé via URI relative dans les
// .gltf. Le pack est calibré en pointy-top hex avec vertex distance 2/√3 ;
// on scale tout par √3/2 ≈ 0.866 pour matcher notre HEX_SIZE = 1.

const KAYKIT_SCALE = Math.sqrt(3) / 2;

const PATHS = {
  // Tiles (chunk hexagonal avec dirt sides et top texturé)
  hexGrass: "/models/kaykit/tiles/hex_grass.gltf",
  hexGrassSlopedLow: "/models/kaykit/tiles/hex_grass_sloped_low.gltf",
  hexGrassSlopedHigh: "/models/kaykit/tiles/hex_grass_sloped_high.gltf",
  hexWater: "/models/kaykit/tiles/hex_water.gltf",
  hexRiverA: "/models/kaykit/tiles/hex_river_A.gltf",
  hexRiverB: "/models/kaykit/tiles/hex_river_B.gltf",
  hexRiverC: "/models/kaykit/tiles/hex_river_C.gltf",
  hexRoadA: "/models/kaykit/tiles/hex_road_A.gltf",
  hexRoadB: "/models/kaykit/tiles/hex_road_B.gltf",
  hexRoadC: "/models/kaykit/tiles/hex_road_C.gltf",

  // Buildings (faction rouge — cohérent avec la palette `blood` Suzerain)
  homeA: "/models/kaykit/buildings_red/building_home_A_red.gltf",
  homeB: "/models/kaykit/buildings_red/building_home_B_red.gltf",
  mine: "/models/kaykit/buildings_red/building_mine_red.gltf",

  // Décors qui se posent SUR une tuile hex_grass (Y commence à 0)
  forestSmall: "/models/kaykit/nature/trees_A_small.gltf",
  forestMedium: "/models/kaykit/nature/trees_A_medium.gltf",
  forestLarge: "/models/kaykit/nature/trees_A_large.gltf",
  hillsA: "/models/kaykit/nature/hills_A.gltf",
  hillsATrees: "/models/kaykit/nature/hills_A_trees.gltf",
  hillsB: "/models/kaykit/nature/hills_B.gltf",
  hillsBTrees: "/models/kaykit/nature/hills_B_trees.gltf",
  hillsC: "/models/kaykit/nature/hills_C.gltf",
  hillsCTrees: "/models/kaykit/nature/hills_C_trees.gltf",

  // Décors aquatiques (posés sur les tuiles water)
  waterlilyA: "/models/kaykit/nature/waterlily_A.gltf",
  waterlilyB: "/models/kaykit/nature/waterlily_B.gltf",
  waterplantA: "/models/kaykit/nature/waterplant_A.gltf",

  // Décors standalone (placés sur le sol périphérique, hors hex grid)
  treeSingleA: "/models/kaykit/nature/tree_single_A.gltf",
  hillSingleA: "/models/kaykit/nature/hill_single_A.gltf",
  rockSingleB: "/models/kaykit/nature/rock_single_B.gltf",
  rockSingleC: "/models/kaykit/nature/rock_single_C.gltf",
  rockSingleD: "/models/kaykit/nature/rock_single_D.gltf",
  hillSingleB: "/models/kaykit/nature/hill_single_B.gltf",
  hillSingleC: "/models/kaykit/nature/hill_single_C.gltf",

  // Montagnes (footprint hex, posées sur le sol périphérique). Variantes
  // « _grass_trees » = montagne avec versants boisés ; « _grass » = montagne
  // partiellement enherbée ; pas de suffixe = montagne pure rocher.
  mountainA: "/models/kaykit/nature/mountain_A.gltf",
  mountainAGrass: "/models/kaykit/nature/mountain_A_grass.gltf",
  mountainAGrassTrees: "/models/kaykit/nature/mountain_A_grass_trees.gltf",
  mountainB: "/models/kaykit/nature/mountain_B.gltf",
  mountainBGrass: "/models/kaykit/nature/mountain_B_grass.gltf",
  mountainBGrassTrees: "/models/kaykit/nature/mountain_B_grass_trees.gltf",
  mountainC: "/models/kaykit/nature/mountain_C.gltf",
  mountainCGrass: "/models/kaykit/nature/mountain_C_grass.gltf",
  mountainCGrassTrees: "/models/kaykit/nature/mountain_C_grass_trees.gltf",
} as const;

Object.values(PATHS).forEach((p) => useGLTF.preload(p));

function useClonedScene(path: string): Object3D {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);
}

function KayKit({ path, scale = 1 }: { path: string; scale?: number }) {
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={KAYKIT_SCALE * scale} />;
}

// --- Tuile de base : chunk hex avec grass top + dirt sides. ---

export function HexGrassTile() {
  return <KayKit path={PATHS.hexGrass} />;
}

// Tuile d'eau : le modèle KayKit a son top à Y=-0.2 (avant scale), soit
// -0.173 après scale 0.866 → la surface se retrouve sous le ground plane
// (Y=-0.05) et la tuile est invisible. On la remonte de 0.173 pour que la
// surface d'eau coïncide avec le top des tuiles grass (Y=0 dans le repère
// du group HexTile).
const HEX_WATER_RAISE = 0.173;

export function HexWaterTile() {
  return (
    <group position={[0, HEX_WATER_RAISE, 0]}>
      <KayKit path={PATHS.hexWater} />
    </group>
  );
}

// Choix de la variante KayKit (A=droite, B=60°, C=120°) et de la rotation Y
// selon les arêtes d'entrée/sortie du chemin. Convention :
//   - HEX_DIRECTIONS[i] donne le vecteur axial vers le voisin par l'arête i,
//     à l'angle world = i * 60° (CCW depuis +X)
//   - Default A : in=3 out=0 → axis +X. Rotation `inEdge * 60°` aligne in→inEdge.
//   - Default B (60° courbe CCW) : in=0 out=1. Rotation `inEdge * 60°`.
//   - Default C (120° courbe CCW) : in=0 out=2. Rotation `inEdge * 60°`.
//   - Pour une courbe CW (diff = -1 mod 6 = 5, ou -2 mod 6 = 4), on inverse
//     in et out — la courbe est symétrique en termes de flux visuel.
//
// Si l'orientation par défaut de KayKit diffère (e.g. A naturel sur axis Z),
// il suffira d'ajouter un offset constant par variante.

const HEX_60 = Math.PI / 3;

type Variant = "A" | "B" | "C";

function classifyPath(
  inEdge: number,
  outEdge: number,
): { variant: Variant; rotation: number } {
  const diff = ((outEdge - inEdge) % 6 + 6) % 6;
  switch (diff) {
    case 3:
      return { variant: "A", rotation: inEdge * HEX_60 };
    case 1:
      return { variant: "B", rotation: inEdge * HEX_60 };
    case 5: // courbe miroir : swap in/out
      return { variant: "B", rotation: outEdge * HEX_60 };
    case 2:
      return { variant: "C", rotation: inEdge * HEX_60 };
    case 4:
      return { variant: "C", rotation: outEdge * HEX_60 };
    default:
      // diff = 0 ne devrait pas arriver (in === out) ; on retombe sur A.
      return { variant: "A", rotation: 0 };
  }
}

const RIVER_VARIANT_PATH: Record<Variant, string> = {
  A: PATHS.hexRiverA,
  B: PATHS.hexRiverB,
  C: PATHS.hexRiverC,
};

const ROAD_VARIANT_PATH: Record<Variant, string> = {
  A: PATHS.hexRoadA,
  B: PATHS.hexRoadB,
  C: PATHS.hexRoadC,
};

type PathProps = { inEdge: number; outEdge: number };

export function HexRiverTile({ inEdge, outEdge }: PathProps) {
  const { variant, rotation } = classifyPath(inEdge, outEdge);
  return (
    <group rotation={[0, rotation, 0]}>
      <KayKit path={RIVER_VARIANT_PATH[variant]} />
    </group>
  );
}

export function HexRoadTile({ inEdge, outEdge }: PathProps) {
  const { variant, rotation } = classifyPath(inEdge, outEdge);
  return (
    <group rotation={[0, rotation, 0]}>
      <KayKit path={ROAD_VARIANT_PATH[variant]} />
    </group>
  );
}

// --- Décors de biome (posés SUR la tuile hex_grass). ---

const FOREST_TILE_PATHS = [
  PATHS.forestSmall,
  PATHS.forestSmall,
  PATHS.forestMedium,
] as const;

export function ForestDecor({ seed }: { seed: number }) {
  const path = FOREST_TILE_PATHS[Math.abs(seed) % FOREST_TILE_PATHS.length];
  return <KayKit path={path} />;
}

// Décor de colline posé SUR une tuile hex_grass (pas de tuile sloped).
// Rotation sur 6 variantes (A/B/C + `_trees`) pour visibilité.
const HILLS_PATHS = [
  PATHS.hillsA,
  PATHS.hillsATrees,
  PATHS.hillsB,
  PATHS.hillsBTrees,
  PATHS.hillsC,
  PATHS.hillsCTrees,
] as const;

export function HillsDecor({ seed }: { seed: number }) {
  const path = HILLS_PATHS[Math.abs(seed) % HILLS_PATHS.length];
  return <KayKit path={path} />;
}

// Décor optionnel posé sur une tuile water (nénuphars, roseaux). Probabilité
// faible — pas toutes les tuiles d'eau ont du décor.
const WATER_DECOR_PATHS = [
  PATHS.waterlilyA,
  PATHS.waterlilyB,
  PATHS.waterplantA,
] as const;

export function WaterDecor({ seed }: { seed: number }) {
  const path = WATER_DECOR_PATHS[Math.abs(seed) % WATER_DECOR_PATHS.length];
  return <KayKit path={path} />;
}

// --- Bâtiments. ---

export function FarmModel({ seed }: { seed: number }) {
  const path = Math.abs(seed) % 2 === 0 ? PATHS.homeA : PATHS.homeB;
  return <KayKit path={path} />;
}

export function MineModel() {
  return <KayKit path={PATHS.mine} />;
}

// --- Décors standalone (sol périphérique, pas sur tuile hex). ---

export function StandaloneTree() {
  return <KayKit path={PATHS.treeSingleA} />;
}

const ROCK_PATHS = [
  PATHS.rockSingleB,
  PATHS.rockSingleC,
  PATHS.rockSingleD,
] as const;

export function StandaloneRock({ seed }: { seed: number }) {
  const path = ROCK_PATHS[Math.abs(seed) % ROCK_PATHS.length];
  return <KayKit path={path} />;
}

const HILL_SINGLE_PATHS = [PATHS.hillSingleB, PATHS.hillSingleC] as const;

export function StandaloneHill({ seed }: { seed: number }) {
  const path = HILL_SINGLE_PATHS[Math.abs(seed) % HILL_SINGLE_PATHS.length];
  return <KayKit path={path} />;
}

const MOUNTAIN_PATHS = [
  PATHS.mountainA,
  PATHS.mountainAGrass,
  PATHS.mountainAGrassTrees,
  PATHS.mountainB,
  PATHS.mountainBGrass,
  PATHS.mountainBGrassTrees,
  PATHS.mountainC,
  PATHS.mountainCGrass,
  PATHS.mountainCGrassTrees,
] as const;

export function StandaloneMountain({ seed }: { seed: number }) {
  const path = MOUNTAIN_PATHS[Math.abs(seed) % MOUNTAIN_PATHS.length];
  return <KayKit path={path} />;
}
