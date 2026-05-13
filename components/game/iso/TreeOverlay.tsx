import type { SVGProps } from "react";

const CANOPY: ReadonlyArray<[number, number, number]> = [
  [14, 5, 5],
  [12, 6, 9],
  [11, 7, 11],
  [11, 8, 11],
  [12, 9, 9],
  [13, 10, 7],
  [14, 11, 5],
];

const CANOPY_SHADOW: ReadonlyArray<[number, number, number]> = [
  [17, 6, 3],
  [18, 7, 3],
  [18, 8, 3],
  [18, 9, 2],
];

export function TreeOverlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="16" cy="15" rx="6" ry="1.5" fill="#1A1410" opacity="0.18" />
      {CANOPY.map(([x, y, w]) => (
        <rect key={`c-${x}-${y}`} x={x} y={y} width={w} height={1} fill="#3D5A3D" />
      ))}
      {CANOPY_SHADOW.map(([x, y, w]) => (
        <rect key={`s-${x}-${y}`} x={x} y={y} width={w} height={1} fill="#1A1410" opacity="0.28" />
      ))}
      <rect x="13" y="5" width="2" height="1" fill="#F5EFE0" opacity="0.22" />
      <rect x="12" y="6" width="2" height="1" fill="#F5EFE0" opacity="0.18" />
      <rect x="15" y="12" width="2" height="1" fill="#1A1410" />
      <rect x="15" y="13" width="2" height="1" fill="#1A1410" />
      <rect x="15" y="14" width="2" height="1" fill="#1A1410" />
      <rect x="14" y="15" width="4" height="1" fill="#1A1410" />
    </svg>
  );
}
