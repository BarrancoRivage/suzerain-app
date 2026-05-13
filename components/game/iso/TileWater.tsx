import type { SVGProps } from "react";

export function TileWater(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <polygon points="16,16 32,24 16,32 0,24" fill="#F5EFE0" />
      <polygon points="16,16 32,24 16,32 0,24" fill="#3D5A3D" opacity="0.55" />
      <polygon points="16,16 32,24 16,32 0,24" fill="#1A1410" opacity="0.18" />
      <rect x="10" y="22" width="3" height="1" fill="#F5EFE0" opacity="0.32" />
      <rect x="20" y="23" width="3" height="1" fill="#F5EFE0" opacity="0.28" />
      <rect x="13" y="26" width="4" height="1" fill="#F5EFE0" opacity="0.22" />
      <rect x="18" y="27" width="2" height="1" fill="#F5EFE0" opacity="0.2" />
      <rect x="14" y="28" width="2" height="1" fill="#F5EFE0" opacity="0.18" />
    </svg>
  );
}
