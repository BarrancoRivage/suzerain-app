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

export function worldToAxial(x: number, z: number): [number, number] {
  const qf = (SQRT3 / 3 * x - z / 3) / HEX_SIZE;
  const rf = ((2 / 3) * z) / HEX_SIZE;
  return axialRound(qf, rf);
}

export function hexCornerOffsets(): Array<[number, number]> {
  const corners: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (30 + i * 60);
    corners.push([Math.cos(angle) * HEX_SIZE, Math.sin(angle) * HEX_SIZE]);
  }
  return corners;
}

function axialRound(qf: number, rf: number): [number, number] {
  let q = Math.round(qf);
  let r = Math.round(rf);
  let s = Math.round(-qf - rf);

  const qDiff = Math.abs(q - qf);
  const rDiff = Math.abs(r - rf);
  const sDiff = Math.abs(s - (-qf - rf));

  if (qDiff > rDiff && qDiff > sDiff) q = -r - s;
  else if (rDiff > sDiff) r = -q - s;
  else s = -q - r;

  return [q, r];
}

// Bruit partagé entre tuiles jouables et sol périphérique pour que les deux
// suivent le même pattern de relief. Somme de sinus à 3 fréquences basses
// pour produire des ondulations larges (pas de pics aigus). Rangé dans
// [-0.97, 0.97]. Les consommateurs scalent par leur propre amplitude.
export function reliefNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.18 + z * 0.13) * 0.55 +
    Math.sin(x * 0.42 - z * 0.31) * 0.28 +
    Math.sin(x * 0.78 + z * 0.62) * 0.14
  );
}
