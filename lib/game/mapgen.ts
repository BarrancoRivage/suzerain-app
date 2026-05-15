// Procgen de la carte initiale : relief, biomes, océans/lacs, rivières,
// route. Tout est déterministe via un seed issu du playerId.

import {
  HEX_DIRECTIONS,
  borderTiles,
  edgeIndex,
  hexDistance,
  isInsideGrid,
  neighbors,
} from "./hex";
import { mulberry32, pickWeighted, shuffle } from "./rng";
import {
  GRID_RADIUS,
  type Biome,
  type Tile,
  type TilePath,
  type WaterKind,
} from "./types";

type EdgeMode = "island" | "highlands" | "coast";

type DraftTile = Omit<Tile, "biome" | "water"> & {
  biome: Biome;
  water: WaterKind | null;
};

const SEA_LEVEL = 0.34;
const LAKE_LEVEL = 0.39;
const MIN_RIVER_LENGTH = 5;
const ROAD_RANDOMNESS = 0.7;
const ROAD_MAX_STEPS = GRID_RADIUS * 5;

export function buildMap(seed: number): Tile[] {
  const rng = mulberry32(seed);
  const mode = pickWeighted<EdgeMode>(
    [
      ["island", 4],
      ["coast", 3],
      ["highlands", 2],
    ],
    rng,
  );
  const tiles = generateTerrain(seed, mode);
  placeLakes(tiles, seed, rng);
  classifyBiomes(tiles, seed);
  placeRivers(tiles, seed, rng);
  placeRoad(tiles, rng);
  return tiles;
}

function generateTerrain(seed: number, mode: EdgeMode): DraftTile[] {
  const tiles: DraftTile[] = [];

  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    const rMin = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
    const rMax = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      const s = -q - r;
      const edgeDist =
        Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) / GRID_RADIUS;
      const nx = q / GRID_RADIUS;
      const ny = r / GRID_RADIUS;
      const ridge = ridged(seed + 0x51f15e, nx * 1.4, ny * 1.4, 4);
      const broad = fbm(seed + 0xa11ce, nx * 1.15, ny * 1.15, 5);
      const detail = fbm(seed + 0x7e44a1, nx * 4.5, ny * 4.5, 3);
      let elevation = 0.45 + broad * 0.32 + ridge * 0.22 + detail * 0.08;

      if (mode === "island") {
        elevation -= smoothstep(0.62, 1, edgeDist) * 0.48;
      } else if (mode === "highlands") {
        elevation += smoothstep(0.72, 1, edgeDist) * 0.22;
      } else {
        // Côte orientée par le seed : un bord tombe en mer, l'opposé monte.
        const angle = ((seed >>> 4) % 360) * (Math.PI / 180);
        const coastAxis = Math.cos(angle) * nx + Math.sin(angle) * ny;
        elevation -= smoothstep(0.08, 0.72, coastAxis) * 0.4;
        elevation += smoothstep(0.15, 0.8, -coastAxis) * 0.18;
      }

      elevation = clamp01(elevation);

      const moistureNoise = fbm(seed + 0xb10d, nx * 2.1, ny * 2.1, 4);
      const temperatureNoise = fbm(seed + 0x7a57e, nx * 1.7, ny * 1.7, 3);
      const latitude = (r + GRID_RADIUS) / (GRID_RADIUS * 2);
      const moisture = clamp01(0.52 + moistureNoise * 0.35 - elevation * 0.12);
      const temperature = clamp01(
        0.72 - latitude * 0.28 - elevation * 0.42 + temperatureNoise * 0.18,
      );

      const water = elevation < SEA_LEVEL ? "ocean" : null;
      tiles.push({
        q,
        r,
        biome: water ? "water" : "plain",
        elevation,
        moisture,
        temperature,
        water,
        building: null,
      });
    }
  }

  return tiles;
}

