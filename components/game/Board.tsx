"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";

import {
  listPlayersAction,
  loadGameAction,
  loadPlayerStateAction,
  placeBuildingAction,
  setPlayerNameAction,
  upgradeBuildingAction,
} from "@/app/play/actions";
import type {
  BuildingKind,
  GameState,
  PlayerSummary,
} from "@/lib/game/types";
import { BuildPanel } from "./BuildPanel";
import { BuildingPanel } from "./BuildingPanel";
import { NamePrompt } from "./NamePrompt";
import { PlayerList } from "./PlayerList";
import { ResourcePanel } from "./ResourcePanel";
import { ViewingBanner } from "./ViewingBanner";

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
  // État du fief du joueur (modifiable).
  const [ownState, setOwnState] = useState<GameState | null>(null);
  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(null);
  const [ownName, setOwnName] = useState<string | null>(null);

  // Fief actuellement visité. null = on regarde son propre fief.
  const [viewedState, setViewedState] = useState<GameState | null>(null);
  const [viewedName, setViewedName] = useState<string | null>(null);

  const [players, setPlayers] = useState<PlayerSummary[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<BuildingKind | null>(null);
  // Tuile dont le bâtiment est inspecté (panneau latéral). null = aucun.
  const [inspected, setInspected] = useState<{ q: number; r: number } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    loadGameAction().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setOwnState(res.state);
        setOwnPlayerId(res.playerId);
        setOwnName(res.name);
        if (res.name === null) setNamePromptOpen(true);
      } else {
        setLoadError(res.message);
      }
    });
    listPlayersAction().then((res) => {
      if (cancelled) return;
      if (res.ok) setPlayers(res.players);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // viewedState n'est jamais positionné sur son propre fief (cf.
  // handleSelectPlayer) — il n'est non-null que pour un fief tiers.
  const isReadOnly =
    viewedState !== null && viewedState.playerId !== ownPlayerId;

  function handleSelectPlayer(targetId: string) {
    setViewError(null);
    setInspected(null);
    if (ownPlayerId !== null && targetId === ownPlayerId) {
      setViewedState(null);
      setViewedName(null);
      return;
    }
    startTransition(async () => {
      const res = await loadPlayerStateAction(targetId);
      if (res.ok) {
        setViewedState(res.state);
        setViewedName(res.name);
        setSelectedKind(null);
      } else {
        setViewError(res.message);
      }
    });
  }

  function handleReturnToOwnFief() {
    setViewError(null);
    setInspected(null);
    setViewedState(null);
    setViewedName(null);
  }

  function handleSetName(name: string) {
    setNameError(null);
    startTransition(async () => {
      const res = await setPlayerNameAction(name);
      if (res.ok) {
        setOwnName(res.name);
        setNamePromptOpen(false);
        const list = await listPlayersAction();
        if (list.ok) setPlayers(list.players);
      } else {
        setNameError(res.message);
      }
    });
  }

  function handleTileClick(q: number, r: number) {
    // Mode inspection : aucun bâtiment sélectionné → cliquer un bâtiment ouvre
    // le panneau latéral (fonctionne aussi en lecture seule, pour visiter).
    if (selectedKind === null) {
      const tile = activeState.tiles.find((t) => t.q === q && t.r === r);
      if (tile?.building) {
        setActionError(null);
        setInspected({ q, r });
      }
      return;
    }

    // Mode pose.
    if (isReadOnly || pending) return;
    const kind = selectedKind;
    setActionError(null);
    startTransition(async () => {
      const res = await placeBuildingAction(q, r, kind);
      if (res.ok) {
        setOwnState(res.state);
        setSelectedKind(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleUpgrade() {
    if (inspected === null || isReadOnly || pending) return;
    const { q, r } = inspected;
    setActionError(null);
    startTransition(async () => {
      const res = await upgradeBuildingAction(q, r);
      if (res.ok) {
        setOwnState(res.state);
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

  if (ownState === null) {
    return (
      <div className="absolute inset-0 flex items-center justify-center font-serif italic text-ink/40">
        Le royaume s&rsquo;éveille…
      </div>
    );
  }

  const activeState = viewedState ?? ownState;

  const isClickable = (q: number, r: number): boolean => {
    if (pending) return false;
    const tile = activeState.tiles.find((t) => t.q === q && t.r === r);
    if (!tile) return false;
    // Mode inspection : tout bâtiment est cliquable, même en lecture seule.
    if (selectedKind === null) return tile.building !== null;
    // Mode pose : tuile vide et constructible, sur son propre fief.
    if (isReadOnly) return false;
    if (tile.biome === "water") return false;
    if (tile.path) return false;
    return tile.building === null;
  };

  // Re-dérivée à chaque render depuis activeState : le panneau reflète ainsi le
  // niveau à jour après une amélioration.
  const inspectedTile =
    inspected === null
      ? null
      : activeState.tiles.find(
          (t) => t.q === inspected.q && t.r === inspected.r,
        ) ?? null;

  const statusMessage = viewError ?? actionError;

  return (
    <>
      <HexBoard
        state={activeState}
        clickableTileKey={isClickable}
        onTileClick={handleTileClick}
      />

      <PlayerList
        players={players}
        activePlayerId={viewedState ? viewedState.playerId : ownPlayerId}
        ownPlayerId={ownPlayerId}
        onSelect={handleSelectPlayer}
        onEditName={() => {
          setNameError(null);
          setNamePromptOpen(true);
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-6">
        <div className="pointer-events-auto">
          <ResourcePanel state={activeState} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 px-6">
        <div className="pointer-events-auto">
          {isReadOnly ? (
            <ViewingBanner name={viewedName} onReturn={handleReturnToOwnFief} />
          ) : (
            <BuildPanel
              selected={selectedKind}
              onSelect={setSelectedKind}
              disabled={pending}
              resources={activeState.resources}
            />
          )}
        </div>
        <div className="h-4 font-serif text-xs italic text-blood/80">
          {statusMessage ?? " "}
        </div>
      </div>

      {inspectedTile?.building && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center px-6">
          <div className="pointer-events-auto">
            <BuildingPanel
              tile={inspectedTile}
              state={activeState}
              readOnly={isReadOnly}
              pending={pending}
              error={actionError}
              onUpgrade={handleUpgrade}
              onClose={() => setInspected(null)}
            />
          </div>
        </div>
      )}

      {namePromptOpen && (
        <NamePrompt
          onSubmit={handleSetName}
          onDismiss={() => setNamePromptOpen(false)}
          pending={pending}
          error={nameError}
          initialName={ownName ?? undefined}
        />
      )}
    </>
  );
}
