// Pointy-top hex layout, axial coordinates.
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// `HEX_SIZE` = rayon centre → sommet de la tuile dans notre repère monde.
// Les tuiles sont maintenant procédurales (CylinderGeometry 6 segments)
// avec radius = HEX_SIZE — pas de scale conversion nécessaire.

export const HEX_SIZE = 1;
const SQRT3 = Math.sqrt(3);

export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * SQRT3 * (q + r / 2);
  const z = HEX_SIZE * (3 / 2) * r;
  return [x, z];
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
