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
 * L’empreinte retenue est « intitulé nettoyé + employeur nettoyé + ville +
 * famille de contrat ». Elle est volontairement un peu large : deux postes
 * réellement distincts chez le même employeur, dans la même ville, avec le
 * même intitulé et le même type de contrat, sont indiscernables pour un
 * candidat de toute façon.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi « nettoyé », et pas seulement « en minuscules »
 * ---------------------------------------------------------------------------
 * Une première version comparait les intitulés bruts, à la casse et aux
 * accents près. Mesuré sur des variantes réalistes du même poste, elle
 * reconnaissait « analyste m&a » mais pas :
 *
 *     Analyste M&A (H/F)              ← la mention est sur une grande part
 *                                       des annonces françaises
 *     Alternance - Analyste M&A       ← le type de contrat en préfixe
 *     Analyste M&A - Paris            ← la ville répétée dans l’intitulé
 *     Conseil Exemple SAS             ← la forme juridique de l’employeur
 *
 * Autrement dit : elle tenait tant qu’une seule source alimentait le site, et
 * cédait au premier jour où deux sites décrivent le même poste — c’est-à-dire
 * exactement le cas qu’elle est censée traiter.
 *
 * La FAMILLE DE CONTRAT entre dans l’empreinte pour une raison précise : une
 * fois le préfixe retiré, « Stage - Analyste M&A » et « Alternance - Analyste
 * M&A » chez le même employeur deviendraient indiscernables alors que ce sont
 * deux offres différentes. La famille les sépare à nouveau.
 *
 * ---------------------------------------------------------------------------
 * Ce qui reste hors de portée
 * ---------------------------------------------------------------------------
 * Une empreinte compare des chaînes ; elle ne comprend pas le français.
 * « Analyste Mergers & Acquisitions » et « Analyste M&A » désignent le même
 * poste et resteront deux offres. Les traiter demanderait un dictionnaire de
 * synonymes du métier, qui se tromperait dans l’autre sens — et un doublon
 * affiché coûte moins cher au candidat qu’une offre fusionnée à tort, donc
 * disparue.
 */

import type { Offer } from './offer';
import { contractGroups } from './offer';
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

/**
 * Minuscules et accents retirés, PONCTUATION CONSERVÉE.
 *
 * `fold` va plus loin et écrase la ponctuation ; c'est ce qu'il faut pour
 * comparer des mots, mais pas pour reconnaître des mentions qui tiennent
 * justement à leur ponctuation, comme « (H/F) ».
 */
function softFold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Mentions qui ne disent rien du poste et varient d’un site à l’autre.
 *
 * `(H/F)`, `H/F/X`, `F/H` et leurs variantes ponctuées sont une obligation
 * d’usage en France, pas une caractéristique de l’offre.
 */
const GENDER_MARKER = /\(?\s*\b[hf]\s*[\/·.\-]\s*[fh]\b(\s*[\/·.\-]\s*x\b)?\s*\)?/g;

/** Types de contrat écrits en tête d’intitulé. La famille les porte déjà. */
const CONTRACT_PREFIX =
  /^(?:offre\s+(?:d['’ ]\s*)?)?(?:alternance|alternant|alternante|apprentissage|apprenti|apprentie|stage|stagiaire|contrat\s+de\s+professionnalisation|professionnalisation|cdi|cdd|emploi|poste|job)\b[\s:–—\-]*/;

/** Formes juridiques, qu’un site écrit et l’autre non. */
const LEGAL_FORM = /\b(?:sas|sasu|sarl|eurl|sa|snc|sci|gie|scop|groupe|group|holding)\b/g;

/**
 * Intitulé réduit à ce qui décrit le poste.
 *
 * La ville est passée en argument pour être retirée quand elle est répétée
 * dans l’intitulé : elle figure déjà dans l’empreinte, et « Analyste M&A -
 * Paris » ne décrit pas un autre poste que « Analyste M&A ».
 */
export function normalizeTitle(title: string, city: string | null): string {
  /*
   * L'ordre compte, et il a déjà été pris en défaut : `fold` remplace TOUTE
   * ponctuation par une espace, si bien que « (H/F) » y devient « h f » et
   * qu'une expression cherchant la barre oblique ne trouvait plus rien. Les
   * mentions se retirent donc tant que la ponctuation est là, et le repliage
   * vient en dernier.
   */
  let text = softFold(title).replace(GENDER_MARKER, ' ');

  // Le préfixe peut être répété (« Offre d'alternance - Stage ... »).
  for (let i = 0; i < 3 && CONTRACT_PREFIX.test(text); i += 1) {
    text = text.replace(CONTRACT_PREFIX, '');
  }

  const softCity = city ? softFold(city) : '';
  if (softCity) {
    const escaped = softCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`[\\s:–—\\-(,]+${escaped}\\s*\\)?\\s*$`), '');
  }

  // Et seulement maintenant : toute ponctuation devient une espace, parce
  // qu'un site écrit « M&A - Paris », un autre « M&A, Paris », un troisième
  // « M&A (Paris) ».
  return text
    .replace(/[^a-z0-9&+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Nom d’employeur réduit à ce qui l’identifie. */
export function normalizeEmployer(name: string): string {
  return fold(name)
    .replace(LEGAL_FORM, ' ')
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function fingerprint(offer: Offer): string {
  /*
   * Le SIRET d’abord quand on l’a : c’est le seul identifiant d’employeur qui
   * ne dépende pas de l’orthographe du site qui diffuse l’offre.
   */
  const employer = offer.employer.siret ?? normalizeEmployer(offer.employer.name ?? '');
  const city = offer.place.citySlug ?? fold(offer.place.city ?? '');
  const groups = contractGroups(offer).join('+');
  return [normalizeTitle(offer.title, offer.place.city), employer, city, groups].join('|');
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
