import type { SVGProps } from "react";

const ROOF_ROWS: ReadonlyArray<[number, number, number]> = [
  [16, 6, 1],
  [15, 7, 3],
  [14, 8, 5],
  [12, 9, 9],
  [10, 10, 13],
  [8, 11, 17],
  [6, 12, 21],
];

export function BuildingFarm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="16" cy="22" rx="10" ry="3" fill="#1A1410" opacity="0.22" />

      <polygon points="24,13 26,14 26,20 24,19" fill="#F5EFE0" />
      <polygon points="24,13 26,14 26,20 24,19" fill="#1A1410" opacity="0.22" />

      {ROOF_ROWS.map(([x, y, w]) => (
        <rect key={`r-${x}-${y}`} x={x} y={y} width={w} height={1} fill="#7A1F1F" />
      ))}
      <rect x="13" y="9" width="2" height="1" fill="#A88A3C" opacity="0.45" />
      <rect x="12" y="10" width="3" height="1" fill="#A88A3C" opacity="0.32" />
      <rect x="20" y="9" width="1" height="1" fill="#1A1410" opacity="0.32" />
      <rect x="20" y="10" width="3" height="1" fill="#1A1410" opacity="0.28" />
      <rect x="22" y="11" width="3" height="1" fill="#1A1410" opacity="0.28" />
      <rect x="24" y="12" width="3" height="1" fill="#1A1410" opacity="0.28" />

      <rect x="19" y="7" width="2" height="3" fill="#1A1410" />
      <rect x="19" y="7" width="2" height="1" fill="#F5EFE0" opacity="0.4" />

      <rect x="9" y="13" width="15" height="7" fill="#F5EFE0" />
      <rect x="9" y="13" width="15" height="1" fill="#1A1410" opacity="0.35" />
      <rect x="9" y="13" width="1" height="7" fill="#1A1410" opacity="0.32" />
      <rect x="23" y="13" width="1" height="7" fill="#1A1410" opacity="0.32" />
      <rect x="9" y="19" width="15" height="1" fill="#1A1410" opacity="0.4" />

      <rect x="11" y="15" width="2" height="2" fill="#1A1410" />
      <rect x="11" y="16" width="2" height="1" fill="#7A1F1F" opacity="0.55" />
      <rect x="20" y="15" width="2" height="2" fill="#1A1410" />
      <rect x="20" y="16" width="2" height="1" fill="#7A1F1F" opacity="0.55" />

      <rect x="15" y="16" width="3" height="4" fill="#1A1410" />
      <rect x="15" y="16" width="3" height="1" fill="#7A1F1F" opacity="0.6" />
      <rect x="17" y="18" width="1" height="1" fill="#A88A3C" />
    </svg>
  );
}
