import { BUILDINGS } from "./buildings";
import {
  GRID_RADIUS,
  GameError,
  STATE_VERSION,
  type Biome,
  type BuildingKind,
  type GameState,
  type ResourceKind,
  type Resources,
  type Tile,
} from "./types";

const LAND_BIOMES: readonly Biome[] = ["plain", "forest", "hill"];
const LAND_WEIGHTS: Readonly<Record<Exclude<Biome, "water">, number>> = {
  plain: 5,
  forest: 3,
  hill: 2,
};

const NUM_LAKES_MIN = 3;
const NUM_LAKES_MAX = 5;
const LAKE_NEIGHBORS_MIN = 1;
const LAKE_NEIGHBORS_MAX = 3;
const MIN_LAKE_SEPARATION = 3; // distance hex entre centres de lacs

export function createInitialState(playerId: string, now: number): GameState {
  const rng = mulberry32(hashString(playerId));
  const tiles: Tile[] = [];
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    const rMin = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
    const rMax = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      tiles.push({ q, r, biome: pickLandBiome(rng), building: null });
    }
  }
  placeLakes(tiles, rng);
  return {
    version: STATE_VERSION,
    playerId,
    createdAt: now,
    lastTickAt: now,
    tiles,
    resources: emptyResources(),
  };
}

export function tick(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  if (elapsedMs === 0) return state;

  const elapsedSeconds = elapsedMs / 1000;
  const produced: Resources = emptyResources();

  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    produced[def.produces] += def.ratePerSecond * elapsedSeconds;
  }

  return {
    ...state,
    lastTickAt: now,
    resources: addResources(state.resources, produced),
  };
}

export function placeBuilding(
  state: GameState,
  q: number,
  r: number,
  kind: BuildingKind,
): GameState {
  if (!isInsideGrid(q, r)) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const index = state.tiles.findIndex((t) => t.q === q && t.r === r);
  if (index < 0) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const tile = state.tiles[index];
  if (tile.biome === "water") {
    throw new GameError("NOT_BUILDABLE", "On ne bâtit pas sur l'eau.");
  }
  if (tile.building !== null) {
    throw new GameError("TILE_OCCUPIED", "Cette tuile est déjà bâtie.");
  }

  const def = BUILDINGS[kind];
  for (const [resource, amount] of Object.entries(def.cost) as Array<
    [ResourceKind, number]
  >) {
    if ((state.resources[resource] ?? 0) < amount) {
      throw new GameError(
        "INSUFFICIENT_RESOURCES",
        `Ressources insuffisantes pour ${def.label.toLowerCase()}.`,
      );
    }
  }

  const nextResources: Resources = { ...state.resources };
  for (const [resource, amount] of Object.entries(def.cost) as Array<
    [ResourceKind, number]
  >) {
    nextResources[resource] = (nextResources[resource] ?? 0) - amount;
  }

  const nextTiles = state.tiles.slice();
  nextTiles[index] = {
    ...tile,
    building: { kind, placedAt: state.lastTickAt },
  };

  return {
    ...state,
    tiles: nextTiles,
    resources: nextResources,
  };
}

export function productionPerSecond(state: GameState): Resources {
  const total: Resources = emptyResources();
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    total[def.produces] += def.ratePerSecond;
  }
  return total;
}

const NEIGHBOR_DIRS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0],
  [-1, 0],
  [0, +1],
  [0, -1],
  [+1, -1],
  [-1, +1],
];

export function neighbors(q: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [dq, dr] of NEIGHBOR_DIRS) {
    const nq = q + dq;
    const nr = r + dr;
    if (isInsideGrid(nq, nr)) out.push([nq, nr]);
  }
  return out;
}

function emptyResources(): Resources {
  return { grain: 0, gold: 0 };
}

function isInsideGrid(q: number, r: number): boolean {
  if (!Number.isInteger(q) || !Number.isInteger(r)) return false;
  const s = -q - r;
  return (
    Math.abs(q) <= GRID_RADIUS &&
    Math.abs(r) <= GRID_RADIUS &&
    Math.abs(s) <= GRID_RADIUS
  );
}

function addResources(a: Resources, b: Resources): Resources {
  return {
    grain: a.grain + b.grain,
    gold: a.gold + b.gold,
  };
}

function pickLandBiome(rng: () => number): Biome {
  const totalWeight = LAND_BIOMES.reduce(
    (sum, b) => sum + LAND_WEIGHTS[b as Exclude<Biome, "water">],
    0,
  );
  let roll = rng() * totalWeight;
  for (const biome of LAND_BIOMES) {
    roll -= LAND_WEIGHTS[biome as Exclude<Biome, "water">];
    if (roll <= 0) return biome;
  }
  return "plain";
}

// Génère 3-5 lacs en clusters : un centre + 1-3 voisins. Les centres sont
// espacés d'au moins MIN_LAKE_SEPARATION pour éviter qu'ils ne fusionnent
// en grande mer. Les centres restent à l'intérieur (rayon ≤ GRID_RADIUS-1)
// pour ne pas mordre sur le bord.
function placeLakes(tiles: Tile[], rng: () => number): void {
  const tileMap = new Map<string, Tile>();
  for (const t of tiles) tileMap.set(`${t.q}:${t.r}`, t);

  const interior = tiles.filter((t) => {
    const s = -t.q - t.r;
    return (
      Math.abs(t.q) <= GRID_RADIUS - 1 &&
      Math.abs(t.r) <= GRID_RADIUS - 1 &&
      Math.abs(s) <= GRID_RADIUS - 1
    );
  });

  const numLakes =
    NUM_LAKES_MIN + Math.floor(rng() * (NUM_LAKES_MAX - NUM_LAKES_MIN + 1));
  const centers: Tile[] = [];

  let attempts = 100;
  while (centers.length < numLakes && attempts-- > 0) {
    const cand = interior[Math.floor(rng() * interior.length)];
    const tooClose = centers.some(
      (c) => hexDistance(c.q, c.r, cand.q, cand.r) < MIN_LAKE_SEPARATION,
    );
    if (tooClose) continue;
    centers.push(cand);
    cand.biome = "water";

    const ns = neighbors(cand.q, cand.r);
    shuffle(ns, rng);
    const want =
      LAKE_NEIGHBORS_MIN +
      Math.floor(rng() * (LAKE_NEIGHBORS_MAX - LAKE_NEIGHBORS_MIN + 1));
    for (let i = 0; i < want && i < ns.length; i++) {
      const [nq, nr] = ns[i];
      const t = tileMap.get(`${nq}:${nr}`);
      if (t) t.biome = "water";
    }
  }
}

function hexDistance(
  q1: number,
  r1: number,
  q2: number,
  r2: number,
): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
