---
description: Crée un nouveau bloc de contenu Strapi de bout en bout (schéma, types, composant, populate)
argument-hint: <nom-du-bloc> [description de ce qu'il doit afficher]
---

Crée un nouveau bloc de contenu réutilisable nommé `$1`.

Contexte : $ARGUMENTS

Un bloc traverse quatre couches qui doivent rester cohérentes. Un oubli dans l'une casse le
rendu silencieusement (relation vide, bloc non affiché). Enchaîne donc **les cinq étapes**,
dans cet ordre :

1. **Schéma Strapi** — `backend/src/components/blocks/$1.json`.
   Reprends la forme des composants existants (`collectionName`, `info.displayName` en
   français, `info.icon`, `attributes`). Le `collectionName` suit la convention
   `components_blocks_<pluriel>`.

2. **Dynamic zones** — ajoute `"blocks.$1"` dans les `components` des content-types concernés :
   `backend/src/api/page/content-types/page/schema.json` (clé `content`) et
   `backend/src/api/homepage/content-types/homepage/schema.json` (clés `sections`, `examples`).

3. **Types** — `src/types/strapi/components.ts` :
   - ajoute `"blocks.$1"` à `StrapiContentComponentTypes` ;
   - crée `StrapiContent<Nom>Component` ;
   - ajoute-le à l'union `StrapiContentComponents`.
   Le barrel `index.ts` réexporte déjà le module, rien à y faire.

4. **Composant** — `src/components/blocks/<Nom>Block.astro`, plus une branche dans
   `BlockRenderer.astro`. Respecte les règles de `CLAUDE.md` : pas de `client:*` sans
   interactivité réelle, `<Icon>` pour les icônes, `buildMediaUrl()` pour les médias Strapi,
   et `width`/`height` sur chaque image.

5. **Populate** — `src/content.config.ts`, objet `blocksPopulate` : ajoute une entrée
   `'blocks.$1'` listant ses médias et composants imbriqués. **Sans cette étape, l'API
   renvoie le bloc sans ses images.**

Termine par `npm run typecheck` : l'union discriminée fait échouer la compilation si une
branche manque dans `BlockRenderer`. Indique ensuite qu'il faut redémarrer `npm run dev:cms`
pour que Strapi prenne le nouveau schéma en compte.
