import Link from 'next/link';
import type { Metadata } from 'next';
import { getLiveOffers } from '@/lib/offers';
import { buildFacets } from '@/lib/filters';
import { activeContractGroups } from '@/lib/sources';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Les régions',
  description:
    'Les régions où des offres d’alternance en finance sont en ligne. La région est la ' +
    'bonne maille pour l’Île-de-France, où La Défense se trouve à Puteaux et à Courbevoie ' +
    'et non à Paris.',
};

export default async function RegionsPage() {
  const offers = await getLiveOffers();
  const { regions } = buildFacets(offers, activeContractGroups());

  return (
    <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Les régions</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Seules les régions portant au moins une offre sont listées. Pour la finance, c’est
        souvent la maille la plus utile : La Défense est administrativement à Puteaux et à
        Courbevoie, pas à Paris, et chercher « Paris » seul fait passer à côté.
      </p>

      {regions.length > 0 ? (
        <ul className="mt-7 flex flex-wrap gap-2">
          {regions.map((region) => (
            <li key={region.value}>
              <Link
                href={`/regions/${region.value}`}
                className="inline-block rounded-[20px] border border-line bg-card px-3.5 py-2 text-[13px] no-underline transition-all hover:border-line-hover hover:bg-card-hover"
              >
                {region.label} <span className="text-muted">{region.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-7 rounded-card border border-line bg-card p-6 text-muted">
          Aucune offre localisée en ligne pour le moment.
        </p>
      )}
    </main>
  );
}
