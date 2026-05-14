# Asset packs

Tous les packs sont en CC0 (domaine public). Le contenu COMPLET est inclus
ici — même les modules non utilisés actuellement — pour qu'on ait toujours
de quoi piocher quand on étend le jeu (nouveau bâtiment, nouveau décor, etc.).

## Inventaire

### `medieval-village/` — Quaternius Medieval Village MegaKit (Standard)
- ~154 MB (glTF 58 MB + Textures 95 MB)
- 374 modules de construction (murs, toits, portes, escaliers, props, etc.)
- 26 textures PBR 4K (BaseColor + Normal + Roughness/ORM)
- Source : https://quaternius.com/packs/medievalvillagemegakit.html
- Licence : CC0 1.0 Universal

### `stylized-nature/` — Quaternius Stylized Nature MegaKit (Standard)
- ~87 MB (glTF 48 MB + Textures 37 MB)
- 157 modules : trees (Common, Dead, Twisted, Pine), bushes, rocks, grass,
  flowers, mushrooms, plants, pebbles, leaves
- Textures stylisées (cf. dossier Textures/)
- Source : https://quaternius.com/packs/stylizednaturemegakit.html
- Licence : CC0 1.0 Universal

### `textures/aerial-grass-rock/` — Poly Haven
- ~74 MB (JPG diff + rough, PNG disp, EXR normal — tout en 4K)
- Texture de terrain hybride herbe/roche, vue de dessus, tileable
- Source : https://polyhaven.com/a/aerial_grass_rock
- Licence : CC0

## Format

Les modèles sont fournis en `.gltf` + `.bin` sidecar — chargeables
directement par three.js via `useGLTF` de drei. Les FBX/OBJ ne sont pas
inclus (on n'en a pas besoin en web). Les `.blend` non plus.

## Convention

Chemin runtime : `/assets/{pack}/glTF/{Module}.gltf`
Textures : `/assets/{pack}/Textures/{T_*.png}` (référencées en URI relative
depuis chaque `.gltf`)

## Note sur la taille du repo

~314 MB d'assets — repository devient lourd à cloner mais c'est le prix
pour avoir tout sous la main sans re-downloader à chaque setup dev.
