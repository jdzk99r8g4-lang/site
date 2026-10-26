import type { MetadataRoute } from 'next';
import { products } from '@/lib/catalog';
import { guides } from '@/lib/guides';
import { brand } from '@/lib/brand';
import { locales, type Locale } from '@/lib/i18n/config';
import { guideHref, href, productHref, routeNames, type RouteName } from '@/lib/i18n/routes';

/**
 * Plan du site, les quatre langues comprises.
 *
 * Chaque entrée porte ses `alternates.languages` : c'est la forme que les
 * moteurs attendent pour comprendre que quatre URL sont quatre traductions
 * d'une même page, et non quatre pages concurrentes sur les mêmes mots-clés.
 */

/** Pages exclues : un panier et une confirmation de commande n'ont rien à indexer. */
const excluded: readonly RouteName[] = ['cart', 'checkout', 'tracking'];

type Entry = MetadataRoute.Sitemap[number];

function alternatesFor(paths: Record<Locale, string>): Entry['alternates'] {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${brand.url}${paths[locale]}`]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: Entry[] = [];

  const priorities: Partial<Record<RouteName, number>> = {
    home: 1,
    shop: 0.9,
    // Les familles portent l'essentiel de la recherche. Les granulés d'abord :
    // c'est la seule des trois dont les fiches viennent de la documentation du
    // fabricant, et le seul vrai appareil de chauffage du catalogue.
    pellet: 0.9,
    bioethanol: 0.8,
    electricfire: 0.8,
    sizing: 0.8,
    guides: 0.7,
    faq: 0.6,
    shipping: 0.5,
    returns: 0.5,
    about: 0.5,
    contact: 0.5,
    terms: 0.3,
    privacy: 0.3,
    legal: 0.2,
  };

  for (const route of routeNames) {
    if (excluded.includes(route)) continue;

    const paths = Object.fromEntries(locales.map((l) => [l, href(route, l)])) as Record<Locale, string>;
    for (const locale of locales) {
      entries.push({
        url: `${brand.url}${paths[locale]}`,
        lastModified: now,
        changeFrequency: route === 'home' || route === 'shop' ? 'weekly' : 'monthly',
        priority: priorities[route] ?? 0.4,
        alternates: alternatesFor(paths),
      });
    }
  }

  for (const product of products) {
    const paths = Object.fromEntries(
      locales.map((l) => [l, productHref(product.slug[l], l)]),
    ) as Record<Locale, string>;

    for (const locale of locales) {
      entries.push({
        url: `${brand.url}${paths[locale]}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: alternatesFor(paths),
      });
    }
  }

  for (const guide of guides) {
    const paths = Object.fromEntries(
      locales.map((l) => [l, guideHref(guide.slug[l], l)]),
    ) as Record<Locale, string>;

    for (const locale of locales) {
      entries.push({
        url: `${brand.url}${paths[locale]}`,
        lastModified: new Date(guide.updated),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: alternatesFor(paths),
      });
    }
  }

  return entries;
}
