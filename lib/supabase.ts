import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { STATE_VERSION, type GameState } from "./game/types";

const TABLE = "game_states";

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase non configuré : installer l'intégration Supabase via Vercel Marketplace, puis `vercel env pull .env.local`.",
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export async function loadState(playerId: string): Promise<GameState | null> {
  const { data, error } = await getClient()
    .from(TABLE)
    .select("state")
    .eq("player_id", playerId)
    .maybeSingle<{ state: GameState }>();

  if (error) {
    throw new Error(`Lecture Supabase échouée : ${error.message}`);
  }
  if (data === null) return null;
  if (data.state.version !== STATE_VERSION) return null;
  return data.state;
}

export async function saveState(state: GameState): Promise<void> {
  const { error } = await getClient()
    .from(TABLE)
    .upsert(
      {
        player_id: state.playerId,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id" },
    );

  if (error) {
    throw new Error(`Écriture Supabase échouée : ${error.message}`);
  }
}
