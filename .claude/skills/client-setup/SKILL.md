---
name: client-setup
description: >-
  Dériver un nouveau site client depuis ce boilerplate : npm run setup, ce que le script
  modifie, mode non interactif par fichier JSON, et déploiement du front et du CMS. À utiliser
  pour démarrer un nouveau projet client, rejouer l'initialisation, ou préparer une mise en
  production.
---

# Démarrer un site client

## La séquence

```bash
git clone <ce-dépôt> site-client && cd site-client
npm install          # installe aussi backend/ et copie les assets tarteaucitron
npm run setup        # questions sur le client
npm run dev          # Strapi (1337) + Astro (4321)
```

Puis créer le compte administrateur sur `http://localhost:1337/admin`.

Au **premier** démarrage, `backend/src/seed.ts` crée le contenu de départ, génère un token API
en lecture seule et l'écrit dans le `.env` racine. C'est l'étape la plus pénible à faire à la
main : ne pas la refaire manuellement, et ne pas s'étonner de voir `.env` modifié.

## Ce que `npm run setup` modifie

| Fichier | Contenu |
|---|---|
| `package.json` | nom, version remise à `0.1.0`, description |
| `src/config/site.ts` | identité, URL, contact, réseaux sociaux, mentions légales |
| `.env` | `STRAPI_URL`, `PUBLIC_GA_ID` (le token reste géré par l'amorçage) |
| `backend/.env` | **secrets Strapi régénérés** — indispensable : des secrets partagés entre clients signifient qu'une fuite sur l'un compromet tous les autres |
| `src/styles/global.css` | échelles `--color-brand-*` et `--color-violet-*` générées en OKLCH depuis deux couleurs, et police |
| `src/content/legal/*.md` | marqueurs `{{…}}` remplacés ; champs vides laissés en `[À COMPLÉTER]` |
| `src/pages/index.astro` | remplacé par la page pilotée par le CMS (`scripts/templates/index.astro`) |
| démo | `showcase/`, `UIToggle`, `Toolbar`, logos techniques et captures supprimés |
| git | historique réinitialisé sur un commit unique — **`LICENSE.md` et le crédit Sensinum sont conservés** (le starter est sous MIT) |

Options :

- `--dry-run` — affiche les changements sans rien écrire. À utiliser pour vérifier avant de
  lancer.
- `--force` — rejoue l'initialisation d'un projet déjà configuré (`.setup-done` présent).
- `--answers fichier.json` — mode non interactif, modèle dans
  `scripts/answers.example.json`. Nécessaire pour industrialiser plusieurs sites, et **seul
  mode utilisable hors terminal** : avec une entrée redirigée, le script refuse de s'exécuter
  plutôt que de produire un résultat partiel.

Le script lance `astro check` après la suppression de la démo, et signale toute erreur
restante.

## Après l'initialisation

1. Remplacer `public/favicon.svg` et `public/og-image.png` (1200×630).
2. Si la police choisie n'est pas Inter, installer le paquet indiqué par le script :
   `npm install @fontsource-variable/<nom>`.
3. **Relire `src/content/legal/`** et faire valider les textes. Ce sont des modèles, pas un
   conseil juridique.
4. Renseigner le single type « Réglages du site » dans Strapi : nom, logo, navigation, pied
   de page.
5. `/seo-check` avant la mise en ligne.

## Déploiement

Les deux applications se déploient **séparément**.

**Front (Astro)** — Vercel, Netlify, ou tout hébergeur statique.
Build : `npm run build:web` · Sortie : `dist/` · Variables : `STRAPI_URL`, `STRAPI_TOKEN`,
`PUBLIC_GA_ID`.
Le contenu étant figé au build, **toute modification dans le CMS exige un nouveau build** —
brancher un webhook Strapi sur le déploiement.

**CMS (Strapi)** — Strapi Cloud, Railway, ou un VPS.
Build : `npm --prefix backend run build` · Démarrage : `npm run cms:start`.

> **SQLite est réservé au développement.** En production, utiliser PostgreSQL et un stockage
> de médias persistant (S3, Cloudinary) : sur un hébergeur à système de fichiers éphémère, une
> base SQLite et les fichiers uploadés disparaissent à chaque redéploiement.

Créer en production un token API **en lecture seule** depuis l'administration (Settings → API
Tokens) avec `find`/`findOne` sur les content-types **et** l'accès en lecture au
Content-Type Builder : le loader introspecte les schémas au build, un token limité au contenu
seul ne suffit pas.
