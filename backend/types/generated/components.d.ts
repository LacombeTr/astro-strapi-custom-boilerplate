import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCta extends Struct.ComponentSchema {
  collectionName: 'components_blocks_ctas';
  info: {
    description: 'Section de conversion : titre, description et bouton';
    displayName: "Appel \u00E0 l'action";
    icon: 'bell';
  };
  attributes: {
    classes: Schema.Attribute.String;
    cta: Schema.Attribute.Component<'shared.cta', false> &
      Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    shields: Schema.Attribute.Component<'shared.shield', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heroes';
  info: {
    description: "Bandeau principal : titre, accroche et appel \u00E0 l'action";
    displayName: 'Hero';
    icon: 'crown';
  };
  attributes: {
    background: Schema.Attribute.Media<'images'>;
    content: Schema.Attribute.Blocks;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksMedia extends Struct.ComponentSchema {
  collectionName: 'components_blocks_medias';
  info: {
    description: 'Image avec l\u00E9gende optionnelle';
    displayName: 'M\u00E9dia';
    icon: 'picture';
  };
  attributes: {
    caption: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images' | 'videos'> &
      Schema.Attribute.Required;
  };
}

export interface BlocksQuote extends Struct.ComponentSchema {
  collectionName: 'components_blocks_quotes';
  info: {
    description: 'T\u00E9moignage ou citation attribu\u00E9e';
    displayName: 'Citation';
    icon: 'quote';
  };
  attributes: {
    author: Schema.Attribute.String;
    quote: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BlocksText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_texts';
  info: {
    description: 'Bloc de texte riche';
    displayName: 'Texte';
    icon: 'align-left';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_ctas';
  info: {
    description: "Bouton d'appel \u00E0 l'action";
    displayName: 'CTA';
    icon: 'cursor';
  };
  attributes: {
    color: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFooter extends Struct.ComponentSchema {
  collectionName: 'components_shared_footers';
  info: {
    displayName: 'Pied de page';
    icon: 'layout';
  };
  attributes: {
    copyright: Schema.Attribute.String;
    links: Schema.Attribute.Component<'shared.nav-item', true>;
    socials: Schema.Attribute.Component<'shared.social', true>;
  };
}

export interface SharedNavItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_items';
  info: {
    displayName: 'Lien de navigation';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    openInNewTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'M\u00E9tadonn\u00E9es de r\u00E9f\u00E9rencement de la page';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedShield extends Struct.ComponentSchema {
  collectionName: 'components_shared_shields';
  info: {
    description: 'Badge ou lien secondaire affich\u00E9 sous un CTA';
    displayName: 'Shield';
    icon: 'shield';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_socials';
  info: {
    displayName: 'R\u00E9seau social';
    icon: 'earth';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.cta': BlocksCta;
      'blocks.hero': BlocksHero;
      'blocks.media': BlocksMedia;
      'blocks.quote': BlocksQuote;
      'blocks.text': BlocksText;
      'shared.cta': SharedCta;
      'shared.footer': SharedFooter;
      'shared.nav-item': SharedNavItem;
      'shared.seo': SharedSeo;
      'shared.shield': SharedShield;
      'shared.social': SharedSocial;
    }
  }
}
