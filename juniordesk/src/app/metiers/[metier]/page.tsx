import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { brand } from '@/lib/brand';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { CONTRACT_GROUP_PLURALS, toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { JOB_FAMILIES, familyBySlug } from '@/lib/taxonomy';
import { paginate, parsePageParam } from '@/lib/pagination';
import { PageCount, Pager } from '@/components/pager';
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
  params: Promise<{ metier: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { metier } = await params;
  const family = familyBySlug(metier);
  if (!family) return { title: 'Métier introuvable' };

  const requestedPage = parsePageParam((await searchParams)['page']);
  const offers = applyQuery(await getLiveOffers(), { families: [family.slug] });
  const { page, clamped } = paginate(offers, requestedPage);
  const base = `/metiers/${family.slug}`;

  return {
    title: page > 1 ? `Alternance ${family.label} — page ${page}` : `Alternance ${family.label}`,
    description: `${family.intro} Toutes les offres d’alternance ${family.label.toLowerCase()} collectées automatiquement.`,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
    ...(clamped && requestedPage !== 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function JobFamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ metier: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { metier } = await params;
  const search = await searchParams;
  const requestedPage = parsePageParam(search['page']);
  const family = familyBySlug(metier);
  if (!family) notFound();

  const all = await getLiveOffers();
  const offers = applyQuery(all, { families: [family.slug] });
  const facets = buildFacets(offers, activeContractGroups());
  const cities = cityIndex(offers.map((o) => o.place)).slice(0, 12);
  const paged = paginate(offers, requestedPage);

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

        {paged.items.length > 0 ? (
          <>
            <PageCount from={paged.from} to={paged.to} total={paged.total} />
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {paged.items.map((offer) => (
                <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
              ))}
            </div>
            <Pager
              basePath={`/metiers/${family.slug}`}
              params={search}
              page={paged.page}
              pageCount={paged.pageCount}
            />
          </>
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
