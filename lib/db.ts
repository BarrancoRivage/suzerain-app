// Dispatcher DB. Choix du backend basé sur les env vars présentes :
//   - prod (Vercel-Supabase) : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY →
//     Supabase JS (REST HTTPS). Stable, pas de cert pooler à gérer.
//   - dev (Docker compose) : DATABASE_URL → pg en plain TCP sur le
//     container `postgres` local.
//
// Les deux modules backend sont importés au top-level mais n'ouvrent leur
// connexion qu'au premier query (createClient / new Pool dans des getters
// mémoïsés). Aucune connexion superflue n'est tentée.

import {
  getPlayerNamePg,
  listPlayersPg,
  loadStatePg,
  saveStatePg,
  setPlayerNamePg,
} from "./db/pg";
import {
  getPlayerNameSupabase,
  listPlayersSupabase,
  loadStateSupabase,
  saveStateSupabase,
  setPlayerNameSupabase,
} from "./db/supabase";
import type { GameState, PlayerSummary } from "./game/types";

type Backend = {
  loadState: (playerId: string) => Promise<GameState | null>;
  saveState: (state: GameState) => Promise<void>;
  getPlayerName: (playerId: string) => Promise<string | null>;
  setPlayerName: (playerId: string, name: string) => Promise<void>;
  listPlayers: () => Promise<PlayerSummary[]>;
};

let cachedBackend: Backend | null = null;

function resolveBackend(): Backend {
  if (cachedBackend) return cachedBackend;

  const hasSupabase =
    Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasSupabase) {
    cachedBackend = {
      loadState: loadStateSupabase,
      saveState: saveStateSupabase,
      getPlayerName: getPlayerNameSupabase,
      setPlayerName: setPlayerNameSupabase,
      listPlayers: listPlayersSupabase,
    };
  } else if (process.env.DATABASE_URL) {
    cachedBackend = {
      loadState: loadStatePg,
      saveState: saveStatePg,
      getPlayerName: getPlayerNamePg,
      setPlayerName: setPlayerNamePg,
      listPlayers: listPlayersPg,
    };
  } else {
    throw new Error(
      "Aucun backend DB configuré. En dev : `docker compose up` (DATABASE_URL). " +
        "En prod : intégration Vercel↔Supabase (SUPABASE_URL + " +
        "SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return cachedBackend;
}

export async function loadState(playerId: string): Promise<GameState | null> {
  return resolveBackend().loadState(playerId);
}

export async function saveState(state: GameState): Promise<void> {
  return resolveBackend().saveState(state);
}

export async function getPlayerName(
  playerId: string,
): Promise<string | null> {
  return resolveBackend().getPlayerName(playerId);
}

export async function setPlayerName(
  playerId: string,
  name: string,
): Promise<void> {
  return resolveBackend().setPlayerName(playerId, name);
}

export async function listPlayers(): Promise<PlayerSummary[]> {
  return resolveBackend().listPlayers();
}
