import { Pool, type PoolClient } from "pg";

import { STATE_VERSION, type GameState } from "./game/types";

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;

  // Résolution dans cet ordre :
  //   - DATABASE_URL : valeur custom (utilisée par le compose en dev).
  //   - POSTGRES_URL : pool transaction, auto-provisionné par l'intégration
  //     Vercel↔Supabase (port 6543). C'est la cible en prod.
  //   - POSTGRES_PRISMA_URL : même origine, certains projets n'ont que celle-ci.
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;

  if (!url) {
    throw new Error(
      "Aucune connection string Postgres. En dev : `docker compose up`. " +
        "En prod : vérifier que l'intégration Vercel↔Supabase est installée (provisionne POSTGRES_URL automatiquement).",
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
