import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { cityIndex } from '@/lib/geo';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { OfferCard } from '@/components/offer-card';
import { DemoBanner } from '@/components/demo-banner';

export const revalidate = 3600;

/**
 * Les pages de ville ne sont PAS pré-générées, et aucune n'est créée pour une
 * ville sans offre.
 *
 * C'est une décision de référencement autant que d'honnêteté : des milliers de
 * pages « Alternance finance à <ville> » vides sont exactement ce que les
 * moteurs appellent du contenu pauvre, et ce qu'un visiteur appelle une perte
 * de temps. `resolveCity()` renvoie 404 quand la ville n'a rien.
 */
async function resolveCity(slug: string) {
  const all = await getLiveOffers();
  const offers = applyQuery(all, { cities: [slug] });
  if (offers.length === 0) return null;

  const label = cityIndex(offers.map((o) => o.place)).find((c) => c.slug === slug)?.label ?? slug;
  return { offers, label };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const found = await resolveCity(ville);
  if (!found) return { title: 'Ville introuvable' };

  return {
    title: `Alternance finance à ${found.label}`,
    description:
      `${found.offers.length} offre${found.offers.length === 1 ? '' : 's'} d’alternance en ` +
      `finance à ${found.label} : banque, assurance, audit, comptabilité, contrôle de gestion.`,
    alternates: { canonical: `/villes/${ville}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const found = await resolveCity(ville);
  if (!found) notFound();

  const facets = buildFacets(found.offers, activeContractGroups());

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
        <nav aria-label="Fil d’Ariane" className="text-[13px] text-muted">
          <Link href="/villes" className="no-underline hover:text-ink">
            Villes
          </Link>
        </nav>

        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Alternance finance à {found.label}
        </h1>
        <p className="mt-2 text-[15px] font-bold">
          {found.offers.length} offre{found.offers.length === 1 ? '' : 's'} en ligne
        </p>

        {facets.families.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {JOB_FAMILIES.filter((f) => facets.families.some((x) => x.value === f.slug)).map(
              (family) => {
                const count = facets.families.find((x) => x.value === family.slug)?.count ?? 0;
                return (
                  <li key={family.slug}>
                    <Link
                      href={`/offres?ville=${ville}&metier=${family.slug}`}
                      className="inline-block rounded-[20px] border border-line bg-card px-3.5 py-2 text-[13px] no-underline transition-all hover:border-line-hover hover:bg-card-hover"
                    >
                      {family.label} <span className="text-muted">{count}</span>
                    </Link>
                  </li>
                );
              },
            )}
          </ul>
        ) : null}

        <div className="mt-7 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {found.offers.map((offer) => (
            <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          <Link href={`/alertes?ville=${ville}`} className="text-accent">
            Être prévenu des nouvelles offres à {found.label} →
          </Link>
        </p>
      </main>
    </>
  );
}
