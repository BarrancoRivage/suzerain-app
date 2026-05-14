// Registre des ressources : SOURCE UNIQUE de toute la data ressource (label,
// description, catégorie, groupe d'affichage, couleur, ordre). Même esprit que
// config.ts pour les bâtiments — l'engine et l'UI dérivent tout d'ici.
//
// N'importe QUE des types depuis ./types (feuille de l'arbre de dépendances) :
// aucun cycle possible. Ajouter une ressource = ajouter une union dans types.ts
// + une entrée dans RESOURCES. Rien d'autre à toucher (les helpers itèrent sur
// RESOURCE_KINDS, jamais sur des littéraux figés).
//
// `tone` : classe Tailwind text-* — les chaînes littérales ci-dessous sont
// scannées par le JIT (lib/**/*.ts est dans le content glob).

import type {
  ResourceCategory,
  ResourceKind,
  Resources,
} from "./types";

export type ResourceDef = {
  readonly kind: ResourceKind;
  readonly label: string;
  readonly description: string;
  readonly category: ResourceCategory;
  // Sous-section d'affichage dans la modale Trésorerie.
  readonly group: string;
  // Classe Tailwind text-* appliquée à l'icône.
  readonly tone: string;
  // Ordre d'affichage stable (primary < prestige < secondary).
  readonly order: number;
};

export const RESOURCES: Readonly<Record<ResourceKind, ResourceDef>> = {
  // ----- primary (0-6) : barre HUD -----
  grain: {
    kind: "grain",
    label: "Grain",
    description: "Nourrit la population. Produit par les fermes.",
    category: "primary",
    group: "Subsistance",
    tone: "text-amber-600",
    order: 0,
  },
  gold: {
    kind: "gold",
    label: "Or",
    description: "La monnaie du royaume. Extrait par les mines.",
    category: "primary",
    group: "Trésor",
    tone: "text-gold",
    order: 1,
  },
  population: {
    kind: "population",
    label: "Population",
    description: "Les sujets du fief — main-d'œuvre de toute activité.",
    category: "primary",
    group: "Subsistance",
    tone: "text-blood",
    order: 2,
  },
  science: {
    kind: "science",
    label: "Science",
    description: "Le savoir accumulé, clé des avancées du royaume.",
    category: "primary",
    group: "Savoir",
    tone: "text-sky-600",
    order: 3,
  },
  happiness: {
    kind: "happiness",
    label: "Bonheur",
    description: "Le contentement du peuple. En baisse, la révolte gronde.",
    category: "primary",
    group: "Savoir",
    tone: "text-yellow-500",
    order: 4,
  },
  wood: {
    kind: "wood",
    label: "Bois",
    description: "Matériau de construction de base, abattu en forêt.",
    category: "primary",
    group: "Matières premières",
    tone: "text-amber-800",
    order: 5,
  },
  stone: {
    kind: "stone",
    label: "Pierre",
    description: "Matériau de construction durable, extrait des collines.",
    category: "primary",
    group: "Matières premières",
    tone: "text-stone-500",
    order: 6,
  },

  // ----- prestige (7) : scoreboard + modale -----
  prestige: {
    kind: "prestige",
    label: "Prestige",
    description: "Le rayonnement du fief. Classe les seigneurs entre eux.",
    category: "prestige",
    group: "Renommée",
    tone: "text-amber-400",
    order: 7,
  },

  // ----- secondary (8-29) : modale Trésorerie -----
  iron: {
    kind: "iron",
    label: "Fer",
    description: "Minerai fondu en outils et en armes.",
    category: "secondary",
    group: "Matières premières",
    tone: "text-slate-500",
    order: 8,
  },
  coal: {
    kind: "coal",
    label: "Charbon",
    description: "Combustible des forges et des fonderies.",
    category: "secondary",
    group: "Matières premières",
    tone: "text-zinc-600",
    order: 9,
  },
  clay: {
    kind: "clay",
    label: "Argile",
    description: "Terre malléable, cuite en poterie et en briques.",
    category: "secondary",
    group: "Matières premières",
    tone: "text-orange-800",
    order: 10,
  },
  salt: {
    kind: "salt",
    label: "Sel",
    description: "Conserve les vivres — denrée stratégique du commerce.",
    category: "secondary",
    group: "Matières premières",
    tone: "text-slate-400",
    order: 11,
  },
  gems: {
    kind: "gems",
    label: "Gemmes",
    description: "Pierres précieuses, taillées en bijoux de grande valeur.",
    category: "secondary",
    group: "Trésor",
    tone: "text-fuchsia-600",
    order: 12,
  },
  tools: {
    kind: "tools",
    label: "Outils",
    description: "Indispensables aux ateliers et aux chantiers.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-stone-600",
    order: 13,
  },
  weapons: {
    kind: "weapons",
    label: "Armes",
    description: "Forgées pour équiper la garde du fief.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-red-700",
    order: 14,
  },
  armor: {
    kind: "armor",
    label: "Armures",
    description: "Protègent les soldats sur le champ de bataille.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-slate-600",
    order: 15,
  },
  cloth: {
    kind: "cloth",
    label: "Étoffe",
    description: "Tissée à partir de laine — vêt le peuple.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-indigo-400",
    order: 16,
  },
  leather: {
    kind: "leather",
    label: "Cuir",
    description: "Tanné depuis les peaux du bétail.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-amber-900",
    order: 17,
  },
  pottery: {
    kind: "pottery",
    label: "Poterie",
    description: "Récipients cuits, utiles au quotidien et au négoce.",
    category: "secondary",
    group: "Artisanat",
    tone: "text-orange-700",
    order: 18,
  },
  horses: {
    kind: "horses",
    label: "Chevaux",
    description: "Montures et bêtes de trait — mobilité et cavalerie.",
    category: "secondary",
    group: "Élevage",
    tone: "text-amber-700",
    order: 19,
  },
  cattle: {
    kind: "cattle",
    label: "Bétail",
    description: "Bovins élevés pour la viande et le cuir.",
    category: "secondary",
    group: "Élevage",
    tone: "text-stone-700",
    order: 20,
  },
  wool: {
    kind: "wool",
    label: "Laine",
    description: "Tondue sur les troupeaux, filée en étoffe.",
    category: "secondary",
    group: "Élevage",
    tone: "text-neutral-400",
    order: 21,
  },
  fish: {
    kind: "fish",
    label: "Poisson",
    description: "Pêché en rivière et en lac — complète le grain.",
    category: "secondary",
    group: "Subsistance",
    tone: "text-cyan-600",
    order: 22,
  },
  herbs: {
    kind: "herbs",
    label: "Herbes",
    description: "Plantes médicinales et aromatiques cueillies aux abords.",
    category: "secondary",
    group: "Subsistance",
    tone: "text-emerald-600",
    order: 23,
  },
  wine: {
    kind: "wine",
    label: "Vin",
    description: "Boisson de prestige, prisée des tables nobles.",
    category: "secondary",
    group: "Denrées de luxe",
    tone: "text-purple-800",
    order: 24,
  },
  spices: {
    kind: "spices",
    label: "Épices",
    description: "Denrées rares venues de loin — fort attrait commercial.",
    category: "secondary",
    group: "Denrées de luxe",
    tone: "text-orange-600",
    order: 25,
  },
  silk: {
    kind: "silk",
    label: "Soie",
    description: "Étoffe précieuse réservée aux atours de la cour.",
    category: "secondary",
    group: "Denrées de luxe",
    tone: "text-pink-400",
    order: 26,
  },
  faith: {
    kind: "faith",
    label: "Foi",
    description: "La ferveur religieuse du fief — soutient le moral.",
    category: "secondary",
    group: "Savoir",
    tone: "text-indigo-500",
    order: 27,
  },
  culture: {
    kind: "culture",
    label: "Culture",
    description: "Arts et lettres qui rayonnent au-delà des murs.",
    category: "secondary",
    group: "Savoir",
    tone: "text-violet-600",
    order: 28,
  },
  influence: {
    kind: "influence",
    label: "Influence",
    description: "Le poids diplomatique du seigneur auprès de ses pairs.",
    category: "secondary",
    group: "Renommée",
    tone: "text-rose-600",
    order: 29,
  },
};

