"use client";

import { useMemo } from "react";
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import { useGLTF } from "@react-three/drei";

// Préchargement au module level : aucun Suspense n'apparaît au premier mount.
// Modèles glTF copiés depuis Kenney Castle Kit / Nature Kit / Mini Dungeon (CC0).
// Crédit à mettre dans le README.
//
// Note : les .glb Castle Kit et Mini Dungeon référencent une texture externe
// (`Textures/colormap.png`) qui n'est pas embarquée — sans elle les modèles
// rendent en blanc. On contourne en overridant le material par un couleur
// PBR flat par modèle (cf. MATERIAL_OVERRIDES). Pas idéal mais zéro asset
// binaire supplémentaire à committer.

const PATHS = {
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
  grass: "/models/nature/grass.glb",
  flowerPurple: "/models/nature/flower_purpleA.glb",
  flowerRed: "/models/nature/flower_redA.glb",
  flowerYellow: "/models/nature/flower_yellowA.glb",
} as const;

Object.values(PATHS).forEach((p) => useGLTF.preload(p));

// Couleurs d'override : palette par modèle pour les .glb sans texture, et
// recoloriages ciblés (foliage des arbres Nature Kit en teal → vert prairie).
// Si la valeur est une string, tous les meshes du glb prennent cette couleur.
// Si c'est un map, on choisit par nom de matériau.
type Override = string | { byMatName: Record<string, string>; default?: string };

const MATERIAL_OVERRIDES: Readonly<Record<string, Override>> = {
  // Mini Dungeon — sans texture, donc on impose une couleur.
  [PATHS.mineSupport]: "#5C3F22",
  [PATHS.mineStructure]: "#5C3F22",
  [PATHS.mineOpening]: "#8B7F70",
  [PATHS.mineRocks]: "#A09080",
  [PATHS.mineBarrel]: "#6E4F2C",

  // Nature Kit — recoloration du feuillage teal Kenney vers du vert naturel.
  // Le nom du matériau « leaves » / « leaf » dans les glb correspond à la
  // canopée ; tout le reste (tronc, etc.) garde sa couleur d'origine.
  [PATHS.treeDefault]: { byMatName: { leaves: "#3F6B3E", leaf: "#3F6B3E" } },
  [PATHS.treeOak]: { byMatName: { leaves: "#4A7044", leaf: "#4A7044" } },
  [PATHS.treeFat]: { byMatName: { leaves: "#456E3F", leaf: "#456E3F" } },
  [PATHS.treePine]: { byMatName: { leaves: "#2F5A35", leaf: "#2F5A35" } },
  [PATHS.treePineRound]: { byMatName: { leaves: "#34603A", leaf: "#34603A" } },
};

function applyOverride(obj: Mesh, override: Override) {
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  const next = mats.map((m) => {
    if (typeof override === "string") {
      return makeStandardMaterial(override);
    }
    const matName = (m && "name" in m && typeof m.name === "string") ? m.name.toLowerCase() : "";
    const hit = Object.entries(override.byMatName).find(
      ([k]) => matName.includes(k.toLowerCase()),
    );
    if (hit) return makeStandardMaterial(hit[1]);
    if (override.default) return makeStandardMaterial(override.default);
    return m;
  });
  obj.material = next.length === 1 ? next[0] : next;
}

function makeStandardMaterial(hex: string): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(hex),
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
  });
}

function useClonedScene(path: string): Object3D {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const clone = scene.clone(true);
    const override = MATERIAL_OVERRIDES[path];
    clone.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (override) applyOverride(obj, override);
      }
    });
    return clone;
  }, [scene, path]);
}

// --- Bâtiments ---
//
// Ferme : chaumière médiévale procédurale. On a abandonné `tower-square.glb`
// de Castle Kit qui sans sa texture ne lit pas comme une ferme — juste un
// parallélépipède neutre. Le pack Kenney qu'on a copié ne contient pas de
// modèle de maison rurale, donc on reconstruit en primitives.
//
// Composition : socle de murs torchis (BoxGeometry), toit de chaume en
// prisme triangulaire (CylinderGeometry 3 segments, axe couché +Z par
// rotation -π/2 autour de X, apex vers le haut), cheminée pierre, porte
// sombre, lucarne sur le pignon.

