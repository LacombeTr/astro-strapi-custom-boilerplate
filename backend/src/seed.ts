/**
 * Amorçage du CMS au premier démarrage.
 *
 * Objectif : après `npm install && npm run dev`, le site doit s'afficher avec du vrai contenu
 * venant de Strapi, sans aucune manipulation dans l'admin. Trois choses sont automatisées :
 *
 *  1. le contenu minimal (accueil, réglages du site, une page d'exemple) ;
 *  2. un token API en lecture seule, avec les permissions exactes dont le loader Astro a besoin ;
 *  3. l'écriture de ce token dans le `.env` **racine**, étape manuelle la plus pénible à
 *     refaire pour chaque client.
 *
 * Idempotent : ne fait rien si la base contient déjà la page d'accueil.
 * `SEED_FORCE=true` force le recalcul du token et des permissions (sans dupliquer le contenu).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Core } from '@strapi/strapi';

const TOKEN_NAME = 'Astro (lecture seule)';

/**
 * Le `.env` du front est à la racine du monorepo. `npm --prefix backend run develop` place le
 * cwd dans `backend/`, donc la racine est son parent. On vérifie la présence du package.json
 * racine avant d'écrire, pour ne jamais toucher un fichier au hasard.
 */
async function findRootEnv(): Promise<string | null> {
  const root = resolve(process.cwd(), '..');
  try {
    const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
    if (typeof pkg.scripts?.['dev:cms'] !== 'string') return null;
    return resolve(root, '.env');
  } catch {
    return null;
  }
}

/** Écrit (ou remplace) STRAPI_TOKEN dans le .env racine sans perdre les autres variables. */
async function writeTokenToEnv(strapi: Core.Strapi, token: string): Promise<boolean> {
  const envPath = await findRootEnv();
  if (!envPath) {
    strapi.log.warn('[seed] .env racine introuvable — copiez le token manuellement.');
    return false;
  }

  let content = '';
  try {
    content = await readFile(envPath, 'utf8');
  } catch {
    content = 'STRAPI_URL=http://localhost:1337\n';
  }

  const line = `STRAPI_TOKEN=${token}`;
  content = /^STRAPI_TOKEN=.*$/m.test(content)
    ? content.replace(/^STRAPI_TOKEN=.*$/m, line)
    : `${content.replace(/\n*$/, '')}\n${line}\n`;

  await writeFile(envPath, content);
  strapi.log.info(`[seed] STRAPI_TOKEN écrit dans ${envPath}`);
  return true;
}

/**
 * Permissions minimales du token, déduites du registre d'actions plutôt qu'écrites en dur :
 * les noms d'actions changent entre versions de Strapi, le registre est la source de vérité.
 *
 * Deux familles sont nécessaires :
 *  - `find` / `findOne` sur nos content-types → lecture du contenu ;
 *  - `plugin::content-type-builder.*` → le loader Astro introspecte les schémas pour générer
 *    ses validateurs Zod. Sans ça, `generateCollections` échoue.
 */
function collectReadPermissions(strapi: Core.Strapi): string[] {
  const actionsMap = strapi.contentAPI.permissions.getActionsMap() as Record<
    string,
    { controllers: Record<string, string[]> }
  >;

  const ours = new Set(['api::page', 'api::homepage', 'api::global']);
  const permissions: string[] = [];

  for (const [api, { controllers }] of Object.entries(actionsMap)) {
    const isOurs = ours.has(api);
    const isSchemaIntrospection = api === 'plugin::content-type-builder';
    if (!isOurs && !isSchemaIntrospection) continue;

    for (const [controller, actions] of Object.entries(controllers)) {
      for (const action of actions) {
        if (isOurs && !['find', 'findOne'].includes(action)) continue;
        permissions.push(`${api}.${controller}.${action}`);
      }
    }
  }

  return permissions;
}

