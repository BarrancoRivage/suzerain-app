export const GRID_RADIUS = 6;
export const STATE_VERSION = 5;

export type ResourceKind = "grain" | "gold";

export type BuildingKind = "farm" | "mine";

export type Biome = "plain" | "forest" | "hill" | "water";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
};

// Indice de l'axe hex sur lequel s'aligne un chemin (rivière, route).
// 0 = axe q (E-O), 1 = axe r (NO-SE), 2 = axe q-r (NE-SO).
export type PathAxis = 0 | 1 | 2;

export type TilePath = {
  type: "river" | "road";
  axis: PathAxis;
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

export class GameError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GameError";
    this.code = code;
  }
}
