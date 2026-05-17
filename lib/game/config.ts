// Fichier de config d'équilibrage : SOURCE UNIQUE de toutes les valeurs de
// game design (coût de pose, production, facteur exponentiel d'amélioration,
// niveau max…). C'est le seul fichier à toucher pour ajuster l'équilibre du
// jeu — la logique (engine.ts) et l'UI dérivent tout d'ici.
//
// `buildings.ts` dérive `BUILDINGS` de `GAME_CONFIG` (pas de duplication).

import type { BuildingKind, ResourceKind } from "./types";

export type BuildingConfig = {
  readonly label: string;
  readonly description: string;
  readonly produces: ResourceKind;
  // Production par seconde au niveau 1.
  readonly baseRatePerSecond: number;
  // Coût de pose du bâtiment (niveau 1).
  readonly baseCost: Readonly<Partial<Record<ResourceKind, number>>>;
  // Coût de l'amélioration niveau 1 → 2. Les niveaux suivants sont obtenus en
  // multipliant par `upgradeCostFactor^(level-1)` (croissance exponentielle).
  readonly baseUpgradeCost: Readonly<Partial<Record<ResourceKind, number>>>;
  // Facteur exponentiel du coût d'amélioration (> 1).
  readonly upgradeCostFactor: number;
  // Production additionnelle par niveau (croissance linéaire). Le gain linéaire
  // face au coût exponentiel donne des rendements décroissants — équilibrage
  // naturel.
  readonly rateGrowthPerLevel: number;
  // Niveau maximal atteignable.
  readonly maxLevel: number;
  // Bâtiments « logement » uniquement : population fournie instantanément à la
  // pose (niveau 1). Présence de ce champ ⇔ bâtiment de logement (cf.
  // `isHousing`). Les bâtiments de production le laissent absent.
  readonly populationCapacity?: number;
  // Population additionnelle par niveau pour les bâtiments de logement.
  readonly populationGrowthPerLevel?: number;
};

export const GAME_CONFIG: Readonly<Record<BuildingKind, BuildingConfig>> = {
  farm: {
    label: "Ferme",
    description: "Produit du grain — chaque ouvrier assigné fait tourner un champ.",
    produces: "grain",
    baseRatePerSecond: 0.1,
    baseCost: { gold: 10, wood: 5 },
    baseUpgradeCost: { grain: 15 },
    upgradeCostFactor: 1.6,
    rateGrowthPerLevel: 0.1,
    maxLevel: 10,
  },
  mine: {
    label: "Mine",
    description: "Extrait de l'or — au rythme des ouvriers qui y descendent.",
    produces: "gold",
    baseRatePerSecond: 0.05,
    baseCost: { grain: 20 },
    baseUpgradeCost: { gold: 10 },
    upgradeCostFactor: 1.7,
    rateGrowthPerLevel: 0.05,
    maxLevel: 10,
  },
  lumberjack: {
    label: "Cabane de bûcheron",
    description: "Abat du bois — ne coûte que de l'or à bâtir.",
    produces: "wood",
    baseRatePerSecond: 0.08,
    baseCost: { gold: 15 },
    baseUpgradeCost: { gold: 20 },
    upgradeCostFactor: 1.6,
    rateGrowthPerLevel: 0.05,
    maxLevel: 10,
  },
  house: {
    label: "Maison",
    description: "Loge des sujets — fournit de la population à assigner.",
    produces: "population",
    baseRatePerSecond: 0,
    baseCost: { gold: 20 },
    baseUpgradeCost: { gold: 30 },
    upgradeCostFactor: 1.6,
    rateGrowthPerLevel: 0,
    maxLevel: 10,
    populationCapacity: 3,
    populationGrowthPerLevel: 2,
  },
  quarry: {
    label: "Carrière",
    description: "Extrait de la pierre — les ouvriers taillent la roche brute.",
    produces: "stone",
    baseRatePerSecond: 0.1,
    baseCost: { gold: 25, wood: 10 },
    baseUpgradeCost: { gold: 25, wood: 15 },
    upgradeCostFactor: 1.6,
    rateGrowthPerLevel: 0.08,
    maxLevel: 10,
  },
  town_hall: {
    label: "Hôtel de ville",
    description: "Cœur civique du fief — produit de la science et débloque l'arbre des savoirs.",
    produces: "science",
    baseRatePerSecond: 0.05,
    baseCost: { gold: 50, wood: 30, stone: 20 },
    baseUpgradeCost: { gold: 60, stone: 30 },
    upgradeCostFactor: 1.7,
    rateGrowthPerLevel: 0.04,
    maxLevel: 5,
  },
};

