// Helpers partagés entre les server actions (`app/play/actions.ts`,
// `app/admin/actions.ts`). Validation des inputs côté serveur + normalisation
// d'erreurs en Result union pour ne jamais throw au client.

import { GameError } from "./types";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lettres (accents inclus — jeu francophone), chiffres, espace, apostrophe,
// tiret. 2 à 24 caractères. Rejette les chevrons et caractères de contrôle.
const NAME_RE = /^[\p{L}\p{N} '\-]{2,24}$/u;

export function validateName(rawName: string): string {
  const name = rawName.trim();
  if (!NAME_RE.test(name)) {
    throw new GameError(
      "INVALID_NAME",
      "Le nom doit faire 2 à 24 caractères (lettres, chiffres, espace, ' ou -).",
    );
  }
  return name;
}

export function assertPlayerId(value: string): string {
  if (!UUID_RE.test(value)) {
    throw new GameError("INVALID_TARGET", "Joueur introuvable.");
  }
  return value;
}

export type ErrorResult = { ok: false; code: string; message: string };

export function toErrorResult(error: unknown): ErrorResult {
  if (error instanceof GameError) {
    return { ok: false, code: error.code, message: error.message };
  }
  const message =
    error instanceof Error ? error.message : "Erreur inconnue côté serveur.";
  return { ok: false, code: "INTERNAL", message };
}
