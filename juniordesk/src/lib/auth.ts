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
import { createToken, fingerprint, readToken, subscriptionId } from './tokens';
import { sendMail } from './email/send';
import { isPlausibleEmail } from './email-address';
import { allowSend } from './send-limit';
import {
  accountVerificationMail,
  accountExistsMail,
  passwordResetMail,
  resetNoAccountMail,
} from './email/templates';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'jd_session';

// Réexporté ici : plusieurs pages et tests l'importent depuis `auth`.
export { isPlausibleEmail } from './email-address';

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
export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  // Compte sans mot de passe (créé via Google) : aucun mot de passe ne peut
  // convenir, et surtout pas la chaîne vide.
  if (!stored) return false;

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

  /*
   * Limite posée avant tout le reste. Sans elle, ce formulaire permet
   * d'inonder la boîte de n'importe qui : il suffit de le renvoyer en
   * boucle avec son adresse. Le refus rend exactement la même chose qu'un
   * succès — dire « trop de demandes » révélerait que l'adresse est visée.
   */
  const allowance = await allowSend('inscription', email);
  if (!allowance.allowed) {
    return { ok: true, simulated: false };
  }

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
    googleId: null,
    verified: false,
    createdAt: new Date().toISOString(),
    verifiedAt: null,
    lastLoginAt: null,
    purgeWarnedAt: null,
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

/* --------------------------------------------------------------------------
 * Réinitialisation du mot de passe
 * ------------------------------------------------------------------------ */

/**
 * Durée de vie d'un lien de réinitialisation : une heure.
 *
 * Bien plus court que les trente jours d'un lien de confirmation, et pour une
 * raison précise : ce lien donne accès au compte. Une boîte mail consultée sur
 * un ordinateur partagé, un e-mail transféré par inadvertance, et un lien qui
 * traîne un mois devient une clé laissée sur la porte.
 */
const RESET_TTL_SECONDS = 60 * 60;

/** Trois demandes par heure et par compte : au-delà, c'est du harcèlement de boîte mail. */
const MAX_RESET_REQUESTS = 3;
const RESET_WINDOW_SECONDS = 60 * 60;

export type ResetRequestResult =
  | { ok: true; simulated: boolean }
  | { ok: false; error: string };

/**
 * Envoie un lien de réinitialisation.
 *
 * Comme pour l'inscription, la réponse est la MÊME que l'adresse corresponde
 * à un compte ou non. Sinon, ce formulaire devient un moyen de savoir qui est
 * inscrit ici. Quand l'adresse est inconnue, un e-mail part quand même vers
 * elle, pour dire qu'aucun compte n'y est associé : c'est utile à quelqu'un
 * qui s'est trompé d'adresse à l'inscription, et cela ne révèle rien à qui
 * n'a pas accès à la boîte.
 */
export async function requestPasswordReset(email: string): Promise<ResetRequestResult> {
  const normalized = email.trim().toLowerCase();
  if (!isPlausibleEmail(normalized)) {
    return { ok: false, error: 'Cette adresse e-mail ne semble pas valide.' };
  }

  const store = getStore();
  const id = accountId(normalized);

  const attempts = await store.touchRateLimit(`reset:${id}`, RESET_WINDOW_SECONDS);
  if (attempts > MAX_RESET_REQUESTS) {
    // Message volontairement identique au cas nominal : révéler qu'une limite
    // a été atteinte révélerait que le compte existe.
    return { ok: true, simulated: false };
  }

  // Plafond global en plus de la limite par compte : celle-ci protège une
  // personne, celui-là protège la réputation du domaine d'envoi.
  const allowance = await allowSend('reinitialisation', normalized);
  if (!allowance.allowed) {
    return { ok: true, simulated: false };
  }

  const account = await store.getAccount(id);

  if (!account) {
    const mail = resetNoAccountMail({ signUpUrl: `${brand.url}/inscription` });
    const sent = await sendMail({ to: normalized, ...mail });
    return sent.ok ? { ok: true, simulated: sent.simulated } : { ok: true, simulated: false };
  }

  // L'empreinte du mot de passe actuel est inscrite dans le jeton : elle rend
  // le lien inutilisable dès que le mot de passe a changé, donc une seule fois.
  const subject = `${account.id}:${resetMark(account)}`;
  const token = createToken(subject, 'reset', RESET_TTL_SECONDS);

  const mail = passwordResetMail({
    resetUrl: `${brand.url}/mot-de-passe/reinitialisation?jeton=${encodeURIComponent(token)}`,
  });
  const sent = await sendMail({ to: normalized, ...mail });

  return sent.ok ? { ok: true, simulated: sent.simulated } : { ok: true, simulated: false };
}

