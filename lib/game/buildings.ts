import { GAME_CONFIG } from "./config";
import type { BuildingKind, ResourceKind } from "./types";

export type BuildingDef = {
  readonly kind: BuildingKind;
  readonly label: string;
  readonly description: string;
  readonly produces: ResourceKind;
  readonly ratePerSecond: number;
  readonly cost: Readonly<Partial<Record<ResourceKind, number>>>;
};

// `BUILDINGS` est dérivé de GAME_CONFIG (lib/game/config.ts) : il expose les
// valeurs de pose (niveau 1) sous la forme attendue par l'UI de construction.
// Toute valeur d'équilibrage se modifie dans config.ts, jamais ici.
export const BUILDINGS: Readonly<Record<BuildingKind, BuildingDef>> =
  Object.fromEntries(
    (Object.entries(GAME_CONFIG) as Array<
      [BuildingKind, (typeof GAME_CONFIG)[BuildingKind]]
    >).map(([kind, cfg]) => [
      kind,
      {
        kind,
        label: cfg.label,
        description: cfg.description,
        produces: cfg.produces,
        ratePerSecond: cfg.baseRatePerSecond,
        cost: cfg.baseCost,
      } satisfies BuildingDef,
    ]),
  ) as Record<BuildingKind, BuildingDef>;
