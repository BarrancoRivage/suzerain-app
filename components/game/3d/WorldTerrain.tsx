"use client";

import { useMemo } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PlaneGeometry,
} from "three";

import type { HoverHit } from "./Scene";

// Terrain 100% procédural. AUCUNE notion d'hex dans la géométrie ou le
// rendu : la map est une surface continue générée par bruit value-noise
// multi-octave. L'eau apparaît naturellement là où l'élévation est sous
// le seuil de la mer.

type Props = {
  clickableAt: (x: number, z: number) => boolean;
  onWorldClick: (x: number, z: number) => void;
  onHoverChange?: (hit: HoverHit | null) => void;
};

const WORLD_SIZE = 200;
const WORLD_SEGMENTS = 540;
const SEA_LEVEL_Y = 0.5;
const WATER_FLOOR_Y = -0.4;

const COL_WATER = new Color("#2A6B8A");
const COL_SAND = new Color("#C7B07A");
const COL_PLAIN = new Color("#6FA34F");
const COL_FOREST = new Color("#3F6B3C");
const COL_HILL = new Color("#7A8541");
const COL_MOUNTAIN = new Color("#8C887A");
const COL_SNOW = new Color("#D9D5C5");

export function WorldTerrain({ clickableAt, onWorldClick, onHoverChange }: Props) {
  const geometry = useMemo(() => buildGeometry(), []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onPointerMove={(e) => {
        const wx = e.point.x;
        const wz = e.point.z;
        // On expose un HoverHit dégradé : la "tile" est synthétique (q=r=0)
        // — les consommateurs ne doivent regarder que worldX / worldZ.
        onHoverChange?.({
          tile: { q: 0, r: 0 } as unknown as HoverHit["tile"],
          worldX: wx,
          worldZ: wz,
        });
        document.body.style.cursor = clickableAt(wx, wz) ? "pointer" : "not-allowed";
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
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} flatShading />
    </mesh>
  );
}

function buildGeometry(): BufferGeometry {
  const plane = new PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_SEGMENTS, WORLD_SEGMENTS);
  const pos = plane.attributes.position;
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    // Plan tourné -π/2 autour de X → local (x, y, 0) devient world (x, 0, -y).
    const wx = lx;
    const wz = -ly;
    pos.setZ(i, heightAt(wx, wz));
    sampleColor(wx, wz, c);
    colors.push(c.r, c.g, c.b);
  }
  pos.needsUpdate = true;

  const geo = new BufferGeometry();
  geo.setAttribute("position", pos);
  geo.setIndex(plane.index);
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// Hauteur procédurale en (x, z). Fonction pure utilisée aussi par le
// pipeline de placement (pour caler Y des bâtiments sur le sol).
export function heightAt(wx: number, wz: number): number {
  const e = procElevation(wx, wz);
  if (e < SEA_LEVEL_Y) return WATER_FLOOR_Y;
  return e;
}

// Élévation continue. Retourne directement la valeur Y monde.
// Amplitude bumpée pour un relief plus marqué : collines plus hautes,
// vallées plus creusées. Plage finale ≈ [-0.8, 4.0].
export function procElevation(wx: number, wz: number): number {
  const broad = valueNoise(wx * 0.022, wz * 0.022);
  const mid = valueNoise(wx * 0.05 + 117, wz * 0.05 - 213);
  const ridge = valueNoise(wx * 0.11 - 91, wz * 0.11 + 47);
  const raw = broad * 0.6 + mid * 0.32 + ridge * 0.2;
  return 1.6 + raw * 2.4;
}

export function isWaterAt(wx: number, wz: number): boolean {
  return procElevation(wx, wz) < SEA_LEVEL_Y;
}

function sampleColor(wx: number, wz: number, out: Color): void {
  const elev = procElevation(wx, wz);
  if (elev < SEA_LEVEL_Y) {
    out.copy(COL_WATER);
    return;
  }
  if (elev < SEA_LEVEL_Y + 0.15) {
    out.copy(COL_SAND);
    return;
  }
  const moist = (valueNoise(wx * 0.035 + 511, wz * 0.035 - 277) + 1) * 0.5;
  if (elev > 3.5) {
    out.copy(COL_SNOW);
    return;
  }
  if (elev > 2.9) {
    out.copy(COL_MOUNTAIN);
    return;
  }
  if (elev > 2.3) {
    out.copy(COL_HILL);
    return;
  }
  if (moist > 0.62) {
    out.copy(COL_FOREST);
    return;
  }
  out.copy(COL_PLAIN);
  out.offsetHSL(0, (moist - 0.5) * 0.05, (elev - 1.6) * 0.04);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sz);
}

function hash2D(x: number, z: number): number {
  let h = 0x9e3779b1 ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 2147483648) - 1;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
