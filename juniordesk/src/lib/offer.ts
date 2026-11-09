import type { ExperienceSignal } from './seniority';
/**
 * Modèle d’offre NORMALISÉ.
 *
 * Aucune source n’apparaît ici. C’est le point de l’exercice : La bonne
 * alternance, France Travail et une éventuelle page carrière ne décrivent pas
 * une offre de la même façon, et le reste du site ne doit pas avoir à le
 * savoir. Chaque adaptateur produit du `Offer`, et seul l’adaptateur connaît
 * les bizarreries de sa source.
 *
 * Conséquence pratique : ajouter une source ne touche jamais une page.
 */

/** Type de contrat, unifié entre sources. */
export type ContractKind =
  | 'apprentissage'
  | 'professionnalisation'
  /** Pas encore produit par une source active — voir `brand.scope`. */
  | 'stage'
  | 'cdi'
  | 'cdd';

export type RemoteKind = 'onsite' | 'remote' | 'hybrid';

export interface OfferSource {
  /** Identifiant de l’adaptateur (`lba`, `france-travail`, `exemple`). */
  id: string;
  label: string;
  /** Partenaire d’origine tel que la source le nomme. Sert au dédoublonnage. */
  partnerLabel: string;
  /** Identifiant de l’offre CHEZ le partenaire. Sert au dédoublonnage. */
  partnerJobId: string;
}

export interface OfferEmployer {
  name: string | null;
  /** Enseigne commerciale quand elle diffère de la raison sociale. */
  brand: string | null;
  siret: string | null;
  website: string | null;
  size: string | null;
}

export interface OfferPlace {
  /** Adresse telle que fournie, pour l’affichage. */
  address: string;
  city: string | null;
  /** Forme URL de la ville (`paris`, `neuilly-sur-seine`). */
  citySlug: string | null;
  postalCode: string | null;
  /** Code département sur deux ou trois caractères (`75`, `974`). */
  departement: string | null;
  lat: number | null;
  lon: number | null;
}

export interface OfferContract {
  kinds: ContractKind[];
  /** Date de début au format ISO (AAAA-MM-JJ), ou null si non précisée. */
  start: string | null;
  startIsFlexible: boolean;
  durationMonths: number | null;
  remote: RemoteKind | null;
}

export interface Offer {
  /**
   * Identifiant stable, dérivé de la source et de l’identifiant partenaire.
   * Stable d’une collecte à l’autre : c’est ce qui permet de reconnaître une
   * offre déjà vue et donc de ne pas la renvoyer dans les alertes.
   */
  id: string;
  /** Forme URL, stable elle aussi : `alternance-analyste-credit-paris-a1b2c3`. */
  slug: string;
  title: string;
  description: string;
  /** Lien de candidature CHEZ l’employeur. Jamais une page de JuniorDesk. */
  applyUrl: string;

  source: OfferSource;
  employer: OfferEmployer;
  place: OfferPlace;
  contract: OfferContract;

  /** Familles de métiers (slugs de `taxonomy.ts`). Au moins une. */
  families: string[];
  /** Codes ROME portés par l’offre, tels que la source les donne. */
  romeCodes: string[];
  /** Niveau de diplôme visé, libellé brut de la source. */
  targetDiploma: string | null;

  /**
   * Ce que la source dit de l'expérience attendue.
   *
   * Sert à deux choses : décider, à la collecte, si un CDI ou un CDD est
   * vraiment un poste d'entrée (`assessSeniority` dans `seniority.ts`), et
   * l'afficher au candidat — « débutant accepté » est l'information qu'il
   * cherche en premier. Les sources d'alternance n'en disent rien et portent
   * `NO_EXPERIENCE_SIGNAL`.
   */
  experience: ExperienceSignal;

  /** Dates ISO complètes. */
  publishedAt: string | null;
  expiresAt: string | null;
  collectedAt: string;
}

/**
 * Offre telle qu’exposée au navigateur.
 *
 * `applyUrl` en est retiré volontairement : les liens de candidature passent
 * par `/go/[id]`, sans quoi les clics ne peuvent pas être comptés côté
 * serveur. Le champ reste accessible côté serveur pour la redirection.
 */
export type PublicOffer = Omit<Offer, 'applyUrl'>;

