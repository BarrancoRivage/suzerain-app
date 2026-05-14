"use client";

import { useEffect, useMemo } from "react";
import {
  DoubleSide,
  Mesh,
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

const NATURE = "/assets/stylized-nature/glTF";
const VILLAGE = "/assets/medieval-village/glTF";
const TEX_GRASS_DIFF =
  "/assets/textures/aerial-grass-rock/aerial_grass_rock_diff_4k.jpg";

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

const WALL_STRAIGHT = `${VILLAGE}/Wall_Plaster_Straight.gltf`;
const WALL_DOOR = `${VILLAGE}/Wall_Plaster_Door_Flat.gltf`;
const FLOOR = `${VILLAGE}/Floor_Brick.gltf`;
const ROOF = `${VILLAGE}/Roof_Dormer_RoundTile.gltf`;
const CHIMNEY = `${VILLAGE}/Prop_Chimney.gltf`;

// Preload : tous les modules au module-level pour éviter les Suspense
// flashs au premier mount de chaque tuile.
const PRELOAD = [
  ...COMMON_TREES,
  ...PINE_TREES,
  ...DEAD_TREES,
  ...TWISTED_TREES,
  ...ROCKS,
  ...BUSHES,
  WALL_STRAIGHT,
  WALL_DOOR,
  FLOOR,
  ROOF,
  CHIMNEY,
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

function useGrassTexture() {
  const tex = useLoader(TextureLoader, TEX_GRASS_DIFF);
  useEffect(() => {
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    // ~1 répétition tous les ~2.5 m, donne du grain sans visibilité des joints.
    tex.repeat.set(0.4, 0.4);
    tex.colorSpace = SRGBColorSpace;
  }, [tex]);
  return tex;
}

// --- Tuiles hex procédurales ---
//
// On a abandonné les .glb KayKit. Chaque tuile = un prisme hexagonal très
// fin construit avec CylinderGeometry(R, R, h, 6). Le dessus utilise la
// texture grass PBR Poly Haven, les flancs un brun terreux uni. Top à Y=0
// dans le repère de la tuile — le décor / les bâtiments s'empilent dessus.

const TILE_HEIGHT = 0.5;
const DIRT_SIDE_COLOR = "#8C6F4A";
const WATER_TOP_COLOR = "#4A8AB8";
const WATER_DROP = 0.08; // surface d'eau légèrement enfoncée vs grass top

export function HexGrassTile() {
  const grass = useGrassTexture();
  return (
    <group>
      <mesh position={[0, -TILE_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1, 1, TILE_HEIGHT, 6, 1, true]} />
        <meshStandardMaterial
          color={DIRT_SIDE_COLOR}
          roughness={1}
          side={DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[1, 6]} />
        <meshStandardMaterial map={grass} roughness={0.92} />
      </mesh>
    </group>
  );
}

export function HexWaterTile() {
  return (
    <group>
      <mesh position={[0, -TILE_HEIGHT / 2, 0]} receiveShadow>
        <cylinderGeometry args={[1, 1, TILE_HEIGHT, 6, 1, true]} />
        <meshStandardMaterial
          color={DIRT_SIDE_COLOR}
          roughness={1}
          side={DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, -WATER_DROP, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[1, 6]} />
        <meshStandardMaterial
          color={WATER_TOP_COLOR}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

// V1 : rivières et routes rendues comme les tuiles de base. Les données
// d'orientation (inEdge, outEdge) restent en state — V2 ajoutera des
// shaders pour dessiner le tracé du cours d'eau et du chemin.
type PathProps = { inEdge: number; outEdge: number };

export function HexRiverTile(_props: PathProps) {
  return <HexWaterTile />;
}

export function HexRoadTile(_props: PathProps) {
  return <HexGrassTile />;
}

// --- Décor de biome (sur tuile jouable) ---

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

// Stylized Nature n'a pas de nénuphar. On retombe sur null — la tuile d'eau
// reste nue (juste la surface bleue, sans décor). V2 pourra ajouter de la
// végétation aquatique procédurale ou un autre pack.
export function WaterDecor(_props: { seed: number }) {
  return null;
}

// --- Bâtiments (composés à partir de Medieval Village MegaKit) ---
//
// Cottage 2×2 mètres natifs : sol carrelé + 4 murs en plâtre+colombages
// (un côté avec porte) + toit dormer en tuiles rondes. Les modules sont
// calibrés pour s'emboîter ; les offsets `±0.91` placent les murs aux
// arêtes du sol 2×2.

const COTTAGE_WALL_OFFSET = 0.91;
const COTTAGE_ROOF_Y = 3.46; // bas du toit aligné sur le haut des murs (Y=3.12)
const COTTAGE_SCALE = 0.3;

function Cottage() {
  const floor = useClonedScene(FLOOR);
  const wallS = useClonedScene(WALL_DOOR);
  const wallN = useClonedScene(WALL_STRAIGHT);
  const wallE = useClonedScene(WALL_STRAIGHT);
  const wallW = useClonedScene(WALL_STRAIGHT);
  const roof = useClonedScene(ROOF);

  return (
    <group scale={COTTAGE_SCALE}>
      <primitive object={floor} />
      <primitive
        object={wallS}
        position={[0, 0, COTTAGE_WALL_OFFSET]}
      />
      <primitive
        object={wallN}
        position={[0, 0, -COTTAGE_WALL_OFFSET]}
        rotation={[0, Math.PI, 0]}
      />
      <primitive
        object={wallE}
        position={[COTTAGE_WALL_OFFSET, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <primitive
        object={wallW}
        position={[-COTTAGE_WALL_OFFSET, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <primitive object={roof} position={[0, COTTAGE_ROOF_Y, 0]} />
    </group>
  );
}

function Workshop() {
  const floor = useClonedScene(FLOOR);
  const wallS = useClonedScene(WALL_DOOR);
  const wallN = useClonedScene(WALL_STRAIGHT);
  const wallE = useClonedScene(WALL_STRAIGHT);
  const wallW = useClonedScene(WALL_STRAIGHT);
  const roof = useClonedScene(ROOF);
  const chimney = useClonedScene(CHIMNEY);

  return (
    <group scale={COTTAGE_SCALE}>
      <primitive object={floor} />
      <primitive
        object={wallS}
        position={[0, 0, COTTAGE_WALL_OFFSET]}
      />
      <primitive
        object={wallN}
        position={[0, 0, -COTTAGE_WALL_OFFSET]}
        rotation={[0, Math.PI, 0]}
      />
      <primitive
        object={wallE}
        position={[COTTAGE_WALL_OFFSET, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <primitive
        object={wallW}
        position={[-COTTAGE_WALL_OFFSET, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <primitive object={roof} position={[0, COTTAGE_ROOF_Y, 0]} />
      <primitive object={chimney} position={[0.45, 0, -0.3]} />
    </group>
  );
}

export function FarmModel(_props: { seed: number }) {
  return <Cottage />;
}

export function MineModel() {
  return <Workshop />;
}

// --- Décor périphérique (hors disque jouable) ---

const STANDALONE_TREE_PATHS = [
  ...COMMON_TREES,
  ...DEAD_TREES,
  ...TWISTED_TREES,
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
