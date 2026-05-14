"use client";

import { CrownIcon } from "@/components/CrownIcon";
import type { PlayerSummary } from "@/lib/game/types";
import { ResourceIcon } from "./icons/ResourceIcon";

type Props = {
  players: PlayerSummary[];
  activePlayerId: string | null;
  ownPlayerId: string | null;
  onSelect: (playerId: string) => void;
  onEditName: () => void;
};

// Teinte héraldique déterministe par joueur — simple repère visuel dans la
// liste, pas besoin d'un vrai blason.
function hueFor(playerId: string): number {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function PlayerList({
  players,
  activePlayerId,
  ownPlayerId,
  onSelect,
  onEditName,
}: Props) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-0 top-20 z-10 flex w-60 flex-col p-4">
      <div className="pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-md border border-gold/40 bg-parchment/85 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gold/30 px-4 py-3">
          <h2 className="font-serif text-lg leading-none text-ink">
            Fiefs du royaume
          </h2>
          <p className="mt-1 font-sans text-[10px] uppercase tracking-widest text-ink/50">
            Classement par prestige
          </p>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {players.length === 0 ? (
            <li className="px-2 py-3 font-serif text-xs italic text-ink/40">
              Le royaume est encore désert…
            </li>
          ) : (
            players.map((player, index) => {
              const isOwn = player.playerId === ownPlayerId;
              const isActive = player.playerId === activePlayerId;
              const label = player.name ?? "Anonyme";

              return (
                <li key={player.playerId}>
                  <button
                    type="button"
                    onClick={() => onSelect(player.playerId)}
                    className={`group flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "border-blood bg-parchment shadow-sm"
                        : "border-transparent hover:border-gold hover:bg-parchment/70"
                    }`}
                  >
                    <span className="w-4 shrink-0 text-right font-sans text-[10px] tabular-nums text-ink/40">
                      {index + 1}
                    </span>
                    {isOwn ? (
                      <CrownIcon className="pixelated h-3.5 w-3.5 shrink-0 text-gold" />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink/20"
                        style={{
                          backgroundColor: `hsl(${hueFor(player.playerId)} 45% 45%)`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`flex-1 truncate font-serif text-base ${
                        player.name ? "text-ink" : "italic text-ink/50"
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className="flex shrink-0 items-center gap-0.5 font-sans text-[11px] tabular-nums text-gold"
                      title={`${player.prestige} de prestige`}
                    >
                      <ResourceIcon
                        kind="prestige"
                        className="pixelated h-3 w-3"
                      />
                      {Math.round(player.prestige)}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <button
          type="button"
          onClick={onEditName}
          className="border-t border-gold/30 px-4 py-2.5 text-left font-sans text-xs uppercase tracking-widest text-ink/50 transition-colors hover:bg-parchment/70 hover:text-ink"
        >
          {ownPlayerId !== null &&
          players.some((p) => p.playerId === ownPlayerId && p.name !== null)
            ? "Changer mon nom"
            : "Renseigner mon nom"}
        </button>
      </div>
    </div>
  );
}
