# Suzerain

Jeu web multijoueur asynchrone de stratégie médiévale (4X de gestion seigneuriale, parties de 4-6 semaines, 4-8 joueurs). Pixel art, parchemin, temps réel lent.

Ce dépôt est à la version **v0.2** — fondations du moteur de jeu en solo : grille 6×6, pose d'une Ferme, production de grain en temps réel persistée sur Supabase (Postgres via Vercel Marketplace).

---

## Lancer en local (Docker — recommandé)

Prérequis : [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou équivalent). Pas besoin d'installer Node ou pnpm sur ton poste.

```bash
docker compose up --build
```

Ça démarre deux conteneurs :

- `suzerain-db` — Postgres 16 isolé du cloud, schéma chargé automatiquement depuis `docker/postgres/init/*.sql` au premier boot.
- `suzerain-dev` — Next.js en mode dev avec HMR, source montée, attend que la DB soit *healthy* avant de démarrer.

Ouvre [http://localhost:3000](http://localhost:3000) (landing) puis [/play](http://localhost:3000/play) (le fief). Endpoint santé : [/api/health](http://localhost:3000/api/health) → `{ "status": "ok", "version": "0.2.0" }`.

Pour valider l'image de prod en local (standalone, non-root, healthcheck) :

```bash
docker compose --profile prod up --build
```

`DATABASE_URL` est injectée par le compose (`postgres://suzerain:suzerain@postgres:5432/suzerain`) et override toute valeur de `.env.local` — la DB locale est toujours utilisée, jamais la prod par accident.

Layout : `Dockerfile` multi-stage (`base` → `deps` → `dev` / `builder` → `runner`). L'étape `runner` part de `node:24-alpine` et n'embarque que `.next/standalone` + `.next/static` + `public/`, sans pnpm ni devDependencies — image finale ~300 Mo, conteneur non-root avec `HEALTHCHECK` sur `/api/health`.

### Lancer en local (sans Docker)

Si tu préfères : Node.js 20+ (Node 24 LTS recommandé, identique à Vercel), [pnpm](https://pnpm.io/installation), et un Postgres accessible (instance Supabase, brew, etc.).

```bash
pnpm install
echo 'DATABASE_URL="postgres://..."' > .env.local
pnpm dev
```

Autres scripts utiles : `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

### Schéma de la table

Auto-appliqué en Docker via `docker/postgres/init/001_schema.sql`. Sur une DB pré-existante (Supabase prod, etc.), à exécuter une fois dans le SQL Editor :

```sql
create table public.game_states (
  player_id   uuid        primary key,
  state       jsonb       not null,
  updated_at  timestamptz not null default now()
);
alter table public.game_states enable row level security;
```

---

## Pousser sur GitHub

```bash
git init && git add . && git commit -m "feat: initial commit"
git branch -M main
git remote add origin git@github.com:USERNAME/suzerain-game.git
git push -u origin main
```

Remplace `USERNAME` par ton compte GitHub. Nom de dépôt recommandé : `suzerain-game`.

---

## Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) → **New Project** → **Import** depuis GitHub.
2. Sélectionne le dépôt `suzerain-game`.
3. Vercel détecte Next.js automatiquement.
4. **Installer l'intégration Supabase** (une fois) : projet Vercel → **Storage** → **Browse Marketplace** → **Supabase** → **Connect**. L'intégration provisionne automatiquement (entre autres) `POSTGRES_URL` (pooler, port 6543) que le code lit en fallback de `DATABASE_URL`. Rien à configurer à la main.
5. Exécute le snippet de schéma ci-dessus dans le SQL Editor Supabase (une seule fois).
6. Clique **Deploy**.

> Override possible : si tu veux pointer la prod vers une autre DB (read replica, etc.), ajoute `DATABASE_URL` dans les env vars Vercel — le code la priorise sur `POSTGRES_URL`.

Le déploiement se fait automatiquement à chaque push sur `main`. Les autres branches déclenchent des **Preview Deployments** avec une URL dédiée.

---

## Structure du projet

```
suzerain-game/
├── app/
│   ├── layout.tsx          # Root layout : fonts (Cormorant Garamond + Inter), metadata SEO
│   ├── page.tsx            # Écran d'accueil + CTA "Entrer dans le royaume"
│   ├── globals.css         # Tailwind base + utilitaires perso (.pixelated)
│   ├── play/
│   │   ├── page.tsx        # Vue du fief
│   │   └── actions.ts      # Server Actions : loadGame, placeBuilding
│   └── api/
│       └── health/route.ts # GET /api/health → { status, version }
├── components/
│   ├── CrownIcon.tsx       # SVG pixel art (couronne) — landing
│   └── game/
│       ├── Board.tsx       # Orchestrateur client : état, transitions, RAF
│       ├── Tile.tsx        # Une tuile cliquable de la grille
│       ├── ResourcePanel.tsx  # Compteur de grain animé (RAF)
│       ├── BuildPanel.tsx     # Sélecteur de bâtiment
│       └── icons/             # FarmIcon, GrainIcon (pixel art)
├── lib/
│   ├── game/
│   │   ├── types.ts        # GameState, Tile, Building, GameError
│   │   ├── buildings.ts    # Config statique des bâtiments
│   │   └── engine.ts       # Fonctions pures : tick, placeBuilding
│   ├── supabase.ts         # Client Supabase server-only (loadState / saveState)
│   ├── session.ts          # Cookie playerId anonyme (en attendant l'auth)
│   └── auth.ts             # Placeholder pour l'auth Supabase (v0.3)
├── public/
│   └── favicon.svg         # Couronne pixel art en favicon
├── tailwind.config.ts      # Palette parchment/ink/blood/moss/gold + fonts
├── postcss.config.js       # Pipeline Tailwind + autoprefixer
├── tsconfig.json           # TypeScript strict
├── next.config.ts          # Config Next.js (reactStrictMode)
├── package.json
├── .gitignore
├── .env.example            # Référence des variables (vide pour v0.0.1)
└── README.md
```

---

## Identité visuelle

Palette (déclarée dans `tailwind.config.ts`) :

| Token        | Hex       | Usage                       |
| ------------ | --------- | --------------------------- |
| `parchment`  | `#F5EFE0` | Fond principal              |
| `ink`        | `#1A1410` | Texte                       |
| `blood`      | `#7A1F1F` | Accent rouge / bordeaux     |
| `moss`       | `#3D5A3D` | Accent vert                 |
| `gold`       | `#A88A3C` | Accent doré ornemental      |

Typo : **Cormorant Garamond** (titres, serif) + **Inter** (corps, sans). Chargées via `next/font/google` dans `app/layout.tsx`.

---

## Convention de commits

[Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` nouvelle fonctionnalité
- `fix:` correctif
- `chore:` tâche technique sans impact produit
- `refactor:` réorganisation sans changement de comportement
- `docs:` documentation
- `style:` formatage, espaces
- `test:` tests

---

## Roadmap technique

1. **v0.0.1** ✅ — Hello World déployé sur Vercel.
2. **v0.2** *(itération en cours)* — Écran du fief en solo, pose de bâtiments, production de ressources en temps réel, persistance Upstash Redis.
3. **v0.3** — Auth magic link + migration de l'état serveur sur de vraies identités joueur.
4. **v0.4** — Carte commune avec territoires neutres capturables.
5. **v0.5** — Combat basique et déplacement d'armées.
6. **v0.6** — Marché et interactions inter-joueurs.
7. **v1.0** — Première saison jouable complète.

---

## Crédits

Construit par Antoine, Grégory, Justin.
