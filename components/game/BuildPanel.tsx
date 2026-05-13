"use client";

import { BUILDINGS } from "@/lib/game/buildings";
import type { BuildingKind } from "@/lib/game/types";
import { FarmIcon } from "./icons/FarmIcon";

type Props = {
  selected: BuildingKind | null;
  onSelect: (kind: BuildingKind | null) => void;
  disabled: boolean;
};

export function BuildPanel({ selected, onSelect, disabled }: Props) {
  const def = BUILDINGS.farm;
  const isSelected = selected === "farm";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[10px] uppercase tracking-widest text-ink/50 font-sans">
        Bâtir
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(isSelected ? null : "farm")}
        className={`flex items-center gap-4 rounded-md border px-5 py-3 transition-colors ${
          isSelected
            ? "border-blood bg-parchment shadow-sm"
            : "border-ink/20 bg-parchment/60 hover:border-gold hover:bg-parchment"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <FarmIcon className="w-9 h-9 text-blood pixelated" />
        <div className="text-left">
          <div className="font-serif text-lg text-ink">{def.label}</div>
          <div className="text-xs text-ink/60 font-sans">
            +{def.ratePerSecond.toFixed(1)} grain / s · gratuit
          </div>
        </div>
      </button>
      <div className="h-4 text-xs italic font-serif text-blood/80">
        {isSelected ? "Cliquez une tuile pour la poser." : " "}
      </div>
    </div>
  );
}
