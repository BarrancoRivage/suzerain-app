"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";

import {
  loadGameAction,
  placeBuildingAction,
} from "@/app/play/actions";
import type { BuildingKind, GameState } from "@/lib/game/types";
import { BuildPanel } from "./BuildPanel";
import { ResourcePanel } from "./ResourcePanel";

// Canvas WebGL : importé dynamiquement, ssr:false. Le bundle three+R3F+drei
// ne charge qu'à l'arrivée sur /play, jamais sur la landing.
const HexBoard = dynamic(
  () => import("./3d/HexBoard").then((m) => m.HexBoard),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">
        La carte se déploie…
      </div>
    ),
  },
);

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

  function handleTileClick(q: number, r: number) {
    if (selectedKind === null || pending) return;
    const kind = selectedKind;
    setActionError(null);
    startTransition(async () => {
      const res = await placeBuildingAction(q, r, kind);
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
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-md border border-blood/40 bg-parchment/80 p-6 font-serif text-blood">
          {loadError}
        </div>
      </div>
    );
  }

  if (state === null) {
    return (
      <div className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">
        Le royaume s&rsquo;éveille…
      </div>
    );
  }

  const isClickable = (q: number, r: number): boolean => {
    if (selectedKind === null || pending) return false;
    const tile = state.tiles.find((t) => t.q === q && t.r === r);
    if (!tile) return false;
    if (tile.biome === "water") return false;
    return tile.building === null;
  };

  return (
    <>
      <HexBoard
        state={state}
        clickableTileKey={isClickable}
        onTileClick={handleTileClick}
      />

      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-6">
        <div className="pointer-events-auto">
          <ResourcePanel state={state} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 px-6">
        <div className="pointer-events-auto">
          <BuildPanel
            selected={selectedKind}
            onSelect={setSelectedKind}
            disabled={pending}
            resources={state.resources}
          />
        </div>
        <div className="h-4 text-xs italic font-serif text-blood/80">
          {actionError ?? " "}
        </div>
      </div>
    </>
  );
}
