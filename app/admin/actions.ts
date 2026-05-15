"use server";

// ⚠️ Actions admin. Pour l'instant AUCUN gating (cf. décision dev). À gater
// avant déploiement prod (Supabase Auth + check d'un rôle `admin` ou env var
// `ADMIN_PLAYER_IDS`). Voir `app/admin/page.tsx` pour le bandeau d'avertissement.

import {
  deletePlayer,
  getPlayerName,
  listPlayers,
  loadState,
  resetWorld,
  saveState,
  setPlayerName,
} from "@/lib/db";
import { RESOURCE_KINDS } from "@/lib/game/resources";
import {
  GameError,
  type PlayerSummary,
  type Resources,
  type ResourceKind,
} from "@/lib/game/types";
import {
  assertPlayerId,
  toErrorResult,
  validateName,
} from "@/lib/game/validation";

export type AdminPlayerRow = PlayerSummary & {
  hasState: boolean;
  resources: Resources | null;
};

export type ListAdminPlayersResult =
  | { ok: true; players: AdminPlayerRow[] }
  | { ok: false; code: string; message: string };

export type AdminMutationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type UpdateNameResult =
  | { ok: true; name: string }
  | { ok: false; code: string; message: string };

// Charge la liste enrichie (PlayerSummary + Resources + flag d'état périmé).
// N+1 sur loadState volontaire (un appel par joueur) — acceptable à l'échelle
// dev. Si le state ne charge pas (version périmée), on renvoie resources=null
// et hasState=false : l'UI désactive l'édition des ressources sur cette ligne.
export async function listAdminPlayersAction(): Promise<ListAdminPlayersResult> {
  try {
    const summaries = await listPlayers();
    const rows = await Promise.all(
      summaries.map(async (summary): Promise<AdminPlayerRow> => {
        const state = await loadState(summary.playerId);
        return {
          ...summary,
          hasState: state !== null,
          resources: state?.resources ?? null,
        };
      }),
    );
    return { ok: true, players: rows };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updatePlayerNameAction(
  playerId: string,
  rawName: string,
): Promise<UpdateNameResult> {
  try {
    assertPlayerId(playerId);
    const name = validateName(rawName);
    await setPlayerName(playerId, name);
    return { ok: true, name };
  } catch (error) {
    return toErrorResult(error);
  }
}

// Patch partiel sur state.resources. On NE tick PAS — l'admin écrit des
// valeurs brutes que le moteur écraserait sinon avec les flux courants.
export async function updatePlayerResourcesAction(
  playerId: string,
  patch: Partial<Record<ResourceKind, number>>,
): Promise<AdminMutationResult> {
  try {
    assertPlayerId(playerId);
    const state = await loadState(playerId);
    if (state === null) {
      throw new GameError(
        "NO_STATE",
        "Pas d'état chargeable pour ce joueur (peut-être périmé).",
      );
    }
    const nextResources = { ...state.resources };
    for (const [key, value] of Object.entries(patch)) {
      const kind = key as ResourceKind;
      if (!RESOURCE_KINDS.includes(kind)) {
        throw new GameError("INVALID_RESOURCE", `Ressource inconnue : ${key}.`);
      }
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new GameError(
          "INVALID_VALUE",
          `Valeur invalide pour ${key} (doit être un nombre ≥ 0).`,
        );
      }
      nextResources[kind] = value;
    }
    await saveState({ ...state, resources: nextResources });
    return { ok: true };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function deletePlayerAction(
  playerId: string,
): Promise<AdminMutationResult> {
  try {
    assertPlayerId(playerId);
    await deletePlayer(playerId);
    return { ok: true };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function resetWorldAction(): Promise<AdminMutationResult> {
  try {
    await resetWorld();
    return { ok: true };
  } catch (error) {
    return toErrorResult(error);
  }
}

// Utilitaire pour la page : récupère le nom courant d'un joueur sans charger
// son state (utile si on veut éviter le coût N+1 pour un usage ciblé).
export async function getPlayerNameAction(
  playerId: string,
): Promise<{ ok: true; name: string | null } | { ok: false; code: string; message: string }> {
  try {
    assertPlayerId(playerId);
    const name = await getPlayerName(playerId);
    return { ok: true, name };
  } catch (error) {
    return toErrorResult(error);
  }
}
