/**
 * Périmètre finance de JuniorDesk.
 *
 * ---------------------------------------------------------------------------
 * Provenance des codes
 * ---------------------------------------------------------------------------
 * Les codes ci-dessous sont repris du Répertoire Opérationnel des Métiers et
 * des Emplois (ROME) de France Travail, **version 4.0 v62, publiée le
 * 19/10/2026**, diffusée en open data sous Licence Ouverte :
 *
 *   https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome
 *
 * Ils n’ont pas été écrits de mémoire : chaque code a été relevé dans le
 * fichier `unix_referentiel_code_rome_v462.json` du référentiel officiel, et
 * `tests/taxonomy.test.ts` vérifie que leur forme est valide, qu’aucun code
 * n’est affecté à deux familles, et qu’aucun code explicitement exclu ne s’est
 * glissé dans une famille.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi ROME ne suffit pas
 * ---------------------------------------------------------------------------
 * ROME décrit des métiers, pas des secteurs, et il est plus grossier que le
 * vocabulaire de la finance : il n’existe pas de code « M&A » distinct de
 * « gestion d’actifs », et une alternance en salle des marchés peut très bien
 * être codée « M1203 Comptable » par un employeur pressé.
 *
 * D’où deux portes d’entrée, et une porte de sortie :
 *
 *   1. le code ROME de l’offre appartient à une famille          -> retenue
 *   2. sinon, l’intitulé contient un terme franchement financier -> retenue
 *   3. dans les deux cas, un terme d’exclusion disqualifie       -> écartée
 *
 * La règle 3 n’est pas un détail : « assurance qualité » contient
 * « assurance », et « audit énergétique » contient « audit ». Sans liste
 * d’exclusions, un site d’offres finance se remplit de postes d’usine.
 */

export interface JobFamily {
  /** Forme URL, utilisée dans /metiers/[metier]. Ne jamais la changer : elle est indexée. */
  slug: string;
  label: string;
  /** Phrase d’introduction de la page SEO du métier. */
  intro: string;
  /** Codes ROME 4.0 rattachés à cette famille. */
  romeCodes: readonly string[];
}

/**
 * Les neuf familles du périmètre.
 *
 * L’ordre est celui d’affichage : du plus gros gisement d’alternance au plus
 * étroit.
 */
