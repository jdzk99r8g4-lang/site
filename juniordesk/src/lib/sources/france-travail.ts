/**
 * Source : France Travail — ÉCRITE MAIS INACTIVE.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi ce fichier existe sans être branché
 * ---------------------------------------------------------------------------
 * France Travail diffusait les stages et les postes juniors, c’est-à-dire les
 * deux tiers du périmètre visé par JuniorDesk. Son API « Offres d’emploi »
 * n’est plus accessible librement. Sur data.gouv.fr, la fiche du service
 * indique :
 *
 *   « L’API Offre d’emploi de France Travail n’est actuellement plus exposée
 *     sur www.francetravail.io le temps d’une analyse des modalités de
 *     distribution et de réutilisation du service. Cette démarche fait suite à
 *     la constatation d’usages automatisés massifs par certaines solutions
 *     d’intelligence artificielle ne respectant pas les conditions et licences
 *     de réutilisation associées à l’API. »
 *
 * L’accès est désormais « Restreint » et se demande via le formulaire de
 * contact de francetravail.io.
 *
 * ---------------------------------------------------------------------------
 * AVERTISSEMENT sur les adresses ci-dessous — à lire avant de les utiliser
 * ---------------------------------------------------------------------------
 * Le portail officiel n’exposant plus cette API, je n’ai PAS pu vérifier
 * l’adresse du serveur de jetons, les « scopes » ni le chemin de recherche sur
 * la documentation de France Travail. Les valeurs par défaut ci-dessous
 * proviennent de documentations tierces et de bibliothèques communautaires :
 * elles sont plausibles, elles ne sont pas confirmées.
 *
 * C’est pourquoi elles sont toutes surchargeables par variables
 * d’environnement : le jour où l’accès est accordé, France Travail fournit sa
 * documentation et son contrat de licence, et il suffit de corriger les
 * variables — sans toucher à ce code — si elles diffèrent.
 *
 * Deux obligations de licence à vérifier à ce moment-là, car elles contraignent
 * l’affichage et pas seulement le code :
 *   - l’obligation d’afficher l’intégralité du contenu de l’offre, logo inclus,
 *     rapportée par des copies tierces de la licence ;
 *   - le droit d’exploiter les logos des partenaires si la réutilisation sort
 *     du simple rapprochement offre / demande.
 *
 * Tant que `FRANCE_TRAVAIL_CLIENT_ID` et `FRANCE_TRAVAIL_CLIENT_SECRET` sont
 * vides, `createFranceTravailSource()` n’est jamais appelée et ce module ne
 * fait rien.
 */

import type { ContractKind, Offer } from '../offer';
import type { FetchOutcome, JobSource } from './types';
import { matchFamilies } from '../taxonomy';
import { isSafeApplyUrl } from '../apply-url';
import { brand } from '../brand';
import { assessSeniority, type ExperienceSignal } from '../seniority';
import { parseAddress } from '../geo';
import { offerSlug } from '../slug';

/** À confirmer auprès de France Travail — voir l’avertissement ci-dessus. */
const DEFAULT_TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const DEFAULT_SCOPE = 'api_offresdemploiv2 o2dsoffre';
const DEFAULT_SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

/** Codes ROME du périmètre finance, transmis comme filtre à la source. */
import { JOB_FAMILIES } from '../taxonomy';

const FINANCE_ROME = JOB_FAMILIES.flatMap((f) => [...f.romeCodes]);

/**
 * Types de contrat visés chez France Travail.
 *
 * C’est tout l’intérêt de cette source : elle apporte ce que La bonne
 * alternance ne peut pas donner.
 */
const WANTED_CONTRACT_KINDS: readonly ContractKind[] = ['stage', 'cdi', 'cdd', 'apprentissage'];

export interface FranceTravailOptions {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
  searchUrl?: string;
  scope?: string;
  fetchImpl?: typeof fetch;
}

interface FtOffer {
  id?: string | null;
  intitule?: string | null;
  description?: string | null;
  dateCreation?: string | null;
  dateActualisation?: string | null;
  romeCode?: string | null;
  typeContrat?: string | null;
  natureContrat?: string | null;
  /**
   * Expérience attendue.
   *
   * `experienceExige` porte un code court — « D » pour débutant accepté,
   * « S » pour souhaitée, « E » pour exigée — et `experienceLibelle` le texte
   * libre qui l'accompagne (« 2 ans », « Débutant accepté »).
   *
   * À RECONFIRMER le jour où l'accès à l'API est accordé : ces codes viennent
   * de ce qui était documenté avant la fermeture de l'API, et n'ont pas pu
   * être vérifiés contre une réponse réelle. Le code ne s'y fie d'ailleurs pas
   * seul : le libellé est lu en parallèle, et une valeur inconnue laisse
   * simplement la question ouverte au lieu de trancher de travers.
   */
  experienceExige?: string | null;
  experienceLibelle?: string | null;
  alternance?: boolean | null;
  origineOffre?: { urlOrigine?: string | null } | null;
  entreprise?: { nom?: string | null; description?: string | null } | null;
  lieuTravail?: { libelle?: string | null; codePostal?: string | null; latitude?: number | null; longitude?: number | null } | null;
}

