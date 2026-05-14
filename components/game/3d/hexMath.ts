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

// Inverse de `axialToWorld` (pointy-top). On résout la formule pour obtenir
// les coords axiales fractionnaires, puis on arrondit au hex le plus proche
// via cube rounding (technique standard, cf. redblobgames).
export function worldToAxial(x: number, z: number): [number, number] {
  const qf = (x / SQRT3 - z / 3) / HEX_SIZE;
  const rf = ((2 / 3) * z) / HEX_SIZE;
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
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
