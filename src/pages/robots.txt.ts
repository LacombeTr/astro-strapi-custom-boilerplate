/**
 * robots.txt généré au build plutôt que servi en fichier statique.
 *
 * Pourquoi : un robots.txt figé dans public/ contient un domaine en dur, et c'est une erreur
 * qu'on ne remarque qu'après la mise en ligne (sitemap pointant vers le domaine du site
 * précédent). Ici l'URL vient de `src/config/site.ts`, donc elle est juste par construction.
 */
import type { APIRoute } from 'astro';

import { site } from '../config/site';

export const GET: APIRoute = () => {
  /*
    En préproduction (domaine non renseigné ou localhost), on interdit toute indexation :
    un environnement de recette indexé crée du contenu dupliqué qui pénalise le site final.
  */
  const isProduction = site.url.startsWith('https://') && !site.url.includes('localhost');

  const body = isProduction
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', site.url).href}`,
        '',
      ].join('\n')
    : ['# Environnement hors production — indexation refusée.', 'User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
