import type { Metadata } from "next";
import Link from "next/link";

import { Board } from "@/components/game/Board";

export const metadata: Metadata = {
  title: "Suzerain — Le Fief",
  description: "Le fief s'éveille. Bâtissez votre première ferme.",
};

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-parchment text-ink">
      <header className="max-w-3xl mx-auto flex items-center justify-between px-6 pt-8">
        <Link
          href="/"
          className="font-serif text-2xl text-ink hover:text-blood transition-colors"
        >
          Suzerain
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-ink/40 font-sans">
          Le Fief · v0.2
        </span>
      </header>
      <Board />
    </main>
  );
}
