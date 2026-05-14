// Game engine : tick (production), placeBuilding (action joueur),
// createInitialState (orchestration de la procgen via mapgen.ts).
// Pas de logique procgen / hex math ici : tout est dans mapgen.ts + hex.ts.

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
  type Building,
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
    resources: { ...emptyResources(), gold: 100, wood: 20 },
  };
}

// Production réelle par seconde d'un bâtiment = taux par ouvrier × ouvriers
// assignés. Un bâtiment de logement ne produit rien au tick (il fournit sa
// population à la pose) ; un bâtiment de production sans ouvrier produit 0.
export function effectiveRate(building: Building): number {
  if (isHousing(building.kind)) return 0;
  return buildingRate(building.kind, building.level) * building.workers;
}

export function tick(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastTickAt);
  if (elapsedMs === 0) return state;

  const elapsedSeconds = elapsedMs / 1000;
  const produced = emptyResources();
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    produced[def.produces] += effectiveRate(tile.building) * elapsedSeconds;
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

  // Un bâtiment de logement fournit sa population immédiatement à la pose.
  if (isHousing(kind)) {
    nextResources.population += populationCapacityAt(kind, 1);
  }

  const nextTiles = state.tiles.slice();
  nextTiles[index] = {
    ...tile,
    building: { kind, placedAt: state.lastTickAt, level: 1, workers: 0 },
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

  // Améliorer une maison ajoute la population gagnée entre les deux niveaux.
  if (isHousing(building.kind)) {
    nextResources.population +=
      populationCapacityAt(building.kind, building.level + 1) -
      populationCapacityAt(building.kind, building.level);
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

  // Revendre une maison retire la population qu'elle fournissait. On refuse si
  // cela rendrait la population insuffisante pour les ouvriers déjà assignés —
  // le joueur doit d'abord les désassigner.
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
    total[def.produces] += effectiveRate(tile.building);
  }
  return total;
}

// Population actuellement assignée comme ouvriers, tous bâtiments confondus.
export function assignedPopulation(state: GameState): number {
  let total = 0;
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    total += tile.building.workers;
  }
  return total;
}

// Population libre, assignable à un bâtiment. `resources.population` est le
// total fourni par les maisons ; on en retire les ouvriers déjà placés.
export function availablePopulation(state: GameState): number {
  return state.resources.population - assignedPopulation(state);
}

// Trouve une tuile bâtie, en factorisant les gardes communes à assign/unassign.
function findBuiltTile(
  state: GameState,
  q: number,
  r: number,
): { index: number; building: Building } {
  if (!isInsideGrid(q, r)) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }
  const index = state.tiles.findIndex((t) => t.q === q && t.r === r);
  if (index < 0) {
    throw new GameError("OUT_OF_BOUNDS", "Cette tuile n'existe pas.");
  }
  const building = state.tiles[index].building;
  if (building === null) {
    throw new GameError("NO_BUILDING", "Aucun bâtiment sur cette tuile.");
  }
  return { index, building };
}

export function assignWorker(
  state: GameState,
  q: number,
  r: number,
): GameState {
  const { index, building } = findBuiltTile(state, q, r);

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

  const tile = state.tiles[index];
  const nextTiles = state.tiles.slice();
  nextTiles[index] = {
    ...tile,
    building: { ...building, workers: building.workers + 1 },
  };
  return { ...state, tiles: nextTiles };
}

export function unassignWorker(
  state: GameState,
  q: number,
  r: number,
): GameState {
  const { index, building } = findBuiltTile(state, q, r);

  if (building.workers <= 0) {
    throw new GameError(
      "NO_WORKERS_ASSIGNED",
      "Aucun ouvrier à retirer de ce bâtiment.",
    );
  }

  const tile = state.tiles[index];
  const nextTiles = state.tiles.slice();
  nextTiles[index] = {
    ...tile,
    building: { ...building, workers: building.workers - 1 },
  };
  return { ...state, tiles: nextTiles };
}

// Normalise un état chargé depuis la persistance : complète `resources` avec
// les clés ajoutées depuis sa dernière sauvegarde (états ne portant que
// grain/gold) et garantit `workers` sur chaque bâtiment. Idempotent. Branché
// dans les backends DB (loadState*) — un seul point couvre tous les chemins de
// chargement. Voir normalizeResources.
export function migrateState(state: GameState): GameState {
  return {
    ...state,
    resources: normalizeResources(state.resources),
    tiles: state.tiles.map((tile) =>
      tile.building === null
        ? tile
        : { ...tile, building: { ...tile.building, workers: tile.building.workers ?? 0 } },
    ),
  };
}
