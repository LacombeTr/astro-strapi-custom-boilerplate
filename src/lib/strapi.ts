/**
 * Accès typé aux collections générées par @sensinum/astro-strapi-loader.
 *
 * Pourquoi cette couche : le loader crée les collections dynamiquement à partir des schémas
 * Strapi, donc `astro:content` ne connaît pas leurs noms à la compilation et chaque appel
 * exigerait un `@ts-ignore`. On concentre ici l'unique endroit non typé, avec une signature
 * explicite en sortie, plutôt que d'éparpiller les `any` dans les pages.
 *
 * Toutes ces fonctions **rattrapent** leurs erreurs : si Strapi est éteint ou si le token est
 * absent, elles renvoient `null` / `[]` et le site se construit avec un contenu de repli.
 * C'est ce qui permet de travailler sur le front sans lancer le CMS.
 */
import { getCollection } from 'astro:content';

type LoaderEntry<T> = { id: string; data: T };

/**
 * Normalise l'absence de collection (CMS injoignable) en tableau vide.
 *
 * Le double passage par `unknown` est nécessaire : quand Strapi est hors ligne, les
 * collections générées n'existent pas et TypeScript ne connaît plus que les collections
 * locales. La forme inférée ne recoupe alors pas `LoaderEntry<T>`, et un cast direct est
 * refusé — alors que le code doit justement fonctionner dans les deux cas.
 */
async function safeCollection<T>(name: string): Promise<LoaderEntry<T>[]> {
  try {
    // @ts-expect-error — nom de collection résolu à l'exécution par le loader Strapi.
    const entries = await getCollection(name);
    return ((entries ?? []) as unknown) as LoaderEntry<T>[];
  } catch {
    return [];
  }
}

/**
 * Récupère un single type Strapi.
 *
 * Le loader expose les single types comme une collection d'une seule entrée : on déballe
 * `[0].data` ici une fois pour toutes.
 */
export async function getSingleType<T>(name: string): Promise<T | null> {
  const entries = await safeCollection<T>(name);
  return entries[0]?.data ?? null;
}

/** Récupère toutes les entrées d'une collection Strapi. */
export async function getEntries<T>(name: string): Promise<T[]> {
  const entries = await safeCollection<T>(name);
  return entries.map((entry) => entry.data);
}

/**
 * Récupère une entrée par son champ `slug`.
 * Renvoie `null` si la collection est vide ou si aucun slug ne correspond.
 */
export async function getEntryBySlug<T extends { slug: string }>(
  name: string,
  slug: string,
): Promise<T | null> {
  const entries = await getEntries<T>(name);
  return entries.find((entry) => entry.slug === slug) ?? null;
}
