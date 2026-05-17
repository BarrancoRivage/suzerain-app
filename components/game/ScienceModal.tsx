"use client";

import { useEffect } from "react";

import { TECHS, TECH_KINDS, techStatus } from "@/lib/game/techs";
import type { GameState, TechKind } from "@/lib/game/types";
import { useAnimatedResources } from "./useAnimatedResources";

// Modale « Arbre de science » : liste les nœuds avec leur statut (locked /
// available / unlocked). Pattern overlay calqué sur TreasuryModal (overlay
// cliquable, fermeture Échap, carte centrée). Le bouton « Rechercher »
// déclenche unlockTechAction (via onUnlock) et n'apparaît pas en lecture seule
// (visite d'un autre fief).
type Props = {
  state: GameState;
  readOnly: boolean;
  pending: boolean;
  error: string | null;
  onUnlock: (kind: TechKind) => void;
  onClose: () => void;
};

export function ScienceModal({
  state,
  readOnly,
  pending,
  error,
  onUnlock,
  onClose,
}: Props) {
  // On affiche la science interpolée pour rester cohérent avec le HUD : si la
  // valeur affichée passe le coût, le bouton se débloque sans round-trip.
  const { displayed } = useAnimatedResources(state);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Arbre de science"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl animate-fade-in flex-col rounded-md border border-gold/50 bg-parchment shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-gold/30 px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">Arbre de science</h2>
            <p className="mt-1 font-serif text-sm italic text-ink/60">
              Le savoir accumulé débloque de nouvelles avancées.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-sans text-[10px] uppercase tracking-widest text-ink/50">
                Science
              </div>
              <div className="font-serif text-lg tabular-nums text-sky-700">
                {Math.floor(displayed.science)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="font-sans text-2xl leading-none text-ink/40 transition-colors hover:text-ink"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="h-[55vh] space-y-3 overflow-y-auto px-6 py-4">
          {TECH_KINDS.map((kind) => {
            const def = TECHS[kind];
            const status = techStatus(kind, state.unlockedTechs);
            const canAfford = displayed.science >= def.requiredScience;
            const disabled =
              readOnly || pending || status !== "available" || !canAfford;

            return (
              <div
                key={kind}
                className={`rounded border p-4 transition-colors ${
                  status === "unlocked"
                    ? "border-moss/50 bg-moss/10"
                    : status === "available"
                      ? "border-sky-700/40 bg-parchment"
                      : "border-ink/15 bg-ink/5 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-lg text-ink">
                      {def.label}
                    </div>
                    <p className="mt-1 font-serif text-sm italic text-ink/60">
                      {def.description}
                    </p>
                    {def.requires.length > 0 && (
                      <p className="mt-1 font-sans text-xs text-ink/50">
                        Prérequis :{" "}
                        {def.requires.map((r) => TECHS[r].label).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {status === "unlocked" ? (
                      <span className="font-sans text-xs uppercase tracking-widest text-moss">
                        Débloqué
                      </span>
                    ) : (
                      <>
                        <div className="font-sans text-xs text-ink/60">
                          {def.requiredScience} science
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onUnlock(kind)}
                            className="mt-2 rounded-md border border-sky-700 bg-parchment px-4 py-1.5 font-serif text-sm text-sky-700 transition-colors hover:bg-sky-700 hover:text-parchment disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-ink/10 disabled:text-ink/40 disabled:hover:bg-ink/10 disabled:hover:text-ink/40"
                          >
                            Rechercher
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <div className="h-6 border-t border-ink/10 px-6 py-1 text-center font-serif text-xs italic text-blood/80">
            {error ?? " "}
          </div>
        )}
      </div>
    </div>
  );
}
