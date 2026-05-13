"use client";

import { useEffect, useRef, useState } from "react";

import { BUILDINGS, RESOURCE_LABELS } from "@/lib/game/buildings";
import type { GameState, ResourceKind, Resources } from "@/lib/game/types";
import { GoldIcon } from "./icons/GoldIcon";
import { GrainIcon } from "./icons/GrainIcon";

const ICONS: Record<ResourceKind, typeof GrainIcon> = {
  grain: GrainIcon,
  gold: GoldIcon,
};

const COLORS: Record<ResourceKind, string> = {
  grain: "text-blood",
  gold: "text-gold",
};

function computeRates(state: GameState): Resources {
  const total: Resources = { grain: 0, gold: 0 };
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    const def = BUILDINGS[tile.building.kind];
    total[def.produces] += def.ratePerSecond;
  }
  return total;
}

type Props = { state: GameState };

export function ResourcePanel({ state }: Props) {
  const rates = computeRates(state);
  const [displayed, setDisplayed] = useState<Resources>(state.resources);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function loop() {
      const elapsed = (Date.now() - state.lastTickAt) / 1000;
      setDisplayed({
        grain: state.resources.grain + rates.grain * elapsed,
        gold: state.resources.gold + rates.gold * elapsed,
      });
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state, rates.grain, rates.gold]);

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-3">
      {(Object.keys(RESOURCE_LABELS) as ResourceKind[]).map((kind) => {
        const Icon = ICONS[kind];
        const color = COLORS[kind];
        return (
          <div
            key={kind}
            className="flex items-center gap-4 rounded-md border border-gold/40 bg-parchment/80 px-5 py-3"
          >
            <Icon className={`w-7 h-7 ${color} pixelated`} />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-3xl tabular-nums text-ink">
                {displayed[kind].toFixed(1)}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-ink/50 font-sans">
                {RESOURCE_LABELS[kind]} · {rates[kind].toFixed(2)} / s
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
