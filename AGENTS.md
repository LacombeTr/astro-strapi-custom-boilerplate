# Contexte pour les agents

Les instructions complètes sont dans **[`CLAUDE.md`](./CLAUDE.md)** : stack, commandes,
conventions et règles du dépôt. Ce fichier existe pour les outils qui ne lisent pas `CLAUDE.md`.

## L'essentiel

Monorepo **Astro 7** (racine, port 4321) + **Strapi 5** (`backend/`, port 1337) pour produire
des sites vitrines. `npm run dev` lance les deux.

**Pas de npm workspaces** : Strapi exige React 18, le front utilise React 19. `backend/` a ses
propres `package.json` et `node_modules`.

## Règles

1. **Zéro JS par défaut** — une directive `client:*` seulement en cas d'interactivité réelle.
   Animations via l'API vanilla de `motion`, icônes via `astro-icon`.
2. **Toute page passe par `src/layouts/BaseLayout.astro`** — jamais de `<head>` dans une page.
3. **Aucun script tiers hors de tarteaucitron** — pas d'`<iframe>` YouTube/Maps directe,
   utiliser `src/components/Embed.astro`.
4. **`src/config/site.ts` est la seule source de vérité** pour nom, URL, coordonnées, mentions
   légales. Aucun domaine en dur ailleurs.
5. **Schémas Strapi (`backend/src/`) et types (`src/types/strapi/`) évoluent ensemble.**
6. **Le site doit builder avec le CMS éteint** — ne pas retirer les `try/catch` de
   `src/content.config.ts` et `src/lib/strapi.ts`.
7. **Requêtes Strapi en objets JavaScript**, sérialisées par `qs`. Jamais de query string à la
   main. Chaque média ou composant imbriqué doit figurer dans `populate`.
8. **Ne jamais committer `.env` ni `backend/.env`.**

Vérification : `npm run typecheck` (`astro check`) après toute modification.

## Documentation détaillée

Les skills sont dans [`.claude/skills/`](./.claude/skills/) — un fichier `SKILL.md` par
domaine : `astro-strapi-starter` (point d'entrée), `astro-strapi-loader` et
`astro-strapi-blocks` (copies vendorées de la documentation amont), `tailwind-shadcn`,
`vitrine-seo`, `rgpd-cookies`, `client-setup`.

Ils sont en Markdown avec frontmatter et lisibles par n'importe quel outil.
