"use client";

import type { BuildingKind } from "@/lib/game/types";

type Props = { kind: BuildingKind };

export function BuildingMesh({ kind }: Props) {
  if (kind === "farm") return <FarmMesh />;
  return <MineMesh />;
}

function FarmMesh() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.36, 0.65]} />
        <meshStandardMaterial color="#D9C9A8" roughness={0.85} />
      </mesh>
      <mesh
        position={[0, 0.52, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      >
        <coneGeometry args={[0.48, 0.32, 4]} />
        <meshStandardMaterial color="#7A1F1F" roughness={0.7} />
      </mesh>
    </group>
  );
}

function MineMesh() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 0.56, 8]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.1, 0.42]} castShadow>
        <boxGeometry args={[0.18, 0.2, 0.08]} />
        <meshStandardMaterial color="#1A1410" roughness={1} />
      </mesh>
    </group>
  );
}
