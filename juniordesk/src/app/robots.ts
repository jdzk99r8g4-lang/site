import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

/**
 * Indexation fermée par défaut.
 *
 * Tant que les mentions légales portent une identité juridique réelle et que
 * la durée de conservation des journaux de l'hébergeur a été confirmée, le
 * site ne doit pas être indexé : une page légale incomplète référencée est
 * pire qu'une page absente.
 *
 * `/go/` est toujours interdit : ce sont des redirections, pas du contenu, et
 * les laisser explorer gonflerait les compteurs de clics avec du passage de
 * robots.
 */
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  if (!allowIndexing) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/go/', '/api/', '/alertes/confirmation', '/alertes/desinscription'],
      },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
