export const GRID_RADIUS = 6;
export const STATE_VERSION = 6;

export type ResourceKind = "grain" | "gold";

export type BuildingKind = "farm" | "mine";

export type Biome = "plain" | "forest" | "hill" | "water";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
};

// Chemin (rivière ou route) traversant une tuile. inEdge et outEdge sont des
// indices d'arête 0..5 (cf. HEX_DIRECTIONS dans lib/game/hex.ts). Quand
// outEdge ≠ inEdge + 3 (mod 6), le chemin tourne — on utilise alors un tile
// KayKit en variante courbe (B = 60°, C = 120°).
export type TilePath = {
  type: "river" | "road";
  inEdge: number;
  outEdge: number;
};

export type Tile = {
  q: number;
  r: number;
  biome: Biome;
  building: Building | null;
  path?: TilePath;
};

export type Resources = Record<ResourceKind, number>;

export type GameState = {
  version: typeof STATE_VERSION;
  playerId: string;
  createdAt: number;
  lastTickAt: number;
  tiles: Tile[];
  resources: Resources;
};

// Entrée de la liste des joueurs (panneau multijoueur). name vaut null tant
// que le joueur n'a pas renseigné de nom — affiché « Anonyme » côté UI.
export type PlayerSummary = {
  playerId: string;
  name: string | null;
};

export class GameError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GameError";
    this.code = code;
  }
}
