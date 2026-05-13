"use server";

import { GameError } from "@/lib/game/types";
import {
  createInitialState,
  placeBuilding,
  tick,
} from "@/lib/game/engine";
import type { BuildingKind, GameState } from "@/lib/game/types";
import { loadState, saveState } from "@/lib/supabase";
import { getOrCreatePlayerId } from "@/lib/session";

export type GameActionResult =
  | { ok: true; state: GameState }
  | { ok: false; code: string; message: string };

export async function loadGameAction(): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const existing = await loadState(playerId);
    const base = existing ?? createInitialState(playerId, now);
    const ticked = tick(base, now);
    await saveState(ticked);
    return { ok: true, state: ticked };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function placeBuildingAction(
  x: number,
  y: number,
  kind: BuildingKind,
): Promise<GameActionResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const existing = await loadState(playerId);
    const base = existing ?? createInitialState(playerId, now);
    const ticked = tick(base, now);
    const updated = placeBuilding(ticked, x, y, kind);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

function toErrorResult(error: unknown): GameActionResult {
  if (error instanceof GameError) {
    return { ok: false, code: error.code, message: error.message };
  }
  const message =
    error instanceof Error ? error.message : "Erreur inconnue côté serveur.";
  return { ok: false, code: "INTERNAL", message };
}