export function createFranceTravailSource(options: FranceTravailOptions): JobSource {
  const doFetch = options.fetchImpl ?? fetch;
  const tokenUrl = options.tokenUrl ?? process.env.FRANCE_TRAVAIL_TOKEN_URL ?? DEFAULT_TOKEN_URL;
  const searchUrl = options.searchUrl ?? process.env.FRANCE_TRAVAIL_SEARCH_URL ?? DEFAULT_SEARCH_URL;
  const scope = options.scope ?? process.env.FRANCE_TRAVAIL_SCOPE ?? DEFAULT_SCOPE;

  return {
    id: 'france-travail',
    label: 'France Travail',
    contractKinds: WANTED_CONTRACT_KINDS,

    async fetchAll(): Promise<FetchOutcome> {
      const token = await getToken(doFetch, tokenUrl, options.clientId, options.clientSecret, scope);
      if (!token.ok) return { ok: false, error: token.error, retryable: token.retryable };

      const collectedAt = new Date().toISOString();
      const offers: Offer[] = [];
      const warnings: string[] = [];

      // L’API est paginée par plage `range=debut-fin`. On interroge par paquet
      // de codes ROME : une requête portant les 93 codes du périmètre serait
      // refusée par la plupart des API de ce type.
      for (const chunk of chunked(FINANCE_ROME, 10)) {
        const result = await searchPage(doFetch, searchUrl, token.accessToken, chunk);
        if (!result.ok) {
          // Une famille de métiers qui échoue ne doit pas faire perdre les
          // autres : on le signale et on continue.
          warnings.push(result.error);
          continue;
        }
        for (const raw of result.offers) {
          const offer = normalizeFtOffer(raw, collectedAt);
          if (offer) offers.push(offer);
        }
      }

      if (offers.length === 0 && warnings.length > 0) {
        return { ok: false, error: warnings.join(' | '), retryable: true };
      }

      return { ok: true, offers, warnings };
    },
  };
}

type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: string; retryable: boolean };

async function getToken(
  doFetch: typeof fetch,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  scope: string,
): Promise<TokenResult> {
  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });

    const response = await doFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      return {
        ok: false,
        retryable: response.status >= 500,
        error:
          `France Travail a refusé la demande de jeton (${response.status}). ` +
          'Si vous venez d’obtenir l’accès, vérifiez FRANCE_TRAVAIL_TOKEN_URL et ' +
          'FRANCE_TRAVAIL_SCOPE contre la documentation qui vous a été fournie : ' +
          'les valeurs par défaut du code n’ont pas pu être vérifiées sur le ' +
          'portail officiel, l’API n’y étant plus exposée.',
      };
    }

    const payload = (await response.json()) as { access_token?: unknown };
    if (typeof payload.access_token !== 'string') {
      return { ok: false, retryable: false, error: 'Réponse de jeton inattendue : access_token absent.' };
    }

    return { ok: true, accessToken: payload.access_token };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, retryable: true, error: `Serveur de jetons France Travail injoignable : ${message}` };
  }
}

type SearchResult = { ok: true; offers: FtOffer[] } | { ok: false; error: string };

async function searchPage(
  doFetch: typeof fetch,
  searchUrl: string,
  accessToken: string,
  romeCodes: readonly string[],
): Promise<SearchResult> {
  const params = new URLSearchParams({
    codeROME: romeCodes.join(','),
    range: '0-149',
  });

  try {
    const response = await doFetch(`${searchUrl}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });

    // 204 : aucune offre pour ces codes. Ce n’est pas une erreur.
    if (response.status === 204) return { ok: true, offers: [] };

    if (!response.ok) {
      return { ok: false, error: `Recherche France Travail : ${response.status} pour ${romeCodes.join(',')}` };
    }

    const payload = (await response.json()) as { resultats?: unknown };
    const list = Array.isArray(payload.resultats) ? (payload.resultats as FtOffer[]) : [];
    return { ok: true, offers: list };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Recherche France Travail impossible : ${message}` };
  }
}

/**
 * Ce que France Travail dit de l'expérience attendue.
 *
 * Les deux champs sont lus, et le libellé prime sur le code : « 2 ans » est
 * une information plus précise que « expérience exigée ». Un code inconnu ne
 * fait rien conclure — il laisse `acceptsBeginner` à `null`, c'est-à-dire
 * « la source ne dit rien », et c'est la règle d'écart par défaut qui
 * tranchera.
 */
