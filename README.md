# Suzerain

Jeu web multijoueur asynchrone de stratégie médiévale (4X de gestion seigneuriale, parties de 4-6 semaines, 4-8 joueurs). Pixel art, parchemin, temps réel lent.

Ce dépôt est à la version **v0.0.1** — Hello World déployé sur Vercel. Aucune logique de jeu pour l'instant : juste les fondations techniques et l'identité visuelle.

---

## Lancer en local

Prérequis : Node.js 20+ (Node 24 LTS recommandé, identique à Vercel) et [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

Endpoint santé : [http://localhost:3000/api/health](http://localhost:3000/api/health) → `{ "status": "ok", "version": "0.0.1" }`.

Autres scripts utiles :

```bash
pnpm build       # build de prod
pnpm start       # serveur prod local
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit (strict)
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
3. Vercel détecte Next.js automatiquement — aucune configuration nécessaire.
4. Aucune variable d'environnement requise pour cette étape.
5. Clique **Deploy**.

Le déploiement se fait automatiquement à chaque push sur `main`. Les autres branches déclenchent des **Preview Deployments** avec une URL dédiée.

---

## Structure du projet

```
suzerain-game/
├── app/
│   ├── layout.tsx          # Root layout : fonts (Cormorant Garamond + Inter), metadata SEO
│   ├── page.tsx            # Écran d'accueil Hello World
│   ├── globals.css         # Tailwind base + utilitaires perso (.pixelated)
│   └── api/
│       └── health/route.ts # GET /api/health → { status, version }
├── components/
│   └── CrownIcon.tsx       # SVG pixel art (couronne dorée) en composant React
├── lib/
│   ├── db.ts               # Placeholder pour la couche base de données (v0.1)
│   └── auth.ts             # Placeholder pour la couche authentification (v0.1)
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

1. **v0.0.1** *(cette étape)* — Hello World déployé sur Vercel.
2. **v0.1** — Auth magic link + base de données + modèles `Joueur` et `Fief`.
3. **v0.2** — Écran du fief, production de ressources en temps réel lent.
4. **v0.3** — Carte commune avec territoires neutres capturables.
5. **v0.4** — Combat basique et déplacement d'armées.
6. **v0.5** — Marché et interactions inter-joueurs.
7. **v1.0** — Première saison jouable complète.

---

## Crédits

Construit par Antoine, Grégory, Justin.
