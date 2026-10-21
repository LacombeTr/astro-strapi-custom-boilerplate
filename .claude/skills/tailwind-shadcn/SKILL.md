---
name: tailwind-shadcn
description: >-
  Tailwind CSS 4 et composants shadcn dans ce dépôt : tokens de global.css, échelles de marque
  générées en OKLCH, cn(), îlots React et quand les éviter, astro-icon. À utiliser pour styler
  un composant, ajouter une primitive shadcn, ou modifier le thème et le mode sombre.
---

# Tailwind CSS 4 et composants d'interface

## Tailwind v4

Appliqué via `@tailwindcss/vite` dans `astro.config.mjs` : **il n'y a pas de
`tailwind.config.js`**. Toute la configuration est en CSS, dans `src/styles/global.css` :
`@import 'tailwindcss'`, blocs `@theme`, et variables shadcn.

Préférer les utilitaires et les **tokens existants** plutôt que des valeurs littérales.
Étendre les tokens dans `@theme` quand un besoin est transversal.

## Tokens de couleur

Deux échelles de marque, générées en OKLCH par `npm run setup` depuis deux couleurs
saisies : `--color-brand-*` (principale) et `--color-violet-*` (accent), de 25 à 950.

OKLCH est utilisé parce qu'il est perceptuellement uniforme : faire varier la seule luminosité
y produit une échelle régulière, ce qu'un éclaircissement en RGB ne donne pas. La chroma suit
une sinusoïde de la luminosité — à saturation constante, les paliers clairs sortiraient du
gamut sRGB et le navigateur les rabattrait sur des teintes criardes.

**Utiliser les tokens sémantiques** (`text-foreground`, `bg-card`, `border-border`,
`bg-muted`…) et non les échelles brutes : c'est ce qui fait fonctionner le mode sombre
automatiquement. Une couleur écrite en dur sera illisible dans l'un des deux thèmes.

## Mode sombre

Classe `dark` sur `<html>`, appliquée par un script `is:inline` dans `BaseLayout` **avant** le
premier rendu — un script bundlé serait différé et provoquerait un flash de thème incorrect.
Le choix est mémorisé en `localStorage`, avec repli sur la préférence système.
Les accès à `localStorage` sont dans un `try/catch` : ils lèvent en navigation privée.

## Icônes

`astro-icon` avec les jeux `lucide` et `simple-icons` : `<Icon name="lucide:menu" />`. Les SVG
sont inlinés au build, **aucun JavaScript n'est envoyé**. Ne pas ajouter `react-icons`, qui
imposerait un îlot React pour afficher une icône.

## shadcn et React

Les primitives sont dans `src/components/ui/`, configurées par `components.json` (style New
York, `src/styles/global.css`). Ajout via la CLI : `npx shadcn@latest add dialog`.

Pour le fusionnement de classes en React : `cn()` depuis `@/lib/utils`. En Astro, utiliser
`class:list`, déjà fourni par le framework.

**Quand utiliser un îlot React :** uniquement pour une interactivité réelle (formulaire
complexe, combobox, carrousel avec état). Beaucoup de composants supposés interactifs s'en
passent : un menu dépliant se fait avec `<details>`, des onglets avec des ancres, un
accordéon avec `<details>`. Chaque `client:*` ajouté est du JavaScript sur un site dont
l'argument principal est de ne pas en charger.

## Animations

`src/scripts/animations.ts`, API **vanilla** de `motion` (`animate`, `inView`, `stagger`).
Markup : `data-reveal` sur un élément, `data-stagger` sur un conteneur.

`prefers-reduced-motion` est respecté — ce n'est pas une préférence esthétique, les animations
peuvent déclencher des troubles vestibulaires. L'opacité n'est jamais mise à 0 en CSS : une
erreur JavaScript ne peut donc pas masquer le contenu.

`motion/react` reste disponible pour les îlots, mais ne justifie pas à lui seul d'en créer un.
