"use client";

import { useMemo } from "react";
import { Mesh, type Object3D } from "three";
import { useGLTF } from "@react-three/drei";

// KayKit Medieval Hexagon Pack (CC0, Kay Lousberg). On ne garde ici que les
// modèles effectivement rendus par le gameplay actuel.

const KAYKIT_SCALE = Math.sqrt(3) / 2;

const PATHS = {
  homeA: "/models/kaykit/buildings_red/building_home_A_red.gltf",
  homeB: "/models/kaykit/buildings_red/building_home_B_red.gltf",
  mine: "/models/kaykit/buildings_red/building_mine_red.gltf",
  lumbermill: "/models/kaykit/buildings_red/building_lumbermill_red.gltf",
  // Pas d'asset « carrière » dans le pack KayKit : on réutilise blacksmith
  // (forge) — silhouette robuste en pierre, lecture cohérente avec extraction.
  blacksmith: "/models/kaykit/buildings_red/building_blacksmith_red.gltf",
  // Hôtel de ville : on prend le château, silhouette imposante cohérente avec
  // un bâtiment civique unique.
  castle: "/models/kaykit/buildings_red/building_castle_red.gltf",
} as const;

Object.values(PATHS).forEach((path) => useGLTF.preload(path));

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

function KayKit({ path }: { path: string }) {
  const scene = useClonedScene(path);
  return <primitive object={scene} scale={KAYKIT_SCALE} />;
}

export function FarmModel({ seed }: { seed: number }) {
  const path = Math.abs(seed) % 2 === 0 ? PATHS.homeA : PATHS.homeB;
  return <KayKit path={path} />;
}

export function MineModel() {
  return <KayKit path={PATHS.mine} />;
}

export function LumberjackModel() {
  return <KayKit path={PATHS.lumbermill} />;
}

export function HouseModel() {
  return <KayKit path={PATHS.homeA} />;
}

export function QuarryModel() {
  return <KayKit path={PATHS.blacksmith} />;
}

export function TownHallModel() {
  return <KayKit path={PATHS.castle} />;
}
