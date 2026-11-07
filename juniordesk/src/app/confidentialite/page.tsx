import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { LegalSection, ToCheck, Todo } from '@/components/legal-prose';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Ce que ce site collecte, ce qu’il ne collecte pas, pourquoi il n’y a pas de bannière ' +
    'cookies, et comment exercer vos droits.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Politique de confidentialité</h1>

      <p className="mt-4 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm text-muted">
        <strong className="text-warn">Cette page n’est pas complète.</strong> L’identité du
        responsable de traitement et la durée de conservation des journaux techniques de
        l’hébergeur doivent être renseignées avant toute mise en ligne publique.
      </p>

      <LegalSection title="En résumé">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Aucun cookie n’est déposé. Aucun traceur n’est utilisé. Aucun outil tiers n’est chargé.</li>
          <li>Consulter ce site ne demande aucun compte et ne crée aucun profil.</li>
          <li>
            Si vous créez une alerte, nous conservons votre adresse e-mail et vos critères —
            rien d’autre.
          </li>
          <li>Aucune donnée n’est cédée, revendue ni partagée à des fins publicitaires.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Responsable de traitement">
        <p>
          <Todo>raison sociale, siège social et adresse e-mail de contact</Todo>
        </p>
        <p>
          Aucun délégué à la protection des données n’est désigné : le traitement ne relève
          d’aucun des cas rendant cette désignation obligatoire. <Todo>à revoir si cela change</Todo>
        </p>
      </LegalSection>

      <LegalSection title="Pourquoi il n’y a pas de bannière cookies">
        <p>
          Parce qu’il n’y a rien à consentir. L’article 82 de la loi Informatique et Libertés
          encadre la lecture et l’écriture d’informations sur votre terminal. Ce site n’écrit
          aucun cookie, ne dépose aucun identifiant, ne lit aucun stockage local et ne charge
          aucun script tiers : rien n’est ni lu ni écrit sur votre appareil, donc l’article 82
          ne s’applique pas.
        </p>
        <p>
          La mesure d’audience se limite à des compteurs agrégés, tenus sur notre serveur :
          nombre de fois qu’une offre a été ouverte, nombre de clics partis vers un employeur,
          répartition par métier et par ville. Ces compteurs n’identifient personne, ne
          contiennent aucune adresse IP et ne permettent aucun recoupement. Ils sont conservés
          par mois et supprimés automatiquement au bout de vingt-cinq mois, conformément à la
          durée maximale recommandée par la CNIL.
        </p>
        <p className="text-[13px] text-muted-2">
          Nous ne présentons cette approche ni comme « certifiée » ni comme « validée par la
          CNIL » : la CNIL interdit expressément ces formulations, et c’est à nous de
          démontrer notre conformité, pas à elle de la labelliser.
        </p>
      </LegalSection>

      <LegalSection title="Journaux techniques de l’hébergeur">
        <p>
          Comme tout site, celui-ci est servi par un hébergeur qui journalise les requêtes à
          des fins de sécurité, de prévention des abus et de diagnostic. Ces journaux
          contiennent des adresses IP, qui sont des données personnelles. Nous ne les
          consultons pas, nous ne les exportons pas vers un service tiers, et nous ne les
          utilisons pas pour la mesure d’audience.
        </p>
        <p>
          Hébergeur : <Todo>nom de l’hébergeur</Todo>. Durée de conservation des journaux :{' '}
          <ToCheck>
            à relever dans le contrat de sous-traitance de l’hébergeur retenu — la durée
            d’affichage des journaux documentée par l’offre ne vaut pas engagement de
            suppression des adresses IP
          </ToCheck>
          .
        </p>
        <p className="text-[13px] text-muted-2">
          Base légale : intérêt légitime à assurer la sécurité et la disponibilité du service
          (article 6.1.f du RGPD).
        </p>
      </LegalSection>

      <LegalSection title="Alertes e-mail">
        <p>
          <strong className="text-ink">Données collectées :</strong> votre adresse e-mail, les
          critères que vous choisissez (type de contrat, métiers, villes), les dates de
          création et de confirmation de l’alerte, et la date du dernier envoi.
        </p>
        <p>
          <strong className="text-ink">Finalité :</strong> vous envoyer les nouvelles offres
          correspondant à vos critères.
        </p>
        <p>
          <strong className="text-ink">Base légale :</strong> votre consentement, recueilli par
          double confirmation — l’inscription ne devient active qu’après le clic sur le lien
          envoyé à votre adresse. Ce mécanisme existe précisément pour qu’on ne puisse pas
          vous inscrire à votre insu.
        </p>
        <p>
          <strong className="text-ink">Mesure des clics depuis nos e-mails :</strong> lorsque
          vous cliquez une offre depuis un e-mail d’alerte, ce clic est compté et rattaché à
          votre inscription, afin que nous sachions si les alertes vous sont réellement
          utiles. Nous ne conservons qu’un total mensuel de clics par inscription : ni
          l’historique, ni la chronologie, ni la liste des offres cliquées. Vous avez consenti
          à cette mesure en confirmant votre alerte, et elle cesse dès votre désinscription.
          Les liens des pages du site, eux, ne sont jamais rattachés à une personne.
        </p>
        <p>
          <strong className="text-ink">Durée de conservation :</strong> jusqu’à votre
          désinscription. Une inscription non confirmée est supprimée automatiquement, le lien
          de confirmation expirant au bout de trente jours.
        </p>
        <p>
          <strong className="text-ink">Désinscription :</strong> un lien figure dans chaque
          e-mail et agit en un clic. La désinscription supprime votre adresse et vos critères ;
          nous ne les gardons pas « au cas où ».
        </p>
      </LegalSection>

      <LegalSection title="Sous-traitants">
        <p>
          Envoi des e-mails : <Todo>Resend, ou le prestataire retenu — à confirmer, avec son
          contrat de sous-traitance et la localisation de ses serveurs</Todo>
        </p>
        <p>
          Hébergement et stockage des inscriptions : <Todo>hébergeur et base de données
          retenus</Todo>
        </p>
        <p>
          Nous ne faisons appel à aucun prestataire publicitaire, aucune régie, aucun outil
          d’analyse comportementale.
        </p>
      </LegalSection>

      <LegalSection title="Transferts hors Union européenne">
        <p>
          <Todo>à renseigner une fois les prestataires choisis : indiquer si des données sont
          transférées hors UE et sur quel fondement</Todo>
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation,
          d’opposition et de portabilité, ainsi que du droit de retirer votre consentement à
          tout moment. Pour les alertes, le retrait du consentement se fait en un clic depuis
          n’importe lequel de nos e-mails.
        </p>
        <p>
          Pour toute autre demande, écrivez à <Todo>adresse e-mail de contact</Todo>. Nous
          répondons dans un délai d’un mois.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la Commission nationale
          de l’informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334
          Paris Cedex 07.
        </p>
      </LegalSection>

      <LegalSection title="Données des offres">
        <p>
          Les offres affichées peuvent contenir des informations relatives à des personnes
          (nom d’un contact, par exemple) lorsque la source les transmet. {brand.name} ne les
          sollicite pas, ne les enrichit pas et ne les exploite à aucune autre fin que
          l’affichage de l’offre. Une offre retirée de sa source disparaît de ce site à la
          collecte suivante.{' '}
          <Link href="/sources" className="text-accent">
            Détail des sources
          </Link>
          .
        </p>
      </LegalSection>
    </main>
  );
}
