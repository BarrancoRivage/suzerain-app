import { cookies } from "next/headers";

const COOKIE_NAME = "suzerain_pid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreatePlayerId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing && existing.length > 0) return existing;

  const playerId = crypto.randomUUID();
  store.set({
    name: COOKIE_NAME,
    value: playerId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return playerId;
}
