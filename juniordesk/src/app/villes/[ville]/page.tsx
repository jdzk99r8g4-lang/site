import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { cityIndex } from '@/lib/geo';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { paginate, parsePageParam } from '@/lib/pagination';
import { PageCount, Pager } from '@/components/pager';
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
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { ville } = await params;
  const found = await resolveCity(ville);
  if (!found) return { title: 'Ville introuvable' };

  const requestedPage = parsePageParam((await searchParams)['page']);
  const { page, clamped } = paginate(found.offers, requestedPage);
  const base = `/villes/${ville}`;

  return {
    title:
      page > 1
        ? `Alternance finance à ${found.label} — page ${page}`
        : `Alternance finance à ${found.label}`,
    description:
      `${found.offers.length} offre${found.offers.length === 1 ? '' : 's'} d’alternance en ` +
      `finance à ${found.label} : banque, assurance, audit, comptabilité, contrôle de gestion.`,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
    ...(clamped && requestedPage !== 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville } = await params;
  const search = await searchParams;
  const found = await resolveCity(ville);
  if (!found) notFound();

  const facets = buildFacets(found.offers, activeContractGroups());
  const paged = paginate(found.offers, parsePageParam(search['page']));

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

        <PageCount from={paged.from} to={paged.to} total={paged.total} />
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {paged.items.map((offer) => (
            <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
          ))}
        </div>
        <Pager
          basePath={`/villes/${ville}`}
          params={search}
          page={paged.page}
          pageCount={paged.pageCount}
        />

        <p className="mt-8 text-sm text-muted">
          <Link href={`/alertes?ville=${ville}`} className="text-accent">
            Être prévenu des nouvelles offres à {found.label} →
          </Link>
        </p>
      </main>
    </>
  );
}
