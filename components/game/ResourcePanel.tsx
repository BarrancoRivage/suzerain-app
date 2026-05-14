"use client";

import { assignedPopulation, availablePopulation } from "@/lib/game/engine";
import {
  formatAmount,
  RESOURCES,
  resourcesByCategory,
} from "@/lib/game/resources";
import type { GameState } from "@/lib/game/types";
import { ResourceIcon } from "./icons/ResourceIcon";
import { useAnimatedResources } from "./useAnimatedResources";

// Cluster de ressources affiché dans la top bar : les 7 ressources `primary`
// (icône + valeur), chacune accompagnée — entre parenthèses — de sa vitesse
// d'acquisition (`+x.xx/s`). Cas particulier de la population : pas de taux,
// mais le rapport `disponible / utilisée`. Le prestige et les 22 ressources
// secondaires ne sont PAS ici — uniquement dans la modale Trésorerie.
const PRIMARY = resourcesByCategory("primary");

type Props = {
  state: GameState;
};

export function ResourcePanel({ state }: Props) {
  const { displayed, rates } = useAnimatedResources(state);
  const available = availablePopulation(state);
  const assigned = assignedPopulation(state);

  return (
    <div className="flex items-center gap-0.5">
      {PRIMARY.map((kind) => {
        const def = RESOURCES[kind];
        const isPopulation = kind === "population";
        const rate = rates[kind];
        return (
          <div
            key={kind}
            className="group relative flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-ink/5"
          >
            <ResourceIcon
              kind={kind}
              className={`h-4 w-4 ${def.tone} pixelated`}
            />
            {isPopulation ? (
              <span className="font-serif text-sm tabular-nums text-ink">
                {available}
                <span className="text-ink/50"> / </span>
                {assigned}
              </span>
            ) : (
              <>
                <span className="font-serif text-sm tabular-nums text-ink">
                  {formatAmount(displayed[kind], kind)}
                </span>
                {rate > 0 && (
                  <span className="font-sans text-xs tabular-nums text-moss">
                    (+{rate.toFixed(2)}/s)
                  </span>
                )}
              </>
            )}
            <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-gold/40 bg-parchment px-2 py-1 font-sans text-[10px] text-ink/70 shadow-sm group-hover:block">
              {isPopulation
                ? `${def.label} · ${available} libre · ${assigned} assignée`
                : `${def.label} · +${rate.toFixed(2)} / s`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
