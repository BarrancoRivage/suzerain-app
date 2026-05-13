// Flat-top hex layout, axial coordinates.
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// `HEX_SIZE` est le rayon du sommet (distance centre → coin). Pour un prisme créé
// avec CylinderGeometry(HEX_SIZE, HEX_SIZE, h, 6) :
//   - Le hexagone par défaut a un sommet sur +X (angle 0°), donc orientation "flat-top".
//   - Espacement horizontal entre centres : 3/2 * HEX_SIZE.
//   - Espacement vertical : sqrt(3) * HEX_SIZE.

export const HEX_SIZE = 1;
export const HEX_HEIGHT = 0.25;
const SQRT3 = Math.sqrt(3);

export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * (3 / 2) * q;
  const z = HEX_SIZE * SQRT3 * (r + q / 2);
  return [x, z];
}
