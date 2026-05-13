import type { SVGProps } from "react";

export function TilePath(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <polygon points="16,16 32,24 16,32 0,24" fill="#F5EFE0" />
      <polygon points="16,16 32,24 16,32 0,24" fill="#A88A3C" opacity="0.28" />
      <polygon points="16,16 32,24 16,32 0,24" fill="#1A1410" opacity="0.16" />
      <polygon points="16,18 30,24 16,30 2,24" fill="#1A1410" opacity="0.05" />
      <rect x="14" y="22" width="1" height="1" fill="#1A1410" opacity="0.3" />
      <rect x="20" y="25" width="1" height="1" fill="#1A1410" opacity="0.3" />
      <rect x="11" y="25" width="1" height="1" fill="#F5EFE0" opacity="0.5" />
      <rect x="21" y="22" width="1" height="1" fill="#F5EFE0" opacity="0.5" />
    </svg>
  );
}
