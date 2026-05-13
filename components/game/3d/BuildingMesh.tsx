"use client";

import type { BuildingKind } from "@/lib/game/types";

type Props = { kind: BuildingKind };

export function BuildingMesh({ kind }: Props) {
  if (kind === "farm") return <FarmMesh />;
  return <MineMesh />;
}

// Ferme : chaumière médiévale en colombages. Plusieurs meshes pour donner
// du relief et de la lisibilité — murs torchis, toit de chaume, cheminée
// en pierre, porte sombre. Tout reste sub-poly mais le shading PBR rend
// les volumes vivants.
function FarmMesh() {
  return (
    <group>
      {/* Murs (torchis crème) */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.36, 0.74]} />
        <meshStandardMaterial color="#E8D5A8" roughness={0.92} />
      </mesh>

      {/* Poutres de colombage horizontales (4 traverses sombres) */}
      <BeamRing y={0.05} />
      <BeamRing y={0.34} />

      {/* Poutres verticales aux coins */}
      <CornerPosts />

      {/* Toit de chaume — deux pans inclinés en CylinderGeometry tronqué */}
      <mesh position={[0, 0.55, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.43, 0.43, 0.78, 3, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#7E4B2A" roughness={0.95} flatShading />
      </mesh>

      {/* Cheminée pierre */}
      <mesh position={[0.16, 0.65, -0.18]} castShadow>
        <boxGeometry args={[0.11, 0.32, 0.11]} />
        <meshStandardMaterial color="#766657" roughness={1} />
      </mesh>
      <mesh position={[0.16, 0.82, -0.18]} castShadow>
        <boxGeometry args={[0.14, 0.04, 0.14]} />
        <meshStandardMaterial color="#5C4E40" roughness={1} />
      </mesh>

      {/* Porte */}
      <mesh position={[0, 0.13, 0.38]} castShadow>
        <boxGeometry args={[0.16, 0.22, 0.02]} />
        <meshStandardMaterial color="#4A2E1A" roughness={0.95} />
      </mesh>

      {/* Fenêtre sur le pignon */}
      <mesh position={[-0.32, 0.22, 0]} castShadow>
        <boxGeometry args={[0.02, 0.1, 0.12]} />
        <meshStandardMaterial color="#2A2018" roughness={1} />
      </mesh>
    </group>
  );
}

function BeamRing({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0, 0.36]}>
        <boxGeometry args={[0.62, 0.03, 0.03]} />
        <meshStandardMaterial color="#3A2818" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, -0.36]}>
        <boxGeometry args={[0.62, 0.03, 0.03]} />
        <meshStandardMaterial color="#3A2818" roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.74, 0.03, 0.03]} />
        <meshStandardMaterial color="#3A2818" roughness={0.95} />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.74, 0.03, 0.03]} />
        <meshStandardMaterial color="#3A2818" roughness={0.95} />
      </mesh>
    </group>
  );
}

function CornerPosts() {
  const positions: ReadonlyArray<readonly [number, number]> = [
    [0.3, 0.36],
    [-0.3, 0.36],
    [0.3, -0.36],
    [-0.3, -0.36],
  ];
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]}>
          <boxGeometry args={[0.04, 0.36, 0.04]} />
          <meshStandardMaterial color="#3A2818" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

// Mine : monticule de pierre + cadre boisé d'entrée + sombre passage. Petit
// tas de roche extraite devant pour l'identification visuelle.
function MineMesh() {
  return (
    <group>
      {/* Monticule pierreux */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.55, 0.64, 8]} />
        <meshStandardMaterial color="#807366" roughness={1} flatShading />
      </mesh>

      {/* Entrée — cadre en bois (2 poteaux + linteau) */}
      <mesh position={[-0.13, 0.13, 0.38]} castShadow>
        <boxGeometry args={[0.05, 0.27, 0.05]} />
        <meshStandardMaterial color="#3F2A18" roughness={0.95} />
      </mesh>
      <mesh position={[0.13, 0.13, 0.38]} castShadow>
        <boxGeometry args={[0.05, 0.27, 0.05]} />
        <meshStandardMaterial color="#3F2A18" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.27, 0.38]} castShadow>
        <boxGeometry args={[0.34, 0.05, 0.06]} />
        <meshStandardMaterial color="#3F2A18" roughness={0.95} />
      </mesh>

      {/* Passage sombre (cuboïde noir reculé pour effet de profondeur) */}
      <mesh position={[0, 0.12, 0.37]}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#0A0805" roughness={1} />
      </mesh>

      {/* Petit tas de minerai devant la mine */}
      <mesh position={[0.32, 0.04, 0.3]} castShadow>
        <dodecahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#A88A3C" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0.28, 0.05, 0.36]} castShadow>
        <dodecahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial color="#9A7E36" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}
