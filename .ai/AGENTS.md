# Déplacé

Le contexte pour les agents de ce dépôt vit maintenant dans :

- **[`CLAUDE.md`](../CLAUDE.md)** — stack, commandes, règles du dépôt
- **[`AGENTS.md`](../AGENTS.md)** — même contenu condensé, pour les outils qui ne lisent pas
  `CLAUDE.md`
- **[`.claude/skills/`](../.claude/skills/)** — un `SKILL.md` par domaine

Les skills *loader* et *blocks*, qui n'étaient que des liens vers GitHub, sont désormais
**vendorés** dans `.claude/skills/` : leur contenu est disponible hors ligne et une note
indique la version du paquet à laquelle il correspond. `npm run skills:refresh` les
re-télécharge après une montée de version.

Ce dossier est conservé pour ne pas casser de liens existants ; il n'est plus mis à jour.
