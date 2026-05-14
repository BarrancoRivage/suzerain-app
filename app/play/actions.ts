"use server";

import { GameError } from "@/lib/game/types";
import {
  createInitialState,
  placeBuilding,
  tick,
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lettres (accents inclus — jeu francophone), chiffres, espace, apostrophe,
// tiret. 2 à 24 caractères. Rejette les chevrons et caractères de contrôle.
const NAME_RE = /^[\p{L}\p{N} '\-]{2,24}$/u;

function validateName(rawName: string): string {
  const name = rawName.trim();
  if (!NAME_RE.test(name)) {
    throw new GameError(
      "INVALID_NAME",
      "Le nom doit faire 2 à 24 caractères (lettres, chiffres, espace, ' ou -).",
    );
  }
  return name;
}

export async function loadGameAction(): Promise<LoadGameResult> {
  try {
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const existing = await loadState(playerId);
    const base = existing ?? createInitialState(playerId, now);
    const ticked = tick(base, now);
    await saveState(ticked);
    const name = await getPlayerName(playerId);
    return { ok: true, state: ticked, playerId, name };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function placeBuildingAction(
  q: number,
  r: number,
  kind: BuildingKind,
): Promise<GameActionResult> {
  try {
    // playerId vient TOUJOURS du cookie — jamais d'un paramètre client. On ne
    // peut construire que sur son propre fief.
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const existing = await loadState(playerId);
    const base = existing ?? createInitialState(playerId, now);
    const ticked = tick(base, now);
    const updated = placeBuilding(ticked, q, r, kind);
    await saveState(updated);
    return { ok: true, state: updated };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function upgradeBuildingAction(
  q: number,
  r: number,
): Promise<GameActionResult> {
  try {
    // playerId vient TOUJOURS du cookie — on n'améliore que son propre fief.
    const playerId = await getOrCreatePlayerId();
    const now = Date.now();
    const existing = await loadState(playerId);
    const base = existing ?? createInitialState(playerId, now);
    const ticked = tick(base, now);
    const updated = upgradeBuilding(ticked, q, r);
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
    if (!UUID_RE.test(targetPlayerId)) {
      throw new GameError("INVALID_TARGET", "Joueur introuvable.");
    }
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

function toErrorResult(error: unknown): {
  ok: false;
  code: string;
  message: string;
} {
  if (error instanceof GameError) {
    return { ok: false, code: error.code, message: error.message };
  }
  const message =
    error instanceof Error ? error.message : "Erreur inconnue côté serveur.";
  return { ok: false, code: "INTERNAL", message };
}
