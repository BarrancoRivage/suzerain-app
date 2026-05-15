"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";

import {
  assignWorkerAction,
  listPlayersAction,
  loadGameAction,
  loadPlayerStateAction,
  placeBuildingAction,
  sellBuildingAction,
  setPlayerNameAction,
  unassignWorkerAction,
  upgradeBuildingAction,
} from "@/app/play/actions";
import type {
  BuildingKind,
  GameState,
  PlayerSummary,
} from "@/lib/game/types";
import { ActionPanel } from "./ActionPanel";
import { NamePrompt } from "./NamePrompt";
import { TopBar } from "./TopBar";
import { TreasuryModal } from "./TreasuryModal";

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
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<BuildingKind | null>(null);
  // Menu de construction déplié dans le panneau d'actions. Invariant :
  // selectedKind !== null implique buildMenuOpen === true.
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  // Bâtiment inspecté (panneau d'actions). null = aucun.
  const [inspectedId, setInspectedId] = useState<string | null>(null);
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

  function handleOpenBuildMenu() {
    setInspectedId(null);
    setActionError(null);
    setBuildMenuOpen(true);
  }

  function handleCloseBuildMenu() {
    setSelectedKind(null);
    setBuildMenuOpen(false);
  }

  function handleSelectPlayer(targetId: string) {
    setViewError(null);
    setInspectedId(null);
    setBuildMenuOpen(false);
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
    setInspectedId(null);
    setBuildMenuOpen(false);
    setSelectedKind(null);
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

  function handleWorldClick(
    x: number,
    z: number,
    hitBuildingId: string | null,
  ) {
    if (selectedKind === null) {
      if (hitBuildingId !== null) {
        setActionError(null);
        setBuildMenuOpen(false);
        setInspectedId(hitBuildingId);
      }
      return;
    }
    if (isReadOnly || pending) return;
    const kind = selectedKind;
    setActionError(null);
    startTransition(async () => {
      const res = await placeBuildingAction(x, z, kind);
      if (res.ok) {
        setOwnState(res.state);
        setSelectedKind(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleUpgrade() {
    if (inspectedId === null || isReadOnly || pending) return;
    const id = inspectedId;
    setActionError(null);
    startTransition(async () => {
      const res = await upgradeBuildingAction(id);
      if (res.ok) setOwnState(res.state);
      else setActionError(res.message);
    });
  }

  function handleSell() {
    if (inspectedId === null || isReadOnly || pending) return;
    const id = inspectedId;
    setActionError(null);
    startTransition(async () => {
      const res = await sellBuildingAction(id);
      if (res.ok) {
        setOwnState(res.state);
        setInspectedId(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleAssignWorker() {
    if (inspectedId === null || isReadOnly || pending) return;
    const id = inspectedId;
    setActionError(null);
    startTransition(async () => {
      const res = await assignWorkerAction(id);
      if (res.ok) setOwnState(res.state);
      else setActionError(res.message);
    });
  }

  function handleUnassignWorker() {
    if (inspectedId === null || isReadOnly || pending) return;
    const id = inspectedId;
    setActionError(null);
    startTransition(async () => {
      const res = await unassignWorkerAction(id);
      if (res.ok) setOwnState(res.state);
      else setActionError(res.message);
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

  // Re-dérivée à chaque render depuis activeState : le panneau reflète ainsi le
  // niveau à jour après une amélioration.
  const inspectedBuilding =
    inspectedId === null
      ? null
      : activeState.buildings.find((b) => b.id === inspectedId) ?? null;

  return (
    <>
      <HexBoard
        state={activeState}
        selectedKind={selectedKind}
        isReadOnly={isReadOnly}
        pending={pending}
        onWorldClick={handleWorldClick}
      />

      <TopBar
        state={activeState}
        players={players}
        activePlayerId={viewedState ? viewedState.playerId : ownPlayerId}
        ownPlayerId={ownPlayerId}
        ownName={ownName}
        onSelectPlayer={handleSelectPlayer}
        onOpenTreasury={() => setTreasuryOpen(true)}
        onEditName={() => {
          setNameError(null);
          setNamePromptOpen(true);
        }}
      />

      <ActionPanel
        isReadOnly={isReadOnly}
        pending={pending}
        buildMenuOpen={buildMenuOpen}
        onOpenBuildMenu={handleOpenBuildMenu}
        onCloseBuildMenu={handleCloseBuildMenu}
        selectedKind={selectedKind}
        onSelect={setSelectedKind}
        resources={activeState.resources}
        inspectedBuilding={inspectedBuilding}
        state={activeState}
        onUpgrade={handleUpgrade}
        onSell={handleSell}
        onCloseInspect={() => setInspectedId(null)}
        onAssignWorker={handleAssignWorker}
        onUnassignWorker={handleUnassignWorker}
        viewedName={viewedName}
        onReturn={handleReturnToOwnFief}
        viewError={viewError}
        actionError={actionError}
      />

      {namePromptOpen && (
        <NamePrompt
          onSubmit={handleSetName}
          onDismiss={() => setNamePromptOpen(false)}
          pending={pending}
          error={nameError}
          initialName={ownName ?? undefined}
        />
      )}

      {treasuryOpen && (
        <TreasuryModal
          state={activeState}
          onClose={() => setTreasuryOpen(false)}
        />
      )}
    </>
  );
}
