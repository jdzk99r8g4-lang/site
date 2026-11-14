import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { familyBySlug } from '@/lib/taxonomy';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'JuniorDesk est né de la difficulté de trouver sa première expérience en finance. ' +
    'Notre histoire, notre constat et ce que nous essayons de changer.',
  alternates: { canonical: '/a-propos' },
};

/**
 * Les secteurs du « terrain de jeu » renvoient vers les pages métier
 * correspondantes.
 *
 * Une liste de mots décoratifs ne sert à personne : chaque secteur annoncé ici
 * correspond à une famille réelle de la taxonomie, et `tests/taxonomy.test.ts`
 * vérifie que la correspondance tient. Si une famille disparaît un jour, le
 * lien ne sera simplement pas rendu plutôt que de mener à une page absente.
 */
const PLAYGROUND: readonly { label: string; slug: string }[] = [
  { label: 'Banque d’investissement', slug: 'banque-investissement' },
  { label: 'M&A', slug: 'fusions-acquisitions' },
  { label: 'Private Equity', slug: 'private-equity' },
  { label: 'Gestion d’actifs', slug: 'gestion-actifs' },
  { label: 'Audit', slug: 'audit' },
  { label: 'Transaction Services', slug: 'transaction-services' },
  { label: 'Fintech', slug: 'fintech-paiements' },
  { label: 'Assurance', slug: 'assurance-actuariat' },
];

const CONSTAT: readonly { title: string; body: string }[] = [
  {
    title: 'Trop de sites',
    body:
      'Chaque entreprise possède son propre espace carrière, avec sa propre organisation ' +
      'et ses propres méthodes de recherche.',
  },
  {
    title: 'Trop d’informations',
    body:
      'Les plateformes généralistes mélangent les profils, les secteurs et les niveaux ' +
      'd’expérience. Il devient difficile de trouver ce qui nous concerne.',
  },
  {
    title: 'Trop de temps perdu',
    body:
      'Chaque heure passée à chercher une offre est une heure qui pourrait être consacrée ' +
      'à préparer une candidature, un entretien ou un projet.',
  },
];

