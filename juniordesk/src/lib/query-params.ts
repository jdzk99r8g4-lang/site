/**
 * Lecture des paramètres d'URL de la liste d'offres.
 *
 * Les noms sont en français (`metier`, `ville`, `contrat`, `tri`) parce qu'ils
 * sont visibles dans la barre d'adresse et indexés : une URL se lit.
 *
 * Fonction pure, sans dépendance à Next : testable directement.
 */

import type { ContractGroup } from './offer';
import { CONTRACT_GROUPS } from './offer';
import type { OfferQuery, SortKey } from './filters';
import { allFamilySlugs } from './taxonomy';
import { REGIONS } from './regions';
import { parsePageParam } from './pagination';
import { slugify } from './slug';

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORTS: readonly SortKey[] = ['recent', 'start', 'city'];

function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((v) =>
    v.split(',').map((part) => part.trim()).filter((part) => part.length > 0),
  );
}

function one(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export interface ParsedQuery {
  query: OfferQuery;
  /** Page demandée, au moins 1. Bornée plus tard, une fois le total connu. */
  page: number;
  /** Valeurs à réinjecter dans le formulaire, déjà nettoyées. */
  selected: {
    families: string[];
    groups: string[];
    cities: string[];
    regions: string[];
    q: string;
    sort: SortKey;
    startsBefore: string;
  };
}

export function parseSearchParams(params: RawSearchParams): ParsedQuery {
  const allowedFamilies = new Set(allFamilySlugs());

  const families = [...new Set(list(params['metier']).filter((f) => allowedFamilies.has(f)))];
  const groups = [
    ...new Set(
      list(params['type']).filter((g): g is ContractGroup =>
        CONTRACT_GROUPS.includes(g as ContractGroup),
      ),
    ),
  ];
  /*
   * Les villes viennent des offres du jour : aucune liste fermée à opposer.
   * On passe donc la valeur par le même `slugify` que celui qui a produit les
   * slugs, ce qui fait que « Saint-Étienne », « saint-etienne » et
   * « SAINT ETIENNE » désignent la même ville. C'est ce qui permet au champ
   * de recherche de ville d'accepter du texte tapé à la main, et pas
   * seulement un identifiant issu d'une pastille.
   */
  const cities = [
    ...new Set(
      list(params['ville'])
        .map((c) => slugify(c, 8))
        .filter((c) => /^[a-z0-9-]{2,60}$/.test(c)),
    ),
  ];

  const allowedRegions = new Set(REGIONS.map((r) => r.slug));
  const regions = [...new Set(list(params['region']).filter((r) => allowedRegions.has(r)))];

  const q = one(params['q']).slice(0, 80);
  const rawSort = one(params['tri']);
  const sort: SortKey = SORTS.includes(rawSort as SortKey) ? (rawSort as SortKey) : 'recent';

  const rawDate = one(params['debut_avant']);
  const startsBefore = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';

  /*
   * Le numéro de page n'entre pas dans `query` : il ne filtre rien, il
   * découpe le résultat. Le mélanger aux filtres ferait croire à la page
   * d'offres qu'un filtre est actif dès la page 2.
   */
  const page = parsePageParam(params['page']);

  return {
    page,
    query: {
      families,
      groups,
      cities,
      regions,
      sort,
      ...(q ? { q } : {}),
      ...(startsBefore ? { startsBefore } : {}),
    },
    selected: { families, groups, cities, regions, q, sort, startsBefore },
  };
}

/**
 * Un filtre au moins est-il actif ?
 *
 * Mutualisé parce que deux endroits en ont besoin et doivent répondre la même
 * chose : la page, pour annoncer « 8 offres sur 20 » plutôt que « 8 offres »,
 * et ses métadonnées, pour refuser l'indexation d'une combinaison de filtres.
 * Quand la liste des critères a grossi, une copie a oublié `regions` et la
 * page a affiché « 8 offres » en masquant qu'elle filtrait : une seule
 * définition évite que cela se reproduise.
 *
 * `sort` n'en fait pas partie : trier ne retire aucune offre.
 */
export function hasActiveFilters(selected: ParsedQuery['selected']): boolean {
  return (
    selected.families.length > 0 ||
    selected.groups.length > 0 ||
    selected.cities.length > 0 ||
    selected.regions.length > 0 ||
    selected.q.length > 0 ||
    selected.startsBefore.length > 0
  );
}
