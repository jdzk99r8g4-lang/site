/**
 * Connexion avec Google — client OpenID Connect.
 *
 * SERVEUR UNIQUEMENT : ce module manipule le secret client.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/google.ts a été chargé dans un navigateur. Ce module manipule le ' +
      'secret client Google : il doit rester côté serveur.',
  );
}

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { brand } from './brand';

/*
 * Points d'entrée relevés dans le document de découverte officiel de Google,
 * https://accounts.google.com/.well-known/openid-configuration, et non écrits
 * de mémoire. Ils sont figés ici plutôt que récupérés à chaque démarrage :
 * une dépendance réseau au lancement est un mode de panne de plus, et ces
 * adresses ne bougent pas. Si Google les changeait un jour, l'échange de
 * jetons renverrait une erreur explicite.
 */
const ISSUER = 'https://accounts.google.com';
const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** Les deux cookies ne vivent que le temps de l'aller-retour. */
export const STATE_COOKIE = 'jd_g_state';
export const NONCE_COOKIE = 'jd_g_nonce';
export const OAUTH_COOKIE_TTL_SECONDS = 10 * 60;

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Configuration, ou null si Google n'est pas branché.
 *
 * Renvoyer null plutôt que de lever : le bouton « Continuer avec Google » ne
 * s'affiche simplement pas, et le site fonctionne entièrement sans.
 */
export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  /*
   * L'adresse de retour est construite depuis l'URL publique configurée, et
   * jamais depuis l'en-tête Host de la requête. Même raison que pour les
   * liens de réinitialisation : un en-tête que l'appelant contrôle ne doit
   * pas décider où Google renvoie le code d'autorisation. Elle doit être
   * déclarée à l'identique dans la console Google Cloud.
   */
  return { clientId, clientSecret, redirectUri: `${brand.url}/api/compte/google/retour` };
}

export function isGoogleEnabled(): boolean {
  return googleConfig() !== null;
}

/** Valeur aléatoire pour `state` et `nonce`. */
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Comparaison en temps constant de deux valeurs d'URL.
 *
 * Le `state` revient par l'URL, donc sous le contrôle de qui envoie le
 * visiteur. Le comparer avec `===` laisserait fuir sa valeur par le temps de
 * réponse, ce qui suffirait à contourner la protection qu'il apporte.
 */
export function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function buildAuthorizationUrl(input: {
  config: GoogleConfig;
  state: string;
  nonce: string;
}): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set('client_id', input.config.clientId);
  url.searchParams.set('redirect_uri', input.config.redirectUri);
  url.searchParams.set('response_type', 'code');
  // Le strict nécessaire : l'identité et l'adresse. Pas de `profile`, donc ni
  // nom, ni photo — on n'en a pas l'usage et on ne les stockerait pas.
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  // Sans cela, Google reconnecte en silence le dernier compte utilisé, ce qui
  // est déroutant sur un ordinateur partagé — le cas d'une salle informatique.
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export interface GoogleIdentity {
  /** Identifiant stable du compte Google. Ne change jamais, même si l'adresse change. */
  sub: string;
  email: string;
  emailVerified: boolean;
}

export type ExchangeResult =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; error: string };

/**
 * Échange le code d'autorisation contre l'identité.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi la signature du jeton n'est pas vérifiée ici
 * ---------------------------------------------------------------------------
 * Ce n'est pas un oubli. Le jeton d'identité n'arrive pas par le navigateur :
 * il est récupéré par ce serveur, directement auprès du point d'entrée de
 * Google, sur une connexion TLS vérifiée. OpenID Connect Core (§3.1.3.7)
 * prévoit explicitement ce cas : lorsque le jeton provient d'un échange
 * direct avec le serveur de jetons, la validation du serveur TLS tient lieu
 * de validation de l'émetteur, et le contrôle de signature devient
 * facultatif.
 *
 * Ce qui reste vérifié, parce que cela ne l'est pas par TLS : l'émetteur, le
 * destinataire, la date d'expiration, et le `nonce` qui lie la réponse à la
 * demande partie d'ici.
 *
 * Si un jour le jeton devait transiter par le navigateur, cette simplification
 * tomberait et il faudrait récupérer les clés publiques de Google.
 */
