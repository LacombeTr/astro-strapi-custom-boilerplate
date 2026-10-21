---
name: astro-strapi-starter
description: >-
  Develop and extend this Astro + Strapi vitrine boilerplate: content.config with
  @sensinum/astro-strapi-loader, Strapi 5 data in Astro pages, StrapiBlocks, BlockRenderer,
  Tailwind 4, shadcn. Covers the backend/ Strapi app, slug/CMS routes, Astro i18n, package
  upgrades. Types in src/types/strapi/ with a barrel index.
---

# Astro × Strapi — boilerplate sites vitrines

Dérivé du template [astro-strapi-starter](https://github.com/VirtusLab-Open-Source/astro-strapi-starter)
de Sensinum (MIT), adapté à la production de sites vitrines clients.

## Scope

- **Stack :** Astro 7+, Strapi 5 (dans `backend/`), `@sensinum/astro-strapi-loader`,
  `@sensinum/astro-strapi-blocks`, Tailwind CSS 4, shadcn-style UI dans `src/components/ui/`.
- **Goal :** Add or change CMS-driven content, query shapes, and UI while keeping one source of
  truth for Strapi REST objects and a clear split between **dynamic zone components** and
  **rich-text Blocks**.

## Monorepo : deux applications

| | Dossier | Port | Dépendances |
|---|---|---|---|
| **CMS** | `backend/` | 1337 | `backend/package.json`, `backend/node_modules` **indépendants** |
| **Front** | racine | 4321 | `package.json` racine |

**Pas de npm workspaces** : Strapi exige React 18 (admin), le front utilise React 19. Le hoisting
casserait l'un des deux. Toujours installer le backend via `npm --prefix backend install` (fait
automatiquement par le `postinstall` racine).

Les schémas Strapi dans `backend/src/api/*/content-types/` et `backend/src/components/` doivent
rester **alignés** avec les types TypeScript de `src/types/strapi/`. Quand tu changes l'un, change
l'autre dans le même commit.

## Read next

- **Loader** (queries, collections, locales) : [`../astro-strapi-loader/SKILL.md`](../astro-strapi-loader/SKILL.md) — copie vendorée de l'amont.
- **StrapiBlocks** (rich text) : [`../astro-strapi-blocks/SKILL.md`](../astro-strapi-blocks/SKILL.md) — copie vendorée de l'amont.
- **SEO :** [`../vitrine-seo/SKILL.md`](../vitrine-seo/SKILL.md) · **RGPD :** [`../rgpd-cookies/SKILL.md`](../rgpd-cookies/SKILL.md)
- **Nouveau client :** [`../client-setup/SKILL.md`](../client-setup/SKILL.md)
- **Vue d'ensemble :** [`../../../CLAUDE.md`](../../../CLAUDE.md)
## Configuration flow

1. **Environment:** `STRAPI_URL`, `STRAPI_TOKEN` in `.env` (see `env.example`). Required for a live build against Strapi; the starter can fall back if the CMS is down (see `content.config.ts` and pages).
2. **Collections:** In `src/content.config.ts`, define **named query objects** (e.g. `homepageQuery`, `pagesQuery`) and pass them to `generateCollections({ url, token }, [{ name, query }, ...])`. Export merged `collections`.
3. **Queries:** Reuse **fragments** (hero, SEO, shared components) with object spread. For dynamic zones, use `on` with **exact component UIDs** from the Strapi schema.
4. **Pages:** Use `getCollection` / `getEntry` from `astro:content`. Single types often appear as a one-item collection—normalize with a small helper if you use `[0]`.

## TypeScript types (`src/types/strapi/`)

- **Layout:** Add types in **small modules** under `src/types/strapi/` (e.g. `media.ts`, `rich-text.ts`, `components.ts`, `single-types.ts`). **Re-export** everything intended for app code from `src/types/strapi/index.ts` so imports stay `from '../types/strapi'` or `from '@/types/strapi'`. When generating or editing types (agents, skills, hand edits), **update the right file** and the barrel — do not leave new types unexported.
- **Schema source for mapping:** To align field names, component UIDs, and relations when writing TypeScript by hand, use Strapi **Content-Type Builder** **GET** endpoints that return JSON for definitions — the operations are typically exposed as **`getContentTypes`**, **`getContentType`**, **`getComponents`**, and **`getComponent`** (exact URLs vary by Strapi version; authenticate as for other admin API calls). Use those payloads as the ground truth alongside sample Content API responses.
- **Loader Zod vs TS types:** `@sensinum/astro-strapi-loader` uses schema introspection at build time to emit **dynamic Zod** for collection entries. The hand-written types in `src/types/strapi/` should match the **same shapes** (including dynamic-zone discriminated unions on `__component`) so components and `astro check` stay consistent with what the loader validates.

## Two rendering paths (do not confuse them)

| Source in Strapi | In Astro | Package / pattern |
|------------------|----------|-------------------|
| **Dynamic zone** (components with `__component`) | Map `__component` in a parent (e.g. `BlockRenderer.astro`) | Project components under `src/components/blocks/` |
| **Rich text → “Blocks”** (editor blocks JSON) | `<StrapiBlocks data={...} />` | `@sensinum/astro-strapi-blocks` |

Use **StrapiBlocks** for the Strapi 5 **Blocks** rich-text field. Use **custom Astro components** for **dynamic zone** entries your schema defines (hero, CTA, etc.).

## StrapiBlocks in this project

