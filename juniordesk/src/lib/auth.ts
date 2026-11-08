/**
 * Comptes étudiants : inscription, connexion, session.
 *
 * SERVEUR UNIQUEMENT. Ce module manipule des mots de passe et des jetons de
 * session ; la garde ci-dessous rend son chargement côté navigateur
 * impossible, et `tests/leakage.test.ts` interdit qu'un composant client
 * l'importe.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/auth.ts a été chargé dans un navigateur. Ce module manipule des ' +
      'mots de passe et des sessions : il doit rester côté serveur.',
  );
}

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { brand } from './brand';
import { getStore } from './store';
import { SESSION_TTL_SECONDS, type Account } from './store/types';
import { createToken, readToken, subscriptionId } from './tokens';
import { sendMail } from './email/send';
import { accountVerificationMail, accountExistsMail } from './email/templates';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'jd_session';

/**
 * Longueur minimale du mot de passe.
 *
 * Dix caractères, sans exigence de majuscule ni de caractère spécial. Les
 * règles de composition poussent surtout à produire « Motdepasse1! », que les
 * outils d'attaque connaissent par cœur ; la longueur, elle, aide réellement.
 */
export const MIN_PASSWORD_LENGTH = 10;

/** Au-delà, on refuse : hacher un mot de passe d'un mégaoctet est un déni de service gratuit. */
const MAX_PASSWORD_LENGTH = 200;

/* --------------------------------------------------------------------------
 * Hachage
 * ------------------------------------------------------------------------ */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

/**
 * Hache un mot de passe avec scrypt.
 *
 * scrypt plutôt qu'un simple SHA : il est volontairement lent et coûteux en
 * mémoire, ce qui rend une attaque par dictionnaire sur une base volée
 * beaucoup plus chère. Il est fourni par Node, donc sans dépendance à
 * maintenir.
 *
 * Le sel est aléatoire et propre à chaque compte : sans lui, deux personnes
 * ayant le même mot de passe auraient la même empreinte, et une seule table
 * précalculée casserait les deux.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$');
}

/**
 * Vérifie un mot de passe contre son empreinte stockée.
 *
 * La comparaison est faite en temps constant : avec un `===`, le temps de
 * réponse révèle la position du premier octet faux, ce qui suffit à
 * reconstruire l'empreinte octet par octet.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const saltHex = parts[4];
  const hashHex = parts[5];
  if (!saltHex || !hashHex) return false;

  let expected: Buffer;
  let derived: Buffer;
  try {
    expected = Buffer.from(hashHex, 'hex');
    derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  } catch {
    return false;
  }

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/* --------------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------------ */

export function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 6 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  if (local.length === 0 || domain.length < 3) return false;
  if (!domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  return true;
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'Le mot de passe est trop long.';
  }
  // Une poignée de mots de passe qu'on retrouve dans toutes les fuites. La
  // liste n'a pas vocation à être exhaustive : elle écarte le pire.
  const folded = password.toLowerCase().replace(/\s+/g, '');
  const banned = ['motdepasse', 'password', 'azertyuiop', 'qwertyuiop', '1234567890', 'juniordesk'];
  if (banned.some((b) => folded === b || folded.startsWith(b))) {
    return 'Ce mot de passe est trop courant. Choisissez-en un autre.';
  }
  return null;
}

/* --------------------------------------------------------------------------
 * Inscription
 * ------------------------------------------------------------------------ */

export type RegisterResult =
  | { ok: true; simulated: boolean }
  | { ok: false; error: string };

/**
 * Crée un compte, non vérifié, et envoie le lien de confirmation.
 *
 * Le message de retour est le MÊME que l'adresse soit déjà inscrite ou non.
 * Sinon, le formulaire d'inscription devient un outil pour savoir qui possède
 * un compte ici — une information que personne n'a à pouvoir obtenir. Dans le
 * cas d'une adresse déjà connue, c'est un e-mail différent qui part, vers la
 * boîte de son propriétaire légitime.
 */
