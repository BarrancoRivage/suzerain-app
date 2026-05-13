"use client";

import { useEffect, useRef, useState } from "react";

import { BUILDINGS } from "@/lib/game/buildings";
import type { GameState } from "@/lib/game/types";
import { GrainIcon } from "./icons/GrainIcon";

function computeRatePerSecond(state: GameState): number {
  let total = 0;
  for (const tile of state.tiles) {
    if (tile.building === null) continue;
    total += BUILDINGS[tile.building.kind].ratePerSecond;
  }
  return total;
}

type Props = { state: GameState };

export function ResourcePanel({ state }: Props) {
  const rate = computeRatePerSecond(state);
  const [displayed, setDisplayed] = useState(state.resources.grain);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function loop() {
      const elapsed = (Date.now() - state.lastTickAt) / 1000;
      setDisplayed(state.resources.grain + rate * elapsed);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state, rate]);

  return (
    <div className="flex items-center gap-4 rounded-md border border-gold/40 bg-parchment/80 px-5 py-3">
      <GrainIcon className="w-7 h-7 text-blood pixelated" />
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-3xl tabular-nums text-ink">
          {displayed.toFixed(1)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-ink/50 font-sans">
          Grain · {rate.toFixed(1)} / s
        </span>
      </div>
    </div>
  );
}
