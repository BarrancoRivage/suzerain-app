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
      <div className="w-full h-[520px] flex items-center justify-center font-serif italic text-ink/40">
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

  const isClickable = (q: number, r: number): boolean => {
    if (selectedKind === null || pending) return false;
    const tile = state.tiles.find((t) => t.q === q && t.r === r);
    return tile !== undefined && tile.building === null;
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 py-8 px-6">
      <ResourcePanel state={state} />

      <HexBoard
        state={state}
        clickableTileKey={isClickable}
        onTileClick={handleTileClick}
      />

      <BuildPanel
        selected={selectedKind}
        onSelect={setSelectedKind}
        disabled={pending}
        resources={state.resources}
      />

      <div className="h-4 text-xs italic font-serif text-blood/80">
        {actionError ?? " "}
      </div>
    </div>
  );
}
