# Boilerplate sites vitrines — Astro × Strapi

Socle pour produire des sites vitrines clients : **rapides**, **bien référencés** et
**modifiables par le client** sans intervention sur le code. Pensé comme une alternative
légère à WordPress — pas de plugins à maintenir, pas de base de données interrogée à chaque
visite, pas de surface d'attaque côté public.

| | |
|---|---|
| **Front** | [Astro 7](https://astro.build) — statique, zéro JavaScript par défaut |
| **CMS** | [Strapi 5](https://strapi.io) — dans `backend/`, administration en français |
| **Styles** | [Tailwind CSS 4](https://tailwindcss.com) + primitives [shadcn/ui](https://ui.shadcn.com) |
| **Langage** | TypeScript strict, de bout en bout |
| **Icônes** | [astro-icon](https://www.astroicon.dev) + Iconify — SVG inlinés, aucun JS |
| **Animations** | [motion](https://motion.dev) en API vanilla |
| **SEO** | `<Seo>` centralisé, JSON-LD typé, sitemap et robots.txt générés |
| **RGPD** | [tarteaucitron](https://tarteaucitron.io) + pages légales pré-remplies |

> Dérivé de [astro-strapi-starter](https://github.com/VirtusLab-Open-Source/astro-strapi-starter)
> de [Sensinum](https://sensinum.com) (licence MIT).

---

## Sommaire

- [Prérequis](#prérequis)
- [Démarrer un nouveau site client](#démarrer-un-nouveau-site-client)
- [Les deux applications](#les-deux-applications)
- [Commandes](#commandes)
- [Variables d'environnement](#variables-denvironnement)
- [Ajouter du contenu](#ajouter-du-contenu)
- [SEO](#seo)
- [Animations et icônes](#animations-et-icônes)
- [Cookies et RGPD](#cookies-et-rgpd)
- [Déploiement](#déploiement)
- [Travailler avec Claude Code](#travailler-avec-claude-code)
- [Crédits et licence](#crédits-et-licence)

---

## Prérequis

- **Node.js ≥ 22.12** (`node -v`)
- **npm** — le dépôt est configuré pour npm ; `package-lock.json` est versionné

## Démarrer un nouveau site client

```bash
git clone <ce-dépôt> site-client
cd site-client

npm install      # installe aussi backend/ et copie les assets tarteaucitron
npm run setup    # pose les questions sur le client et paramètre le dépôt
npm run dev      # lance Strapi (1337) et Astro (4321)
```

Puis, au premier lancement :

1. Ouvrir **http://localhost:1337/admin** et créer le compte administrateur.
2. Ouvrir **http://localhost:4321** — le site affiche déjà le contenu d'exemple.

Au premier démarrage, le CMS s'amorce tout seul : contenu de départ, **token API en lecture
seule généré** et écrit dans le `.env` racine. C'est l'étape la plus fastidieuse à refaire
pour chaque client, elle est automatisée (`backend/src/seed.ts`).

### Ce que fait `npm run setup`

Il interroge sur le client (nom, domaine, coordonnées, couleurs, police, mentions légales,
Google Analytics) puis :

- renseigne `src/config/site.ts`, `package.json` et `.env` ;
- **régénère les secrets de `backend/.env`** — des secrets partagés entre plusieurs sites
  clients signifieraient qu'une fuite sur l'un compromet tous les autres ;
- génère les échelles de couleurs `--color-brand-*` et `--color-violet-*` en OKLCH à partir
  de deux couleurs ;
- remplit les pages légales de `src/content/legal/` ;
- supprime la vitrine de démonstration et installe une page d'accueil pilotée par le CMS ;
- réinitialise l'historique git sur un commit unique.

Options utiles :

```bash
npm run setup -- --dry-run                      # prévisualise sans rien écrire
npm run setup -- --force                        # rejoue l'initialisation
node scripts/init-project.mjs --answers r.json  # non interactif (modèle : scripts/answers.example.json)
```

### Une fois initialisé

- Remplacer `public/favicon.svg` et `public/og-image.png` (1200×630).
- Installer la police si elle n'est pas Inter : `npm install @fontsource-variable/<nom>`.
- **Relire `src/content/legal/`** et faire valider les textes.
- Renseigner « Réglages du site » dans Strapi (nom, logo, navigation, pied de page).

## Les deux applications

| | Dossier | Port | Rôle |
|---|---|---|---|
| **CMS** | `backend/` | 1337 | Administration du contenu, API REST |
| **Front** | racine | 4321 | Site public, généré statiquement |

Pour n'en lancer qu'une : `npm run dev:cms` ou `npm run dev:web`.

> **Pas de npm workspaces, volontairement.** Strapi exige React 18 pour son administration,
> le front utilise React 19. Le hoisting d'un workspace casserait l'un des deux. `backend/`
> garde donc ses propres `package.json` et `node_modules`, installés par le `postinstall`.

Le front **build même si Strapi est éteint** : un contenu de repli prend le relais. C'est
voulu — on peut travailler l'interface sans le CMS, et une indisponibilité du CMS ne fait pas
échouer un déploiement.

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe le front **et** le backend, copie les assets tarteaucitron |
| `npm run setup` | Paramètre le dépôt pour un nouveau client |
| `npm run dev` | Strapi + Astro en parallèle |
| `npm run dev:cms` / `dev:web` | Une seule des deux applications |
| `npm run typecheck` | `astro check` — à lancer après toute modification |
| `npm run build` | Build du CMS puis du front |
| `npm run build:web` | Front seulement (contrôle de types inclus) → `dist/` |
| `npm run preview` | Sert le `dist/` construit |
| `npm run cms:start` | Démarre Strapi en mode production |
| `npm run cms:seed` | Rejoue l'amorçage du CMS |
| `npm run skills:refresh` | Re-télécharge la documentation amont vendorée |

## Variables d'environnement

Front — `.env` à la racine (modèle : `env.example`) :

| Variable | Obligatoire | Où l'obtenir |
|---|---|---|
| `STRAPI_URL` | oui | `http://localhost:1337` en local ; l'URL du CMS en production |
| `STRAPI_TOKEN` | oui | **Généré automatiquement** au premier `npm run dev`. En production : admin Strapi → Settings → API Tokens |
| `PUBLIC_GA_ID` | non | Google Analytics, format `G-XXXXXXXXXX`. **Vide = aucun script de mesure et aucun bandeau cookies** |

CMS — `backend/.env`, créé à la génération et dont les secrets sont régénérés par
`npm run setup`. En production, fournir au minimum `APP_KEYS`, `ADMIN_JWT_SECRET`,
`JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` et la configuration
de base de données.

Ni `.env` ni `backend/.env` ne doivent être committés.

> Le token doit autoriser **la lecture du contenu et celle du Content-Type Builder** : le
> loader introspecte les schémas Strapi au build pour générer ses validateurs. Un token limité
> au contenu échoue. L'amorçage local crée un token sur mesure avec exactement ces droits.

## Ajouter du contenu

### Une page que le client gère lui-même

Rien à coder. Dans l'administration Strapi, créer une entrée **Page** avec son `slug` et
composer son contenu avec les blocs disponibles. `src/pages/[slug].astro` la rend
automatiquement.

### Un nouveau type de bloc

Un bloc traverse quatre couches, qui doivent rester cohérentes :

1. **Schéma** — `backend/src/components/blocks/<nom>.json`, puis référencer `blocks.<nom>`
   dans les dynamic zones des content-types concernés.
2. **Types** — `src/types/strapi/components.ts` : ajouter le littéral à
   `StrapiContentComponentTypes`, créer le type du composant, l'ajouter à l'union
   `StrapiContentComponents`.
3. **Composant** — `src/components/blocks/<Nom>Block.astro` + une branche dans
   `BlockRenderer.astro`.
4. **Populate** — `src/content.config.ts`, objet `blocksPopulate`. **Sans cette étape, l'API
   renvoie le bloc sans ses images.**

`npm run typecheck` échoue si une branche manque dans `BlockRenderer` : l'union est
discriminée sur `__component`.

Avec Claude Code, `/new-block` enchaîne les quatre couches.

### Un nouveau content-type

Ajouter le schéma dans `backend/src/api/`, une requête et une entrée dans `generateCollections`
(`src/content.config.ts`), les types correspondants, puis les pages qui les consomment via
`src/lib/strapi.ts`.

## SEO

Les garanties sont centralisées pour ne pas dépendre de la vigilance page par page :

- **`src/config/site.ts`** — seule source de vérité : nom, URL, coordonnées, type d'entité
  pour les données structurées. Alimente aussi `astro.config.mjs`, le sitemap et le robots.
- **`src/layouts/BaseLayout.astro`** — toute page y passe. Jamais de `<head>` dans une page :
  c'est ce qui garantit titre, description, canonique, Open Graph et JSON-LD partout.
- **`src/components/Seo.astro`** — priorité : props explicites → composant SEO de Strapi →
  `site.ts`. Le client peut donc surcharger le SEO depuis l'administration.
- **`src/lib/schema.ts`** — JSON-LD typé avec `schema-dts`. Les erreurs de données
  structurées sont silencieuses côté Google ; ici elles deviennent des erreurs de compilation.
- **`src/pages/robots.txt.ts`** — généré depuis `site.url`. Hors production, il **interdit
  l'indexation** : un environnement de recette indexé crée du contenu dupliqué.

Règles à respecter : un seul `<h1>` par page, titre ≤ 60 caractères, description ≤ 160,
`alt` sur chaque image, `width`/`height` explicites, `loading="lazy"` sauf pour l'image du
hero (élément LCP).

Avec Claude Code, `/seo-check` audite le `dist/` construit.

## Animations et icônes

```astro
---
import { Icon } from 'astro-icon/components';
---
<Icon name="lucide:arrow-right" class="size-4" />

<section data-reveal>Apparaît à l'entrée dans le viewport</section>
<ul data-stagger>…les enfants apparaissent en cascade…</ul>
```

Les icônes sont inlinées en SVG au build : **aucun JavaScript**. Les animations utilisent
l'API vanilla de `motion` (`src/scripts/animations.ts`) et non React — un îlot hydraté
coûterait plusieurs dizaines de kilo-octets sur une page sans interactivité.
`prefers-reduced-motion` est respecté.

`motion/react` reste disponible pour les composants réellement interactifs.

## Cookies et RGPD

**Par défaut, ce site ne dépose aucun cookie** et **n'affiche donc aucun bandeau**. Le
`localStorage` du thème relève des préférences utilisateur et est exempté de consentement.
C'est le réglage le plus sûr, et celui qu'il faut garder quand c'est possible.

Un bandeau n'apparaît que si un service tiers est activé :

| Besoin | À utiliser |
|---|---|
| Google Analytics 4 | Renseigner `PUBLIC_GA_ID` — rien d'autre à coder |
| Vidéo YouTube | `<Embed type="youtube" id="…" title="…" />` |
| Carte Google Maps | `<Embed type="googlemaps" query="…" title="…" />` |

**Règle absolue : aucun script tiers en dehors de tarteaucitron.** Pas d'`<iframe>` YouTube
ou Maps écrite directement — elle déposerait ses cookies avant tout consentement.
`src/components/Embed.astro` produit un espace réservé que tarteaucitron remplace après
acceptation, sans décalage de mise en page.

La configuration (`src/components/CookieConsent.astro`) refuse tout service avant action
explicite, affiche « Tout refuser » au même niveau que « Tout accepter », et permet de revenir
sur son choix via le pied de page. Avec GA4, l'état Consent Mode v2 est posé en `denied` avant
tout chargement.

Les pages légales sont dans `src/content/legal/` — en Markdown versionné plutôt que dans le
CMS, parce que ces textes engagent juridiquement et doivent suivre les revues de code.
`npm run setup` les pré-remplit ; les champs manquants restent visiblement en
`[À COMPLÉTER]`.

> **Ce sont des modèles, pas un conseil juridique.** Faites-les relire avant toute mise en
> ligne, et assurez-vous qu'ils décrivent vos traitements réels.

## Déploiement

Les deux applications se déploient **séparément**.

### Front (Astro)

Vercel, Netlify, Cloudflare Pages ou tout hébergeur statique.

- Commande de build : `npm run build:web`
- Dossier publié : `dist/`
- Variables : `STRAPI_URL`, `STRAPI_TOKEN`, `PUBLIC_GA_ID`

Le contenu est figé au build : **toute modification dans le CMS exige un nouveau build**.
Brancher un webhook Strapi sur le déploiement pour l'automatiser.

### CMS (Strapi)

Strapi Cloud, Railway, Render ou un VPS.

- Build : `npm --prefix backend run build`
- Démarrage : `npm run cms:start`

> **SQLite est réservé au développement.** En production, utiliser **PostgreSQL** et un
> stockage de médias persistant (S3, Cloudinary). Sur un hébergeur à système de fichiers
> éphémère, une base SQLite et les fichiers uploadés disparaissent à chaque redéploiement.

Créer un token API **en lecture seule** depuis l'administration, avec `find`/`findOne` sur les
content-types **et** l'accès en lecture au Content-Type Builder.

## Travailler avec Claude Code

- **[`CLAUDE.md`](./CLAUDE.md)** — contexte chargé automatiquement : stack, commandes, règles.
- **[`AGENTS.md`](./AGENTS.md)** — même contenu condensé, pour les autres outils.
- **[`.claude/skills/`](./.claude/skills/)** — un `SKILL.md` par domaine :
  `astro-strapi-starter`, `astro-strapi-loader` et `astro-strapi-blocks` (copies **vendorées**
  de la documentation amont, donc disponibles hors ligne), `tailwind-shadcn`, `vitrine-seo`,
  `rgpd-cookies`, `client-setup`.
- **Commandes** : `/new-block`, `/new-page`, `/seo-check`.
- `.claude/settings.json` pré-autorise les commandes de lecture et de vérification, et
  interdit la lecture des fichiers `.env`.

`npm run skills:refresh` resynchronise la documentation amont après une montée de version de
`@sensinum/astro-strapi-loader` ou `astro-strapi-blocks`.

## Crédits et licence

Construit sur [astro-strapi-starter](https://github.com/VirtusLab-Open-Source/astro-strapi-starter)
de [Sensinum](https://sensinum.com) (groupe VirtusLab), ainsi que
[`@sensinum/astro-strapi-loader`](https://github.com/VirtusLab-Open-Source/astro-strapi-loader)
et [`@sensinum/astro-strapi-blocks`](https://github.com/VirtusLab-Open-Source/astro-strapi-blocks).

Licence MIT — voir [LICENSE.md](./LICENSE.md).