// Lacs : on remplit quelques dépressions intérieures, mais pas les bords
// océaniques. On garde de l'espace entre les bassins pour lisibilité.
function placeLakes(
  tiles: DraftTile[],
  seed: number,
  rng: () => number,
): void {
  const tileMap = indexTiles(tiles);
  const candidates = tiles
    .filter((tile) => {
      const edgeDist =
        Math.max(Math.abs(tile.q), Math.abs(tile.r), Math.abs(-tile.q - tile.r)) /
        GRID_RADIUS;
      const wetNoise = fbm(seed + 0x1a4e5, tile.q * 0.15, tile.r * 0.15, 3);
      return (
        tile.water === null &&
        edgeDist < 0.82 &&
        tile.elevation < LAKE_LEVEL + wetNoise * 0.06 &&
        tile.moisture > 0.48
      );
    })
    .sort((a, b) => a.elevation - b.elevation);

  const lakeCount = 3 + Math.floor(rng() * 5);
  const centers: DraftTile[] = [];
  for (const candidate of candidates) {
    if (centers.length >= lakeCount) break;
    if (
      centers.some(
        (center) =>
          hexDistance(center.q, center.r, candidate.q, candidate.r) < 5,
      )
    ) {
      continue;
    }
    centers.push(candidate);
    const radius = 1 + Math.floor(rng() * 2);
    for (const tile of tiles) {
      if (hexDistance(candidate.q, candidate.r, tile.q, tile.r) > radius) {
        continue;
      }
      if (tile.water !== null || tile.elevation > LAKE_LEVEL + 0.05) continue;
      tile.water = "lake";
      tile.biome = "water";
      tile.elevation = Math.min(tile.elevation, LAKE_LEVEL);
    }
  }

  // Les lacs isolés d'une seule case font trop artificiels : on grossit un peu
  // les bords les plus bas autour des centres retenus.
  for (const center of centers) {
    const ns = neighbors(center.q, center.r)
      .map(([q, r]) => tileMap.get(coordKey(q, r)))
      .filter((tile): tile is DraftTile => !!tile && tile.water === null)
      .sort((a, b) => a.elevation - b.elevation)
      .slice(0, 2);
    for (const tile of ns) {
      if (tile.elevation < LAKE_LEVEL + 0.04) {
        tile.water = "lake";
        tile.biome = "water";
        tile.elevation = Math.min(tile.elevation, LAKE_LEVEL);
      }
    }
  }
}

function classifyBiomes(tiles: DraftTile[], seed: number): void {
  for (const tile of tiles) {
    if (tile.water !== null) {
      tile.biome = "water";
      continue;
    }

    const dryness =
      1 -
      tile.moisture +
      fbm(seed + 0xde5e47, tile.q * 0.22, tile.r * 0.22, 2) * 0.16;
    if (tile.elevation > 0.76) tile.biome = "mountain";
    else if (tile.elevation > 0.62) tile.biome = "hill";
    else if (dryness > 0.68 && tile.temperature > 0.48) tile.biome = "desert";
    else if (tile.moisture > 0.58) tile.biome = "forest";
    else tile.biome = "plain";
  }
}

function placeRivers(
  tiles: DraftTile[],
  seed: number,
  rng: () => number,
): void {
  const tileMap = indexTiles(tiles);
  const sources = tiles
    .filter((tile) => {
      const riverNoise = fbm(seed + 0x917e2, tile.q * 0.3, tile.r * 0.3, 2);
      return (
        tile.water === null &&
        tile.elevation > 0.6 &&
        tile.moisture + riverNoise * 0.2 > 0.55
      );
    })
    .sort((a, b) => b.elevation + b.moisture - (a.elevation + a.moisture));

  shuffle(sources, rng);
  const wanted = 4 + Math.floor(rng() * 4);
  const starts: DraftTile[] = [];
  for (const source of sources) {
    if (starts.length >= wanted) break;
    if (starts.some((s) => hexDistance(s.q, s.r, source.q, source.r) < 6)) {
      continue;
    }
    starts.push(source);
  }

  for (const source of starts) {
    const route = traceDownhillRiver(source, tileMap, seed);
    if (route.length < MIN_RIVER_LENGTH) continue;
    stampPath(route, tileMap, "river");
  }
}

function traceDownhillRiver(
  source: DraftTile,
  tileMap: Map<string, DraftTile>,
  seed: number,
): Array<[number, number]> {
  const route: Array<[number, number]> = [[source.q, source.r]];
  const visited = new Set<string>([coordKey(source.q, source.r)]);
  let current = source;

  for (let step = 0; step < GRID_RADIUS * 3; step++) {
    if (current.water !== null && current !== source) break;
    const options = neighbors(current.q, current.r)
      .map(([q, r]) => tileMap.get(coordKey(q, r)))
      .filter((tile): tile is DraftTile => !!tile && !visited.has(coordKey(tile.q, tile.r)))
      .map((tile) => {
        const meander = fbm(seed + 0x4f10f, tile.q * 0.6, tile.r * 0.6, 2);
        const downhill = current.elevation - tile.elevation;
        const waterBonus = tile.water === null ? 0 : 0.4;
        return { tile, score: downhill + waterBonus + meander * 0.12 };
      })
      .sort((a, b) => b.score - a.score);

    const next = options[0]?.tile;
    if (!next || options[0].score < -0.04) break;
    route.push([next.q, next.r]);
    visited.add(coordKey(next.q, next.r));
    current = next;
    if (next.water !== null) break;
  }

  return route;
}

