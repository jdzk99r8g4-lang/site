/**
 * Limitation des envois d'e-mail déclenchables par un visiteur.
 *
 * ---------------------------------------------------------------------------
 * Le trou que ce fichier bouche
 * ---------------------------------------------------------------------------
 * Trois formulaires publics font partir un e-mail vers une adresse que
 * l'appelant choisit : l'inscription à un compte, la création d'alerte, et la
 * demande de réinitialisation. Sans limite, n'importe qui peut s'en servir
 * pour inonder la boîte d'un tiers — il suffit de renvoyer le formulaire en
 * boucle — et, accessoirement, pour faire classer notre domaine comme source
 * de spam, ce qui condamne ensuite TOUTES les alertes du site.
 *
 * Deux limites, parce qu'elles répondent à deux attaques différentes :
 *
 *  - PAR ADRESSE : empêche de harceler une personne précise. C'est la
 *    protection de la victime.
 *  - GLOBALE : empêche d'épuiser le quota d'envoi et de griller la réputation
 *    du domaine en arrosant mille adresses différentes une fois chacune. La
 *    limite par adresse n'y peut rien ; celle-ci, si. C'est la protection du
 *    service.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi un refus doit être indiscernable d'un succès
 * ---------------------------------------------------------------------------
 * Si la page répondait « trop de demandes pour cette adresse », le formulaire
 * deviendrait exactement ce que tout le reste du code s'applique à éviter :
 * un moyen de savoir qui possède un compte ici, ou qui est pris pour cible.
 * Les appelants rendent donc le message habituel, sans rien envoyer.
 *
 * SERVEUR UNIQUEMENT.
 */

import { getStore } from './store';
import { subscriptionId } from './tokens';

export type SendKind = 'inscription' | 'alerte' | 'reinitialisation';

/**
 * Trois envois par heure vers une même adresse.
 *
 * Large pour un usage normal — on ne s'inscrit pas trois fois dans l'heure —
 * et assez serré pour qu'une boîte ne reçoive pas des centaines de messages.
 */
const PER_ADDRESS_LIMIT = 3;
const PER_ADDRESS_WINDOW_SECONDS = 60 * 60;

/**
 * Plafond global d'envois déclenchés par des visiteurs, par heure.
 *
 * Volontairement bas au démarrage : un site qui vient d'ouvrir n'a aucune
 * raison d'envoyer deux cents confirmations en une heure, et si cela arrive,
 * c'est presque sûrement une attaque. À relever quand le trafic réel le
 * justifiera — la valeur se règle sans toucher au code.
 */
const GLOBAL_LIMIT = Number.parseInt(process.env.EMAIL_HOURLY_CAP ?? '', 10) || 200;
const GLOBAL_WINDOW_SECONDS = 60 * 60;

export interface SendAllowance {
  allowed: boolean;
  /** Pour les journaux : savoir laquelle des deux limites a mordu. */
  reason: 'ok' | 'adresse' | 'global';
}

/**
 * Autorise ou refuse un envoi, et compte la tentative.
 *
 * Les deux compteurs sont incrémentés dans tous les cas : une tentative
 * refusée reste une tentative, et sans cela un attaquant obtiendrait un essai
 * gratuit à chaque fois qu'il dépasse la limite.
 */
export async function allowSend(kind: SendKind, email: string): Promise<SendAllowance> {
  const store = getStore();

  // L'adresse ne sert jamais telle quelle comme clé : `subscriptionId` en
  // prend l'empreinte, ce qui évite d'écrire des adresses dans le magasin de
  // compteurs, et traite au passage les graphies Gmail comme une seule boîte.
  const addressKey = `envoi:${kind}:${subscriptionId(email)}`;
  const globalKey = `envoi:${kind}:global`;

  let perAddress: number;
  let global: number;
  try {
    perAddress = await store.touchRateLimit(addressKey, PER_ADDRESS_WINDOW_SECONDS);
    global = await store.touchRateLimit(globalKey, GLOBAL_WINDOW_SECONDS);
  } catch (error) {
    /*
     * Magasin indisponible : on laisse passer.
     *
     * Choix assumé. Bloquer rendrait l'inscription impossible dès la moindre
     * panne de Redis, pour se protéger d'un abus qui n'a peut-être pas lieu.
     * Un compteur est une protection, pas une condition du service.
     */
    console.warn('[envois] limite non vérifiable, envoi autorisé :', error);
    return { allowed: true, reason: 'ok' };
  }

  if (perAddress > PER_ADDRESS_LIMIT) {
    console.warn(`[envois] ${kind} : limite par adresse atteinte, envoi supprimé.`);
    return { allowed: false, reason: 'adresse' };
  }

  if (global > GLOBAL_LIMIT) {
    console.error(
      `[envois] ${kind} : PLAFOND HORAIRE GLOBAL ATTEINT (${GLOBAL_LIMIT}). ` +
        'Envois suspendus jusqu’à la fin de la fenêtre. Si ce n’est pas une attaque, ' +
        'relevez EMAIL_HOURLY_CAP.',
    );
    return { allowed: false, reason: 'global' };
  }

  return { allowed: true, reason: 'ok' };
}

/** Exporté pour les tests et pour la documentation des limites. */
export const SEND_LIMITS = {
  perAddress: PER_ADDRESS_LIMIT,
  perAddressWindowSeconds: PER_ADDRESS_WINDOW_SECONDS,
  global: GLOBAL_LIMIT,
  globalWindowSeconds: GLOBAL_WINDOW_SECONDS,
} as const;
