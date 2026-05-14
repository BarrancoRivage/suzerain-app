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
};

export const GAME_CONFIG: Readonly<Record<BuildingKind, BuildingConfig>> = {
  farm: {
    label: "Ferme",
    description: "Produit du grain à un rythme régulier.",
    produces: "grain",
    baseRatePerSecond: 0.1,
    baseCost: { grain: 0 },
    baseUpgradeCost: { grain: 15 },
    upgradeCostFactor: 1.6,
    rateGrowthPerLevel: 0.1,
    maxLevel: 10,
  },
  mine: {
    label: "Mine",
    description: "Extrait de l'or, lentement mais sûrement.",
    produces: "gold",
    baseRatePerSecond: 0.05,
    baseCost: { grain: 20 },
    baseUpgradeCost: { gold: 10 },
    upgradeCostFactor: 1.7,
    rateGrowthPerLevel: 0.05,
    maxLevel: 10,
  },
};

// Coût pour faire passer un bâtiment de `level` à `level + 1`.
// EXPONENTIEL : baseUpgradeCost * upgradeCostFactor^(level-1), arrondi au sup.
export function upgradeCost(
  kind: BuildingKind,
  level: number,
): Partial<Record<ResourceKind, number>> {
  const cfg = GAME_CONFIG[kind];
  const multiplier = Math.pow(cfg.upgradeCostFactor, level - 1);
  const cost: Partial<Record<ResourceKind, number>> = {};
  for (const [resource, amount] of Object.entries(cfg.baseUpgradeCost) as Array<
    [ResourceKind, number]
  >) {
    cost[resource] = Math.ceil(amount * multiplier);
  }
  return cost;
}

// Production par seconde d'un bâtiment à un niveau donné.
// LINÉAIRE : baseRatePerSecond + rateGrowthPerLevel * (level - 1).
export function buildingRate(kind: BuildingKind, level: number): number {
  const cfg = GAME_CONFIG[kind];
  return cfg.baseRatePerSecond + cfg.rateGrowthPerLevel * (level - 1);
}

export function isMaxLevel(kind: BuildingKind, level: number): boolean {
  return level >= GAME_CONFIG[kind].maxLevel;
}
