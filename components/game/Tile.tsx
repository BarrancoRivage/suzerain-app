"use client";

import type { Tile } from "@/lib/game/types";
import { FarmIcon } from "./icons/FarmIcon";

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
      {tile.building?.kind === "farm" ? (
        <FarmIcon className="absolute inset-1.5 text-blood pixelated" />
      ) : null}
    </button>
  );
}
