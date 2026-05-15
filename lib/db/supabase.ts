// Backend Supabase JS (REST HTTPS). Utilisé en prod via les env vars
// auto-provisionnées par l'intégration Vercel↔Supabase :
//   - SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL en fallback)
//   - SUPABASE_SERVICE_ROLE_KEY (clé serveur, bypass RLS)
//
// Ne tape jamais le pooler Postgres directement : on passe par leur API REST
// — TLS standard, pas de cert maison à gérer. C'est ce qui résout le bug
// récurrent "self-signed certificate in certificate chain".
//
// La table `players` doit être créée à la main une fois dans le SQL editor
// Supabase (cf. docker/postgres/init/002_players.sql) : pas d'auto-création
// de schéma en prod.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { migrateState } from "../game/engine";
import { normalizeResources } from "../game/resources";
import type { GameState, PlayerSummary } from "../game/types";

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le backend " +
        "Supabase. Vérifier l'intégration Vercel↔Supabase.",
    );
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export async function loadStateSupabase(
  playerId: string,
): Promise<GameState | null> {
  const { data, error } = await getClient()
    .from("game_states")
    .select("state")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase loadState: ${error.message}`);
  }
  if (!data) return null;

  const state = data.state as GameState;
  return migrateState(state);
}

export async function saveStateSupabase(state: GameState): Promise<void> {
  const { error } = await getClient().from("game_states").upsert({
    player_id: state.playerId,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Supabase saveState: ${error.message}`);
  }
}

export async function getPlayerNameSupabase(
  playerId: string,
): Promise<string | null> {
  const { data, error } = await getClient()
    .from("players")
    .select("name")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase getPlayerName: ${error.message}`);
  }
  return data ? (data.name as string) : null;
}

export async function setPlayerNameSupabase(
  playerId: string,
  name: string,
): Promise<void> {
  const { error } = await getClient().from("players").upsert({
    player_id: playerId,
    name,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Supabase setPlayerName: ${error.message}`);
  }
}

// UUID impossible utilisé comme sentinelle pour `neq` quand on veut un
// match-all : Supabase REST refuse les `delete()` sans filtre.
const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export async function deletePlayerSupabase(playerId: string): Promise<void> {
  const client = getClient();
  const stateRes = await client
    .from("game_states")
    .delete()
    .eq("player_id", playerId);
  if (stateRes.error) {
    throw new Error(`Supabase deletePlayer (state): ${stateRes.error.message}`);
  }
  const playerRes = await client
    .from("players")
    .delete()
    .eq("player_id", playerId);
  if (playerRes.error) {
    throw new Error(
      `Supabase deletePlayer (player): ${playerRes.error.message}`,
    );
  }
}

export async function resetWorldSupabase(): Promise<void> {
  const client = getClient();
  const stateRes = await client
    .from("game_states")
    .delete()
    .neq("player_id", NULL_UUID);
  if (stateRes.error) {
    throw new Error(`Supabase resetWorld (states): ${stateRes.error.message}`);
  }
  const playerRes = await client
    .from("players")
    .delete()
    .neq("player_id", NULL_UUID);
  if (playerRes.error) {
    throw new Error(`Supabase resetWorld (players): ${playerRes.error.message}`);
  }
}

export async function listPlayersSupabase(): Promise<PlayerSummary[]> {
  // Pas de FK déclarée entre game_states et players : on récupère les deux
  // ensembles et on fait la jointure en mémoire. On charge `state` (et pas
  // seulement player_id) pour en extraire le prestige — Supabase JS ne fait
  // pas de JSON-path en select. Acceptable à l'échelle actuelle.
  const client = getClient();
  const [statesRes, playersRes] = await Promise.all([
    client.from("game_states").select("player_id, state"),
    client.from("players").select("player_id, name"),
  ]);

  if (statesRes.error) {
    throw new Error(`Supabase listPlayers (states): ${statesRes.error.message}`);
  }
  if (playersRes.error) {
    throw new Error(
      `Supabase listPlayers (players): ${playersRes.error.message}`,
    );
  }

  const names = new Map<string, string>();
  for (const row of playersRes.data ?? []) {
    names.set(row.player_id as string, row.name as string);
  }

  const summaries: PlayerSummary[] = (statesRes.data ?? []).map((row) => {
    const playerId = row.player_id as string;
    const resources = normalizeResources((row.state as GameState).resources);
    return {
      playerId,
      name: names.get(playerId) ?? null,
      prestige: resources.prestige,
    };
  });

  // Scoreboard : tri par prestige décroissant, départage par nom.
  summaries.sort((a, b) => {
    if (a.prestige !== b.prestige) return b.prestige - a.prestige;
    if (a.name === null) return b.name === null ? 0 : 1;
    if (b.name === null) return -1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  return summaries;
}
