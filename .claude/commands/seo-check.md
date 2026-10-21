---
description: Audite le SEO technique du site construit (balises, JSON-LD, sitemap, images, poids JS)
---

Audite le SEO technique de ce site. Construis d'abord (`npm run build:web`), puis analyse
`dist/` — c'est le HTML réellement servi qui compte, pas les sources.

Vérifie, et **rapporte uniquement les problèmes trouvés**, chacun avec le fichier concerné et
la correction à faire :

1. **Unicité et longueur** — un seul `<title>` et une seule `<meta name="description">` par
   page ; aucun titre dupliqué entre pages ; titre ≤ 60 caractères, description ≤ 160.
2. **Canoniques** — présentes sur toutes les pages, en absolu, sur le domaine de
   `src/config/site.ts` (pas `localhost`).
3. **Hiérarchie des titres** — exactement un `<h1>` par page, pas de niveau sauté.
4. **Images** — chaque `<img>` a un `alt` (vide seulement si décorative), `width` et `height`
   explicites ; les images hors écran ont `loading="lazy"`, l'image LCP non.
5. **JSON-LD** — présent, valide, un seul nœud par `@id`, et `schemaType` cohérent avec
   l'activité réelle (`LocalBusiness` suppose un accueil du public à une adresse).
6. **Sitemap et robots** — `dist/sitemap-index.xml` existe et liste les pages attendues ;
   `dist/robots.txt` pointe le bon domaine. En environnement hors production, il doit au
   contraire interdire l'indexation.
7. **Poids JavaScript** — liste les pages qui chargent du JS et pourquoi. Toute page sans
   interactivité ne devrait charger que le script d'animation. Signale tout `client:*`
   injustifié.
8. **Liens** — aucun lien interne cassé ; les liens externes en `target="_blank"` portent
   `rel="noopener noreferrer"`.
9. **Pages légales** — mentions légales, confidentialité et cookies accessibles depuis le
   pied de page, et sans marqueur `[À COMPLÉTER]` résiduel.

Classe les constats par impact décroissant. Si tout est conforme, dis-le clairement plutôt
que d'inventer des remarques.
