import type { Metadata } from "next";
import Link from "next/link";

import { Board } from "@/components/game/Board";

export const metadata: Metadata = {
  title: "Suzerain — Le Fief",
  description: "Le fief s'éveille. Bâtissez votre première ferme.",
};

export default function PlayPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-parchment text-ink">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-8 pt-6">
        <Link
          href="/"
          className="pointer-events-auto font-serif text-2xl text-ink transition-colors hover:text-blood"
        >
          Suzerain
        </Link>
        <span className="font-sans text-[10px] uppercase tracking-widest text-ink/40">
          Le Fief · v0.2
        </span>
      </header>
      <Board />
    </main>
  );
}
