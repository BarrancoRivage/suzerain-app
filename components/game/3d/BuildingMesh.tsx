"use client";

import type { BuildingKind } from "@/lib/game/types";
import { FarmModel, MineModel } from "./models/Models";

type Props = { kind: BuildingKind };

export function BuildingMesh({ kind }: Props) {
  if (kind === "farm") return <FarmModel />;
  return <MineModel />;
}
