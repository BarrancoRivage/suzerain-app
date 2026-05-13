"use client";

import { useMemo } from "react";
import { Mesh, type Object3D } from "three";
import { useGLTF } from "@react-three/drei";

// Préchargement au module level : aucun Suspense n'apparaît au premier mount.
// Tous les .glb sont copiés depuis Kenney Castle Kit / Nature Kit / Tower
// Defense Kit / Mini Dungeon (CC0). Crédit à mettre dans le README.

const PATHS = {
  farmTower: "/models/castle/tower-square.glb",
  mineSupport: "/models/dungeon/wood-support.glb",
  mineStructure: "/models/dungeon/wood-structure.glb",
  mineOpening: "/models/dungeon/wall-opening.glb",
  mineRocks: "/models/dungeon/rocks.glb",
  mineBarrel: "/models/dungeon/barrel.glb",
  treeDefault: "/models/nature/tree_default.glb",
  treeOak: "/models/nature/tree_oak.glb",
  treeFat: "/models/nature/tree_fat.glb",
  treePine: "/models/nature/tree_pineDefaultA.glb",
  treePineRound: "/models/nature/tree_pineRoundA.glb",
  rockSmallA: "/models/nature/rock_smallA.glb",
  rockSmallB: "/models/nature/rock_smallB.glb",
  rockSmallC: "/models/nature/rock_smallC.glb",
  rockLargeA: "/models/nature/rock_largeA.glb",
  rockLargeB: "/models/nature/rock_largeB.glb",
  rockLargeC: "/models/nature/rock_largeC.glb",
  cliffLarge: "/models/nature/cliff_large_rock.glb",
  cliffBlock: "/models/nature/cliff_block_rock.glb",
  cliffSlope: "/models/nature/cliff_blockSlope_rock.glb",
  grass: "/models/nature/grass.glb",
  flowerPurple: "/models/nature/flower_purpleA.glb",
  flowerRed: "/models/nature/flower_redA.glb",
  flowerYellow: "/models/nature/flower_yellowA.glb",
} as const;

Object.values(PATHS).forEach((p) => useGLTF.preload(p));

// Clone profond + activation des shadows en une passe. À mémoiser par instance
// pour éviter de cloner à chaque frame.
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

// --- Bâtiments ---

const FARM_SCALE = 0.32;

export function FarmModel() {
  const scene = useClonedScene(PATHS.farmTower);
  return <primitive object={scene} scale={FARM_SCALE} />;
}

// La mine est composée : 2 poteaux + linteau + ouverture + tas de rochers + tonneau.
const MINE_SCALE = 0.28;

export function MineModel() {
  const support1 = useClonedScene(PATHS.mineSupport);
  const support2 = useClonedScene(PATHS.mineSupport);
  const structure = useClonedScene(PATHS.mineStructure);
  const opening = useClonedScene(PATHS.mineOpening);
  const rocks = useClonedScene(PATHS.mineRocks);
  const barrel = useClonedScene(PATHS.mineBarrel);
  return (
    <group scale={MINE_SCALE}>
      <primitive object={opening} position={[0, 0, 0]} />
      <primitive object={support1} position={[-0.45, 0, 0.3]} />
      <primitive object={support2} position={[0.45, 0, 0.3]} />
      <primitive object={structure} position={[0, 0.95, 0.3]} />
      <primitive object={rocks} position={[1.2, 0, 0.6]} />
      <primitive object={barrel} position={[-1.1, 0, 0.5]} scale={0.7} />
    </group>
  );
}

// --- Végétation ---

const TREE_BIOME_PATHS = [
  PATHS.treeDefault,
  PATHS.treeOak,
  PATHS.treeFat,
] as const;

const TREE_DECOR_PATHS = [
  PATHS.treeDefault,
  PATHS.treeOak,
  PATHS.treeFat,
  PATHS.treePine,
  PATHS.treePineRound,
] as const;

const TREE_SCALE_BIOME = 0.15;
const TREE_SCALE_DECOR = 0.28;

export function TreeModel({ seed, decor = false }: { seed: number; decor?: boolean }) {
  const list = decor ? TREE_DECOR_PATHS : TREE_BIOME_PATHS;
  const path = list[Math.abs(seed) % list.length];
  const scene = useClonedScene(path);
  return (
    <primitive
      object={scene}
      scale={decor ? TREE_SCALE_DECOR : TREE_SCALE_BIOME}
    />
  );
}

const FLOWER_PATHS = [
  PATHS.flowerPurple,
  PATHS.flowerRed,
  PATHS.flowerYellow,
] as const;

const PLAIN_DECOR_SCALE = 0.5;

export function PlainTuftModel({ seed }: { seed: number }) {
  const useFlower = (Math.abs(seed) % 3) > 0;
  const path = useFlower
    ? FLOWER_PATHS[Math.abs(seed) % FLOWER_PATHS.length]
    : PATHS.grass;
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={PLAIN_DECOR_SCALE} />;
}

// --- Roches ---

const ROCK_SMALL_PATHS = [
  PATHS.rockSmallA,
  PATHS.rockSmallB,
  PATHS.rockSmallC,
] as const;

const ROCK_LARGE_PATHS = [
  PATHS.rockLargeA,
  PATHS.rockLargeB,
  PATHS.rockLargeC,
] as const;

const ROCK_SMALL_SCALE = 0.25;
const ROCK_LARGE_SCALE = 0.45;

export function RockModel({ seed }: { seed: number }) {
  const path = ROCK_SMALL_PATHS[Math.abs(seed) % ROCK_SMALL_PATHS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={ROCK_SMALL_SCALE} />;
}

export function BigRockModel({ seed }: { seed: number }) {
  const path = ROCK_LARGE_PATHS[Math.abs(seed) % ROCK_LARGE_PATHS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={ROCK_LARGE_SCALE} />;
}

// --- Terrain de fond (toile autour du disque jouable) ---

const MOUNTAIN_SCALE = 0.85;

export function MountainModel({ seed }: { seed: number }) {
  // Les cliffs Kenney font office de massifs ; rotation aléatoire pour varier.
  const paths = [PATHS.cliffLarge, PATHS.cliffBlock, PATHS.cliffSlope];
  const path = paths[Math.abs(seed) % paths.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={MOUNTAIN_SCALE} />;
}
