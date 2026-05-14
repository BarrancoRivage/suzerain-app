"use client";

import Link from "next/link";

import type { GameState, PlayerSummary } from "@/lib/game/types";
import { PlayerList } from "./PlayerList";
import { ResourcePanel } from "./ResourcePanel";
import { TopBarMenu } from "./TopBarMenu";

type Props = {
  state: GameState;
  players: PlayerSummary[];
  activePlayerId: string | null;
  ownPlayerId: string | null;
  ownName: string | null;
  onSelectPlayer: (playerId: string) => void;
  onOpenTreasury: () => void;
  onEditName: () => void;
};

// Barre supérieure pleine largeur, fond opaque : logo + version à gauche,
// cluster de ressources au centre, menus (Royaume / Trésorerie / Mon fief) à
// droite. Remplace l'ancien header de page.tsx, le ResourcePanel flottant et
// l'ancienne barre latérale PlayerList.
export function TopBar({
  state,
  players,
  activePlayerId,
  ownPlayerId,
  ownName,
  onSelectPlayer,
  onOpenTreasury,
  onEditName,
}: Props) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between gap-4 border-b border-gold/30 bg-parchment px-6 shadow-sm">
      <div className="flex shrink-0 items-baseline gap-2">
        <Link
          href="/"
          className="font-serif text-2xl leading-none text-ink transition-colors hover:text-blood"
        >
          Suzerain
        </Link>
        <span className="hidden font-sans text-[10px] uppercase tracking-widest text-ink/50 lg:inline">
          Le Fief · v0.2
        </span>
      </div>

      <ResourcePanel state={state} />

      <nav className="flex shrink-0 items-center gap-2">
        <TopBarMenu label="Royaume">
          {(close) => (
            <PlayerList
              players={players}
              activePlayerId={activePlayerId}
              ownPlayerId={ownPlayerId}
              onSelect={(id) => {
                onSelectPlayer(id);
                close();
              }}
            />
          )}
        </TopBarMenu>

        <button
          type="button"
          onClick={onOpenTreasury}
          className="rounded-md border border-gold/30 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-ink/70 transition-colors hover:border-gold hover:text-ink"
        >
          Trésorerie
        </button>

        <TopBarMenu label="Mon fief">
          {(close) => (
            <div className="w-56 p-4">
              <p className="font-sans text-[10px] uppercase tracking-widest text-ink/60">
                Mon fief
              </p>
              <p className="mt-1 truncate font-serif text-lg text-ink">
                {ownName ?? (
                  <span className="italic text-ink/50">Anonyme</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  onEditName();
                  close();
                }}
                className="mt-3 w-full rounded-md border border-ink/30 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-ink/80 transition-colors hover:bg-ink hover:text-parchment"
              >
                {ownName ? "Changer mon nom" : "Renseigner mon nom"}
              </button>
            </div>
          )}
        </TopBarMenu>
      </nav>
    </header>
  );
}
