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

const BIOMES: readonly Biome[] = ["plain", "forest", "hill"];
const BIOME_WEIGHTS: Readonly<Record<Biome, number>> = {
  plain: 5,
  forest: 3,
  hill: 2,
};

export function createInitialState(playerId: string, now: number): GameState {
  const rng = mulberry32(hashString(playerId));
  const tiles: Tile[] = [];
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    const rMin = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
    const rMax = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      tiles.push({ q, r, biome: pickBiome(rng), building: null });
    }
  }
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

function pickBiome(rng: () => number): Biome {
  const totalWeight = BIOMES.reduce((sum, b) => sum + BIOME_WEIGHTS[b], 0);
  let roll = rng() * totalWeight;
  for (const biome of BIOMES) {
    roll -= BIOME_WEIGHTS[biome];
    if (roll <= 0) return biome;
  }
  return "plain";
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
