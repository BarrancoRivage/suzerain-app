// Backend Postgres direct via `pg`. Utilisé UNIQUEMENT en dev local sur le
// container Docker compose (pas de SSL, pas de cert managé). Pour la prod,
// on passe par le client Supabase JS (REST HTTPS), cf. lib/db/supabase.ts.

import { Pool } from "pg";

import { STATE_VERSION, type GameState, type PlayerSummary } from "../game/types";

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

// Auto-heal dev : la table `players` est livrée via 002_players.sql, mais les
// scripts d'init ne rejouent pas sur un volume Docker déjà peuplé. On la
// recrée à la volée au premier accès. Mémoïsé : une seule fois par process.
let ensurePlayersPromise: Promise<void> | null = null;

function ensurePlayersTable(): Promise<void> {
  if (ensurePlayersPromise) return ensurePlayersPromise;
  const promise = getPool()
    .query(
      `create table if not exists public.players (
         player_id   uuid        primary key,
         name        text        not null,
         created_at  timestamptz not null default now(),
         updated_at  timestamptz not null default now()
       )`,
    )
    .then(() => undefined)
    .catch((error: unknown) => {
      // On réessaiera au prochain appel si la création a échoué.
      ensurePlayersPromise = null;
      throw error;
    });
  ensurePlayersPromise = promise;
  return promise;
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

export async function getPlayerNamePg(
  playerId: string,
): Promise<string | null> {
  await ensurePlayersTable();
  const { rows } = await getPool().query<{ name: string }>(
    "select name from players where player_id = $1",
    [playerId],
  );
  return rows.length === 0 ? null : rows[0].name;
}

export async function setPlayerNamePg(
  playerId: string,
  name: string,
): Promise<void> {
  await ensurePlayersTable();
  await getPool().query(
    `insert into players (player_id, name)
     values ($1, $2)
     on conflict (player_id) do update
       set name = excluded.name,
           updated_at = now()`,
    [playerId, name],
  );
}

export async function listPlayersPg(): Promise<PlayerSummary[]> {
  await ensurePlayersTable();
  const { rows } = await getPool().query<{
    player_id: string;
    name: string | null;
  }>(
    `select g.player_id, p.name
       from game_states g
       left join players p using (player_id)
       order by lower(p.name) nulls last, g.player_id`,
  );
  return rows.map((row) => ({ playerId: row.player_id, name: row.name }));
}
