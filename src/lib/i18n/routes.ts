/**
 * Table des URL localisées.
 *
 * Pourquoi : « /es/estufas-de-pellets » se référence et se partage mieux que
 * « /es/shop ». Les moteurs de recherche traitent le segment d'URL comme un
 * signal, et un visiteur espagnol qui voit une URL anglaise doute du sérieux
 * de la boutique.
 *
 * Comment : l'arborescence physique de `src/app/[locale]/…` garde des noms
 * canoniques en anglais (un seul dossier par page, pas quatre), et le
 * proxy de Next réécrit l'URL localisée vers cette route canonique. La fonction
 * de correspondance est pure et testée dans `tests/routes.test.ts` : c'est la
 * pièce qui casserait silencieusement tout le maillage interne.
 */

import { locales, type Locale } from './config';

/** Routes statiques du site, nommées par leur dossier canonique. */
export const routeNames = [
  'home',
  'shop',
  'pellet',
  'bioethanol',
  'electricfire',
  'guides',
  'about',
  'contact',
  'faq',
  'sizing',
  'shipping',
  'returns',
  'terms',
  'privacy',
  'legal',
  'tracking',
  'cart',
  'checkout',
] as const;

export type RouteName = (typeof routeNames)[number];

/**
 * Segments canoniques (chemin réel des dossiers sous `src/app/[locale]`).
 * `''` est la page d'accueil.
 */
export const canonicalPaths: Record<RouteName, string> = {
  home: '',
  shop: 'shop',
  pellet: 'shop/pellet',
  bioethanol: 'shop/bioethanol',
  electricfire: 'shop/electricfire',
  guides: 'guides',
  about: 'about',
  contact: 'contact',
  faq: 'faq',
  sizing: 'sizing',
  shipping: 'shipping',
  returns: 'returns',
  terms: 'terms',
  privacy: 'privacy',
  legal: 'legal',
  tracking: 'tracking',
  cart: 'cart',
  checkout: 'checkout',
};

/**
 * Segments publics, par langue. Ce sont ces chemins que voient le visiteur,
 * les moteurs de recherche et les liens entrants.
 */
export const localizedPaths: Record<RouteName, Record<Locale, string>> = {
  home: { fr: '', en: '', nl: '', es: '' },
  shop: { fr: 'chauffage', en: 'heating', nl: 'verwarming', es: 'calefaccion' },
  pellet: {
    fr: 'chauffage/poele-a-granules',
    en: 'heating/pellet-stoves',
    nl: 'verwarming/pelletkachels',
    es: 'calefaccion/estufas-de-pellets',
  },
  bioethanol: {
    fr: 'chauffage/cheminee-bioethanol',
    en: 'heating/bioethanol-fireplaces',
    nl: 'verwarming/bio-ethanolhaarden',
    es: 'calefaccion/chimeneas-de-bioetanol',
  },
  electricfire: {
    fr: 'chauffage/cheminee-electrique',
    en: 'heating/electric-fireplaces',
    nl: 'verwarming/elektrische-haarden',
    es: 'calefaccion/chimeneas-electricas',
  },
  guides: { fr: 'guides', en: 'guides', nl: 'gidsen', es: 'guias' },
  about: { fr: 'a-propos', en: 'about', nl: 'over-ons', es: 'quienes-somos' },
  contact: { fr: 'contact', en: 'contact', nl: 'contact', es: 'contacto' },
  faq: { fr: 'faq', en: 'faq', nl: 'faq', es: 'faq' },
  sizing: {
    fr: 'calcul-puissance',
    en: 'power-calculator',
    nl: 'vermogen-berekenen',
    es: 'calculo-potencia',
  },
  shipping: { fr: 'livraison', en: 'delivery', nl: 'levering', es: 'envio' },
  returns: { fr: 'retours', en: 'returns', nl: 'retourneren', es: 'devoluciones' },
  terms: { fr: 'cgv', en: 'terms', nl: 'voorwaarden', es: 'condiciones' },
  privacy: {
    fr: 'confidentialite',
    en: 'privacy',
    nl: 'privacy',
    es: 'privacidad',
  },
  legal: {
    fr: 'mentions-legales',
    en: 'legal-notice',
    nl: 'juridische-informatie',
    es: 'aviso-legal',
  },
  tracking: { fr: 'suivi', en: 'tracking', nl: 'bestelling-volgen', es: 'seguimiento' },
  cart: { fr: 'panier', en: 'cart', nl: 'winkelwagen', es: 'carrito' },
  checkout: {
    fr: 'commande',
    en: 'checkout',
    nl: 'bestellen',
    es: 'pedido',
  },
};

/**
 * Routes dynamiques : le préfixe est localisé, le dernier segment est un slug
 * produit ou guide (lui-même localisé, cf. `catalog.ts`).
 */
