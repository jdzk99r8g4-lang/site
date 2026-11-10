/**
 * Filtrage, tri et facettes de la liste d’offres.
 *
 * Tout est pur : aucune lecture de base, aucun accès réseau, aucune date
 * implicite — `now` est toujours passé. C’est ce qui rend les filtres
 * testables sans monter un serveur, et c’est aussi ce qui permet de les
 * exécuter côté serveur comme côté client sans code dupliqué.
 */

import type { ContractGroup, Offer } from './offer';
import { CONTRACT_GROUP_LABELS, CONTRACT_GROUPS, contractGroups, isLive } from './offer';
import { JOB_FAMILIES } from './taxonomy';
import { cityIndex } from './geo';
import { REGIONS, regionOf } from './regions';

export interface OfferQuery {
  /** Slugs de familles de métiers. Vide = toutes. */
  families?: readonly string[];
  /** Familles de contrat (stage / alternance / junior). Vide = toutes. */
  groups?: readonly ContractGroup[];
  /** Slugs de villes. Vide = toutes. */
  cities?: readonly string[];
  /**
   * Slugs de régions. Vide = toutes.
   *
   * Maille indispensable pour la finance : La Défense est à Puteaux et à
   * Courbevoie, pas à Paris. Qui filtre « Paris » rate ces offres ; qui
   * filtre « Île-de-France » les trouve.
   */
  regions?: readonly string[];
  /** Ne garder que les offres démarrant au plus tard à cette date (AAAA-MM-JJ). */
  startsBefore?: string;
  /** Ne garder que les offres démarrant au plus tôt à cette date (AAAA-MM-JJ). */
  startsAfter?: string;
  /** Recherche libre sur l’intitulé et l’employeur. */
  q?: string;
  sort?: SortKey;
}

export type SortKey = 'recent' | 'start' | 'city';

/** Tri appliqué quand l'URL n'en demande pas : le plus récent d'abord. */
export const DEFAULT_SORT: SortKey = 'recent';

export function applyQuery(
  offers: readonly Offer[],
  query: OfferQuery,
  now: Date = new Date(),
): Offer[] {
  const families = new Set(query.families ?? []);
  const groups = new Set(query.groups ?? []);
  const cities = new Set(query.cities ?? []);
  const regions = new Set(query.regions ?? []);
  const needles = query.q ? searchTokens(query.q) : [];

  /*
   * Régions « précisées » : celles où se trouve au moins une des villes
   * cochées. Le rattachement d'une ville à sa région se lit dans le catalogue
   * lui-même — une ville sans offre ne précise donc rien, et la région reste
   * entière, ce qui est le bon repli : on ne vide pas un résultat au nom
   * d'une ville qu'on ne sait pas situer.
   */
  const refinedRegions = new Set<string>();
  if (cities.size > 0 && regions.size > 0) {
    for (const offer of offers) {
      if (!offer.place.citySlug || !cities.has(offer.place.citySlug)) continue;
      const region = regionOf(offer.place.departement);
      if (region && regions.has(region.slug)) refinedRegions.add(region.slug);
    }
  }

  const filtered = offers.filter((offer) => {
    // Une offre expirée ne doit jamais apparaître, quels que soient les
    // filtres. Vérifié à la lecture et pas seulement à la collecte : une offre
    // peut expirer entre deux collectes.
    if (!isLive(offer, now)) return false;

    if (families.size > 0 && !offer.families.some((f) => families.has(f))) return false;
    if (groups.size > 0 && !contractGroups(offer).some((g) => groups.has(g))) return false;
    /*
     * Le lieu : une ville PRÉCISE sa région, ou S'AJOUTE à elle.
     *
     * Deux gestes différents se font avec les mêmes cases, et les deux doivent
     * marcher :
     *
     *  - « Île-de-France », puis « Puteaux » : on resserre. Le résultat est
     *    Puteaux, pas toute l'Île-de-France ;
     *  - « Île-de-France », puis « Lyon » : on élargit. Le résultat est
     *    l'Île-de-France ET Lyon.
     *
     * Une première version cumulait strictement les deux critères : le second
     * geste ne renvoyait rien, puisqu'aucune offre n'est à la fois à Lyon et
     * en Île-de-France — une page vide, sans explication. La seconde version
     * les additionnait sans distinction : c'est alors le premier geste qui ne
     * faisait plus rien, cocher Puteaux laissant les huit offres de la région.
     *
     * La règle : une région cochée compte entière, sauf si l'une des villes
     * cochées s'y trouve — elle est alors réduite à ces villes-là.
     */
    if (cities.size > 0 || regions.size > 0) {
      const inCity = offer.place.citySlug !== null && cities.has(offer.place.citySlug);
      const region = regionOf(offer.place.departement);
      const inWholeRegion =
        region !== null && regions.has(region.slug) && !refinedRegions.has(region.slug);
      if (!inCity && !inWholeRegion) return false;
    }

    if (query.startsAfter || query.startsBefore) {
      // Une offre sans date de début annoncée reste visible : l’écarter
      // reviendrait à punir le candidat pour une imprécision de l’employeur.
      if (offer.contract.start) {
        if (query.startsAfter && offer.contract.start < query.startsAfter) return false;
        if (query.startsBefore && offer.contract.start > query.startsBefore) return false;
      }
    }

    if (needles.length > 0 && !matchesSearch(offer, needles)) return false;

    return true;
  });

  return sortOffers(filtered, query.sort ?? DEFAULT_SORT);
}

