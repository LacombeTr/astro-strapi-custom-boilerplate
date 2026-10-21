# Icônes locales

Déposer ici les SVG propres au client (logo, pictogrammes sur mesure) : `astro-icon` les
expose sous leur nom de fichier.

```astro
<Icon name="logo-client" />   <!-- src/icons/logo-client.svg -->
```

Pour les icônes génériques, préférer les jeux Iconify déjà installés, qui ne nécessitent
aucun fichier : `<Icon name="lucide:phone" />`, `<Icon name="simple-icons:instagram" />`.

Les SVG sont inlinés au build : aucun JavaScript n'est envoyé au navigateur.
