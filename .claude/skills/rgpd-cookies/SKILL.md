---
name: rgpd-cookies
description: >-
  Règles cookies et RGPD de ce boilerplate : tarteaucitron comme unique point d'entrée des
  scripts tiers, composant Embed pour YouTube et Google Maps, Consent Mode v2, pages légales.
  À utiliser avant d'ajouter un script tiers, une carte, une vidéo, un outil de mesure, ou
  pour modifier les pages légales.
---

# Cookies et RGPD

## Le point de départ

Ce site est statique et **ne pose aucun cookie par lui-même**. Le `localStorage` du thème
relève des préférences utilisateur et est exempté de consentement.

Autrement dit : **sans service tiers, il n'y a pas besoin de bandeau**, et le bandeau ne
s'affiche effectivement pas. C'est l'état par défaut, et le plus sûr. Un bandeau sur un site
qui ne dépose rien est au mieux inutile, au pire trompeur.

Tout ce qui suit ne concerne donc que les sites où l'on **ajoute** un tiers.

## Règle absolue

**Aucun script tiers ne se charge en dehors de tarteaucitron.** Pas de `<script src>` vers un
domaine externe, pas d'`<iframe>` YouTube ou Maps, pas de pixel. Un tiers chargé directement
dépose ses cookies avant tout consentement — c'est le manquement le plus fréquent et le plus
facile à constater depuis l'extérieur.

| Besoin | À utiliser |
|---|---|
| Mesure d'audience GA4 | `PUBLIC_GA_ID` dans `.env` — rien d'autre à coder |
| Vidéo YouTube | `<Embed type="youtube" id="…" title="…" />` |
| Carte Google Maps | `<Embed type="googlemaps" query="…" title="…" />` |
| Autre service | Ajouter un `job` tarteaucitron (voir ci-dessous) |

## Comment c'est câblé

- `src/components/CookieConsent.astro` — chargé par `BaseLayout`, c'est le seul endroit qui
  configure tarteaucitron. Il ne rend **rien** si aucun service n'est actif.
- `src/components/Embed.astro` — produit le markup que tarteaucitron remplace après
  consentement (`youtube_player`, `googlemaps`), avec un ratio réservé en CSS pour que
  l'apparition de l'iframe ne décale pas la page.
- `public/vendor/tarteaucitron/` — assets copiés depuis `node_modules` par le `postinstall`
  (`scripts/copy-tarteaucitron.mjs`). Dossier gitignoré : c'est un artefact d'installation.
  Tarteaucitron est du JS global, il ne passe pas par Vite, d'où la copie dans `public/`.

### Réglages à ne pas assouplir

Dans l'appel `tarteaucitron.init()` :

- `highPrivacy: true` — aucun service activé par un simple défilement ou survol. Le
  consentement doit être un acte explicite.
- `AcceptAllCta` **et** `DenyAllCta` à `true` — refuser doit être aussi simple qu'accepter.
  C'est l'exigence que la plupart des bandeaux ne respectent pas, et celle qui est contrôlée.
- `showIcon: true` — permet de revenir sur son choix à tout moment. Le retrait du consentement
  doit être aussi accessible que son octroi.

Le bouton « Gérer les cookies » du pied de page (`Footer.astro`) n'apparaît que si
tarteaucitron est réellement chargé.

### Consent Mode v2 (GA4)

Quand `PUBLIC_GA_ID` est défini, `CookieConsent.astro` pose d'abord un état
`gtag('consent', 'default', …)` **tout en `denied`**, avant le chargement de tarteaucitron.
Sans cette amorce, la première mesure partirait sans consentement. Tarteaucitron fait
ensuite l'`update` à l'acceptation. Ne pas retirer ce bloc.

## Ajouter un nouveau service

1. Vérifier qu'il existe dans `tarteaucitron.services.js` (le paquet en couvre ~200).
2. L'ajouter aux `services` passés à `<CookieConsent>` ou au tableau `jobs`.
3. **Mettre à jour `src/content/legal/politique-cookies.md`** : le tableau doit lister les
   services réellement actifs, avec finalité, éditeur et durée. Une politique qui ne
   correspond pas aux traitements réels est pire que pas de politique.
4. Vérifier dans l'onglet réseau qu'aucune requête ne part avant acceptation.

## Pages légales

`src/content/legal/*.md`, rendues par `src/pages/[slug].astro`, en Markdown versionné et non
dans le CMS : ces textes engagent juridiquement et doivent suivre les revues de code.

Les marqueurs `{{…}}` sont remplis par `npm run setup`. Les champs non renseignés restent en
`[À COMPLÉTER]` — c'est volontairement visible.

**Ces fichiers sont des modèles, pas un conseil juridique.** Le dire explicitement quand on
les modifie ou qu'on les présente au client, et ne jamais affirmer qu'un site est « conforme ».

## Vérifier

Dans un navigateur, sur le site construit :

1. `PUBLIC_GA_ID` vide → aucun bandeau, et **aucun cookie** dans l'onglet Application.
2. `PUBLIC_GA_ID` renseigné → bandeau affiché, et **aucune requête vers
   `google-analytics.com` ni aucun cookie avant un clic sur « Accepter »**. Après refus, idem.
3. Un `<Embed>` YouTube n'appelle `youtube.com` qu'après consentement.
