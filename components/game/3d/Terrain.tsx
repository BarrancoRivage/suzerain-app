"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Color,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { Line } from "@react-three/drei";
import { useLoader, type ThreeEvent } from "@react-three/fiber";

import { GRID_RADIUS } from "@/lib/game/types";
import {
  HEX_SIZE,
  axialToWorld,
  reliefNoise,
  worldToAxial,
} from "./hexMath";

// Terrain CONTINU : une seule PlaneGeometry subdivisée couvre TOUTE la carte
// (disque jouable + anneau périphérique). Texture grass Poly Haven samplée
// par coords world XZ → continue à travers les frontières des hex, aucun
// joint visible. Le « grid hex » n'est qu'un overlay (sur hover) — la
// surface elle-même est uniforme.

const TEX_GRASS_DIFF =
  "/assets/textures/aerial-grass-rock/aerial_grass_rock_diff_4k.jpg";

const TERRAIN_SIZE = 70;
const TERRAIN_SEGMENTS = 192;
// Disque jouable rayon axial 6 → world distance max ≈ 10.4. On garde une
// marge avant que le terrain commence à se déformer.
const PLAYABLE_FLAT_RADIUS = 11.5;
const RAMP_LENGTH = 4.0;
const RELIEF_AMPLITUDE = 0.9;
// Y du sommet de terrain au repos (à l'intérieur du disque jouable). Choisi
// pour que les décors/bâtiments calés à Y=0 soient correctement posés.
const TERRAIN_BASE_Y = 0;
// Échelle UV du tile sampling : 1 répétition tous les ~6 m. Plus haut =
// plus tassé visuellement.
const TEXTURE_TILE = 0.16;

const HOVER_COLOR = new Color("#EFC75A");

// Élévation du sol en (x, z) world : flat dans le disque jouable, ondulé
// au-delà. Mêmes paramètres que ceux utilisés dans buildTerrainGeometry,
// pour que les décors externes suivent les bosses du terrain.
export function terrainElevation(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  if (dist <= PLAYABLE_FLAT_RADIUS) return TERRAIN_BASE_Y;
  const t = Math.min(1, (dist - PLAYABLE_FLAT_RADIUS) / RAMP_LENGTH);
  const ease = t * t * (3 - 2 * t);
  return TERRAIN_BASE_Y + reliefNoise(x, z) * RELIEF_AMPLITUDE * ease;
}

function buildTerrainGeometry(): PlaneGeometry {
  const geo = new PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS,
  );
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    // Plan tourné -π/2 autour de X dans la scène → local Y devient -Z world.
    const wx = lx;
    const wz = -ly;
    pos.setZ(i, terrainElevation(wx, wz));
    // UV samplé par world coords pour que la texture soit continue à
    // travers toute la carte, indépendamment du découpage hex.
    uv.setXY(i, wx * TEXTURE_TILE, wz * TEXTURE_TILE);
  }
  pos.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// Hex outline (6 sommets pointy-top + retour au premier) à HEX_SIZE.
// Réutilisable comme contour de tuile au survol.
const HEX_OUTLINE: readonly [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push([HEX_SIZE * Math.sin(a), 0, HEX_SIZE * Math.cos(a)]);
  }
  pts.push(pts[0]);
  return pts;
})();

type Props = {
  isClickable: (q: number, r: number) => boolean;
  onTileClick: (q: number, r: number) => void;
};

export function Terrain({ isClickable, onTileClick }: Props) {
  const grass = useLoader(TextureLoader, TEX_GRASS_DIFF);
  const geometry = useMemo(buildTerrainGeometry, []);
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  useEffect(() => {
    grass.wrapS = RepeatWrapping;
    grass.wrapT = RepeatWrapping;
    grass.colorSpace = SRGBColorSpace;
  }, [grass]);

  function tileAt(e: ThreeEvent<PointerEvent | MouseEvent>): [number, number] | null {
    const [q, r] = worldToAxial(e.point.x, e.point.z);
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) > GRID_RADIUS) {
      return null;
    }
    return [q, r];
  }

  return (
    <>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          const hex = tileAt(e);
          if (hex && isClickable(hex[0], hex[1])) {
            if (
              !hovered ||
              hovered[0] !== hex[0] ||
              hovered[1] !== hex[1]
            ) {
              setHovered(hex);
            }
            document.body.style.cursor = "pointer";
          } else if (hovered !== null) {
            setHovered(null);
            document.body.style.cursor = "";
          }
        }}
        onPointerOut={() => {
          if (hovered !== null) setHovered(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          const hex = tileAt(e);
          if (!hex) return;
          if (!isClickable(hex[0], hex[1])) return;
          e.stopPropagation();
          onTileClick(hex[0], hex[1]);
        }}
      >
        <meshStandardMaterial map={grass} roughness={0.92} />
      </mesh>

      {hovered ? (
        <HoverHex q={hovered[0]} r={hovered[1]} />
      ) : null}
    </>
  );
}

// Contour hexagonal jaune posé sur la tuile survolée. Sert d'affordance
// (équivalent du hover-lift de l'ancienne archi per-tile).
function HoverHex({ q, r }: { q: number; r: number }) {
  const [x, z] = axialToWorld(q, r);
  const y = terrainElevation(x, z) + 0.015;
  return (
    <Line
      points={HEX_OUTLINE as unknown as [number, number, number][]}
      color={HOVER_COLOR}
      lineWidth={3}
      transparent
      opacity={0.85}
      position={[x, y, z]}
    />
  );
}
