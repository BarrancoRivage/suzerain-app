"use client";

import { BUILDINGS } from "@/lib/game/buildings";
import {
  buildingRate,
  isHousing,
  isMaxLevel,
  populationCapacityAt,
  sellRefund,
  upgradeCost,
  workerCapacity,
} from "@/lib/game/config";
import { availablePopulation, effectiveRate } from "@/lib/game/engine";
import type { BuildingKind, GameState, Tile } from "@/lib/game/types";
import { canAfford, formatCost } from "./cost";
import { FarmIcon } from "./icons/FarmIcon";
import { HouseIcon } from "./icons/HouseIcon";
import { LumberjackIcon } from "./icons/LumberjackIcon";
import { MineIcon } from "./icons/MineIcon";
import { useAnimatedResources } from "./useAnimatedResources";

const ICONS: Record<BuildingKind, typeof FarmIcon> = {
  farm: FarmIcon,
  mine: MineIcon,
  lumberjack: LumberjackIcon,
  house: HouseIcon,
};

const COLORS: Record<BuildingKind, string> = {
  farm: "text-blood",
  mine: "text-gold",
  lumberjack: "text-amber-800",
  house: "text-stone-500",
};

type Props = {
  tile: Tile;
  state: GameState;
  readOnly: boolean;
  pending: boolean;
  error: string | null;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
  onAssignWorker: () => void;
  onUnassignWorker: () => void;
};

// Corps du mode inspection du panneau d'actions : inspecte un bâtiment, permet
// de l'améliorer, de le revendre et — pour les bâtiments de production — d'y
// assigner des ouvriers. Tout est dérivé de `kind` + `level` + `workers` via
// GAME_CONFIG. Le positionnement et la coquille sont portés par ActionPanel.
export function BuildingPanel({
  tile,
  state,
  readOnly,
  pending,
  error,
  onUpgrade,
  onSell,
  onClose,
  onAssignWorker,
  onUnassignWorker,
}: Props) {
  // Ressources interpolées en temps réel (boucle rAF partagée avec le HUD) :
  // le bouton « Améliorer » se débloque dès que la production atteint le coût,
  // sans attendre un aller-retour serveur.
  const { displayed: liveResources } = useAnimatedResources(state);

  const building = tile.building;
  if (building === null) return null;

  const def = BUILDINGS[building.kind];
  const Icon = ICONS[building.kind];
  const color = COLORS[building.kind];
  const level = building.level;
  const atMax = isMaxLevel(building.kind, level);
  const cost = upgradeCost(building.kind, level);
  const affordable = canAfford(liveResources, cost);
  const canUpgrade = !readOnly && !atMax && affordable && !pending;
  const refund = sellRefund(building.kind, level);
  const canSell = !readOnly && !pending;

  const housing = isHousing(building.kind);

  // Bâtiment de production : production réelle = taux/ouvrier × ouvriers.
  const output = effectiveRate(building);
  const perWorkerRate = buildingRate(building.kind, level);
  const capacity = workerCapacity(building.kind, level);
  const available = availablePopulation(state);
  const canAddWorker =
    !readOnly && !pending && building.workers < capacity && available >= 1;
  const canRemoveWorker = !readOnly && !pending && building.workers > 0;

  // Bâtiment de logement : population fournie au niveau courant / suivant.
  const populationProvided = populationCapacityAt(building.kind, level);
  const nextPopulationProvided = populationCapacityAt(
    building.kind,
    level + 1,
  );

  return (
    <div>
      <div className="flex items-start gap-3">
        <Icon className={`h-9 w-9 ${color} pixelated`} />
        <div className="flex-1">
          <div className="font-serif text-xl text-ink">{def.label}</div>
          <div className="text-[10px] uppercase tracking-widest text-ink/50 font-sans">
            Niveau {level}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="font-sans text-xl leading-none text-ink/40 transition-colors hover:text-ink"
        >
          &times;
        </button>
      </div>

      <p className="mt-3 font-serif text-sm italic text-ink/60">
        {def.description}
      </p>

      {housing ? (
        <div className="mt-4 flex flex-col gap-1 font-sans text-sm text-ink/80">
          <div className="flex justify-between">
            <span>Population fournie</span>
            <span className="tabular-nums">{populationProvided}</span>
          </div>
          {!atMax && (
            <div className="flex justify-between text-ink/50">
              <span>Niveau {level + 1}</span>
              <span className="tabular-nums">{nextPopulationProvided}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-1 font-sans text-sm text-ink/80">
            <div className="flex justify-between">
              <span>Production</span>
              <span className="tabular-nums">{output.toFixed(2)} / s</span>
            </div>
            <div className="flex justify-between text-ink/50">
              <span>Par ouvrier</span>
              <span className="tabular-nums">
                {perWorkerRate.toFixed(2)} / s
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3 font-sans text-sm text-ink/80">
            <div className="flex items-center justify-between">
              <span>Ouvriers</span>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <button
                    type="button"
                    disabled={!canRemoveWorker}
                    onClick={onUnassignWorker}
                    aria-label="Retirer un ouvrier"
                    className="h-6 w-6 rounded border border-ink/40 font-sans text-base leading-none text-ink/80 transition-colors hover:bg-ink hover:text-parchment disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/40 disabled:hover:bg-ink/10 disabled:hover:text-ink/40"
                  >
                    &minus;
                  </button>
                )}
                <span className="tabular-nums">
                  {building.workers} / {capacity}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    disabled={!canAddWorker}
                    onClick={onAssignWorker}
                    aria-label="Assigner un ouvrier"
                    className="h-6 w-6 rounded border border-blood font-sans text-base leading-none text-blood transition-colors hover:bg-blood hover:text-parchment disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/40 disabled:hover:bg-ink/10 disabled:hover:text-ink/40"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            {!readOnly && (
              <div className="mt-1 flex justify-between text-ink/50">
                <span>Sujets disponibles</span>
                <span className="tabular-nums">{available}</span>
              </div>
            )}
          </div>
        </>
      )}

      {!readOnly && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          {atMax ? (
            <div className="text-center font-serif text-sm italic text-ink/50">
              Niveau maximal atteint.
            </div>
          ) : (
            <>
              <div className="flex justify-between font-sans text-sm text-ink/80">
                <span>Amélioration</span>
                <span className="tabular-nums">{formatCost(cost)}</span>
              </div>
              <button
                type="button"
                disabled={!canUpgrade}
                onClick={onUpgrade}
                className="mt-3 w-full rounded-md border border-blood bg-parchment px-5 py-2 font-serif text-lg text-blood transition-colors hover:bg-blood hover:text-parchment disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/40 disabled:hover:bg-ink/10 disabled:hover:text-ink/40"
              >
                Améliorer
              </button>
            </>
          )}
          <div className="mt-3 flex justify-between font-sans text-sm text-ink/80">
            <span>Revente</span>
            <span className="tabular-nums">{formatCost(refund)}</span>
          </div>
          <button
            type="button"
            disabled={!canSell}
            onClick={onSell}
            className="mt-3 w-full rounded-md border border-ink/40 bg-parchment px-5 py-2 font-serif text-lg text-ink/80 transition-colors hover:bg-ink hover:text-parchment disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/40 disabled:hover:bg-ink/10 disabled:hover:text-ink/40"
          >
            Vendre
          </button>
          <div className="mt-1 h-4 font-serif text-xs italic text-blood/80">
            {error ?? " "}
          </div>
        </div>
      )}
    </div>
  );
}