/** Crée le token s'il n'existe pas. Le secret n'est lisible qu'à la création. */
async function ensureApiToken(strapi: Core.Strapi): Promise<void> {
  const service = strapi.service('admin::api-token');
  const existing = await service.getByName(TOKEN_NAME);

  if (existing && process.env.SEED_FORCE !== 'true') {
    strapi.log.info(`[seed] token « ${TOKEN_NAME} » déjà présent — conservé.`);
    return;
  }

  // Le secret d'un token existant est irrécupérable : on le remplace pour pouvoir l'écrire.
  if (existing) await service.revoke(existing.id);

  const permissions = collectReadPermissions(strapi);
  const token = await service.create({
    name: TOKEN_NAME,
    description:
      'Généré automatiquement pour le front Astro. Lecture du contenu + introspection des schémas.',
    type: 'custom',
    lifespan: null,
    permissions,
  });

  strapi.log.info(`[seed] token créé avec ${permissions.length} permission(s) en lecture.`);

  const written = await writeTokenToEnv(strapi, token.accessKey);
  if (!written) {
    strapi.log.warn(`[seed] STRAPI_TOKEN=${token.accessKey}`);
  }
}

/** Contenu de départ : volontairement sobre, il sert de démonstration de structure. */
async function seedContent(strapi: Core.Strapi): Promise<void> {
  /**
   * Un champ `blocks` attend des types littéraux (`'paragraph'`, `'text'`), pas `string` :
   * sans `as const`, TypeScript élargit et le type ne correspond plus à `RootNode[]`.
   */
  const paragraph = (text: string) => [
    { type: 'paragraph' as const, children: [{ type: 'text' as const, text }] },
  ];

  const homepage = await strapi.documents('api::homepage.homepage').findFirst();
  if (homepage) {
    strapi.log.info('[seed] contenu déjà présent — amorçage du contenu ignoré.');
    return;
  }

  await strapi.documents('api::homepage.homepage').create({
    status: 'published',
    data: {
      title: 'Bienvenue',
      hero: {
        title: 'Votre nouveau site vitrine',
        subtitle: 'Rapide, bien référencé, et modifiable sans toucher au code.',
        content: paragraph(
          'Ce contenu vient de Strapi. Modifiez-le dans l’administration : la page se régénère au build.',
        ),
        cta: { label: 'Nous contacter', url: '/contact' },
      },
      sections: [
        {
          __component: 'blocks.text',
          title: 'À propos',
          content: paragraph(
            'Décrivez ici votre activité. Ce bloc de texte riche accepte titres, listes et liens.',
          ),
        },
      ],
      seo: {
        metaTitle: 'Votre nouveau site vitrine',
        metaDescription:
          'Site vitrine rapide et bien référencé, construit avec Astro et Strapi.',
      },
    },
  });

  await strapi.documents('api::global.global').create({
    data: {
      siteName: 'Mon site vitrine',
      navigation: [
        { label: 'Accueil', url: '/' },
        { label: 'Contact', url: '/contact' },
      ],
      footer: {
        copyright: `© ${new Date().getFullYear()} Mon site vitrine`,
        links: [
          { label: 'Mentions légales', url: '/mentions-legales' },
          { label: 'Politique de confidentialité', url: '/politique-de-confidentialite' },
        ],
      },
    },
  });

  await strapi.documents('api::page.page').create({
    status: 'published',
    data: {
      title: 'Contact',
      slug: 'contact',
      content: [
        {
          __component: 'blocks.text',
          title: 'Nous contacter',
          content: paragraph('Ajoutez ici vos coordonnées, ou un formulaire de contact.'),
        },
      ],
      seo: {
        metaTitle: 'Contact',
        metaDescription: 'Contactez-nous pour toute demande d’information.',
      },
    },
  });

  strapi.log.info('[seed] accueil, réglages du site et page « contact » créés.');
}

export default async function seed({ strapi }: { strapi: Core.Strapi }): Promise<void> {
  try {
    await seedContent(strapi);
    await ensureApiToken(strapi);
  } catch (error) {
    // Un échec d'amorçage ne doit jamais empêcher le CMS de démarrer.
    strapi.log.error('[seed] échec de l’amorçage — le CMS démarre quand même.');
    strapi.log.error(error instanceof Error ? error.message : String(error));
  }
}
