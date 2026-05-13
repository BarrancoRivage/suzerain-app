// RNG déterministe partagé entre la génération de map (server) et le rendu
// (client). On reste sur mulberry32 — assez bon pour de la procgen non
// cryptographique, 32 bits de seed suffisent pour notre échelle.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hashCoord(q: number, r: number): number {
  let h = 2166136261 ^ q;
  h = Math.imul(h, 16777619);
  h ^= r;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}

// Shuffle in-place avec un RNG seedé. Fisher-Yates.
export function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Pick avec poids dans une table de tuples (kind, weight). La somme des
// poids n'a pas besoin d'être 1 — on normalise implicitement.
export function pickWeighted<T>(
  table: ReadonlyArray<readonly [T, number]>,
  rng: () => number,
): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [item, weight] of table) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return table[table.length - 1][0];
}
