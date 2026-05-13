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
};

export const RESOURCE_LABELS: Readonly<Record<ResourceKind, string>> = {
  grain: "Grain",
};
