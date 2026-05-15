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
  // Tuile dont le bâtiment est inspecté (panneau d'actions). null = aucun.
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

  function handleOpenBuildMenu() {
    setInspected(null);
    setActionError(null);
    setBuildMenuOpen(true);
  }

  function handleCloseBuildMenu() {
    setSelectedKind(null);
    setBuildMenuOpen(false);
  }

  function handleSelectPlayer(targetId: string) {
    setViewError(null);
    setInspected(null);
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
    setInspected(null);
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

  function handleTileClick(q: number, r: number, subX = 0, subZ = 0) {
    // Mode inspection : aucun bâtiment sélectionné → cliquer un bâtiment ouvre
    // le panneau latéral (fonctionne aussi en lecture seule, pour visiter).
    if (selectedKind === null) {
      const tile = activeState.tiles.find((t) => t.q === q && t.r === r);
      if (tile?.building) {
        setActionError(null);
        setBuildMenuOpen(false);
        setInspected({ q, r });
      }
      return;
    }

    // Mode pose. La sub-position (subX, subZ) provient du clic réel sur le
    // terrain, snappée à la fine grid dans WorldTerrain → l'engine clampe.
    if (isReadOnly || pending) return;
    const kind = selectedKind;
    setActionError(null);
    startTransition(async () => {
      const res = await placeBuildingAction(q, r, kind, subX, subZ);
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

  function handleSell() {
    if (inspected === null || isReadOnly || pending) return;
    const { q, r } = inspected;
    setActionError(null);
    startTransition(async () => {
      const res = await sellBuildingAction(q, r);
      if (res.ok) {
        setOwnState(res.state);
        // Le bâtiment n'existe plus : on ferme le panneau d'inspection.
        setInspected(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleAssignWorker() {
    if (inspected === null || isReadOnly || pending) return;
    const { q, r } = inspected;
    setActionError(null);
    startTransition(async () => {
      const res = await assignWorkerAction(q, r);
      if (res.ok) {
        setOwnState(res.state);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleUnassignWorker() {
    if (inspected === null || isReadOnly || pending) return;
    const { q, r } = inspected;
    setActionError(null);
    startTransition(async () => {
      const res = await unassignWorkerAction(q, r);
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
    // Construire partout sauf eau et chemins (rivière/route bloquent la
    // pose — mais les montagnes sont OK).
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

  return (
    <>
      <HexBoard
        state={activeState}
        selectedKind={selectedKind}
        clickableTileKey={isClickable}
        onTileClick={handleTileClick}
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
        inspectedTile={inspectedTile}
        state={activeState}
        onUpgrade={handleUpgrade}
        onSell={handleSell}
        onCloseInspect={() => setInspected(null)}
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