export async function register(input: {
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const email = input.email.trim().toLowerCase();

  if (!isPlausibleEmail(email)) {
    return { ok: false, error: 'Cette adresse e-mail ne semble pas valide.' };
  }
  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, error: problem };

  const store = getStore();
  const id = accountId(email);
  const existing = await store.getAccount(id);

  if (existing) {
    const mail = accountExistsMail({
      loginUrl: `${brand.url}/connexion`,
    });
    const sent = await sendMail({ to: email, ...mail });
    return sent.ok
      ? { ok: true, simulated: sent.simulated }
      : { ok: false, error: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un moment.' };
  }

  const account: Account = {
    id,
    email,
    passwordHash: await hashPassword(input.password),
    verified: false,
    createdAt: new Date().toISOString(),
    verifiedAt: null,
    lastLoginAt: null,
    savedOfferIds: [],
    applications: [],
  };

  await store.saveAccount(account);

  const token = createToken(id, 'confirm');
  const mail = accountVerificationMail({
    verifyUrl: `${brand.url}/compte/verification?jeton=${encodeURIComponent(token)}`,
  });
  const sent = await sendMail({ to: email, ...mail });

  if (!sent.ok) {
    return { ok: false, error: 'L’e-mail de confirmation n’a pas pu être envoyé.' };
  }

  return { ok: true, simulated: sent.simulated };
}

export async function verifyAccount(token: string): Promise<{ ok: boolean; error?: string }> {
  const read = readToken(token, 'confirm');
  if (!read.ok) {
    return {
      ok: false,
      error:
        read.reason === 'expire'
          ? 'Ce lien a expiré. Réinscrivez-vous pour en recevoir un nouveau.'
          : 'Ce lien n’est pas valide. Vérifiez qu’il a été copié en entier.',
    };
  }

  const store = getStore();
  const account = await store.getAccount(read.subject);
  if (!account) return { ok: false, error: 'Ce compte n’existe plus.' };

  if (!account.verified) {
    account.verified = true;
    account.verifiedAt = new Date().toISOString();
    await store.saveAccount(account);
  }

  return { ok: true };
}

/* --------------------------------------------------------------------------
 * Connexion
 * ------------------------------------------------------------------------ */

/** Au-delà, on refuse, même avec le bon mot de passe, pendant la fenêtre. */
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Connecte une personne et pose le cookie de session.
 *
 * Le message d'erreur est identique que l'adresse soit inconnue, le mot de
 * passe faux ou le compte non vérifié — sauf pour ce dernier cas, où l'on
 * aide la personne, puisqu'elle a déjà prouvé qu'elle possédait l'adresse en
 * s'inscrivant. Dire « cette adresse n'existe pas » transformerait le
 * formulaire en annuaire.
 */
export async function login(input: { email: string; password: string }): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const store = getStore();

  const attempts = await store.touchRateLimit(`login:${accountId(email)}`, LOGIN_WINDOW_SECONDS);
  if (attempts > MAX_LOGIN_ATTEMPTS) {
    return {
      ok: false,
      error: 'Trop de tentatives. Réessayez dans un quart d’heure.',
    };
  }

  const account = await store.getAccount(accountId(email));

  /*
   * Même en l'absence de compte, on exécute un hachage.
   *
   * Sans cela, une réponse instantanée signalerait « adresse inconnue » et une
   * réponse lente « adresse connue, mot de passe faux » : le formulaire
   * deviendrait un moyen de tester quelles adresses sont inscrites.
   */
  const stored = account?.passwordHash ?? (await decoyHash());
  const valid = await verifyPassword(input.password, stored);

  if (!account || !valid) {
    return { ok: false, error: 'Adresse e-mail ou mot de passe incorrect.' };
  }

  if (!account.verified) {
    return {
      ok: false,
      error:
        'Votre adresse n’a pas encore été confirmée. Ouvrez l’e-mail que nous vous avons ' +
        'envoyé à l’inscription et cliquez le lien de confirmation.',
    };
  }

  account.lastLoginAt = new Date().toISOString();
  await store.saveAccount(account);

  const token = await store.createSession(account.id, SESSION_TTL_SECONDS);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return { ok: true };
}

/** Empreinte jetable, pour que l'absence de compte coûte le même temps. */
let cachedDecoy: string | null = null;
async function decoyHash(): Promise<string> {
  cachedDecoy ??= await hashPassword(randomBytes(24).toString('hex'));
  return cachedDecoy;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getStore().deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

/* --------------------------------------------------------------------------
 * Session courante
 * ------------------------------------------------------------------------ */

/** Compte connecté, ou null. À appeler depuis un composant serveur. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const store = getStore();
  const accountIdFromSession = await store.readSession(token);
  if (!accountIdFromSession) return null;

  return store.getAccount(accountIdFromSession);
}

/* --------------------------------------------------------------------------
 * Offres mises de côté et candidatures
 * ------------------------------------------------------------------------ */

/** Garde-fou : une liste sans borne finirait par ne plus tenir en mémoire. */
const MAX_SAVED = 300;

export async function toggleSavedOffer(offerId: string): Promise<{ saved: boolean } | null> {
  const account = await currentAccount();
  if (!account) return null;

  const index = account.savedOfferIds.indexOf(offerId);
  if (index === -1) {
    if (account.savedOfferIds.length >= MAX_SAVED) return { saved: false };
    account.savedOfferIds.unshift(offerId);
  } else {
    account.savedOfferIds.splice(index, 1);
  }

  await getStore().saveAccount(account);
  return { saved: index === -1 };
}

export async function toggleApplication(offerId: string): Promise<{ applied: boolean } | null> {
  const account = await currentAccount();
  if (!account) return null;

  const index = account.applications.findIndex((a) => a.offerId === offerId);
  if (index === -1) {
    if (account.applications.length >= MAX_SAVED) return { applied: false };
    account.applications.unshift({ offerId, markedAt: new Date().toISOString() });
  } else {
    account.applications.splice(index, 1);
  }

  await getStore().saveAccount(account);
  return { applied: index === -1 };
}

/**
 * Supprime définitivement le compte.
 *
 * Toutes les sessions sont révoquées d'abord : sans cela, un navigateur déjà
 * connecté continuerait de présenter un cookie valide pointant vers un compte
 * disparu.
 */
export async function deleteOwnAccount(): Promise<boolean> {
  const account = await currentAccount();
  if (!account) return false;

  const store = getStore();
  await store.deleteSessionsOf(account.id);
  await store.deleteAccount(account.id);
  // L'alerte e-mail éventuelle partage l'identifiant dérivé de l'adresse :
  // supprimer le compte sans elle laisserait la personne recevoir des e-mails
  // d'un service où elle n'a plus de compte.
  await store.deleteSubscription(account.id);

  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return true;
}

/**
 * Identifiant de compte dérivé de l'adresse.
 *
 * Volontairement le même calcul que pour les alertes : une personne inscrite
 * aux alertes puis créant un compte avec la même adresse retrouve ses alertes
 * dans son espace, sans table de correspondance.
 */
export function accountId(email: string): string {
  return subscriptionId(email);
}
