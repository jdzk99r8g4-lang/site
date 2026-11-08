/**
 * Périmètre finance de JuniorDesk.
 *
 * ---------------------------------------------------------------------------
 * Provenance des codes
 * ---------------------------------------------------------------------------
 * Les codes ROME ci-dessous sont repris du Répertoire Opérationnel des Métiers
 * et des Emplois de France Travail, **version 4.0 v62, publiée le 19/10/2026**,
 * diffusée en open data sous Licence Ouverte :
 *
 *   https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome
 *
 * Ils n'ont pas été écrits de mémoire : chaque code a été relevé dans le
 * fichier `unix_referentiel_code_rome_v462.json` du référentiel officiel, et
 * `tests/taxonomy.test.ts` vérifie leur forme, l'absence de doublon entre
 * familles et l'absence de code explicitement exclu.
 *
 * ---------------------------------------------------------------------------
 * Deux chemins d'entrée, et pourquoi il en faut deux
 * ---------------------------------------------------------------------------
 * ROME décrit des métiers administratifs, pas les verticales de la finance.
 * Il n'existe aucun code pour « private equity », « transaction services »,
 * « banque d'investissement » ou « fintech » : ces métiers tombent tous dans
 * des codes génériques comme M1201 « Analyste financier ». Une taxonomie
 * fondée sur le seul ROME ne pourrait donc pas offrir ces familles, qui sont
 * précisément celles qu'un étudiant en finance cherche.
 *
 * D'où deux chemins, qui s'additionnent :
 *
 *   1. le code ROME de l'offre rattache à une famille ;
 *   2. l'intitulé de l'offre rattache à une famille, par mots-clés propres à
 *      cette verticale.
 *
 * Les deux s'appliquent TOUJOURS, et leurs résultats se cumulent. C'est le
 * point important : une alternance « Analyste M&A » codée C1201 (clientèle
 * bancaire) par un employeur pressé doit apparaître sous « Fusions-acquisitions »
 * *et* sous « Banque de détail », pas seulement sous la seconde. Traiter les
 * mots-clés comme un simple repli — ce qu'on faisait avant — rendait les
 * verticales fines invisibles dès que l'offre portait un code ROME, c'est-à-dire
 * presque toujours.
 *
 * Et une porte de sortie : un terme d'exclusion disqualifie l'offre, même si un
 * code ROME du périmètre est présent. Sans elle, « assurance qualité » entre
 * par le mot « assurance » et « audit énergétique » par le mot « audit ».
 */

export interface JobFamily {
  /** Forme URL, utilisée dans /metiers/[metier]. */
  slug: string;
  label: string;
  /** Phrase d'introduction de la page SEO du métier. */
  intro: string;
  /** Codes ROME 4.0 rattachés. Peut être vide : voir `keywords`. */
  romeCodes: readonly string[];
  /**
   * Termes qui, dans un intitulé, rattachent l'offre à cette famille.
   *
   * Indispensables pour les verticales que ROME ne distingue pas. Chaque terme
   * doit être propre au métier : « analyste » ou « gestion » seuls ramèneraient
   * la moitié du marché du travail.
   */
  keywords: readonly string[];
}

/**
 * Les familles du périmètre, dans l'ordre d'affichage.
 *
 * L'ordre va des gisements les plus larges en alternance aux plus étroits,
 * puis aux fonctions transverses.
 */
