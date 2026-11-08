/**
 * Decoupage administratif France : departements et regions.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi une region, alors qu'on a deja la ville
 * ---------------------------------------------------------------------------
 * Parce que la ville seule est la mauvaise maille pour la finance en France.
 * La Defense n'est pas a Paris : elle est a Puteaux, a Courbevoie et a
 * Nanterre. Un etudiant qui filtre « Paris » rate donc une grande partie des
 * postes du secteur, sans jamais comprendre pourquoi.
 *
 * La region regle ce cas, et un deuxieme : la liste des villes vient des
 * offres du jour, pas d'un referentiel. Elle peut donc compter plusieurs
 * centaines d'entrees et devenir illisible. Les dix-huit regions, elles, sont
 * fixes et tiennent a l'ecran.
 *
 * ---------------------------------------------------------------------------
 * Provenance
 * ---------------------------------------------------------------------------
 * Table produite a partir de l'API Geo de l'Etat (geo.api.gouv.fr), seule
 * source faisant autorite pour ce decoupage :
 *
 *   GET https://geo.api.gouv.fr/departements?fields=code,nom,codeRegion
 *   GET https://geo.api.gouv.fr/regions?fields=code,nom
 *
 * 101 departements, 18 regions. Aucun code n'a ete ecrit de memoire, et
 * tests/regions.test.ts verifie que le compte y est et qu'aucun departement
 * n'est orphelin.
 *
 * Les collectivites d'outre-mer qui ne sont pas des departements
 * (Saint-Pierre-et-Miquelon, Polynesie francaise, Nouvelle-Caledonie...) n'y
 * figurent pas : regionOf() renvoie null pour elles, et l'offre reste
 * affichee, simplement absente des filtres par region.
 */

export interface Region {
  /** Code INSEE de la region. */
  code: string;
  name: string;
  /** Forme URL, utilisee dans /regions/[region]. */
  slug: string;
}

/** Les dix-huit regions, par ordre alphabetique. */
export const REGIONS: readonly Region[] = [
  { code: '84', name: 'Auvergne-Rhône-Alpes', slug: 'auvergne-rhone-alpes' },
  { code: '27', name: 'Bourgogne-Franche-Comté', slug: 'bourgogne-franche-comte' },
  { code: '53', name: 'Bretagne', slug: 'bretagne' },
  { code: '24', name: 'Centre-Val de Loire', slug: 'centre-val-de-loire' },
  { code: '94', name: 'Corse', slug: 'corse' },
  { code: '44', name: 'Grand Est', slug: 'grand-est' },
  { code: '01', name: 'Guadeloupe', slug: 'guadeloupe' },
  { code: '03', name: 'Guyane', slug: 'guyane' },
  { code: '32', name: 'Hauts-de-France', slug: 'hauts-de-france' },
  { code: '04', name: 'La Réunion', slug: 'la-reunion' },
  { code: '02', name: 'Martinique', slug: 'martinique' },
  { code: '06', name: 'Mayotte', slug: 'mayotte' },
  { code: '28', name: 'Normandie', slug: 'normandie' },
  { code: '75', name: 'Nouvelle-Aquitaine', slug: 'nouvelle-aquitaine' },
  { code: '76', name: 'Occitanie', slug: 'occitanie' },
  { code: '52', name: 'Pays de la Loire', slug: 'pays-de-la-loire' },
  { code: '93', name: 'Provence-Alpes-Côte d\'Azur', slug: 'provence-alpes-cote-d-azur' },
  { code: '11', name: 'Île-de-France', slug: 'ile-de-france' },
];

/** Departement (code INSEE) vers code de region. */
const REGION_BY_DEPARTEMENT: Readonly<Record<string, string>> = {
  '01': '84',
  '02': '32',
  '03': '84',
  '04': '93',
  '05': '93',
  '06': '93',
  '07': '84',
  '08': '44',
  '09': '76',
  '10': '44',
  '11': '76',
  '12': '76',
  '13': '93',
  '14': '28',
  '15': '84',
  '16': '75',
  '17': '75',
  '18': '24',
  '19': '75',
  '21': '27',
  '22': '53',
  '23': '75',
  '24': '75',
  '25': '27',
  '26': '84',
  '27': '28',
  '28': '24',
  '29': '53',
  '2A': '94',
  '2B': '94',
  '30': '76',
  '31': '76',
  '32': '76',
  '33': '75',
  '34': '76',
  '35': '53',
  '36': '24',
  '37': '24',
  '38': '84',
  '39': '27',
  '40': '75',
  '41': '24',
  '42': '84',
  '43': '84',
  '44': '52',
  '45': '24',
  '46': '76',
  '47': '75',
  '48': '76',
  '49': '52',
  '50': '28',
  '51': '44',
  '52': '44',
  '53': '52',
  '54': '44',
  '55': '44',
  '56': '53',
  '57': '44',
  '58': '27',
  '59': '32',
  '60': '32',
  '61': '28',
  '62': '32',
  '63': '84',
  '64': '75',
  '65': '76',
  '66': '76',
  '67': '44',
  '68': '44',
  '69': '84',
  '70': '27',
  '71': '27',
  '72': '52',
  '73': '84',
  '74': '84',
  '75': '11',
  '76': '28',
  '77': '11',
  '78': '11',
  '79': '75',
  '80': '32',
  '81': '76',
  '82': '76',
  '83': '93',
  '84': '93',
  '85': '52',
  '86': '75',
  '87': '75',
  '88': '44',
  '89': '27',
  '90': '27',
  '91': '11',
  '92': '11',
  '93': '11',
  '94': '11',
  '95': '11',
  '971': '01',
  '972': '02',
  '973': '03',
  '974': '04',
  '976': '06',
};

const REGION_BY_CODE: ReadonlyMap<string, Region> = new Map(REGIONS.map((r) => [r.code, r]));
const REGION_BY_SLUG: ReadonlyMap<string, Region> = new Map(REGIONS.map((r) => [r.slug, r]));

/**
 * Region d'un departement, ou null.
 *
 * La Corse merite un mot : departementFromPostal() renvoie « 20 » parce que
 * departager 2A et 2B demande la commune exacte. Les deux appartenant a la
 * meme region, on peut conclure quand meme — c'est traite explicitement
 * ci-dessous plutot que laisse au hasard.
 */
export function regionOf(departement: string | null | undefined): Region | null {
  if (!departement) return null;
  if (departement === '20') {
    const corse = REGION_BY_DEPARTEMENT['2A'];
    return corse ? (REGION_BY_CODE.get(corse) ?? null) : null;
  }
  const code = REGION_BY_DEPARTEMENT[departement];
  return code ? (REGION_BY_CODE.get(code) ?? null) : null;
}

export function regionBySlug(slug: string): Region | undefined {
  return REGION_BY_SLUG.get(slug);
}

/** Nombre de departements rattaches, pour les controles de coherence. */
export function departementCount(): number {
  return Object.keys(REGION_BY_DEPARTEMENT).length;
}
