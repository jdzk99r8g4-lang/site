import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { brand } from '@/lib/brand';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { CONTRACT_GROUP_PLURALS, toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { JOB_FAMILIES, familyBySlug } from '@/lib/taxonomy';
import { OfferCard } from '@/components/offer-card';
import { DemoBanner } from '@/components/demo-banner';
import { cityIndex } from '@/lib/geo';

export const revalidate = 3600;

/**
 * Les neuf familles sont connues à l'avance et ne changent pas : on les
 * pré-génère. Les pages de ville, elles, dépendent des offres du jour et sont
 * rendues à la demande.
 */
export function generateStaticParams() {
  return JOB_FAMILIES.map((family) => ({ metier: family.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metier: string }>;
}): Promise<Metadata> {
  const { metier } = await params;
  const family = familyBySlug(metier);
  if (!family) return { title: 'Métier introuvable' };

  return {
    title: `Alternance ${family.label}`,
    description: `${family.intro} Toutes les offres d’alternance ${family.label.toLowerCase()} collectées automatiquement.`,
    alternates: { canonical: `/metiers/${family.slug}` },
  };
}

export default async function JobFamilyPage({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params;
  const family = familyBySlug(metier);
  if (!family) notFound();

  const all = await getLiveOffers();
  const offers = applyQuery(all, { families: [family.slug] });
  const facets = buildFacets(offers, activeContractGroups());
  const cities = cityIndex(offers.map((o) => o.place)).slice(0, 12);

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
        <nav aria-label="Fil d’Ariane" className="text-[13px] text-muted">
          <Link href="/metiers" className="no-underline hover:text-ink">
            Métiers
          </Link>
        </nav>

        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{family.label}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{family.intro}</p>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="text-[15px] font-bold">
            {offers.length} offre{offers.length === 1 ? '' : 's'} en ligne
          </span>
          {facets.groups
            .filter((g) => g.count > 0)
            .map((g) => (
              <span key={g.value} className="text-muted">
                {g.count} {g.count === 1 ? g.label.toLowerCase() : CONTRACT_GROUP_PLURALS[g.value]}
              </span>
            ))}
        </p>

        {cities.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {cities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/offres?metier=${family.slug}&ville=${city.slug}`}
                  className="inline-block rounded-[20px] border border-line bg-card px-3.5 py-2 text-[13px] no-underline transition-all hover:border-line-hover hover:bg-card-hover"
                >
                  {city.label} <span className="text-muted">{city.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {offers.length > 0 ? (
          <div className="mt-7 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-card border border-line bg-card p-6">
            <p className="font-bold">Aucune offre {family.label.toLowerCase()} en ligne.</p>
            <p className="mt-2 text-sm text-muted">
              C’est un métier où les volumes sont faibles, ou simplement une période creuse.{' '}
              <Link href={`/alertes?metier=${family.slug}`} className="text-accent">
                Créez une alerte
              </Link>{' '}
              pour être prévenu dès qu’une offre est publiée — {brand.name} regarde chaque jour.
            </p>
          </div>
        )}

        <p className="mt-8 text-[13px] text-muted-2">
          Codes métiers ROME rattachés à cette famille : {family.romeCodes.join(', ')}.
        </p>
      </main>
    </>
  );
}
