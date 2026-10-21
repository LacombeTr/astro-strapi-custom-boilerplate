---
description: Crée une nouvelle page, en choisissant entre contenu géré par le client ou page codée
argument-hint: <slug> [description de la page]
---

Crée la page `$1`.

Contexte : $ARGUMENTS

**Commence par trancher** la question suivante, et explique ton choix :

- **Le client doit pouvoir modifier le contenu** → il n'y a rien à coder. La page se crée dans
  l'administration Strapi (content-type « Page », avec son `slug`), et `src/pages/[slug].astro`
  la rend automatiquement via `BlockRenderer`. Explique la manipulation plutôt que d'ajouter
  un fichier. Si un bloc manque pour composer la page, propose `/new-block`.
- **La page a une structure particulière** (formulaire, page de contact avec carte, listing) →
  crée `src/pages/$1.astro`.

Si un fichier est nécessaire :

1. Enveloppe la page dans `BaseLayout`, jamais de `<head>` écrit à la main :
   ```astro
   <BaseLayout
     title="…"
     description="…"
     breadcrumbs={[{ name: 'Accueil', url: '/' }, { name: '…', url: '/$1' }]}
   >
   ```
2. Un seul `<h1>` par page.
3. Récupère d'éventuelles données via `src/lib/strapi.ts` (`getSingleType`, `getEntries`,
   `getEntryBySlug`) et gère explicitement le cas `null` — le site doit builder CMS éteint.
4. Pour une carte ou une vidéo, utilise `src/components/Embed.astro` et déclare le service
   correspondant dans `CookieConsent`. Jamais d'`<iframe>` directe.
5. Si la page ne doit pas être indexée (remerciement, aperçu), passe `noindex`.

Termine par `npm run typecheck`, et pense à ajouter le lien dans la navigation (single type
« Réglages du site » dans Strapi).
