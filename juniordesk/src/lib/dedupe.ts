/**
 * Dédoublonnage.
 *
 * Deux doublons différents se produisent, et ils n’ont pas la même solution.
 *
 * 1. INTRA-SOURCE. La même offre revient deux fois dans un export, ou une
 *    collecte est relancée dans la journée. L’identifiant stable
 *    (`source:partenaire:identifiant`) suffit à les reconnaître.
 *
 * 2. INTER-SOURCES. Le même poste est diffusé par deux partenaires, ou par
 *    deux sources — La bonne alternance republie déjà des offres provenant de
 *    France Travail et de ses propres partenaires. Là, aucun identifiant n’est
 *    commun : il faut une empreinte fondée sur ce que l’offre décrit, pas sur
 *    la façon dont elle est transmise.
 *
 * L’empreinte retenue est « intitulé normalisé + employeur + ville ». Elle est
 * volontairement un peu large : deux postes réellement distincts chez le même
 * employeur, dans la même ville, avec le même intitulé, sont indiscernables
 * pour un candidat de toute façon.
 */

import type { Offer } from './offer';
import { fold } from './taxonomy';

/**
 * Priorité des sources en cas de doublon. La source la plus riche et la plus
 * fiable gagne : La bonne alternance fournit la date d’expiration et le niveau
 * de diplôme, ce que France Travail ne donne pas.
 */
const SOURCE_PRIORITY: Record<string, number> = {
  lba: 3,
  'france-travail': 2,
  exemple: 1,
};

export interface DedupeReport {
  offers: Offer[];
  /** Doublons retirés sur identifiant identique. */
  exactDuplicates: number;
  /** Doublons retirés sur empreinte, donc venant de diffusions différentes. */
  crossDuplicates: number;
}

export function fingerprint(offer: Offer): string {
  const employer = offer.employer.siret ?? fold(offer.employer.name ?? '');
  const city = offer.place.citySlug ?? fold(offer.place.city ?? '');
  return [fold(offer.title), employer, city].join('|');
}

export function dedupe(offers: readonly Offer[]): DedupeReport {
  const byId = new Map<string, Offer>();
  let exactDuplicates = 0;

  for (const offer of offers) {
    const existing = byId.get(offer.id);
    if (!existing) {
      byId.set(offer.id, offer);
      continue;
    }
    exactDuplicates += 1;
    byId.set(offer.id, preferred(existing, offer));
  }

  const byFingerprint = new Map<string, Offer>();
  let crossDuplicates = 0;

  for (const offer of byId.values()) {
    const key = fingerprint(offer);
    const existing = byFingerprint.get(key);
    if (!existing) {
      byFingerprint.set(key, offer);
      continue;
    }
    crossDuplicates += 1;
    byFingerprint.set(key, preferred(existing, offer));
  }

  return {
    offers: [...byFingerprint.values()],
    exactDuplicates,
    crossDuplicates,
  };
}

/**
 * Entre deux offres jugées identiques, laquelle garder.
 *
 * L’ordre des critères compte : la source d’abord (elle détermine la richesse
 * des champs), puis la fraîcheur, puis — pour que le résultat soit déterministe
 * et donc testable — l’identifiant.
 */
function preferred(a: Offer, b: Offer): Offer {
  const priorityA = SOURCE_PRIORITY[a.source.id] ?? 0;
  const priorityB = SOURCE_PRIORITY[b.source.id] ?? 0;
  if (priorityA !== priorityB) return priorityA > priorityB ? a : b;

  const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  if (dateA !== dateB) return dateA > dateB ? a : b;

  return a.id <= b.id ? a : b;
}
