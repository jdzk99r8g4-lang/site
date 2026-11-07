/**
 * Source : La bonne alternance (Mission Apprentissage).
 *
 * ---------------------------------------------------------------------------
 * Ce qui a été vérifié sur l’API, et pourquoi le code est fait ainsi
 * ---------------------------------------------------------------------------
 * Documentation : https://api.apprentissage.beta.gouv.fr/fr/explorer
 * Base          : https://api.apprentissage.beta.gouv.fr/api
 * En-tête       : `Authorization: Bearer <clé>`
 * Clé           : https://api.apprentissage.beta.gouv.fr/compte/profil
 *                 La lecture d’offres ne demande AUCUNE habilitation ; une clé
 *                 de production suffit. Une clé « sandbox » renverrait les
 *                 données de recette, ce qui n’est pas ce qu’on veut afficher.
 *
 * On utilise `GET /job/v1/export` et non `GET /job/v1/search`. La raison est
 * dans la documentation de `search` elle-même : ses résultats sont plafonnés à
 * 150 par source, soit 450 au total, et « il n’est pas possible de récupérer
 * toutes les offres correspondant aux critères ». Un catalogue construit sur
 * `search` serait donc arbitrairement tronqué. `export` liste l’intégralité
 * des opportunités et se rafraîchit une fois par jour à 3h00 heure de Paris —
 * d’où l’heure de la tâche planifiée.
 *
 * Quotas : `export` est limité à 2 appels par minute. La réponse porte
 * `x-ratelimit-remaining` et, en cas de 429, `retry-after` ; on respecte cet
 * en-tête plutôt que d’inventer un délai.
 *
 * Rediffusion : la documentation de l’API autorise explicitement à exposer ces
 * offres « for free and under a white-label format ». C’est la base légale de
 * JuniorDesk, et la raison pour laquelle le site doit rester gratuit.
 */

import type { ContractKind, Offer } from '../offer';
import type { FetchOutcome, JobSource } from './types';
import { matchFamilies } from '../taxonomy';
import { parseAddress } from '../geo';
import { offerSlug, shortCode } from '../slug';

const BASE_URL = 'https://api.apprentissage.beta.gouv.fr/api';
const EXPORT_PATH = '/job/v1/export';

/** Dépassé, la collecte renonce plutôt que de bloquer la tâche planifiée. */
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;

/**
 * Forme partielle d’une offre telle que l’API la renvoie.
 *
 * Volontairement permissive : on ne déclare que ce qu’on lit, et tout est
 * optionnel. Une API tierce qui ajoute, renomme ou vide un champ ne doit pas
 * faire tomber la collecte entière — elle doit faire perdre une offre, au pire.
 */
interface LbaOffer {
  identifier?: { partner_job_id?: string | null; id?: string | null; partner_label?: string | null } | null;
  workplace?: {
    name?: string | null;
    brand?: string | null;
    legal_name?: string | null;
    description?: string | null;
    website?: string | null;
    siret?: string | null;
    size?: string | null;
    location?: { address?: string | null; geopoint?: { coordinates?: number[] | null } | null } | null;
  } | null;
  apply?: { url?: string | null } | null;
  contract?: {
    start?: string | null;
    duration?: number | null;
    type?: string[] | null;
    remote?: string | null;
    start_type?: string | null;
    start_is_flexible?: boolean | null;
  } | null;
  offer?: {
    title?: string | null;
    description?: string | null;
    rome_codes?: string[] | null;
    status?: string | null;
    target_diploma?: { label?: string | null } | null;
    publication?: { creation?: string | null; expiration?: string | null } | null;
  } | null;
}

