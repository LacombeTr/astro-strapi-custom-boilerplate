import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { generateCollections } from '@sensinum/astro-strapi-loader';

/**
 * Requêtes Strapi et déclaration des collections Astro.
 *
 * Règle d'or : les paramètres REST sont des **objets JavaScript**. Le loader les sérialise
 * avec `qs.stringify`. Ne jamais écrire de query string à la main ni passer par
 * `JSON.stringify` — les populate imbriqués seraient mal encodés.
 *
 * Chaque champ média ou composant doit apparaître dans `populate`, sinon l'API renvoie la
 * relation vide et le rendu perd silencieusement l'image ou le bloc.
 */

/** Composants autorisés dans les dynamic zones — doit refléter les schémas de `backend/`. */
const BLOCK_COMPONENTS = [
	'blocks.hero',
	'blocks.text',
	'blocks.quote',
	'blocks.media',
	'blocks.cta',
] as const;

/**
 * Pour une dynamic zone, `on` cible chaque composant par son UID exact et décrit ses
 * propres populate. Un composant absent de cette map est renvoyé sans ses médias.
 */
const blocksPopulate = {
	on: {
		'blocks.hero': { populate: ['background', 'cta'] },
		'blocks.text': { populate: '*' },
		'blocks.quote': { populate: '*' },
		'blocks.media': { populate: ['media'] },
		'blocks.cta': { populate: ['cta', 'shields'] },
	},
} satisfies Record<string, unknown>;

/** Fragment réutilisé par tous les content-types qui portent des métadonnées SEO. */
const seoPopulate = { populate: ['ogImage'] } as const;

export const homepageQuery = {
	populate: {
		hero: { populate: ['background', 'cta'] },
		sections: blocksPopulate,
		examples: blocksPopulate,
		seo: seoPopulate,
	},
};

export const globalQuery = {
	populate: {
		logo: true,
		navigation: true,
		// `footer` est un composant contenant lui-même deux composants répétables :
		// sans ce populate imbriqué, liens et réseaux sociaux reviennent vides.
		footer: { populate: ['links', 'socials'] },
	},
};

export const pagesQuery = {
	populate: {
		content: blocksPopulate,
		seo: seoPopulate,
	},
};

/**
 * Collections générées par introspection des schémas Strapi.
 *
 * Le `try/catch` est délibéré : il permet de travailler sur le front avec le CMS éteint, et
 * évite qu'une indisponibilité de Strapi casse un build de production. Les pages doivent donc
 * **toujours** gérer un contenu absent (voir `src/lib/strapi.ts`).
 */
let strapiCollections: Record<string, unknown> = {};

try {
	strapiCollections = await generateCollections(
		{
			url: import.meta.env.STRAPI_URL || 'http://localhost:1337',
			token: import.meta.env.STRAPI_TOKEN || '',
		},
		[
			{ name: 'homepage', query: homepageQuery },
			{ name: 'global', query: globalQuery },
			{ name: 'pages', query: pagesQuery },
		],
	);
} catch (error) {
	const reason = error instanceof Error ? error.message : String(error);
	console.warn(
		`[strapi] CMS injoignable (${reason}).\n` +
			'         Le site se construit avec le contenu de repli.\n' +
			'         Vérifiez STRAPI_URL / STRAPI_TOKEN dans .env, ou lancez « npm run dev:cms ».',
	);
}

/**
 * Pages légales, en Markdown versionné plutôt que dans le CMS.
 *
 * Pourquoi pas Strapi : ces textes engagent juridiquement, changent rarement, et doivent
 * suivre les revues de code. Les garder dans le dépôt évite qu'ils soient modifiés sans
 * relecture, et garantit qu'ils existent même avant que le CMS ne soit configuré.
 */
const legal = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		/** Ordre d'affichage dans le pied de page. */
		order: z.number().default(99),
	}),
});

export const collections = {
	...strapiCollections,
	legal,
};

export { BLOCK_COMPONENTS };
