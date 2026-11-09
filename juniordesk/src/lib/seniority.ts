/**
 * Reconnaître un poste de début de carrière.
 *
 * ---------------------------------------------------------------------------
 * Le problème que ce fichier résout
 * ---------------------------------------------------------------------------
 * Un stage est un stage : le type de contrat le dit, et il n'y a rien à
 * deviner. Une alternance non plus. Mais un CDI n'a aucune raison d'être
 * junior — « Directeur financier, 15 ans d'expérience » est un CDI.
 *
 * Or le site rangeait tout CDI et tout CDD dans « poste junior », par le seul
 * type de contrat. Tant qu'aucune source ne fournit de CDI, cela ne se voit
 * pas. Le jour où une source en fournit, le site se remplit de postes de
 * direction sous une étiquette qui promet le contraire — c'est-à-dire qu'il
 * ment à des étudiants, sur la seule chose qu'il leur promet.
 *
 * ---------------------------------------------------------------------------
 * Trois signaux, dans cet ordre
 * ---------------------------------------------------------------------------
 * 1. Les exclusions d'intitulé, en premier et au-dessus de tout. « Senior »,
 *    « responsable », « directeur » décrivent le poste lui-même. Une source
 *    peut très bien cocher « débutant accepté » sur une offre de directeur —
 *    l'employeur dit alors qui peut postuler, pas quel est le poste. Entre les
 *    deux, l'intitulé gagne.
 *
 * 2. L'expérience demandée, quand la source la donne. C'est le seul signal
 *    structuré, donc le plus fiable des trois. Le seuil est à deux ans : une
 *    offre qui en exige deux ne s'adresse plus à quelqu'un qui sort d'école.
 *
 * 3. Les marqueurs d'intitulé, en dernier. « Junior », « jeune diplômé »,
 *    « graduate », « VIE », et les grades d'entrée de la finance (« analyste »,
 *    « assistant »).
 *
 * ---------------------------------------------------------------------------
 * Et si rien ne dit rien : on écarte
 * ---------------------------------------------------------------------------
 * C'est la décision qui compte le plus, et elle n'est pas neutre : elle fera
 * perdre de vraies offres juniors dont l'intitulé ne dit rien et dont la
 * source ne déclare pas l'expérience.
 *
 * Elle se justifie par l'asymétrie des deux erreurs. Rater une offre coûte à
 * l'étudiant une occasion qu'il n'a jamais vue. Lui montrer un poste de
 * directeur étiqueté « junior » lui coûte une candidature, du temps, et la
 * confiance qu'il accorde au site — et ce dernier coût est le seul des deux
 * qui soit irréversible. Un agrégateur de postes d'entrée qui laisse passer
 * des postes seniors n'est plus un agrégateur de postes d'entrée.
 *
 * Cette règle ne s'applique QU'aux contrats qui ne disent rien du niveau
 * (CDI, CDD). Les stages et les alternances sont juniors par construction et
 * ne passent jamais par ici.
 */

import { fold } from './taxonomy';

/**
 * Ce qu'une source dit de l'expérience attendue.
 *
 * Les trois champs sont indépendants : une source peut donner un libellé sans
 * nombre, un nombre sans libellé, ou seulement « débutant accepté ».
 * `null` partout signifie « la source ne dit rien », ce qui n'est pas la même
 * chose que « elle dit zéro ».
 */
export interface ExperienceSignal {
  /** Libellé brut, tel que la source l'écrit. Sert à l'affichage et au débogage. */
  label: string | null;
  /** Années d'expérience attendues, quand on peut les déduire. */
  minYears: number | null;
  /** La source déclare-t-elle accepter un débutant ? */
  acceptsBeginner: boolean | null;
}

export const NO_EXPERIENCE_SIGNAL: ExperienceSignal = {
  label: null,
  minYears: null,
  acceptsBeginner: null,
};

/** Ce qui a emporté la décision. */
export type SeniorityVia = 'exclusion' | 'experience' | 'intitule' | 'silence';

export interface SeniorityVerdict {
  junior: boolean;
  via: SeniorityVia;
  /** Le mot ou la valeur qui a tranché. Pour les journaux et pour les tests. */
  evidence: string | null;
}

/**
 * Expérience maximale, en années, pour qu'un poste reste un premier poste.
 *
 * Un an : une offre qui demande une année d'expérience reste accessible à qui
 * sort d'alternance, deux ans ne le sont plus. En finance, « deux ans
 * d'expérience » est précisément la formule qui écarte les sortants d'école.
 */
export const MAX_JUNIOR_YEARS = 1;

/**
 * Intitulés qui décrivent un poste d'encadrement ou d'expérience.
 *
 * Ces mots l'emportent sur tout le reste, y compris sur une source qui
 * déclarerait accepter un débutant.
 *
 * `associate` et `vp` méritent un mot : dans les banques d'affaires, la
 * progression va analyst → associate → VP → director. « Associate » sonne
 * modeste en français et désigne pourtant le grade qui suit trois ans
 * d'analyste, ou un sortant de MBA. Il n'a rien à faire sur un site de
 * premiers postes.
 */
const SENIOR_MARKERS: readonly string[] = [
  'senior',
  'confirme',
  'confirmee',
  'experimente',
  'experimentee',
  'responsable',
  'manager',
  'directeur',
  'directrice',
  'chef',
  'head',
  'head of',
  'lead',
  'leader',
  'principal',
  'associate',
  'vp',
  'vice president',
  'partner',
  'associe',
  'superviseur',
  'adjoint au directeur',
];