export function readFtExperience(raw: FtOffer): ExperienceSignal {
  const label = typeof raw.experienceLibelle === 'string' ? raw.experienceLibelle.trim() : '';
  const code = (raw.experienceExige ?? '').trim().toUpperCase();

  const acceptsBeginner = code === 'D' ? true : code === 'E' ? false : null;

  return {
    label: label || null,
    minYears: null,
    acceptsBeginner,
  };
}

export function normalizeFtOffer(raw: FtOffer, collectedAt: string): Offer | null {
  const title = typeof raw.intitule === 'string' ? raw.intitule.trim() : '';
  const partnerJobId = typeof raw.id === 'string' ? raw.id.trim() : '';
  const applyUrl = typeof raw.origineOffre?.urlOrigine === 'string' ? raw.origineOffre.urlOrigine : '';

  if (!title || !partnerJobId) return null;
  // Voir `apply-url.ts` : c'est une cible de redirection, pas un simple champ.
  if (!isSafeApplyUrl(applyUrl, brand.url)) return null;

  const romeCodes = typeof raw.romeCode === 'string' ? [raw.romeCode] : [];
  const { families } = matchFamilies({ title, romeCodes });
  if (families.length === 0) return null;

  const kinds = mapFtContract(raw);
  if (kinds.length === 0) return null;

  const experience = readFtExperience(raw);

  /*
   * France Travail diffuse TOUT le marché, pas seulement les débuts de
   * carrière. Un stage ou une alternance porte son niveau dans son type de
   * contrat ; un CDI ou un CDD n'en dit rien — « Directeur financier » est un
   * CDI comme un autre.
   *
   * Une offre dont tous les contrats sont muets sur le niveau doit donc
   * passer l'épreuve de `assessSeniority`, qui écarte par défaut quand rien
   * ne permet de trancher. Sans cela, le site se remplirait de postes de
   * direction sous une étiquette « poste junior ».
   */
  const levelIsImplied = kinds.some((k) => k === 'stage' || k === 'apprentissage' || k === 'professionnalisation');
  if (!levelIsImplied) {
    const verdict = assessSeniority({ title, experience });
    if (!verdict.junior) return null;
  }

  const id = `france-travail::${partnerJobId}`;
  const place = parseAddress(
    [raw.lieuTravail?.libelle, raw.lieuTravail?.codePostal].filter(Boolean).join(' ') || null,
  );

  return {
    id,
    slug: offerSlug({ id, title, city: place.city }),
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    applyUrl,
    source: { id: 'france-travail', label: 'France Travail', partnerLabel: 'france-travail', partnerJobId },
    employer: {
      name: raw.entreprise?.nom ?? null,
      brand: null,
      siret: null,
      website: null,
      size: null,
    },
    place: {
      address: raw.lieuTravail?.libelle ?? '',
      city: place.city,
      citySlug: place.citySlug,
      postalCode: place.postalCode ?? raw.lieuTravail?.codePostal ?? null,
      departement: place.departement,
      lat: typeof raw.lieuTravail?.latitude === 'number' ? raw.lieuTravail.latitude : null,
      lon: typeof raw.lieuTravail?.longitude === 'number' ? raw.lieuTravail.longitude : null,
    },
    contract: {
      kinds,
      start: null,
      startIsFlexible: false,
      durationMonths: null,
      remote: null,
    },
    families,
    romeCodes,
    targetDiploma: null,
    experience,
    publishedAt: toIso(raw.dateCreation),
    // France Travail ne publie pas de date d’expiration : une offre disparue de
    // la source est une offre retirée. La collecte s’en charge par différence.
    expiresAt: null,
    collectedAt,
  };
}

function mapFtContract(raw: FtOffer): ContractKind[] {
  const kinds: ContractKind[] = [];
  const type = (raw.typeContrat ?? '').toUpperCase();
  const nature = (raw.natureContrat ?? '').toLowerCase();

  if (raw.alternance === true || nature.includes('apprentissage')) kinds.push('apprentissage');
  if (nature.includes('professionnalisation')) kinds.push('professionnalisation');
  // Codes de type de contrat France Travail : MIS/CDD/CDI/SAI… « STG » est le
  // code du stage. À reconfirmer sur la documentation fournie avec l’accès.
  if (type === 'STG' || nature.includes('stage')) kinds.push('stage');
  if (type === 'CDI') kinds.push('cdi');
  if (type === 'CDD') kinds.push('cdd');

  return [...new Set(kinds)];
}

function toIso(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function chunked<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
