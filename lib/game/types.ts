export const STATE_VERSION = 10;

// Ressources du jeu. La data (label, catégorie, ordre, couleur…) vit dans
// lib/game/resources.ts — ce fichier ne porte QUE les types pour rester la
// feuille de l'arbre de dépendances (aucun import → aucun cycle possible).
export type ResourceKind =
  // primary (7) — affichées sur la barre HUD
  | "grain"
  | "gold"
  | "population"
  | "science"
  | "happiness"
  | "wood"
  | "stone"
  // prestige (1) — scoreboard multijoueur + modale Trésorerie
  | "prestige"
  // secondary (22) — modale Trésorerie uniquement
  | "iron"
  | "coal"
  | "clay"
  | "salt"
  | "gems"
  | "tools"
  | "weapons"
  | "armor"
  | "cloth"
  | "leather"
  | "pottery"
  | "horses"
  | "cattle"
  | "wool"
  | "fish"
  | "herbs"
  | "wine"
  | "spices"
  | "silk"
  | "faith"
  | "culture"
  | "influence";

export type ResourceCategory = "primary" | "prestige" | "secondary";

export type BuildingKind = "farm" | "mine" | "lumberjack" | "house";

export type LegacyBuilding = {
  kind: BuildingKind;
  placedAt: number;
  level: number;
  workers: number;
  // Coordonnées fines des bâtiments posés sur l'ancienne grille hex.
  subX?: number;
  subZ?: number;
};

export type WorldBuilding = {
  id: string;
  kind: BuildingKind;
  x: number;
  z: number;
  placedAt: number;
  level: number;
  workers: number;
};

export type LegacyTile = {
  q: number;
  r: number;
  building: LegacyBuilding | null;
};

export type Resources = Record<ResourceKind, number>;

export type GameState = {
  version: typeof STATE_VERSION;
  playerId: string;
  createdAt: number;
  lastTickAt: number;
  buildings: WorldBuilding[];
  // Conservé uniquement pour migrer les états v9 et plus anciens.
  tiles: LegacyTile[];
  resources: Resources;
};

// Entrée de la liste des joueurs (panneau multijoueur). name vaut null tant
// que le joueur n'a pas renseigné de nom — affiché « Anonyme » côté UI.
// prestige alimente le scoreboard : la liste est triée par prestige décroissant.
export type PlayerSummary = {
  playerId: string;
  name: string | null;
  prestige: number;
};

export class GameError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GameError";
    this.code = code;
  }
}