/**
 * Intitulés qui désignent un poste d'entrée.
 *
 * `analyste` et `assistant` sont des grades d'entrée en finance ; ils ne sont
 * consultés qu'après les exclusions, donc « analyste senior » est déjà sorti
 * quand on arrive ici.
 *
 * Le VIE — Volontariat International en Entreprise — est l'une des portes
 * d'entrée les plus fréquentes de la finance pour un sortant d'école, mais il
 * ne peut pas figurer dans cette liste : elle est comparée sur un texte dont
 * la casse a été retirée, et « vie » y attraperait « conseiller épargne et
 * vie professionnelle ». Le sigle est donc cherché à part, sur l'intitulé
 * d'origine, où ses majuscules le distinguent du mot courant.
 */
const JUNIOR_MARKERS: readonly string[] = [
  'junior',
  'debutant',
  'debutante',
  'jeune diplome',
  'jeune diplomee',
  'premier emploi',
  'premiere experience',
  'graduate',
  'trainee',
  'volontariat international',
  'analyste',
  'analyst',
  'assistant',
  'assistante',
  'charge d etudes junior',
];

/** Mot entier, accents et casse ignorés. */
function hasWord(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${fold(needle)} `);
}

/**
 * Années d'expérience lisibles dans un texte libre.
 *
 * Les sources écrivent « 2 ans », « 24 mois », « 3 à 5 ans », « Débutant
 * accepté ». On retient la borne BASSE d'un intervalle : « 3 à 5 ans » exige
 * trois ans, pas cinq, et c'est trois ans qui décide.
 *
 * Renvoie `null` quand le texte ne porte aucune durée — ce qui n'est pas
 * « zéro année », mais « on ne sait pas ».
 */
export function parseExperienceYears(label: string | null | undefined): number | null {
  if (!label) return null;
  const text = fold(label);

  if (/debutant\s+accept/.test(text)) return 0;

  /*
   * L'intervalle d'abord, sinon il est mal lu. « 3 à 5 ans » ne contient
   * qu'une seule suite « nombre + ans » — la seconde — et une expression
   * naïve y trouvait cinq ans là où l'offre en exige trois.
   */
  const range = text.match(/(\d{1,2})\s*(?:a|-|–|et)\s*(\d{1,2})\s*an/);
  if (range?.[1]) return Number(range[1]);

  const months = text.match(/(\d{1,3})\s*mois/);
  if (months?.[1]) return Math.round((Number(months[1]) / 12) * 10) / 10;

  const years = text.match(/(\d{1,2})\s*an/);
  if (years?.[1]) return Number(years[1]);

  return null;
}

/**
 * Le poste s'adresse-t-il à un début de carrière ?
 *
 * À n'appeler que pour les contrats muets sur le niveau (CDI, CDD). Un stage
 * ou une alternance n'a pas à être soumis à cette épreuve : il la raterait
 * parfois, sans raison.
 */
export function assessSeniority(input: {
  title: string;
  experience?: ExperienceSignal;
}): SeniorityVerdict {
  const title = fold(input.title);
  const experience = input.experience ?? NO_EXPERIENCE_SIGNAL;

  // 1. Les exclusions d'abord, et elles ne se discutent pas.
  for (const marker of SENIOR_MARKERS) {
    if (hasWord(title, marker)) {
      return { junior: false, via: 'exclusion', evidence: marker };
    }
  }

  /*
   * Une durée écrite dans l'intitulé lui-même (« ... - 5 ans d'expérience »)
   * compte comme une exclusion : elle décrit le poste, pas le candidat.
   *
   * Mais seulement si le mot « expérience » est là. Sans cette condition,
   * « CDD 24 mois » se lisait comme deux ans d'expérience exigés et le poste
   * était écarté : la durée du CONTRAT prise pour celle de la CARRIÈRE.
   */
  if (title.includes('experience')) {
    const yearsInTitle = parseExperienceYears(input.title);
    if (yearsInTitle !== null && yearsInTitle > MAX_JUNIOR_YEARS) {
      return { junior: false, via: 'exclusion', evidence: `${yearsInTitle} an(s) dans l’intitulé` };
    }
  }

  // 2. Ce que la source déclare de l'expérience attendue.
  const years = experience.minYears ?? parseExperienceYears(experience.label);
  if (years !== null) {
    return years <= MAX_JUNIOR_YEARS
      ? { junior: true, via: 'experience', evidence: `${years} an(s) demandé(s)` }
      : { junior: false, via: 'experience', evidence: `${years} an(s) demandé(s)` };
  }
  if (experience.acceptsBeginner === true) {
    return { junior: true, via: 'experience', evidence: 'débutant accepté' };
  }
  if (experience.acceptsBeginner === false) {
    return { junior: false, via: 'experience', evidence: 'débutant refusé' };
  }

  // 3. Les marqueurs d'intitulé, faute de mieux.
  // Le sigle VIE se reconnaît à ses majuscules, donc sur le texte d'origine.
  if (/\bV\.?I\.?E\.?\b/.test(input.title)) {
    return { junior: true, via: 'intitule', evidence: 'VIE' };
  }
  for (const marker of JUNIOR_MARKERS) {
    if (hasWord(title, marker)) {
      return { junior: true, via: 'intitule', evidence: marker };
    }
  }

  // 4. Rien ne dit rien : on écarte. Voir l'en-tête pour le pourquoi.
  return { junior: false, via: 'silence', evidence: null };
}

/** Exporté pour les tests, qui vérifient qu'aucune liste ne se vide par accident. */
export const SENIORITY_MARKERS = {
  senior: SENIOR_MARKERS,
  junior: JUNIOR_MARKERS,
} as const;
