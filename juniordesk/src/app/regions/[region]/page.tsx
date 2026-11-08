import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { regionBySlug } from '@/lib/regions';
import { cityIndex } from '@/lib/geo';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { OfferCard } from '@/components/offer-card';
import { DemoBanner } from '@/components/demo-banner';

export const revalidate = 3600;

/**
 * Pas de pré-génération, et pas de page pour une région vide.
 *
 * Les dix-huit régions sont connues d'avance, mais les trois quarts d'entre
 * elles n'auront jamais d'offre en finance junior. Générer dix-huit pages dont
 * quinze sont vides est exactement ce que les moteurs appellent du contenu
 * pauvre, et ce qu'un visiteur appelle une perte de temps.
 */
async function resolveRegion(slug: string) {
  const region = regionBySlug(slug);
  if (!region) return null;

  const offers = applyQuery(await getLiveOffers(), { regions: [slug] });
  if (offers.length === 0) return null;

  return { region, offers };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: slug } = await params;
  const found = await resolveRegion(slug);
  if (!found) return { title: 'Région introuvable' };

  return {
    title: `Alternance finance en ${found.region.name}`,
    description:
      `${found.offers.length} offre${found.offers.length === 1 ? '' : 's'} d’alternance en ` +
      `finance en ${found.region.name} : banque, assurance, audit, comptabilité, contrôle ` +
      'de gestion.',
    alternates: { canonical: `/regions/${slug}` },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: slug } = await params;
  const found = await resolveRegion(slug);
  if (!found) notFound();

  const facets = buildFacets(found.offers, activeContractGroups());
  const cities = cityIndex(found.offers.map((o) => o.place));

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
        <nav aria-label="Fil d’Ariane" className="text-[13px] text-muted">
          <Link href="/regions" className="no-underline hover:text-ink">
            Régions
          </Link>
        </nav>

        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Alternance finance en {found.region.name}
        </h1>
        <p className="mt-2 text-[15px] font-bold">
          {found.offers.length} offre{found.offers.length === 1 ? '' : 's'} en ligne
          {cities.length > 1 ? (
            <span className="font-normal text-muted">
              {' '}
              dans {cities.length} ville{cities.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </p>

        {cities.length > 1 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {cities.slice(0, 16).map((city) => (
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
        ) : null}

        {facets.families.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {JOB_FAMILIES.filter((f) => facets.families.some((x) => x.value === f.slug)).map(
              (family) => {
                const count = facets.families.find((x) => x.value === family.slug)?.count ?? 0;
                return (
                  <li key={family.slug}>
                    <Link
                      href={`/offres?region=${slug}&metier=${family.slug}`}
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
      </main>
    </>
  );
}
