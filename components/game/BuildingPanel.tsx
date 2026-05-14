"use client";

import { BUILDINGS } from "@/lib/game/buildings";
import {
  buildingRate,
  isMaxLevel,
  sellRefund,
  upgradeCost,
} from "@/lib/game/config";
import type { BuildingKind, GameState, Tile } from "@/lib/game/types";
import { canAfford, formatCost } from "./cost";
import { FarmIcon } from "./icons/FarmIcon";
import { MineIcon } from "./icons/MineIcon";
import { useAnimatedResources } from "./useAnimatedResources";

const ICONS: Record<BuildingKind, typeof FarmIcon> = {
  farm: FarmIcon,
  mine: MineIcon,
};

const COLORS: Record<BuildingKind, string> = {
  farm: "text-blood",
  mine: "text-gold",
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
};

// Panneau latéral non-bloquant : inspecte un bâtiment et permet de l'améliorer.
// Tout est dérivé de `kind` + `level` via GAME_CONFIG (lib/game/config.ts) — la
// future personnalisation par bâtiment ne touchera que ce composant et la config.
export function BuildingPanel({
  tile,
  state,
  readOnly,
  pending,
  error,
  onUpgrade,
  onSell,
  onClose,
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
  const currentRate = buildingRate(building.kind, level);
  const nextRate = buildingRate(building.kind, level + 1);
  const cost = upgradeCost(building.kind, level);
  const affordable = canAfford(liveResources, cost);
  const canUpgrade = !readOnly && !atMax && affordable && !pending;
  const refund = sellRefund(building.kind, level);
  const canSell = !readOnly && !pending;

  return (
    <div className="w-72 rounded-md border border-gold/40 bg-parchment/95 p-5 shadow-lg">
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

      <div className="mt-4 flex flex-col gap-1 font-sans text-sm text-ink/80">
        <div className="flex justify-between">
          <span>Production</span>
          <span className="tabular-nums">{currentRate.toFixed(2)} / s</span>
        </div>
        {!atMax && (
          <div className="flex justify-between text-ink/50">
            <span>Niveau {level + 1}</span>
            <span className="tabular-nums">{nextRate.toFixed(2)} / s</span>
          </div>
        )}
      </div>

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