export const JOB_FAMILIES: readonly JobFamily[] = [
  {
    slug: 'banque-credit',
    label: 'Banque et crédit',
    intro:
      'Réseau d’agence, clientèle de particuliers et de professionnels, analyse ' +
      'de crédit, gestion de patrimoine. C’est le gisement d’alternance le plus ' +
      'large du secteur financier.',
    romeCodes: [
      'C1201', 'C1202', 'C1203', 'C1204', 'C1205', 'C1206', 'C1207', 'C1208',
      'C1209', 'C1210', 'C1211', 'C1212', 'C1213', 'C1214', 'C1215', 'C1216',
      'C1217',
      'M1220', // Credit manager
    ],
  },
  {
    slug: 'assurance',
    label: 'Assurance',
    intro:
      'Souscription, indemnisation, courtage, actuariat, prévoyance. Les ' +
      'assureurs et les courtiers recrutent en alternance à tous les niveaux de ' +
      'diplôme.',
    romeCodes: [
      'C1101', 'C1102', 'C1103', 'C1104', 'C1105', 'C1106', 'C1107', 'C1108',
      'C1109', 'C1110', 'C1111', 'C1112', 'C1113', 'C1114', 'C1115', 'C1116',
      'C1117', 'C1118', 'C1119', 'C1120', 'C1121', 'C1125', 'C1127', 'C1128',
      'C1129', 'C1130',
    ],
  },
  {
    slug: 'marches-financiers',
    label: 'Marchés financiers et gestion d’actifs',
    intro:
      'Salle des marchés, back et middle office, OPCVM, gestion de portefeuille. ' +
      'Les volumes d’alternance y sont plus faibles qu’en banque de détail, et la ' +
      'sélection plus serrée.',
    romeCodes: [
      'C1301', 'C1302', 'C1303', 'C1304', 'C1305', 'C1306',
      'M1214', // Négociateur / Négociatrice en devises
    ],
  },
  {
    slug: 'audit-comptabilite',
    label: 'Audit et comptabilité',
    intro:
      'Cabinets d’audit et d’expertise comptable, commissariat aux comptes, ' +
      'comptabilité d’entreprise. Les cabinets sont parmi les plus gros ' +
      'recruteurs d’alternants du secteur.',
    romeCodes: [
      'M1202', // Auditeur comptable et financier
      'M1203', // Comptable
      'M1206', // Responsable comptabilité
      'M1210', // Commissaire aux comptes
      'M1211', // Expert-comptable
      'M1213', // Assistant comptable
      'M1215', // Contrôleur comptable et financier
      'M1225', // Aide-comptable
    ],
  },
  {
    slug: 'controle-de-gestion',
    label: 'Contrôle de gestion',
    intro:
      'Budgets, reporting, analyse des écarts, pilotage de la performance. Un ' +
      'point d’entrée fréquent vers la direction financière.',
    romeCodes: [
      'M1204', // Contrôleur de gestion
      'M1208', // Directeur du contrôle de gestion
      'M1222', // Assistant de contrôle budgétaire
    ],
  },
  {
    slug: 'corporate-finance',
    label: 'Corporate finance et M&A',
    intro:
      'Analyse financière, fusions et acquisitions, financement de projet, ' +
      'investissement. Le segment le plus étroit et le plus demandé.',
    romeCodes: [
      'M1201', // Analyste financier
      'M1205', // Directeur administratif et financier
      'M1219', // Conseiller en fusion et acquisition
      'M1221', // Responsable financement de projet
      'M1223', // Chef des services administratifs et financiers
      'M1224', // Économiste financier
      'M1226', // Responsable investissements
    ],
  },
  {
    slug: 'tresorerie-risques',
    label: 'Trésorerie et risques',
    intro:
      'Gestion de trésorerie, risques financiers, conformité. Des fonctions ' +
      'qui se sont beaucoup étoffées depuis le durcissement réglementaire.',
    romeCodes: [
      'M1207', // Trésorier
      'M1228', // Gestionnaire de risques financiers
    ],
  },
  {
    slug: 'fiscalite',
    label: 'Fiscalité',
    intro:
      'Fiscalité d’entreprise et des particuliers, en cabinet ou en direction ' +
      'fiscale. Peu d’offres, souvent à bac+5.',
    romeCodes: [
      'K1911', // Fiscaliste
    ],
  },
  {
    slug: 'back-office-banque-assurance',
    label: 'Back-office banque et assurance',
    intro:
      'Gestion administrative des contrats et des opérations, régimes de ' +
      'retraite complémentaire, fonctions techniques bancaires.',
    romeCodes: [
      'C1401', // Agent administratif banque ou assurance
      'C1402', // Agent technique des régimes de retraite complémentaire et de prévoyance
      'C1403', // Cadre technique de la banque
    ],
  },
];

/**
 * Codes ROME délibérément HORS périmètre, avec la raison.
 *
 * Ce tableau n’est pas de la documentation : `matchFamilies()` s’en sert comme
 * d’un garde-fou, et le test de taxonomie échoue si l’un de ces codes
 * réapparaît dans une famille. Sans cela, une bonne intention lors d’une
 * future modification suffirait à faire entrer l’immobilier dans un site
 * d’offres finance.
 */
