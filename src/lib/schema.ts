/**
 * Constructeurs JSON-LD typés (schema-dts) pour les besoins d'un site vitrine.
 *
 * Pourquoi des helpers plutôt que du JSON-LD écrit à la main dans les pages : les erreurs de
 * structured data sont silencieuses — Google ignore un bloc invalide sans rien signaler.
 * `schema-dts` les transforme en erreurs de compilation.
 */
import type {
  BreadcrumbList,
  LocalBusiness,
  Organization,
  Thing,
  WebSite,
  WithContext,
} from 'schema-dts';

import { site, absoluteUrl } from '../config/site';

/** Ajoute le @context attendu par les moteurs. */
const withContext = <T extends Thing>(node: T): WithContext<T> =>
  Object.assign({ '@context': 'https://schema.org' as const }, node) as WithContext<T>;

/**
 * Identité de l'entreprise. Émettre **une seule fois** par page, idéalement dans le layout.
 * Le type (`LocalBusiness` ou `Organization`) vient de `site.schemaType` : `LocalBusiness`
 * n'est valide que si l'entreprise reçoit du public à une adresse physique.
 */
export const organizationSchema = (): WithContext<Organization | LocalBusiness> => {
  const { contact, legal } = site;
  const address = contact.address;

  const node = {
    '@type': site.schemaType,
    '@id': absoluteUrl('/#organization'),
    name: site.name,
    url: site.url,
    description: site.description,
    image: absoluteUrl(site.ogImage),
    ...(legal.companyName && !legal.companyName.startsWith('[')
      ? { legalName: legal.companyName }
      : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(address?.city
      ? {
          address: {
            '@type': 'PostalAddress' as const,
            ...(address.street ? { streetAddress: address.street } : {}),
            ...(address.postalCode ? { postalCode: address.postalCode } : {}),
            addressLocality: address.city,
            ...(address.country ? { addressCountry: address.country } : {}),
          },
        }
      : {}),
    ...(Object.keys(site.socials).length
      ? { sameAs: Object.values(site.socials).filter(Boolean) as string[] }
      : {}),
  };

  return withContext(node as Organization | LocalBusiness);
};

/** Déclare le site lui-même et le relie à l'organisation. */
export const webSiteSchema = (): WithContext<WebSite> =>
  withContext({
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: site.name,
    url: site.url,
    inLanguage: site.locale,
    publisher: { '@id': absoluteUrl('/#organization') },
  });

export type Crumb = { name: string; url: string };

/**
 * Fil d'Ariane. À n'émettre que sur les pages profondes : sur l'accueil il n'apporte rien.
 * Inclure la page courante en dernier élément.
 */
export const breadcrumbSchema = (crumbs: Crumb[]): WithContext<BreadcrumbList> =>
  withContext({
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  });
