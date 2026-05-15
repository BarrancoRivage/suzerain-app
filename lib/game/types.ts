export const GRID_RADIUS = 18; // legacy (back-compat migration uniquement)
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

export type Biome =
  | "plain"
  | "forest"
  | "hill"
  | "mountain"
  | "desert"
  | "water";

export type WaterKind = "ocean" | "lake";

export type Building = {
  kind: BuildingKind;
  placedAt: number;
  level: number;
  workers: number;
  // Legacy hex sub-coords — gardé pour back-compat dans le type Tile.
  subX?: number;
  subZ?: number;
};

// Nouveau modèle : un bâtiment placé n'importe où sur le monde, identifié
// par un id stable, positionné par (x, z) world coords. Plus de notion de
// tuile ni de grille hex.
export type WorldBuilding = {
  id: string;
  kind: BuildingKind;
  x: number;
  z: number;
  placedAt: number;
  level: number;
  workers: number;
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
  // Données de terrain normalisées [0, 1], générées côté serveur puis
  // réutilisées par le rendu et la validation gameplay.
  elevation: number;
  moisture: number;
  temperature: number;
  water: WaterKind | null;
  building: Building | null;
  path?: TilePath;
};

export type Resources = Record<ResourceKind, number>;

export type GameState = {
  version: typeof STATE_VERSION;
  playerId: string;
  createdAt: number;
  lastTickAt: number;
  // Liste des bâtiments placés librement sur le monde (world coords).
  buildings: WorldBuilding[];
  // Conservé pour back-compat (migration v9→v10) — vide après migration.
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