export function sortOffers(offers: readonly Offer[], key: SortKey): Offer[] {
  const copy = [...offers];

  switch (key) {
    case 'start':
      // Les offres sans date de début passent après celles qui en ont une :
      // un candidat qui trie par date cherche une date.
      return copy.sort((a, b) => {
        const left = a.contract.start ?? '9999-12-31';
        const right = b.contract.start ?? '9999-12-31';
        return left.localeCompare(right) || tieBreak(a, b);
      });
    case 'city':
      return copy.sort(
        (a, b) =>
          (a.place.city ?? 'zzz').localeCompare(b.place.city ?? 'zzz', 'fr') || tieBreak(a, b),
      );
    case 'recent':
    default:
      return copy.sort((a, b) => publishedTime(b) - publishedTime(a) || tieBreak(a, b));
  }
}

/**
 * Date de publication, en millisecondes ; zéro si elle est absente ou illisible.
 *
 * Le « ou illisible » n'est pas une précaution de principe. `Date.parse`
 * renvoie `NaN` sur une date mal formée, et une comparaison qui renvoie `NaN`
 * n'est plus un ordre : le tri ne plaçait pas seulement mal l'offre fautive,
 * il rendait faux l'ordre de TOUTES les autres. Mesuré sur quatre offres dont
 * une à la date illisible : « a b c d » au lieu de « c a d b » — c'est-à-dire
 * l'ordre des identifiants, plus du tout celui des dates. Une seule date mal
 * formée dans le catalogue suffisait à ce que « les plus récentes d'abord »
 * mente à tout le monde, sans la moindre erreur.
 */
function publishedTime(offer: Offer): number {
  if (!offer.publishedAt) return 0;
  const time = Date.parse(offer.publishedAt);
  return Number.isFinite(time) ? time : 0;
}

/** Tri secondaire stable : sans lui, deux rendus successifs peuvent différer. */
function tieBreak(a: Offer, b: Offer): number {
  return a.id.localeCompare(b.id);
}

export interface Facet {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  families: Facet[];
  /**
   * Les trois familles de contrat sont TOUJOURS présentes, même à zéro.
   *
   * C'est l'exception à la règle « pas de facette vide » : masquer
   * « Stage » reviendrait à laisser croire que le site en contient et que
   * la recherche a échoué. Affichée à zéro, avec `sourced` à faux, elle dit
   * la vérité — aucune source ne fournit encore ce type de contrat.
   */
  groups: ContractGroupFacet[];
  cities: Facet[];
  /** Régions portant au moins une offre, de la plus fournie à la moins fournie. */
  regions: Facet[];
}

export interface ContractGroupFacet extends Omit<Facet, 'value'> {
  /** Resserré par rapport à `Facet` : les pages indexent des libellés par famille. */
  value: ContractGroup;
  /** Vrai si au moins une source active sait produire ce type de contrat. */
  sourced: boolean;
}

/**
 * Facettes calculées sur les offres vivantes.
 *
 * Une facette à zéro n’est pas affichée : proposer un filtre qui ne renvoie
 * rien est une impasse pour le visiteur.
 */
export function buildFacets(
  offers: readonly Offer[],
  sourcedGroups: readonly ContractGroup[],
  now: Date = new Date(),
): Facets {
  const live = offers.filter((o) => isLive(o, now));

  const familyCounts = new Map<string, number>();
  const groupCounts = new Map<ContractGroup, number>();

  for (const offer of live) {
    for (const family of offer.families) {
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    }
    for (const group of contractGroups(offer)) {
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
    }
  }

  return {
    families: JOB_FAMILIES.filter((f) => (familyCounts.get(f.slug) ?? 0) > 0).map((f) => ({
      value: f.slug,
      label: f.label,
      count: familyCounts.get(f.slug) ?? 0,
    })),
    groups: CONTRACT_GROUPS.map((group) => ({
      value: group,
      label: CONTRACT_GROUP_LABELS[group],
      count: groupCounts.get(group) ?? 0,
      sourced: sourcedGroups.includes(group),
    })),
    cities: cityIndex(live.map((o) => o.place)).map((c) => ({
      value: c.slug,
      label: c.label,
      count: c.count,
    })),
    regions: buildRegionFacets(live),
  };
}

