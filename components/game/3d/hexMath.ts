// Pointy-top hex layout, axial coordinates.
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// `HEX_SIZE` = rayon centre → sommet de la tuile dans notre repère monde.
// Les tuiles KayKit (vertex distance native 2/√3) sont scalées par √3/2
// pour matcher HEX_SIZE = 1 — cf. KAYKIT_SCALE dans models/Models.tsx.

export const HEX_SIZE = 1;
const SQRT3 = Math.sqrt(3);

export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * SQRT3 * (q + r / 2);
  const z = HEX_SIZE * (3 / 2) * r;
  return [x, z];
}