export const JOB_FAMILIES: readonly JobFamily[] = [
  {
    slug: 'banque-detail-credit',
    label: 'Banque de détail et crédit',
    intro:
      'Réseau d’agence, clientèle de particuliers et de professionnels, analyse et ' +
      'octroi de crédit. C’est de loin le plus gros gisement d’alternance du secteur ' +
      'financier, et souvent la porte d’entrée la plus accessible.',
    romeCodes: [
      'C1201', 'C1202', 'C1203', 'C1204', 'C1206', 'C1207', 'C1208', 'C1209',
      'C1210', 'C1211', 'C1212', 'C1213', 'C1214', 'C1215', 'C1216', 'C1217',
      'M1220',
    ],
    keywords: [
      'banque de detail', 'banque de reseau', 'charge de clientele bancaire',
      'conseiller bancaire', 'credit manager', 'analyste credit', 'octroi de credit',
      'credit immobilier', 'credit a la consommation', 'affacturage', 'leasing',
      'credit bail',
    ],
  },
  {
    slug: 'banque-privee-patrimoine',
    label: 'Banque privée et gestion de patrimoine',
    intro:
      'Conseil aux clients fortunés, ingénierie patrimoniale, family office. ' +
      'Des volumes plus faibles qu’en banque de détail, et une exigence plus forte ' +
      'sur la fiscalité et le droit.',
    romeCodes: ['C1205'],
    keywords: [
      'banque privee', 'gestion de patrimoine', 'conseiller patrimonial',
      'ingenierie patrimoniale', 'wealth management', 'private banking',
      'family office',
    ],
  },
  {
    slug: 'banque-investissement',
    label: 'Banque d’investissement',
    intro:
      'Banque de financement et d’investissement : émissions d’actions et de dette, ' +
      'financements structurés, couverture sectorielle. ROME ne distingue pas cette ' +
      'activité : le rattachement se fait sur l’intitulé.',
    romeCodes: [],
    keywords: [
      'banque d investissement', 'banque de financement', 'bfi', 'investment banking',
      'corporate banking', 'ecm', 'dcm', 'equity capital markets', 'debt capital markets',
      'leveraged finance', 'financement structure', 'financements structures',
      'syndication', 'origination',
    ],
  },
  {
    slug: 'fusions-acquisitions',
    label: 'Fusions-acquisitions (M&A)',
    intro:
      'Conseil en acquisition et cession d’entreprises. Le segment le plus demandé ' +
      'et le plus sélectif : peu de places, beaucoup de candidats, et des process ' +
      'de recrutement qui démarrent très tôt dans l’année.',
    romeCodes: ['M1219'],
    keywords: [
      'm&a', 'fusion acquisition', 'fusions acquisitions', 'fusions et acquisitions',
      'mergers acquisitions', 'mergers and acquisitions', 'conseil en acquisition',
      'cession d entreprise', 'build up',
    ],
  },
  {
    slug: 'private-equity',
    label: 'Private equity et capital-investissement',
    intro:
      'Fonds d’investissement, capital-risque, LBO, infrastructure. Comme pour la ' +
      'banque d’investissement, ROME n’a pas de code propre : le rattachement passe ' +
      'par l’intitulé.',
    romeCodes: ['M1226'],
    keywords: [
      'private equity', 'capital investissement', 'capital risque', 'capital developpement',
      'venture capital', 'lbo', 'fonds d investissement', 'societe de gestion',
      'infrastructure fund', 'dette privee', 'growth equity',
    ],
  },
  {
    slug: 'marches-financiers',
    label: 'Marchés financiers',
    intro:
      'Salle des marchés : négociation, structuration, vente de produits financiers. ' +
      'Des équipes restreintes, et une forte concentration sur Paris La Défense.',
    romeCodes: ['C1301', 'C1302', 'C1305', 'M1214'],
    keywords: [
      'marches financiers', 'salle des marches', 'trading', 'trader', 'sales trading',
      'structuration', 'produits derives', 'derives actions', 'taux et change',
      'front office', 'equity research', 'analyste actions',
    ],
  },
  {
    slug: 'gestion-actifs',
    label: 'Gestion d’actifs',
    intro:
      'Gestion de portefeuille pour compte de tiers, OPCVM, gestion sous mandat, ' +
      'investissement responsable. Les sociétés de gestion recrutent en alternance ' +
      'surtout en support à la gestion et en reporting.',
    romeCodes: ['C1303', 'C1304', 'C1306'],
    keywords: [
      'gestion d actifs', 'asset management', 'gestion de portefeuille', 'opcvm',
      'gerant de portefeuille', 'multigestion', 'investissement responsable', 'esg',
      'isr', 'reporting de gestion',
    ],
  },
  {
    slug: 'assurance-actuariat',
    label: 'Assurance et actuariat',
    intro:
      'Souscription, indemnisation, courtage, actuariat, prévoyance. Les assureurs ' +
      'et les courtiers recrutent en alternance à tous les niveaux de diplôme, du ' +
      'BTS au master.',
    romeCodes: [
      'C1101', 'C1102', 'C1103', 'C1104', 'C1105', 'C1106', 'C1107', 'C1108',
      'C1109', 'C1110', 'C1111', 'C1112', 'C1113', 'C1114', 'C1115', 'C1116',
      'C1117', 'C1118', 'C1119', 'C1120', 'C1121', 'C1125', 'C1127', 'C1128',
      'C1129', 'C1130',
    ],
    keywords: [
      'assurance', 'assureur', 'reassurance', 'courtage en assurance', 'courtier en assurance',
      'actuariat', 'actuaire', 'souscription', 'souscripteur', 'sinistre', 'indemnisation',
      'prevoyance', 'assurance vie', 'iard',
    ],
  },
  {
    slug: 'audit',
    label: 'Audit et commissariat aux comptes',
    intro:
      'Audit légal et contractuel, commissariat aux comptes, audit interne. Les ' +
      'cabinets sont parmi les plus gros recruteurs d’alternants du secteur, avec ' +
      'des campagnes de recrutement très structurées.',
    romeCodes: ['M1202', 'M1210', 'M1211'],
    keywords: [
      // « audit » et « auditeur » seuls sont admis, et ce n'est pas une
      // imprudence : la liste d'exclusions est évaluée AVANT et écarte déjà
      // l'audit qualité, énergétique, technique, environnemental, industriel
      // et informatique. Les exiger en deux mots laissait passer à côté les
      // offres de cabinet intitulées simplement « Alternance Audit », qui sont
      // la forme la plus courante.
      'audit', 'auditeur', 'auditrice',
      'audit financier', 'audit legal', 'audit contractuel', 'audit interne',
      'audit externe', 'auditeur financier', 'commissariat aux comptes',
      'commissaire aux comptes', 'expertise comptable', 'expert comptable',
    ],
  },
  {
    slug: 'comptabilite',
    label: 'Comptabilité',
    intro:
      'Comptabilité générale et auxiliaire, consolidation, clôtures. En cabinet ou ' +
      'en entreprise, c’est le métier qui offre le plus d’alternances en volume ' +
      'après la banque de détail.',
    romeCodes: ['M1203', 'M1206', 'M1213', 'M1215', 'M1225'],
    keywords: [
      'comptabilite', 'comptable', 'aide comptable', 'consolidation', 'cloture comptable',
      'comptabilite fournisseurs', 'comptabilite clients', 'normes ifrs',
    ],
  },
  {
    slug: 'controle-de-gestion',
    label: 'Contrôle de gestion',
    intro:
      'Budgets, reporting, analyse des écarts, pilotage de la performance. Un point ' +
      'd’entrée fréquent vers la direction financière, et une fonction présente dans ' +
      'presque toutes les entreprises, bien au-delà du secteur financier.',
    romeCodes: ['M1204', 'M1208', 'M1222'],
    keywords: [
      'controle de gestion', 'controleur de gestion', 'fp&a',
      'financial planning', 'controle budgetaire', 'pilotage de la performance',
      'reporting financier', 'business partner finance',
    ],
  },
  {
    slug: 'transaction-services',
    label: 'Transaction services et évaluation',
    intro:
      'Due diligence financière, évaluation d’entreprise, restructuring. Une ' +
      'activité de cabinet, souvent voisine de l’audit et du M&A, que ROME ne ' +
      'distingue pas non plus.',
    romeCodes: [],
    keywords: [
      'transaction services', 'transaction advisory', 'due diligence',
      'valuation', 'evaluation d entreprise', 'evaluation financiere',
      'financial advisory', 'restructuring', 'retournement', 'modelisation financiere',
      'financial modelling',
    ],
  },
  {
    slug: 'direction-financiere',
    label: 'Direction financière',
    intro:
      'Analyse financière d’entreprise, pilotage, relations investisseurs. Les ' +
      'fonctions de direction financière en entreprise, par opposition aux métiers ' +
      'exercés chez un acteur financier.',
    romeCodes: ['M1201', 'M1205', 'M1223', 'M1224'],
    keywords: [
      'direction financiere', 'daf', 'analyste financier', 'analyse financiere',
      'relations investisseurs', 'investor relations', 'communication financiere',
    ],
  },
  {
    slug: 'tresorerie-financement',
    label: 'Trésorerie et financement',
    intro:
      'Gestion de trésorerie, financement de projet, relations bancaires. Des ' +
      'équipes réduites, mais une fonction qui s’est beaucoup développée depuis la ' +
      'remontée des taux.',
    romeCodes: ['M1207', 'M1221'],
    keywords: [
      'tresorerie', 'tresorier', 'cash management', 'financement de projet',
      'project finance', 'relations bancaires', 'gestion de la dette',
    ],
  },
  {
    slug: 'risques-conformite',
    label: 'Risques et conformité',
    intro:
      'Gestion des risques, conformité réglementaire, lutte anti-blanchiment, ' +
      'contrôle interne. Le durcissement réglementaire en a fait l’une des ' +
      'fonctions qui recrutent le plus régulièrement.',
    romeCodes: ['M1228'],
    keywords: [
      'gestion des risques', 'risques financiers', 'risk management', 'risque de credit',
      'risque operationnel', 'risque de marche', 'conformite', 'compliance',
      'kyc', 'lcb ft', 'lutte anti blanchiment', 'blanchiment', 'controle interne',
      'deontologie', 'controle permanent',
    ],
  },
  {
    slug: 'fiscalite',
    label: 'Fiscalité',
    intro:
      'Fiscalité d’entreprise et des particuliers, en cabinet ou en direction ' +
      'fiscale. Peu d’offres, souvent à bac+5, et une forte proportion de profils ' +
      'venus du droit.',
    romeCodes: ['K1911'],
    keywords: [
      'fiscalite', 'fiscaliste', 'droit fiscal', 'fiscalite internationale',
      'prix de transfert', 'tva', 'contentieux fiscal',
    ],
  },
  {
    slug: 'fintech-paiements',
    label: 'Fintech et paiements',
    intro:
      'Néobanques, paiement, monétique, assurtech, actifs numériques. Un secteur ' +
      'jeune, sans code métier dédié, où les intitulés mélangent finance et ' +
      'technologie.',
    romeCodes: [],
    keywords: [
      'fintech', 'insurtech', 'regtech', 'neobanque', 'paiement', 'monetique',
      'moyens de paiement', 'open banking', 'actifs numeriques', 'crypto actifs',
      'blockchain finance',
    ],
  },
  {
    slug: 'back-office',
    label: 'Back-office et middle-office',
    intro:
      'Traitement post-marché, conservation de titres, gestion administrative des ' +
      'contrats et des opérations. Moins exposé que le front-office, et souvent ' +
      'plus accessible en alternance.',
    romeCodes: ['C1401', 'C1402', 'C1403'],
    keywords: [
      'back office', 'middle office', 'post marche', 'conservation de titres',
      'custody', 'depositaire', 'reglement livraison', 'gestion administrative des contrats',
    ],
  },
];

