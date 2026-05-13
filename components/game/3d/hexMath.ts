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

// Bruit partagé entre tuiles jouables et sol périphérique pour que les deux
// suivent le même pattern de relief. Somme de sinus à 3 fréquences ; rangé
// dans [-0.97, 0.97]. Les consommateurs scalent par leur propre amplitude.
export function reliefNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.55 + z * 0.4) * 0.55 +
    Math.sin(x * 1.7 - z * 1.1) * 0.28 +
    Math.sin(x * 3.1 + z * 2.6) * 0.14
  );
}
