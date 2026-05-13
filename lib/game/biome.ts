import type { BiomeKind } from "./types";

// Source de vérité unique pour le terrain. Le biome n'est PAS stocké :
// il est dérivé d'un hash déterministe de (playerId, x, y). Conséquences :
//   - Pas de migration DB quand on enrichit la diversité visuelle
//   - Le serveur et le client calculent le même biome pour la même tuile
//   - Chaque joueur a un fief unique mais stable dans le temps

function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function biomeAt(
  playerId: string,
  x: number,
  y: number,
): BiomeKind {
  const v = fnv1a(`${playerId}:${x}:${y}`) % 100;
  if (v < 8) return "water";
  if (v < 16) return "tree";
  if (v < 24) return "path";
  if (v < 32) return "grass-stone";
  if (v < 40) return "grass-flower";
  return "grass";
}

export function isBuildable(biome: BiomeKind): boolean {
  return (
    biome === "grass" ||
    biome === "grass-flower" ||
    biome === "grass-stone"
  );
}
