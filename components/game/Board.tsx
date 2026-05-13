"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  loadGameAction,
  placeBuildingAction,
} from "@/app/play/actions";
import { biomeAt, isBuildable } from "@/lib/game/biome";
import type { BuildingKind, GameState } from "@/lib/game/types";
import { BuildPanel } from "./BuildPanel";
import { ResourcePanel } from "./ResourcePanel";
import { BOARD_HEIGHT, BOARD_WIDTH, IsoTile } from "./IsoTile";

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

  const sortedTiles = useMemo(() => {
    if (state === null) return null;
    return [...state.tiles].sort((a, b) =>
      a.x + a.y - (b.x + b.y) || a.y - b.y,
    );
  }, [state]);

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

  if (state === null || sortedTiles === null) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center font-serif italic text-ink/40">
        Le royaume s&rsquo;éveille…
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-10">
      <ResourcePanel state={state} />

      <IsoBoardCanvas>
        {sortedTiles.map((tile) => {
          const biome = biomeAt(state.playerId, tile.x, tile.y);
          const clickable =
            selectedKind !== null &&
            tile.building === null &&
            isBuildable(biome) &&
            !pending;
          return (
            <IsoTile
              key={`${tile.x}-${tile.y}`}
              tile={tile}
              biome={biome}
              clickable={clickable}
              onClick={() => handleTileClick(tile.x, tile.y)}
            />
          );
        })}
      </IsoBoardCanvas>

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

function IsoBoardCanvas({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      setScale(Math.min(1, width / BOARD_WIDTH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full max-w-[576px] mx-auto"
      style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
