"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { ResourceIcon } from "@/components/game/icons/ResourceIcon";
import {
  RESOURCES,
  RESOURCE_KINDS,
  resourceGroups,
} from "@/lib/game/resources";
import type { ResourceKind } from "@/lib/game/types";

import {
  deletePlayerAction,
  listAdminPlayersAction,
  resetWorldAction,
  updatePlayerNameAction,
  updatePlayerResourcesAction,
  type AdminPlayerRow,
} from "@/app/admin/actions";

type Props = {
  initialPlayers: AdminPlayerRow[];
};

type DraftResources = Partial<Record<ResourceKind, string>>;

type RowDraft = {
  name: string;
  resources: DraftResources;
};

function makeDraft(row: AdminPlayerRow): RowDraft {
  const resources: DraftResources = {};
  if (row.resources) {
    for (const kind of RESOURCE_KINDS) {
      resources[kind] = String(row.resources[kind] ?? 0);
    }
  }
  return { name: row.name ?? "", resources };
}

function shortId(playerId: string): string {
  return `${playerId.slice(0, 8)}…${playerId.slice(-4)}`;
}

export function AdminClient({ initialPlayers }: Props) {
  const [players, setPlayers] = useState<AdminPlayerRow[]>(initialPlayers);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => Array.from(resourceGroups().entries()), []);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const res = await listAdminPlayersAction();
      if (res.ok) {
        setPlayers(res.players);
      } else {
        setError(res.message);
      }
    });
  }, []);

  function flash(message: string) {
    setInfo(message);
    setError(null);
    setTimeout(() => setInfo(null), 2500);
  }

  function fail(message: string) {
    setError(message);
    setInfo(null);
  }

  function toggleExpand(row: AdminPlayerRow) {
    if (expandedId === row.playerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.playerId);
    setDrafts((prev) => ({
      ...prev,
      [row.playerId]: makeDraft(row),
    }));
  }

  function updateDraft(playerId: string, patch: Partial<RowDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? { name: "", resources: {} }),
        ...patch,
      },
    }));
  }

  function updateDraftResource(
    playerId: string,
    kind: ResourceKind,
    value: string,
  ) {
    setDrafts((prev) => {
      const current = prev[playerId] ?? { name: "", resources: {} };
      return {
        ...prev,
        [playerId]: {
          ...current,
          resources: { ...current.resources, [kind]: value },
        },
      };
    });
  }

  function save(row: AdminPlayerRow) {
    const draft = drafts[row.playerId];
    if (!draft) return;

    startTransition(async () => {
      const tasks: Promise<unknown>[] = [];

      // Nom : ne renvoie que si modifié.
      const trimmed = draft.name.trim();
      if (trimmed && trimmed !== (row.name ?? "")) {
        tasks.push(
          updatePlayerNameAction(row.playerId, trimmed).then((res) => {
            if (!res.ok) throw new Error(res.message);
          }),
        );
      }

      // Ressources : diff par rapport au state actuel.
      if (row.hasState && row.resources) {
        const patch: Partial<Record<ResourceKind, number>> = {};
        let dirty = false;
        for (const kind of RESOURCE_KINDS) {
          const raw = draft.resources[kind];
          if (raw === undefined) continue;
          const parsed = Number(raw);
          if (!Number.isFinite(parsed) || parsed < 0) {
            fail(
              `Valeur invalide pour ${RESOURCES[kind].label} (nombre ≥ 0 requis).`,
            );
            return;
          }
          if (parsed !== row.resources[kind]) {
            patch[kind] = parsed;
            dirty = true;
          }
        }
        if (dirty) {
          tasks.push(
            updatePlayerResourcesAction(row.playerId, patch).then((res) => {
              if (!res.ok) throw new Error(res.message);
            }),
          );
        }
      }

      if (tasks.length === 0) {
        flash("Rien à enregistrer.");
        return;
      }

      try {
        await Promise.all(tasks);
        flash("Joueur mis à jour.");
        const res = await listAdminPlayersAction();
        if (res.ok) setPlayers(res.players);
      } catch (e) {
        fail(e instanceof Error ? e.message : "Erreur inconnue.");
      }
    });
  }

  function remove(row: AdminPlayerRow) {
    const ok = window.confirm(
      `Supprimer définitivement « ${row.name ?? "Anonyme"} » (${shortId(row.playerId)}) ?\nCette action est irréversible.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deletePlayerAction(row.playerId);
      if (!res.ok) {
        fail(res.message);
        return;
      }
      flash("Joueur supprimé.");
      setExpandedId(null);
      refresh();
    });
  }

  function confirmReset() {
    if (resetConfirmText !== "RESET") return;
    startTransition(async () => {
      const res = await resetWorldAction();
      if (!res.ok) {
        fail(res.message);
        return;
      }
      setResetOpen(false);
      setResetConfirmText("");
      flash("Le monde a été remis à zéro.");
      refresh();
    });
  }

  return (
    <div className="min-h-screen bg-parchment px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 rounded-md border-2 border-blood/70 bg-blood/10 px-4 py-3 font-sans text-sm text-blood">
          <strong className="font-semibold">⚠ Mode développement</strong> —
          cette page n&apos;est pas protégée. Toute personne qui connaît
          l&apos;URL peut modifier ou supprimer les joueurs. À gater (auth +
          rôle admin) avant tout déploiement public.
        </div>

        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl leading-none text-ink">
              Salle du Conseil
            </h1>
            <p className="mt-1 font-sans text-xs uppercase tracking-widest text-ink/60">
              Administration du royaume — {players.length} fief
              {players.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={isPending}
              className="rounded-md border border-ink/30 bg-parchment px-3 py-2 font-sans text-xs uppercase tracking-wider text-ink/80 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              disabled={isPending}
              className="rounded-md border-2 border-blood bg-blood px-3 py-2 font-sans text-xs uppercase tracking-wider text-parchment transition-colors hover:bg-blood/90 disabled:opacity-50"
            >
              ⚠ Reset partie
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-blood bg-blood/15 px-4 py-2 font-sans text-sm text-blood">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-md border border-moss bg-moss/15 px-4 py-2 font-sans text-sm text-moss">
            {info}
          </div>
        )}

        <div className="overflow-hidden rounded-md border border-ink/20 bg-parchment shadow-sm">
          <table className="w-full border-collapse font-sans text-sm">
            <thead className="bg-ink/5 text-ink/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider text-[11px]">#</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider text-[11px]">Nom</th>
                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider text-[11px]">Player ID</th>
                <th className="px-3 py-2 text-right font-medium uppercase tracking-wider text-[11px]">Prestige</th>
                <th className="px-3 py-2 text-right font-medium uppercase tracking-wider text-[11px]">Or</th>
                <th className="px-3 py-2 text-right font-medium uppercase tracking-wider text-[11px]">État</th>
                <th className="px-3 py-2 text-right font-medium uppercase tracking-wider text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center font-serif italic text-ink/50"
                  >
                    Le royaume est encore désert.
                  </td>
                </tr>
              )}
              {players.map((row, index) => {
                const expanded = expandedId === row.playerId;
                const draft = drafts[row.playerId];
                return (
                  <FragmentRow
                    key={row.playerId}
                    row={row}
                    index={index}
                    expanded={expanded}
                    draft={draft}
                    groups={groups}
                    isPending={isPending}
                    onToggle={() => toggleExpand(row)}
                    onChangeName={(name) => updateDraft(row.playerId, { name })}
                    onChangeResource={(kind, v) =>
                      updateDraftResource(row.playerId, kind, v)
                    }
                    onSave={() => save(row)}
                    onDelete={() => remove(row)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-md rounded-md border-2 border-blood bg-parchment p-6 shadow-xl">
            <h2 className="font-serif text-2xl text-blood">Reset du monde</h2>
            <p className="mt-2 font-sans text-sm text-ink/80">
              Cette action <strong>supprime tous les fiefs</strong> et tous les
              noms du royaume. Elle est irréversible. Pour confirmer, tapez{" "}
              <code className="rounded bg-ink/10 px-1 font-mono text-ink">
                RESET
              </code>{" "}
              ci-dessous.
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              autoFocus
              placeholder="RESET"
              className="mt-4 w-full rounded-md border border-ink/30 bg-parchment px-3 py-2 font-mono text-sm text-ink focus:border-blood focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetOpen(false);
                  setResetConfirmText("");
                }}
                disabled={isPending}
                className="rounded-md border border-ink/30 px-3 py-2 font-sans text-xs uppercase tracking-wider text-ink/80 hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmReset}
                disabled={isPending || resetConfirmText !== "RESET"}
                className="rounded-md border-2 border-blood bg-blood px-3 py-2 font-sans text-xs uppercase tracking-wider text-parchment hover:bg-blood/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirmer le reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RowProps = {
  row: AdminPlayerRow;
  index: number;
  expanded: boolean;
  draft: RowDraft | undefined;
  groups: Array<[string, ResourceKind[]]>;
  isPending: boolean;
  onToggle: () => void;
  onChangeName: (name: string) => void;
  onChangeResource: (kind: ResourceKind, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

function FragmentRow({
  row,
  index,
  expanded,
  draft,
  groups,
  isPending,
  onToggle,
  onChangeName,
  onChangeResource,
  onSave,
  onDelete,
}: RowProps) {
  const gold = row.resources?.gold ?? null;

  return (
    <>
      <tr
        className={`border-t border-ink/10 transition-colors ${expanded ? "bg-gold/10" : "hover:bg-ink/[0.03]"}`}
      >
        <td className="px-3 py-2 text-ink/50 tabular-nums">{index + 1}</td>
        <td className="px-3 py-2 font-serif text-base">
          {row.name ?? <span className="italic text-ink/50">Anonyme</span>}
        </td>
        <td className="px-3 py-2 font-mono text-[11px] text-ink/60">
          <span title={row.playerId}>{shortId(row.playerId)}</span>
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-gold">
          {Math.round(row.prestige)}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {gold === null ? (
            <span className="text-ink/40">—</span>
          ) : (
            Math.round(gold)
          )}
        </td>
        <td className="px-3 py-2 text-right">
          {row.hasState ? (
            <span className="rounded bg-moss/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-moss">
              OK
            </span>
          ) : (
            <span className="rounded bg-blood/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blood">
              Périmé
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={onToggle}
              disabled={isPending}
              className="rounded border border-ink/30 px-2 py-1 text-[11px] uppercase tracking-wider text-ink/80 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {expanded ? "Replier" : "Éditer"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="rounded border border-blood/40 px-2 py-1 text-[11px] uppercase tracking-wider text-blood hover:border-blood disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </td>
      </tr>
      {expanded && draft && (
        <tr className="border-t border-ink/10 bg-gold/5">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-4">
              <div>
                <label className="block font-sans text-[11px] uppercase tracking-widest text-ink/60">
                  Nom
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => onChangeName(e.target.value)}
                  className="mt-1 w-full max-w-sm rounded-md border border-ink/30 bg-parchment px-3 py-2 font-serif text-base text-ink focus:border-gold focus:outline-none"
                  placeholder="Nom du seigneur"
                />
              </div>

              {!row.hasState ? (
                <p className="rounded-md border border-blood/40 bg-blood/5 px-3 py-2 font-sans text-xs text-blood">
                  État périmé : impossible d&apos;éditer les ressources. Tu peux
                  renommer le joueur ou le supprimer.
                </p>
              ) : (
                <div className="space-y-4">
                  {groups.map(([groupLabel, kinds]) => (
                    <div key={groupLabel}>
                      <h3 className="mb-1 font-sans text-[11px] uppercase tracking-widest text-ink/60">
                        {groupLabel}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                        {kinds.map((kind) => {
                          const def = RESOURCES[kind];
                          return (
                            <label
                              key={kind}
                              className="flex items-center gap-2"
                            >
                              <ResourceIcon
                                kind={kind}
                                className={`pixelated h-4 w-4 shrink-0 ${def.tone}`}
                              />
                              <span className="flex-1 truncate font-sans text-xs text-ink/80">
                                {def.label}
                              </span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={draft.resources[kind] ?? ""}
                                onChange={(e) =>
                                  onChangeResource(kind, e.target.value)
                                }
                                className="w-20 rounded border border-ink/30 bg-parchment px-2 py-1 text-right font-mono text-xs text-ink tabular-nums focus:border-gold focus:outline-none"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="font-mono text-[10px] text-ink/40">
                  Player ID complet : {row.playerId}
                </p>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isPending}
                  className="rounded-md border-2 border-moss bg-moss px-4 py-2 font-sans text-xs uppercase tracking-wider text-parchment hover:bg-moss/90 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