export interface LbaSourceOptions {
  apiKey: string;
  /** Surchargeable pour les tests. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createLbaSource(options: LbaSourceOptions): JobSource {
  const baseUrl = options.baseUrl ?? BASE_URL;
  const doFetch = options.fetchImpl ?? fetch;

  return {
    id: 'lba',
    label: 'La bonne alternance',
    // L’énumération `contract.type` de l’API n’admet que ces deux valeurs :
    // cette source ne produira jamais de stage ni de CDI, quoi qu’on espère.
    contractKinds: ['apprentissage', 'professionnalisation'],

    async fetchAll(): Promise<FetchOutcome> {
      const warnings: string[] = [];
      let lastError = 'aucune tentative';

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const outcome = await attemptFetch(doFetch, baseUrl, options.apiKey);

        if (outcome.kind === 'ok') {
          const { offers, skipped } = normalizeAll(outcome.payload);
          if (skipped > 0) {
            warnings.push(`${skipped} offre(s) ignorée(s) : champ obligatoire manquant côté source.`);
          }
          return { ok: true, offers, warnings };
        }

        lastError = outcome.error;

        if (!outcome.retryable || attempt === MAX_ATTEMPTS) {
          return { ok: false, error: lastError, retryable: outcome.retryable };
        }

        // On respecte `retry-after` quand l’API le fournit ; sinon, recul
        // exponentiel. Inventer un délai plus court ne ferait que reprendre
        // un 429.
        const waitMs = outcome.retryAfterSeconds
          ? outcome.retryAfterSeconds * 1000
          : 2000 * 2 ** (attempt - 1);
        await sleep(waitMs);
      }

      return { ok: false, error: lastError, retryable: true };
    },
  };
}

type Attempt =
  | { kind: 'ok'; payload: unknown }
  | { kind: 'error'; error: string; retryable: boolean; retryAfterSeconds?: number };

async function attemptFetch(
  doFetch: typeof fetch,
  baseUrl: string,
  apiKey: string,
): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await doFetch(`${baseUrl}${EXPORT_PATH}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      return {
        kind: 'error',
        // Pas de nouvelle tentative : réessayer avec une clé invalide ne
        // changera rien, et brûlerait le quota.
        retryable: false,
        error:
          'La bonne alternance a refusé la clé API (401). Vérifiez LBA_API_KEY sur ' +
          'https://api.apprentissage.beta.gouv.fr/compte/profil',
      };
    }

    if (response.status === 429) {
      const retryAfter = Number.parseInt(response.headers.get('retry-after') ?? '', 10);
      return {
        kind: 'error',
        retryable: true,
        error: 'Quota La bonne alternance atteint (429).',
        ...(Number.isFinite(retryAfter) && retryAfter > 0 ? { retryAfterSeconds: retryAfter } : {}),
      };
    }

    if (!response.ok) {
      return {
        kind: 'error',
        // 5xx : la panne est chez eux et peut passer. 4xx : la requête est
        // fautive, réessayer à l’identique est inutile.
        retryable: response.status >= 500,
        error: `La bonne alternance a répondu ${response.status}.`,
      };
    }

    return { kind: 'ok', payload: await response.json() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { kind: 'error', retryable: true, error: `Appel à La bonne alternance impossible : ${message}` };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * La réponse peut être un tableau nu ou un objet enveloppant. On accepte les
 * deux : c’est une dépendance externe, pas un contrat qu’on maîtrise.
 */
function extractList(payload: unknown): LbaOffer[] {
  if (Array.isArray(payload)) return payload as LbaOffer[];
  if (payload && typeof payload === 'object') {
    for (const key of ['data', 'jobs', 'offers', 'results']) {
      const value = (payload as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as LbaOffer[];
    }
  }
  return [];
}

export function normalizeAll(payload: unknown): { offers: Offer[]; skipped: number } {
  const collectedAt = new Date().toISOString();
  const offers: Offer[] = [];
  let skipped = 0;

  for (const raw of extractList(payload)) {
    const offer = normalizeOne(raw, collectedAt);
    if (offer) offers.push(offer);
    else skipped += 1;
  }

  return { offers, skipped };
}

/**
 * Transforme une offre de l’API en `Offer`, ou renvoie `null` si elle n’est
 * pas exploitable ou hors périmètre.
 *
 * Les rejets ne sont pas tous des erreurs : une offre pourvue, expirée ou
 * étrangère à la finance est rejetée pour de bonnes raisons.
 */
export function normalizeOne(raw: LbaOffer, collectedAt: string): Offer | null {
  const title = clean(raw.offer?.title);
  const applyUrl = clean(raw.apply?.url);
  const partnerJobId = clean(raw.identifier?.partner_job_id) ?? clean(raw.identifier?.id);
  const partnerLabel = clean(raw.identifier?.partner_label) ?? 'inconnu';

  // Sans intitulé, sans lien de candidature ou sans identifiant, l’offre est
  // inutilisable : on ne peut ni l’afficher, ni y envoyer quelqu’un, ni la
  // reconnaître à la prochaine collecte.
  if (!title || !applyUrl || !partnerJobId) return null;
  if (!isHttpUrl(applyUrl)) return null;

  // Une offre pourvue ou annulée ne doit pas rester affichée.
  const status = clean(raw.offer?.status);
  if (status && status !== 'Active') return null;

  const romeCodes = (raw.offer?.rome_codes ?? []).filter((c): c is string => typeof c === 'string');
  const { families } = matchFamilies({ title, romeCodes });
  if (families.length === 0) return null;

  const id = `lba:${partnerLabel}:${partnerJobId}`;
  const place = parseAddress(raw.workplace?.location?.address);
  const coordinates = raw.workplace?.location?.geopoint?.coordinates;

  return {
    id,
    slug: offerSlug({ id, title, city: place.city }),
    title,
    description: clean(raw.offer?.description) ?? '',
    applyUrl,

    source: {
      id: 'lba',
      label: 'La bonne alternance',
      partnerLabel,
      partnerJobId,
    },

    employer: {
      name: clean(raw.workplace?.name) ?? clean(raw.workplace?.legal_name) ?? null,
      brand: clean(raw.workplace?.brand),
      siret: clean(raw.workplace?.siret),
      website: clean(raw.workplace?.website),
      size: clean(raw.workplace?.size),
    },

    place: {
      address: clean(raw.workplace?.location?.address) ?? '',
      city: place.city,
      citySlug: place.citySlug,
      postalCode: place.postalCode,
      departement: place.departement,
      // GeoJSON : [longitude, latitude], dans cet ordre.
      lon: typeof coordinates?.[0] === 'number' ? coordinates[0] : null,
      lat: typeof coordinates?.[1] === 'number' ? coordinates[1] : null,
    },

    contract: {
      kinds: mapContractKinds(raw.contract?.type),
      start: toIsoDate(raw.contract?.start),
      startIsFlexible:
        raw.contract?.start_is_flexible === true || raw.contract?.start_type === 'des_que_possible',
      durationMonths: typeof raw.contract?.duration === 'number' ? raw.contract.duration : null,
      remote: mapRemote(raw.contract?.remote),
    },

    families,
    romeCodes,
    targetDiploma: clean(raw.offer?.target_diploma?.label),

    publishedAt: toIsoDateTime(raw.offer?.publication?.creation),
    expiresAt: toIsoDateTime(raw.offer?.publication?.expiration),
    collectedAt,
  };
}

/**
 * `contract.type` n’admet que « Apprentissage » et « Professionnalisation »
 * côté API. On retombe sur l’apprentissage si le champ est vide, parce que
 * c’est l’écrasante majorité du gisement — et le libellé affiché reste
 * « Alternance » au niveau du site, donc une erreur ici ne trompe personne sur
 * la nature du contrat.
 */
function mapContractKinds(types: string[] | null | undefined): ContractKind[] {
  const kinds = new Set<ContractKind>();
  for (const type of types ?? []) {
    const folded = type.toLowerCase();
    if (folded.includes('apprentissage')) kinds.add('apprentissage');
    if (folded.includes('professionnalisation')) kinds.add('professionnalisation');
  }
  if (kinds.size === 0) kinds.add('apprentissage');
  return [...kinds];
}

function mapRemote(remote: string | null | undefined): 'onsite' | 'remote' | 'hybrid' | null {
  if (remote === 'onsite' || remote === 'remote' || remote === 'hybrid') return remote;
  return null;
}

function clean(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Garde la date seule (AAAA-MM-JJ) : l’heure de début d’un contrat n’a pas de sens. */
function toIsoDate(value: string | null | undefined): string | null {
  const iso = toIsoDateTime(value);
  return iso ? (iso.slice(0, 10) ?? null) : null;
}

function toIsoDateTime(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

/** Exporté pour les tests de slug stable. */
export const __test = { shortCode };
