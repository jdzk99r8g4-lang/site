/**
 * Alertes e-mail, sans compte utilisateur.
 *
 * Parcours : inscription -> e-mail de confirmation -> confirmation -> envois
 * quotidiens -> désinscription en un clic. Aucun mot de passe, aucune session,
 * aucun espace membre : trois URL signées suffisent.
 *
 * Le double opt-in n’est pas une politesse. Sans lui, n’importe qui peut
 * inscrire l’adresse d’un tiers, et le site se met à envoyer des e-mails non
 * sollicités à une personne qui n’a jamais rien demandé.
 *
 * SERVEUR UNIQUEMENT.
 */

import type { ContractGroup, Offer } from './offer';
import { CONTRACT_GROUPS, CONTRACT_GROUP_LABELS, contractGroups } from './offer';
import { brand } from './brand';
import { getStore } from './store';
import type { AlertSubscription } from './store/types';
import { createToken, readToken, subscriptionId } from './tokens';
import { sendMail } from './email/send';
import { isPlausibleEmail } from './email-address';
import { allowSend } from './send-limit';
import { confirmationMail, digestMail } from './email/templates';
import { allFamilySlugs, familyBySlug } from './taxonomy';

// Réexporté : `tests/alerts.test.ts` et la route d'inscription s'en servent.
export { isPlausibleEmail } from './email-address';

export interface SubscribeInput {
  email: string;
  families?: readonly string[];
  cities?: readonly string[];
  groups?: readonly ContractGroup[];
}

export type SubscribeResult =
  | { ok: true; alreadyConfirmed: boolean; simulated: boolean }
  | { ok: false; error: string };

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  if (!isPlausibleEmail(email)) {
    return { ok: false, error: 'Cette adresse e-mail ne semble pas valide.' };
  }

  /*
   * Même raison qu'à l'inscription : sans limite, ce formulaire sert à
   * inonder la boîte d'un tiers. Le refus est silencieux et rend le message
   * habituel.
   */
  const allowance = await allowSend('alerte', email);
  if (!allowance.allowed) {
    return { ok: true, alreadyConfirmed: false, simulated: false };
  }

  const families = sanitizeFamilies(input.families);
  const groups = sanitizeGroups(input.groups);
  const cities = sanitizeCities(input.cities);

  const store = getStore();
  const id = subscriptionId(email);
  const existing = await store.getSubscription(id);
  const now = new Date().toISOString();

  const subscription: AlertSubscription = {
    id,
    email,
    families,
    cities,
    groups,
    // Une inscription déjà confirmée qui modifie ses critères reste confirmée :
    // lui redemander une confirmation serait du zèle, elle a déjà consenti.
    confirmed: existing?.confirmed ?? false,
    createdAt: existing?.createdAt ?? now,
    confirmedAt: existing?.confirmedAt ?? null,
    lastSentAt: existing?.lastSentAt ?? null,
  };

  await store.saveSubscription(subscription);

  if (subscription.confirmed) {
    return { ok: true, alreadyConfirmed: true, simulated: false };
  }

  const token = createToken(id, 'confirm');
  const mail = confirmationMail({
    confirmUrl: `${brand.url}/alertes/confirmation?jeton=${encodeURIComponent(token)}`,
    criteria: describeCriteria(subscription),
  });

  const sent = await sendMail({ to: email, ...mail });
  if (!sent.ok) {
    return { ok: false, error: `L’e-mail de confirmation n’a pas pu être envoyé : ${sent.error}` };
  }

  return { ok: true, alreadyConfirmed: false, simulated: sent.simulated };
}

export type ConfirmResult =
  | { ok: true; criteria: string }
  | { ok: false; error: string };

export async function confirm(token: string): Promise<ConfirmResult> {
  const read = readToken(token, 'confirm');
  if (!read.ok) {
    return { ok: false, error: reasonToMessage(read.reason) };
  }

  const store = getStore();
  const subscription = await store.getSubscription(read.subject);
  if (!subscription) {
    return { ok: false, error: 'Cette alerte n’existe plus. Vous pouvez vous réinscrire.' };
  }

  if (!subscription.confirmed) {
    subscription.confirmed = true;
    subscription.confirmedAt = new Date().toISOString();
    await store.saveSubscription(subscription);
  }

  return { ok: true, criteria: describeCriteria(subscription) };
}

