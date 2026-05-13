import { biomeAt, isBuildable } from "./biome";
import { BUILDINGS } from "./buildings";
import {
  GRID_SIZE,
  GameError,
  STATE_VERSION,
  type BuildingKind,
  type GameState,
  type ResourceKind,
  type Resources,
  type Tile,
} from "./types";

export function createInitialState(playerId: string, now: number): GameState {
  const tiles: Tile[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      tiles.push({ x, y, building: null });
    }
  }
  return {
    version: STATE_VERSION,
    playerId,
    createdAt: now,
    lastTickAt: now,
    tiles,
    resources: { grain: 0 },
  };
}

export function tick(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  if (elapsedMs === 0) return state;

  const elapsedSeconds = elapsedMs / 1000;
  const produced: Resources = { grain: 0 };

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
  x: number,
  y: number,
  kind: BuildingKind,
): GameState {
  if (!isInsideGrid(x, y)) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const index = tileIndex(x, y);
  const tile = state.tiles[index];
  if (tile.building !== null) {
    throw new GameError("TILE_OCCUPIED", "Cette tuile est déjà bâtie.");
  }

  if (!isBuildable(biomeAt(state.playerId, x, y))) {
    throw new GameError(
      "BIOME_NOT_BUILDABLE",
      "Cette parcelle ne peut accueillir de bâtiment.",
    );
  }

  const def = BUILDINGS[kind];
  for (const [resource, amount] of Object.entries(def.cost) as Array<
    [ResourceKind, number]
  >) {
    if ((state.resources[resource] ?? 0) < amount) {
      throw new GameError(
        "INSUFFICIENT_RESOURCES",
        `Il manque ${def.label.toLowerCase()} : ${amount} ${resource} requis.`,
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
  const total: Resources = { grain: 0 };
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    total[def.produces] += def.ratePerSecond;
  }
  return total;
}

function isInsideGrid(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

function tileIndex(x: number, y: number): number {
  return y * GRID_SIZE + x;
}

function addResources(a: Resources, b: Resources): Resources {
  return { grain: (a.grain ?? 0) + (b.grain ?? 0) };
}
