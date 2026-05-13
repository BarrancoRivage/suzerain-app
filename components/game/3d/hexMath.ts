// Pointy-top hex layout, axial coordinates.
// Référence : https://www.redblobgames.com/grids/hexagons/
//
// `HEX_SIZE` est le rayon du sommet (distance centre → coin). À noter pour
// CylinderGeometry(HEX_SIZE, HEX_SIZE, h, 6) : three.js construit ses sommets
// avec `vertex.x = R*sin(θ), vertex.z = R*cos(θ)`, donc θ=0 → (0, 0, R) sur +Z.
// L'hexagone est donc naturellement *pointy-top* en vue de dessus (sommets sur
// ±Z, arêtes plates sur ±X). On utilise le layout axial pointy-top assorti.

export const HEX_SIZE = 1;
// Tuile en mode overlay (à la Civ VI) : très fine, à peine décollée du sol.
export const HEX_THICKNESS = 0.04;
const SQRT3 = Math.sqrt(3);

export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * SQRT3 * (q + r / 2);
  const z = HEX_SIZE * (3 / 2) * r;
  return [x, z];
}

// Sommets d'un hexagone pointy-top centré à l'origine, dans l'ordre du contour.
// Utilisable pour un LineLoop ou un rendu de bordure.
export const HEX_OUTLINE_POINTS: readonly [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    pts.push([HEX_SIZE * Math.sin(angle), 0, HEX_SIZE * Math.cos(angle)]);
  }
  pts.push(pts[0]);
  return pts;
})();