export async function exchangeCode(input: {
  config: GoogleConfig;
  code: string;
  expectedNonce: string;
  fetchImpl?: typeof fetch;
}): Promise<ExchangeResult> {
  const doFetch = input.fetchImpl ?? fetch;

  let payload: { id_token?: unknown; error?: unknown; error_description?: unknown };
  try {
    const response = await doFetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: input.code,
        client_id: input.config.clientId,
        client_secret: input.config.clientSecret,
        redirect_uri: input.config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    payload = (await response.json()) as typeof payload;

    if (!response.ok) {
      const detail = typeof payload.error === 'string' ? payload.error : String(response.status);
      return { ok: false, error: `Google a refusé l’échange du code (${detail}).` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Google injoignable : ${message}` };
  }

  if (typeof payload.id_token !== 'string') {
    return { ok: false, error: 'Réponse de Google inattendue : aucun jeton d’identité.' };
  }

  return readIdToken(payload.id_token, input.config.clientId, input.expectedNonce);
}

interface IdTokenClaims {
  iss?: unknown;
  aud?: unknown;
  exp?: unknown;
  sub?: unknown;
  nonce?: unknown;
  email?: unknown;
  email_verified?: unknown;
}

/** Lit et contrôle les affirmations du jeton. Exporté pour les tests. */
export function readIdToken(
  idToken: string,
  clientId: string,
  expectedNonce: string,
): ExchangeResult {
  const parts = idToken.split('.');
  if (parts.length !== 3) return { ok: false, error: 'Jeton d’identité malformé.' };

  let claims: IdTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(parts[1] as string, 'base64url').toString('utf8')) as IdTokenClaims;
  } catch {
    return { ok: false, error: 'Jeton d’identité illisible.' };
  }

  // L'émetteur. Google accepte les deux graphies historiques.
  if (claims.iss !== ISSUER && claims.iss !== 'accounts.google.com') {
    return { ok: false, error: 'Jeton d’identité émis par un tiers inattendu.' };
  }

  // Le destinataire : sans ce contrôle, un jeton émis pour une AUTRE
  // application Google serait accepté ici, et n'importe quel développeur
  // pourrait se connecter au compte de son choix.
  if (claims.aud !== clientId) {
    return { ok: false, error: 'Jeton d’identité destiné à une autre application.' };
  }

  const exp = typeof claims.exp === 'number' ? claims.exp : 0;
  if (exp * 1000 <= Date.now()) {
    return { ok: false, error: 'Jeton d’identité expiré. Réessayez.' };
  }

  // Le nonce lie la réponse à la demande partie d'ici : il empêche de
  // rejouer un jeton obtenu ailleurs.
  if (typeof claims.nonce !== 'string' || !safeEquals(claims.nonce, expectedNonce)) {
    return { ok: false, error: 'La réponse de Google ne correspond pas à la demande.' };
  }

  if (typeof claims.sub !== 'string' || claims.sub.length === 0) {
    return { ok: false, error: 'Jeton d’identité sans identifiant de compte.' };
  }

  if (typeof claims.email !== 'string' || claims.email.length === 0) {
    return { ok: false, error: 'Google n’a pas transmis d’adresse e-mail.' };
  }

  /*
   * `email_verified` est le point qui autorise le rattachement automatique à
   * un compte existant portant la même adresse. Sans cette garantie, quelqu'un
   * pourrait créer un compte Google avec l'adresse d'un tiers et récupérer
   * ainsi son compte JuniorDesk.
   */
  const emailVerified = claims.email_verified === true || claims.email_verified === 'true';

  return {
    ok: true,
    identity: { sub: claims.sub, email: claims.email, emailVerified },
  };
}
