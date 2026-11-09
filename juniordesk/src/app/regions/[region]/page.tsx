import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { groupsLabel, groupsPresent, toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { regionBySlug } from '@/lib/regions';
import { cityIndex } from '@/lib/geo';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { paginate, parsePageParam } from '@/lib/pagination';
import { PageCount, Pager } from '@/components/pager';
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

/*
 * Les métadonnées dépendent du numéro de page, pour deux raisons.
 *
 * La canonique d'abord : la donner sans le numéro reviendrait à dire qu'il
 * n'existe qu'une page et que les offres des suivantes ne sont nulle part.
 * Chaque page désigne donc sa propre adresse.
 *
 * Le refus d'indexation ensuite : un numéro trop grand sert quand même la
 * dernière page — renvoyer une erreur n'aiderait personne — mais il ne doit
 * pas entrer dans l'index, sinon un moteur référencerait autant d'adresses
 * que de numéros inventés, toutes avec le même contenu.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { region: slug } = await params;
  const found = await resolveRegion(slug);
  if (!found) return { title: 'Région introuvable' };

  const requestedPage = parsePageParam((await searchParams)['page']);
  const { page, clamped } = paginate(found.offers, requestedPage);
  const base = `/regions/${slug}`;
  const quoi = groupsLabel(groupsPresent(found.offers));

  return {
    title:
      page > 1
        ? `${quoi} finance en ${found.region.name} — page ${page}`
        : `${quoi} finance en ${found.region.name}`,
    description:
      `${found.offers.length} offre${found.offers.length === 1 ? '' : 's'} ${quoi.toLowerCase()} en ` +
      `finance en ${found.region.name} : banque, assurance, audit, comptabilité, contrôle ` +
      'de gestion.',
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
    ...(clamped && requestedPage !== 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { region: slug } = await params;
  const search = await searchParams;
  const found = await resolveRegion(slug);
  if (!found) notFound();

  const facets = buildFacets(found.offers, activeContractGroups());
  const paged = paginate(found.offers, parsePageParam(search['page']));
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
          {groupsLabel(groupsPresent(found.offers))} finance en {found.region.name}
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

        <PageCount from={paged.from} to={paged.to} total={paged.total} />
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {paged.items.map((offer) => (
            <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
          ))}
        </div>
        <Pager
          basePath={`/regions/${slug}`}
          params={search}
          page={paged.page}
          pageCount={paged.pageCount}
        />
      </main>
    </>
  );
}
