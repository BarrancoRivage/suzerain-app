export const GRID_RADIUS = 6;
export const STATE_VERSION = 7;

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

export type BuildingKind = "farm" | "mine";

export type Biome = "plain" | "forest" | "hill" | "water";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
  level: number;
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
