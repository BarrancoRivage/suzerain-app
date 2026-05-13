export const GRID_SIZE = 6;
export const STATE_VERSION = 2;

export type ResourceKind = "grain" | "gold";

export type BuildingKind = "farm" | "mine";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
};

export type Tile = {
  x: number;
  y: number;
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
