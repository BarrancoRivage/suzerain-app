# Cas pratique — Profil tech (Fullstack / Data)

## Outil de mapping comptable pour reprise de FEC

**Durée : 1h (travail) + 30-45 min (restitution)**
**Tu peux utiliser l'IA librement.** On regardera autant le résultat que ta façon de l'orchestrer.

---

## 1. Contexte

Rivage est un logiciel de gestion locative pour agences immobilières. Quand
une agence nous rejoint, elle vient avec un historique comptable tenu dans
son ancien logiciel (Crypto, ICS, LSC, Thetrawin, etc.). Notre équipe
Customer Success doit reprendre cet historique chez nous.

L'entrée standard est un **FEC** (Fichier des Écritures Comptables) — export
légal, normé DGFiP, pipe-délimité. Il contient toutes les écritures de
l'exercice : qui a payé quoi, à quel compte, dans quel sens.

Le problème : chaque logiciel a son propre **plan de comptes**. Le
propriétaire "Madame Dupont" peut être le compte `4110000123` chez l'un,
`411DUPONT` chez l'autre, `410000001234` chez ce client-ci. Pour reprendre
proprement, il faut mapper chaque compte de l'ancien logiciel vers
l'entité métier équivalente côté Rivage (un propriétaire, un locataire,
un fournisseur, ou un compte interne de notre plan).

Aujourd'hui c'est fait à la main, sous Excel, en 2-3 jours par agence.
On veut un outil interne pour passer à 2-3 heures.

---

## 2. Notre plan comptable (l'essentiel)

Côté Rivage, on utilise une convention PCG adaptée à la gestion locative :

| Compte | Quoi | À mapper depuis |
|--------|------|-----------------|
| `411xxxxx` | **Propriétaire** (un sous-compte par propriétaire) | son équivalent dans l'ancien logiciel |
| `419xxxxx` | **Locataire** (un sous-compte par locataire) | idem |
| `401xxxxx` ou `400xxxxx` | **Fournisseur** (artisan, syndic, assureur…) | idem |
| `165xxxxx` | **Dépôt de garantie** | rattaché au locataire concerné |
| `512xxxxx` | **Banque mandant** | la banque où transitent les fonds |
| `706xxxxx` | **Honoraires** (chiffre d'affaires de l'agence) | famille honoraires de l'ancien |
| `466xxxxx` | **Provisions / Acomptes** | idem |

Quelques subtilités à avoir en tête :

- Un **même propriétaire** peut avoir **plusieurs sous-comptes** (un par bien,
  ou un héritage de structures juridiques multiples).
- Le `Sens` D/C n'a pas la même signification selon le compte :
  un `411` **débiteur** = le propriétaire nous doit de l'argent (rare, anormal) ;
  un `411` **créditeur** = on lui doit de l'argent (normal en fin de mois).
- La convention "sous-compte = identifiant interne" est utilisée par la plupart
  des logiciels, mais le **format de ce sous-compte varie** (numérique, alpha,
  longueur variable).

⚠️ Le client dont tu as le FEC n'utilise pas exactement cette nomenclature.
À toi de comprendre ce qu'il utilise et comment ça se traduit.

---

## 3. Ta mission

Construis un **dashboard de mapping** que notre équipe Customer Success
peut ouvrir, charger un FEC, et sortir avec un mapping validé.

L'outil doit l'aider à :
- comprendre la **structure des comptes** du fichier (quels préfixes, quels volumes, quels montants)
- **identifier la nature** de chaque compte (propriétaire ? locataire ? autre ?) avec une part d'automatisation
- **rapprocher** les comptes propriétaires/locataires/fournisseurs du FEC avec nos exports métier Rivage (les CSV qu'on te fournit, voir §4)
- **signaler les ambiguïtés** : compte avec gros solde non mappé, doublon, libellé qui matche plusieurs entités, etc.
- **exporter le mapping** dans un format ré-injectable (CSV/JSON, comme tu veux)

Le reste (UX, stack, niveau d'automatisation, IA dans la boucle ou pas)
est à toi.

---

## 4. Inputs

- `fec_client_03_2026.txt` — le FEC, ~11 600 lignes, pipe-délimité, encodage Latin-1
- `rivage_owners.csv` — export de nos propriétaires (id, nom, email, IBAN…)
- `rivage_tenants.csv` — export de nos locataires
- `rivage_suppliers.csv` — export de nos fournisseurs récurrents

Format FEC standard DGFiP, colonnes :

```
JournalCode | JournalLib | EcritureNum | EcritureDate | CompteNum |
CompteLib | CompAuxNum | CompAuxLib | PieceRef | PieceDate |
EcritureLib | Montant | Sens | EcritureLet | DateLet | ValidDate |
Montantdevise | Idevise
```

`Sens` vaut `D` (débit) ou `C` (crédit). `Montant` est en virgule
décimale française (`819,00`). Les libellés `CompteLib` sont tronqués à
environ 28 caractères (tu verras `DG GUILLOT H�l�ne` ou
`PROVISIONS CHAPONOT Philip…`).

---

## 5. Stack & contraintes

- **Stack libre.** Web (React, Vue, Streamlit, Next…), notebook, script + UI
  minimale — peu importe. On veut voir ton outil, pas ta maîtrise d'un
  framework précis.
- **Dockerisé idéalement**, ou un `make run` / `pnpm dev` qui marche en
  une commande.
- **IA autorisée et encouragée.** Claude, Cursor, Copilot, ce que tu veux.
  On veut voir comment tu collabores avec.
- **Pas besoin de persister.** Tout peut tenir en mémoire. Le mapping
  exporté en fichier suffit.

---

## 6. Déroulement

| Phase | Durée |
|-------|-------|
| Découverte (lire le FEC, comprendre ce qu'on te demande) | 10-15 min |
| Construction | 45-50 min |
| Restitution + démo | 30-45 min |

On ne s'attend pas à un outil fini. On évalue :
- **Comment tu lis le problème** — qu'est-ce que tu as compris du métier en 15 min de doc + fichier
- **Tes choix de découpe** — qu'est-ce que tu automatises, qu'est-ce que tu laisses à l'humain, pourquoi
- **La qualité du flow Customer Success** — est-ce qu'on imagine l'utiliser pour de vrai
- **Comment tu utilises l'IA** — vibe-coding aveugle vs. orchestration consciente

Pas obligé de finir. Un MVP qui résout 70 % du cas vaut mieux qu'un
truc tentaculaire à moitié branché.

---

## 7. Ressources

`resources/` contient 3 docs courts :
- `01_fec_format.md` — le format FEC en 2 pages
- `02_plan_comptable_rivage.md` — notre plan de comptes et ses conventions
- `03_glossaire_gestion_locative.md` — propriétaire, locataire, mandat, CRG…

Tu n'es pas obligé de tout lire. On t'a mis ce qu'il faut pour ne pas
avoir à googler.

Bon courage !
