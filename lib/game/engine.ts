// Game engine — version "world-coords" : plus de notion d'hex pour le
// placement. Les bâtiments sont stockés dans `state.buildings` (liste de
// WorldBuilding) avec des coordonnées (x, z) absolues. La validité du
// placement repose sur la procgen continue (cf. lib/game/procgen.ts).

import { BUILDINGS } from "./buildings";
import {
  buildingRate,
  isHousing,
  isMaxLevel,
  populationCapacityAt,
  sellRefund,
  upgradeCost,
  workerCapacity,
} from "./config";
import {
  hasBuildingCollision,
  isInMapBounds,
  isWaterAt,
} from "./procgen";
import {
  addResources,
  emptyResources,
  normalizeResources,
} from "./resources";
import {
  GameError,
  STATE_VERSION,
  type BuildingKind,
  type GameState,
  type LegacyTile,
  type ResourceKind,
  type Resources,
  type WorldBuilding,
} from "./types";

export function createInitialState(playerId: string, now: number): GameState {
  return {
    version: STATE_VERSION,
    playerId,
    createdAt: now,
    lastTickAt: now,
    buildings: [],
    tiles: [],
    resources: { ...emptyResources(), gold: 100, wood: 20 },
  };
}

// Production réelle par seconde d'un bâtiment = taux par ouvrier × ouvriers
// assignés. Les bâtiments d'habitation produisent 0 (population à la pose).
export function effectiveRate(building: WorldBuilding): number {
  if (isHousing(building.kind)) return 0;
  return buildingRate(building.kind, building.level) * building.workers;
}

