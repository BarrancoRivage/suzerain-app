import type { SVGProps } from "react";

export function TileGrassStone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <polygon points="16,16 32,24 16,32 0,24" fill="#F5EFE0" />
      <polygon points="16,16 32,24 16,32 0,24" fill="#3D5A3D" opacity="0.32" />
      <polygon points="16,16 24,20 16,24 8,20" fill="#F5EFE0" opacity="0.18" />
      <polygon points="16,24 24,28 16,32 8,28" fill="#1A1410" opacity="0.08" />
      <rect x="18" y="23" width="3" height="1" fill="#1A1410" opacity="0.5" />
      <rect x="17" y="24" width="5" height="1" fill="#1A1410" opacity="0.45" />
      <rect x="18" y="25" width="3" height="1" fill="#1A1410" opacity="0.4" />
      <rect x="18" y="23" width="1" height="1" fill="#F5EFE0" opacity="0.4" />
      <rect x="11" y="26" width="2" height="1" fill="#1A1410" opacity="0.45" />
      <rect x="11" y="27" width="2" height="1" fill="#1A1410" opacity="0.35" />
    </svg>
  );
}