/**
 * Codes ROME délibérément HORS périmètre, avec la raison.
 *
 * Ce tableau n'est pas de la documentation : `matchFamilies()` s'en sert comme
 * garde-fou, et le test de taxonomie échoue si l'un de ces codes réapparaît
 * dans une famille. Sans cela, une bonne intention lors d'une modification
 * future suffirait à faire entrer l'immobilier dans un site d'offres finance.
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
 * Termes qui disqualifient une offre, même si un mot-clé ou un code du
 * périmètre est présent.
 *
 * Chaque ligne vient d'un faux positif évident : « assurance qualité » est un
 * métier d'usine, « audit énergétique » un métier du bâtiment, « moyens de
 * paiement » peut désigner un poste de caissier.
 */
const EXCLUDE_KEYWORDS: readonly string[] = [
  'assurance qualite', 'assurance produit', 'ingenieur qualite', 'responsable qualite',
  'audit qualite', 'auditeur qualite', 'audit energetique', 'audit technique',
  'audit environnemental', 'audit de securite', 'audit industriel', 'audit informatique',
  'immobilier', 'immobiliere', 'syndic', 'copropriete', 'gestion locative',
  'assurance maladie', 'securite sociale', 'caisse d allocations',
  'controle technique', 'controleur technique',
  'hote de caisse', 'hotesse de caisse', 'encaissement',
  'credit photo', 'credit image',
];