export async function unsubscribe(token: string): Promise<{ ok: boolean; error?: string }> {
  const read = readToken(token, 'unsubscribe');
  if (!read.ok) {
    return { ok: false, error: reasonToMessage(read.reason) };
  }
  // Suppression et non simple désactivation : la personne demande à ne plus
  // être là, on ne garde pas son adresse « au cas où ».
  await getStore().deleteSubscription(read.subject);
  return { ok: true };
}

/** Une offre correspond-elle aux critères d’une inscription ? */
export function matchesSubscription(offer: Offer, subscription: AlertSubscription): boolean {
  if (subscription.families.length > 0 && !offer.families.some((f) => subscription.families.includes(f))) {
    return false;
  }
  if (
    subscription.groups.length > 0 &&
    !contractGroups(offer).some((g) => subscription.groups.includes(g))
  ) {
    return false;
  }
  if (subscription.cities.length > 0) {
    if (!offer.place.citySlug || !subscription.cities.includes(offer.place.citySlug)) return false;
  }
  return true;
}

export interface DigestReport {
  subscriptions: number;
  mailsSent: number;
  mailsFailed: number;
  /** Identifiants d’offres réellement annoncées, à marquer comme telles. */
  announcedIds: string[];
  /**
   * Abonnés qui restent à servir pour ce différentiel.
   *
   * Tant qu'il n'est pas à zéro, les offres NE DOIVENT PAS être marquées
   * comme annoncées : elles sortiraient du différentiel et les abonnés non
   * encore servis ne les verraient jamais.
   */
  remaining: number;
}

/**
 * Nombre d'abonnés servis par passage.
 *
 * Les envois sont séquentiels — un appel réseau par abonné — dans une
 * fonction serverless dont le temps est borné. Sans plafond, la fonction est
 * tuée au milieu de la boucle quelque part entre quatre et cinq cents
 * abonnés, et c'est le genre de limite qu'on découvre le jour où on la
 * franchit, sans qu'aucune erreur ne l'annonce.
 *
 * Avec un plafond, un passage sert ce qu'il peut, s'arrête proprement et dit
 * ce qu'il reste. Le suivant reprend là où celui-ci s'est arrêté.
 */
const SUBSCRIBERS_PER_RUN = Number.parseInt(process.env.ALERTS_PER_RUN ?? '', 10) || 150;

/**
 * Envoie le différentiel du jour.
 *
 * `newOffers` ne contient que des offres jamais annoncées : c’est le magasin
 * qui l’établit, et non une comparaison d’instantanés — une offre retirée
 * puis remise en ligne ne doit pas être annoncée deux fois.
 *
 * ---------------------------------------------------------------------------
 * Reprendre sans renvoyer deux fois
 * ---------------------------------------------------------------------------
 * `since` est la date de l'instantané en cours. Un abonné dont le
 * `lastSentAt` lui est postérieur a DÉJÀ été servi pour ce différentiel-là :
 * il est sauté. C'est ce qui rend un passage interrompu sans conséquence —
 * le suivant reprend la liste là où elle en était, au lieu de recommencer et
 * d'envoyer une deuxième fois aux premiers de la file.
 *
 * `remaining` dit combien d'abonnés attendent encore. L'appelant ne marque
 * les offres comme annoncées QUE lorsqu'il vaut zéro : les marquer plus tôt
 * les retirerait du différentiel et les abonnés non encore servis ne les
 * verraient jamais.
 */