const REPONSE: readonly { title: string; body: string }[] = [
  {
    title: 'Pensé pour les juniors',
    body: 'Des opportunités correspondant au début d’une carrière professionnelle.',
  },
  {
    title: 'Spécialisé en finance',
    body: 'Banque, M&A, Private Equity, audit, gestion d’actifs, fintech et assurance.',
  },
  {
    title: 'Centralisé',
    body: 'Les opportunités sont regroupées dans un même espace pour simplifier votre recherche.',
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* Notre histoire */}
      <section className="bg-[radial-gradient(ellipse_at_top,var(--color-bg-hero)_0%,var(--color-bg)_70%)]">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-6 sm:py-20">
          <p className="font-sans text-xs font-bold tracking-[0.08em] text-accent uppercase">Notre histoire</p>
          <h1 className="mt-4 text-2xl font-extrabold sm:text-4xl">
            Nous savons ce que c’est de chercher sa première chance.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] text-muted">
            {brand.name} est né d’une expérience simple : celle de jeunes étudiants qui ont
            connu les difficultés de l’insertion professionnelle et qui ont décidé de créer
            l’outil qu’ils auraient aimé avoir.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
        {/* Pourquoi JuniorDesk */}
        <Section eyebrow="Pourquoi JuniorDesk ?" title="Une idée née de la galère, transformée en projet.">
          <p>
            {brand.name} n’est pas né dans les bureaux d’un grand cabinet de conseil, d’une
            banque ou d’un fonds d’investissement.
          </p>
          <p>
            Il est né d’une réalité beaucoup plus simple : la difficulté de trouver sa place
            quand on débute.
          </p>
          <p>
            Nous sommes des étudiants français en droit et nous avons connu cette période où
            l’on envoie des candidatures, où l’on consulte les mêmes sites encore et encore, où
            une offre intéressante peut apparaître au mauvais moment et disparaître avant même
            d’avoir eu le temps de la voir.
          </p>
          <p>
            Sur le papier, les opportunités existent. Dans la réalité, elles sont dispersées
            partout.
          </p>
          <p>
            Une banque publie ses offres sur son site carrière. Un cabinet utilise une autre
            plateforme. Une boutique M&amp;A possède sa propre page. Un fonds peut publier ses
            opportunités ailleurs.
          </p>
          <p>Et au milieu de tout ça, il y a un étudiant qui doit tout trouver par lui-même.</p>

          <blockquote className="mt-6 border-l-2 border-accent pl-5 text-[17px] font-semibold text-ink italic">
            « Et si toutes ces opportunités étaient enfin réunies au même endroit ? »
          </blockquote>
        </Section>

        {/* Le constat */}
        <Section
          eyebrow="Le constat"
          title="Trouver un premier poste ne devrait pas être un travail à temps plein."
        >
          <p>
            Les étudiants doivent souvent jongler entre les sites carrières, les plateformes
            d’emploi et les pages d’entreprises pour trouver quelques offres réellement
            adaptées à leur profil.
          </p>
          <NumberedList items={CONSTAT} />
        </Section>

        {/* Notre réponse */}
        <Section eyebrow="Notre réponse" title="Un endroit pensé pour ceux qui commencent.">
          <p>
            Nous avons volontairement choisi de ne pas devenir un énième job board
            généraliste.
          </p>
          <p>
            {brand.name} se concentre sur les stages, les alternances et les premiers postes
            dans la finance et le conseil.
          </p>
          <NumberedList items={REPONSE} />

          {/*
           * Note de transparence, séparée du texte de présentation.
           *
           * Le paragraphe ci-dessus décrit l'ambition du projet, et il reste
           * tel quel. Mais une page « à propos » qui annonce des stages sur un
           * site qui n'en contient pas encore ferait venir des étudiants pour
           * rien — exactement le problème que le projet dit vouloir résoudre.
           */}
          <aside className="mt-7 rounded-card border border-warn/40 bg-warn-bg p-5 text-sm text-muted">
            <p className="font-semibold text-warn">Où nous en sommes aujourd’hui</p>
            <p className="mt-2">
              C’est l’ambition du projet. À ce jour, seule l’alternance est réellement
              couverte : la source publique qui diffusait les stages et les premiers postes
              n’est plus ouverte, et nous préférons le dire plutôt que d’afficher un catalogue
              incomplet sans prévenir.{' '}
              <Link href="/sources" className="text-accent underline">
                Le détail des sources
              </Link>
              .
            </p>
          </aside>
        </Section>

        {/* Notre mission */}
        <Section
          eyebrow="Notre mission"
          title="Donner à chaque jeune candidat une meilleure visibilité sur les opportunités."
        >
          <p>
            Nous voulons réduire le temps passé à chercher et permettre aux étudiants de
            consacrer davantage de temps à ce qui compte vraiment : se préparer, candidater et
            construire leur avenir.
          </p>
        </Section>

        {/* Notre terrain de jeu */}
        <Section eyebrow="Notre terrain de jeu" title="La finance et le conseil.">
          <p>
            Un secteur exigeant, compétitif, mais rempli d’opportunités pour ceux qui savent où
            chercher.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {PLAYGROUND.filter((sector) => familyBySlug(sector.slug)).map((sector) => (
              <li key={sector.slug}>
                <Link
                  href={`/metiers/${sector.slug}`}
                  className="inline-block rounded-[20px] border border-line bg-card px-4 py-2 text-[13px] no-underline transition-all hover:-translate-y-[2px] hover:border-accent hover:text-accent"
                >
                  {sector.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted-2">
            Chaque secteur mène à ses offres.{' '}
            <Link href="/metiers" className="text-accent">
              Voir les dix-huit familles de métiers
            </Link>
            .
          </p>
        </Section>

        {/* Ce en quoi nous croyons */}
        <Section
          eyebrow="Ce en quoi nous croyons"
          title="Une première opportunité peut changer une trajectoire."
        >
          <p>
            Un premier stage peut ouvrir une porte. Une alternance peut créer un réseau. Un
            premier poste peut changer complètement une carrière.
          </p>
          <p>Mais encore faut-il que l’opportunité soit trouvée.</p>
        </Section>

        {/* Bienvenue */}
        <section className="mt-14 rounded-card border border-line bg-card p-7 text-center shadow-card sm:p-10">
          <p className="font-sans text-xs font-bold tracking-[0.08em] text-accent uppercase">
            Bienvenue sur {brand.name}
          </p>
          <h2 className="mt-3 text-xl font-extrabold sm:text-2xl">
            Arrêtez de chercher partout. Commencez ici.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted">
            Vous n’avez pas besoin de connaître tous les bons sites. Vous n’avez pas besoin de
            passer votre soirée à chercher une offre cachée.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/offres"
              className="rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline transition-colors hover:bg-cta-hover active:scale-[0.97]"
            >
              Explorer les offres
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg border border-line bg-bg px-[18px] py-2.5 text-sm font-bold no-underline transition-colors hover:border-line-hover"
            >
              Créer un compte
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-line pt-10 first:mt-10 first:border-0 first:pt-0">
      <p className="font-sans text-xs font-bold tracking-[0.08em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-extrabold sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] text-muted">{children}</div>
    </section>
  );
}

/**
 * Liste numérotée.
 *
 * Les numéros 01 / 02 / 03 sont repris de la maquette. Ils sont ici
 * acceptables parce que les trois points se lisent comme un enchaînement
 * — trop de sites, donc trop d'informations, donc trop de temps perdu.
 */
function NumberedList({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-6 grid gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.title} className="rounded-card border border-line bg-card p-5 shadow-card">
          <span className="font-mono text-xs text-muted-2">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="mt-1.5 text-[15px] font-bold text-ink">{item.title}</p>
          <p className="mt-2 text-[13px] text-muted">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