export function tick(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  if (elapsedMs === 0) return state;
  const elapsedSeconds = elapsedMs / 1000;
  const produced = emptyResources();
  for (const b of state.buildings) {
    const def = BUILDINGS[b.kind];
    produced[def.produces] += effectiveRate(b) * elapsedSeconds;
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
  z: number,
  kind: BuildingKind,
): GameState {
  if (!isInMapBounds(x, z)) {
    throw new GameError("OUT_OF_BOUNDS", "Position hors map.");
  }
  if (isWaterAt(x, z)) {
    throw new GameError("NOT_BUILDABLE", "On ne bâtit pas sur l'eau.");
  }
  if (hasBuildingCollision(state.buildings, x, z)) {
    throw new GameError("TILE_OCCUPIED", "Trop près d'un autre bâtiment.");
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
  if (isHousing(kind)) {
    nextResources.population += populationCapacityAt(kind, 1);
  }

  const newBuilding: WorldBuilding = {
    id: makeBuildingId(),
    kind,
    x,
    z,
    placedAt: state.lastTickAt,
    level: 1,
    workers: 0,
  };
  return {
    ...state,
    buildings: [...state.buildings, newBuilding],
    resources: nextResources,
  };
}

export function upgradeBuilding(
  state: GameState,
  buildingId: string,
): GameState {
  const { index, building } = findBuildingById(state, buildingId);
  if (isMaxLevel(building.kind, building.level)) {
    throw new GameError("MAX_LEVEL", "Ce bâtiment est déjà au niveau maximal.");
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
  if (isHousing(building.kind)) {
    nextResources.population +=
      populationCapacityAt(building.kind, building.level + 1) -
      populationCapacityAt(building.kind, building.level);
  }
  const nextBuildings = state.buildings.slice();
  nextBuildings[index] = { ...building, level: building.level + 1 };
  return { ...state, buildings: nextBuildings, resources: nextResources };
}

export function sellBuilding(
  state: GameState,
  buildingId: string,
): GameState {
  const { index, building } = findBuildingById(state, buildingId);
  const refund = sellRefund(building.kind, building.level);
  const nextResources: Resources = { ...state.resources };
  for (const [resource, amount] of Object.entries(refund) as Array<
    [ResourceKind, number]
  >) {
    nextResources[resource] = (nextResources[resource] ?? 0) + amount;
  }
  if (isHousing(building.kind)) {
    const granted = populationCapacityAt(building.kind, building.level);
    if (state.resources.population - granted < assignedPopulation(state)) {
      throw new GameError(
        "POPULATION_IN_USE",
        "Désassignez des ouvriers avant de revendre cette maison.",
      );
    }
    nextResources.population -= granted;
  }
  const nextBuildings = state.buildings.slice();
  nextBuildings.splice(index, 1);
  return { ...state, buildings: nextBuildings, resources: nextResources };
}

export function productionPerSecond(state: GameState): Resources {
  const total = emptyResources();
  for (const b of state.buildings) {
    const def = BUILDINGS[b.kind];
    total[def.produces] += effectiveRate(b);
  }
  return total;
}

export function assignedPopulation(state: GameState): number {
  let total = 0;
  for (const b of state.buildings) total += b.workers;
  return total;
}

export function availablePopulation(state: GameState): number {
  return state.resources.population - assignedPopulation(state);
}

function findBuildingById(
  state: GameState,
  buildingId: string,
): { index: number; building: WorldBuilding } {
  const index = state.buildings.findIndex((b) => b.id === buildingId);
  if (index < 0) {
    throw new GameError("NO_BUILDING", "Bâtiment introuvable.");
  }
  return { index, building: state.buildings[index] };
}

export function assignWorker(
  state: GameState,
  buildingId: string,
): GameState {
  const { index, building } = findBuildingById(state, buildingId);
  if (isHousing(building.kind)) {
    throw new GameError(
      "NOT_A_WORKPLACE",
      "Une maison n'emploie pas d'ouvriers.",
    );
  }
  if (building.workers >= workerCapacity(building.kind, building.level)) {
    throw new GameError(
      "WORKER_CAPACITY_FULL",
      "Ce bâtiment n'a plus de place — améliorez-le pour ajouter un poste.",
    );
  }
  if (availablePopulation(state) < 1) {
    throw new GameError(
      "NO_AVAILABLE_POPULATION",
      "Aucun sujet disponible — bâtissez une maison.",
    );
  }
  const next = state.buildings.slice();
  next[index] = { ...building, workers: building.workers + 1 };
  return { ...state, buildings: next };
}

export function unassignWorker(
  state: GameState,
  buildingId: string,
): GameState {
  const { index, building } = findBuildingById(state, buildingId);
  if (building.workers <= 0) {
    throw new GameError(
      "NO_WORKERS_ASSIGNED",
      "Aucun ouvrier à retirer de ce bâtiment.",
    );
  }
  const next = state.buildings.slice();
  next[index] = { ...building, workers: building.workers - 1 };
  return { ...state, buildings: next };
}

// Migration v9 (tile.building) → v10 (state.buildings world coords).
// Pour chaque tile avec un building : on convertit (q, r) en coords world
// via la formule axiale (pointy-top, HEX_SIZE=1), on ajoute building.subX
// et building.subZ s'ils existent, et on génère un id stable.
export function migrateState(state: GameState): GameState {
  const buildings: WorldBuilding[] = Array.isArray(state.buildings)
    ? state.buildings.slice()
    : [];

  // Migration des anciens états : tile.building → buildings list.
  if (buildings.length === 0 && Array.isArray(state.tiles)) {
    const SQRT3 = Math.sqrt(3);
    for (const tile of state.tiles as LegacyTile[]) {
      if (!tile.building) continue;
      const x = SQRT3 * (tile.q + tile.r / 2) + (tile.building.subX ?? 0);
      const z = (3 / 2) * tile.r + (tile.building.subZ ?? 0);
      buildings.push({
        id: legacyBuildingId(tile.q, tile.r),
        kind: tile.building.kind,
        x,
        z,
        placedAt: tile.building.placedAt,
        level: tile.building.level,
        workers: tile.building.workers ?? 0,
      });
    }
  }

  return {
    version: STATE_VERSION,
    playerId: state.playerId,
    createdAt: state.createdAt,
    lastTickAt: state.lastTickAt,
    buildings,
    tiles: [], // tile data n'est plus utilisée par le rendu ni l'engine
    resources: normalizeResources(state.resources),
  };
}

function makeBuildingId(): string {
  // crypto.randomUUID disponible côté Node 19+ et tous les browsers modernes.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback minimaliste (pas un vrai UUID mais unique en pratique).
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function legacyBuildingId(q: number, r: number): string {
  return `legacy_${q}_${r}`;
}
