import type { Metadata } from "next";

import { Board } from "@/components/game/Board";

export const metadata: Metadata = {
  title: "Suzerain — Le Fief",
  description: "Le fief s'éveille. Bâtissez votre première ferme.",
};

export default function PlayPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-parchment text-ink">
      <Board />
    </main>
  );
}
