import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { hasActiveFilters, parseSearchParams } from '@/lib/query-params';
import { paginate } from '@/lib/pagination';
import { PageCount, Pager } from '@/components/pager';
import { OfferCard } from '@/components/offer-card';
import { OfferFilters } from '@/components/offer-filters';
import { DemoBanner } from '@/components/demo-banner';

export const revalidate = 3600;

const DESCRIPTION =
  'Stages, alternances et postes juniors en banque, assurance, gestion d’actifs, ' +
  'audit, comptabilité, contrôle de gestion et fiscalité. Filtrables par type de ' +
  'contrat, métier, ville et date de début.';

/**
 * Chaque page porte sa propre adresse canonique, et non celle de la page 1.
 *
 * Canoniser toutes les pages vers la première dirait aux moteurs que les
 * offres des pages suivantes n'existent pas.
 *
 * Les combinaisons de filtres, elles, ne sont pas des pages à référencer : il
 * y en a une infinité, et les adresses qu'on veut voir indexées existent déjà
 * sous `/metiers/…`, `/villes/…` et `/regions/…`. Une version antérieure leur
 * donnait pour canonique la page non filtrée de même numéro — c'était faux :
 * une canonique doit désigner une adresse qui porte le MÊME contenu, et
 * `/offres?metier=audit-conseil&page=2` n'affiche pas les offres de
 * `/offres?page=2`. Un moteur ignore une canonique de ce genre, et dans le
 * doute il consolide de travers. Une page filtrée est donc marquée
 * `noindex, follow` — à ne pas indexer, mais à parcourir, pour que les liens
 * vers les offres restent découvrables — et ne porte aucune canonique : il n'y
 * a rien à consolider pour une adresse qui ne doit pas entrer dans l'index.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const { query, selected, page: requestedPage } = parseSearchParams(params);

  // La lecture est mutualisée avec celle de la page par `cache()` : ce
  // deuxième appel ne relit pas le magasin.
  const results = applyQuery(await getLiveOffers(), query);
  const { page, clamped } = paginate(results, requestedPage);

  const filtered = hasActiveFilters(selected);
  /*
   * Un numéro de page inventé sert quand même la dernière page, mais ne doit
   * pas être indexé : sinon un moteur référencerait autant d'adresses que de
   * numéros possibles, toutes avec le même contenu.
   */
  const keepOut = filtered || (clamped && requestedPage !== 1);

  return {
    title: page > 1 ? `Toutes les offres — page ${page}` : 'Toutes les offres',
    description: DESCRIPTION,
    ...(filtered ? {} : { alternates: { canonical: page > 1 ? `/offres?page=${page}` : '/offres' } }),
    ...(keepOut ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { query, selected, page: requestedPage } = parseSearchParams(params);

  const all = await getLiveOffers();
  const facets = buildFacets(all, activeContractGroups());
  const results = applyQuery(all, query);
  const paged = paginate(results, requestedPage);

  const hasFilters = hasActiveFilters(selected);

  // Un filtre sur une famille de contrat qu'aucune source n'alimente ne peut
  // rien renvoyer : il faut le dire, sinon le visiteur conclut que le site est
  // cassé.
  const unsourcedSelected = facets.groups.filter(
    (group) => selected.groups.includes(group.value) && !group.sourced,
  );

  /*
   * Même raisonnement pour une ville saisie à la main qui ne porte aucune
   * offre aujourd'hui — ou qui n'existe pas. Zéro résultat sans explication
   * ressemble à une panne ; dire « aucune offre à Bourg-en-Bresse » est une
   * information.
   */
  const unknownCities = selected.cities.filter(
    (slug) => !facets.cities.some((city) => city.value === slug),
  );

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Offres</h1>
        <p className="mt-1.5 text-sm text-muted">
          {all.length} offre{all.length === 1 ? '' : 's'} en ligne · {brand.scope.label}
        </p>

        {params['retiree'] ? (
          <p className="mt-4 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm text-muted">
            Cette offre a été retirée ou a expiré depuis votre dernière visite. Voici le reste
            des offres en ligne.
          </p>
        ) : null}

        <div className="mt-6">
          <OfferFilters facets={facets} selected={selected} />
        </div>

        {unsourcedSelected.length > 0 ? (
          <p className="mt-5 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm text-muted">
            <strong className="font-semibold text-warn">
              {unsourcedSelected.map((g) => g.label).join(' et ')} : aucune source branchée.
            </strong>{' '}
            La source publique qui diffusait ces contrats n’est plus ouverte. Ce filtre
            fonctionnera dès qu’une source sera branchée — en attendant, il ne peut rien
            renvoyer.{' '}
            <Link href="/sources" className="text-accent underline">
              Pourquoi
            </Link>
            .
          </p>
        ) : null}

        {unknownCities.length > 0 ? (
          <p className="mt-5 rounded-card border border-line bg-card p-4 text-sm text-muted">
            Aucune offre en ligne pour{' '}
            <strong className="text-ink">{unknownCities.join(', ')}</strong> aujourd’hui.
            Essayez la région, ou{' '}
            <Link href="/alertes" className="text-accent">
              créez une alerte
            </Link>{' '}
            pour être prévenu dès qu’une offre y est publiée.
          </p>
        ) : null}

        <PageCount
          from={paged.from}
          to={paged.to}
          total={paged.total}
          {...(hasFilters ? { filteredFrom: all.length } : {})}
        />

        {paged.items.length > 0 ? (
          <>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {paged.items.map((offer) => (
                <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
              ))}
            </div>
            <Pager basePath="/offres" params={params} page={paged.page} pageCount={paged.pageCount} />
          </>
        ) : (
          <div className="rounded-card border border-line bg-card p-6">
            <p className="font-bold">Aucune offre ne correspond à ces critères.</p>
            <p className="mt-2 text-sm text-muted">
              {hasFilters ? (
                <>
                  Élargissez les filtres, ou{' '}
                  <Link href="/alertes" className="text-accent">
                    créez une alerte
                  </Link>{' '}
                  pour être prévenu dès qu’une offre correspondante est publiée.
                </>
              ) : (
                <>Aucune offre n’est en ligne pour le moment. La collecte tourne une fois par jour.</>
              )}
            </p>
            {hasFilters ? (
              <p className="mt-3 text-sm">
                <Link href="/offres" className="text-accent">
                  Effacer les filtres
                </Link>
              </p>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
