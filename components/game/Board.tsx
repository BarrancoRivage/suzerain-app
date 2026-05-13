"use client";

import { useEffect, useState, useTransition } from "react";

import {
  loadGameAction,
  placeBuildingAction,
} from "@/app/play/actions";
import { GRID_SIZE, type BuildingKind, type GameState } from "@/lib/game/types";
import { BuildPanel } from "./BuildPanel";
import { ResourcePanel } from "./ResourcePanel";
import { TileCell } from "./Tile";

export function Board() {
  const [state, setState] = useState<GameState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<BuildingKind | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    loadGameAction().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setState(res.state);
      } else {
        setLoadError(res.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleTileClick(x: number, y: number) {
    if (selectedKind === null || pending) return;
    const kind = selectedKind;
    setActionError(null);
    startTransition(async () => {
      const res = await placeBuildingAction(x, y, kind);
      if (res.ok) {
        setState(res.state);
        setSelectedKind(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  if (loadError !== null) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-md border border-blood/40 bg-parchment/80 p-6 text-center font-serif text-blood">
        {loadError}
      </div>
    );
  }

  if (state === null) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center font-serif italic text-ink/40">
        Le royaume s&rsquo;éveille…
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10 py-10 px-6">
      <ResourcePanel state={state} />

      <div
        className="grid gap-1.5 w-full max-w-md"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        }}
      >
        {state.tiles.map((tile) => {
          const clickable =
            selectedKind !== null && tile.building === null && !pending;
          return (
            <TileCell
              key={`${tile.x}-${tile.y}`}
              tile={tile}
              clickable={clickable}
              onClick={() => handleTileClick(tile.x, tile.y)}
            />
          );
        })}
      </div>

      <BuildPanel
        selected={selectedKind}
        onSelect={setSelectedKind}
        disabled={pending}
      />

      <div className="h-4 text-xs italic font-serif text-blood/80">
        {actionError ?? " "}
      </div>
    </div>
  );
}
