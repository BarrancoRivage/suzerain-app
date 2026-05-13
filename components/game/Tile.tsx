"use client";

import type { BuildingKind, Tile } from "@/lib/game/types";
import { FarmIcon } from "./icons/FarmIcon";
import { MineIcon } from "./icons/MineIcon";

const BUILDING_VISUALS: Record<
  BuildingKind,
  { Icon: typeof FarmIcon; colorClass: string }
> = {
  farm: { Icon: FarmIcon, colorClass: "text-blood" },
  mine: { Icon: MineIcon, colorClass: "text-gold" },
};

type Props = {
  tile: Tile;
  clickable: boolean;
  onClick: () => void;
};

export function TileCell({ tile, clickable, onClick }: Props) {
  const base = "relative aspect-square w-full border transition-colors";
  const variant = tile.building
    ? "bg-parchment border-ink/30"
    : clickable
      ? "bg-parchment/60 border-gold/50 ring-1 ring-gold/20 cursor-pointer hover:bg-parchment hover:border-gold"
      : "bg-parchment/40 border-ink/10 cursor-default";

  const visual = tile.building
    ? BUILDING_VISUALS[tile.building.kind]
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`${base} ${variant}`}
      aria-label={
        tile.building
          ? `Tuile ${tile.x},${tile.y} — ${tile.building.kind}`
          : `Tuile ${tile.x},${tile.y} — vide`
      }
    >
      {visual ? (
        <visual.Icon className={`absolute inset-1.5 ${visual.colorClass} pixelated`} />
      ) : null}
    </button>
  );
}