export const EXCLUDED_ROME: readonly { code: string; reason: string }[] = [
  { code: 'C1501', reason: 'Immobilier — hors périmètre' },
  { code: 'C1502', reason: 'Immobilier — hors périmètre' },
  { code: 'C1503', reason: 'Immobilier — hors périmètre' },
  { code: 'C1504', reason: 'Immobilier — hors périmètre' },
  { code: 'C1505', reason: 'Immobilier — hors périmètre' },
  { code: 'C1506', reason: 'Immobilier — hors périmètre' },
  { code: 'C1507', reason: 'Immobilier — hors périmètre' },
  { code: 'C1508', reason: 'Immobilier — hors périmètre' },
  { code: 'C1122', reason: 'Sécurité sociale (organisme public) — pas un métier de la finance' },
  { code: 'C1123', reason: 'Sécurité sociale (organisme public) — pas un métier de la finance' },
  { code: 'C1124', reason: 'Sécurité sociale (organisme public) — pas un métier de la finance' },
  { code: 'C1126', reason: 'Sécurité sociale (organisme public) — pas un métier de la finance' },
  { code: 'M1209', reason: 'Conseil en gestion, trop générique — bruit garanti' },
  { code: 'M1212', reason: 'Gestionnaire de lits (hôpital) — homonymie de famille ROME' },
  { code: 'M1216', reason: 'Secrétaire général — fonction non financière' },
  { code: 'M1217', reason: 'Intendant d’établissement scolaire — hors périmètre' },
  { code: 'M1218', reason: 'Environnement de travail — hors périmètre' },
  { code: 'M1227', reason: 'Droits et redevances — hors périmètre' },
];

const EXCLUDED_SET: ReadonlySet<string> = new Set(EXCLUDED_ROME.map((e) => e.code));

/**
 * Termes qui, dans un intitulé, suffisent à retenir une offre même si son code
 * ROME est générique ou absent.
 *
 * Volontairement spécifiques. « gestion » ou « analyste » seuls ramèneraient la
 * moitié du marché du travail.
 */
const INCLUDE_KEYWORDS: readonly string[] = [
  'finance', 'financier', 'financiere',
  'banque', 'bancaire', 'banque privee', 'banque d investissement',
  'assurance', 'assureur', 'courtage', 'courtier', 'actuariat', 'actuaire',
  'prevoyance', 'souscription', 'sinistre', 'indemnisation',
  'comptabilite', 'comptable', 'expertise comptable', 'commissariat aux comptes',
  'consolidation', 'reporting financier', 'cloture comptable',
  'audit interne', 'audit externe', 'audit financier', 'auditeur financier',
  'controle de gestion', 'controleur de gestion', 'controle interne',
  'tresorerie', 'tresorier', 'cash management',
  'fiscalite', 'fiscaliste', 'fiscal',
  'fusion acquisition', 'fusions acquisitions', 'm&a', 'corporate finance',
  'private equity', 'capital investissement', 'capital risque',
  'gestion d actifs', 'asset management', 'gestion de portefeuille',
  'opcvm', 'marches financiers', 'salle des marches', 'trading', 'trader',
  'front office', 'middle office', 'back office',
  'gestion de patrimoine', 'conseiller patrimonial',
  'credit', 'analyste credit', 'risque de credit', 'credit manager',
  'risques financiers', 'gestion des risques',
  'conformite', 'compliance', 'kyc', 'lcb ft', 'lutte anti blanchiment',
  'leasing', 'affacturage', 'factoring',
];

/**
 * Termes qui disqualifient une offre, même si un mot-clé d’inclusion est
 * présent.
 *
 * Chaque ligne vient d’un faux positif réel ou évident : « assurance qualité »
 * est un métier d’usine, « audit énergétique » un métier du bâtiment, et un
 * « conseiller en immobilier » n’a rien à faire ici.
 */
const EXCLUDE_KEYWORDS: readonly string[] = [
  'assurance qualite', 'assurance produit', 'ingenieur qualite',
  'audit qualite', 'auditeur qualite', 'audit energetique', 'audit technique',
  'audit environnemental', 'audit de securite', 'audit industriel',
  'immobilier', 'immobiliere', 'syndic', 'copropriete', 'gestion locative',
  'assurance maladie', 'securite sociale', 'caisse d allocations',
  'controle technique', 'controleur technique',
  'credit photo', 'credit image',
];

/** Normalise pour comparaison : minuscules, sans accent, ponctuation en espaces. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim();
}

const FAMILY_BY_ROME: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const family of JOB_FAMILIES) {
    for (const code of family.romeCodes) map.set(code, family.slug);
  }
  return map;
})();

export function familyBySlug(slug: string): JobFamily | undefined {
  return JOB_FAMILIES.find((f) => f.slug === slug);
}

export function allFamilySlugs(): string[] {
  return JOB_FAMILIES.map((f) => f.slug);
}

/** Vrai si l’intitulé porte un terme d’exclusion. */
export function isExcludedByKeyword(title: string): boolean {
  const folded = fold(title);
  return EXCLUDE_KEYWORDS.some((kw) => folded.includes(fold(kw)));
}

