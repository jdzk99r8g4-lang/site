import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { LegalSection, Todo } from '@/components/legal-prose';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur et conditions d’utilisation du site.',
};

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Mentions légales</h1>

      <p className="mt-4 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm text-muted">
        <strong className="text-warn">Cette page n’est pas complète.</strong> Les champs
        surlignés doivent être renseignés avec l’identité juridique réelle de l’éditeur avant
        toute mise en ligne publique. Y inscrire des coordonnées inventées n’aurait aucune
        valeur juridique et exposerait l’éditeur. Tant que ces champs subsistent,
        <code className="mx-1 font-mono text-xs text-ink">NEXT_PUBLIC_ALLOW_INDEXING</code>
        doit rester à « false ».
      </p>

      <LegalSection title="Éditeur du site">
        <p>
          Dénomination : <Todo>raison sociale</Todo>
          <br />
          Forme juridique : <Todo>SAS, SASU, association, auto-entreprise…</Todo>
          <br />
          Siège social : <Todo>adresse complète</Todo>
          <br />
          Numéro SIREN : <Todo>9 chiffres</Todo>
          <br />
          Numéro de TVA intracommunautaire : <Todo>le cas échéant</Todo>
          <br />
          Capital social : <Todo>le cas échéant</Todo>
          <br />
          Responsable de la publication : <Todo>nom et prénom</Todo>
          <br />
          Contact : <Todo>adresse e-mail de contact</Todo>
        </p>
        <p className="text-[13px] text-muted-2">
          Mentions exigées par l’article 6, III de la loi n° 2004-575 du 21 juin 2004 pour la
          confiance dans l’économie numérique. Un éditeur particulier non professionnel peut
          se limiter à son prénom, nom et adresse e-mail, à condition d’avoir communiqué son
          identité complète à l’hébergeur.
        </p>
      </LegalSection>

      <LegalSection title="Hébergeur">
        <p>
          Nom : <Todo>nom de l’hébergeur</Todo>
          <br />
          Adresse : <Todo>adresse de l’hébergeur</Todo>
          <br />
          Téléphone : <Todo>numéro de l’hébergeur</Todo>
        </p>
      </LegalSection>

      <LegalSection title="Nature du service">
        <p>
          {brand.name} est un agrégateur d’offres d’emploi. Il ne rédige aucune offre, n’en
          reçoit aucune à la main, et ne les héberge que sous forme de reprise automatisée de
          sources publiques. Chaque offre affichée indique sa provenance et renvoie vers le
          site de l’employeur ou du diffuseur d’origine pour candidater.
        </p>
        <p>
          {brand.name} n’est ni un intermédiaire de recrutement, ni une agence de placement.
          Il ne reçoit aucune candidature, aucun curriculum vitæ, et n’intervient à aucun
          moment dans la relation entre un candidat et un employeur.
        </p>
      </LegalSection>

      <LegalSection title="Exactitude des offres">
        <p>
          Les informations affichées sont celles transmises par les sources, reprises sans
          modification de leur substance. {brand.name} ne garantit ni leur exactitude, ni leur
          exhaustivité, ni la disponibilité des postes : une offre peut être pourvue avant que
          la collecte quotidienne ne s’en aperçoive. La responsabilité du contenu d’une offre
          incombe à son auteur.
        </p>
        <p>
          Pour signaler une offre erronée, obsolète ou qui ne devrait pas figurer ici,
          écrivez à <Todo>adresse e-mail de signalement</Todo>. Toute demande de retrait d’un
          employeur sera traitée sans discussion.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le contenu des offres appartient à leurs auteurs et diffuseurs respectifs. Les
          données issues de La bonne alternance sont réutilisées conformément aux conditions
          de son API, qui autorise leur exposition gratuite et en marque blanche. Les données
          du Répertoire Opérationnel des Métiers et des Emplois sont réutilisées sous Licence
          Ouverte.
        </p>
        <p>
          La structure du site, ses textes propres et son code sont la propriété de
          l’éditeur.
        </p>
      </LegalSection>

      <LegalSection title="Gratuité">
        <p>
          L’accès au site et à l’ensemble de ses fonctionnalités est gratuit pour les
          candidats. Aucun abonnement, aucune option payante, aucune fonctionnalité réservée.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Le présent site est soumis au droit français. En cas de litige, et après tentative
          de résolution amiable, les tribunaux français sont seuls compétents.
        </p>
      </LegalSection>
    </main>
  );
}
