/**
 * Lieu de travail : extraction de la ville et du département.
 *
 * La source ne fournit pas de champ « ville ». Elle fournit une adresse en une
 * seule chaîne (`workplace.location.address`), rédigée par l’employeur, du
 * genre « 12 rue de la Paix 75002 Paris » — avec toutes les variantes qu’on
 * imagine. Il faut donc en extraire ce dont les filtres et les pages SEO ont
 * besoin, sans jamais inventer : si l’adresse ne permet pas de conclure, les
 * champs restent `null` et l’offre reste affichable, simplement absente des
 * pages par ville.
 */

import { slugify } from './slug';

export interface ParsedPlace {
  city: string | null;
  citySlug: string | null;
  postalCode: string | null;
  departement: string | null;
}

/**
 * Code postal français : cinq chiffres.
 *
 * On le cherche de préférence le plus loin possible dans la chaîne, là où il
 * se trouve dans une adresse correctement rédigée, pour ne pas confondre avec
 * un numéro de voie à cinq chiffres.
 */
const POSTAL = /\b(\d{5})\b/g;

export function parseAddress(address: string | null | undefined): ParsedPlace {
  const empty: ParsedPlace = { city: null, citySlug: null, postalCode: null, departement: null };
  if (!address) return empty;

  const cleaned = address.replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return empty;

  // Dernière occurrence : « 12 rue 12345 Ville » doit donner 12345, pas 12.
  let postalCode: string | null = null;
  let afterPostal = '';
  POSTAL.lastIndex = 0;
  for (let match = POSTAL.exec(cleaned); match !== null; match = POSTAL.exec(cleaned)) {
    postalCode = match[1] ?? null;
    afterPostal = cleaned.slice(match.index + match[0].length);
  }

  if (!postalCode) return empty;

  /*
   * Ce qui suit le code postal est la ville, éventuellement suivie du pays ou
   * d'une mention de service. On ne garde que le premier segment : « Lyon,
   * France » donne « Lyon », et non rien du tout — c'était le défaut que le
   * test `retire le pays` a mis au jour.
   */
  const firstSegment = afterPostal
    .split(/[,;]/)
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  const city = firstSegment ? tidyCity(firstSegment) : null;

  return {
    city,
    citySlug: city ? slugify(city, 6) : null,
    postalCode,
    departement: departementFromPostal(postalCode),
  };
}

/**
 * Nettoie un nom de ville : retire le pays, les mentions de bâtiment et les
 * arrondissements accolés, met en forme la casse.
 */
function tidyCity(raw: string): string | null {
  let city = raw
    .replace(/\b(france|fr)\b\.?$/i, '')
    .replace(/\bcedex\b.*$/i, '')
    .replace(/[(),.;]+$/g, '')
    .trim();

  if (city.length === 0 || city.length > 60) return null;
  // Un nom de ville sans aucune lettre n’est pas un nom de ville.
  if (!/[a-zA-ZÀ-ÿ]/.test(city)) return null;

  // « PARIS 02 » et « Paris 2e » désignent Paris.
  city = city.replace(/\s+\d{1,2}(er|e|eme|ème)?$/i, '').trim();

  return titleCase(city);
}

function titleCase(text: string): string {
  const lowerWords = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'sur', 'sous', 'en', 'et', 'aux', 'au', 'lès', 'd', 'l']);
  return text
    .toLowerCase()
    .split(/([\s-])/)
    .map((part) => {
      if (/^[\s-]$/.test(part) || part.length === 0) return part;
      if (lowerWords.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Département déduit du code postal.
 *
 * Deux chiffres en métropole, trois en outre-mer (97x, 98x). La Corse est
 * renvoyée telle quelle (« 20 ») : départager 2A et 2B demande la commune
 * exacte, et une erreur de rattachement serait pire qu’une absence de
 * précision.
 */
export function departementFromPostal(postalCode: string): string | null {
  if (!/^\d{5}$/.test(postalCode)) return null;
  const prefix2 = postalCode.slice(0, 2);
  if (prefix2 === '97' || prefix2 === '98') return postalCode.slice(0, 3);
  return prefix2;
}

/** Regroupe des villes par slug, en conservant la graphie la plus fréquente. */
export function cityIndex(
  places: readonly { city: string | null; citySlug: string | null }[],
): { slug: string; label: string; count: number }[] {
  const counts = new Map<string, Map<string, number>>();

  for (const place of places) {
    if (!place.citySlug || !place.city) continue;
    const byLabel = counts.get(place.citySlug) ?? new Map<string, number>();
    byLabel.set(place.city, (byLabel.get(place.city) ?? 0) + 1);
    counts.set(place.citySlug, byLabel);
  }

  const result: { slug: string; label: string; count: number }[] = [];
  for (const [slug, byLabel] of counts) {
    let label = '';
    let best = 0;
    let total = 0;
    for (const [candidate, n] of byLabel) {
      total += n;
      if (n > best) {
        best = n;
        label = candidate;
      }
    }
    result.push({ slug, label, count: total });
  }

  return result.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}
