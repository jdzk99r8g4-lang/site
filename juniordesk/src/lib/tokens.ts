/**
 * Jetons signés pour les liens d’alerte.
 *
 * Il n’y a pas de compte sur JuniorDesk : un lien de confirmation ou de
 * désinscription doit donc porter en lui-même la preuve qu’il a bien été émis
 * par le site. D’où une signature HMAC.
 *
 * Deux conséquences qu’il faut avoir en tête :
 *
 * - l’identifiant d’inscription circule dans l’URL, jamais l’adresse e-mail.
 *   Une URL finit dans les journaux d’un proxy, dans un historique, dans un
 *   référent ; une adresse e-mail n’a rien à y faire ;
 * - la comparaison de signature se fait en temps constant. Comparer deux
 *   chaînes avec `===` laisse fuir, par le temps de réponse, la position du
 *   premier caractère faux — assez pour reconstruire une signature valide.
 *
 * SERVEUR UNIQUEMENT : `ALERTS_SECRET` ne doit jamais atteindre le navigateur.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalizeEmail } from './email-address';

export type TokenPurpose = 'confirm' | 'unsubscribe' | 'click' | 'reset';

/** 30 jours : un lien de confirmation oublié dans une boîte mail doit périmer. */
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret(): string {
  const value = process.env.ALERTS_SECRET?.trim();
  if (value && value.length >= 16) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ALERTS_SECRET est absent ou trop court en production. Sans lui, les liens ' +
        'de confirmation et de désinscription ne peuvent pas être signés.',
    );
  }
  // En développement seulement : une valeur fixe et manifestement non secrète.
  return 'developpement-uniquement-non-secret';
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

function sign(payload: string): string {
  return base64url(createHmac('sha256', secret()).update(payload).digest());
}

export function createToken(
  subject: string,
  purpose: TokenPurpose,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = base64url(JSON.stringify({ s: subject, p: purpose, e: expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export type TokenResult =
  | { ok: true; subject: string; purpose: TokenPurpose }
  | { ok: false; reason: 'malforme' | 'signature' | 'expire' | 'objet' };

export function readToken(token: string, expected: TokenPurpose): TokenResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malforme' };

  const [payload, signature] = parts as [string, string];
  const expectedSignature = sign(payload);

  const given = Buffer.from(signature);
  const wanted = Buffer.from(expectedSignature);
  if (given.length !== wanted.length) return { ok: false, reason: 'signature' };
  if (!timingSafeEqual(given, wanted)) return { ok: false, reason: 'signature' };

  let parsed: { s?: unknown; p?: unknown; e?: unknown };
  try {
    parsed = JSON.parse(fromBase64url(payload).toString('utf8')) as typeof parsed;
  } catch {
    return { ok: false, reason: 'malforme' };
  }

  if (typeof parsed.s !== 'string' || typeof parsed.p !== 'string' || typeof parsed.e !== 'number') {
    return { ok: false, reason: 'malforme' };
  }
  if (parsed.p !== expected) return { ok: false, reason: 'objet' };
  if (parsed.e * 1000 < Date.now()) return { ok: false, reason: 'expire' };

  return { ok: true, subject: parsed.s, purpose: parsed.p as TokenPurpose };
}

/**
 * Identifiant dérivé de l’adresse, partagé par les alertes et les comptes.
 *
 * Déterministe, et calculé sur la forme CANONIQUE de l’adresse : deux
 * saisies qui désignent la même boîte donnent le même identifiant. C’est ce
 * qui empêche `p.nom@gmail.com` et `pnom@gmail.com` — une seule et même boîte
 * chez Gmail — de produire deux comptes.
 */
export function subscriptionId(email: string): string {
  return createHmac('sha256', secret())
    .update(canonicalizeEmail(email))
    .digest('hex')
    .slice(0, 24);
}

/**
 * Empreinte courte et non réversible d'une valeur, avec le secret du site.
 *
 * Sert à rendre un lien de réinitialisation utilisable UNE SEULE FOIS sans
 * rien stocker : on y inscrit l'empreinte du mot de passe actuel. Dès que le
 * mot de passe change, l'empreinte change, et tous les liens émis avant
 * cessent de correspondre — y compris celui qui vient de servir.
 */
export function fingerprint(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex').slice(0, 16);
}
