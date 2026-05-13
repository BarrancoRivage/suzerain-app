import type { SVGProps } from "react";

const FARM_PIXELS: readonly string[] = [
  "................",
  "................",
  ".......##.......",
  "......####......",
  ".....######.....",
  "....########....",
  "...##########...",
  "..############..",
  "..#..........#..",
  "..#...####...#..",
  "..#...#..#...#..",
  "..#...#..#...#..",
  "..#...#..#...#..",
  "..############..",
  "................",
  "................",
];

export function FarmIcon(props: SVGProps<SVGSVGElement>) {
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < FARM_PIXELS.length; y++) {
    const row = FARM_PIXELS[y];
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
