"use client";

import { useState } from "react";

type Props = {
  onSubmit: (name: string) => void;
  onDismiss: () => void;
  pending: boolean;
  error: string | null;
  initialName?: string;
};

export function NamePrompt({
  onSubmit,
  onDismiss,
  pending,
  error,
  initialName,
}: Props) {
  const [value, setValue] = useState(initialName ?? "");
  const trimmed = value.trim();
  // Miroir léger de la validation serveur (app/play/actions.ts) — confort de
  // saisie, le vrai gardien reste la Server Action.
  const canSubmit =
    trimmed.length >= 2 && trimmed.length <= 24 && !pending;

  return (
    <div
      data-no-edge-pan
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-6"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(trimmed);
        }}
        className="w-full max-w-sm animate-fade-in rounded-md border border-gold/50 bg-parchment p-6 shadow-lg"
      >
        <h2 className="font-serif text-2xl text-ink">
          Quel est votre nom, seigneur&nbsp;?
        </h2>
        <p className="mt-1 font-serif text-sm italic text-ink/60">
          Il s&rsquo;affichera auprès des autres fiefs du royaume.
        </p>

        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={24}
          autoFocus
          placeholder="Baron de…"
          className="mt-4 w-full rounded-md border border-ink/20 bg-parchment/80 px-3 py-2 font-serif text-lg text-ink outline-none transition-colors focus:border-gold"
        />

        <div className="mt-1 h-4 font-serif text-xs italic text-blood/80">
          {error ?? " "}
        </div>

        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onDismiss}
            disabled={pending}
            className="font-sans text-sm text-ink/50 transition-colors hover:text-ink disabled:opacity-50"
          >
            Plus tard
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md border border-blood bg-parchment px-5 py-2 font-serif text-lg text-blood transition-colors hover:bg-blood hover:text-parchment disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-parchment disabled:hover:text-blood"
          >
            Valider
          </button>
        </div>
      </form>
    </div>
  );
}
