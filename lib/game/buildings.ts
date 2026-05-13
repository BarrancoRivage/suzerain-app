import type { BuildingKind, ResourceKind } from "./types";

export type BuildingDef = {
  readonly kind: BuildingKind;
  readonly label: string;
  readonly description: string;
  readonly produces: ResourceKind;
  readonly ratePerSecond: number;
  readonly cost: Readonly<Partial<Record<ResourceKind, number>>>;
};

export const BUILDINGS: Readonly<Record<BuildingKind, BuildingDef>> = {
  farm: {
    kind: "farm",
    label: "Ferme",
    description: "Produit du grain à un rythme régulier.",
    produces: "grain",
    ratePerSecond: 0.1,
    cost: { grain: 0 },
  },
  mine: {
    kind: "mine",
    label: "Mine",
    description: "Extrait de l'or, lentement mais sûrement.",
    produces: "gold",
    ratePerSecond: 0.05,
    cost: { grain: 20 },
  },
};

export const RESOURCE_LABELS: Readonly<Record<ResourceKind, string>> = {
  grain: "Grain",
  gold: "Or",
};
