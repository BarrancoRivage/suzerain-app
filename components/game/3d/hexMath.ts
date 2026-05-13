// Pointy-top hex layout, axial coordinates.
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// `HEX_SIZE` est le rayon du sommet (distance centre → coin). À noter pour
// CylinderGeometry(HEX_SIZE, HEX_SIZE, h, 6) : three.js construit ses sommets
// avec `vertex.x = R*sin(θ), vertex.z = R*cos(θ)`, donc θ=0 → (0, 0, R) sur +Z.
// L'hexagone est donc naturellement *pointy-top* en vue de dessus (sommets sur
// ±Z, arêtes plates sur ±X). On utilise le layout axial pointy-top assorti.

export const HEX_SIZE = 1;
export const HEX_HEIGHT = 0.25;
const SQRT3 = Math.sqrt(3);

export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * SQRT3 * (q + r / 2);
  const z = HEX_SIZE * (3 / 2) * r;
  return [x, z];
}