/**
 * `reason` distingue « le lien n'est plus bon » de « le mot de passe est
 * refusé », parce que les deux appellent des suites différentes : demander un
 * nouveau lien, ou simplement ressaisir. On ne devine pas le cas en cherchant
 * des mots dans le message — le texte « ce lien a déjà servi, ou le mot de
 * passe a changé » contient « mot de passe », et un filtrage par sous-chaîne
 * renvoyait les gens au mauvais endroit.
 */
/**
 * Empreinte du mot de passe courant, inscrite dans le lien de
 * réinitialisation pour le rendre utilisable une seule fois.
 *
 * Un compte sans mot de passe — créé via Google — a besoin d'une valeur
 * stable malgré tout : on prend son identifiant. Dès qu'un mot de passe est
 * posé, l'empreinte change et le lien cesse de fonctionner, comme pour les
 * autres.
 *
 * Exportée pour que `tests/auth.test.ts` fabrique un lien valide sans passer
 * par la boîte mail. Dupliquer la règle dans le test la ferait diverger en
 * silence le jour où elle change.
 */
export function resetMark(account: Account): string {
  return fingerprint(account.passwordHash ?? `sans-mot-de-passe:${account.id}`);
}

export type ResetFailureReason = 'lien' | 'motdepasse';

export type ResetResult =
  | { ok: true }
  | { ok: false; reason: ResetFailureReason; error: string };

/**
 * Vérifie un jeton de réinitialisation sans rien changer.
 *
 * Permet à la page de n'afficher le formulaire que si le lien est encore bon,
 * plutôt que de faire saisir deux fois un mot de passe pour annoncer ensuite
 * que le lien avait expiré.
 */
export async function checkResetToken(token: string): Promise<ResetResult> {
  const read = readToken(token, 'reset');
  if (!read.ok) {
    return {
      ok: false,
      reason: 'lien',
      error:
        read.reason === 'expire'
          ? 'Ce lien a expiré. Les liens de réinitialisation ne durent qu’une heure, par sécurité. Demandez-en un nouveau.'
          : 'Ce lien n’est pas valide. Vérifiez qu’il a été copié en entier.',
    };
  }

  const [id, mark] = read.subject.split(':');
  if (!id || !mark) {
    return { ok: false, reason: 'lien', error: 'Ce lien n’est pas valide.' };
  }

  const account = await getStore().getAccount(id);
  if (!account) {
    return { ok: false, reason: 'lien', error: 'Ce compte n’existe plus.' };
  }

  if (resetMark(account) !== mark) {
    return {
      ok: false,
      reason: 'lien',
      error:
        'Ce lien a déjà servi, ou le mot de passe a changé depuis son envoi. ' +
        'Demandez-en un nouveau.',
    };
  }

  return { ok: true };
}

/**
 * Change le mot de passe à partir d'un lien valide.
 *
 * Trois effets au-delà du changement lui-même :
 *
 *  - toutes les sessions sont révoquées. Si quelqu'un d'autre était connecté
 *    au compte, c'est précisément le moment où il doit être éjecté ;
 *  - le compte est marqué vérifié. Avoir cliqué un lien reçu à cette adresse
 *    prouve qu'on y a accès, ce qui est exactement ce que la vérification
 *    demandait ;
 *  - le compteur de tentatives de connexion est laissé tel quel, mais le lien
 *    devient inutilisable, son empreinte ne correspondant plus.
 */