const FARM_WALL_W = 0.7;
const FARM_WALL_H = 0.32;
const FARM_WALL_D = 0.78;
const FARM_ROOF_R = 0.36;
const FARM_ROOF_LEN = FARM_WALL_D + 0.12;

export function FarmModel() {
  return (
    <group>
      <mesh position={[0, FARM_WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[FARM_WALL_W, FARM_WALL_H, FARM_WALL_D]} />
        <meshStandardMaterial color="#E6D2A8" roughness={0.9} />
      </mesh>

      <mesh
        position={[0, FARM_WALL_H + FARM_ROOF_R / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[FARM_ROOF_R, FARM_ROOF_R, FARM_ROOF_LEN, 3]}
        />
        <meshStandardMaterial color="#7A5836" roughness={0.95} flatShading />
      </mesh>

      <mesh
        position={[0.18, FARM_WALL_H + FARM_ROOF_R * 0.55, -0.2]}
        castShadow
      >
        <boxGeometry args={[0.09, 0.28, 0.09]} />
        <meshStandardMaterial color="#8C8077" roughness={1} />
      </mesh>
      <mesh
        position={[0.18, FARM_WALL_H + FARM_ROOF_R * 0.9, -0.2]}
        castShadow
      >
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#5F564C" roughness={1} />
      </mesh>

      <mesh
        position={[0, 0.12, FARM_WALL_D / 2 + 0.001]}
        castShadow
      >
        <boxGeometry args={[0.16, 0.22, 0.02]} />
        <meshStandardMaterial color="#3D2818" roughness={0.95} />
      </mesh>

      <mesh
        position={[FARM_WALL_W / 2 + 0.001, FARM_WALL_H + FARM_ROOF_R * 0.3, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.01, 12]} />
        <meshStandardMaterial color="#2A2018" roughness={1} />
      </mesh>
    </group>
  );
}

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

// --- Montagnes en arrière-plan ---
//
// On a abandonné les `cliff_*.glb` de Nature Kit : ce sont littéralement des
// cubes vaguement déformés, qui rendent à grande échelle comme des « gigas
// blocs ». Retour à du procédural : cône de pierre + calotte de neige dont
// l'apex coïncide pile avec celui du cône principal. Lit bien comme massif
// montagneux à distance et reste cohérent avec la palette PBR du reste.

export function MountainModel({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const mainH = 2.0 + rng() * 1.3;
  const mainR = 0.95 + rng() * 0.4;
  const hasSecondary = rng() < 0.6;
  const sndAngle = rng() * Math.PI * 2;
  const sndDist = 0.65 + rng() * 0.3;
  const sndH = mainH * (0.55 + rng() * 0.2);
  const sndR = mainR * (0.55 + rng() * 0.2);
  return (
    <>
      <Peak height={mainH} radius={mainR} />
      {hasSecondary ? (
        <Peak
          x={Math.cos(sndAngle) * sndDist}
          z={Math.sin(sndAngle) * sndDist}
          height={sndH}
          radius={sndR}
        />
      ) : null}
    </>
  );
}

function Peak({
  x = 0,
  z = 0,
  height,
  radius,
}: {
  x?: number;
  z?: number;
  height: number;
  radius: number;
}) {
  const snowRatio = 0.42;
  const snowH = height * snowRatio;
  const snowR = radius * snowRatio + 0.04;
  const snowCenterY = height - snowH / 2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius, height, 7]} />
        <meshStandardMaterial color="#5F574A" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, snowCenterY, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, 7]} />
        <meshStandardMaterial color="#EFE4C9" roughness={0.78} flatShading />
      </mesh>
    </group>
  );
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
