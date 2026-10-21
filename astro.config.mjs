// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import { site } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
	// Domaine canonique : alimente les URLs du sitemap et <link rel="canonical">.
	// Valeur unique dans src/config/site.ts, renseignée par `npm run setup`.
	site: site.url,

	integrations: [
		react(),
		sitemap(),
		// Icônes Iconify inlinées en SVG au build : aucun JS envoyé au navigateur.
		icon({ include: { lucide: ['*'], 'simple-icons': ['*'] } }),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	// Site statique : chaque page est pré-rendue au build, le CMS n'est pas
	// interrogé à l'exécution. C'est ce qui donne les temps de réponse et le SEO.
	output: 'static',
});
