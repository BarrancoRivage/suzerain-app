"use client";

import { BUILDINGS } from "@/lib/game/buildings";
import { countBuildings } from "@/lib/game/engine";
import { RESOURCE_LABELS } from "@/lib/game/resources";
import type { BuildingKind, GameState } from "@/lib/game/types";
import { canAfford, formatCost } from "./cost";
import { FarmIcon } from "./icons/FarmIcon";
import { HouseIcon } from "./icons/HouseIcon";
import { LumberjackIcon } from "./icons/LumberjackIcon";
import { MineIcon } from "./icons/MineIcon";
import { QuarryIcon } from "./icons/QuarryIcon";
import { TownHallIcon } from "./icons/TownHallIcon";

const ICONS: Record<BuildingKind, typeof FarmIcon> = {
  farm: FarmIcon,
  mine: MineIcon,
  lumberjack: LumberjackIcon,
  house: HouseIcon,
  quarry: QuarryIcon,
  town_hall: TownHallIcon,
};

const COLORS: Record<BuildingKind, string> = {
  farm: "text-blood",
  mine: "text-gold",
  lumberjack: "text-amber-800",
  house: "text-stone-500",
  quarry: "text-stone-600",
  town_hall: "text-indigo-700",
};

// Bâtiments uniques par fief — l'UI désactive le bouton dès qu'un est posé,
// en miroir du garde-fou côté engine (placeBuilding → GameError ALREADY_BUILT).
const UNIQUE: ReadonlySet<BuildingKind> = new Set(["town_hall"]);

type Props = {
  selected: BuildingKind | null;
  onSelect: (kind: BuildingKind | null) => void;
  disabled: boolean;
  state: GameState;
};

// Liste verticale des bâtiments à poser, affichée dépliée dans le panneau
// d'actions. L'en-tête, la consigne de pose et le positionnement sont portés
// par ActionPanel.
export function BuildPanel({ selected, onSelect, disabled, state }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {Object.values(BUILDINGS).map((def) => {
        const isSelected = selected === def.kind;
        const Icon = ICONS[def.kind];
        const color = COLORS[def.kind];
        const affordable = canAfford(state.resources, def.cost);
        const alreadyBuilt =
          UNIQUE.has(def.kind) && countBuildings(state, def.kind) > 0;
        const buttonDisabled = disabled || !affordable || alreadyBuilt;

        return (
          <button
            key={def.kind}
            type="button"
            disabled={buttonDisabled}
            onClick={() => onSelect(isSelected ? null : def.kind)}
            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
              isSelected
                ? "border-blood bg-parchment shadow-sm"
                : "border-ink/20 bg-parchment/60 hover:border-gold hover:bg-parchment"
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-ink/20`}
          >
            <Icon className={`h-8 w-8 shrink-0 ${color} pixelated`} />
            <div className="min-w-0">
              <div className="font-serif text-lg leading-tight text-ink">
                {def.label}
              </div>
              <div className="font-sans text-xs text-ink/60">
                {alreadyBuilt ? (
                  <span className="italic">Déjà construit</span>
                ) : def.populationCapacity != null ? (
                  <>
                    +{def.populationCapacity} population · {formatCost(def.cost)}
                  </>
                ) : (
                  <>
                    +{def.ratePerSecond.toFixed(2)}{" "}
                    {RESOURCE_LABELS[def.produces].toLowerCase()} / s par ouvrier
                    · {formatCost(def.cost)}
                  </>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
