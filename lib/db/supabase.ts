// Backend Supabase JS (REST HTTPS). Utilisé en prod via les env vars
// auto-provisionnées par l'intégration Vercel↔Supabase :
//   - SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL en fallback)
//   - SUPABASE_SERVICE_ROLE_KEY (clé serveur, bypass RLS)
//
// Ne tape jamais le pooler Postgres directement : on passe par leur API REST
// — TLS standard, pas de cert maison à gérer. C'est ce qui résout le bug
// récurrent "self-signed certificate in certificate chain".

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { STATE_VERSION, type GameState } from "../game/types";

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
  if (state.version !== STATE_VERSION) return null;
  return state;
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
