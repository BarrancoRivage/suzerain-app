"use client";

import { useEffect, useRef } from "react";
import {
  Color,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from "three";

import {
  snapWorld,
  terrainHeightAt,
  type WorldPosition,
} from "@/lib/game/procgen";
import type { BuildingKind } from "@/lib/game/types";

import {
  FarmModel,
  HouseModel,
  LumberjackModel,
  MineModel,
} from "./models/Models";

type Props = {
  selectedKind: BuildingKind | null;
  hoverPosition: WorldPosition | null;
  clickableAt: (x: number, z: number) => boolean;
};

// Ghost du bâtiment sélectionné : suit la souris sur la surface procédurale,
// snap à une grille fine, puis se teinte selon la constructibilité.
export function PlacementOverlay({
  selectedKind,
  hoverPosition,
  clickableAt,
}: Props) {
  if (selectedKind === null || hoverPosition === null) return null;

  const x = snapWorld(hoverPosition.x);
  const z = snapWorld(hoverPosition.z);
  const y = terrainHeightAt(x, z) + 0.02;
  const placeable = clickableAt(x, z);

  return (
    <BuildingGhost kind={selectedKind} placeable={placeable} x={x} y={y} z={z} />
  );
}

function BuildingGhost({
  kind,
  placeable,
  x,
  y,
  z,
}: {
  kind: BuildingKind;
  placeable: boolean;
  x: number;
  y: number;
  z: number;
}) {
  const groupRef = useRef<Object3D>(null);
  const tintColor = placeable ? "#7CD17C" : "#D17C7C";

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const restore: Array<() => void> = [];
    const color = new Color(tintColor);
    group.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      if (!(mat instanceof MeshStandardMaterial)) return;
      const cloned = mat.clone();
      cloned.transparent = true;
      cloned.opacity = 0.55;
      cloned.depthWrite = false;
      cloned.emissive = color;
      cloned.emissiveIntensity = 0.55;
      obj.material = cloned;
      restore.push(() => {
        obj.material = mat;
        cloned.dispose();
      });
    });
    return () => {
      for (const fn of restore) fn();
    };
  }, [kind, placeable, tintColor]);

  return (
    <group ref={groupRef} position={[x, y, z]} scale={0.72} raycast={() => null}>
      {kind === "farm" && <FarmModel seed={0} />}
      {kind === "lumberjack" && <LumberjackModel />}
      {kind === "house" && <HouseModel />}
      {kind === "mine" && <MineModel />}
    </group>
  );
}