// Ordre canonique unique de toutes les ressources — dérivé de RESOURCES,
// trié par `.order`. Toute itération sur les ressources passe par ici.
export const RESOURCE_KINDS: readonly ResourceKind[] = (
  Object.keys(RESOURCES) as ResourceKind[]
).sort((a, b) => RESOURCES[a].order - RESOURCES[b].order);

// Labels seuls — remplace l'ancien RESOURCE_LABELS de buildings.ts.
export const RESOURCE_LABELS: Readonly<Record<ResourceKind, string>> =
  Object.fromEntries(
    RESOURCE_KINDS.map((k) => [k, RESOURCES[k].label]),
  ) as Record<ResourceKind, string>;

// Liste des ressources d'une catégorie, dans l'ordre canonique.
export function resourcesByCategory(
  category: ResourceCategory,
): readonly ResourceKind[] {
  return RESOURCE_KINDS.filter((k) => RESOURCES[k].category === category);
}

// Regroupe les ressources par `group` (sous-sections de la modale Trésorerie).
// Optionnellement restreint à une catégorie. Map ordonnée par insertion :
// l'ordre des groupes suit l'ordre canonique des ressources.
export function resourceGroups(
  category?: ResourceCategory,
): Map<string, ResourceKind[]> {
  const groups = new Map<string, ResourceKind[]>();
  for (const kind of RESOURCE_KINDS) {
    const def = RESOURCES[kind];
    if (category !== undefined && def.category !== category) continue;
    const bucket = groups.get(def.group);
    if (bucket) bucket.push(kind);
    else groups.set(def.group, [kind]);
  }
  return groups;
}

// Resources avec toutes les clés à 0. Construit par boucle (jamais de littéral
// figé `{ grain: 0, gold: 0 }` qui casserait à chaque ajout de ressource).
export function emptyResources(): Resources {
  const out = {} as Resources;
  for (const kind of RESOURCE_KINDS) out[kind] = 0;
  return out;
}

// Somme terme à terme de deux Resources.
export function addResources(a: Resources, b: Resources): Resources {
  const out = {} as Resources;
  for (const kind of RESOURCE_KINDS) {
    out[kind] = (a[kind] ?? 0) + (b[kind] ?? 0);
  }
  return out;
}

// Migration : normalise un `resources` chargé depuis la persistance. Complète
// les clés manquantes à 0 (états antérieurs avec seulement grain/gold), ignore
// les clés inconnues et les valeurs non finies. Idempotent. Sans ça, l'engine
// lirait `undefined` et propagerait des NaN dans tout l'état sauvegardé.
export function normalizeResources(
  raw: Partial<Resources> | null | undefined,
): Resources {
  const out = emptyResources();
  if (raw) {
    for (const kind of RESOURCE_KINDS) {
      const value = raw[kind];
      if (typeof value === "number" && Number.isFinite(value)) {
        out[kind] = value;
      }
    }
  }
  return out;
}

// Formatage d'affichage d'un montant. population = entier ; au-delà de 9999 on
// abrège en k/M ; sinon une décimale.
export function formatAmount(value: number, kind: ResourceKind): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (kind === "population") return Math.floor(value).toString();
  return value.toFixed(1);
}
