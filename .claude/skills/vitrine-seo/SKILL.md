---
name: vitrine-seo
description: >-
  Règles SEO de ce boilerplate : composant Seo.astro, BaseLayout obligatoire, JSON-LD typé via
  schema-dts, robots.txt généré, sitemap, images et Core Web Vitals. À utiliser pour créer ou
  modifier une page, ajouter des métadonnées, des données structurées, ou diagnostiquer un
  problème d'indexation.
---

# SEO des sites vitrines

Un site vitrine se joue sur quelques pages : chacune doit être irréprochable. Les garanties
sont centralisées pour qu'elles ne dépendent pas de la vigilance au cas par cas.

## Non-négociables

1. **Toute page passe par `BaseLayout.astro`.** Jamais de `<head>` écrit dans une page : c'est
   le layout qui fournit titre, description, canonique, Open Graph et JSON-LD. Une page qui
   écrit son propre `<head>` sortira tôt ou tard sans canonique.
2. **Un seul `<h1>` par page.** `HeroBlock` accepte `heading={false}` quand il n'est pas le
   titre principal.
3. **`src/config/site.ts` est la seule source de vérité** pour le nom, l'URL, les coordonnées.
   Un domaine en dur ailleurs est un bug : il survivra à la duplication du dépôt.
4. **Pas d'`<iframe>` tierce directe** — voir le skill `rgpd-cookies`. Un script tiers non
   consenti est à la fois un risque juridique et une dégradation du LCP.

## Métadonnées : `Seo.astro`

Priorité des sources, de la plus forte à la plus faible :
**props explicites** → **composant SEO Strapi** (`strapi={page.seo}`) → **`site.ts`**.

Le client peut donc surcharger le SEO depuis l'administration sans toucher au code. Les
images d'`ogImage` arrivent en URL relative au CMS : `buildMediaUrl()` les rend absolues,
`Seo.astro` s'en charge déjà.

```astro
<BaseLayout
  title="Nos services"
  description="…"
  seo={page.seo}
  breadcrumbs={[{ name: 'Accueil', url: '/' }, { name: 'Nos services', url: '/services' }]}
>
```

Contraintes de longueur : **titre ≤ 60 caractères**, **description ≤ 160** (au-delà, Google
tronque). Le composant SEO Strapi applique déjà ces `maxLength`.

`noindex` sur les pages de remerciement, aperçus et doublons.

## Données structurées

Construire les nœuds avec `src/lib/schema.ts`, jamais à la main : `schema-dts` transforme une
erreur de structure en erreur de compilation, alors que Google ignore un bloc invalide sans
rien signaler.

- `organizationSchema()` et `webSiteSchema()` sont émis **une seule fois**, par `BaseLayout`.
- `breadcrumbSchema()` : seulement sur les pages profondes, pas sur l'accueil.
- `site.schemaType` vaut `LocalBusiness` **uniquement** si l'entreprise reçoit du public à une
  adresse physique. Le déclarer à tort est une déclaration fausse, pas une optimisation.

## robots.txt et sitemap

- `src/pages/robots.txt.ts` génère le fichier depuis `site.url`. Hors production (domaine en
  `localhost` ou non HTTPS), il **interdit l'indexation** — un environnement de recette indexé
  crée du contenu dupliqué qui pénalise le site final.
- Le sitemap vient de `@astrojs/sitemap` et suit `site` dans `astro.config.mjs`, lui-même lu
  depuis `site.ts`.

## Images

Elles dominent le LCP d'un site vitrine.

- Toujours `width` et `height` explicites. Les médias Strapi les fournissent
  (`StrapiMedia.width` / `.height`) : il n'y a aucune raison de les omettre.
- `alt` descriptif, ou `alt=""` si l'image est purement décorative — jamais absent.
- L'image du hero est l'élément LCP : `loading="eager"` + `fetchpriority="high"`. **Toutes les
  autres** en `loading="lazy"`.

## Performance

Le socle est bon par construction (statique, zéro JS). Les régressions viennent presque
toujours de :

- une directive `client:*` ajoutée sans besoin réel d'interactivité ;
- un script tiers chargé hors tarteaucitron ;
- une police supplémentaire (chaque famille coûte une requête bloquante — préférer une seule
  famille variable, déjà en place via `@fontsource-variable`).

## Vérification

`/seo-check` audite le `dist/` construit. Le faire **avant chaque mise en production**, parce
que seul le HTML généré révèle les titres dupliqués et les canoniques en `localhost`.
