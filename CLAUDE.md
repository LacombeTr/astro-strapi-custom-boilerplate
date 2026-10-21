# Boilerplate sites vitrines — Astro × Strapi

Monorepo pour produire des sites vitrines clients : rapides, bien référencés, et modifiables
par le client sans intervention sur le code. Alternative légère à WordPress.

## Les deux applications

| | Dossier | Port | Lancement |
|---|---|---|---|
| **CMS** Strapi 5 | `backend/` | 1337 | `npm run dev:cms` |
| **Front** Astro 7 | racine | 4321 | `npm run dev:web` |

`npm run dev` lance les deux. **Pas de npm workspaces** : Strapi exige React 18, le front
utilise React 19 — le hoisting casserait l'un des deux. `backend/` a donc ses propres
`package.json` et `node_modules`, installés par le `postinstall` racine.

## Commandes

| Commande | Effet |
|---|---|
| `npm run setup` | Paramètre le dépôt pour un nouveau client (interactif) |
| `npm run dev` | Strapi + Astro en parallèle |
| `npm run typecheck` | `astro check` — **à lancer après toute modification** |
| `npm run build` | Build du CMS puis du front (avec contrôle de types) |
| `npm run cms:seed` | Rejoue l'amorçage du CMS |
| `npm run skills:refresh` | Re-télécharge les skills amont vendorés |

## Règles de ce dépôt

1. **Zéro JS par défaut.** Un composant ne reçoit une directive `client:*` que s'il a besoin
   d'interactivité réelle. C'est ce qui tient les performances et le SEO. Les animations
   passent par l'API vanilla de `motion` (`src/scripts/animations.ts`), pas par React.
2. **Les icônes passent par `astro-icon`** (`<Icon name="lucide:menu" />`) : SVG inliné au
   build, aucun JS. Ne pas ajouter `react-icons`.
3. **Toute page passe par `BaseLayout.astro`.** C'est ce qui garantit titre, description,
   canonique, JSON-LD et bandeau cookies. Ne pas écrire de `<head>` dans une page.
4. **Aucun script tiers hors de tarteaucitron.** Pas d'`<iframe>` YouTube ou Maps en direct :
   utiliser `src/components/Embed.astro`. Voir le skill `rgpd-cookies`.
5. **`src/config/site.ts` est la seule source de vérité** pour le nom, l'URL, les coordonnées
   et les mentions légales. Jamais de domaine ni de raison sociale en dur ailleurs.
6. **Les schémas Strapi (`backend/src/`) et les types (`src/types/strapi/`) évoluent
   ensemble**, dans le même commit.
7. **Le site doit builder avec le CMS éteint.** `src/content.config.ts` rattrape l'erreur et
   `src/lib/strapi.ts` renvoie `null`/`[]`. Ne pas supprimer ce filet ; les pages doivent
   toujours gérer l'absence de contenu.
8. **Ne jamais committer `.env` ni `backend/.env`.** Le token Strapi est généré par
   l'amorçage du CMS (`backend/src/seed.ts`).

## Où regarder

| Sujet | Fichiers |
|---|---|
| Requêtes et collections Strapi | `src/content.config.ts` |
| Accès typé au contenu | `src/lib/strapi.ts` |
| Blocs de contenu | `src/components/blocks/`, `BlockRenderer.astro` |
| SEO | `src/components/Seo.astro`, `src/lib/schema.ts`, `src/pages/robots.txt.ts` |
| RGPD | `src/components/CookieConsent.astro`, `Embed.astro`, `src/content/legal/` |
| Thème et tokens | `src/styles/global.css` |
| Amorçage du CMS | `backend/src/seed.ts` |

## Skills et commandes

Skills dans `.claude/skills/` : `astro-strapi-starter` (point d'entrée), `astro-strapi-loader`
et `astro-strapi-blocks` (copies vendorées de l'amont), `tailwind-shadcn`, `vitrine-seo`,
`rgpd-cookies`, `client-setup`.

Commandes : `/new-block` (nouveau bloc de contenu de bout en bout), `/new-page`, `/seo-check`.

[`AGENTS.md`](./AGENTS.md) reprend l'essentiel pour les outils qui ne lisent pas ce fichier.
