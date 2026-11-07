import Link from 'next/link';
import type { PublicOffer } from '@/lib/offer';
import { REMOTE_LABELS, contractGroups } from '@/lib/offer';
import { familyBySlug } from '@/lib/taxonomy';
import { ContractBadge } from './contract-badge';

/**
 * Carte d'offre, reprise de la grille du brouillon : pastille d'initiales,
 * intitulé, employeur, descriptif tronqué à trois lignes, badges en pied.
 *
 * Reçoit une `PublicOffer` : le lien de candidature n'y est pas, exprès. Les
 * clics partent vers /go/[id], sans quoi ils ne peuvent pas être comptés côté
 * serveur — et c'est la seule mesure d'utilité réelle du site.
 */
export function OfferCard({ offer }: { offer: PublicOffer }) {
  const employer = offer.employer.brand ?? offer.employer.name;
  const groups = contractGroups(offer);

  return (
    <article className="card-enter flex flex-col gap-2.5 rounded-card border border-line bg-card p-4 shadow-card transition-all hover:-translate-y-[3px] hover:border-line-hover hover:bg-card-hover hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-bg text-base font-bold text-accent"
        >
          {initials(employer ?? offer.title)}
        </span>

        <div className="min-w-0">
          <h3 className="text-[15px] leading-tight font-bold">
            <Link href={`/offres/${offer.slug}`} className="no-underline hover:text-accent">
              {offer.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {employer ?? 'Employeur non précisé'}
            {offer.place.city ? ` · ${offer.place.city}` : ''}
          </p>
        </div>
      </div>

      {offer.description ? (
        <p className="line-clamp-3 flex-grow text-[13px] leading-[1.5] text-muted">
          {offer.description}
        </p>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {groups.map((group) => (
          <ContractBadge key={group} group={group} />
        ))}
        {offer.families.slice(0, 1).map((slug) => {
          const family = familyBySlug(slug);
          return family ? (
            <span
              key={slug}
              className="rounded-[10px] border border-line px-2 py-0.5 text-[11px] text-muted"
            >
              {family.label}
            </span>
          ) : null;
        })}
        {offer.contract.remote && offer.contract.remote !== 'onsite' ? (
          <span className="rounded-[10px] border border-line px-2 py-0.5 text-[11px] text-muted">
            {REMOTE_LABELS[offer.contract.remote]}
          </span>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-2">
        {offer.contract.start
          ? `Début ${formatDate(offer.contract.start)}`
          : offer.contract.startIsFlexible
            ? 'Début dès que possible'
            : 'Date de début non précisée'}
        {offer.contract.durationMonths ? ` · ${offer.contract.durationMonths} mois` : ''}
      </p>
    </article>
  );
}

/** Deux lettres au plus, pour la pastille. */
function initials(text: string): string {
  const words = text
    .replace(/\[EXEMPLE\]\s*/i, '')
    .split(/[\s-]+/)
    .filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w));
  const first = words[0]?.[0] ?? '?';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

/** Format français court. Une date ISO est illisible pour un candidat. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
