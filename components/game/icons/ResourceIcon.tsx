import type { SVGProps } from "react";

import type { ResourceKind } from "@/lib/game/types";
import { RESOURCE_PIXELS } from "./resourcePixels";

// Composant unique pour TOUTES les icônes de ressources : pilote le rendu par
// `kind` depuis les matrices pixel de resourcePixels.ts. Remplace les anciens
// composants individuels (GrainIcon, GoldIcon…). La couleur vient de la classe
// Tailwind text-* passée en className (fill="currentColor").

type Props = SVGProps<SVGSVGElement> & { kind: ResourceKind };

export function ResourceIcon({ kind, ...props }: Props) {
  const pixels = RESOURCE_PIXELS[kind];
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < pixels.length; y++) {
    const row = pixels[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "#") {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill="currentColor"
          />,
        );
      }
    }
  }
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      {rects}
    </svg>
  );
}
