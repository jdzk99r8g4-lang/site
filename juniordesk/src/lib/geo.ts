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
  let beforePostal = '';
  POSTAL.lastIndex = 0;
  for (let match = POSTAL.exec(cleaned); match !== null; match = POSTAL.exec(cleaned)) {
    postalCode = match[1] ?? null;
    afterPostal = cleaned.slice(match.index + match[0].length);
    beforePostal = cleaned.slice(0, match.index);
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

  /*
   * Si rien d'exploitable ne suit le code postal, la ville est peut-être
   * AVANT lui. Mesuré : « Paris 75008 », « Lyon (69003) » et « Neuilly-sur-
   * Seine (92200), France » ne donnaient aucune ville, donc des offres
   * absentes du filtre par ville et des pages de ville. Ce sont des graphies
   * courantes, et c'est exactement celle que produit l'adaptateur France
   * Travail quand il met bout à bout le libellé du lieu et le code postal.
   */
  const city = (firstSegment ? tidyCity(firstSegment) : null) ?? cityBeforePostal(beforePostal);

  return {
    city,
    citySlug: city ? citySlug(city) : null,
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
    // Un code postal égaré dans le nom (« Paris 75008 » saisi dans un filtre).
    .replace(/\b\d{5}\b/g, ' ')
    // « 75 - PARIS 08 » : le département en préfixe, à la façon de France Travail.
    .replace(/^\s*(\d{2,3}|2[ab])\s*[-–]\s*/i, '')
    .replace(/[(),.;\s]+$/g, '')
    .replace(/^[(),.;\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (city.length === 0 || city.length > 60) return null;
  // Un nom de ville sans aucune lettre n’est pas un nom de ville.
  if (!/[a-zA-ZÀ-ÿ]/.test(city)) return null;

  /*
   * « PARIS 02 », « Paris 2e » et « PARIS 8E ARRONDISSEMENT » désignent Paris.
   *
   * La dernière forme n'était pas reconnue — le numéro n'y est pas en fin de
   * chaîne — et c'est pourtant la graphie officielle des arrondissements.
   * Paris éclatait en vingt « villes », Lyon en neuf, Marseille en seize, et
   * le filtre « Paris » ne trouvait aucune des offres ainsi libellées.
   */
  city = city
    .replace(/\s+\d{1,2}\s*(er|e|eme|ème|ième)?(\s+arr(ondissement|dt)?\.?)?$/i, '')
    .trim();

  /*
   * « ST ETIENNE » est la graphie postale de Saint-Étienne. Sans la
   * développer, la même commune existe deux fois : « st-etienne » et
   * « saint-etienne », chacune avec la moitié des offres.
   */
  const expanded = city.replace(/\bste\b\.?/gi, 'Sainte').replace(/\bst\b\.?/gi, 'Saint');
  if (expanded !== city) {
    /*
     * La graphie postale n'a pas non plus de traits d'union (« ST MAUR DES
     * FOSSES »), alors que ces communes s'écrivent toutes avec. On les
     * rétablit, en laissant son espace à l'article initial : « Le Pré-Saint-
     * Gervais ». Uniquement quand on vient de développer l'abréviation — on ne
     * touche pas à un nom que la source a écrit en toutes lettres.
     */
    city = expanded.replace(/\s+/g, '-').replace(/^(le|la|les)-/i, '$1 ');
  }

  /*
   * La Défense n'est pas une commune : c'est un quartier à cheval sur
   * Puteaux, Courbevoie et Nanterre. « Puteaux La Défense » est donc Puteaux,
   * et « Paris La Défense » — la graphie des adresses Cedex — est La Défense,
   * surtout pas Paris : le code postal est en 92.
   */
  const defense = /^(?:(.+?)\s*[-–]?\s*)?(?:paris\s+)?la\s+d[ée]fense$/i.exec(city);
  if (defense) {
    const commune = (defense[1] ?? '').replace(/[-–\s]+$/g, '').trim();
    city = commune && !/^paris$/i.test(commune) ? commune : 'La Défense';
  }

  if (city.length === 0) return null;
  return titleCase(city);
}

/**
 * Mots qui trahissent une voie ou un bâtiment plutôt qu'une commune.
 *
 * Sert au repli « la ville est avant le code postal » : dans « 12 rue de la
 * Paix 75002 », ce qui précède le code n'est pas une ville, et en faire une
 * créerait une page « Alternance à 12 Rue de la Paix ».
 */
const NOT_A_CITY =
  /\b(rue|avenue|av|boulevard|bd|place|chemin|allee|allée|impasse|quai|cours|route|square|passage|esplanade|parvis|tour|immeuble|batiment|bâtiment|zone|zac|za|zi|bp|cs)\b/i;

function cityBeforePostal(before: string): string | null {
  const segment = before
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .pop();
  if (!segment) return null;

  const candidate = tidyCity(segment);
  if (!candidate) return null;

  // Mieux vaut aucune ville qu'une fausse : au moindre doute, on renonce.
  if (/\d/.test(candidate)) return null;
  if (NOT_A_CITY.test(candidate)) return null;
  if (candidate.split(/\s+/).length > 5) return null;

  return candidate;
}

/**
 * Forme URL d'une ville. UNE seule définition, pour les offres comme pour la
 * saisie du visiteur.
 *
 * Elles en avaient deux : six mots au plus d'un côté, huit de l'autre. Une
 * commune de sept mots recevait donc un slug tronqué à la collecte et un slug
 * entier dans le filtre, et ne pouvait jamais être trouvée.
 */
export function citySlug(city: string): string {
  return slugify(city, 8);
}

/**
 * Slug d'une ville telle qu'un visiteur la tape.
 *
 * Passe par le même nettoyage que les adresses des offres : c'est ce qui fait
 * que « paris 8e », « Paris 75008 » et « St Etienne » trouvent ce que
 * l'utilisateur veut dire, au lieu de chercher une ville « paris-8e » qui
 * n'existe pas.
 */
export function citySlugFromInput(input: string): string | null {
  const city = tidyCity(input);
  if (!city) return null;
  const slug = citySlug(city);
  return slug.length > 0 ? slug : null;
}

/**
 * Lieu donné sous la forme « 75 - PARIS 08 », sans code postal.
 *
 * C'est la forme du libellé de lieu chez France Travail, d'après ce qui était
 * documenté avant la fermeture de l'API — non vérifiable contre une réponse
 * réelle aujourd'hui. Un libellé qui n'a pas cette forme rend simplement un
 * lieu vide.
 */
export function parseDepartementLabel(label: string | null | undefined): ParsedPlace {
  const empty: ParsedPlace = { city: null, citySlug: null, postalCode: null, departement: null };
  if (!label) return empty;

  const match = /^\s*(\d{2,3}|2[ab])\s*[-–]\s*(.+)$/i.exec(label);
  if (!match) {
    // Pas de préfixe : le libellé est peut-être la ville seule.
    const city = tidyCity(label);
    return city && !/\d/.test(city) && !NOT_A_CITY.test(city)
      ? { ...empty, city, citySlug: citySlug(city) }
      : empty;
  }

  const departement = (match[1] ?? '').toUpperCase();
  const city = tidyCity(match[2] ?? '');
  return {
    city,
    citySlug: city ? citySlug(city) : null,
    postalCode: null,
    // « 2A » et « 2B » sont ramenés à « 20 », comme pour un code postal corse.
    departement: /^2[AB]$/.test(departement) ? '20' : departement,
  };
}

/**
 * Met un nom de commune en forme.
 *
 * Deux défauts mesurés sur de vrais noms : l'article initial restait en
 * minuscule — « le Havre », « la Rochelle », « les Ulis », donc des titres de
 * page « Alternance finance à le Havre » — et l'élision était capitalisée du
 * mauvais côté : « Villeneuve D'ascq », « L'isle Adam ».
 */
function titleCase(text: string): string {
  const lowerWords = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'sur', 'sous', 'en', 'et', 'aux', 'au', 'lès', 'd', 'l']);
  const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  let first = true;

  return text
    .toLowerCase()
    .split(/([\s-])/)
    .map((part) => {
      if (/^[\s-]$/.test(part) || part.length === 0) return part;
      const isFirst = first;
      first = false;

      // « d'ascq » → « d’Ascq » ; en tête de nom, « l'isle » → « L’Isle ».
      const elision = /^([dl])['’](.+)$/.exec(part);
      if (elision) {
        const article = elision[1] ?? '';
        return `${isFirst ? article.toUpperCase() : article}’${capitalize(elision[2] ?? '')}`;
      }

      // Le premier mot prend toujours la majuscule, article compris.
      if (!isFirst && lowerWords.has(part)) return part;
      return capitalize(part);
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
