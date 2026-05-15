import type { Metadata } from "next";

import { AdminClient } from "@/components/admin/AdminClient";
import { listAdminPlayersAction } from "./actions";

export const metadata: Metadata = {
  title: "Suzerain — Conseil",
  description: "Administration du royaume (mode développement).",
  robots: { index: false, follow: false },
};

// Server component : charge la liste initiale, puis délègue à AdminClient pour
// l'interactivité. Pas de gating ici — voir l'avertissement affiché par
// AdminClient (et le commentaire au sommet de `actions.ts`).
export default async function AdminPage() {
  const result = await listAdminPlayersAction();

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-parchment px-6 py-12 text-ink">
        <div className="mx-auto max-w-xl rounded-md border-2 border-blood bg-blood/10 px-6 py-5">
          <h1 className="font-serif text-2xl text-blood">Erreur admin</h1>
          <p className="mt-2 font-sans text-sm text-ink/80">
            Impossible de charger les joueurs : {result.message}
          </p>
        </div>
      </main>
    );
  }

  return <AdminClient initialPlayers={result.players} />;
}
