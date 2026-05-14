"use client";

import { useEffect, useRef, useState } from "react";

import { productionPerSecond } from "@/lib/game/engine";
import { RESOURCE_KINDS } from "@/lib/game/resources";
import type { GameState, Resources } from "@/lib/game/types";

// Interpole en continu (requestAnimationFrame) les valeurs de ressources entre
// deux ticks serveur : `state.resources[k] + taux[k] * (now - lastTickAt)`.
// Générique sur toutes les RESOURCE_KINDS. Partagé par le HUD (ResourcePanel)
// et la modale Trésorerie.
//
// Renvoie aussi les taux de production (déjà calculés, autant les exposer).
export function useAnimatedResources(state: GameState): {
  displayed: Resources;
  rates: Resources;
} {
  const rates = productionPerSecond(state);
  const [displayed, setDisplayed] = useState<Resources>(state.resources);

  // rates est recréé à chaque render — on le lit via une ref pour ne pas avoir
  // à le mettre dans les deps du useEffect (sinon : nouvelle référence à chaque
  // render → re-souscription en boucle). Seul `state` déclenche le redémarrage.
  const ratesRef = useRef(rates);
  ratesRef.current = rates;

  useEffect(() => {
    let raf = 0;
    function loop() {
      const elapsed = (Date.now() - state.lastTickAt) / 1000;
      const next = {} as Resources;
      for (const kind of RESOURCE_KINDS) {
        next[kind] = state.resources[kind] + ratesRef.current[kind] * elapsed;
      }
      setDisplayed(next);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return { displayed, rates };
}
