import Link from 'next/link';
import type { Metadata } from 'next';
import { getLiveOffers } from '@/lib/offers';
import { buildFacets } from '@/lib/filters';
import { activeContractGroups } from '@/lib/sources';
import { EXCLUDED_ROME, JOB_FAMILIES } from '@/lib/taxonomy';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Les métiers de la finance',
  // Le nombre est calculé : écrit en toutes lettres, il est resté « neuf »
  // longtemps après que les familles furent passées à dix-huit.
  description:
    `Les ${JOB_FAMILIES.length} familles de métiers couvertes : banque, M&A, private equity, ` +
    'marchés, gestion d’actifs, assurance, audit, comptabilité, contrôle de gestion, risques.',
};

export default async function JobFamiliesPage() {
  const offers = await getLiveOffers();
  const facets = buildFacets(offers, activeContractGroups());

  return (
    <main className="mx-auto max-w-[1140px] px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Les métiers couverts</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Chaque offre collectée est rattachée à une ou plusieurs de ces {JOB_FAMILIES.length}{' '}
        familles, par son code métier et par son intitulé. L’intitulé compte autant que le
        code : c’est lui qui distingue le M&amp;A, le private equity ou les transaction
        services, que le référentiel officiel des métiers ne sépare pas.
      </p>

      <ul className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
                <h2 className="mt-1 text-[15px] font-bold">{family.label}</h2>
                <p className="mt-1 text-[13px] text-muted">{family.intro}</p>
                <p className="mt-2 text-[13px] text-accent">
                  {count === 0 ? 'Aucune offre en ligne' : `${count} offre${count === 1 ? '' : 's'}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      {/*
       * Dire ce qui est exclu vaut mieux que de laisser le visiteur le
       * découvrir en ne trouvant rien. C'est aussi ce qui distingue ce site
       * d'un agrégateur qui ramasse tout : le périmètre est une décision, pas
       * un hasard.
       */}
      <section className="mt-10 rounded-card border border-line bg-card p-5">
        <h2 className="text-[15px] font-bold">Ce qui est volontairement exclu</h2>
        <p className="mt-2 text-sm text-muted">
          L’immobilier, la qualité industrielle, les organismes de sécurité sociale et les
          fonctions administratives sans dimension financière sont écartés par une liste
          explicite de {EXCLUDED_ROME.length} codes métiers. Sans elle, « assurance qualité »
          et « audit énergétique » rempliraient le site de postes d’usine.
        </p>
      </section>
    </main>
  );
}
