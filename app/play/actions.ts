"use server";

import { GameError } from "@/lib/game/types";
import {
  assignWorker,
  createInitialState,
  placeBuilding,
  sellBuilding,
  tick,
  unassignWorker,
  upgradeBuilding,
} from "@/lib/game/engine";
import type {
  BuildingKind,
  GameState,
  PlayerSummary,
} from "@/lib/game/types";
import {
  getPlayerName,
  listPlayers,
  loadState,
  saveState,
  setPlayerName,
} from "@/lib/db";
import { getOrCreatePlayerId } from "@/lib/session";
import {
  assertPlayerId,
  toErrorResult,
  validateName,
} from "@/lib/game/validation";

export type GameActionResult =
  | { ok: true; state: GameState }
  | { ok: false; code: string; message: string };

export type LoadGameResult =
  | { ok: true; state: GameState; playerId: string; name: string | null }
  | { ok: false; code: string; message: string };

export type ViewPlayerResult =
  | { ok: true; state: GameState; playerId: string; name: string | null }
  | { ok: false; code: string; message: string };

export type SetNameResult =
  | { ok: true; name: string }
  | { ok: false; code: string; message: string };

export type ListPlayersResult =
  | { ok: true; players: PlayerSummary[] }
  | { ok: false; code: string; message: string };

export async function loadGameAction(): Promise<LoadGameResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    await saveState(ticked);
    const name = await getPlayerName(playerId);
    return { ok: true, state: ticked, playerId, name };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function placeBuildingAction(
  x: number,
  z: number,
  kind: BuildingKind,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    const updated = placeBuilding(ticked, x, z, kind);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function upgradeBuildingAction(
  buildingId: string,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    const updated = upgradeBuilding(ticked, buildingId);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function sellBuildingAction(
  buildingId: string,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    const updated = sellBuilding(ticked, buildingId);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function assignWorkerAction(
  buildingId: string,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    const updated = assignWorker(ticked, buildingId);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function unassignWorkerAction(
  buildingId: string,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const ticked = await loadOwnTickedState(playerId, now);
    const updated = unassignWorker(ticked, buildingId);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function setPlayerNameAction(
  rawName: string,
): Promise<SetNameResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const name = validateName(rawName);
    await setPlayerName(playerId, name);
    return { ok: true, name };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function loadPlayerStateAction(
  targetPlayerId: string,
): Promise<ViewPlayerResult> {
  try {
    assertPlayerId(targetPlayerId);
    const existing = await loadState(targetPlayerId);
    if (existing === null) {
      throw new GameError(
        "NO_STATE",
        "Ce joueur n'a pas encore de fief à visiter.",
      );
    }
    // Lecture seule : on tick en mémoire pour un affichage à jour, mais on ne
    // sauvegarde JAMAIS l'état d'un autre joueur depuis une requête de visite.
    const ticked = tick(existing, Date.now());
    const name = await getPlayerName(targetPlayerId);
    return { ok: true, state: ticked, playerId: targetPlayerId, name };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function listPlayersAction(): Promise<ListPlayersResult> {
  try {
    const players = await listPlayers();
    return { ok: true, players };
  } catch (error) {
    return toErrorResult(error);
  }
}

async function loadOwnTickedState(
  playerId: string,
  now: number,
): Promise<GameState> {
  const existing = await loadState(playerId);
  return tick(existing ?? createInitialState(playerId, now), now);
}