// Coût pour faire passer un bâtiment de `level` à `level + 1`.
// EXPONENTIEL : baseUpgradeCost * upgradeCostFactor^(level-1), arrondi au sup.
// `costMultiplier` (défaut 1) applique une réduction/majoration globale —
// utilisé par l'engine pour répercuter les techs (civil_engineering = 0.8).
export function upgradeCost(
  kind: BuildingKind,
  level: number,
  costMultiplier = 1,
): Partial<Record<ResourceKind, number>> {
  const cfg = GAME_CONFIG[kind];
  const multiplier = Math.pow(cfg.upgradeCostFactor, level - 1) * costMultiplier;
  const cost: Partial<Record<ResourceKind, number>> = {};
  for (const [resource, amount] of Object.entries(cfg.baseUpgradeCost) as Array<
    [ResourceKind, number]
  >) {
    cost[resource] = Math.ceil(amount * multiplier);
  }
  return cost;
}

// Production par seconde et PAR OUVRIER d'un bâtiment à un niveau donné.
// LINÉAIRE : baseRatePerSecond + rateGrowthPerLevel * (level - 1).
// La production réelle d'un bâtiment = ce taux × nombre d'ouvriers assignés
// (cf. `effectiveRate` dans engine.ts).
export function buildingRate(kind: BuildingKind, level: number): number {
  const cfg = GAME_CONFIG[kind];
  return cfg.baseRatePerSecond + cfg.rateGrowthPerLevel * (level - 1);
}

// `maxLevelBonus` (défaut 0) : extension du plafond par les techs (ex.
// architecture = +2). L'engine passe getMaxLevelBonus(state).
export function isMaxLevel(
  kind: BuildingKind,
  level: number,
  maxLevelBonus = 0,
): boolean {
  return level >= GAME_CONFIG[kind].maxLevel + maxLevelBonus;
}

// Un bâtiment de logement (maison) : fournit de la population au lieu de
// produire au tick. Discriminé par la présence de `populationCapacity`.
export function isHousing(kind: BuildingKind): boolean {
  return GAME_CONFIG[kind].populationCapacity != null;
}

// Population fournie par un bâtiment de logement à un niveau donné.
// LINÉAIRE : populationCapacity + populationGrowthPerLevel * (level - 1).
// Renvoie 0 pour un bâtiment de production.
export function populationCapacityAt(
  kind: BuildingKind,
  level: number,
): number {
  const cfg = GAME_CONFIG[kind];
  if (cfg.populationCapacity == null) return 0;
  return (
    cfg.populationCapacity +
    (cfg.populationGrowthPerLevel ?? 0) * (level - 1)
  );
}

// Nombre maximal d'ouvriers assignables à un bâtiment = son niveau.
// Renvoie 0 pour un bâtiment de logement (n'emploie pas d'ouvriers).
export function workerCapacity(kind: BuildingKind, level: number): number {
  return isHousing(kind) ? 0 : level;
}

// Remboursement à la revente d'un bâtiment : 50 % du total investi (coût de
// pose + toutes les améliorations payées pour atteindre `level`), arrondi au
// plancher. Réutilise `upgradeCost` — pas de duplication de la formule.
export function sellRefund(
  kind: BuildingKind,
  level: number,
): Partial<Record<ResourceKind, number>> {
  const invested: Partial<Record<ResourceKind, number>> = {};
  const add = (cost: Partial<Record<ResourceKind, number>>) => {
    for (const [resource, amount] of Object.entries(cost) as Array<
      [ResourceKind, number]
    >) {
      invested[resource] = (invested[resource] ?? 0) + amount;
    }
  };

  add(GAME_CONFIG[kind].baseCost);
  for (let lvl = 1; lvl < level; lvl++) add(upgradeCost(kind, lvl));

  const refund: Partial<Record<ResourceKind, number>> = {};
  for (const [resource, amount] of Object.entries(invested) as Array<
    [ResourceKind, number]
  >) {
    refund[resource] = Math.floor(amount * 0.5);
  }
  return refund;
}
