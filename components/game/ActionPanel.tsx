"use client";

import type {
  BuildingKind,
  GameState,
  Resources,
  Tile,
} from "@/lib/game/types";
import { BuildPanel } from "./BuildPanel";
import { BuildingPanel } from "./BuildingPanel";
import { ViewingBanner } from "./ViewingBanner";

type Props = {
  isReadOnly: boolean;
  pending: boolean;
  buildMenuOpen: boolean;
  onOpenBuildMenu: () => void;
  onCloseBuildMenu: () => void;
  // Construction
  selectedKind: BuildingKind | null;
  onSelect: (kind: BuildingKind | null) => void;
  resources: Resources;
  // Inspection
  inspectedTile: Tile | null;
  state: GameState;
  onUpgrade: () => void;
  onSell: () => void;
  onCloseInspect: () => void;
  onAssignWorker: () => void;
  onUnassignWorker: () => void;
  // Visite d'un fief tiers
  viewedName: string | null;
  onReturn: () => void;
  // Statut
  viewError: string | null;
  actionError: string | null;
};

const SHELL =
  "w-72 rounded-md border border-gold/40 bg-parchment/95 p-5 shadow-lg animate-fade-in";

// Hub d'actions ancré dans le coin bas-gauche, façon jeu de stratégie. Trois
// états mutuellement exclusifs, rendus par priorité :
//   1. inspection — un bâtiment de la carte est sélectionné
//   2. visite — on regarde le fief d'un autre joueur (construction impossible)
//   3. construction — le menu « Bâtir » est déplié
//   4. replié — seul le bouton « Bâtir » est visible
export function ActionPanel({
  isReadOnly,
  pending,
  buildMenuOpen,
  onOpenBuildMenu,
  onCloseBuildMenu,
  selectedKind,
  onSelect,
  resources,
  inspectedTile,
  state,
  onUpgrade,
  onSell,
  onCloseInspect,
  onAssignWorker,
  onUnassignWorker,
  viewedName,
  onReturn,
  viewError,
  actionError,
}: Props) {
  let content: React.ReactNode;

  if (inspectedTile?.building) {
    content = (
      <div className={SHELL}>
        <BuildingPanel
          tile={inspectedTile}
          state={state}
          readOnly={isReadOnly}
          pending={pending}
          error={actionError}
          onUpgrade={onUpgrade}
          onSell={onSell}
          onClose={onCloseInspect}
          onAssignWorker={onAssignWorker}
          onUnassignWorker={onUnassignWorker}
        />
        {viewError && (
          <div className="mt-2 font-serif text-xs italic text-blood/80">
            {viewError}
          </div>
        )}
      </div>
    );
  } else if (isReadOnly) {
    content = <ViewingBanner name={viewedName} onReturn={onReturn} />;
  } else if (buildMenuOpen) {
    const status = actionError ?? viewError;
    const hint = selectedKind ? "Cliquez une tuile pour la poser." : null;
    content = (
      <div className={SHELL}>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[10px] uppercase tracking-widest text-ink/50">
            Bâtir
          </span>
          <button
            type="button"
            onClick={onCloseBuildMenu}
            aria-label="Replier"
            className="font-sans text-xl leading-none text-ink/40 transition-colors hover:text-ink"
          >
            &times;
          </button>
        </div>
        <BuildPanel
          selected={selectedKind}
          onSelect={onSelect}
          disabled={pending}
          resources={resources}
        />
        <div className="mt-3 h-4 font-serif text-xs italic text-blood/80">
          {status ?? hint ?? " "}
        </div>
      </div>
    );
  } else {
    content = (
      <button
        type="button"
        onClick={onOpenBuildMenu}
        className="rounded-md border border-gold/40 bg-parchment/85 px-5 py-3 font-serif text-lg text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-gold hover:bg-parchment"
      >
        Bâtir
      </button>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-8 left-6 z-10 flex flex-col items-start gap-2">
      <div className="pointer-events-auto">{content}</div>
    </div>
  );
}
