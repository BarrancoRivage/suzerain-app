"use client";

import { useMemo } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PlaneGeometry,
} from "three";

import {
  MAP_SIZE,
  SEA_LEVEL,
  biomeAt,
  terrainHeightAt,
  type WorldPosition,
} from "@/lib/game/procgen";

// Terrain 100% procédural. AUCUNE notion d'hex dans la géométrie ou le
// rendu : la map est une surface continue générée par bruit value-noise
// multi-octave. L'eau apparaît naturellement là où l'élévation est sous
// le seuil de la mer.

type Props = {
  clickableAt: (x: number, z: number) => boolean;
  onWorldClick: (x: number, z: number) => void;
  onHoverChange?: (position: WorldPosition | null) => void;
};

const WORLD_SEGMENTS = 540;

const COL_WATER = new Color("#2A6B8A");
const COL_SAND = new Color("#C7B07A");
const COL_PLAIN = new Color("#6FA34F");
const COL_FOREST = new Color("#3F6B3C");
const COL_HILL = new Color("#7A8541");
const COL_MOUNTAIN = new Color("#8C887A");
const COL_SNOW = new Color("#D9D5C5");

export function WorldTerrain({
  clickableAt,
  onWorldClick,
  onHoverChange,
}: Props) {
  const geometry = useMemo(() => buildGeometry(), []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onPointerMove={(e) => {
        const wx = e.point.x;
        const wz = e.point.z;
        onHoverChange?.({ x: wx, z: wz });
        document.body.style.cursor = clickableAt(wx, wz)
          ? "pointer"
          : "not-allowed";
      }}
      onPointerLeave={() => {
        onHoverChange?.(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        const wx = e.point.x;
        const wz = e.point.z;
        if (!clickableAt(wx, wz)) return;
        e.stopPropagation();
        onWorldClick(wx, wz);
      }}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0}
        flatShading
      />
    </mesh>
  );
}

function buildGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(
    MAP_SIZE,
    MAP_SIZE,
    WORLD_SEGMENTS,
    WORLD_SEGMENTS,
  );
  const pos = geometry.attributes.position;
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    // Plan tourné -π/2 autour de X → local (x, y, 0) devient world (x, 0, -y).
    const wx = lx;
    const wz = -ly;
    pos.setZ(i, terrainHeightAt(wx, wz));
    sampleColor(wx, wz, c);
    colors.push(c.r, c.g, c.b);
  }
  pos.needsUpdate = true;

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function sampleColor(wx: number, wz: number, out: Color): void {
  switch (biomeAt(wx, wz)) {
    case "water":
      out.copy(COL_WATER);
      return;
    case "sand":
      out.copy(COL_SAND);
      return;
    case "forest":
      out.copy(COL_FOREST);
      return;
    case "hill":
      out.copy(COL_HILL);
      return;
    case "mountain":
      out.copy(COL_MOUNTAIN);
      return;
    case "snow":
      out.copy(COL_SNOW);
      return;
    default:
      out.copy(COL_PLAIN);
      out.offsetHSL(0, 0, (terrainHeightAt(wx, wz) - SEA_LEVEL) * 0.025);
  }
}
