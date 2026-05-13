// Backend Postgres direct via `pg`. Utilisé UNIQUEMENT en dev local sur le
// container Docker compose (pas de SSL, pas de cert managé). Pour la prod,
// on passe par le client Supabase JS (REST HTTPS), cf. lib/db/supabase.ts.

import { Pool } from "pg";

import { STATE_VERSION, type GameState } from "../game/types";

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL manquant. En dev : `docker compose up` injecte " +
        "`postgres://suzerain:suzerain@postgres:5432/suzerain`.",
    );
  }
  // SSL désactivé : ce backend ne s'active que sur le Postgres local du
  // compose. Aucun host distant ne devrait jamais arriver ici (la prod
  // passe par Supabase JS).
  cachedPool = new Pool({ connectionString: url, max: 5, ssl: false });
  return cachedPool;
}

export async function loadStatePg(playerId: string): Promise<GameState | null> {
  const { rows } = await getPool().query<{ state: GameState }>(
    "select state from game_states where player_id = $1",
    [playerId],
  );
  if (rows.length === 0) return null;
  const state = rows[0].state;
  if (state.version !== STATE_VERSION) return null;
  return state;
}

export async function saveStatePg(state: GameState): Promise<void> {
  await getPool().query(
    `insert into game_states (player_id, state, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (player_id) do update
       set state = excluded.state,
           updated_at = excluded.updated_at`,
    [state.playerId, JSON.stringify(state)],
  );
}
