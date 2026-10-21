import type {
	StrapiComponentSEO,
	StrapiContentComponents,
	StrapiContentHeroComponent,
} from "./components";
import type { StrapiMedia } from "./media";

// Page Types
export type StrapiPage = {
	id: number;
	documentId: string;
	title: string;
	slug: string;
	content?: Array<StrapiContentComponents>;
	seo?: StrapiComponentSEO;
	publishedAt: string;
	updatedAt: string;
};

export type StrapiHomepage = {
	id: number;
	documentId: string;
	title: string;
	hero?: StrapiContentHeroComponent;
	sections?: Array<StrapiContentComponents>;
	examples?: Array<StrapiContentComponents>;
	seo?: StrapiComponentSEO;
	publishedAt: string;
	updatedAt: string;
};

/**
 * Lien de navigation (composant `shared.nav-item`).
 * Utilisé par le menu principal et par les liens du pied de page.
 */
export type StrapiNavItem = {
	id: number;
	label: string;
	url: string;
	openInNewTab?: boolean;
};

/** Plateformes proposées par le composant `shared.social`. */
export type StrapiSocialPlatform =
	| "facebook"
	| "instagram"
	| "linkedin"
	| "x"
	| "youtube"
	| "tiktok";

export type StrapiSocialLink = {
	id: number;
	platform: StrapiSocialPlatform;
	url: string;
};

/** Composant `shared.footer`. */
export type StrapiFooter = {
	id: number;
	copyright?: string;
	links?: Array<StrapiNavItem>;
	socials?: Array<StrapiSocialLink>;
};

export type StrapiGlobal = {
	id: number;
	documentId: string;
	siteName: string;
	logo?: StrapiMedia;
	navigation?: Array<StrapiNavItem>;
	footer?: StrapiFooter;
	publishedAt: string;
	updatedAt: string;
};
