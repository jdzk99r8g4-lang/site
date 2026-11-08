import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { brand } from '@/lib/brand';
import { findOfferBySlug, getLiveOffers, isDemoMode } from '@/lib/offers';
import { CONTRACT_GROUP_LABELS, REMOTE_LABELS, contractGroups } from '@/lib/offer';
import { familyBySlug } from '@/lib/taxonomy';
import { formatDate } from '@/components/offer-card';
import { ShareButtons } from '@/components/share-buttons';
import { ContractBadge } from '@/components/contract-badge';
import { OfferAccountActions } from '@/components/offer-account-actions';
import { DemoBanner } from '@/components/demo-banner';
import { OfferCard } from '@/components/offer-card';
import { toPublicOffer } from '@/lib/offer';

export const revalidate = 3600;

/**
 * Les pages de détail ne sont pas pré-générées.
 *
 * Elles changent chaque jour avec la collecte, et pré-générer des milliers de
 * pages à chaque déploiement allongerait le build pour rien. La revalidation
 * horaire suffit.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = await findOfferBySlug(slug);
  if (!offer) return { title: 'Offre introuvable' };

  const employer = offer.employer.brand ?? offer.employer.name ?? 'Employeur non précisé';
  const place = offer.place.city ?? 'France';

  return {
    title: `${offer.title} — ${employer}, ${place}`,
    description:
      `Offre d’alternance : ${offer.title} chez ${employer} à ${place}. ` +
      `${contractGroups(offer).map((g) => CONTRACT_GROUP_LABELS[g]).join(', ')}.` +
      (offer.contract.start ? ` Début ${formatDate(offer.contract.start)}.` : ''),
    alternates: { canonical: `/offres/${offer.slug}` },
  };
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await findOfferBySlug(slug);
  if (!offer) notFound();

  const employer = offer.employer.brand ?? offer.employer.name;
  const shareUrl = `${brand.url}/offres/${offer.slug}`;

  // Offres proches : même famille, autres postes. Affichées seulement s'il y en
  // a, pour ne pas laisser une section vide en bas de page.
  const others = (await getLiveOffers())
    .filter((o) => o.id !== offer.id && o.families.some((f) => offer.families.includes(f)))
    .slice(0, 4);

  return (
    <>
      {isDemoMode() ? <DemoBanner /> : null}

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <article>
        <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
          <Link href="/offres" className="no-underline hover:underline">
            Offres
          </Link>
          {offer.families[0] ? (
            <>
              {' / '}
              <Link href={`/metiers/${offer.families[0]}`} className="no-underline hover:underline">
                {familyBySlug(offer.families[0])?.label ?? offer.families[0]}
              </Link>
            </>
          ) : null}
        </nav>

        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{offer.title}</h1>

        <p className="mt-2 text-muted">
          {employer ?? 'Employeur non précisé'}
          {offer.place.city ? ` — ${offer.place.city}` : ''}
        </p>

        <dl className="mt-6 grid gap-x-8 gap-y-3.5 rounded-card border border-line bg-card p-4 text-sm shadow-card sm:grid-cols-2">
          <Row label="Contrat">
            <span className="flex flex-wrap gap-1.5">
              {contractGroups(offer).map((group) => (
                <ContractBadge key={group} group={group} />
              ))}
            </span>
          </Row>
          <Row label="Début">
            {offer.contract.start
              ? formatDate(offer.contract.start)
              : offer.contract.startIsFlexible
                ? 'Dès que possible'
                : 'Non précisé'}
          </Row>
          {offer.contract.durationMonths ? (
            <Row label="Durée">{offer.contract.durationMonths} mois</Row>
          ) : null}
          {offer.contract.remote ? (
            <Row label="Présence">{REMOTE_LABELS[offer.contract.remote]}</Row>
          ) : null}
          {offer.targetDiploma ? <Row label="Niveau visé">{offer.targetDiploma}</Row> : null}
          {offer.place.address ? <Row label="Lieu">{offer.place.address}</Row> : null}
          {offer.publishedAt ? <Row label="Publiée le">{formatDate(offer.publishedAt)}</Row> : null}
          {offer.expiresAt ? <Row label="Jusqu’au">{formatDate(offer.expiresAt)}</Row> : null}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/*
           * Le lien de candidature passe par /go/[id] : la redirection compte
           * le clic côté serveur puis envoie vers l'employeur. `rel` empêche
           * la page d'origine d'être manipulée par la cible et évite de
           * transmettre du jus de lien à un site tiers.
           */}
          <a
            href={`/go/${encodeURIComponent(offer.id)}`}
            rel="nofollow noopener"
            className="rounded-lg bg-cta px-[18px] py-2.5 font-bold text-cta-ink no-underline transition-colors hover:bg-cta-hover active:scale-[0.97]"
          >
            Postuler chez l’employeur
          </a>
          <ShareButtons url={shareUrl} title={offer.title} />
        </div>

        <div className="mt-4">
          <OfferAccountActions offerId={offer.id} returnTo={`/offres/${offer.slug}`} />
        </div>

        <p className="mt-3 text-xs text-muted">
          La candidature se fait sur le site de l’employeur. {brand.name} ne reçoit ni votre
          CV ni votre candidature, et ne s’interpose pas.
        </p>

        {offer.description ? (
          <section className="mt-8">
            <h2 className="text-[15px] font-bold">Descriptif de l’offre</h2>
            {/*
             * Texte brut, pas de HTML interprété : le descriptif vient d'un
             * tiers, et l'injecter tel quel ouvrirait une faille.
             */}
            <div className="mt-3 whitespace-pre-line text-muted">{offer.description}</div>
          </section>
        ) : null}

        <section className="mt-8 rounded-card border border-line bg-card p-4 text-sm text-muted">
          <h2 className="text-[15px] font-bold text-ink">Provenance de cette offre</h2>
          <p className="mt-2">
            Collectée automatiquement depuis <strong>{offer.source.label}</strong>
            {offer.source.partnerLabel && offer.source.partnerLabel !== 'inconnu'
              ? ` (diffuseur : ${offer.source.partnerLabel})`
              : ''}
            , le {formatDate(offer.collectedAt)}. {brand.name} n’en est pas l’auteur et ne
            garantit ni son exactitude ni sa disponibilité.{' '}
            <Link href="/sources" className="text-accent">
              En savoir plus
            </Link>
            .
          </p>
        </section>

        {others.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[15px] font-bold">Offres proches</h2>
            <div className="mt-3 grid gap-3">
              {others.map((other) => (
                <OfferCard key={other.id} offer={toPublicOffer(other)} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-muted-2 uppercase">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
