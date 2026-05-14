"use client";

import { useEffect, useMemo } from "react";
import {
  Mesh,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Object3D,
} from "three";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";

import { mulberry32 } from "@/lib/game/rng";

// 100 % Quaternius (CC0). KayKit complètement retiré.
//
// Stylized Nature MegaKit fournit la végétation et les rochers ;
// Medieval Village MegaKit fournit les modules de bâtiments (composés
// à la volée pour chaque ferme / mine) ; Poly Haven `aerial_grass_rock`
// fournit la texture PBR du dessus des tuiles d'herbe.

// (TEX_GRASS_DIFF était utilisé par l'ancien HexGrassTile — la mesh
// terrain continue dans Terrain.tsx charge sa propre instance via
// useLoader. Plus de référence ici.)

const NATURE = "/assets/stylized-nature/glTF";
const VILLAGE = "/assets/medieval-village/glTF";

// --- Chemins glTF ---

const COMMON_TREES = [1, 2, 3, 4, 5].map(
  (n) => `${NATURE}/CommonTree_${n}.gltf`,
);
const PINE_TREES = [1, 2, 3, 4, 5].map((n) => `${NATURE}/Pine_${n}.gltf`);
const DEAD_TREES = [1, 2, 3, 4, 5].map((n) => `${NATURE}/DeadTree_${n}.gltf`);
const TWISTED_TREES = [1, 2, 3, 4, 5].map(
  (n) => `${NATURE}/TwistedTree_${n}.gltf`,
);
const ROCKS = [1, 2, 3].map((n) => `${NATURE}/Rock_Medium_${n}.gltf`);
const BUSHES = [
  `${NATURE}/Bush_Common.gltf`,
  `${NATURE}/Bush_Common_Flowers.gltf`,
];

// Textures PBR Quaternius Medieval Village (utilisées sur les bâtiments
// procéduraux ci-dessous, pas en glTF — on a essayé de composer les modules
// Wall/Floor/Roof à la main et le résultat était cassé visuellement parce
// que ce kit a un ancrage modulaire qui nécessite un éditeur 3D pour
// positionner sans bug. On reste sur des BoxGeometry / ConeGeometry simples
// avec les textures PBR appliquées par-dessus).
const TEX_PLASTER_BASE = `${VILLAGE.replace("/glTF", "/Textures")}/T_Plaster_BaseColor.png`;
const TEX_PLASTER_NORMAL = `${VILLAGE.replace("/glTF", "/Textures")}/T_Plaster_Normal.png`;
const TEX_TILES_BASE = `${VILLAGE.replace("/glTF", "/Textures")}/T_RoundTiles_BaseColor.png`;
const TEX_TILES_NORMAL = `${VILLAGE.replace("/glTF", "/Textures")}/T_RoundTiles_Normal.png`;
const TEX_ROCK_BASE = `${VILLAGE.replace("/glTF", "/Textures")}/T_RockTrim_BaseColor.png`;
const TEX_ROCK_NORMAL = `${VILLAGE.replace("/glTF", "/Textures")}/T_RockTrim_Normal.png`;
const TEX_WOOD_BASE = `${VILLAGE.replace("/glTF", "/Textures")}/T_WoodTrim_BaseColor.png`;
const TEX_WOOD_NORMAL = `${VILLAGE.replace("/glTF", "/Textures")}/T_WoodTrim_Normal.png`;

// Preload glTF (décor uniquement — les bâtiments n'utilisent pas les modules).
const PRELOAD = [
  ...COMMON_TREES,
  ...PINE_TREES,
  ...DEAD_TREES,
  ...TWISTED_TREES,
  ...ROCKS,
  ...BUSHES,
];
for (const p of PRELOAD) useGLTF.preload(p);

// --- Helpers ---

// Clone profond + activation des shadows en une passe. À mémoiser par
// instance pour ne pas re-cloner à chaque frame.
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

// --- Décor de biome (sur tuile jouable) ---
// Les anciens composants HexGrassTile / HexWaterTile / HexRiverTile /
// HexRoadTile ont été supprimés : la mesh de terrain est maintenant
// continue (cf. Terrain.tsx) et les lacs sont rendus par WaterTiles.tsx.

const FOREST_TREE_PATHS = [...COMMON_TREES, ...PINE_TREES] as const;
const FOREST_TREE_SCALE = 0.18;