export function toPublicOffer(offer: Offer): PublicOffer {
  const { applyUrl: _applyUrl, ...rest } = offer;
  return rest;
}

/** Libellés d’affichage des types de contrat. */
export const CONTRACT_LABELS: Record<ContractKind, string> = {
  apprentissage: 'Apprentissage',
  professionnalisation: 'Professionnalisation',
  stage: 'Stage',
  cdi: 'CDI',
  cdd: 'CDD',
};

export const REMOTE_LABELS: Record<RemoteKind, string> = {
  onsite: 'Sur site',
  remote: 'À distance',
  hybrid: 'Hybride',
};

/**
 * Une offre est-elle encore à afficher ?
 *
 * Deux garde-fous distincts : la source peut marquer une offre pourvue
 * (`status`, traité dans l’adaptateur) et une offre peut simplement avoir
 * dépassé sa date d’expiration. Le second cas arrive sans que la source ne
 * change quoi que ce soit, donc il doit être vérifié à chaque lecture et pas
 * seulement à la collecte.
 */
export function isLive(offer: Offer, now: Date = new Date()): boolean {
  if (!offer.expiresAt) return true;
  const expires = Date.parse(offer.expiresAt);
  if (Number.isNaN(expires)) return true;
  return expires > now.getTime();
}

/* ---------------------------------------------------------------------------
 * Familles de contrat : stage / alternance / junior
 * ---------------------------------------------------------------------------
 * C'est la dimension que comprend un candidat, et celle qu'il veut filtrer.
 * « Apprentissage » et « professionnalisation » sont deux contrats distincts
 * pour un juriste et une seule et même chose pour un étudiant qui cherche une
 * alternance ; « CDI » et « CDD » juniors sont un premier poste.
 *
 * On garde donc `ContractKind` comme vérité des données — c'est ce que les
 * sources fournissent — et `ContractGroup` comme dimension d'affichage et de
 * filtrage. Mélanger les deux conduirait à des filtres qui mentent.
 */

export type ContractGroup = 'stage' | 'alternance' | 'junior';

export const CONTRACT_GROUPS: readonly ContractGroup[] = ['stage', 'alternance', 'junior'];

export const CONTRACT_GROUP_LABELS: Record<ContractGroup, string> = {
  stage: 'Stage',
  alternance: 'Alternance',
  junior: 'Poste junior',
};

/**
 * Pluriels écrits à la main.
 *
 * Ajouter un « s » au libellé singulier donnerait « poste juniors ». Un site
 * qui s'adresse à des étudiants et qui écrit mal le nom de ce qu'il vend part
 * avec un handicap qu'aucune fonctionnalité ne rattrape.
 */
export const CONTRACT_GROUP_PLURALS: Record<ContractGroup, string> = {
  stage: 'stages',
  alternance: 'alternances',
  junior: 'postes juniors',
};

/**
 * Un CDI ou un CDD est rangé dans « poste junior » — et cela n'est vrai que
 * parce que les offres qui arrivent ici ont déjà été triées.
 *
 * Lu seul, ce tableau semble affirmer que tout CDI est un poste d'entrée,
 * ce qui est faux : « Directeur financier » est un CDI. La garantie est
 * ailleurs, à la collecte : `assessSeniority` (voir `seniority.ts`) écarte
 * les offres en CDI ou CDD dont rien n'établit qu'elles s'adressent à un
 * début de carrière. Les stages et les alternances, eux, portent leur niveau
 * dans leur type de contrat et ne passent pas par cette épreuve.
 *
 * Si un jour une source produit des CDI sans passer par ce tri, ce tableau
 * recommencera à mentir. C'est le seul endroit où le noter.
 */
const GROUP_BY_KIND: Record<ContractKind, ContractGroup> = {
  stage: 'stage',
  apprentissage: 'alternance',
  professionnalisation: 'alternance',
  cdi: 'junior',
  cdd: 'junior',
};

export function groupOf(kind: ContractKind): ContractGroup {
  return GROUP_BY_KIND[kind];
}

/** Familles de contrat portées par une offre, sans doublon, dans l'ordre canonique. */
export function contractGroups(offer: {
  contract: { kinds: readonly ContractKind[] };
}): ContractGroup[] {
  const groups = new Set<ContractGroup>(offer.contract.kinds.map(groupOf));
  return CONTRACT_GROUPS.filter((g) => groups.has(g));
}
