import { Redis } from "@upstash/redis";

import type { GameState } from "./game/types";
import { STATE_VERSION } from "./game/types";

const TTL_SECONDS = 60 * 60 * 24 * 90;

let cachedClient: Redis | null = null;

function getClient(): Redis {
  if (cachedClient) return cachedClient;

  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Upstash Redis non configuré : installer l'intégration Upstash via Vercel Marketplace, puis `vercel env pull .env.local`.",
    );
  }

  cachedClient = new Redis({ url, token });
  return cachedClient;
}

function key(playerId: string): string {
  return `game:state:${playerId}`;
}

export async function loadState(playerId: string): Promise<GameState | null> {
  const raw = await getClient().get<GameState>(key(playerId));
  if (raw === null) return null;
  if (raw.version !== STATE_VERSION) return null;
  return raw;
}

export async function saveState(state: GameState): Promise<void> {
  await getClient().set(key(state.playerId), state, { ex: TTL_SECONDS });
}