export const dynamicPrefixes = {
  product: {
    canonical: 'shop/p',
    localized: {
      fr: 'chauffage/p',
      en: 'heating/p',
      nl: 'verwarming/p',
      es: 'calefaccion/p',
    },
  },
  guide: {
    canonical: 'guides',
    localized: { fr: 'guides', en: 'guides', nl: 'gidsen', es: 'guias' },
  },
} as const satisfies Record<string, { canonical: string; localized: Record<Locale, string> }>;

function join(locale: Locale, path: string): string {
  return path.length === 0 ? `/${locale}` : `/${locale}/${path}`;
}

/** URL publique d'une route statique. C'est la seule façon d'écrire un lien interne. */
export function href(route: RouteName, locale: Locale): string {
  return join(locale, localizedPaths[route][locale]);
}

/** URL publique d'une fiche produit, à partir de son slug déjà localisé. */
export function productHref(slug: string, locale: Locale): string {
  return join(locale, `${dynamicPrefixes.product.localized[locale]}/${slug}`);
}

/** URL publique d'un guide, à partir de son slug déjà localisé. */
export function guideHref(slug: string, locale: Locale): string {
  return join(locale, `${dynamicPrefixes.guide.localized[locale]}/${slug}`);
}

/**
 * Traduit un chemin public en chemin canonique, pour la réécriture faite par
 * le proxy. Renvoie `null` quand aucune traduction n'est nécessaire, afin que
 * le proxy laisse passer la requête sans la réécrire.
 *
 * On compare les préfixes du plus long au plus court : « poeles/hydro » doit
 * gagner contre « poeles », sinon la page catégorie avalerait ses enfants.
 */
export function toCanonicalPath(locale: Locale, publicPath: string): string | null {
  const normalized = publicPath.replace(/^\/+|\/+$/g, '');

  const staticEntries = routeNames
    .map((name) => ({ name, from: localizedPaths[name][locale], to: canonicalPaths[name] }))
    .filter((entry) => entry.from.length > 0)
    .sort((a, b) => b.from.length - a.from.length);

  for (const entry of staticEntries) {
    if (normalized === entry.from) {
      return entry.to === entry.from ? null : `/${locale}/${entry.to}`;
    }
  }

  const dynamicEntries = Object.values(dynamicPrefixes)
    .map((entry) => ({ from: entry.localized[locale], to: entry.canonical }))
    .sort((a, b) => b.from.length - a.from.length);

  for (const entry of dynamicEntries) {
    if (normalized.startsWith(`${entry.from}/`)) {
      const rest = normalized.slice(entry.from.length + 1);
      if (rest.length === 0 || rest.includes('/')) continue;
      if (entry.to === entry.from) return null;
      return `/${locale}/${entry.to}/${rest}`;
    }
  }

  return null;
}

/**
 * Traduit un chemin CANONIQUE en chemin public localisé, ou renvoie `null`
 * quand les deux coïncident.
 *
 * Sert à rediriger : sans cela, « /fr/shop/hydro » et « /fr/poeles/hydro »
 * servent tous deux la même page. La balise `canonical` limite les dégâts,
 * mais deux URL pour une page gaspillent le budget de crawl et diluent les
 * liens entrants. Mieux vaut une redirection permanente.
 */
export function toLocalizedPath(locale: Locale, canonicalPath: string): string | null {
  const normalized = canonicalPath.replace(/^\/+|\/+$/g, '');
  if (normalized.length === 0) return null;

  const staticEntries = routeNames
    .map((name) => ({ from: canonicalPaths[name], to: localizedPaths[name][locale] }))
    .filter((entry) => entry.from.length > 0)
    .sort((a, b) => b.from.length - a.from.length);

  for (const entry of staticEntries) {
    if (normalized === entry.from) {
      return entry.to === entry.from ? null : `/${locale}/${entry.to}`;
    }
  }

  const dynamicEntries = Object.values(dynamicPrefixes)
    .map((entry) => ({ from: entry.canonical, to: entry.localized[locale] }))
    .sort((a, b) => b.from.length - a.from.length);

  for (const entry of dynamicEntries) {
    if (normalized.startsWith(`${entry.from}/`)) {
      const rest = normalized.slice(entry.from.length + 1);
      if (rest.length === 0 || rest.includes('/')) continue;
      if (entry.to === entry.from) return null;
      return `/${locale}/${entry.to}/${rest}`;
    }
  }

  return null;
}

/**
 * Liste des couples (langue, chemin public) d'une même route : alimente les
 * balises `hreflang` et le sélecteur de langue, qui doit emmener le visiteur
 * sur la page équivalente et non sur l'accueil.
 */
export function alternatesFor(route: RouteName): Record<Locale, string> {
  return Object.fromEntries(locales.map((l) => [l, href(route, l)])) as Record<Locale, string>;
}