function placeRoad(tiles: DraftTile[], rng: () => number): void {
  const tileMap = indexTiles(tiles);
  const route = randomRoadWalk(rng, tileMap);
  if (route.length >= GRID_RADIUS) stampPath(route, tileMap, "road");
}

function randomRoadWalk(
  rng: () => number,
  tileMap: Map<string, DraftTile>,
): Array<[number, number]> {
  const borders = borderTiles().filter(([q, r]) => {
    const tile = tileMap.get(coordKey(q, r));
    return !!tile && tile.water === null && tile.biome !== "mountain";
  });
  if (borders.length < 2) return [];
  const start = borders[Math.floor(rng() * borders.length)];
  const ranked = borders
    .map((b) => ({ t: b, d: hexDistance(start[0], start[1], b[0], b[1]) }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 8);
  const end = ranked[Math.floor(rng() * ranked.length)].t;

  const path: Array<[number, number]> = [start];
  const visited = new Set<string>([coordKey(start[0], start[1])]);
  let current = start;

  for (let step = 0; step < ROAD_MAX_STEPS; step++) {
    if (current[0] === end[0] && current[1] === end[1]) break;
    const ns = neighbors(current[0], current[1]).filter(([q, r]) => {
      if (visited.has(coordKey(q, r))) return false;
      const tile = tileMap.get(coordKey(q, r));
      return !!tile && tile.water === null && tile.biome !== "mountain" && !tile.path;
    });
    if (ns.length === 0) break;

    const weighted = ns.map(([q, r]) => {
      const tile = tileMap.get(coordKey(q, r));
      const d = hexDistance(q, r, end[0], end[1]);
      const terrainCost = tile?.biome === "hill" ? -0.12 : 0;
      const proximity = 1 / (1 + d);
      const noise = rng() * ROAD_RANDOMNESS;
      return [[q, r] as [number, number], proximity + noise + terrainCost] as const;
    });
    const next = pickWeighted(weighted, rng);
    path.push(next);
    visited.add(coordKey(next[0], next[1]));
    current = next;
  }

  return path;
}

function stampPath(
  route: Array<[number, number]>,
  tileMap: Map<string, DraftTile>,
  type: TilePath["type"],
): void {
  for (let i = 0; i < route.length; i++) {
    const [q, r] = route[i];
    const tile = tileMap.get(coordKey(q, r));
    if (!tile) continue;
    const prev = i === 0 ? null : route[i - 1];
    const next = i === route.length - 1 ? null : route[i + 1];
    const inEdge = prev
      ? edgeIndex(q, r, prev[0], prev[1])
      : outwardEdgeExcluding(q, r, next ? edgeIndex(q, r, next[0], next[1]) : -1);
    const outEdge = next
      ? edgeIndex(q, r, next[0], next[1])
      : outwardEdgeExcluding(q, r, inEdge);

    if (inEdge < 0 || outEdge < 0 || inEdge === outEdge) continue;
    tile.path = { type, inEdge, outEdge };
    if (type === "river") {
      tile.moisture = Math.max(tile.moisture, 0.75);
      if (tile.biome === "desert") tile.biome = "plain";
    }
  }
}

function outwardEdgeExcluding(q: number, r: number, excludeEdge: number): number {
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    if (i === excludeEdge) continue;
    const [dq, dr] = HEX_DIRECTIONS[i];
    if (!isInsideGrid(q + dq, r + dr)) return i;
  }
  return (excludeEdge + 3) % 6;
}

function indexTiles<T extends { q: number; r: number }>(
  tiles: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const tile of tiles) map.set(coordKey(tile.q, tile.r), tile);
  return map;
}

function coordKey(q: number, r: number): string {
  return `${q}:${r}`;
}

function fbm(seed: number, x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(seed + i * 1013, x * frequency, y * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / total;
}

function ridged(seed: number, x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(seed + i * 1777, x * frequency, y * frequency));
    value += n * amplitude;
    total += amplitude;
    amplitude *= 0.52;
    frequency *= 2.05;
  }
  return value / total;
}

function valueNoise(seed: number, x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = smootherstep(fx);
  const sy = smootherstep(fy);
  const a = lattice(seed, ix, iy);
  const b = lattice(seed, ix + 1, iy);
  const c = lattice(seed, ix, iy + 1);
  const d = lattice(seed, ix + 1, iy + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

function lattice(seed: number, x: number, y: number): number {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 2147483648) - 1;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
