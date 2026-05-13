// Procgen de la carte initiale : biomes, lacs, rivière, route.
// Tous les choix sont déterministes via un RNG seedé par playerId, donc une
// même carte est régénérable à l'identique. Cette logique vit séparément de
// engine.ts (qui ne s'occupe que de tick / placeBuilding) pour rester lisible.

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
} from "./types";

// --- Biomes terrestres ---

const LAND_BIOME_WEIGHTS: ReadonlyArray<readonly [Biome, number]> = [
  ["plain", 5],
  ["forest", 3],
  ["hill", 2],
];

export function generateTiles(rng: () => number): Tile[] {
  const tiles: Tile[] = [];
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    const rMin = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
    const rMax = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      tiles.push({
        q,
        r,
        biome: pickWeighted(LAND_BIOME_WEIGHTS, rng),
        building: null,
      });
    }
  }
  return tiles;
}

// --- Lacs : 3-5 clusters indépendants ---

const NUM_LAKES_MIN = 3;
const NUM_LAKES_MAX = 5;
const LAKE_NEIGHBORS_MIN = 1;
const LAKE_NEIGHBORS_MAX = 3;
const MIN_LAKE_SEPARATION = 3;

export function placeLakes(tiles: Tile[], rng: () => number): void {
  const tileMap = indexTiles(tiles);
  const interior = tiles.filter(
    (t) =>
      Math.max(Math.abs(t.q), Math.abs(t.r), Math.abs(-t.q - t.r)) <=
      GRID_RADIUS - 1,
  );

  const numLakes = randRange(rng, NUM_LAKES_MIN, NUM_LAKES_MAX);
  const centers: Tile[] = [];
  let attempts = 100;
  while (centers.length < numLakes && attempts-- > 0) {
    const cand = interior[Math.floor(rng() * interior.length)];
    if (
      centers.some(
        (c) => hexDistance(c.q, c.r, cand.q, cand.r) < MIN_LAKE_SEPARATION,
      )
    ) {
      continue;
    }
    centers.push(cand);
    cand.biome = "water";

    const ns = neighbors(cand.q, cand.r);
    shuffle(ns, rng);
    const want = randRange(rng, LAKE_NEIGHBORS_MIN, LAKE_NEIGHBORS_MAX);
    for (let i = 0; i < want && i < ns.length; i++) {
      const [nq, nr] = ns[i];
      const t = tileMap.get(coordKey(nq, nr));
      if (t) t.biome = "water";
    }
  }
}

// --- Chemins (rivières + routes) en marche aléatoire biaisée ---
//
// On tire un start sur le bord du disque, un end sur le bord opposé (parmi
// les 5 tuiles les plus éloignées de start) puis on effectue une marche
// aléatoire où chaque pas pondère les voisins par leur proximité à end +
// un facteur de bruit (= méandre). Pour chaque tuile retenue, on calcule
// (inEdge, outEdge) que le rendu utilisera pour choisir la bonne variante
// KayKit (A=droite, B=60°, C=120°) et la rotation.

const PATH_RANDOMNESS = 0.5;
const PATH_MAX_STEPS = GRID_RADIUS * 4;

export function placePath(
  tiles: Tile[],
  rng: () => number,
  type: TilePath["type"],
): void {
  const tileMap = indexTiles(tiles);
  const route = randomWalk(rng, tileMap, type);
  if (route.length < 2) return;

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
    if (type === "river") tile.biome = "water";
  }
}

function randomWalk(
  rng: () => number,
  tileMap: Map<string, Tile>,
  type: TilePath["type"],
): Array<[number, number]> {
  const borders = borderTiles();
  const start = borders[Math.floor(rng() * borders.length)];

  // End : parmi les 5 tuiles de bord les plus éloignées
  const ranked = borders
    .map((b) => ({ t: b, d: hexDistance(start[0], start[1], b[0], b[1]) }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 5);
  const end = ranked[Math.floor(rng() * ranked.length)].t;

  const path: Array<[number, number]> = [start];
  const visited = new Set<string>([coordKey(start[0], start[1])]);
  let current = start;

  for (let step = 0; step < PATH_MAX_STEPS; step++) {
    if (current[0] === end[0] && current[1] === end[1]) break;

    const ns = neighbors(current[0], current[1]).filter(([q, r]) => {
      if (visited.has(coordKey(q, r))) return false;
      const t = tileMap.get(coordKey(q, r));
      if (!t) return false;
      // Une route ne traverse pas l'eau ni un chemin déjà posé.
      if (type === "road" && (t.biome === "water" || t.path)) return false;
      return true;
    });
    if (ns.length === 0) break;

    const weighted = ns.map(([q, r]) => {
      const d = hexDistance(q, r, end[0], end[1]);
      const proximity = 1 / (1 + d);
      const noise = rng() * PATH_RANDOMNESS;
      return [[q, r] as [number, number], proximity + noise] as const;
    });
    const next = pickWeighted(weighted, rng);
    path.push(next);
    visited.add(coordKey(next[0], next[1]));
    current = next;
  }
  return path;
}

// L'arête « extérieure » d'une tuile de bord, en excluant éventuellement une
// arête (utile pour les tuiles de départ/fin de chemin où l'arête interne
// est déjà fixée et on veut une autre arête tournée vers l'extérieur).
function outwardEdgeExcluding(q: number, r: number, excludeEdge: number): number {
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    if (i === excludeEdge) continue;
    const [dq, dr] = HEX_DIRECTIONS[i];
    if (!isInsideGrid(q + dq, r + dr)) return i;
  }
  // Pas d'arête extérieure dispo (tuile interne) → fallback : on prend
  // l'opposé de l'arête exclue pour faire une ligne droite à travers.
  return (excludeEdge + 3) % 6;
}

// --- Helpers internes ---

function indexTiles(tiles: Tile[]): Map<string, Tile> {
  const map = new Map<string, Tile>();
  for (const t of tiles) map.set(coordKey(t.q, t.r), t);
  return map;
}

function coordKey(q: number, r: number): string {
  return `${q}:${r}`;
}

function randRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// --- Entry point ---

export function buildMap(seed: number): Tile[] {
  const rng = mulberry32(seed);
  const tiles = generateTiles(rng);
  placeLakes(tiles, rng);
  placePath(tiles, rng, "river");
  placePath(tiles, rng, "road");
  return tiles;
}
