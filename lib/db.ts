import { Pool, type PoolClient } from "pg";

import { STATE_VERSION, type GameState } from "./game/types";

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL non défini. En dev : `docker compose up`. " +
        "En prod : ajouter la connection string Supabase (Settings → Database → Connection pooling, mode `Transaction`) dans Vercel.",
    );
  }

  cachedPool = new Pool({ connectionString: url, max: 5 });
  return cachedPool;
}

export async function loadState(playerId: string): Promise<GameState | null> {
  const { rows } = await getPool().query<{ state: GameState }>(
    "select state from game_states where player_id = $1",
    [playerId],
  );
  if (rows.length === 0) return null;
  const state = rows[0].state;
  if (state.version !== STATE_VERSION) return null;
  return state;
}

export async function saveState(state: GameState): Promise<void> {
  await getPool().query(
    `insert into game_states (player_id, state, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (player_id) do update
       set state = excluded.state,
           updated_at = excluded.updated_at`,
    [state.playerId, JSON.stringify(state)],
  );
}

// Exporté pour les tests éventuels et un nettoyage explicite.
export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