/** Vrai si l’intitulé porte un terme franchement financier. */
export function hasFinanceKeyword(title: string): boolean {
  const folded = ` ${fold(title)} `;
  return INCLUDE_KEYWORDS.some((kw) => folded.includes(` ${fold(kw)} `));
}

export interface MatchResult {
  /** Familles retenues, dans l’ordre de `JOB_FAMILIES`. */
  families: string[];
  /** Comment l’offre est entrée dans le périmètre. Utile pour le diagnostic. */
  via: 'rome' | 'keyword' | null;
}

/**
 * Détermine si une offre entre dans le périmètre finance, et sous quelles
 * familles.
 *
 * `families` vide signifie « hors périmètre » : la collecte écarte l’offre.
 */
export function matchFamilies(input: {
  title: string;
  romeCodes: readonly string[];
}): MatchResult {
  if (isExcludedByKeyword(input.title)) return { families: [], via: null };

  const slugs = new Set<string>();
  for (const code of input.romeCodes) {
    const upper = code.trim().toUpperCase();
    if (EXCLUDED_SET.has(upper)) continue;
    const slug = FAMILY_BY_ROME.get(upper);
    if (slug) slugs.add(slug);
  }

  if (slugs.size > 0) {
    return { families: ordered(slugs), via: 'rome' };
  }

  // Aucun code ROME utile : on se rabat sur l’intitulé. On ne devine pas la
  // famille dans ce cas — on la déduit du mot-clé qui a déclenché la prise.
  if (hasFinanceKeyword(input.title)) {
    const guessed = guessFamilyFromTitle(input.title);
    return { families: guessed ? [guessed] : ['banque-credit'], via: 'keyword' };
  }

  return { families: [], via: null };
}

function ordered(slugs: ReadonlySet<string>): string[] {
  return JOB_FAMILIES.filter((f) => slugs.has(f.slug)).map((f) => f.slug);
}

/**
 * Rattachement de secours, par mot-clé le plus spécifique trouvé dans
 * l’intitulé. Imparfait par construction, et c’est assumé : mieux vaut une
 * offre finance rangée dans la famille voisine qu’une offre finance absente.
 */
function guessFamilyFromTitle(title: string): string | null {
  const folded = fold(title);
  const rules: readonly [string, readonly string[]][] = [
    ['corporate-finance', ['fusion', 'acquisition', 'm&a', 'corporate finance', 'private equity', 'capital investissement', 'capital risque', 'analyste financier']],
    ['marches-financiers', ['marches financiers', 'salle des marches', 'trading', 'trader', 'opcvm', 'asset management', 'gestion d actifs', 'gestion de portefeuille', 'front office', 'middle office']],
    ['audit-comptabilite', ['audit', 'auditeur', 'comptab', 'commissariat aux comptes', 'consolidation', 'cloture']],
    ['controle-de-gestion', ['controle de gestion', 'controleur de gestion', 'controle interne', 'budgetaire']],
    ['tresorerie-risques', ['tresorerie', 'tresorier', 'cash management', 'risques financiers', 'gestion des risques', 'conformite', 'compliance', 'kyc', 'lcb ft', 'blanchiment']],
    ['fiscalite', ['fiscalite', 'fiscaliste', 'fiscal']],
    ['assurance', ['assurance', 'assureur', 'courtage', 'courtier', 'actuar', 'prevoyance', 'souscription', 'sinistre', 'indemnisation']],
    ['banque-credit', ['banque', 'bancaire', 'credit', 'patrimoine', 'leasing', 'affacturage', 'factoring']],
    ['back-office-banque-assurance', ['back office']],
  ];
  for (const [slug, keywords] of rules) {
    if (keywords.some((kw) => folded.includes(fold(kw)))) return slug;
  }
  return null;
}
