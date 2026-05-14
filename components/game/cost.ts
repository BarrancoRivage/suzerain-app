// Helpers partagés pour afficher / vérifier un coût en ressources.
// Utilisés par BuildPanel (coût de pose) et BuildingPanel (coût d'amélioration).

import { RESOURCE_LABELS } from "@/lib/game/buildings";
import type { ResourceKind, Resources } from "@/lib/game/types";

export type Cost = Readonly<Partial<Record<ResourceKind, number>>>;

export function canAfford(resources: Resources, cost: Cost): boolean {
  for (const [resource, amount] of Object.entries(cost) as Array<
    [ResourceKind, number]
  >) {
    if ((resources[resource] ?? 0) < amount) return false;
  }
  return true;
}

export function formatCost(cost: Cost): string {
  const entries = (Object.entries(cost) as Array<[ResourceKind, number]>).filter(
    ([, amount]) => amount > 0,
  );
  if (entries.length === 0) return "gratuit";
  return entries
    .map(([r, n]) => `${n} ${RESOURCE_LABELS[r].toLowerCase()}`)
    .join(" · ");
}
