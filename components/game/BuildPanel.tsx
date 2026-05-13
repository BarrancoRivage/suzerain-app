"use client";

import { BUILDINGS, RESOURCE_LABELS, type BuildingDef } from "@/lib/game/buildings";
import type {
  BuildingKind,
  ResourceKind,
  Resources,
} from "@/lib/game/types";
import { FarmIcon } from "./icons/FarmIcon";
import { MineIcon } from "./icons/MineIcon";

const ICONS: Record<BuildingKind, typeof FarmIcon> = {
  farm: FarmIcon,
  mine: MineIcon,
};

const COLORS: Record<BuildingKind, string> = {
  farm: "text-blood",
  mine: "text-gold",
};

type Props = {
  selected: BuildingKind | null;
  onSelect: (kind: BuildingKind | null) => void;
  disabled: boolean;
  resources: Resources;
};

export function BuildPanel({ selected, onSelect, disabled, resources }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[10px] uppercase tracking-widest text-ink/50 font-sans">
        Bâtir
      </div>
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {Object.values(BUILDINGS).map((def) => {
          const isSelected = selected === def.kind;
          const Icon = ICONS[def.kind];
          const color = COLORS[def.kind];
          const affordable = canAfford(resources, def.cost);
          const buttonDisabled = disabled || !affordable;

          return (
            <button
              key={def.kind}
              type="button"
              disabled={buttonDisabled}
              onClick={() => onSelect(isSelected ? null : def.kind)}
              className={`flex items-center gap-4 rounded-md border px-5 py-3 transition-colors ${
                isSelected
                  ? "border-blood bg-parchment shadow-sm"
                  : "border-ink/20 bg-parchment/60 hover:border-gold hover:bg-parchment"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-ink/20`}
            >
              <Icon className={`w-9 h-9 ${color} pixelated`} />
              <div className="text-left">
                <div className="font-serif text-lg text-ink">{def.label}</div>
                <div className="text-xs text-ink/60 font-sans">
                  +{def.ratePerSecond.toFixed(2)}{" "}
                  {RESOURCE_LABELS[def.produces].toLowerCase()} / s ·{" "}
                  {formatCost(def.cost)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="h-4 text-xs italic font-serif text-blood/80">
        {selected !== null ? "Cliquez une tuile pour la poser." : " "}
      </div>
    </div>
  );
}

function canAfford(resources: Resources, cost: BuildingDef["cost"]): boolean {
  for (const [resource, amount] of Object.entries(cost) as Array<
    [ResourceKind, number]
  >) {
    if (resources[resource] < amount) return false;
  }
  return true;
}

function formatCost(cost: BuildingDef["cost"]): string {
  const entries = (Object.entries(cost) as Array<[ResourceKind, number]>).filter(
    ([, amount]) => amount > 0,
  );
  if (entries.length === 0) return "gratuit";
  return entries
    .map(([r, n]) => `${n} ${RESOURCE_LABELS[r].toLowerCase()}`)
    .join(" · ");
}
