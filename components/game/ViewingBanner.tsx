"use client";

type Props = {
  name: string | null;
  onReturn: () => void;
};

export function ViewingBanner({ name, onReturn }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-gold/40 bg-parchment/85 px-5 py-3 shadow-sm">
      <span className="font-serif text-lg text-ink">
        Vous visitez le fief de{" "}
        <span className="text-blood">{name ?? "Anonyme"}</span>
      </span>
      <button
        type="button"
        onClick={onReturn}
        className="rounded-md border border-blood bg-parchment px-4 py-1.5 font-serif text-base text-blood transition-colors hover:bg-blood hover:text-parchment"
      >
        Retour à mon fief
      </button>
    </div>
  );
}
