"use client";

import type { BuildingKind } from "@/lib/game/types";

type Props = { kind: BuildingKind };

export function BuildingMesh({ kind }: Props) {
  if (kind === "farm") return <FarmMesh />;
  return <MineMesh />;
}

// Ferme : chaumière simple, lisible. Murs torchis, toit en bâtière (prisme
// triangulaire correctement orienté apex vers le haut), cheminée pierre, porte.
const WALL_W = 0.7;
const WALL_H = 0.32;
const WALL_D = 0.78;
const ROOF_R = 0.36;
const ROOF_LEN = WALL_D + 0.12;

function FarmMesh() {
  return (
    <group>
      {/* Murs (torchis crème) */}
      <mesh position={[0, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_W, WALL_H, WALL_D]} />
        <meshStandardMaterial color="#E8D5A8" roughness={0.92} />
      </mesh>

      {/* Toit en bâtière : 3-sided cylinder, axe original Y → couché en Z par
          rotation -π/2 autour de X. Apex monte vers +Y, base du triangle
          s'aligne sur le haut des murs. */}
      <mesh
        position={[0, WALL_H + ROOF_R / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[ROOF_R, ROOF_R, ROOF_LEN, 3]} />
        <meshStandardMaterial color="#7E4B2A" roughness={0.95} flatShading />
      </mesh>

      {/* Cheminée pierre, posée sur le toit côté arrière */}
      <mesh position={[0.18, WALL_H + ROOF_R * 0.55, -0.2]} castShadow>
        <boxGeometry args={[0.09, 0.28, 0.09]} />
        <meshStandardMaterial color="#766657" roughness={1} />
      </mesh>
      <mesh position={[0.18, WALL_H + ROOF_R * 0.9, -0.2]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#5C4E40" roughness={1} />
      </mesh>

      {/* Porte (face +Z) */}
      <mesh position={[0, 0.12, WALL_D / 2 + 0.001]} castShadow>
        <boxGeometry args={[0.16, 0.22, 0.02]} />
        <meshStandardMaterial color="#4A2E1A" roughness={0.95} />
      </mesh>

      {/* Petite lucarne ronde sur le pignon */}
      <mesh
        position={[WALL_W / 2 + 0.001, WALL_H + ROOF_R * 0.3, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.01, 12]} />
        <meshStandardMaterial color="#2A2018" roughness={1} />
      </mesh>
    </group>
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
