import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { getSnapshot, isDemoMode } from '@/lib/offers';
import { activeContractGroups } from '@/lib/sources';
import { CONTRACT_GROUPS, CONTRACT_GROUP_PLURALS } from '@/lib/offer';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { formatDate } from '@/components/offer-card';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'D’où viennent les offres',
  description:
    'Les sources de données de JuniorDesk, ce qu’elles couvrent, ce qu’elles ne couvrent ' +
    'pas, et pourquoi les stages ne sont pas encore disponibles.',
};

export default async function SourcesPage() {
  const snapshot = await getSnapshot();
  const sourced = activeContractGroups();
  const missing = CONTRACT_GROUPS.filter((g) => !sourced.includes(g));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">D’où viennent les offres</h1>
      <p className="mt-3 text-sm text-muted">
        {brand.name} n’écrit aucune offre et n’en reçoit aucune à la main. Tout est collecté
        automatiquement, une fois par jour, depuis des sources publiques, puis dédoublonné et
        filtré sur le périmètre finance. Chaque offre renvoie vers le site de l’employeur :
        nous ne recevons ni votre CV ni votre candidature.
      </p>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold">La source active</h2>
        <div className="mt-3 rounded-card border border-line bg-card p-5">
          <p className="font-bold">La bonne alternance</p>
          <p className="mt-1 text-sm text-muted">
            Service public opéré par la Mission Apprentissage. Son API expose les offres
            collectées par La bonne alternance, celles que lui transmet France Travail et
            celles de ses partenaires. Sa documentation autorise explicitement à les
            rediffuser gratuitement et en marque blanche — c’est la base sur laquelle ce site
            peut exister sans rien faire payer.
          </p>
          <p className="mt-2 text-sm text-muted">
            Ce qu’elle contient : <strong className="text-ink">uniquement de l’alternance</strong>{' '}
            (apprentissage et professionnalisation). Le champ de contrat de l’API n’admet pas
            d’autre valeur.
          </p>
        </div>
      </section>

      {missing.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-bold">
            Pourquoi il n’y a pas encore de{' '}
            {missing.map((g) => CONTRACT_GROUP_PLURALS[g]).join(' ni de ')}
          </h2>
          <div className="mt-3 rounded-card border border-warn/40 bg-warn-bg p-5">
            <p className="text-sm text-muted">
              Les stages et les premiers postes étaient diffusés par l’API « Offres d’emploi »
              de France Travail. Celle-ci n’est plus ouverte : sa fiche sur data.gouv.fr
              indique qu’elle « n’est actuellement plus exposée sur www.francetravail.io le
              temps d’une analyse des modalités de distribution et de réutilisation du
              service », à la suite d’« usages automatisés massifs par certaines solutions
              d’intelligence artificielle ne respectant pas les conditions et licences de
              réutilisation ». L’accès est désormais restreint et se demande au cas par cas.
            </p>
            <p className="mt-3 text-sm text-muted">
              L’adaptateur correspondant est écrit et testé dans ce site : il s’activera le
              jour où l’accès sera accordé, sans rien changer d’autre. En attendant, les
              filtres{' '}
              {missing.map((g) => CONTRACT_GROUP_PLURALS[g]).join(' et ')} sont
              affichés mais ne renvoient rien — nous préférons le dire que laisser croire à
              une recherche infructueuse.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[15px] font-bold">Comment le périmètre finance est défini</h2>
        <p className="mt-3 text-sm text-muted">
          Par les codes du Répertoire Opérationnel des Métiers et des Emplois (ROME) de France
          Travail, diffusé en open data sous Licence Ouverte, complétés par l’intitulé de
          l’offre. Le code seul ne suffit pas : ce référentiel ne distingue ni le M&amp;A, ni
          le private equity, ni les transaction services, que seul l’intitulé permet de
          reconnaître. {JOB_FAMILIES.length} familles de métiers sont retenues ; l’immobilier
          (hors crédit et investissement immobiliers), la qualité industrielle et les
          organismes de sécurité sociale sont écartés par des règles explicites. Une offre
          dont l’intitulé contient un terme disqualifiant est écartée même si un terme
          financier y figure — « assurance qualité » est un métier d’usine.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/metiers" className="text-accent">
            Voir les {JOB_FAMILIES.length} familles →
          </Link>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold">État de la dernière collecte</h2>
        <div className="mt-3 rounded-card border border-line bg-card p-5 text-sm">
          {isDemoMode() ? (
            <p className="text-muted">
              <strong className="text-warn">Mode démonstration.</strong> Aucune clé API n’est
              configurée : les offres affichées sont fabriquées. Pour collecter les vraies
              offres, créez une clé de production sur{' '}
              <code className="font-mono text-xs text-ink">
                api.apprentissage.beta.gouv.fr/compte/profil
              </code>{' '}
              et renseignez <code className="font-mono text-xs text-ink">LBA_API_KEY</code>. La
              lecture d’offres ne demande aucune habilitation particulière.
            </p>
          ) : (
            <p className="text-muted">
              Dernière collecte : {formatDate(snapshot.collectedAt)} — {snapshot.offers.length}{' '}
              offre{snapshot.offers.length === 1 ? '' : 's'} retenue
              {snapshot.offers.length === 1 ? '' : 's'}.
            </p>
          )}

          {snapshot.sources.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-muted">
              {snapshot.sources.map((source) => (
                <li key={source.id}>
                  {source.label} :{' '}
                  {source.error ? (
                    <span className="text-warn">échec — {source.error}</span>
                  ) : (
                    <span>
                      {source.count} offre{source.count === 1 ? '' : 's'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold">Ce que nous ne garantissons pas</h2>
        <p className="mt-3 text-sm text-muted">
          Nous ne sommes pas l’auteur des offres et nous n’en vérifions pas le contenu. Une
          offre peut être pourvue avant que notre collecte quotidienne ne s’en aperçoive, ou
          décrire un poste différemment de la réalité. Les informations affichées sont celles
          que la source nous transmet, telles quelles. La seule chose que nous garantissons
          est la provenance : elle est indiquée sur chaque offre.
        </p>
      </section>
    </main>
  );
}
