// Procgen partagée client/serveur : élévation, water, biome calculés à
// la volée depuis (x, z) world. Pas de hex, pas de tile : juste une
// fonction continue du monde.

export const MAP_HALF_SIZE = 100; // map effective 200×200 unit
export const SEA_LEVEL = 0.5;
export const MIN_BUILDING_SPACING = 1.6; // unités world entre 2 bâtiments

export type ProcBiome =
  | "water"
  | "sand"
  | "plain"
  | "forest"
  | "hill"
  | "mountain"
  | "snow";

export function elevationAt(x: number, z: number): number {
  const broad = valueNoise(x * 0.022, z * 0.022);
  const mid = valueNoise(x * 0.05 + 117, z * 0.05 - 213);
  const ridge = valueNoise(x * 0.11 - 91, z * 0.11 + 47);
  const raw = broad * 0.6 + mid * 0.32 + ridge * 0.2;
  return 1.6 + raw * 2.4;
}

export function moistureAt(x: number, z: number): number {
  return (valueNoise(x * 0.035 + 511, z * 0.035 - 277) + 1) * 0.5;
}

export function isWaterAt(x: number, z: number): boolean {
  return elevationAt(x, z) < SEA_LEVEL;
}

export function isInMapBounds(x: number, z: number): boolean {
  return Math.abs(x) <= MAP_HALF_SIZE && Math.abs(z) <= MAP_HALF_SIZE;
}

export function biomeAt(x: number, z: number): ProcBiome {
  const elev = elevationAt(x, z);
  if (elev < SEA_LEVEL) return "water";
  if (elev < SEA_LEVEL + 0.15) return "sand";
  if (elev > 3.5) return "snow";
  if (elev > 2.9) return "mountain";
  if (elev > 2.3) return "hill";
  const moist = moistureAt(x, z);
  if (moist > 0.62) return "forest";
  return "plain";
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
