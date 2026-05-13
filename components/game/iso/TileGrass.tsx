import type { SVGProps } from "react";

export function TileGrass(props: SVGProps<SVGSVGElement>) {
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
    </svg>
  );
}
