export const GRID_RADIUS = 3;
export const STATE_VERSION = 3;

export type ResourceKind = "grain" | "gold";

export type BuildingKind = "farm" | "mine";

export type Biome = "plain" | "forest" | "hill";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
};

export type Tile = {
  q: number;
  r: number;
  biome: Biome;
  building: Building | null;
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
