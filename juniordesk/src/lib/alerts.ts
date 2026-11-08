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
}

/**
 * Envoie le différentiel du jour.
 *
 * `newOffers` ne contient que des offres jamais annoncées : c’est la collecte
 * qui l’établit, via le magasin, et non une comparaison d’instantanés — une
 * offre retirée puis remise en ligne ne doit pas être annoncée deux fois.
 */
export async function sendDigests(newOffers: readonly Offer[]): Promise<DigestReport> {
  const store = getStore();
  const subscriptions = await store.listConfirmedSubscriptions();

  const report: DigestReport = {
    subscriptions: subscriptions.length,
    mailsSent: 0,
    mailsFailed: 0,
    announcedIds: [],
  };

  if (newOffers.length === 0 || subscriptions.length === 0) return report;

  const announced = new Set<string>();

  for (const subscription of subscriptions) {
    const matching = newOffers.filter((offer) => matchesSubscription(offer, subscription));
    if (matching.length === 0) continue;

    // Au-delà d’une quinzaine d’offres, un e-mail n’est plus lu. On garde les
    // plus récentes et le site montre le reste.
    const selected = matching.slice(0, 15);
    const clickToken = createToken(subscription.id, 'click');

    const links = selected.map(
      (offer) =>
        `${brand.url}/go/${encodeURIComponent(offer.id)}` +
        `?src=alerte&a=${encodeURIComponent(clickToken)}`,
    );

    const mail = digestMail({
      offers: selected,
      links,
      unsubscribeUrl: `${brand.url}/alertes/desinscription?jeton=${encodeURIComponent(
        createToken(subscription.id, 'unsubscribe'),
      )}`,
      criteria: describeCriteria(subscription),
    });

    const sent = await sendMail({ to: subscription.email, ...mail });

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