export async function resetPassword(token: string, newPassword: string): Promise<ResetResult> {
  const valid = await checkResetToken(token);
  if (!valid.ok) return valid;

  const problem = passwordProblem(newPassword);
  if (problem) return { ok: false, reason: 'motdepasse', error: problem };

  const read = readToken(token, 'reset');
  if (!read.ok) return { ok: false, reason: 'lien', error: 'Ce lien n’est pas valide.' };

  const [id] = read.subject.split(':');
  if (!id) return { ok: false, reason: 'lien', error: 'Ce lien n’est pas valide.' };

  const store = getStore();
  const account = await store.getAccount(id);
  if (!account) return { ok: false, reason: 'lien', error: 'Ce compte n’existe plus.' };

  account.passwordHash = await hashPassword(newPassword);
  if (!account.verified) {
    account.verified = true;
    account.verifiedAt = new Date().toISOString();
  }
  await store.saveAccount(account);
  await store.deleteSessionsOf(account.id);

  return { ok: true };
}

/* --------------------------------------------------------------------------
 * Connexion avec Google
 * ------------------------------------------------------------------------ */

export type GoogleSignInResult =
  | { ok: true; created: boolean; linked: boolean }
  | { ok: false; error: string };

/**
 * Connecte, rattache ou crée un compte à partir d'une identité Google.
 *
 * ---------------------------------------------------------------------------
 * Le rattachement, et la raison pour laquelle il est conditionné
 * ---------------------------------------------------------------------------
 * Quelqu'un s'inscrit avec un mot de passe, puis revient des mois plus tard
 * en cliquant « Continuer avec Google » avec la même adresse. Sans
 * rattachement, il obtient un second compte, vide, et ne comprend pas où sont
 * passées ses offres enregistrées. C'est le piège classique de l'ajout d'une
 * connexion sociale.
 *
 * Mais rattacher sur la seule foi d'une adresse serait une faille béante :
 * il suffirait de créer un compte Google portant l'adresse d'un tiers pour
 * s'emparer de son compte JuniorDesk. D'où la condition : Google doit
 * affirmer que l'adresse est vérifiée. Sans cela, on refuse, et on le dit.
 */
export async function signInWithGoogle(identity: {
  sub: string;
  email: string;
  emailVerified: boolean;
}): Promise<GoogleSignInResult> {
  const email = identity.email.trim().toLowerCase();

  if (!isPlausibleEmail(email)) {
    return { ok: false, error: 'Google a transmis une adresse inexploitable.' };
  }

  if (!identity.emailVerified) {
    return {
      ok: false,
      error:
        'Google n’a pas confirmé que cette adresse vous appartient. Créez un compte avec un ' +
        'mot de passe : nous vous enverrons un lien de confirmation.',
    };
  }

  const store = getStore();
  const id = accountId(email);
  const existing = await store.getAccount(id);
  const now = new Date().toISOString();

  let account: Account;
  let created = false;
  let linked = false;

  if (existing) {
    account = existing;
    if (!account.googleId) {
      account.googleId = identity.sub;
      linked = true;
    }
    // Une adresse vérifiée par Google vaut la confirmation que nous aurions
    // demandée par e-mail : inutile de la redemander.
    if (!account.verified) {
      account.verified = true;
      account.verifiedAt = now;
    }
  } else {
    created = true;
    account = {
      id,
      email,
      // Pas de mot de passe : ce compte se connecte par Google. La personne
      // peut s'en donner un plus tard via « mot de passe oublié ».
      passwordHash: null,
      googleId: identity.sub,
      verified: true,
      createdAt: now,
      verifiedAt: now,
      lastLoginAt: null,
    purgeWarnedAt: null,
      savedOfferIds: [],
      applications: [],
    };
  }

  account.lastLoginAt = now;
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

  return { ok: true, created, linked };
}
