import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';
import { getLiveOffers } from '@/lib/offers';
import { cityIndex } from '@/lib/geo';
import { JOB_FAMILIES } from '@/lib/taxonomy';

export const revalidate = 3600;

/**
 * Plan du site.
 *
 * Deux règles : on n'y met que des pages qui existent réellement et portent du
 * contenu, et jamais une page de ville vide. Déclarer des URL creuses est le
 * moyen le plus rapide de se faire déclasser.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const offers = await getLiveOffers();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: brand.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${brand.url}/offres`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${brand.url}/metiers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${brand.url}/villes`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${brand.url}/alertes`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${brand.url}/sources`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${brand.url}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${brand.url}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
  ];

  // Une famille de métier sans offre n'entre pas dans le plan du site.
  const populatedFamilies = new Set(offers.flatMap((o) => o.families));
  const familyPages: MetadataRoute.Sitemap = JOB_FAMILIES.filter((f) =>
    populatedFamilies.has(f.slug),
  ).map((family) => ({
    url: `${brand.url}/metiers/${family.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = cityIndex(offers.map((o) => o.place)).map((city) => ({
    url: `${brand.url}/villes/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  const offerPages: MetadataRoute.Sitemap = offers.map((offer) => ({
    url: `${brand.url}/offres/${offer.slug}`,
    lastModified: new Date(offer.collectedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...familyPages, ...cityPages, ...offerPages];
}
