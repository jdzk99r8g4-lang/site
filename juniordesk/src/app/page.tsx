import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { getLiveOffers, isDemoMode } from '@/lib/offers';
import { buildFacets, sortOffers } from '@/lib/filters';
import { CONTRACT_GROUP_PLURALS, toPublicOffer } from '@/lib/offer';
import { activeContractGroups } from '@/lib/sources';
import { OfferCard } from '@/components/offer-card';
import { DemoBanner } from '@/components/demo-banner';
import { JOB_FAMILIES } from '@/lib/taxonomy';

/** Une heure : la collecte est quotidienne, inutile de reconstruire plus souvent. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.pitch,
};

export default async function HomePage() {
  const offers = await getLiveOffers();
  const facets = buildFacets(offers, activeContractGroups());
  const latest = sortOffers(offers, 'recent').slice(0, 8);

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      {/* Héros : le nombre d'offres en gros, parce que c'est la seule promesse
          qu'un agrégateur peut tenir à la seconde où on arrive. */}
      <section className="bg-[radial-gradient(ellipse_at_top,var(--color-bg-hero)_0%,var(--color-bg)_70%)] px-5 pt-13 pb-11 text-center">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">
          Finance · Banque · Audit · Junior
        </p>

        <p className="mt-4 bg-gradient-to-b from-accent-strong to-accent bg-clip-text text-[58px] leading-none font-extrabold tracking-[-1px] text-transparent">
          {offers.length}
        </p>
        <div className="mt-1 text-[15px] text-muted">
          offre{offers.length === 1 ? '' : 's'} disponible{offers.length === 1 ? '' : 's'}
        </div>

        <h1 className="mx-auto mt-6 max-w-2xl text-2xl font-extrabold sm:text-3xl">
          Votre premier poste en finance, au même endroit.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">{brand.pitch}</p>

        <form action="/offres" method="get" className="mt-6">
          <input
            type="search"
            name="q"
            placeholder="Analyste crédit, audit, Paris…"
            aria-label="Rechercher une offre"
            className="w-full max-w-[520px] rounded-[26px] px-[18px] py-[13px] text-sm"
          />
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/offres"
            className="rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline transition-colors hover:bg-cta-hover active:scale-[0.97]"
          >
            Explorer les offres
          </Link>
          <Link
            href="/alertes"
            className="rounded-lg border border-line bg-card px-[18px] py-2.5 text-sm font-bold no-underline transition-colors hover:border-line-hover hover:bg-card-hover"
          >
            Recevoir les nouvelles offres
          </Link>
        </div>

        {/* Les trois familles de contrat, avec leur compte réel. Un zéro est
            affiché comme un zéro : c'est l'information la plus utile de la
            page pour qui cherche un stage. */}
        <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3">
          {facets.groups.map((group) => (
            <li
              key={group.value}
              className="rounded-card border border-line bg-card px-3 py-4 shadow-card"
            >
              <p className="text-2xl font-extrabold">{group.count}</p>
              <p className="mt-0.5 text-[13px] text-muted">{CONTRACT_GROUP_PLURALS[group.value]}</p>
              {!group.sourced ? (
                <p className="mt-1 text-[11px] text-warn">source non branchée</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <main className="mx-auto max-w-[1140px] px-5 pb-12 sm:px-6">
        {/* Le périmètre réel, dit en entier. C'est la chose la plus importante
            de cette page : un étudiant qui cherche un stage doit pouvoir
            repartir tout de suite plutôt que de fouiller. */}
        <section className="mt-8 rounded-card border border-line bg-card p-5">
          <h2 className="text-[15px] font-bold">
            Ce que ce site contient aujourd’hui : {brand.scope.available.label.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-muted">{brand.scope.available.detail}</p>
          <p className="mt-2 text-sm text-muted">
            <Link href="/sources" className="text-accent">
              D’où viennent les offres, et pourquoi il n’y a pas encore de stages →
            </Link>
          </p>
        </section>

        <h2 className="mt-8 mb-3.5 text-[15px] font-bold">Les métiers</h2>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {JOB_FAMILIES.map((family, index) => {
            const count = facets.families.find((f) => f.value === family.slug)?.count ?? 0;
            return (
              <li key={family.slug}>
                <Link
                  href={`/metiers/${family.slug}`}
                  className="card-enter block h-full rounded-card border border-line bg-card p-4 no-underline shadow-card transition-all hover:-translate-y-[3px] hover:border-line-hover hover:bg-card-hover hover:shadow-card-hover"
                >
                  <span className="font-mono text-xs text-muted-2">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-1 text-[15px] font-bold">{family.label}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted">{family.intro}</p>
                  <p className="mt-2 text-[13px] text-accent">
                    {count === 0 ? 'Aucune offre en ligne' : `${count} offre${count === 1 ? '' : 's'}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>

        {facets.cities.length > 0 ? (
          <>
            <h2 className="mt-10 mb-3.5 text-[15px] font-bold">Les villes</h2>
            <ul className="flex flex-wrap gap-2">
              {facets.cities.slice(0, 20).map((city) => (
                <li key={city.value}>
                  <Link
                    href={`/villes/${city.value}`}
                    className="inline-block rounded-[20px] border border-line bg-card px-3.5 py-2 text-[13px] no-underline transition-all hover:border-line-hover hover:bg-card-hover"
                  >
                    {city.label} <span className="text-muted">{city.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {latest.length > 0 ? (
          <>
            <div className="mt-10 mb-3.5 flex items-baseline justify-between gap-4">
              <h2 className="text-[15px] font-bold">Dernières offres</h2>
              <Link href="/offres" className="text-[13px] text-accent no-underline hover:underline">
                Toutes les offres →
              </Link>
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {latest.map((offer) => (
                <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-10 rounded-card border border-line bg-card p-6 text-muted">
            Aucune offre en ligne pour le moment. La collecte tourne une fois par jour ; si cela
            persiste, voir{' '}
            <Link href="/sources" className="text-accent">
              d’où viennent les offres
            </Link>
            .
          </p>
        )}
      </main>
    </>
  );
}