/**
 * Facettes de région, triées par volume.
 *
 * Les régions sans offre ne sont pas listées : proposer « Mayotte » un jour
 * où il n'y a rien n'aide personne. L'ordre est celui du volume et non
 * l'alphabet, parce que l'Île-de-France concentre l'essentiel des postes en
 * finance et doit arriver en tête.
 */
function buildRegionFacets(offers: readonly Offer[]): Facet[] {
  const counts = new Map<string, number>();
  for (const offer of offers) {
    const region = regionOf(offer.place.departement);
    if (region) counts.set(region.slug, (counts.get(region.slug) ?? 0) + 1);
  }

  return REGIONS.filter((r) => (counts.get(r.slug) ?? 0) > 0)
    .map((r) => ({ value: r.slug, label: r.name, count: counts.get(r.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

/* ---------------------------------------------------------------------------
 * Recherche libre
 * ---------------------------------------------------------------------------
 * La recherche cherchait la saisie telle quelle, comme une sous-chaîne du
 * texte de l'offre. Quatre défauts mesurés en découlaient :
 *
 *  - « analyste paris » ne trouvait rien : les deux mots existent, mais pas
 *    côte à côte, l'intitulé et la ville étant séparés par l'employeur. Toute
 *    recherche de plus d'un mot échouait dès que les mots n'étaient pas
 *    contigus et dans le bon ordre ;
 *  - « M&A » trouvait « Team Analyst » : l'esperluette devenait une espace,
 *    et « m a » se lit dans « tea-M A-nalyst » ;
 *  - « it » trouvait « crédit » et « auditeur » : n'importe quel morceau de
 *    mot faisait l'affaire ;
 *  - « fusions » ne trouvait pas une offre « Analyste M&A » pourtant rangée
 *    dans la famille « Fusions-acquisitions » : le métier n'était pas cherché.
 *
 * La saisie est donc découpée en mots, et CHAQUE mot doit commencer un mot de
 * l'offre — dans n'importe quel ordre. « contr gest » trouve « Contrôleur de
 * gestion », « audit lyon » trouve un auditeur à Lyon, et « it » ne trouve
 * plus que ce qui commence par « it ».
 */

/** Minuscules, sans accent ; l'esperluette est conservée. */
function searchFold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Mots d'un texte.
 *
 * « M & A » et « M&A » doivent donner le même mot, donc l'esperluette est
 * d'abord resserrée. Mais « Fusions & Acquisitions » doit aussi se trouver en
 * cherchant « acquisitions » : le texte d'une offre est donc découpé sous les
 * deux formes, resserrée et séparée.
 */
function wordsOf(text: string, both: boolean): string[] {
  const folded = searchFold(text);
  const split = (t: string) => t.replace(/[^a-z0-9&]+/g, ' ').trim().split(' ').filter(Boolean);
  const compact = split(folded.replace(/\s*&\s*/g, '&'));
  if (!both) return compact;
  return [...new Set([...compact, ...split(folded.replace(/&/g, ' '))])];
}

/**
 * Mots de la saisie.
 *
 * Un mot d'une seule lettre est ignoré : il commencerait la moitié du
 * catalogue et ne filtrerait rien d'utile.
 */
export function searchTokens(q: string): string[] {
  return wordsOf(q, false).filter((token) => token.length >= 2);
}

function matchesSearch(offer: Offer, tokens: readonly string[]): boolean {
  /*
   * Le libellé des familles fait partie du texte cherché : une offre
   * « Analyste LBO » doit sortir quand on cherche « private equity », parce
   * que c'est ainsi que le site lui-même la range.
   */
  const familyLabels = offer.families.map(
    (slug) => JOB_FAMILIES.find((f) => f.slug === slug)?.label ?? '',
  );

  const words = wordsOf(
    [
      offer.title,
      offer.employer.name ?? '',
      offer.employer.brand ?? '',
      offer.place.city ?? '',
      ...familyLabels,
    ].join(' '),
    true,
  );

  return tokens.every((token) => words.some((word) => word.startsWith(token)));
}
