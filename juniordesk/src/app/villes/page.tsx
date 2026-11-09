import Link from 'next/link';
import type { Metadata } from 'next';
import { getLiveOffers } from '@/lib/offers';
import { cityIndex } from '@/lib/geo';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Les villes',
  description:
    'Les villes où des offres en finance sont actuellement en ligne, avec le ' +
    'nombre d’offres pour chacune.',
};

export default async function CitiesPage() {
  const offers = await getLiveOffers();
  const cities = cityIndex(offers.map((o) => o.place));

  return (
    <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Les villes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Seules les villes portant au moins une offre en ligne sont listées. Le nombre change
        chaque jour avec la collecte.
      </p>

      {cities.length > 0 ? (
        <ul className="mt-7 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/villes/${city.slug}`}
                className="inline-block rounded-[20px] border border-line bg-card px-3.5 py-2 text-[13px] no-underline transition-all hover:border-line-hover hover:bg-card-hover"
              >
                {city.label} <span className="text-muted">{city.count}</span>
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
