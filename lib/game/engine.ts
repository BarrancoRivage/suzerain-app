// Game engine : tick (production), placeBuilding (action joueur),
// createInitialState (orchestration de la procgen via mapgen.ts).
// Pas de logique procgen / hex math ici : tout est dans mapgen.ts + hex.ts.

import { BUILDINGS } from "./buildings";
import { isInsideGrid } from "./hex";
import { buildMap } from "./mapgen";
import { hashString } from "./rng";
import {
  GameError,
  STATE_VERSION,
  type BuildingKind,
  type GameState,
  type ResourceKind,
  type Resources,
} from "./types";

export function createInitialState(playerId: string, now: number): GameState {
  return {
    version: STATE_VERSION,
    playerId,
    createdAt: now,
    lastTickAt: now,
    tiles: buildMap(hashString(playerId)),
    resources: emptyResources(),
  };
}

export function tick(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  if (elapsedMs === 0) return state;

  const elapsedSeconds = elapsedMs / 1000;
  const produced = emptyResources();
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
  if (tile.path) {
    throw new GameError(
      "NOT_BUILDABLE",
      tile.path.type === "river"
        ? "Le cours d'eau traverse cette tuile."
        : "Une route traverse déjà cette tuile.",
    );
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
  const total = emptyResources();
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    total[def.produces] += def.ratePerSecond;
  }
  return total;
}

function emptyResources(): Resources {
  return { grain: 0, gold: 0 };
}

function addResources(a: Resources, b: Resources): Resources {
  return { grain: a.grain + b.grain, gold: a.gold + b.gold };
}