export function ForestDecor({ seed }: { seed: number }) {
  const path = FOREST_TREE_PATHS[Math.abs(seed) % FOREST_TREE_PATHS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={FOREST_TREE_SCALE} />;
}

const HILLS_ROCK_SCALE = 0.22;

export function HillsDecor({ seed }: { seed: number }) {
  const path = ROCKS[Math.abs(seed) % ROCKS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={HILLS_ROCK_SCALE} />;
}

// --- Bâtiments (procédural + textures PBR Medieval Village) ---
//
// Pourquoi pas la compose modulaire glTF : les modules MegaKit (Wall/Floor/
// Roof) ont des ancrages spécifiques qui demandent un éditeur 3D pour
// positionner sans gaps / sans murs inversés. On reste donc sur des
// primitives géométriques (Box, Cone) sur lesquelles on plaque les
// textures PBR du pack. Visuel cohérent, positionnement maîtrisé,
// ferme et mine clairement distinctes.

// Hook qui charge les 8 textures PBR utilisées par les deux bâtiments,
// les configure (wrap, color space, repeat) une seule fois, et renvoie
// l'objet partagé. useLoader cache les textures par URL — un seul fetch
// même si le hook est appelé depuis plusieurs composants.
function useBuildingTextures() {
  const [
    plasterBase, plasterNormal,
    tilesBase, tilesNormal,
    rockBase, rockNormal,
    woodBase, woodNormal,
  ] = useLoader(TextureLoader, [
    TEX_PLASTER_BASE, TEX_PLASTER_NORMAL,
    TEX_TILES_BASE, TEX_TILES_NORMAL,
    TEX_ROCK_BASE, TEX_ROCK_NORMAL,
    TEX_WOOD_BASE, TEX_WOOD_NORMAL,
  ]);

  useEffect(() => {
    const colorMaps = [plasterBase, tilesBase, rockBase, woodBase];
    const normalMaps = [plasterNormal, tilesNormal, rockNormal, woodNormal];
    for (const t of colorMaps) {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
    }
    for (const t of normalMaps) {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.colorSpace = NoColorSpace;
    }
    // Tuiles serrées sur le toit, plâtre moins répété sur les murs.
    plasterBase.repeat.set(1.5, 1);
    plasterNormal.repeat.set(1.5, 1);
    tilesBase.repeat.set(0.8, 0.8);
    tilesNormal.repeat.set(0.8, 0.8);
    rockBase.repeat.set(1, 1);
    rockNormal.repeat.set(1, 1);
  }, [plasterBase, plasterNormal, tilesBase, tilesNormal, rockBase, rockNormal, woodBase, woodNormal]);

  return { plasterBase, plasterNormal, tilesBase, tilesNormal, rockBase, rockNormal, woodBase, woodNormal };
}

// FERME : chaumière compacte avec murs en plâtre, toit pyramidal en tuiles
// rondes terracotta, porte en bois sur la façade avant, petite cheminée
// pierre.
function Cottage() {
  const { plasterBase, plasterNormal, tilesBase, tilesNormal, woodBase, rockBase, rockNormal } =
    useBuildingTextures();

  const WALL_W = 0.85;
  const WALL_D = 0.7;
  const WALL_H = 0.55;
  const ROOF_R = 0.65;
  const ROOF_H = 0.4;

  return (
    <group>
      {/* Murs (1 box, le plâtre PBR habille les 4 faces) */}
      <mesh position={[0, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_W, WALL_H, WALL_D]} />
        <meshStandardMaterial
          map={plasterBase}
          normalMap={plasterNormal}
          roughness={0.92}
        />
      </mesh>

      {/* Toit pyramidal (cone 4 segments) — rotation 45° pour qu'une arête
          regarde la façade frontale */}
      <mesh
        position={[0, WALL_H + ROOF_H / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      >
        <coneGeometry args={[ROOF_R, ROOF_H, 4]} />
        <meshStandardMaterial
          map={tilesBase}
          normalMap={tilesNormal}
          roughness={0.82}
        />
      </mesh>

      {/* Porte centrée sur la façade +Z, bois sombre */}
      <mesh
        position={[0, 0.18, WALL_D / 2 + 0.001]}
        castShadow
      >
        <boxGeometry args={[0.2, 0.32, 0.02]} />
        <meshStandardMaterial map={woodBase} roughness={0.95} color="#5C3D1F" />
      </mesh>

      {/* Cheminée pierre sur le toit, côté arrière */}
      <mesh position={[0.22, WALL_H + ROOF_H + 0.05, -0.15]} castShadow>
        <boxGeometry args={[0.1, 0.22, 0.1]} />
        <meshStandardMaterial
          map={rockBase}
          normalMap={rockNormal}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}

// MINE : galerie creusée dans un monticule de pierre. Pas une maison —
// visuellement très différente de la ferme. Cône rocheux + entrée sombre
// encadrée de poutres en bois + petit tas de minerai doré devant.
function MineEntrance() {
  const { rockBase, rockNormal, woodBase, woodNormal } = useBuildingTextures();

  return (
    <group>
      {/* Monticule de pierre */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.7, 0.9, 8]} />
        <meshStandardMaterial
          map={rockBase}
          normalMap={rockNormal}
          roughness={1}
          flatShading
        />
      </mesh>

      {/* Entrée sombre (face +Z) */}
      <mesh position={[0, 0.2, 0.42]} castShadow>
        <boxGeometry args={[0.32, 0.4, 0.08]} />
        <meshStandardMaterial color="#080604" roughness={1} />
      </mesh>

      {/* Cadre bois : 2 poteaux + linteau */}
      <mesh position={[-0.18, 0.2, 0.45]} castShadow>
        <boxGeometry args={[0.06, 0.42, 0.06]} />
        <meshStandardMaterial
          map={woodBase}
          normalMap={woodNormal}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[0.18, 0.2, 0.45]} castShadow>
        <boxGeometry args={[0.06, 0.42, 0.06]} />
        <meshStandardMaterial
          map={woodBase}
          normalMap={woodNormal}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[0, 0.41, 0.45]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.07]} />
        <meshStandardMaterial
          map={woodBase}
          normalMap={woodNormal}
          roughness={0.95}
        />
      </mesh>

      {/* Petit tas de minerai doré devant l'entrée */}
      <mesh position={[0.3, 0.05, 0.45]} castShadow>
        <dodecahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial
          color="#A88A3C"
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0.25, 0.06, 0.55]} castShadow>
        <dodecahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial
          color="#947A33"
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

export function FarmModel(_props: { seed: number }) {
  return <Cottage />;
}

export function MineModel() {
  return <MineEntrance />;
}

// --- Décor périphérique (hors disque jouable) ---

// On évite DeadTree ET TwistedTree dans le pool standalone : leurs
// feuillages tirent vers le rouge / orange et donnent une carte trop
// automnale. Seuls CommonTree et Pine = vert franc, cohérent.
const STANDALONE_TREE_PATHS = [
  ...COMMON_TREES,
  ...PINE_TREES,
] as const;
const STANDALONE_TREE_SCALE = 0.22;

export function StandaloneTree({ seed = 0 }: { seed?: number } = {}) {
  const path =
    STANDALONE_TREE_PATHS[Math.abs(seed) % STANDALONE_TREE_PATHS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={STANDALONE_TREE_SCALE} />;
}

export function StandaloneRock({ seed }: { seed: number }) {
  const path = ROCKS[Math.abs(seed) % ROCKS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={0.3} />;
}

const BUSH_PATHS = BUSHES;

export function StandaloneHill({ seed }: { seed: number }) {
  // Stylized Nature n'a pas de "hill" autonome. On utilise un bush
  // (touffe végétale) — ça lit comme un bosquet sur la prairie.
  const path = BUSH_PATHS[Math.abs(seed) % BUSH_PATHS.length];
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={0.45} />;
}

// Stylized Nature ne contient pas de montagne. On reste sur du procédural :
// cône pierreux + calotte neigeuse, déterministe par seed.
export function StandaloneMountain({ seed }: { seed: number }) {
  const rng = mulberry32(seed);
  const h = 2.0 + rng() * 1.5;
  const r = 0.9 + rng() * 0.4;
  const snowH = h * 0.4;
  const snowR = r * 0.42 + 0.05;
  const snowCenterY = h - snowH / 2;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[r, h, 7]} />
        <meshStandardMaterial color="#6E6354" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, snowCenterY, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, 7]} />
        <meshStandardMaterial color="#EFE4C9" roughness={0.78} flatShading />
      </mesh>
    </group>
  );
}
