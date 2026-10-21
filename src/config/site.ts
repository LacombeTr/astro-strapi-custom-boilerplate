/**
 * Source unique de vérité pour l'identité du site.
 *
 * Renseigné par `npm run setup` (scripts/init-project.mjs). Lu par :
 *  - `astro.config.mjs`      → `site` (canoniques + sitemap)
 *  - `src/components/Seo.astro`
 *  - `src/lib/schema.ts`     → JSON-LD
 *  - `src/content/legal/*`   → mentions légales
 *
 * Ne pas y mettre de secret : ce fichier est inclus dans le bundle client.
 */

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'youtube'
  | 'tiktok';

export type SiteConfig = {
  /** Nom commercial, utilisé dans les titres et le JSON-LD. */
  name: string;
  /** URL canonique de production, sans slash final. */
  url: string;
  /** Code de langue BCP 47, ex. "fr-FR". */
  locale: string;
  /** Description par défaut, utilisée quand une page n'en fournit pas. */
  description: string;
  /** Suffixe ajouté aux titres de page. Vide = pas de suffixe. */
  titleSuffix: string;
  /** Image de partage par défaut, chemin absolu depuis /public. */
  ogImage: string;
  contact: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
  };
  socials: Partial<Record<SocialPlatform, string>>;
  /**
   * Services tiers réellement utilisés sur le site. Ils déterminent le contenu du bandeau
   * de consentement : tout à `false` (et `PUBLIC_GA_ID` vide) signifie aucun cookie, donc
   * aucun bandeau. N'activer que ce qui est effectivement intégré.
   */
  thirdParty: {
    googlemaps: boolean;
    youtube: boolean;
  };
  /**
   * Type d'entité pour le JSON-LD. `LocalBusiness` convient aux commerces et
   * professions avec une adresse physique ; `Organization` au reste.
   */
  schemaType: 'LocalBusiness' | 'Organization';
  /** Mentions légales — voir aussi src/content/legal/. */
  legal: {
    companyName: string;
    legalForm: string;
    siret: string;
    publisher: string;
    host: { name: string; address: string };
  };
};

export const site: SiteConfig = {
  name: 'Mon site vitrine',
  url: 'http://localhost:4321',
  locale: 'fr-FR',
  description:
    'Site vitrine construit avec Astro et Strapi. Lancez `npm run setup` pour renseigner ces informations.',
  titleSuffix: '',
  ogImage: '/og-image.png',
  contact: {},
  socials: {},
  thirdParty: {
    googlemaps: false,
    youtube: false,
  },
  schemaType: 'Organization',
  legal: {
    companyName: '[À COMPLÉTER]',
    legalForm: '[À COMPLÉTER]',
    siret: '[À COMPLÉTER]',
    publisher: '[À COMPLÉTER]',
    host: { name: '[À COMPLÉTER]', address: '[À COMPLÉTER]' },
  },
};

/** Langue courte ("fr") dérivée de la locale, pour l'attribut lang de <html>. */
export const lang = site.locale.split('-')[0];

/** Construit une URL absolue à partir d'un chemin relatif. */
export const absoluteUrl = (path: string) =>
  new URL(path, site.url).href;
