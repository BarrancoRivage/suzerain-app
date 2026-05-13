// Dispatcher DB. Choix du backend basé sur les env vars présentes :
//   - prod (Vercel-Supabase) : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY →
//     Supabase JS (REST HTTPS). Stable, pas de cert pooler à gérer.
//   - dev (Docker compose) : DATABASE_URL → pg en plain TCP sur le
//     container `postgres` local.
//
// Les deux modules backend sont importés au top-level mais n'ouvrent leur
// connexion qu'au premier query (createClient / new Pool dans des getters
// mémoïsés). Aucune connexion superflue n'est tentée.

import { loadStatePg, saveStatePg } from "./db/pg";
import { loadStateSupabase, saveStateSupabase } from "./db/supabase";
import type { GameState } from "./game/types";

type Backend = {
  loadState: (playerId: string) => Promise<GameState | null>;
  saveState: (state: GameState) => Promise<void>;
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
    };
  } else if (process.env.DATABASE_URL) {
    cachedBackend = { loadState: loadStatePg, saveState: saveStatePg };
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
