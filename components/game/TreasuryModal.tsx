"use client";

import { useEffect, useState } from "react";

import {
  formatAmount,
  RESOURCES,
  resourceGroups,
} from "@/lib/game/resources";
import type { GameState, ResourceCategory } from "@/lib/game/types";
import { ResourceIcon } from "./icons/ResourceIcon";
import { useAnimatedResources } from "./useAnimatedResources";

// Modale « Trésorerie » : inventaire complet du fief — les 30 ressources,
// réparties en onglets par catégorie, et sous-groupées à l'intérieur. Ouverte
// depuis le bouton ⊞ du HUD. Pattern overlay + carte calqué sur NamePrompt.
// Fermeture : bouton ×, clic sur l'overlay, touche Échap.
const CATEGORIES: ReadonlyArray<{
  category: ResourceCategory;
  title: string;
}> = [
  { category: "primary", title: "Principales" },
  { category: "prestige", title: "Renommée" },
  { category: "secondary", title: "Secondaires" },
];

type Props = {
  state: GameState;
  onClose: () => void;
};

export function TreasuryModal({ state, onClose }: Props) {
  const { displayed, rates } = useAnimatedResources(state);
  const [activeCategory, setActiveCategory] =
    useState<ResourceCategory>("primary");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = resourceGroups(activeCategory);
  const showGroupHeaders = groups.size > 1;

  return (
    <div
      data-no-edge-pan
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trésorerie"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl animate-fade-in flex-col rounded-md border border-gold/50 bg-parchment shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-gold/30 px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">Trésorerie</h2>
            <p className="mt-1 font-serif text-sm italic text-ink/60">
              L&rsquo;inventaire complet du fief.
            </p>
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

        {/* Onglets par catégorie */}
        <div
          role="tablist"
          className="flex gap-1 border-b border-gold/30 px-6 pt-3"
        >
          {CATEGORIES.map(({ category, title }) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(category)}
                className={`-mb-px rounded-t-md border-x border-t px-4 py-1.5 font-sans text-[10px] uppercase tracking-widest transition-colors ${
                  isActive
                    ? "border-gold/40 bg-parchment text-ink"
                    : "border-transparent text-ink/40 hover:text-ink"
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>

        {/* Hauteur fixe : la modale garde la même taille quel que soit
            l'onglet, le contenu plus long défile. */}
        <div className="h-[50vh] overflow-y-auto px-6 py-4">
          {[...groups.entries()].map(([group, kinds]) => (
            <div key={group} className="mb-4 last:mb-0">
              {showGroupHeaders && (
                <h4 className="font-serif text-sm italic text-ink/50">
                  {group}
                </h4>
              )}
              <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {kinds.map((kind) => {
                  const def = RESOURCES[kind];
                  const rate = rates[kind];
                  return (
                    <div
                      key={kind}
                      className="flex items-center gap-2 py-0.5"
                      title={def.description}
                    >
                      <ResourceIcon
                        kind={kind}
                        className={`h-4 w-4 shrink-0 ${def.tone} pixelated`}
                      />
                      <span className="flex-1 truncate font-serif text-sm text-ink">
                        {def.label}
                      </span>
                      <span className="font-serif text-sm tabular-nums text-ink">
                        {formatAmount(displayed[kind], kind)}
                      </span>
                      {rate > 0 && (
                        <span className="font-sans text-[10px] tabular-nums text-moss">
                          +{rate.toFixed(2)}/s
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
