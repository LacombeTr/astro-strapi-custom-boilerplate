import type { Core } from '@strapi/strapi';

import seed from './seed';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Amorce la base au premier démarrage : contenu de départ, token API en lecture seule, et
   * écriture de ce token dans le .env racine. Voir `src/seed.ts`.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seed({ strapi });
  },
};
