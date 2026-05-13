// Géométrie hex axiale partagée entre engine (server) et rendu (client).
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// Notre convention :
//   - Pointy-top (sommets sur ±Z en monde, arêtes plates sur ±X)
//   - 6 directions hex indexées 0-5 dans l'ordre angulaire CCW depuis +X
//   - Edge i d'une tuile = arête perpendiculaire à la direction i, partagée
//     avec le voisin i

import { GRID_RADIUS } from "./types";

// Direction vector pour chaque edge index 0-5.
// Index 0 = +X (E), 1 = SE, 2 = SW, 3 = -X (W), 4 = NW, 5 = NE
// Angle world XZ de la direction : i * 60° (CCW depuis +X, +Z = sud).
export const HEX_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], // 0  E   (0°)
  [0, +1], // 1  SE  (60°)
  [-1, +1], // 2 SW  (120°)
  [-1, 0], // 3  W   (180°)
  [0, -1], // 4  NW  (240°)
  [+1, -1], // 5 NE  (300°)
];

export function cubeS(q: number, r: number): number {
  return -q - r;
}

export function isInsideGrid(
  q: number,
  r: number,
  radius: number = GRID_RADIUS,
): boolean {
  if (!Number.isInteger(q) || !Number.isInteger(r)) return false;
  return (
    Math.abs(q) <= radius &&
    Math.abs(r) <= radius &&
    Math.abs(cubeS(q, r)) <= radius
  );
}

export function neighbors(
  q: number,
  r: number,
  radius: number = GRID_RADIUS,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = q + dq;
    const nr = r + dr;
    if (isInsideGrid(nq, nr, radius)) out.push([nq, nr]);
  }
  return out;
}

export function hexDistance(
  q1: number,
  r1: number,
  q2: number,
  r2: number,
): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// Tuiles sur le bord du disque (max(|q|,|r|,|s|) === radius).
export function borderTiles(
  radius: number = GRID_RADIUS,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      if (
        Math.max(Math.abs(q), Math.abs(r), Math.abs(cubeS(q, r))) === radius
      ) {
        out.push([q, r]);
      }
    }
  }
  return out;
}

// Index 0..5 de l'arête de (fromQ, fromR) tournée vers (toQ, toR).
// Renvoie -1 si (to) n'est pas un voisin direct (cas illégal pour notre usage).
export function edgeIndex(
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number,
): number {
  const dq = toQ - fromQ;
  const dr = toR - fromR;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const [edq, edr] = HEX_DIRECTIONS[i];
    if (edq === dq && edr === dr) return i;
  }
  return -1;
}

// L'edge « extérieure » d'une tuile de bord : celle dont le voisin sortirait
// du disque. Si plusieurs candidates, on prend la première dans l'ordre.
export function outwardEdge(
  q: number,
  r: number,
  radius: number = GRID_RADIUS,
): number {
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const [dq, dr] = HEX_DIRECTIONS[i];
    if (!isInsideGrid(q + dq, r + dr, radius)) return i;
  }
  return 0;
}
