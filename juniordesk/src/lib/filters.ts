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
  const needle = query.q ? normalize(query.q) : null;

  const filtered = offers.filter((offer) => {
    // Une offre expirée ne doit jamais apparaître, quels que soient les
    // filtres. Vérifié à la lecture et pas seulement à la collecte : une offre
    // peut expirer entre deux collectes.
    if (!isLive(offer, now)) return false;

    if (families.size > 0 && !offer.families.some((f) => families.has(f))) return false;
    if (groups.size > 0 && !contractGroups(offer).some((g) => groups.has(g))) return false;
    if (cities.size > 0 && (!offer.place.citySlug || !cities.has(offer.place.citySlug))) return false;

    if (regions.size > 0) {
      const region = regionOf(offer.place.departement);
      if (!region || !regions.has(region.slug)) return false;
    }

    if (query.startsAfter || query.startsBefore) {
      // Une offre sans date de début annoncée reste visible : l’écarter
      // reviendrait à punir le candidat pour une imprécision de l’employeur.
      if (offer.contract.start) {
        if (query.startsAfter && offer.contract.start < query.startsAfter) return false;
        if (query.startsBefore && offer.contract.start > query.startsBefore) return false;
      }
    }

    if (needle) {
      const haystack = normalize(
        [offer.title, offer.employer.name ?? '', offer.employer.brand ?? '', offer.place.city ?? ''].join(' '),
      );
      if (!haystack.includes(needle)) return false;
    }

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
      return copy.sort((a, b) => {
        const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return right - left || tieBreak(a, b);
      });
  }
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

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
