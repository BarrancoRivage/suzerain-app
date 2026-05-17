// Registre des techs : SOURCE UNIQUE de l'arbre de science (label, coût,
// prérequis, effet). Même esprit que config.ts (bâtiments) et resources.ts
// (ressources) — l'engine et l'UI dérivent tout d'ici.
//
// N'importe QUE des types depuis ./types : feuille de l'arbre de dépendances,
// aucun cycle. Ajouter une tech = ajouter une union dans types.ts + une entrée
// dans TECHS. Rien d'autre à toucher.
//
// Effets : modèle additif simple. Chaque tech débloquée applique son delta sur
// un (ou plusieurs) BuildingKind. L'agrégation se fait via les helpers
// getProductionMultiplier / getUpgradeCostMultiplier / getMaxLevelBonus dans
// engine.ts — UN seul endroit lit ces effets côté moteur.

import type { BuildingKind, TechKind } from "./types";

export type TechEffect = {
  // Bonus de production par bâtiment (additif). 0.25 = +25 %. Plusieurs techs
  // qui ciblent le même kind s'ajoutent (1 + Σ).
  readonly productionBonus?: Readonly<Partial<Record<BuildingKind, number>>>;
  // Réduction du coût d'amélioration (additif). 0.20 = −20 %. Cap inférieur
  // appliqué dans l'engine pour éviter un coût quasi nul si l'on cumule trop.
  readonly upgradeCostReduction?: number;
  // Bonus de maxLevel appliqué à TOUS les bâtiments. Cumulable.
  readonly maxLevelBonus?: number;
};

export type TechDef = {
  readonly kind: TechKind;
  readonly label: string;
  readonly description: string;
  // Coût en science pour rechercher cette tech.
  readonly requiredScience: number;
  // Toutes ces techs doivent être débloquées avant que celle-ci soit
  // « disponible » (cf. techStatus).
  readonly requires: readonly TechKind[];
  readonly effect: TechEffect;
};

export const TECHS: Readonly<Record<TechKind, TechDef>> = {
  stonemasonry: {
    kind: "stonemasonry",
    label: "Maçonnerie",
    description:
      "Les tailleurs de pierre raffinent leur art — la carrière rend davantage.",
    requiredScience: 30,
    requires: [],
    effect: { productionBonus: { quarry: 0.25 } },
  },
  crop_rotation: {
    kind: "crop_rotation",
    label: "Rotation des cultures",
    description:
      "L'alternance des semis fertilise les sols — les fermes produisent plus.",
    requiredScience: 40,
    requires: [],
    effect: { productionBonus: { farm: 0.3 } },
  },
  advanced_tools: {
    kind: "advanced_tools",
    label: "Outils avancés",
    description:
      "Pioches et haches améliorées — mines et bûcherons s'activent.",
    requiredScience: 50,
    requires: ["stonemasonry"],
    effect: { productionBonus: { mine: 0.2, lumberjack: 0.2 } },
  },
  architecture: {
    kind: "architecture",
    label: "Architecture",
    description:
      "Les bâtisseurs maîtrisent des structures plus ambitieuses — niveau maximum élargi.",
    requiredScience: 80,
    requires: ["stonemasonry"],
    effect: { maxLevelBonus: 2 },
  },
  civil_engineering: {
    kind: "civil_engineering",
    label: "Génie civil",
    description:
      "Les chantiers s'optimisent — les améliorations coûtent moins.",
    requiredScience: 120,
    requires: ["advanced_tools", "architecture"],
    effect: { upgradeCostReduction: 0.2 },
  },
};

export const TECH_KINDS: readonly TechKind[] = Object.keys(TECHS) as TechKind[];

// État d'une tech pour l'UI : verrouillée (un prérequis manque), disponible
// (prérequis ok mais pas encore recherchée), débloquée (déjà acquise).
export type TechStatus = "locked" | "available" | "unlocked";

export function techStatus(
  kind: TechKind,
  unlocked: readonly TechKind[],
): TechStatus {
  if (unlocked.includes(kind)) return "unlocked";
  const def = TECHS[kind];
  for (const req of def.requires) {
    if (!unlocked.includes(req)) return "locked";
  }
  return "available";
}