export async function sendDigests(
  newOffers: readonly Offer[],
  options: { since?: string; limit?: number } = {},
): Promise<DigestReport> {
  const store = getStore();
  const all = await store.listConfirmedSubscriptions();
  const limit = options.limit ?? SUBSCRIBERS_PER_RUN;

  const pending = options.since
    ? all.filter((s) => !s.lastSentAt || s.lastSentAt < (options.since as string))
    : all;

  const subscriptions = pending.slice(0, limit);

  const report: DigestReport = {
    subscriptions: all.length,
    mailsSent: 0,
    mailsFailed: 0,
    announcedIds: [],
    remaining: Math.max(0, pending.length - subscriptions.length),
  };

  if (newOffers.length === 0 || subscriptions.length === 0) {
    report.remaining = 0;
    return report;
  }

  const announced = new Set<string>();

  for (const subscription of subscriptions) {
    const matching = newOffers.filter((offer) => matchesSubscription(offer, subscription));
    if (matching.length === 0) {
      /*
       * Rien à lui envoyer, mais il a bien été EXAMINÉ pour ce différentiel.
       * Sans avancer sa date, il resterait éternellement « en attente » et le
       * passage suivant le réexaminerait en boucle sans jamais atteindre les
       * abonnés qui le suivent dans la liste.
       */
      subscription.lastSentAt = new Date().toISOString();
      await store.saveSubscription(subscription);
      continue;
    }

    // Au-delà d’une quinzaine d’offres, un e-mail n’est plus lu. On garde les
    // plus récentes et le site montre le reste.
    const selected = matching.slice(0, 15);
    const clickToken = createToken(subscription.id, 'click');

    const links = selected.map(
      (offer) =>
        `${brand.url}/go/${encodeURIComponent(offer.id)}` +
        `?src=alerte&a=${encodeURIComponent(clickToken)}`,
    );

    const unsubscribeToken = encodeURIComponent(createToken(subscription.id, 'unsubscribe'));

    const mail = digestMail({
      offers: selected,
      links,
      // Lien lisible, dans le corps du message : il ouvre une page qui
      // confirme ce qui vient d'être fait.
      unsubscribeUrl: `${brand.url}/alertes/desinscription?jeton=${unsubscribeToken}`,
      criteria: describeCriteria(subscription),
    });

    const sent = await sendMail({
      to: subscription.email,
      ...mail,
      /*
       * Adresse pour le bouton « Se désabonner » de la messagerie elle-même,
       * qui appelle en POST sans ouvrir de page — d'où une route distincte de
       * celle du lien ci-dessus. Voir `src/lib/email/send.ts` pour ce que cet
       * en-tête protège.
       */
      unsubscribeUrl: `${brand.url}/api/alertes/desinscription?jeton=${unsubscribeToken}`,
    });

    if (sent.ok) {
      report.mailsSent += 1;
      subscription.lastSentAt = new Date().toISOString();
      await store.saveSubscription(subscription);
      for (const offer of selected) announced.add(offer.id);
    } else {
      report.mailsFailed += 1;
      console.error(`[alertes] envoi impossible : ${sent.error}`);
    }
  }

  report.announcedIds = [...announced];
  return report;
}

/** Résumé lisible des critères, affiché et repris dans les e-mails. */
export function describeCriteria(subscription: {
  families: readonly string[];
  cities: readonly string[];
  groups: readonly ContractGroup[];
}): string {
  const parts: string[] = [];

  if (subscription.families.length > 0) {
    const labels = subscription.families
      .map((slug) => familyBySlug(slug)?.label ?? slug)
      .join(', ');
    parts.push(labels);
  } else {
    parts.push('tous les métiers de la finance');
  }

  if (subscription.cities.length > 0) {
    parts.push(subscription.cities.join(', '));
  } else {
    parts.push('toute la France');
  }

  if (subscription.groups.length > 0) {
    parts.push(subscription.groups.map((g) => CONTRACT_GROUP_LABELS[g]).join(', '));
  } else {
    parts.push('stage, alternance et poste junior');
  }

  return parts.join(' — ');
}

function sanitizeFamilies(families: readonly string[] | undefined): string[] {
  const allowed = new Set(allFamilySlugs());
  return [...new Set((families ?? []).filter((f) => allowed.has(f)))];
}

function sanitizeGroups(groups: readonly ContractGroup[] | undefined): ContractGroup[] {
  return [...new Set((groups ?? []).filter((g) => CONTRACT_GROUPS.includes(g)))];
}

/**
 * Les villes ne sont pas validées contre une liste fermée : elles proviennent
 * des offres, qui changent chaque jour. On se contente donc de normaliser la
 * forme et d’en limiter le nombre, pour qu’un formulaire bricolé ne puisse pas
 * stocker un pavé de texte.
 */
function sanitizeCities(cities: readonly string[] | undefined): string[] {
  return [
    ...new Set(
      (cities ?? [])
        .map((c) => c.trim().toLowerCase())
        .filter((c) => /^[a-z0-9-]{2,60}$/.test(c)),
    ),
  ].slice(0, 20);
}

function reasonToMessage(reason: 'malforme' | 'signature' | 'expire' | 'objet'): string {
  switch (reason) {
    case 'expire':
      return 'Ce lien a expiré. Réinscrivez-vous, cela prend dix secondes.';
    case 'malforme':
    case 'signature':
    case 'objet':
    default:
      return 'Ce lien n’est pas valide. Vérifiez qu’il a été copié en entier.';
  }
}
