"use client";

import {
  formatAmount,
  RESOURCES,
  resourcesByCategory,
} from "@/lib/game/resources";
import type { GameState } from "@/lib/game/types";
import { ResourceIcon } from "./icons/ResourceIcon";
import { useAnimatedResources } from "./useAnimatedResources";

// HUD compact : barre unique discrète affichant les 7 ressources `primary`
// (icône + nombre), taux de production au survol, et un bouton ⊞ ouvrant la
// modale Trésorerie. Le prestige et les ressources secondaires ne sont PAS ici
// — uniquement dans la modale (et le scoreboard pour le prestige).
const PRIMARY = resourcesByCategory("primary");

type Props = {
  state: GameState;
  onOpenTreasury: () => void;
};

export function ResourcePanel({ state, onOpenTreasury }: Props) {
  const { displayed, rates } = useAnimatedResources(state);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-gold/30 bg-parchment/70 px-2 py-1 backdrop-blur-sm">
      {PRIMARY.map((kind) => {
        const def = RESOURCES[kind];
        return (
          <div
            key={kind}
            className="group relative flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-parchment/80"
          >
            <ResourceIcon
              kind={kind}
              className={`h-4 w-4 ${def.tone} pixelated`}
            />
            <span className="font-serif text-sm tabular-nums text-ink">
              {formatAmount(displayed[kind], kind)}
            </span>
            <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-gold/40 bg-parchment px-2 py-1 font-sans text-[10px] text-ink/70 shadow-sm group-hover:block">
              {def.label} · +{rates[kind].toFixed(2)} / s
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onOpenTreasury}
        aria-label="Ouvrir la trésorerie"
        className="ml-1 flex h-6 w-6 items-center justify-center rounded border border-gold/40 font-sans text-sm text-ink/60 transition-colors hover:bg-parchment hover:text-ink"
      >
        ⊞
      </button>
    </div>
  );
}
