"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  label: string;
  align?: "left" | "right";
  // Render-prop : reçoit `close` pour pouvoir refermer le menu depuis le
  // contenu (ex. après la sélection d'un joueur).
  children: (close: () => void) => ReactNode;
};

// Menu déroulant générique de la top bar : un bouton qui ouvre un panneau
// ancré juste en dessous. Se ferme sur clic extérieur et touche Échap. Aucun
// composant dropdown n'existait — celui-ci reprend le pattern de fermeture au
// clic extérieur de BuildingPanel (ref + listener `pointerdown`).
export function TopBarMenu({ label, align = "right", children }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-sans text-xs uppercase tracking-widest transition-colors ${
          open
            ? "border-gold bg-parchment text-ink"
            : "border-gold/30 text-ink/70 hover:border-gold hover:text-ink"
        }`}
      >
        {label}
        <span aria-hidden="true" className="text-[8px] leading-none">
          ▼
        </span>
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-1.5 animate-fade-in overflow-hidden rounded-md border border-gold/40 bg-parchment shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
