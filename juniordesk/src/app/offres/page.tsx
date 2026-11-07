import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { applyQuery, buildFacets } from '@/lib/filters';
import { toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { parseSearchParams } from '@/lib/query-params';
import { OfferCard } from '@/components/offer-card';
import { OfferFilters } from '@/components/offer-filters';
import { DemoBanner } from '@/components/demo-banner';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Toutes les offres',
  description:
    'Stages, alternances et postes juniors en banque, assurance, gestion d’actifs, ' +
    'audit, comptabilité, contrôle de gestion et fiscalité. Filtrables par type de ' +
    'contrat, métier, ville et date de début.',
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { query, selected } = parseSearchParams(params);

  const all = await getLiveOffers();
  const facets = buildFacets(all, activeContractGroups());
  const results = applyQuery(all, query);

  const hasFilters =
    selected.families.length > 0 ||
    selected.groups.length > 0 ||
    selected.cities.length > 0 ||
    selected.q.length > 0 ||
    selected.startsBefore.length > 0;

  // Un filtre sur une famille de contrat qu'aucune source n'alimente ne peut
  // rien renvoyer : il faut le dire, sinon le visiteur conclut que le site est
  // cassé.
  const unsourcedSelected = facets.groups.filter(
    (group) => selected.groups.includes(group.value) && !group.sourced,
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

        <p className="mt-6 mb-3.5 text-[15px] font-bold" aria-live="polite">
          {hasFilters
            ? `${results.length} offre${results.length === 1 ? '' : 's'} sur ${all.length}`
            : `${results.length} offre${results.length === 1 ? '' : 's'}`}
        </p>

        {results.length > 0 ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {results.map((offer) => (
              <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
            ))}
          </div>
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
