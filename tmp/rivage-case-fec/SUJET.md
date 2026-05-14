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

Côté Rivage, on utilise une convention PCG **adaptée** à la gestion locative —
elle ressemble au PCG général mais s'en écarte sur plusieurs racines (notamment
les honoraires et les comptes pivots). Les principales racines à connaître :

| Racine Rivage | Quoi | À mapper depuis le FEC |
|---------------|------|------------------------|
| `411xxxxxx` | **Propriétaire** — un sous-compte par propriétaire (ou par indivision) | le compte propriétaire de l'ancien logiciel |
| `419xxxxxx` | **Locataire** — un sous-compte par locataire (en réalité par bail) | le compte locataire de l'ancien logiciel |
| `401xxxxxx` | **Fournisseur** (artisan, syndic, assureur…) | la famille fournisseurs de l'ancien |
| `1651xxxxx` | **Dépôt de garantie conservé** — rattaché au bail | les comptes DG (souvent `165…`) |
| `5121xxxxx` | **Banque mandant** — le compte bancaire qui héberge les fonds clients | la banque mandant de l'ancien (souvent `512…`) |
| `467xxxxxx` | **Honoraires de l'agence** (gestion, GLI, location, EDL…) — c'est le compte de produits, décliné en sous-comptes par type d'honoraire | la famille honoraires (souvent `706…` côté ancien — racine PCG standard) |
| `4712xxxxx` | **Comptes pivots internes** (fonds à allouer : loyers, provisions, charges, DG…) — comptes techniques d'attente avant ventilation | les comptes d'attente / provisions (souvent `466…` ou `471…`) |
| `4672` / `4673` | **GLI** (indemnités + reversements) | comptes spécifiques GLI s'il y en a |

> ⚠️ Notre convention diffère du PCG standard sur 2 racines piégeuses :
> - **Honoraires : `467` chez nous, pas `706`.** La plupart des anciens logiciels
>   utilisent `706` (produits d'exploitation, PCG général). Il faut donc rerouter.
> - **Comptes pivots / fonds à allouer : `4712` chez nous, pas `466`.** Ces comptes
>   internes ne représentent pas une contrepartie tierce, ce sont des sas
>   techniques utilisés par notre moteur de répartition.

Quelques subtilités à avoir en tête :

- Un **même propriétaire** peut avoir **plusieurs sous-comptes** (cas d'une
  indivision : un compte par indivisaire, ou un compte mutualisé). Symétriquement,
  un **locataire** peut apparaître sur plusieurs `419` s'il est sur plusieurs baux.
- Le `Sens` D/C n'a pas la même signification selon le compte :
  un `411` **débiteur** = le propriétaire nous doit de l'argent (rare, anormal) ;
  un `411` **créditeur** = on lui doit de l'argent (normal en fin de mois).
- La convention "sous-compte = identifiant interne" est utilisée par la plupart
  des logiciels, mais le **format de ce sous-compte varie** énormément
  (numérique, alpha, longueur variable, parfois encodé sur 12 ou 16 chiffres
  avec des zéros de bourrage et un suffixe lot).
- Tous les anciens logiciels n'ont pas de racine `fournisseur` dédiée — certains
  imputent les dépenses directement sur le compte propriétaire ou via le journal
  des dépenses. C'est OK, ça veut juste dire qu'il n'y a rien à mapper en `401`.

⚠️ Le client dont tu as le FEC n'utilise pas la nomenclature Rivage.
À toi de **deviner** sa convention en lisant le fichier, puis de la **traduire**
vers la nôtre.

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

- `fec_client_03_2026.txt` — le FEC du client, ~11 600 lignes, pipe-délimité,
  encodage Latin-1. **Une seule période** (mars 2026), donc volumétrie réaliste
  mais pas écrasante.
- `rivage_owners.csv` — export de nos propriétaires existants côté Rivage
  (id, nom, email, IBAN, **numéro de compte Rivage 411xxxxxx**)
- `rivage_tenants.csv` — export de nos locataires (idem, **419xxxxxx**)
- `rivage_suppliers.csv` — export de nos fournisseurs récurrents
  (idem, **401xxxxxx**)

Les 3 CSV Rivage sont des **données réelles d'un client de prod** — c'est ce que
notre équipe Customer Success aurait sous la main au moment de la reprise.
À toi de t'en servir pour rapprocher.

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