/**
 * Termes financiers génériques.
 *
 * Servent de dernier recours : une offre sans code ROME utile et sans mot-clé
 * de verticale, mais dont l'intitulé est manifestement financier, est retenue
 * et rattachée à la direction financière plutôt que perdue.
 */
const GENERIC_FINANCE_KEYWORDS: readonly string[] = [
  'finance', 'financier', 'financiere', 'banque', 'bancaire',
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

/** Vrai si l'intitulé porte un terme d'exclusion. */
export function isExcludedByKeyword(title: string): boolean {
  const folded = fold(title);
  return EXCLUDE_KEYWORDS.some((kw) => folded.includes(fold(kw)));
}

/**
 * Vrai si l'intitulé porte un terme financier, de verticale ou générique.
 *
 * Utilisé pour décider si une offre sans code ROME exploitable mérite d'être
 * retenue.
 */
export function hasFinanceKeyword(title: string): boolean {
  const padded = ` ${fold(title)} `;
  if (GENERIC_FINANCE_KEYWORDS.some((kw) => padded.includes(` ${fold(kw)} `))) return true;
  return JOB_FAMILIES.some((family) =>
    family.keywords.some((kw) => padded.includes(` ${fold(kw)} `)),
  );
}

export interface MatchResult {
  /** Familles retenues, dans l'ordre de `JOB_FAMILIES`. */
  families: string[];
  /** Comment l'offre est entrée dans le périmètre. Utile au diagnostic. */
  via: 'rome' | 'keyword' | 'both' | null;
}

/**
 * Détermine si une offre entre dans le périmètre finance, et sous quelles
 * familles.
 *
 * `families` vide signifie « hors périmètre » : la collecte écarte l'offre.
 */
export function matchFamilies(input: {
  title: string;
  romeCodes: readonly string[];
}): MatchResult {
  if (isExcludedByKeyword(input.title)) return { families: [], via: null };

  const fromRome = new Set<string>();
  for (const code of input.romeCodes) {
    const upper = code.trim().toUpperCase();
    if (EXCLUDED_SET.has(upper)) continue;
    const slug = FAMILY_BY_ROME.get(upper);
    if (slug) fromRome.add(slug);
  }

  // Les mots-clés s'appliquent toujours, pas seulement en l'absence de code.
  // C'est ce qui rend visibles les verticales que ROME ne distingue pas.
  const padded = ` ${fold(input.title)} `;
  const fromKeyword = new Set<string>();
  for (const family of JOB_FAMILIES) {
    if (family.keywords.some((kw) => padded.includes(` ${fold(kw)} `))) {
      fromKeyword.add(family.slug);
    }
  }

  const all = new Set([...fromRome, ...fromKeyword]);

  if (all.size === 0) {
    // Rien de précis, mais un intitulé manifestement financier : on retient
    // plutôt que de perdre l'offre, et on la range par défaut en direction
    // financière, la famille la plus transverse.
    if (GENERIC_FINANCE_KEYWORDS.some((kw) => padded.includes(` ${fold(kw)} `))) {
      return { families: ['direction-financiere'], via: 'keyword' };
    }
    return { families: [], via: null };
  }

  const via: MatchResult['via'] =
    fromRome.size > 0 && fromKeyword.size > 0 ? 'both' : fromRome.size > 0 ? 'rome' : 'keyword';

  return { families: ordered(all), via };
}

function ordered(slugs: ReadonlySet<string>): string[] {
  return JOB_FAMILIES.filter((f) => slugs.has(f.slug)).map((f) => f.slug);
}
