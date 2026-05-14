// Game engine : tick (production), placeBuilding (action joueur),
// createInitialState (orchestration de la procgen via mapgen.ts).
// Pas de logique procgen / hex math ici : tout est dans mapgen.ts + hex.ts.

import { BUILDINGS } from "./buildings";
import { buildingRate, isMaxLevel, sellRefund, upgradeCost } from "./config";
import { isInsideGrid } from "./hex";
import { buildMap } from "./mapgen";
import {
  addResources,
  emptyResources,
  normalizeResources,
} from "./resources";
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
    resources: { ...emptyResources(), gold: 100 },
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
    const rate = buildingRate(tile.building.kind, tile.building.level);
    produced[def.produces] += rate * elapsedSeconds;
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
    building: { kind, placedAt: state.lastTickAt, level: 1 },
  };

  return {
    ...state,
    tiles: nextTiles,
    resources: nextResources,
  };
}

export function upgradeBuilding(
  state: GameState,
  q: number,
  r: number,
): GameState {
  if (!isInsideGrid(q, r)) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const index = state.tiles.findIndex((t) => t.q === q && t.r === r);
  if (index < 0) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const tile = state.tiles[index];
  const building = tile.building;
  if (building === null) {
    throw new GameError("NO_BUILDING", "Aucun bâtiment à améliorer ici.");
  }
  if (isMaxLevel(building.kind, building.level)) {
    throw new GameError(
      "MAX_LEVEL",
      "Ce bâtiment est déjà au niveau maximal.",
    );
  }

  const cost = upgradeCost(building.kind, building.level);
  for (const [resource, amount] of Object.entries(cost) as Array<
    [ResourceKind, number]
  >) {
    if ((state.resources[resource] ?? 0) < amount) {
      throw new GameError(
        "INSUFFICIENT_RESOURCES",
        `Ressources insuffisantes pour améliorer ${BUILDINGS[
          building.kind
        ].label.toLowerCase()}.`,
      );
    }
  }

  const nextResources: Resources = { ...state.resources };
  for (const [resource, amount] of Object.entries(cost) as Array<
    [ResourceKind, number]
  >) {
    nextResources[resource] = (nextResources[resource] ?? 0) - amount;
  }

  const nextTiles = state.tiles.slice();
  nextTiles[index] = {
    ...tile,
    building: { ...building, level: building.level + 1 },
  };

  return {
    ...state,
    tiles: nextTiles,
    resources: nextResources,
  };
}

export function sellBuilding(
  state: GameState,
  q: number,
  r: number,
): GameState {
  if (!isInsideGrid(q, r)) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const index = state.tiles.findIndex((t) => t.q === q && t.r === r);
  if (index < 0) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }

  const tile = state.tiles[index];
  const building = tile.building;
  if (building === null) {
    throw new GameError("NO_BUILDING", "Aucun bâtiment à revendre ici.");
  }

  const refund = sellRefund(building.kind, building.level);
  const nextResources: Resources = { ...state.resources };
  for (const [resource, amount] of Object.entries(refund) as Array<
    [ResourceKind, number]
  >) {
    nextResources[resource] = (nextResources[resource] ?? 0) + amount;
  }

  const nextTiles = state.tiles.slice();
  nextTiles[index] = { ...tile, building: null };

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
    total[def.produces] += buildingRate(
      tile.building.kind,
      tile.building.level,
    );
  }
  return total;
}

// Normalise un état chargé depuis la persistance : complète `resources` avec
// les clés ajoutées depuis sa dernière sauvegarde (états ne portant que
// grain/gold). Idempotent. Branché dans les backends DB (loadState*) — un seul
// point couvre tous les chemins de chargement. Voir normalizeResources.
export function migrateState(state: GameState): GameState {
  return { ...state, resources: normalizeResources(state.resources) };
}