- Import: `import { StrapiBlocks } from '@sensinum/astro-strapi-blocks'`.
- Pass **unmodified** field data, e.g. from a text component’s `content` or hero copy.
- Optional: `theme`, `class`, or `blocks={{ ... }}` overrides per package docs.
- Centralize large `theme` objects in a module to avoid drift between pages.

## New dynamic zone block (example workflow)

> Utilise la commande `/new-block` : elle enchaîne les 5 étapes ci-dessous.

1. **Schéma Strapi :** créer `backend/src/components/blocks/<nom>.json` (ou via l'admin, puis
   committer le JSON généré — l'admin écrit dans ces mêmes fichiers). Noter le `__component`,
   qui vaut `blocks.<nom>`.
2. **Référencer** le composant dans la dynamic zone du content-type concerné
   (`backend/src/api/<type>/content-types/<type>/schema.json`, clé `components`).
3. **Types :** étendre `src/types/strapi/components.ts` — ajouter le littéral dans
   `StrapiContentComponentTypes`, le type `StrapiContent<Nom>Component`, et l'ajouter à l'union
   `StrapiContentComponents`. Le barrel `index.ts` réexporte déjà tout le module.
4. **Composant :** nouveau fichier sous `src/components/blocks/` + une branche dans
   `BlockRenderer.astro`.
5. **Populate :** mettre à jour la requête dans `src/content.config.ts` pour que les médias et
   relations du nouveau composant soient inclus (voir le skill loader, `on` / `populate` imbriqué).

Puis `npm run typecheck` — l'union discriminée fait échouer la compilation si une branche manque.

## New collection or content type

1. Add a **query** object and a new entry in the `generateCollections` definition list.
2. Add types under `src/types/strapi/` (and the barrel `index.ts`); keep field names aligned with the API and with Content Builder / loader introspection.
3. Add pages under `src/pages/` that call `getCollection` with the new key.

## CMS-driven routes: `slug`, `documentId`, or other unique key

For **collection** types (e.g. “pages” in Strapi) you usually expose a **string** in the URL — often `slug` — or another unique field. The loader materializes Strapi as `astro:content` entries; your route must map **one field per segment** to `params` that match the file name (e.g. `src/pages/[slug].astro` → `params.slug`).

**Pattern (SSG, conceptual):** In the dynamic page, use `getStaticPaths` and `getCollection('yourCollection')` (see Astro [ Routing](https://docs.astro.build/en/guides/routing/) and [Content collections: generating pages](https://docs.astro.build/en/guides/content-collections/#generating-pages-from-content-collections)):

```ts
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const items = await getCollection("pages"); // name from content.config
  return items.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}
```

Replace `pages` / `slug` with your collection name and the **field you agree is the path key**.

**Agent workflow (do not guess the URL key):**

1. Read `src/types/strapi/` (or generated entry types) for the collection and list **candidates** for a route segment: e.g. `slug`, `uid`, `documentId`, or locale-prefixed shapes.
2. **Ask the user** which field to use for URL generation, whether it is **unique** per site or per-locale, and if **fallbacks** are allowed (e.g. missing `slug` → skip path or 404).
3. Once chosen, use that field in `getStaticPaths` and in links inside components. `documentId` is stable but usually worse for public URLs than a dedicated `slug`.

## Internationalization (i18n)

- **Astro (canonical):** Configure routing, `[lang]` segments, and `i18n` in `astro.config` per the official guide: **[Internationalization (i18n) routing](https://docs.astro.build/en/guides/internationalization/)** (routing strategies, `getRelativeLocaleUrl`, `astro:i18n`, etc.). This repo does not ship a second, competing convention — add folders and config as the docs show.
- **Strapi + loader:** Use **locales** in your Strapi REST `filters` / `locale` and in loader/collection options (see the vendored loader skill). The **Astro** locale in the path (e.g. `en/`, `pl/`) and the **Strapi** `locale` parameter for fetches must **line up** in your page logic and `content.config` queries.
- **Single source of truth:** URL structure = Astro i18n; per-locale data = Strapi queries.


## Monter de version `@sensinum/astro-strapi-loader` / `astro-strapi-blocks`

1. Changer la version dans `package.json`, puis `npm install`.
2. **Rafraîchir les skills vendorés** : `npm run skills:refresh` (re-télécharge les `SKILL.md`
   amont). Mettre à jour la note de version en tête de chaque fichier.
3. `npm run build` et corriger les ruptures de schéma ou d'import.

## UI (Tailwind + shadcn)

- Tokens de design globaux et Tailwind : `src/styles/global.css`.
- Primitives React shadcn : `src/components/ui/`, `cn()` depuis `@/lib/utils`, alias dans
  `components.json`.
- Astro + Tailwind pur coexiste avec les îlots React — garder **un seul langage visuel**
  (espacements, tokens de couleur) entre les deux.
- **Par défaut, pas d'îlot React.** Un composant n'obtient une directive `client:*` que s'il a
  besoin d'interactivité réelle. C'est la contrainte qui garantit le « zéro JS » et donc le SEO.

## Vérification

- `npm run typecheck` (`astro check`) après toute modification de schéma, de
  `content.config.ts` ou de composant de bloc.
- `npm run build` lance `astro check` puis le build de production.
- Le front doit builder **même si Strapi est éteint** : `src/content.config.ts` rattrape l'erreur
  et les pages utilisent un contenu de secours. Ne pas supprimer ce filet.
